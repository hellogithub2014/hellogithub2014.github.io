---
title: 'tapable源码解析1-内部逻辑处理'
summary_img: /images/sweden.jpg # Add image post (optional)
date: 2018-12-07 12:20:00

tag: [Tabpable, javascript]
---

最近在尝试学习`webpack`的源码，其实很早前就知道`webpack`的`plugin`体系核心是[`tapable`](https://github.com/webpack/tapable)，然后在`webpack`的入口代码里就看到了它的身影，索性先来研读下`tapable`的内部原理，这篇文章就是用来帮助大家理解它。

直接看仓库的`readme`其实还是挺抽象的，容易被那些钩子概念弄晕，所以这篇文章会针对每个钩子举一些例子，并将`tapable`在内部的相应运行代码贴出来，个人经验觉得这样对于理解各个钩子帮助很大。

个人在学习源码时参考了[`掘金上的这篇博客`](https://juejin.im/post/5abf33f16fb9a028e46ec352#heading-13)

# 概念

`tapable`可以理解为一个高级的事件发布订阅系统。相信很多人或多或少知道观察者模式实现的事件监听模型，例如`window.addEventListeners`或`vue`里的`$emit、$on`，他们的共同特点是所有的事件回调之间完全独立，针对一个特定`event`的回调函数列表在调用时是顺序同步执行的。

`tapable`打破了这一限制，扩展了事件订阅和发布的各种执行时机，包括同步顺序执行、异步顺序执行、异步并行执行等等，同时回调函数之间也可以进行一定程度关联，例如`BailHook`可以将前一个回调函数的返回值当做后一个回调函数的入参。

`tapable`包含的钩子类型有：

- `SyncHook`
- `SyncBailHook`
- `SyncWaterfallHook`
- `SyncLoopHook`
- `AsyncParallelHook`
- `AsyncParallelBailHook`
- `AsyncSeriesHook`
- `AsyncSeriesBailHook`
- `AsyncSeriesWaterfallHook`

上述以`Async`开头的是异步钩子，异步又分为并发执行和串行执行，`Sync`开头的是同步钩子，用一个图来分类：

![https://user-gold-cdn.xitu.io/2018/3/31/1627c9c828c20aa1?imageView2/0/w/1280/h/960/format/webp/ignore-error/1](https://user-gold-cdn.xitu.io/2018/3/31/1627c9c828c20aa1?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)

另外先简要总结下各个钩子的用法：

| 钩子名称                   | 执行方式 | 作用顺序                                                                                                                               |
| -------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `SyncHook`                 | 同步串行 | 监听函数之间完全独立                                                                                                                   |
| `SyncBailHook`             | 同步串行 | 上一个回调函数的返回值如果不为空，后面的回调就再也不会执行                                                                             |
| `SyncWaterfallHook`        | 同步串行 | 上一个回调函数的返回值如果不为空，就会传给下一个回调函数当做参数                                                                       |
| `SyncLoopHook`             | 同步循环 | 只要某个监听的回调返回值不为空就会一直循环执行这个回调，直到返回空才会执行下一个回调                                                   |
| `AsyncParallelHook`        | 异步并行 | 只要前一个回调函数不抛异常，在执行完后就会顺序执行后一个回调。若抛异常，会直接执行`callAsync`等触发函数绑定的回调，并将异常当做参数    |
| `AsyncParallelBailHook`    | 异步并行 | 只要前一个回调的返回值不为空或者抛异常，就会直接执行`callAsync`等触发函数绑定的回调，后续的tap回调不会被执行                           |
| `AsyncSeriesHook`          | 异步串行 | 不关心每个tap回调参数的返回值，除非抛出异常会直接调用`callAsync`等触发函数绑定的回调,此时后续tap回调均不会执行                         |
| `AsyncSeriesBailHook`      | 异步串行 | 回调的返回值不为空，或者回调抛出异常，就会直接执行`callAsync`等触发函数绑定的回调函数                                                  |
| `AsyncSeriesWaterfallHook` | 异步串行 | 上一个监听函数的返回值, 可以作为下一个监听函数的参数。 如果监听函数报错，直接执行`callAsync`等触发函数绑定的回调,后续tap回调不会被执行 |

上述的异步钩子在注册监听和触发时有多种组合，这里会讲述3种：

- `tap` <--> `callAsync`
- `tapAsync` <---> `callAsync`
- `tapPromise` <---> `promise`

# 主体逻辑

各个钩子最后都是生成一段匿名函数来执行的，生成这段函数的代码视钩子不同而不同，这里会以最简单的`SyncHook`为例，其他的钩子都类似，大家自己去看就好。

我们所用的测试代码为：

```js
const { SyncHook } = require("tapable");
// 所有的构造函数都接收一个可选的参数，这个参数是一个字符串的数组，表示所有注册的监听函数会接收的参数
let queue = new SyncHook(["name"]);

// 各个钩子回调顺序执行，回调之间没有关联

queue.tap( "1", function( name) {
	// tap 的第一个参数是用来标识订阅的函数的
  console.log(name, 1);
	return "1";
});

queue.tap("2", function(name) {
	console.log(name, 2);
});

// 发布
queue.call("webpack");
```

上述代码的执行结果为：

```js
webpack 1
webpack 2
```

## 初始化

我们从入口`SyncHook`着手:

```js
class SyncHook extends Hook {
	tapAsync() {
		throw new Error("tapAsync is not supported on a SyncHook");
	}

	tapPromise() {
		throw new Error("tapPromise is not supported on a SyncHook");
	}

	compile(options) {
		factory.setup(this, options);
		return factory.create(options);
	}
}
```

看到继承了`Hook`父类：

```js
class Hook {
	constructor(args) {
		if (!Array.isArray(args)) args = [];
		this._args = args;
		this.taps = [];
		this.call = this._call;
		this._x = undefined;
    // ...
	}

	compile(options) {
		throw new Error("Abstract: should be overriden");
	}

	_createCall(type) {
		// ...
	}

  // 注册事件监听回调
	tap(options, fn) {
		// ...
	}

  tapAsync(options, fn) {
    // ...
  },
  tapPromise(options, fn) {
    // ...
  },

  // ...

	_resetCompilation() {
		// ...
	}

	_insert(item) {
		// ...
	}
}
```

省略了一些无关代码，可以看到`new SyncHook`并没有做什么事，只是一些变量的初始化。`SyncHook.prototype.tap`会开始注册事件监听：

## 注册监听

```js
tap(options, fn) {
		if (typeof options === "string") options = { name: options };
		if (typeof options !== "object" || options === null)
			throw new Error(
				"Invalid arguments to tap(options: Object, fn: function)"
			);
		if (typeof options.name !== "string" || options.name === "")
			throw new Error("Missing name for tap");
		if (typeof options.context !== "undefined") deprecateContext();
		options = Object.assign({ type: "sync", fn: fn }, options);
		options = this._runRegisterInterceptors(options);
		this._insert(options);
	}
```

`tap`的第一个参数可以是字符串或对象，最后我们的`options`通常包含3个属性：

```js
options = {
  type: String,
  name: String,
  fn: (...args) => any
}
```

有了这3个属性，我们就知道每个事件监听的基本信息。之后的`_insert`会将这个事件监听插入到内部的`taps`数组中：

```js
	_insert(item) {
		this._resetCompilation();
    // before、stage属性我们先略过。。。
		let before;
		if (typeof item.before === "string") {
			before = new Set([item.before]);
		} else if (Array.isArray(item.before)) {
			before = new Set(item.before);
		}
		let stage = 0;
		if (typeof item.stage === "number") {
			stage = item.stage;
		}
		let i = this.taps.length;
    // 插入排序
		while (i > 0) {
			i--;
			const x = this.taps[i];
			this.taps[i + 1] = x;
			const xStage = x.stage || 0;
			if (before) {
				if (before.has(x.name)) {
					before.delete(x.name);
					continue;
				}
				if (before.size > 0) {
					continue;
				}
			}
			if (xStage > stage) {
				continue;
			}
			i++;
			break;
		}
		this.taps[i] = item;
	}
}
```

`_insert`会将`taps`数组按照`stage`字段升序，这样我们的注册步骤就完成了，其他的两种注册方式`tapAsync`、`tapPromise`类似就不说了。

## 触发回调

`Hook.prototype.call`用于触发回调，类似的还有`callAsync`、`promise`，这里我们只说`call`。

```js
function createCompileDelegate(name, type) {
	return function lazyCompileHook(...args) {
		this[name] = this._createCall(type);
		return this[name](...args);
	};
}

Object.defineProperties(Hook.prototype, {
	_call: {
		value: createCompileDelegate("call", "sync"),
		configurable: true,
		writable: true
	},
	_promise: {
		value: createCompileDelegate("promise", "promise"),
		configurable: true,
		writable: true
	},
	_callAsync: {
		value: createCompileDelegate("callAsync", "async"),
		configurable: true,
		writable: true
	}
});
```

`_createCall`用于生成每种钩子的匿名调用函数，然后我们调用`call`时传入的参数会透传给这个匿名函数。

```js
	_createCall(type) {
		return this.compile({
			taps: this.taps, // tap、tapPromsie、tapAsync的事件监听对象，通常包含type、fn、name 3个成员
			interceptors: this.interceptors,
			args: this._args, // new Hook时传入的数组
			type: type // sync、promise、async 3种
		});
	}
```

此处`compile`就是各种钩子的差别了，这里我们还是以`SyncHook`为例：

```js
class SyncHookCodeFactory extends HookCodeFactory {
	content({ onError, onResult, onDone, rethrowIfPossible }) {
		return this.callTapsSeries({
			onError: (i, err) => onError(err),
			onDone,
			rethrowIfPossible
		});
	}
}

const factory = new SyncHookCodeFactory();

class SyncHook extends Hook {
	compile(options) {
		factory.setup(this, options);
		return factory.create(options);
	}
}
```

看到内部调用了`HookCodeFactory`的`setup`和`create`方法，只能继续往下看了。。。

```js
class HookCodeFactory {
  setup(instance, options) {
    // t.fn是每个事件监听函数，t通常还包含name和type两个属性
		instance._x = options.taps.map(t => t.fn);
	}

	create(options) {
		this.init(options);
		let fn;
		switch (this.options.type) {
			case "sync":
				fn = new Function(
					this.args(),
					'"use strict";\n' +
						this.header() +
            // content随不同钩子的不同调用方式不同，构造生成函数的主体部分
						this.content({
							onError: err => `throw ${err};\n`,
							onResult: result => `return ${result};\n`,
							onDone: () => "",
							rethrowIfPossible: true
						})
				);
				break;
			// ...
		}
		this.deinit();
		return fn;
	}

  /**
	 * @param {{ type: "sync" | "promise" | "async", taps: Array<Tap>, interceptors: Array<Interceptor> }} options
	 */
	init(options) {
		this.options = options;
		this._args = options.args.slice();
	}
}
```

最后返回的`fn`就是我们真正会调用的匿名函数，它是先用字符串拼接然后`new Function`构造而成。

匿名函数由3个部分组成，`args()`用于生成参数列表，`header()`用于生成一些初始化语句，`content()`是函数的主体部分。

**args**：

```js
  // 构造生成函数的参数
	args({ before, after } = {}) {
		let allArgs = this._args;
		if (before) allArgs = [before].concat(allArgs);
		if (after) allArgs = allArgs.concat(after);
		if (allArgs.length === 0) {
			return "";
		} else {
			return allArgs.join(", ");
		}
	}
```

在我们的测试代码中，最后会返回`"name"`这个字符串。

**header**：

```js
  // 构造生成函数的一些初始化语句
	header() {
		let code = "";
		if (this.needContext()) {
      // context特定即将废弃，这里可以认为始终为false
			code += "var _context = {};\n";
		} else {
			code += "var _context;\n";
		}
		code += "var _x = this._x;\n";

    // 暂且忽略interceptors...

		return code;
	}
```

嗯，`args`和`header`都很简单，随后就是最复杂的`content`部分了：

```js
class SyncHookCodeFactory extends HookCodeFactory {
	content({ onError, onResult, onDone, rethrowIfPossible }) {
		return this.callTapsSeries({
			onError: (i, err) => onError(err),
			onDone,
			rethrowIfPossible
		});
	}
}
```

内部调用了`HookCodeFactory.prototype.callTapsSeries`：

```js
	callTapsSeries({ onError, onResult, onDone, rethrowIfPossible }) {
		if (this.options.taps.length === 0) return onDone();
		const firstAsync = this.options.taps.findIndex(t => t.type !== "sync");
		const next = i => {
			if (i >= this.options.taps.length) {
				return onDone();
			}
			const done = () => next(i + 1);
			const doneBreak = skipDone => {
				if (skipDone) return "";
				return onDone();
			};
			return this.callTap(i, {
				onError: error => onError(i, error, done, doneBreak),
				onResult:
					onResult &&
					(result => {
						return onResult(i, result, done, doneBreak);
					}),
				onDone:
					!onResult &&
					(() => {
						return done();
					}),
				rethrowIfPossible:
					rethrowIfPossible && (firstAsync < 0 || i < firstAsync)
			});
		};
		return next(0);
	}


	callTap(tapIndex, { onError, onResult, onDone, rethrowIfPossible }) {
		let code = "";
		let hasTapCached = false;
		// interceptors暂且忽略。。。
		code += `var _fn${tapIndex} = ${this.getTapFn(tapIndex)};\n`;
		const tap = this.options.taps[tapIndex];
		switch (tap.type) {
			case "sync":
				if (!rethrowIfPossible) {
					code += `var _hasError${tapIndex} = false;\n`;
					code += "try {\n";
				}
				if (onResult) {
					code += `var _result${tapIndex} = _fn${tapIndex}(${this.args({
						before: tap.context ? "_context" : undefined
					})});\n`;
				} else {
					code += `_fn${tapIndex}(${this.args({
						before: tap.context ? "_context" : undefined
					})});\n`;
				}
				if (!rethrowIfPossible) {
					code += "} catch(_err) {\n";
					code += `_hasError${tapIndex} = true;\n`;
					code += onError("_err");
					code += "}\n";
					code += `if(!_hasError${tapIndex}) {\n`;
				}
				if (onResult) {
					code += onResult(`_result${tapIndex}`);
				}
				if (onDone) {
					code += onDone();
				}
				if (!rethrowIfPossible) {
					code += "}\n";
				}
				break;
			// async和promise忽略。。。
		}
		return code;
	}
```

以上代码很容易看晕，基本上是不断的调用`next`函数，从`next(0)`开始生成执行第一个事件监听的代码，随后`next(1)`生成第二个。。。

最后我们生成的`fn`匿名函数为：

```js
function anonymous ( name) {
  "use strict";
  var _context;
  var _x = this._x;
  var _fn0 = _x[ 0 ];
  _fn0( name );
  var _fn1 = _x[ 1 ];
  _fn1( name );
}
```

也就是说我们示范代码中的`queue.call("webpack")`最终是执行`anonymous('webpack')`，`_x`是每个具体的监听函数数组，如第一次调用`tap`时传入的：

```js
function( name) {
  console.log(name, 1);
	return "1";
}
```

所以`SyncHook`生成的匿名函数逻辑就是同步顺序执行各个`tap`回调函数。

# interceptor

可以监听钩子的各个生命周期，按照官网的解释，一个`interceptor`是一个对象，可以包含的成员有：

- `call: (...args) => void` 在事件监听函数执行前被调用，获得的`args`参数与监听函数相同，每个`interceptor`只会调用一次`call`
- `tap: (tap: Tap) => void` 在`HookCodeFactory.prototype.callTap`中生成，针对每个回调均会调用一次。
- `loop: (...args) => void` 用于`LoopHook`
- `register: (tap: Tap) => Tap | undefined` 在注册事件监听回调时被调用。

上面的`tapInfo`对象是`Hook.tapXXX`时构造的，通常包含`name、type、fn` 3个成员。

我们先看看添加了`interceptor`后的匿名函数变成什么样,需要修改测试代码

```js
queue.tap( "tap1", function( name) {
	// tap 的第一个参数是用来标识订阅的函数的
  console.log(name, 1);
	return "1";
});

queue.tap("tap2", function(name) {
	console.log(name, 2);
});

queue.intercept( {
  // tapInfo是Hook.tapXXX时构造的，包含name、type、fn3个参数
  tap: ( tapInfo ) => {
    console.log( `${tapInfo.name1}：`, tapInfo );
  },
  call: ( name ) => {
    console.log( `intercept call, ${name}` );
  },
  register: ( tapInfo ) => {
    console.log( `intercept register ${ tapInfo.name}` );
    return tapInfo;
  }
} )

queue.intercept( {
  // tapInfo是Hook.tapXXX时构造的，包含name、type、fn3个参数
  tap: ( tapInfo ) => {
    console.log( `${tapInfo.name} taped` );
  },
  call: ( name ) => {
    console.log( `intercept called, ${name}` );
  },
  register: ( tapInfo ) => {
    console.log( `intercept register ${ tapInfo.name}` );
    return tapInfo;
  }
} )

// 发布
queue.call("webpack");
```

运行结果为：

```js
`
intercept register tap1
intercept register tap2
intercept called, webpack
tap1 taped
webpack 1
tap2 taped
webpack 2
`
```

可以看到先是触发了`interceptor`的`register`回调，随后执行了一次`call`回调，最后针对每个事件监听都执行了一次`tap`回调。接下来看看`tapable`内部分别是在什么时候处理了`interceptor`。

## Hook.prototype.intercept 添加新的interceptor

在`Hook.prototype.intercept`添加每一个`interceptor`，在此时会立即执行一次`register`：

```js
  /**
   * interceptor类似于切面，在钩子的register和call阶段分别会触发interceptor.register和call钩子
   *
   * @author liubin.frontend
   * @param {{
   *  call: (...params)=>void,
   *  register:(tap)=>Tap,
   *  loop: (...args) => void,
   *  tap: (tap: Tap) => void
   * }} interceptor
   * @memberof Hook
   */
  intercept(interceptor) {
		this._resetCompilation();
		this.interceptors.push(Object.assign({}, interceptor));
		if (interceptor.register) {
			for (let i = 0; i < this.taps.length; i++) {
        // 调用interceptor.register钩子
				this.taps[i] = interceptor.register(this.taps[i]);
			}
		}
	}
```

## Hook.prototype.tapXXX新注册的事件监听接受老的interceptor洗礼

在`Hook.prototype.tapXXX`中除了`_insert`外还执行了`_runRegisterInterceptors`，在这里会执行`register`回调：

```js
_runRegisterInterceptors(options) {
		for (const interceptor of this.interceptors) {
			if (interceptor.register) {
				const newOptions = interceptor.register(options);
				if (newOptions !== undefined) {
					options = newOptions;
				}
			}
		}
		return options;
	}
```

## HookCodeFactory.prototype.header执行interceptor.call

```js
// 构造生成函数的一些初始化语句
	header() {
		// ...
		for (let i = 0; i < this.options.interceptors.length; i++) {
			const interceptor = this.options.interceptors[i];
			if (interceptor.call) {
				code += `${this.getInterceptor(i)}.call(${this.args({
					before: interceptor.context ? "_context" : undefined
				})});\n`;
			}
		}
		return code;
	}
```

很容易可以看出来，每个`interceptor`会执行一次`call`钩子。

## HookCodeFactory.prototype.callTap执行interceptor.tap

```js
	callTap(tapIndex, { onError, onResult, onDone, rethrowIfPossible }) {
		let code = "";
		let hasTapCached = false;
		for (let i = 0; i < this.options.interceptors.length; i++) {
			const interceptor = this.options.interceptors[i];
			if (interceptor.tap) {
				if (!hasTapCached) {
					code += `var _tap${tapIndex} = ${this.getTap(tapIndex)};\n`; // 如 var _tap0 = _taps[0];
					hasTapCached = true;
				}
				code += `${this.getInterceptor(i)}.tap(${
					interceptor.context ? "_context, " : ""
				}_tap${tapIndex});\n`; // 如 _interceptors[0].tap( _tap0 )
			}
		}
    // ...
  }
```

每一个事件监听都会执行一次`callTap`，每一次`callTap`会挨个执行所有的`interceptors`的`tap`钩子。

# 小结

以上我们通过分析`tapable`的内部代码初步了解了其内部逻辑，虽然使用的是最简单的`SyncHook`作为示范，不过其他钩子也是遵照类似的逻辑，大家可以像上面那样将最终生成的匿名函数打印出来，这样就对每种钩子的运行逻辑非常清楚了。我会在下一篇文章挨个讲解每种钩子，会直接对照例子和生成的代码来帮助大家理解。