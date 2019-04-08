---
title: gulu源码解析
date: 2019-04-06 20:47:24
tags: [nodejs, sourcecode]
---

这两天看了下公司的 node 框架 Gulu 的源码，它将 Koa 进行了包装，并通过约定文件夹组织的方式达到自定义扩展。框架的源码还是比较清晰易懂的，这篇文章主要是将阅读笔记记录下来。框架的入门可以阅读[这篇文档](https://nodejs.bytedance.net/docs/63/78/2650/)，核心设计思想在文档里有详细的描述。

# 入口

在利用 gulu cli 初始化一个项目后，可以用`npm run dev`启动，对应的脚本主要是运行了根目录下的`bootstrap.ts`，所以这个就是项目的入口。

## 构造器

```ts
import path from 'path';
import Gulu from 'byted-gulu';

const app = new Gulu.Application({
  root: path.resolve(__dirname),
});

app.load(path.resolve(__dirname)).listen(process.env.PORT || 3000);
```

跟踪到`byted-gulu`下发现其实只有 4 个核心的文件：

- `gulu.js`
- `loader.js`
- `resolver.js`
- `unit.js`

`Gulu.Application`作为入口构造函数位于`gulu.js`中：

```js
class Gulu extends Koa {
  constructor(options = {}) {
    super(options);
    this.proxy = options.proxy !== false;
    this.root = options.root || process.cwd(); // 项目根目录
    this.logDir = options.logDir || path.resolve(this.root, 'log'); // 日志目录
    this.guluVersion = pkg.version; // 版本
    this.name = options.name || path.basename(this.root); //
    this.units = []; // 存放后序遍历打平的unit tree
    this.middlewares = []; // 已加载的中间件
    this.config = {}; // 项目配置
    this.controller = {}; // controller实例
    this.controllerClasses = {}; // controller Class
    this.serviceClasses = {}; // service Class
    this.routerRegisters = []; // 路由注册函数
    this.router = new Router(); // koa-router实例
    this.loader = new Loader(this); // 加载器，用于加载一个unit
    this.resolver = new Resolver(this); // 解析器，根据path解析出目标的具体定义
    this.coreLogger = createCoreLogger(this); // 核心日志
    this.logger = createAppLogger(this); // 应用级日志
    this.contextLogger = createContextLogger(this); // 每次请求的上下文日志
    this.idGenerator = new IDGenerator();
    this.typeGenerator = new TypeGenerator(this); // 用与生成 .d.ts文件
    this.readyPromise = new Promise((resolve, reject) => {
      // 应用是否加载完成
      this.on('started', resolve);
      this.on('error', reject);
    });
  }
}

Gulu.Application = Gulu;
```

通过继承关系可以看出来一个`Gulu`实例也是`Koa`实例，构造函数只做了一些简单的初始化，内部涉及的其他对象之后会挨个描述。

## app.load

这是`bootstrap.ts`调用的第二个函数。

```ts
/**
* 加载功能单元
* @param {String} root - 功能单元根目录
*/
load(root) {
  // 跳过已加载过的unit
  if (this.units.some(unit => unit.root === root)) {
      return this;
  }

  const tree = this.resolver.resolveUnit(root);
  const nodes = this.traverse(tree);

  for (const node of nodes) {
      if (
          !node.pkg ||
          !this.units.some(
              unit => unit.pkg && unit.pkg.name === node.pkg.name
          )
      ) {
          this.units.push(node);
      }
  }
  return this;
}
```

`resolveUnit`用与从根目录出发寻找所有依赖的`unit`，形成依赖树。

`traverse`采用后序遍历，打平所有`unit`放到一维数组`app.units`中。**注意此时还没有真正将 `unit` 的各种属性挂载到 `app` 上。**

这两个函数会在讲`resolver`时具体分析。

## app.listen

```ts
/**
  * 覆盖Koa的listen方法
  * @param {Array} args
  */
listen(...args) {
  const server = http.createServer(this.callback()); // this.callback是koa的方法

  this.beforeStart()
    .then(() => {
      server.listen(...args);
    })
    .catch(e => {
      this.coreLogger.error(e.stack || e.message);
      process.exit();
    });

  server.on('listening', () => {
    this.afterStart()
      .then(() => {
        this.coreLogger.info(`[core] server started on port ${server.address().port}`);
        this.emit('started');
      })
      .catch(e => {
        this.coreLogger.error(e.stack || e.message);
        process.exit();
      });
  });

  return server;
}
```

主体流程是 `createServer` -> `beforeStart` -> `listen` -> `afterStart`.

`beforeStart`做的事情比较多，主要是
