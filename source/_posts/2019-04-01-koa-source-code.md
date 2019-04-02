---
title: koa源码解析
date: 2019-04-01 21:42:42
summary_img: /images/new-zealand.jpg
tags: [js, node, koa]
---

这两天看了[koa](https://koajs.com/#)的源码，惊叹于它的简练，仅仅聚焦最核心的功能，其他全部以中间件的形式扩展出去，给了开发者最大的个性化定制。这篇文章用于记录源码的学习笔记，方便日后借鉴思想时能快速回忆起来。

# 基础用法

参考官网给的示范：

```js
const Koa = require('koa');
const app = new Koa();

// 定义一个middleware
app.use(async ctx => {
  ctx.body = 'Hello World';
});

// 启动server并监听3000端口
app.listen(3000);
```

跑起来后在浏览器输入`localhost:3000`就能看到返回`Hello World`了。

# 入口

首先从构造函数开始：

```js
class Application extends Emitter {
  constructor() {
    super();

    this.proxy = false;
    this.middleware = []; // 中间件列表
    this.subdomainOffset = 2; // 从hostname解析子域的偏移起点，如 www.test.t1.t2 在偏移为2时的子域为www.test
    this.env = process.env.NODE_ENV || 'development';
    this.context = Object.create(context); // 上下文对象，贯穿所有中间件
    this.request = Object.create(request); // 包装的请求对象
    this.response = Object.create(response); // 包装的响应对象
    if (util.inspect.custom) {
      this[util.inspect.custom] = this.inspect;
    }
  }
}
```

以上就是`new Koa()`会执行的所有逻辑了，仅仅是一些变量的初始化，关于`context`、`request`、`response`这三个对象在后面会说到。

# listen

注意`new Koa`并没有启动`Server`，那么显然只能在`listen`中启动了。

```js
listen(...args) {
  debug('listen');
  const server = http.createServer(this.callback());
  return server.listen(...args);
}
```

看看`http.createServer`的函数签名`http.createServer([options][, requestListener])`就大致能猜到`this.callback()`返回的是`options`或`requestListener`。

```js
// Return a request handler callback for node's native http server.
callback() {
  // koa-compose  组合middleware的运行方式。意味着在listen之后的app.use不会起作用
  const fn = compose(this.middleware);

  // listenerCount和on均是父类Emitter中的成员
  if (!this.listenerCount('error')) this.on('error', this.onerror); // 监听应用级error

  const handleRequest = (req, res) => {
    // 每个请求过来时，都创建一个context
    const ctx = this.createContext(req, res);
    return this.handleRequest(ctx, fn);
  };

  return handleRequest;
}
```

所以我们最终传给`http.createServer`的是

```js
(req, res) => {
  const ctx = this.createContext(req, res);
  return this.handleRequest(ctx, fn);
};
```

也就是 **每次都先创建一个`context`对象**，然后调用`this.handleRequest`。

同时我们遇到了`koa`的最核心的库：`koa-compose`。 它用于精心组合所有`middleware`，并按照期望的顺序调用。我们后面会用专门的章节来描述它。

先看看`createContext`和`handleRequest`的实现。

## createContext

用于创建一个`context`对象。

```js
createContext(req, res) {
  const context = Object.create(this.context);
  const request = (context.request = Object.create(this.request));
  const response = (context.response = Object.create(this.response));
  context.app = request.app = response.app = this;
  // 注意request.req和response.request的差别;
  context.req = request.req = response.req = req;
  context.res = request.res = response.res = res;
  request.ctx = response.ctx = context;
  request.response = response;
  response.request = request;
  context.originalUrl = request.originalUrl = req.url;
  context.state = {};
  return context;
}
```

很简单，就是创建各种对象，然后各种赋值绕的很。注意`request.req`、`response.req`指向的是`http`模块原生的`IncomingMessage`对象，而`request.response`、`response.request`指向的都是`koa`封装后的对象。

## handleRequest

这个函数用于真正的进行业务逻辑处理了。

```js
// fnMiddleware： 经koa-compose包装后的函数
handleRequest(ctx, fnMiddleware) {
  const res = ctx.res;
  res.statusCode = 404;
  const onerror = err => ctx.onerror(err);
  const handleResponse = () => respond(ctx); // 调用res.end返回最终结果
  onFinished(res, onerror);
  return fnMiddleware(ctx) // 调用各个middleware
    .then(handleResponse)
    .catch(onerror);
}
```

`fnMiddleware`是经`koa-compose`包装后的函数，函数签名是`(context, next) => Promise`, 内部会依次调用每个中间件，不管是同步还是异步的中间件。在处理完所有中间件逻辑后，`Promise`会`resolve`或`reject`。

`onFinished`是[一个帮助库](https://github.com/jshttp/on-finished)，用于在请求`close`、`finish`、`error`时执行传入的回调。

`respond`函数用于将中间件处理后的结果通过`res.end`返回客户端：

```js
// Response helper.
function respond(ctx) {
  // allow bypassing koa
  if (false === ctx.respond) return; // ctx.respond = false用于设置自定义的Response策略

  if (!ctx.writable) return;

  const res = ctx.res;
  let body = ctx.body;
  const code = ctx.status;

  // ignore body
  if (statuses.empty[code]) {
    // strip headers
    ctx.body = null;
    return res.end();
  }

  // HEAD请求不返回body
  if ('HEAD' == ctx.method) {
    // headersSent表示是否发送过header
    if (!res.headersSent && isJSON(body)) {
      ctx.length = Buffer.byteLength(JSON.stringify(body));
    }
    return res.end();
  }

  // status body
  if (null == body) {
    if (ctx.req.httpVersionMajor >= 2) {
      body = String(code);
    } else {
      body = ctx.message || String(code);
    }
    if (!res.headersSent) {
      ctx.type = 'text';
      ctx.length = Buffer.byteLength(body);
    }
    return res.end(body);
  }

  // responses
  if (Buffer.isBuffer(body)) return res.end(body);
  if ('string' == typeof body) return res.end(body);
  if (body instanceof Stream) return body.pipe(res); // 流式响应使用pipe，更好的利用缓存

  // body: json
  body = JSON.stringify(body);
  if (!res.headersSent) {
    ctx.length = Buffer.byteLength(body);
  }
  res.end(body);
}
```

# middleware 处理流程

终于到`koa`最核心的逻辑了，可以想象`middleware`是`koa`得以流行的关键所在，各式各样的中间件使得框架异常灵活，非常方便定制。 从整体上看，`middleware`的处理类似于`DOM`事件处理，先从前往后，再从后往前。

上面也说到所有中间件会传给[koa-compose](https://github.com/koajs/compose),并返回一个签名为`(context, next) => Promise`的函数。我们来仔细分析一下：

```js
/**
 * Compose `middleware` returning a fully valid middleware comprised of all those which are passed.
 *
 * @param {Array} middleware
 * @return {Function}
 */
function compose(middleware) {
  // 参数校验
  if (!Array.isArray(middleware)) throw new TypeError('Middleware stack must be an array!');
  for (const fn of middleware) {
    if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions!');
  }

  /**
   * @param {Object} context
   * @return {Promise}
   */
  return function(context, next) {
    // last called middleware #
    let index = -1;
    return dispatch(0);
    function dispatch(i) {
      if (i <= index) return Promise.reject(new Error('next() called multiple times'));
      index = i;
      let fn = middleware[i];
      if (i === middleware.length) fn = next;
      if (!fn) return Promise.resolve();
      try {
        // 执行下一个中间件逻辑，并将next参数设置为dispatch(i+1)
        return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    }
  };
}
```

在`koa`框架中，当我们执行`fnMiddleware(ctx)`时，就会开始执行`dispatch(0)`，然后开始不断递归。这里需要仔细琢磨的是这两句：

```js
if (i === middleware.length) fn = next;
if (!fn) return Promise.resolve();
```

当`i === middleware.length`成立时，实际上所有传入的`middleware`已经执行完，那么`fn = next`意味着什么呢？
其实我们调用`fnMiddleware`可以传入两个参数的，第二个可选参数表示最终的回调函数。例如：

```js
fnMiddleware(ctx, () => {
  console.log('所有中间件全部执行完了,此时', ctx);
});
```

这个时候我们的`fn = next`表示`fn`被赋值给了这个传入的最终回调。接下来判断如果没有传入最终回调，那么整个中间件执行流程就到此结束。

另外，细细体会每个回调的执行顺序，**可以发现`middleware`的处理类似于`DOM`事件处理，先从前往后，再从后往前，并且`middleware`可以是异步函数，**因为`middleware`的执行被包裹在了`Promise.resolve`中。例如：

```js
const Koa = require('koa');
const app = new Koa();

// logger

app.use(async (ctx, next) => {
  await next();
  const rt = ctx.response.get('X-Response-Time');
  console.log(`${ctx.method} ${ctx.url} - ${rt}`);
});

// x-response-time

app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.set('X-Response-Time', `${ms}ms`);
});

// response

app.use(async ctx => {
  ctx.body = 'Hello World';
});

app.listen(3000);
```

请求`localhost:3000`会打印出形如：

```js
GET / - 4ms
```

在当前中间件中调用`next`时，会将控制权交给下一个中间件，当下一个中间件执行完毕时，才会执行当前中间件的`next`之后逻辑。

# context、request、reponse

`request、reponse`都是对原生`res、req`的封装，`context`本质上也是一个普通的对象，他们的代码都不是很难，在这里就不一一赘述了。
