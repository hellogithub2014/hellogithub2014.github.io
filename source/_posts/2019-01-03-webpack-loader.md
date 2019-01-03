---
title: webpack loader机制源码解析
date: 2019-01-03 11:15:58
tags: [webpack, loader]
---

对于`webpack loader`相信大家都知道它是用于将一个模块转为`js`代码的，但估计不是每个人都知道`webpack`对于`loader`的内部处理流程。从大体上来说是遵循流水线机制的，即挨个处理每个`loader`，前一个`loader`的结果会传递给下一个`loader`。

`loader`有一些主要的特性：

- 同步、异步
- raw
- pitch
- context

本文会从源码角度解释`webpack`是如何处理这些特性的,并在最后举一些实际的例子帮助大家理解如何写一个`loader`。

# 入口

`webpack`在处理`Module`时就会先用`loader`，每个`module`可以配置多个`loader`，然后再将`js`代码转为`AST`，这部分的逻辑在`webpack`源码的`lib/NormalModule.js`：

```js
doBuild(options, compilation, resolver, fs, callback) {
		const loaderContext = this.createLoaderContext(
			resolver,
			options,
			compilation,
			fs
		);

		runLoaders(
			{
				resource: this.resource, // 模块路径
				loaders: this.loaders, // options中配置的loader
				context: loaderContext,
				readResource: fs.readFile.bind(fs)
			},
			(err, result) => {
        // result即处理完的js代码，剩余逻辑略...
      }
	}
```

`runLoaders`是专门抽取出去的库`loader-runner`，所有逻辑都在这个库中，接下来我们重点放在这里。

# loader-runner

先看看入口函数：

```js
exports.runLoaders = function runLoaders(options, callback) {
  // prepare loader objects
  var loaders = options.loaders || [];
  loaders = loaders.map(createLoaderObject);

  // 各种初始化赋值...

  var processOptions = {
    resourceBuffer: null,
    readResource: readResource,
  };
  iteratePitchingLoaders(processOptions, loaderContext, function(err, result) {
    if (err) {
      return callback(err, {
        cacheable: requestCacheable,
        fileDependencies: fileDependencies,
        contextDependencies: contextDependencies,
      });
    }
    callback(null, {
      result: result,
      resourceBuffer: processOptions.resourceBuffer,
      cacheable: requestCacheable,
      fileDependencies: fileDependencies,
      contextDependencies: contextDependencies,
    });
  });
};
```

入口函数其实做的事情比较简单，除了初始化外就是调用`iteratePitchingLoaders`了，这个函数执行完就触发`webpack`传递的回调函数。接下来看看这个函数。

## iteratePitchingLoaders

```js
function iteratePitchingLoaders(options, loaderContext, callback) {
  // abort after last loader， loaderIndex初始为0，当所有loader pitch都执行完后，if条件成立
  if (loaderContext.loaderIndex >= loaderContext.loaders.length) return processResource(options, loaderContext, callback);

  // 当前loader
  var currentLoaderObject = loaderContext.loaders[loaderContext.loaderIndex];

  // iterate，如果当前loader的pitch已经执行过，继续递归下一个loader
  if (currentLoaderObject.pitchExecuted) {
    loaderContext.loaderIndex++;
    return iteratePitchingLoaders(options, loaderContext, callback);
  }

  // load loader module，加载loader的实现,
  // loader默认导出函数赋值给normal属性，pitch函数赋值给pitch属性
  loadLoader(currentLoaderObject, function(err) {
    if (err) return callback(err);
    var fn = currentLoaderObject.pitch; // pitch函数
    currentLoaderObject.pitchExecuted = true;
    // 没有pitch函数则递归下一个
    if (!fn) return iteratePitchingLoaders(options, loaderContext, callback);

    // 执行pitch函数，同步或者异步的
    runSyncOrAsync(fn, loaderContext, [loaderContext.remainingRequest, loaderContext.previousRequest, (currentLoaderObject.data = {})], function(
      err,
    ) {
      // 执行完fn后的回调
      if (err) return callback(err);
      // args表示pitch函数的返回值，如果存在则跳过后续的递归处理流程，直接掉头处理loader的normal函数
      // 在官网文档中也有专门的描述： https://webpack.js.org/api/loaders/#pitching-loader
      var args = Array.prototype.slice.call(arguments, 1);
      if (args.length > 0) {
        loaderContext.loaderIndex--;
        iterateNormalLoaders(options, loaderContext, args, callback);
      } else {
        iteratePitchingLoaders(options, loaderContext, callback);
      }
    });
  });
}
```

初看很容易懵逼，到处都有递归，但仔细配合注释看下来会发现其实就是递归执行每个`loader`的`pitch`函数，并在所有`pitch`执行完后调用`processResource`。那么问题来了，`pitch`是个什么鬼？

参照[官网的`api`解释](https://webpack.js.org/api/loaders/#pitching-loader)，每个`loader`除了默认的处理函数外（我们可以称之为`normal`函数），还可以配置一个`pitch`函数，这两个函数的关系类似于浏览器的`dom`事件处理流程：**先从前往后执行`pitch`，接着处理`module`自身一些逻辑，再从后往前执行`normal`，类似于先触发`dom`事件的捕获阶段，接着执行事件回调，再触发冒泡阶段。**

如果我们给一个`module`配置了 3 个`loader`，这三个`loader`都配置了`pitch`函数：

```js
module.exports = {
  //...
  module: {
    rules: [
      {
        //...
        use: ['a-loader', 'b-loader', 'c-loader'],
      },
    ],
  },
};
```

那么处理这个`module`的流程如下：

```js
|- a-loader `pitch`
  |- b-loader `pitch`
    |- c-loader `pitch`
      |- requested module is picked up as a dependency
    |- c-loader `normal`
  |- b-loader `normal`
|- a-loader `normal`
```

顺序执行`normal`函数的代码位于`iterateNormalLoaders`，稍后会描述。

`loadLoader`函数用于加载一个`loader`的实现，会尝试使用`System.import`或`require`来加载，我不怎么熟悉`System.import`就不细讲了。`loader`默认导出函数会赋值给`currentLoaderObject`的`normal`属性，`pitch`函数会赋值给`pitch`属性。

`runSyncOrAsync`用于执行一个同步或异步的`fn`，执行完后触发传入的回调函数。这个函数比较有意思，仔细看看：

```js
// fn可能是同步也可能是异步的
function runSyncOrAsync(fn, context, args, callback) {
  var isSync = true;
  var isDone = false;
  var isError = false; // internal error
  var reportedError = false;
  // context.async就是loader函数内部可以执行的this.async
  // 用于告知context，此fn是异步的
  context.async = function async() {
    if (isDone) {
      if (reportedError) return; // ignore
      throw new Error('async(): The callback was already called.');
    }
    isSync = false;
    return innerCallback;
  };
  // context.callback就是loader函数内部可以执行的this.callback
  // 用于告知context，异步的fn已经执行完成
  var innerCallback = (context.callback = function() {
    if (isDone) {
      if (reportedError) return; // ignore
      throw new Error('callback(): The callback was already called.');
    }
    isDone = true;
    isSync = false;
    try {
      callback.apply(null, arguments);
    } catch (e) {
      isError = true;
      throw e;
    }
  });
  try {
    var result = (function LOADER_EXECUTION() {
      // 调用fn
      return fn.apply(context, args);
    })();
    // 异步loader fn应该在开头执行this.async, 以保证修改isSync为false，从而不会执行此处逻辑
    if (isSync) {
      isDone = true;
      if (result === undefined) return callback();
      if (result && typeof result === 'object' && typeof result.then === 'function') {
        return result.catch(callback).then(function(r) {
          callback(null, r);
        });
      }
      return callback(null, result);
    }
  } catch (e) {
    if (isError) throw e;
    if (isDone) {
      // loader is already "done", so we cannot use the callback function
      // for better debugging we print the error on the console
      if (typeof e === 'object' && e.stack) console.error(e.stack);
      else console.error(e);
      return;
    }
    isDone = true;
    reportedError = true;
    callback(e);
  }
}
```

往`context`上添加了`async`和`callback`函数，它俩是给异步`loader`使用的，前者告诉`context`自己是异步的，后者告诉`context`自己处理完成了。所以在`loader`内部可以调用`this.async`以及`this.callback`. 同步的`loader`不需要用到这俩，执行完直接`return`即可。后面我们会分别举一个例子。

注意：执行完一个`pitch`后，会判断`pitch`是否有返回值，如果没有则继续递归执行下一个`pitch`；如果有返回值，那么`pitch`的递归就此结束，开始从当前位置从后往前执行`normal`：

```js
var args = Array.prototype.slice.call(arguments, 1);
if (args.length > 0) {
  loaderContext.loaderIndex--; // 从前一个loader的normal开始执行
  iterateNormalLoaders(options, loaderContext, args, callback);
} else {
  iteratePitchingLoaders(options, loaderContext, callback);
}
```

这个逻辑在官网也有描述，继续用我们上面的例子，如果`b-loader`的`pitch`有返回值，那么处理这个`module`的流程如下：

```js
|- a-loader `pitch`
  |- b-loader `pitch` returns a module
|- a-loader `normal`
```

以上就是`pitch`的递归过程，下面看看`processResource`函数，它用于将目标`module`当做`loaderContext`的一个依赖。这个函数的逻辑还是比较简单的：

```js
// 处理模块自身的资源，主要是读取及添加为context的依赖
function processResource(options, loaderContext, callback) {
  // set loader index to last loader
  loaderContext.loaderIndex = loaderContext.loaders.length - 1;

  var resourcePath = loaderContext.resourcePath;
  if (resourcePath) {
    // requested module is picked up as a dependency
    loaderContext.addDependency(resourcePath);
    // 读取module内容
    options.readResource(resourcePath, function(err, buffer) {
      if (err) return callback(err);
      options.resourceBuffer = buffer;
      // 迭代loader的normal函数
      iterateNormalLoaders(options, loaderContext, [buffer], callback);
    });
  } else {
    iterateNormalLoaders(options, loaderContext, [null], callback);
  }
}
```

```js
var fileDependencies = [];

loaderContext.addDependency = function addDependency(file) {
  fileDependencies.push(file);
};
```

## iterateNormalLoaders

递归迭代`normal`函数，和`pitch`的流程大同小异，需要注意的是顺序是反过来的，从后往前。

```js
// 与iteratePitchingLoaders类似，只不过是从后往前执行每个loader的normal函数
function iterateNormalLoaders(options, loaderContext, args, callback) {
  if (loaderContext.loaderIndex < 0) return callback(null, args);

  var currentLoaderObject = loaderContext.loaders[loaderContext.loaderIndex];

  // iterate
  if (currentLoaderObject.normalExecuted) {
    loaderContext.loaderIndex--;
    return iterateNormalLoaders(options, loaderContext, args, callback);
  }

  // 在loadLoader中加载loader的实现，
  // loader默认导出函数赋值给normal属性，pitch函数赋值给pitch属性
  var fn = currentLoaderObject.normal;
  currentLoaderObject.normalExecuted = true;
  if (!fn) {
    return iterateNormalLoaders(options, loaderContext, args, callback);
  }

  // 根据raw来转换args， https://webpack.js.org/api/loaders/#-raw-loader
  convertArgs(args, currentLoaderObject.raw);

  // fn: function ( source, inputSourceMap ) { … }
  runSyncOrAsync(fn, loaderContext, args, function(err) {
    if (err) return callback(err);

    // 将前一个loader的处理结果传递给下一个loader
    var args = Array.prototype.slice.call(arguments, 1);
    iterateNormalLoaders(options, loaderContext, args, callback);
  });
}
```

`convertArgs`用于根据`raw`来转换`args`，`raw`属性在[官网有专门描述](https://webpack.js.org/api/loaders/#-raw-loader)：

> By default, the resource file is converted to a UTF-8 string and passed to the loader.By setting the raw flag, the loader will receive the raw Buffer.Every loader is allowed to deliver its result as String or as Buffer.

```js
function convertArgs(args, raw) {
  if (!raw && Buffer.isBuffer(args[0])) args[0] = utf8BufferToString(args[0]);
  else if (raw && typeof args[0] === 'string') args[0] = new Buffer(args[0], 'utf-8');
}
```

例如`file-loader`就会将`raw`设置为`true`，具体原因[参考这里](https://github.com/lihongxun945/diving-into-webpack/blob/master/4-file-loader-and-url-loader.md)

以上就是整个`loader-runner`库的核心逻辑了，接下来举几个例子。

# 同步的 style-loader

它的逻辑从整体上看比较简单，就是做了一些同步的处理并在最后`return`了一个`js`字符串。注意他只有`pitch`函数而没有`normal`函数。

```js
module.exports = function() {};

module.exports.pitch = function(request) {
  // ...

  return [
    //  一些数组元素...
  ].join('\n');
};
```

为啥`style-loader`要有`pitch`呢？ 参考[`这篇博客`](https://github.com/lihongxun945/diving-into-webpack/blob/master/3-style-loader-and-css-loader.md)的说法，是为了避免受到`css-loader`的影响：

> 因为我们要把 CSS 文件的内容插入 DOM，所以我们要获取 CSS 文件的样式。如果按照默认的从右往左的顺序，我们使用 css-loader ，它返回的结果是一段 JS 字符串，这样我们就取不到 CSS 样式了。为了获取 CSS 样式，我们会在 style-loader 中直接通过 require 来获取，这样返回的 JS 就不是字符串而是一段代码了。也就是我们是先执行 style-loader，在它里面再执行 css-loader。

# 异步的 less-loader

```js
// 调用less第三方库来处理less代码，返回值为promise
var render = (0, _pify2.default)(_less2.default.render.bind(_less2.default));

function lessLoader(source) {
  var loaderContext = this;
  var options = (0, _getOptions2.default)(loaderContext);
  // loaderContext.async()告知webpack当前loader是异步的
  var done = loaderContext.async();
  var isSync = typeof done !== 'function';

  if (isSync) {
    throw new Error('Synchronous compilation is not supported anymore. See https://github.com/webpack-contrib/less-loader/issues/84');
  }

  // 调用_processResult2
  (0, _processResult2.default)(loaderContext, render(source, options));
}

exports.default = lessLoader;
```

`less-loader`的核心是利用`less`这个库来解析`less`代码，`less`会返回一个`Promise`，所以`less-loader`是异步的。

我们可以看到在开头就调用了`this.async()`方法，正好符合我们的预期，接下来如果猜的没错会在`_processResult2`里调用`this.callback`:

```js
function processResult(loaderContext, resultPromise) {
  var callback = loaderContext.callback;

  resultPromise
    .then(
      function(_ref) {
        var css = _ref.css,
          map = _ref.map,
          imports = _ref.imports;

        imports.forEach(loaderContext.addDependency, loaderContext);
        return {
          // Removing the sourceMappingURL comment.
          // See removeSourceMappingUrl.js for the reasoning behind this.
          css: removeSourceMappingUrl(css),
          map: typeof map === 'string' ? JSON.parse(map) : map,
        };
      },
      function(lessError) {
        throw formatLessError(lessError);
      },
    )
    .then(function(_ref2) {
      var css = _ref2.css,
        map = _ref2.map;

      // 调用loaderContext.callback表示当前loader的处理已经完成，转交给下一个loader处理
      callback(null, css, map);
    }, callback);
}
```

bingo!!

实际上官网也推荐将`loader`变成异步的：

> since expensive synchronous computations are a bad idea in a single-threaded environment like Node.js, we advise to make your loader asynchronously if possible. Synchronous loaders are ok if the amount of computation is trivial.

# bundle-loader

最后再看这个使用`pitch`的例子[`bundle-loader`](https://github.com/webpack-contrib/bundle-loader)，也是官网推荐的`loader`。它用于分离代码和延迟加载生成的`bundle`。

原理: 正常情况下假如我们在`entry`中`require`了一个普通`js`文件，这个目标文件是和`entry`一起打包到主`chunk`了，那么在执行时就是同步加载。 使用`bundle-loader`我们的代码不用做任何修改，就可以让目标`js`文件分离到独立`chunk`中，执行时通过模拟`jsonp`的方式异步加载这个`js`。

看看`loader`的源码实现：

```js
module.exports = function() {};
module.exports.pitch = function(remainingRequest) {
  // ...
  var result;
  if (query.lazy) {
    result = [
      'module.exports = function(cb) {\n',
      '	require.ensure([], function(require) {\n',
      '		cb(require(',
      loaderUtils.stringifyRequest(this, '!!' + remainingRequest),
      '));\n',
      '	}' + chunkNameParam + ');\n',
      '}',
    ];
  } else {
    result = [
      'var cbs = [], \n',
      '	data;\n',
      'module.exports = function(cb) {\n',
      '	if(cbs) cbs.push(cb);\n',
      '	else cb(data);\n',
      '}\n',
      'require.ensure([], function(require) {\n',
      '	data = require(',
      loaderUtils.stringifyRequest(this, '!!' + remainingRequest), // 此处require真正的目标module
      ');\n',
      '	var callbacks = cbs;\n',
      '	cbs = null;\n',
      '	for(var i = 0, l = callbacks.length; i < l; i++) {\n',
      '		callbacks[i](data);\n',
      '	}\n',
      '}' + chunkNameParam + ');',
    ];
  }
  return result.join('');
};
```

可以看到只有`pitch`函数，为保证目标`module`分离到独立`chunk`，使用了[`require.ensure`](https://webpack.docschina.org/api/module-methods#require-ensure)这种动态导入。另外将整个`module`替换成了自己的实现，`module`真正的加载时机在`require.ensure`的回调中。

为了加深理解，我参照官网利用一个小`demo`测试：

```js
// webpack entry: index.js

import bundle from './util.bundle.js';
bundle(file => console.log(file));
```

```js
// util.bundle.js

export function bundle() {
  console.log('bundle');
}
```

打包后会生成两个文件，一个主`chunk`文件`main.xxx.js`，另一个是分离出去的`bundle chunk`文件`0.xxx.js`。在分析打包代码前，如果对`webpack`打包产物不熟悉的，可以参考我之前的[博客](https://hellogithub2014.github.io/2019/01/02/webpack-bundle-code-analysis/#more)，这里我只分析关键的部分。

`index.js`这个`module`对于`util.bundle`的引入方式没有什么值得注意的,精简如下：

```js
var _util_bundle_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__('./util.bundle.js');
var _util_bundle_js__WEBPACK_IMPORTED_MODULE_0___default = __webpack_require__.n(_util_bundle_js__WEBPACK_IMPORTED_MODULE_0__);

_util_bundle_js__WEBPACK_IMPORTED_MODULE_0___default()(function(file) {
  return console.log(file);
});
```

变化的是`util.bundle.js`这个`module`，它被替换成了`bundle-loader`的返回值：

```js
var cbs = [],
  data;
module.exports = function(cb) {
  if (cbs) cbs.push(cb);
  else cb(data);
};
__webpack_require__
  .e(/*! require.ensure */ 0) // jsonp加载分离的chunk
  .then(
    function(require) {
      data = __webpack_require__(
        /*! !../node_modules/babel-loader/lib??ref--5!./util.bundle.js */ './node_modules/babel-loader/lib/index.js?!./util.bundle.js',
      );
      var callbacks = cbs;
      cbs = null;
      for (var i = 0, l = callbacks.length; i < l; i++) {
        callbacks[i](data);
      }
    }.bind(null, __webpack_require__),
  )
  .catch(__webpack_require__.oe);
```

可以看到真正的`util.bundle.js`被替换为使用`__webpack_require__.e`加载，也就是模拟的`jsonp`。我们在`index.js`中传入的回调被塞到`cbs`数组，直到真正的`bundle`被加载完才能执行`__webpack_require__`，之后会将`bundle`的导出内容依次传给`cbs`每个元素，整个逻辑还是比较清晰的。
