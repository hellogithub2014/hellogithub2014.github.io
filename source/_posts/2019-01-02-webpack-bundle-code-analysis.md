---
title: webpack打包产物代码分析
date: 2019-01-02 11:16:09
tags:
---

前一阵子主要研究了`webpack`的源码实现，这篇文章用于记录`webpack`打包后代码的阅读，更多的是在代码中添加自己的注释理解，使用的`webpack`版本是`4.5.0`。

# 主流程

先看一下最简单的代码在打包后的实现：

打包前代码：

```js
// index.js

import { log } from './util';
log('abc');
```

```js
// util.js

export function log(v) {
  console.log(v);
}
```

`webpack config`:

```js
const path = require('path');

module.exports = {
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[chunkhash].js',
  },
  mode: 'development',
  devtool: 'cheap-source-map',
};
```

打包后代码：

```js
(function(modules) {
  // webpackBootstrap
  // The module cache
  var installedModules = {};

  // The require function
  function __webpack_require__(moduleId) {
    // Check if module is in cache
    if (installedModules[moduleId]) {
      return installedModules[moduleId].exports;
    }
    // Create a new module (and put it into the cache)
    var module = (installedModules[moduleId] = {
      i: moduleId,
      l: false,
      exports: {},
    });

    // Execute the module function
    modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

    // Flag the module as loaded
    module.l = true;

    // Return the exports of the module
    return module.exports;
  }

  // expose the modules object (__webpack_modules__)
  __webpack_require__.m = modules;

  // expose the module cache
  __webpack_require__.c = installedModules;

  // define getter function for harmony exports
  __webpack_require__.d = function(exports, name, getter) {
    if (!__webpack_require__.o(exports, name)) {
      Object.defineProperty(exports, name, { enumerable: true, get: getter });
    }
  };

  // define __esModule on exports
  __webpack_require__.r = function(exports) {
    if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
      Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
    }
    Object.defineProperty(exports, '__esModule', { value: true });
  };

  // create a fake namespace object
  // mode & 1: value is a module id, require it
  // mode & 2: merge all properties of value into the ns
  // mode & 4: return value when already ns object
  // mode & 8|1: behave like require
  __webpack_require__.t = function(value, mode) {
    if (mode & 1) value = __webpack_require__(value);
    if (mode & 8) return value;
    if (mode & 4 && typeof value === 'object' && value && value.__esModule) return value;
    var ns = Object.create(null);
    __webpack_require__.r(ns);
    Object.defineProperty(ns, 'default', { enumerable: true, value: value });
    if (mode & 2 && typeof value != 'string')
      for (var key in value)
        __webpack_require__.d(
          ns,
          key,
          function(key) {
            return value[key];
          }.bind(null, key),
        );
    return ns;
  };

  // getDefaultExport function for compatibility with non-harmony modules
  __webpack_require__.n = function(module) {
    var getter =
      module && module.__esModule
        ? function getDefault() {
            return module['default'];
          }
        : function getModuleExports() {
            return module;
          };
    __webpack_require__.d(getter, 'a', getter);
    return getter;
  };

  // Object.prototype.hasOwnProperty.call
  __webpack_require__.o = function(object, property) {
    return Object.prototype.hasOwnProperty.call(object, property);
  };

  // __webpack_public_path__
  __webpack_require__.p = '';

  // Load entry module and return exports
  return __webpack_require__((__webpack_require__.s = './webpack-sourcecode/index.js'));
})({
  './webpack-sourcecode/index.js':
    /*! no exports provided */
    function(module, __webpack_exports__, __webpack_require__) {
      'use strict';
      __webpack_require__.r(__webpack_exports__);
      /* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./util */ './webpack-sourcecode/util.js');

      Object(_util__WEBPACK_IMPORTED_MODULE_0__['log'])('abc');
    },

  './webpack-sourcecode/util.js':
    /*! exports provided: log */
    function(module, __webpack_exports__, __webpack_require__) {
      'use strict';
      __webpack_require__.r(__webpack_exports__);
      /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, 'log', function() {
        return log;
      });

      function log(v) {
        console.log(v);
      }
    },
});
```

初一看眼花缭乱的，实际上就是一个`IIFE`，简化后的格式其实很简单：

```js
(function(modules) {
  function __webpack_require__(moduleId) {
    // ...
  }

  return __webpack_require__((__webpack_require__.s = './webpack-sourcecode/index.js'));
})({
  './webpack-sourcecode/index.js': function(module, __webpack_exports__, __webpack_require__) {
    // ...
  },

  './webpack-sourcecode/util.js': function(module, __webpack_exports__, __webpack_require__) {
    // ...
  },
});
```

函数的入参`modules`是一个对象，对象的`key`就是每个`js`模块的相对路径，`value`就是一个函数。`IIFE`会先`require`入口模块，然后入口模块会在执行时`require`其他模块例如`util.js`，接下来看看详细的实现。

## `__webpack_require__`

```js
// The module cache
var installedModules = {};

// The require function
function __webpack_require__(moduleId) {
  // Check if module is in cache
  if (installedModules[moduleId]) {
    return installedModules[moduleId].exports;
  }
  // Create a new module (and put it into the cache)
  var module = (installedModules[moduleId] = {
    i: moduleId,
    l: false,
    exports: {},
  });

  // Execute the module function
  modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

  // Flag the module as loaded
  module.l = true;

  // Return the exports of the module
  return module.exports;
}
```

函数的入参是模块的`id`，返回值`module.exports`是一个对象，`modules[moduleId].call`就是在执行模块对应的函数，如果模块有`export`的东西，会放到`module.exports`中。同时有一个缓存对象用于存放已经`require`过的模块。

所以**这个`__webpack_require__`就是来模拟`import`一个模块，并在最后返回所有模块`export`的变量。** 我们再看一个示范应该就能清楚了：

```js
// './webpack-sourcecode/util.js'

function (module, __webpack_exports__, __webpack_require__) {
  // ...
  __webpack_require__.d(__webpack_exports__, 'log', function() {
    return log;
  });

  function log(v) {
    console.log(v);
  }
}
```

`__webpack_require__.d`其实就是`Object.defineProperty`：

```js
// define getter function for harmony exports
__webpack_require__.d = function(exports, name, getter) {
  if (!__webpack_require__.o(exports, name)) {
    Object.defineProperty(exports, name, { enumerable: true, get: getter });
  }
};

// Object.prototype.hasOwnProperty.call
__webpack_require__.o = function(object, property) {
  return Object.prototype.hasOwnProperty.call(object, property);
};
```

所以`util`模块最后往`__webpack_exports__`导出了一个`log`变量实际上就是`log`函数。

## 其他辅助函数

### `__webpack_require__.r`

用于标记一个`ES`模块：

```js
// define __esModule on exports
__webpack_require__.r = function(exports) {
  if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
  }
  Object.defineProperty(exports, '__esModule', { value: true });
};
```

修改了`exports`的`toString`方法，并添加了一个`__esModule`成员。

### `__webpack_require__.t`

暂时不知道干嘛的，不过函数的作用在注释中已经很清楚了。

```js
// create a fake namespace object
// mode & 1: value is a module id, require it
// mode & 2: merge all properties of value into the ns
// mode & 4: return value when already ns object
// mode & 8|1: behave like require
__webpack_require__.t = function(value, mode) {
  if (mode & 1) value = __webpack_require__(value);
  if (mode & 8) return value;
  if (mode & 4 && typeof value === 'object' && value && value.__esModule) return value;
  var ns = Object.create(null);
  __webpack_require__.r(ns);
  Object.defineProperty(ns, 'default', { enumerable: true, value: value });
  if (mode & 2 && typeof value != 'string')
    for (var key in value)
      __webpack_require__.d(
        ns,
        key,
        function(key) {
          return value[key];
        }.bind(null, key),
      );
  return ns;
};
```

### `__webpack_require__.n`

暂时也不知道干嘛的，不过应该是`__webpack_require__.t`配合使用的，因为都用到了同一个`default`变量。

```js
// getDefaultExport function for compatibility with non-harmony modules
__webpack_require__.n = function(module) {
  var getter =
    module && module.__esModule
      ? function getDefault() {
          return module['default'];
        }
      : function getModuleExports() {
          return module;
        };
  __webpack_require__.d(getter, 'a', getter);
  return getter;
};
```

以上就是`webpack`打包产物的主流程代码。

# code splitting 代码分割

涉及到代码分割时，打包产物有一些变化，直观感受是多出来一些`js`文件。代码分割的方式有多种，详见[官网文档](https://webpack.js.org/guides/code-splitting/)，这里我们以古老的`require.ensure`做示范：

```js
// index.js

import { log } from './util';
log('log in entry');

require.ensure(['./runtime.js'], function() {
  console.log('ensured');
});
```

```js
// runtime.js

import { log } from './util';

log('log in runtime');

exports.t = function() {
  console.log('runtime');
};
```

打包的产物与正常流程相比有一些不同之处，注意到此时有两个输出`js`文件了，在我的示范中一个是`main.xxx.js`，这是由入口文件`entry`生成的；另一个是`0.xxx.js`，这个就是我们通过`require.ensure`动态加载的`chunk`。通常我们称`main`的为主`chunk`。

## 主 chunk

我们最关心的是`require.ensure`是如何生效的，因为这个其实是`webpack`独有的语法，`node`中`require`函数上并没有这个属性。另外很容易发现主`chunk`中并没有`runtime.js`的代码，这是很自然的，放在一起就一起加载了。。

打包产物的关键代码：

```js
// "./webpack-sourcecode/index.js"

_webpack_require__
  .e(/*! require.ensure */ 0)
  .then(
    function() {
      console.log('ensured');
    }.bind(null, __webpack_require__),
  )
  .catch(__webpack_require__.oe);
```

很明显`require.ensure`转化为了一个`Promise`，这符合我们的直觉毕竟是异步加载。`__webpack_require__.oe`就是一个很简单的打印错误不贴出来了，我们重点是`_webpack_require__.e`的实现方式。

```js
// 已加载的chunk缓存
var installedChunks = {
  main: 0, // 0 means "already installed".
};

__webpack_require__.e = function requireEnsure(chunkId) {
  var promises = []; // JSONP chunk loading for javascript

  var installedChunkData = installedChunks[chunkId];
  if (installedChunkData !== 0) {
    // 0 means "already installed".

    // a Promise means "currently loading".目标chunk正在加载
    if (installedChunkData) {
      promises.push(installedChunkData[2]);
    } else {
      // setup Promise in chunk cache，利用Promise去异步加载目标chunk
      var promise = new Promise(function(resolve, reject) {
        installedChunkData = installedChunks[chunkId] = [resolve, reject];
      });
      promises.push((installedChunkData[2] = promise)); // start chunk loading

      // 模拟jsonp
      var script = document.createElement('script');
      var onScriptComplete;

      script.charset = 'utf-8';
      script.timeout = 120;
      if (__webpack_require__.nc) {
        script.setAttribute('nonce', __webpack_require__.nc);
      }
      // 获取目标chunk的地址，__webpack_require__.p 表示设置的publicPath，默认为空串
      // __webpack_require__.p + "" + chunkId + "." + {"0":"dc72666a6c96f7eb55e0"}[chunkId] + ".js"
      script.src = jsonpScriptSrc(chunkId);

      onScriptComplete = function(event) {
        // avoid mem leaks in IE.
        script.onerror = script.onload = null;
        clearTimeout(timeout);
        var chunk = installedChunks[chunkId];
        if (chunk !== 0) {
          if (chunk) {
            // 此时chunk为[resolve, reject, promise]表示还没有加载好
            var errorType = event && (event.type === 'load' ? 'missing' : event.type);
            var realSrc = event && event.target && event.target.src;
            var error = new Error('Loading chunk ' + chunkId + ' failed.\n(' + errorType + ': ' + realSrc + ')');
            error.type = errorType;
            error.request = realSrc;
            chunk[1](error); // reject error
          }
          installedChunks[chunkId] = undefined;
        }
      };
      // 模拟请求超时
      var timeout = setTimeout(function() {
        onScriptComplete({ type: 'timeout', target: script });
      }, 120000);
      script.onerror = script.onload = onScriptComplete;
      document.head.appendChild(script);
    }
  }
  return Promise.all(promises);
};
```

上述代码加上注释应该不难懂了，核心就是将`require.ensure`转化为模拟`jsonp`去加载目标`chunk`文件。

下一步看看异步加载`chunk`的代码。

## 异步 chunk

```js
// 0.xxx.js

(window['webpackJsonp'] = window['webpackJsonp'] || []).push([
  [0],
  {
    './webpack-sourcecode/runtime.js': function(module, __webpack_exports__, __webpack_require__) {
      'use strict';
      __webpack_require__.r(__webpack_exports__);
      var _util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__('./webpack-sourcecode/util.js');

      Object(_util__WEBPACK_IMPORTED_MODULE_0__['log'])('log in runtime');

      exports.t = function() {
        console.log('runtime');
      };
    },
  },
]);
```

这个`chunk`中只有一个`module`，其中的代码我们已经熟悉了，整个`chunk`的代码看起来很简单，就是往一个数组`window['webpackJsonp']`中塞入一个元素，这个数组是哪里来的呢，在哪里用到了呢？ 其实它是在主`chunk`中有用到,主`chunk`除了`require`了入口`module`外，还有这么一段：

```js
// main.xxx.js

var jsonpArray = (window['webpackJsonp'] = window['webpackJsonp'] || []);
var oldJsonpFunction = jsonpArray.push.bind(jsonpArray); // 保存原始的Array.prototype.push方法
jsonpArray.push = webpackJsonpCallback; // 将push方法的实现修改为webpackJsonpCallback
jsonpArray = jsonpArray.slice();
// 对已在数组中的元素依次执行webpackJsonpCallback方法
for (var i = 0; i < jsonpArray.length; i++) webpackJsonpCallback(jsonpArray[i]);
var parentJsonpFunction = oldJsonpFunction;
```

这样我们在异步`chunk`中执行的`window['webpackJsonp'].push`其实是`webpackJsonpCallback`函数。

## webpackJsonpCallback

看名字应该能猜到，它是我们上面说的模拟`jsonp`完成后执行的逻辑，注意`script.onload/onerror`会在`webpackJsonpCallback`执行完后再执行，**所以`onload/onerror`其实是用来检查`webpackJsonpCallback`的完成度：有没有将`installedChunks`中对应的`chunk`值设为 0.**

```js
function webpackJsonpCallback(data) {
  var chunkIds = data[0];
  var moreModules = data[1];

  // add "moreModules" to the modules object,
  // then flag all "chunkIds" as loaded and fire callback
  var moduleId,
    chunkId,
    i = 0,
    resolves = [];
  for (; i < chunkIds.length; i++) {
    chunkId = chunkIds[i];
    // 0表示已加载完的chunk，所以此处是找到那些未加载完的chunk，他们的value还是[resolve, reject, promise]
    if (installedChunks[chunkId]) {
      resolves.push(installedChunks[chunkId][0]);
    }
    installedChunks[chunkId] = 0; // 标记为已加载
  }
  // 挨个将异步chunk中的module加入主chunk的modules数组中
  for (moduleId in moreModules) {
    if (Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
      modules[moduleId] = moreModules[moduleId];
    }
  }
  // parentJsonpFunction: 原始的数组push方法，将data加入window["webpackJsonp"]数组。
  // 因为动态chunk中的push方法即webpackJsonpCallback并没有执行这个步骤
  if (parentJsonpFunction) parentJsonpFunction(data);

  // 等到while循环结束后，__webpack_require__.e的返回值Promise得到resolve
  while (resolves.length) {
    resolves.shift()();
  }
}
```

# common chunk

这个其实也是一种`code splitting`方案，用于有多个`entry`的配置中提取公共代码的。为此我们需要修改下`webpack config`以及每个`entry`的代码，我们使用最新的[`SplitChunksPlugin`](https://webpack.js.org/plugins/split-chunks-plugin/)来生成公共`chunk`。

## 配置

```js
// webpack config

module.exports = {
  entry: {
    main: './index.js',
    runtime: './runtime.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[chunkhash].js',
    chunkFilename: '[name].[chunkhash].js',
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      minSize: 0,
      maxSize: 0,
      minChunks: 1,
      maxAsyncRequests: 5,
      maxInitialRequests: 3,
      automaticNameDelimiter: '~',
      name: true,
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  },
  mode: 'development',
  devtool: 'cheap-source-map',
};
```

```js
// index.js

import { log } from './util';
log('log in entry');
```

```js
// runtime.js

import { log } from './util';
log('log in runtime');
```

`util.js`中的代码不做修改，按照期望会有 3 个文件生成：`main.xxx.js`、`runtime.xxx.js`，公共代码抽取生成的`chunk`按照`SplitChunksPlugin`的配置应该是`default~main~runtime.xxx.js`。

## 主 chunk 代码

生成的打包产物`main.xxx.js`、`runtime.xxx.js`基本一致，因为它俩现在地位相同都是主`chunk`：都不会有`util.js`的代码，同时相较于`require.ensure`生成的代码有了一些变化，我们先从如何加载`default~main~runtime.xxx.js`看起：

```js
(function(modules) {
  // ...
})({
  './index.js': function(module, __webpack_exports__, __webpack_require__) {
    // ...
    var _util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__('./util.js');
    // ...
  },
});
```

看起来像是`__webpack_require__`的实现有变化，但查看代码却发现不是这样，仔细对比发现是 `IIFE` 里的代码有不同，加载`index.js`的方式变了：

```js
var deferredModules = [];

// add entry module to deferred list
deferredModules.push(['./webpack-sourcecode/index.js', 'default~main~runtime']);
// run deferred modules when ready
return checkDeferredModules();
```

这次又多出来个数组，看看`checkDeferredModules`：

```js
function checkDeferredModules() {
  var result;
  for (var i = 0; i < deferredModules.length; i++) {
    var deferredModule = deferredModules[i];
    var fulfilled = true;
    // 检查当前主chunk依赖的所有异步加载的common chunk，看是否都已加载完成，注意下标从1开始
    for (var j = 1; j < deferredModule.length; j++) {
      var depId = deferredModule[j];
      if (installedChunks[depId] !== 0) fulfilled = false; // 依然是0表示加载完
    }
    if (fulfilled) {
      // fulfilled表示这个主chunk所有依赖chunk均加载完，从数组中移除这个元素
      deferredModules.splice(i--, 1);
      // 此时才真正require这个主chunk
      result = __webpack_require__((__webpack_require__.s = deferredModule[0]));
    }
  }
  return result;
}
```

ok 现在我们明白了`main.xxx.js`这个`chunk`中的`index.js`什么时候才能执行了，就是等到`default~main~runtime`这个`common chunk`加载完才能执行。那么剩下的问题就是在何时会去加载`default~main~runtime`呢？因为`checkDeferredModules`并没有做这件事。

很遗憾整个主`chunk`中都没有找到这样的代码，连模拟`jsonp`的代码都没有，直到在插件文档中找到这样一段话：

> You can combine this configuration with the HtmlWebpackPlugin. It will inject all the generated vendor chunks for you.

也就是说插件会自动将生成的`chunk`插入到`html`中，查看我们实际的某个项目发现确实如此：

```js
// webpack config, 注意只有一个entry

const entry = {
  index: ['src/main.js'],
};

const output = {
  path: disPath,
  publicPath: conf.conf.public_path,
  filename: 'statics/js/[name].[hash:8].js',
  chunkFilename: 'statics/js/[name].[chunkhash:8].js',
};
```

```html
<!-- 模板： index.template.html -->
<body>
  <div id="app"></div>
</body>
```

```html
<!-- 打包产物 dist/index.html， 除了index.xxx.js是在webpack中配置的entry，其余script都是插件替我们添加的 -->

<div id="app"></div>
<script type="text/javascript" src="/statics/js/manifest.89177312.js"></script>
<script type="text/javascript" src="/statics/js/styles.abb25b55.js"></script>
<script type="text/javascript" src="/statics/js/vendor.7d0ff587.js"></script>
<script type="text/javascript" src="/statics/js/index.b7e452c8.js"></script></body>
```

TODO: `SplitChunksPlugin`源码分析。

终于真想大白，浏览器会替我们加载`common chunk`，接下来看看`default~main~runtime`。

## common chunk 代码

```js
(window['webpackJsonp'] = window['webpackJsonp'] || []).push([
  ['default~main~runtime'],
  {
    './util.js': function(module, __webpack_exports__, __webpack_require__) {
      // ...
    },
  },
]);
```

这段代码很熟悉和`require.ensure`的产物一样就不说了。`push`实际调用的是`webpackJsonpCallback`，仔细相关其实需要在`webpackJsonpCallback`中再执行一次`checkDeferredModules`，因为只有这样我们的主`chunk`所有依赖`chunk`才能被标记为加载完成，后续才能`require`主`module`。实际上确实是这样：

## webpackJsonpCallback

```js
function webpackJsonpCallback(data) {
  var chunkIds = data[0];
  var moreModules = data[1];
  var executeModules = data[2];

  // add "moreModules" to the modules object,
  // then flag all "chunkIds" as loaded and fire callback
  var moduleId,
    chunkId,
    i = 0,
    resolves = [];
  for (; i < chunkIds.length; i++) {
    chunkId = chunkIds[i];
    if (installedChunks[chunkId]) {
      resolves.push(installedChunks[chunkId][0]);
    }
    installedChunks[chunkId] = 0;
  }
  for (moduleId in moreModules) {
    if (Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
      modules[moduleId] = moreModules[moduleId];
    }
  }
  if (parentJsonpFunction) parentJsonpFunction(data);

  while (resolves.length) {
    resolves.shift()();
  }

  // add entry modules from loaded chunk to deferred list
  deferredModules.push.apply(deferredModules, executeModules || []);

  // run deferred modules when all chunks ready
  return checkDeferredModules();
}
```

绝大部分与`require.ensure`版本一样，`executeModules`应该是这个`common chunk`依赖的`chunk`??

与我们的猜测一致，**每个`common chunk`在加载完之后，都会检查所属主`chunk`的所有依赖`chunk`是否都加载完成，之后才能去`require`主`module`。**

# Tree Shaking

`webpack` 本身并不会删除任何多余的代码，删除无用代码的工作是 `UglifyJS`做的. `webpack` 做的事情是 `unused harmony exports` 的标记，也就是他会分析你的代码，把不用的 `exports` 删除，但是变量的声明并没有删除。

具体的 Tree shaking 这里就不叙述了，[webpack 官网](https://webpack.js.org/guides/tree-shaking/)和[这篇博客](https://github.com/lihongxun945/diving-into-webpack/blob/master/8-tree-shaking.md)都讲的很清楚。

注意： 在自己做测试时，发现需要`webpack config`添加一个额外的配置才起作用：

```js
optimization: {
  usedExports: true;
}
```

这个在`webpack`源码的`WebpackOptionsApply.js`中有标明：

```js
if (options.optimization.usedExports) {
  new FlagDependencyUsagePlugin().apply(compiler);
}
```
