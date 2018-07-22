---
title: "Sentry源码解析"
img: nevada.jpg # Add image post (optional)
date: 2018-07-22 22:20:00 +0800
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [vue,Sentry,Raven]
---


# 背景

目前的项目中很早前就引入了[Sentry](https://github.com/getsentry/raven-js)进行错误监控，自己以前也零零散散看过一些错误监控的博客，但都没有深入到源码层面。很好奇`Sentry`是怎么抓取错误的，能够获取到那么多的错误信息。于是花了几天的闲暇时间加上周末，把它的源码撸了一遍，虽然没有仔细阅读每一行代码，但还是学到了很多，这篇文章就是用于记录自己的学习笔记。注意，这里不会介绍如何安装`Sentry`，因为网上的教程很多。

# 配置及主入口install方法

配置很简单，几行代码就可以完成：

```js
import Raven from 'raven-js';
import RavenVue from 'raven-js/plugins/vue';

Raven
      .config('http://user@host:port/path', {
        environment: 'prod',
      })
      .addPlugin(RavenVue, Vue)
      .install();
```

可能很好奇为啥是`Raven`而不是`Sentry`，这个我也不知道，不去深究。。。 

可以看到一个`config`+`addPlugin`+`install`就ok了，`addPlugin`是用于安装`Raven`专门给`Vue`写的一个插件，`install`就是整个`Raven`的主入口了。

`addPlugin`很简单，其实就是把参数放到自己内部的一个插件数组中，等待合适时机安装每个插件：

```js
  addPlugin: function(plugin /*arg1, arg2, ... argN*/) {
    var pluginArgs = [].slice.call(arguments, 1);
    this._plugins.push([plugin, pluginArgs]);
    // ...
    return this;
  },
```

我们的`RavenVue`老哥其实也很简单，就是实现了`Vue.config.errorHandler`，这是Vue的[全局错误处理钩子](https://cn.vuejs.org/v2/api/#errorHandler)， 然后把抓到的错误交给`Raven`处理：

```js
// vuePlugin就是RavenVue
function vuePlugin(Raven, Vue) {
  // ...
  var _oldOnError = Vue.config.errorHandler;
  Vue.config.errorHandler = function VueErrorHandler(error, vm, info) {
    var metaData = {};

    // vm and lifecycleHook are not always available
    if (Object.prototype.toString.call(vm) === '[object Object]') {
      metaData.componentName = formatComponentName(vm);
      metaData.propsData = vm.$options.propsData;
    }

    if (typeof info !== 'undefined') {
      metaData.lifecycleHook = info;
    }
    
	 // captureException手动把异常发送给Sentry服务器
    Raven.captureException(error, {
      extra: metaData
    });

    if (typeof _oldOnError === 'function') {
      _oldOnError.call(this, error, vm, info);
    }
  };
}
```

可以看到主要逻辑就是捕捉到错误时先获取`vue`实例或组件的一些信息，最后发送到服务器。至于`captureException`是怎么实现的我们后面再看。


接下来就是我们的重点`install`了：

```js
install: function() {
    var self = this;
    if (self.isSetup() && !self._isRavenInstalled) {
      TraceKit.report.subscribe(function() {
        self._handleOnErrorStackInfo.apply(self, arguments);
      });

      if (self._globalOptions.captureUnhandledRejections) {
        self._attachPromiseRejectionHandler();
      }

      self._patchFunctionToString();

      if (self._globalOptions.instrument && self._globalOptions.instrument.tryCatch) {
        self._instrumentTryCatch();
      }

      if (self._globalOptions.autoBreadcrumbs) self._instrumentBreadcrumbs();

      // Install all of the plugins
      self._drainPlugins();

      self._isRavenInstalled = true;
    }

    Error.stackTraceLimit = self._globalOptions.stackTraceLimit;
    return this;
  }
```

我们不去管各种if条件，无非是判断各种配置，先假设他们全部成立。那么我们的注意力就很清晰了：

* `TraceKit.report.subscribe`
* `_handleOnErrorStackInfo`
* `_attachPromiseRejectionHandler`
* `_patchFunctionToString`
* `_instrumentTryCatch`
* `_instrumentBreadcrumbs`
* `_drainPlugins`

余下所有篇幅都是解析他们的实现过程，挨个来看。

# TraceKit.report.subscribe

`TraceKit`是个啥呢？在源码中有大段注释，摘来看一下：

```js
/*
 TraceKit - Cross brower stack traces

 This was originally forked from github.com/occ/TraceKit, but has since been
 largely re-written and is now maintained as part of raven-js.  Tests for
 this are in test/vendor.

 MIT license
*/
```

它是一个跨浏览器的错误堆栈处理库，因为堆栈信息在不同浏览器上的细节都不尽相同，`Raven`把`Trackit`的相关代码专门放到一个文件了。

`TraceKit.report`有关于堆栈更详细的注释，对于理解代码很有帮助：

```js
/**
 *
 * Supports:
 *   - Firefox: full stack trace with line numbers, plus column number
 *              on top frame; column number is not guaranteed
 *   - Opera:   full stack trace with line and column numbers
 *   - Chrome:  full stack trace with line and column numbers
 *   - Safari:  line and column number for the top frame only; some frames
 *              may be missing, and column number is not guaranteed
 *   - IE:      line and column number for the top frame only; some frames
 *              may be missing, and column number is not guaranteed
 *
 * In theory, TraceKit should work on all of the following versions:
 *   - IE5.5+ (only 8.0 tested)
 *   - Firefox 0.9+ (only 3.5+ tested)
 *   - Opera 7+ (only 10.50 tested; versions 9 and earlier may require
 *     Exceptions Have Stacktrace to be enabled in opera:config)
 *   - Safari 3+ (only 4+ tested)
 *   - Chrome 1+ (only 5+ tested)
 *   - Konqueror 3.5+ (untested)
 *
 * Requires TraceKit.computeStackTrace.
 *
 * Tries to catch all unhandled exceptions and report them to the
 * subscribed handlers. Please note that TraceKit.report will rethrow the
 * exception. This is REQUIRED in order to get a useful stack trace in IE.
 * If the exception does not reach the top of the browser, you will only
 * get a stack trace from the point where TraceKit.report was called.
 *
 * Handlers receive a stackInfo object as described in the
 * TraceKit.computeStackTrace docs.
 */
```

类似`Raven`的`plugins`数组，`TraceKit.report`也有一个`handlers`数组，我们的`TraceKit.report.subscribe`就是把自己注册到这个数组里：

```js
TraceKit.report = (function reportModuleWrapper() {
  var handlers = [],
	// ...
	
  function subscribe(handler) {
    installGlobalHandler();
    handlers.push(handler);
  }
  
  // ...
})();
```

**`installGlobalHandler`会拦截`window.onrror`，对错误对象进行一系列处理，最后交由每个`handler`处理。**

```js
  function installGlobalHandler() {
    // ...
    _oldOnerrorHandler = _window.onerror;
    _window.onerror = traceKitWindowOnError;
   // ...
  }

function traceKitWindowOnError(msg, url, lineNo, colNo, ex) {
    var stack = null;
    
    // ... 此处省略一坨逻辑
    
    // non-string `exception` arg; attempt to extract stack trace

      // New chrome and blink send along a real error object
      // Let's just report that like a normal error.
      // See: https://mikewest.org/2013/08/debugging-runtime-errors-with-window-onerror
      stack = TraceKit.computeStackTrace(exception);
      notifyHandlers(stack, true);
      
    // ... 此处省略一坨逻辑

    if (_oldOnerrorHandler) {
      return _oldOnerrorHandler.apply(this, arguments);
    }

    return false;
  }
```

把上面的`traceKitWindowOnError`逻辑略去了很多，只看关键的`TraceKit.computeStackTrace`和`notifyHandlers`。 前者的逻辑很多，是用来帮助调用方屏蔽跨浏览器的堆栈处理细节，后者很简单，就是挨个调用每个`handler`处理`stack`信息。

我们先看简单的`notifyHandlers`：

```js

  /**
   * Dispatch stack information to all handlers.
   * @param {Object.<string, *>} stack
   */
  function notifyHandlers(stack, isWindowError) {
    var exception = null;
    // ...
    for (var i in handlers) {
      if (handlers.hasOwnProperty(i)) {
        try {
          handlers[i].apply(null, [stack].concat(_slice.call(arguments, 2)));
        } catch (inner) {
          exception = inner;
        }
      }
    }

    if (exception) {
      throw exception;
    }
  }
```

可以看到确实很简单。再来看看复杂的`TraceKit.computeStackTrace`。

## TraceKit.computeStackTrace

这个函数首先给了一大坨注释用于描述跨浏览器堆栈信息的混乱，此函数的目的就是返回一个统一格式的堆栈信息。

```js

/**
 * TraceKit.computeStackTrace: cross-browser stack traces in JavaScript
 *
 * Syntax:
 *   s = TraceKit.computeStackTrace(exception) // consider using TraceKit.report instead (see below)
 * Returns:
 *   s.name              - exception name
 *   s.message           - exception message
 *   s.stack[i].url      - JavaScript or HTML file URL
 *   s.stack[i].func     - function name, or empty for anonymous functions (if guessing did not work)
 *   s.stack[i].args     - arguments passed to the function, if known
 *   s.stack[i].line     - line number, if known
 *   s.stack[i].column   - column number, if known
 *
 * Supports:
 *   - Firefox:  full stack trace with line numbers and unreliable column
 *               number on top frame
 *   - Opera 10: full stack trace with line and column numbers
 *   - Opera 9-: full stack trace with line numbers
 *   - Chrome:   full stack trace with line and column numbers
 *   - Safari:   line and column number for the topmost stacktrace element
 *               only
 *   - IE:       no line numbers whatsoever
 *
 * Tries to guess names of anonymous functions by looking for assignments
 * in the source code. In IE and Safari, we have to guess source file names
 * by searching for function bodies inside all page scripts. This will not
 * work for scripts that are loaded cross-domain.
 * Here be dragons: some function names may be guessed incorrectly, and
 * duplicate functions may be mismatched.
 *
 * TraceKit.computeStackTrace should only be used for tracing purposes.
 * Logging of unhandled exceptions should be done with TraceKit.report,
 * which builds on top of TraceKit.computeStackTrace and provides better
 * IE support by utilizing the window.onerror event to retrieve information
 * about the top of the stack.
 *
 * Note: In IE and Safari, no stack trace is recorded on the Error object,
 * so computeStackTrace instead walks its *own* chain of callers.
 * This means that:
 *  * in Safari, some methods may be missing from the stack trace;
 *  * in IE, the topmost function in the stack trace will always be the
 *    caller of computeStackTrace.
 *
 * This is okay for tracing (because you are likely to be calling
 * computeStackTrace from the function you want to be the topmost element
 * of the stack trace anyway), but not okay for logging unhandled
 * exceptions (because your catch block will likely be far away from the
 * inner function that actually caused the exception).
 *
 */
```

上面的注释大家了解一下就好，接下来看看具体的代码：

```js
TraceKit.computeStackTrace = (function computeStackTraceWrapper() {
	
  /**
   * Computes stack trace information from the stack property.
   * Chrome and Gecko use this property.
   * @param {Error} ex
   * @return {?Object.<string, *>} Stack trace information.
   */
	function computeStackTraceFromStackProp(ex) {
		// ...
	}
	
  /**
   * Adds information about the first frame to incomplete stack traces.
   * Safari and IE require this to get complete data on the first frame.
   * @param {Object.<string, *>} stackInfo Stack trace information from
   * one of the compute* methods.
   * @param {string} url The URL of the script that caused an error.
   * @param {(number|string)} lineNo The line number of the script that
   * caused an error.
   * @param {string=} message The error generated by the browser, which
   * hopefully contains the name of the object that caused the error.
   * @return {boolean} Whether or not the stack information was
   * augmented.
   */
  function augmentStackTraceWithInitialElement(stackInfo, url, lineNo, message) {
		// ..
	}
	
  /**
   * Computes stack trace information by walking the arguments.caller
   * chain at the time the exception occurred. This will cause earlier
   * frames to be missed but is the only way to get any stack trace in
   * Safari and IE. The top frame is restored by
   * {@link augmentStackTraceWithInitialElement}.
   * @param {Error} ex
   * @return {?Object.<string, *>} Stack trace information.
   */
  function computeStackTraceByWalkingCallerChain(ex, depth) {
		// ...
	}	
	
	
  /**
   * Computes a stack trace for an exception.
   * @param {Error} ex
   * @param {(string|number)=} depth
   */
  function computeStackTrace(ex, depth) {
    var stack = null;
    depth = depth == null ? 0 : +depth;

    try {
      stack = computeStackTraceFromStackProp(ex); // 适用于Chrome和Gecko
      if (stack) {
        return stack;
      }
    } catch (e) {
      if (TraceKit.debug) {
        throw e;
      }
    }

    try {
      stack = computeStackTraceByWalkingCallerChain(ex, depth + 1); // 适用于Safari和IE
      if (stack) {
        return stack;
      }
    } catch (e) {
      if (TraceKit.debug) {
        throw e;
      }
    }
    return {
      name: ex.name,
      message: ex.message,
      url: getLocationHref()
    };
  }

  computeStackTrace.augmentStackTraceWithInitialElement = augmentStackTraceWithInitialElement;
  computeStackTrace.computeStackTraceFromStackProp = computeStackTraceFromStackProp;

  return computeStackTrace;
})();
```

整个`TraceKit.computeStackTrace`会挨个尝试用不同方法来解析堆栈，先尝试适用于Chrome的套路，不行再尝试适用于Safari或IE的，如果还是不行就手动构造。我们的重点放在适用于Chrome的`computeStackTraceFromStackProp`。

### computeStackTraceFromStackProp

说实话这个函数的实现没有怎么看，涉及到奇怪的很多正则，整个函数的代码很多，大致的逻辑是先把错误堆栈信息按换行符切割，然后针对每一行提取各种信息：

* `url` 错误的文件url
* `func` 错误的函数
* `args` 调用的参数
* `line` 行
* `column` 列

最后如果`url`是以`blob:`开头的，会尝试通过相关链接拉取真正的`url`:

```js
// NOTE: blob urls are now supposed to always have an origin, therefore it's format
    // which is `blob:http://url/path/with-some-uuid`, is matched by `blob.*?:\/` as well

// ...

var xhr = new XMLHttpRequest();
xhr.open('GET', element.url, false);
xhr.send(null);

// ... 

source = source.slice(-300);

// Now we dig out the source map URL
var sourceMaps = source.match(/\/\/# sourceMappingURL=(.*)$/);

// If we don't find a source map comment or we find more than one, continue on to the next element.
if (sourceMaps) {
	var sourceMapAddress = sourceMaps[1];

	// Now we check to see if it's a relative URL.
	// If it is, convert it to an absolute one.
	if (sourceMapAddress.charAt(0) === '~') {
		sourceMapAddress = getLocationOrigin() + sourceMapAddress.slice(1);
	}
	
	// Now we strip the '.map' off of the end of the URL and update the
	// element so that Sentry can match the map to the blob.
	element.url = sourceMapAddress.slice(0, -4);
}
```

最后不管怎么样，我们会拿到一个『归一化』的堆栈信息，最后交由了`handler`处理，接下来看看我们注册的`handler`是如何处理的。


# _handleOnErrorStackInfo

我们的`handler`就是这个函数，跟踪这个函数会发现真正调用的是`_handleStackInfo`函数：

```js
  _handleStackInfo: function(stackInfo, options) {
    var frames = this._prepareFrames(stackInfo, options); // 

    this._triggerEvent('handle', {
      stackInfo: stackInfo,
      options: options
    });

    this._processException(
      stackInfo.name,
      stackInfo.message,
      stackInfo.url,
      stackInfo.lineno,
      frames,
      options
    );
  },
```

`_processException`内部经过一系列处理，最终会调用`_send`方法，`_send`会把处理后的信息发送给`server`，发送时会先尝试使用`fetch api`，不兼容的话再使用`XHR`，此处代码不难。

**`_send`中一个重要的步骤就是携带上`_breadcrumbs`数组，这个数组记录了用户的行为轨迹**，后面会说到轨迹是在什么时候被记录的。

可能会好奇，`server`的url怎么拿到的呢？是不是就是在`config`函数传入的那个url呢？好吧其实并不是，这个url需要经过一些处理才能拿到。

首先发送的url是存储在全局的`_globalEndpoint`中，他是在`setDSN`方法中被赋值：

```js
setDSN: function(dsn) {
    var self = this,
      uri = self._parseDSN(dsn),
      lastSlash = uri.path.lastIndexOf('/'),
      path = uri.path.substr(1, lastSlash);

    self._dsn = dsn;
    self._globalKey = uri.user;
    self._globalSecret = uri.pass && uri.pass.substr(1);
    self._globalProject = uri.path.substr(lastSlash + 1);

    self._globalServer = self._getGlobalServer(uri);

    self._globalEndpoint =
      self._globalServer + '/' + path + 'api/' + self._globalProject + '/store/';

    // Reset backoff state since we may be pointing at a
    // new project/server
    this._resetBackoff();
  }
```

参数中的`DSN`才是我们传给`config`的值，如果我们的`dsn`为`http://123456@sentry.io.com/5`,那么最终的`_globalEndpoint`就是`http://sentry.io.com/api/5/store`。


好，小结一下，**到目前为止我们知道`Raven`通过`TraceKit`这个库监听了`window.onerror`事件，并由`TraceKit`处理了复杂的错误信息并最终获得归一化的堆栈信息，然后`Raven`会拿着这个信息再经过一些处理最后发送给server端,发送的地址是由我们传入的配置决定的。**



# _attachPromiseRejectionHandler

捕捉未`catch`的`Promise`错误，然后会调用`captrueException`处理异常。这里会先调用`Tracekit.computeStackTrace`处理堆栈信息，然后调用`_handleStackInfo`.

```js
  /**
   * Installs the global promise rejection handler.
   *
   * @return {raven}
   */
  _attachPromiseRejectionHandler: function() {
    this._promiseRejectionHandler = this._promiseRejectionHandler.bind(this);
    _window.addEventListener &&
      _window.addEventListener('unhandledrejection', this._promiseRejectionHandler);
    return this;
  }
  
  
  /**
   * Callback used for `unhandledrejection` event
   *
   * @param {PromiseRejectionEvent} event An object containing
   *   promise: the Promise that was rejected
   *   reason: the value with which the Promise was rejected
   * @return void
   */
  _promiseRejectionHandler: function(event) {
	// ...
    this.captureException(event.reason, {
      extra: {
        unhandledPromiseRejection: true
      }
    });
  },
```

我们来看看`captureException`，他是用于手动发送错误到`server`。

## captureException

```js

  /**
   * Manually capture an exception and send it over to Sentry
   *
   * @param {error} ex An exception to be logged
   * @param {object} options A specific set of options for this error [optional]
   * @return {Raven}
   */
  captureException: function(ex, options) {
    options = objectMerge({trimHeadFrames: 0}, options ? options : {});

    if (isErrorEvent(ex) && ex.error) {
      // If it is an ErrorEvent with `error` property, extract it to get actual Error
      ex = ex.error;
    } else if (isDOMError(ex) || isDOMException(ex)) {
      // ...
    } else if (isError(ex)) {
      // we have a real Error object
      ex = ex;
    } else if (isPlainObject(ex)) {
      // If it is plain Object, serialize it manually and extract options
      // This will allow us to group events based on top-level keys
      // which is much better than creating new group when any key/value change
      options = this._getCaptureExceptionOptionsFromPlainObject(options, ex);
      ex = new Error(options.message);
    } else {
      // If none of previous checks were valid, then it means that
      // it's not a DOMError/DOMException
      // it's not a plain Object
      // it's not a valid ErrorEvent (one with an error property)
      // it's not an Error
      // So bail out and capture it as a simple message:
      return this.captureMessage(
        ex,
        objectMerge(options, {
          stacktrace: true, // if we fall back to captureMessage, default to attempting a new trace
          trimHeadFrames: options.trimHeadFrames + 1
        })
      );
    }

   // ...

    // TraceKit.report will re-raise any exception passed to it,
    // which means you have to wrap it in try/catch. Instead, we
    // can wrap it here and only re-raise if TraceKit.report
    // raises an exception different from the one we asked to
    // report on.
    try {
      var stack = TraceKit.computeStackTrace(ex);
      this._handleStackInfo(stack, options);
    } catch (ex1) {
      if (ex !== ex1) {
        throw ex1;
      }
    }

    return this;
  }
```

代码注释很详细了，可以看到`captureException`有两种出口：

* captureMessage： 与_handleStackInfo的过程类似，会手动发送一条信息给server
* _handleStackInfo： 前面已经介绍了，会经过一系列处理后把错误发送给后端

# _patchFunctionToString

用于将函数转为字符串：

```js
  _patchFunctionToString: function() {
    var self = this;
    self._originalFunctionToString = Function.prototype.toString;

    Function.prototype.toString = function() {
      if (typeof this === 'function' && this.__raven__) {
        return self._originalFunctionToString.apply(this.__orig__, arguments);
      }
      return self._originalFunctionToString.apply(this, arguments);
    };
  }
```

这里有个`__raven__`变量，如果有这个属性说明此函数是一个`wrapped function`，其`__orig__`表示原始函数。`__raven__`属性会在原函数被作用于`wrap`函数时赋值，`wrap`函数是一个很重要的函数，后面会说到。

# _instrumentTryCatch

这个函数用于包裹各种异步回调，例如`setTimeout`，将回调函数`wrap`住，`wrap`内部会使用`try-catch`包裹原始函数调用，并在出错时将信息发送给`server`。

```js

  /**
   * Wrap timer functions and event targets to catch errors and provide
   * better metadata.
   */
  _instrumentTryCatch: function() {
    var self = this;

    var wrappedBuiltIns = self._wrappedBuiltIns; // 一个内部数组

    function wrapTimeFn(orig) {
      return function(fn, t) {
        // preserve arity
        // Make a copy of the arguments to prevent deoptimization
        // https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#32-leaking-arguments
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; ++i) {
          args[i] = arguments[i];
        }
        var originalCallback = args[0];
        if (isFunction(originalCallback)) {
          args[0] = self.wrap(originalCallback);
        }

        // IE < 9 doesn't support .call/.apply on setInterval/setTimeout, but it
        // also supports only two arguments and doesn't care what this is, so we
        // can just call the original function directly.
        if (orig.apply) {
          return orig.apply(this, args);
        } else {
          return orig(args[0], args[1]);
        }
      };
    }

    var autoBreadcrumbs = this._globalOptions.autoBreadcrumbs;

    function wrapEventTarget(global) {
      var proto = _window[global] && _window[global].prototype;
      if (proto && proto.hasOwnProperty && proto.hasOwnProperty('addEventListener')) {
        fill(
          proto,
          'addEventListener',
          function(orig) {
            return function(evtName, fn, capture, secure) {
              // preserve arity
              try {
                if (fn && fn.handleEvent) {
                  fn.handleEvent = self.wrap(fn.handleEvent);
                }
              } catch (err) {
                // can sometimes get 'Permission denied to access property "handle Event'
              }

              // More breadcrumb DOM capture ... done here and not in `_instrumentBreadcrumbs`
              // so that we don't have more than one wrapper function
              var before, clickHandler, keypressHandler;

              if (
                autoBreadcrumbs &&
                autoBreadcrumbs.dom &&
                (global === 'EventTarget' || global === 'Node')
              ) {
                // NOTE: generating multiple handlers per addEventListener invocation, should
                //       revisit and verify we can just use one (almost certainly)
                clickHandler = self._breadcrumbEventHandler('click');
                keypressHandler = self._keypressEventHandler();
                before = function(evt) {
                  // need to intercept every DOM event in `before` argument, in case that
                  // same wrapped method is re-used for different events (e.g. mousemove THEN click)
                  // see #724
                  if (!evt) return;

                  var eventType;
                  try {
                    eventType = evt.type;
                  } catch (e) {
                    // just accessing event properties can throw an exception in some rare circumstances
                    // see: https://github.com/getsentry/raven-js/issues/838
                    return;
                  }
                  if (eventType === 'click') return clickHandler(evt);
                  else if (eventType === 'keypress') return keypressHandler(evt);
                };
              }
              return orig.call(
                this,
                evtName,
                self.wrap(fn, undefined, before),
                capture,
                secure
              );
            };
          },
          wrappedBuiltIns
        );
        fill(
          proto,
          'removeEventListener',
          function(orig) {
            return function(evt, fn, capture, secure) {
              try {
                fn = fn && (fn.__raven_wrapper__ ? fn.__raven_wrapper__ : fn);
              } catch (e) {
                // ignore, accessing __raven_wrapper__ will throw in some Selenium environments
              }
              return orig.call(this, evt, fn, capture, secure);
            };
          },
          wrappedBuiltIns
        );
      }
    }

    fill(_window, 'setTimeout', wrapTimeFn, wrappedBuiltIns);
    fill(_window, 'setInterval', wrapTimeFn, wrappedBuiltIns);
    if (_window.requestAnimationFrame) {
      fill(
        _window,
        'requestAnimationFrame',
        function(orig) {
          return function(cb) {
            return orig(self.wrap(cb));
          };
        },
        wrappedBuiltIns
      );
    }

    // event targets borrowed from bugsnag-js:
    // https://github.com/bugsnag/bugsnag-js/blob/master/src/bugsnag.js#L666
    var eventTargets = [
      'EventTarget',
      'Window',
      'Node',
      // ...
    ];
    for (var i = 0; i < eventTargets.length; i++) {
      wrapEventTarget(eventTargets[i]);
    }
  }
```

上面代码主要做了两件事：

1. 利用`fill+wrap`函数拦截了`setTimeout`、`setInterval`、`requestAnimationFrame`的实现，将其中的回调函数使用`try-catch`包裹，回调出错时使用`captureException`发送
2. 使用类似的技巧，内部也利用了`wrapEventTarget`函数拦截各种对象上的`addEventListener` 

`fill`和`wrap`定义如下：

```js
/**
 * Polyfill a method
 * @param obj object e.g. `document`
 * @param name method name present on object e.g. `addEventListener`
 * @param replacement replacement function
 * @param track {optional} record instrumentation to an array
 */
function fill(obj, name, replacement, track) {
  if (obj == null) return;
  var orig = obj[name];
  obj[name] = replacement(orig);
  obj[name].__raven__ = true;
  obj[name].__orig__ = orig;
  if (track) {
    track.push([obj, name, orig]);
  }
}
```

大体来说，`fill`将`obj`上的`name`属性值替换成`replacement`，并使用`track`记录原始对应关系。

```js
  /*
     * Wrap code within a context and returns back a new function to be executed
     *
     * @param {object} options A specific set of options for this context [optional]
     * @param {function} func The function to be wrapped in a new context
     * @param {function} func A function to call before the try/catch wrapper [optional, private]
     * @return {function} The newly wrapped functions with a context
     */
  wrap: function(options, func, _before) {
    var self = this;
   // 一些递归出口.... 
   function wrapped() {
      var args = [],
        i = arguments.length,
        deep = !options || (options && options.deep !== false);

      if (_before && isFunction(_before)) {
        _before.apply(this, arguments);
      }

      // Recursively wrap all of a function's arguments that are
      // functions themselves.
      while (i--) args[i] = deep ? self.wrap(options, arguments[i]) : arguments[i];

      try {
        // Attempt to invoke user-land function
        // NOTE: If you are a Sentry user, and you are seeing this stack frame, it
        //       means Raven caught an error invoking your application code. This is
        //       expected behavior and NOT indicative of a bug with Raven.js.
        return func.apply(this, args);
      } catch (e) {
        self._ignoreNextOnError();
        self.captureException(e, options);
        throw e;
      }
    }

    // copy over properties of the old function
    for (var property in func) {
      if (hasKey(func, property)) {
        wrapped[property] = func[property];
      }
    }
    wrapped.prototype = func.prototype;

    func.__raven_wrapper__ = wrapped;
    // Signal that this function has been wrapped/filled already
    // for both debugging and to prevent it to being wrapped/filled twice
    wrapped.__raven__ = true;
    wrapped.__orig__ = func;

    return wrapped;
  },
```

`wrapped`会替换真正的原始回调，使用`try-catch`包裹原始函数调用，这样就能捕获错误了，整个过程我们的业务代码都是无感知的。

小结一下`_instrumentTryCatch`做的事情：

1. 利用`fill+wrap`函数拦截了`setTimeout`、`setInterval`、`requestAnimationFrame`的实现，将其中的回调函数使用`try-catch`包裹，回调出错时使用`captureException`发送
2. 使用类似的技巧，内部也利用了`wrapEventTarget`函数拦截各种对象上的`addEventListener`。 

# _instrumentBreadcrumbs

用于记录行为轨迹，包括路由切换、控制台日志、xhr/fetch请求、点击事件等，将轨迹放到全局`_breadcrumbs`数组中，之后发送server时会携带。

```js

  /**
   * Instrument browser built-ins w/ breadcrumb capturing
   *  - XMLHttpRequests
   *  - DOM interactions (click/typing)
   *  - window.location changes
   *  - console
   *
   * Can be disabled or individually configured via the `autoBreadcrumbs` config option
   */
  _instrumentBreadcrumbs: function() {
    var self = this;
    var autoBreadcrumbs = this._globalOptions.autoBreadcrumbs;

    var wrappedBuiltIns = self._wrappedBuiltIns;

    function wrapProp(prop, xhr) {
      if (prop in xhr && isFunction(xhr[prop])) {
        fill(xhr, prop, function(orig) {
          return self.wrap(orig);
        }); // intentionally don't track filled methods on XHR instances
      }
    }
		
	// 记录xhr
    if (autoBreadcrumbs.xhr && 'XMLHttpRequest' in _window) {
      var xhrproto = _window.XMLHttpRequest && _window.XMLHttpRequest.prototype;
      fill(
        xhrproto,
        'open',
        function(origOpen) {
          return function(method, url) {
            // preserve arity

            // if Sentry key appears in URL, don't capture
            if (isString(url) && url.indexOf(self._globalKey) === -1) {
              this.__raven_xhr = {
                method: method,
                url: url,
                status_code: null
              };
            }

            return origOpen.apply(this, arguments);
          };
        },
        wrappedBuiltIns
      );

      fill(
        xhrproto,
        'send',
        function(origSend) {
          return function() {
            // preserve arity
            var xhr = this;

            function onreadystatechangeHandler() {
              if (xhr.__raven_xhr && xhr.readyState === 4) {
                try {
                  // touching statusCode in some platforms throws
                  // an exception
                  xhr.__raven_xhr.status_code = xhr.status;
                } catch (e) {
                  /* do nothing */
                }

                self.captureBreadcrumb({
                  type: 'http',
                  category: 'xhr',
                  data: xhr.__raven_xhr
                });
              }
            }

            var props = ['onload', 'onerror', 'onprogress'];
            for (var j = 0; j < props.length; j++) {
              wrapProp(props[j], xhr);
            }

            if ('onreadystatechange' in xhr && isFunction(xhr.onreadystatechange)) {
              fill(
                xhr,
                'onreadystatechange',
                function(orig) {
                  return self.wrap(orig, undefined, onreadystatechangeHandler);
                } /* intentionally don't track this instrumentation */
              );
            } else {
              // if onreadystatechange wasn't actually set by the page on this xhr, we
              // are free to set our own and capture the breadcrumb
              xhr.onreadystatechange = onreadystatechangeHandler;
            }

            return origSend.apply(this, arguments);
          };
        },
        wrappedBuiltIns
      );
    }
	// 记录fetch
    if (autoBreadcrumbs.xhr && supportsFetch()) {
      fill(
        _window,
        'fetch',
        function(origFetch) {
          return function() {
            // preserve arity
            // Make a copy of the arguments to prevent deoptimization
            // https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#32-leaking-arguments
            var args = new Array(arguments.length);
            for (var i = 0; i < args.length; ++i) {
              args[i] = arguments[i];
            }

            var fetchInput = args[0];
            var method = 'GET';
            var url;

            if (typeof fetchInput === 'string') {
              url = fetchInput;
            } else if ('Request' in _window && fetchInput instanceof _window.Request) {
              url = fetchInput.url;
              if (fetchInput.method) {
                method = fetchInput.method;
              }
            } else {
              url = '' + fetchInput;
            }

            // if Sentry key appears in URL, don't capture, as it's our own request
            if (url.indexOf(self._globalKey) !== -1) {
              return origFetch.apply(this, args);
            }

            if (args[1] && args[1].method) {
              method = args[1].method;
            }

            var fetchData = {
              method: method,
              url: url,
              status_code: null
            };

            return origFetch
              .apply(this, args)
              .then(function(response) {
                fetchData.status_code = response.status;

                self.captureBreadcrumb({
                  type: 'http',
                  category: 'fetch',
                  data: fetchData
                });

                return response;
              })
              ['catch'](function(err) {
                // if there is an error performing the request
                self.captureBreadcrumb({
                  type: 'http',
                  category: 'fetch',
                  data: fetchData,
                  level: 'error'
                });

                throw err;
              });
          };
        },
        wrappedBuiltIns
      );
    }

    // Capture breadcrumbs from any click that is unhandled / bubbled up all the way
    // to the document. Do this before we instrument addEventListener.
    if (autoBreadcrumbs.dom && this._hasDocument) {
      if (_document.addEventListener) {
        _document.addEventListener('click', self._breadcrumbEventHandler('click'), false);
        _document.addEventListener('keypress', self._keypressEventHandler(), false);
      } else if (_document.attachEvent) {
        // IE8 Compatibility
        _document.attachEvent('onclick', self._breadcrumbEventHandler('click'));
        _document.attachEvent('onkeypress', self._keypressEventHandler());
      }
    }

    // record navigation (URL) changes
    // NOTE: in Chrome App environment, touching history.pushState, *even inside
    //       a try/catch block*, will cause Chrome to output an error to console.error
    // borrowed from: https://github.com/angular/angular.js/pull/13945/files
    var chrome = _window.chrome;
    var isChromePackagedApp = chrome && chrome.app && chrome.app.runtime;
    var hasPushAndReplaceState =
      !isChromePackagedApp &&
      _window.history &&
      _window.history.pushState &&
      _window.history.replaceState;
    if (autoBreadcrumbs.location && hasPushAndReplaceState) {
      // TODO: remove onpopstate handler on uninstall()
      var oldOnPopState = _window.onpopstate;
      _window.onpopstate = function() {
        var currentHref = self._location.href;
        self._captureUrlChange(self._lastHref, currentHref);

        if (oldOnPopState) {
          return oldOnPopState.apply(this, arguments);
        }
      };

      var historyReplacementFunction = function(origHistFunction) {
        // note history.pushState.length is 0; intentionally not declaring
        // params to preserve 0 arity
        return function(/* state, title, url */) {
          var url = arguments.length > 2 ? arguments[2] : undefined;

          // url argument is optional
          if (url) {
            // coerce to string (this is what pushState does)
            self._captureUrlChange(self._lastHref, url + '');
          }

          return origHistFunction.apply(this, arguments);
        };
      };

      fill(_window.history, 'pushState', historyReplacementFunction, wrappedBuiltIns);
      fill(_window.history, 'replaceState', historyReplacementFunction, wrappedBuiltIns);
    }
		
		// 记录控制台记录
    if (autoBreadcrumbs.console && 'console' in _window && console.log) {
      // console
      var consoleMethodCallback = function(msg, data) {
        self.captureBreadcrumb({
          message: msg,
          level: data.level,
          category: 'console'
        });
      };

      each(['debug', 'info', 'warn', 'error', 'log'], function(_, level) {
        wrapConsoleMethod(console, level, consoleMethodCallback);
      });
    }
  },
```

里面有几个辅助函数，这里稍作说明，每个辅助函数的代码都比较好理解。

* `captureBreadcrumb`： 将参数对象放到全局的`_breadcrumbs`数组中，在此之前如果用户设置了`breadcrumbCallback`，会先把参数给此`callback`处理一下。`_breadcrumbs`会在`_send`中被发送到后端，`_send`会由`_processException`或`captureMessage`调用，其中`_processException`会由`_handleStackInfo`调用.所以可以认为`captureBreadcrumb`中的`_breadcrumbs`会在之后向后台发送错误时携带上.

* `_breadcrumbEventHandler`：记录发生`dom`事件时，事件目标节点的在`dom tree`中的路径（如果重复触发多次则只记录第一次）。路径只记录从当前节点到最高5级父节点，最终格式为`....grandparent>parent>node`. 获取的路径最后也是由`captureBreadcrumb`处理.

* `_keypressEventHandler`： 主要是记录`input/textarea`上的`keypress`事件，`_breadcrumbEventHandler`更多的是针对鼠标事件。`keypress`事件通过`1000ms`的`debounce`做了截流，最终还是会调用`_breadcrumbEventHandler`记录路径.

* `_captureUrlChange`：对之前和现在的`url`进行一些处理后，交由`captureBreadcrumb`处理.



如果理解了`_instrumentTryCatch`的套路，那么理解`_instrumentBreadcrumbs`就会简单很多，因为他们都是通过`fill+wrap`的组合来做到这些。

小结一下`_instrumentTryCatch`做的事情：

1. 拦截`popstate`、`pushState`、`replaceState`，利用`_captureUrlChange`函数记录当前`url`
2. 拦截`console`上的`debug`, `info`, `warn`, `error`, `log`，利用`captureBreadcrumb`记录调用参数
3. 拦截`xhr`，在`open`时利用`__raven_xhr`变量记录发送的`url+method`，在`send`时
   1. 使用`wrap`包裹`onload`, `onerror`, `onprogress`的回调，使用`try-catch`抓错
   2. 在`onreadystatechange`时，使用`captureBreadcrumb`记录本次请求的`url+method+status_code`
4. 拦截`fetch`，使用与拦截`xhr`类似的技巧，在`fetch`成功或失败时记录本次请求
5.  拦截冒泡到`document`上的`click`、`keypress`事件，使用`_breadcrumbEventHandler`、`_keypressEventHandler`处理


# _drainPlugins

跟前面的几个比起来，这个算很简单的了，就是拿到内部插件数组中的每个插件安装一下：

```js
  _drainPlugins: function() {
    var self = this;

    each(this._plugins, function(_, plugin) {
      var installer = plugin[0]; // 插件函数
      var args = plugin[1]; // 插件函数的参数
      installer.apply(self, [self].concat(args));
    });
  },
```


# 总结

`Raven`通过各种方法来捕获错误，同时记录行为轨迹，所有的方式列举如下：

*	`TraceKit`：监听全局`window.error`事件，处理错误堆栈信息后发送给`Sentry Server`

*	`_attachPromiseRejectionHandler`：捕捉未`catch`的`Promise`错误，处理后发送`server`

*	`_breadcrumbEventHandler`：记录发生`dom`事件时目标节点的路径，并在下次发送`server`时携带

*	`_keypressEventHandler`：记录`input/textarea`上的`keypress`事件，`1000ms`截流，最终调用`_breadcrumbEventHandler`

*	`captureMessage`、`captureException`：手动发送错误到`server`

*	`_instrumentTryCatch`： 
	1.	拦截了`setTimeout`、`setInterval`、`requestAnimationFrame`的实现，将其中的回调函数使用`try-catch`包裹，回调出错时使用`captureException`发送
	2.	拦截`Window`等多个对象上的`addEventListener`，同样使用上面的方式包裹

*	`_instrumentBreadcrumbs`，记录各种操作，存为『面包屑』，并在下次发送`server`时携带
	
	1.	拦截`popstate`、`pushState`、`replaceState`，利用记录当前`url`
	
	2.	拦截`console`上的`debug`, `info`, `warn`, `error`, `log`，记录调用方法和参数
	
	3.	拦截`xhr`，在`open`时记录发送的`url+method`，在`send`时
		1.	 包裹`onload`, `onerror`, `onprogress`的回调，使用`try-catch`抓错
		2.	 在`onreadystatechange`时，记录本次请求的`url+method+status_code`

	4.	拦截`fetch`，使用与拦截`xhr`类似的技巧，在`fetch`成功或失败时记录本次请求

	5.	拦截冒泡到`document`上的`click、keypress`事件，使用`_breadcrumbEventHandler`、`_keypressEventHandler`处理

*	`RavenVuePlugin`: 设置`Vue.config.errorHandler`，并将错误交由`captureException`处理


