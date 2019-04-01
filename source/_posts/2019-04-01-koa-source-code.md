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

很简单，就是创建各种对象，然后各种赋值绕的很。`request.req`

## handleRequest
