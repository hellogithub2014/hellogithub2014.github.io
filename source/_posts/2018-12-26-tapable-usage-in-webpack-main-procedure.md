---
title: tapable在webpack主流程中的应用
summary_img: /images/canyon.jpg
date: 2018-12-26 11:16:01
tags: [webpack, tapable]
---

前一阵子研究了`tapable`的实现后，就一直在学习`webpack`的源码。虽然事先有预料`tapable`在`webpack`中是非常核心的存在，但过了一遍主流程后，发现比运用的想象中更普遍。可以说整个`webpack`就是用`tapable`串联起来的。这篇文章主要是记录**webpack 主流程中的`tapable`运用，并不会涉及到非常细节的代码实现，因为我也没看完囧**。

`webpack`中的绝大部分功能都是通过注册事件监听实现的，如果把整个打包流程看成是一辆从起点到终点运行的火车，那么每个事件就相当于一个个途中站点，事件监听函数类似于需要在对应站点下车的行人，行人就是我们的一个个`Plugin`，注册事件监听类似于在 A 站点上车并且想要在 B 站点下车，事件触发类似于火车到达了 B 站点，行人下车该干嘛干嘛，`Plugin`也就在这时开始干活。`webpack`中涉及的站点和行人都非常多，想要挨个弄清楚需要花费很多精力，我自己也没有怎么研究，不过了解了主流程后，就可以按兴趣针对性学习了，此时会省很多时间。

# 流程图

整理了一个主流程图：![images/webpack/webpack-main-procedure.jpg](/images/webpack/webpack-main-procedure.jpg)

- 蓝色的节点表示触发了一个事件
- 黑色的节点表示调用了一个方法
- 竖直的泳道表示节点所属的对象或文件名
- 水平的泳道表示打包流程所属的阶段，整个过程可以分为 3 个阶段
  1. 编译准备阶段，主要是准备好各种配置项，初始化`Compiler`和`Compilation`对象
  2. 生成`modules`和`chunks`，可能一些人对二者的关系不是很清楚，`module`可以理解为一个打包产物的最小单元，比如一个`js`文件、一张图片；而一个`chunk`对应一个最终生成的文件，内部可能包含多个`module`；`chunk`与`module`是一对多的关系
  3. 生成打包产物，也就是一个个文件

上述只画了一部分的节点，实际上涉及到的类和节点要多得多，不过在清楚了这些后，探索其他内容时就那么迷糊了~ 以下所有的代码为了保持注意力，均会省去类似错误处理这样的旁支代码。

# 编译准备阶段

此阶段准备好各种配置项，初始化`Compiler`和`Compilation`对象。

首先整个打包的起点位于`webpack.js`中的`webpack`函数，以下是精简的部分：

```js
const webpack = (options, callback) => {
  // 校验options有效性
  const webpackOptionsValidationErrors = validateSchema(webpackOptionsSchema, options);
  if (webpackOptionsValidationErrors.length) {
    throw new WebpackOptionsValidationError(webpackOptionsValidationErrors);
  }
  let compiler;
  // 结合默认配置项完善options
  options = new WebpackOptionsDefaulter().process(options);

  compiler = new Compiler(options.context);
  compiler.options = options;
  new NodeEnvironmentPlugin().apply(compiler);
  // 注册用户自定义插件
  if (options.plugins && Array.isArray(options.plugins)) {
    for (const plugin of options.plugins) {
      if (typeof plugin === 'function') {
        plugin.call(compiler, compiler);
      } else {
        plugin.apply(compiler);
      }
    }
  }

  // 结合options来注册一大坨内置插件
  compiler.options = new WebpackOptionsApply().process(options, compiler);

  if (callback) {
    // watch选项
    if (options.watch === true || (Array.isArray(options) && options.some(o => o.watch))) {
      const watchOptions = Array.isArray(options) ? options.map(o => o.watchOptions || {}) : options.watchOptions || {};
      return compiler.watch(watchOptions, callback);
    }
    compiler.run(callback);
  }
  return compiler;
};
```

`WebpackOptionsDefaulter`继承了`OptionsDefaulter`类，它的`set`方法用于设置每一项的默认值，比如
`this.set("entry", "./src")`就是另`entry`的默认值为`./src`.

前半部分代码比较好懂，另外我们暂时不关注`watch`选项，所以接下来会调用`compiler.run`。在继续之前先看看`WebpackOptionsApply.process`：

```js
function process(options, compiler) {
  // ... 巨量插件

  new EntryOptionPlugin().apply(compiler);
  compiler.hooks.entryOption.call(options.context, options.entry);

  // 巨量插件。。。
}
```

应用插件的代码比较无趣都略过了，比较关键的是`EntryOptionPlugin`，它监听的事件恰好就是`compiler.hooks.entryOption`,所以监听函数会立马得到执行：

```js
const itemToPlugin = (context, item, name) => {
  if (Array.isArray(item)) {
    return new MultiEntryPlugin(context, item, name);
  }
  return new SingleEntryPlugin(context, item, name);
};

class EntryOptionPlugin {
  apply(compiler) {
    compiler.hooks.entryOption.tap('EntryOptionPlugin', (context, entry) => {
      if (typeof entry === 'string' || Array.isArray(entry)) {
        itemToPlugin(context, entry, 'main').apply(compiler);
      } else if (typeof entry === 'object') {
        for (const name of Object.keys(entry)) {
          itemToPlugin(context, entry[name], name).apply(compiler);
        }
      } else if (typeof entry === 'function') {
        new DynamicEntryPlugin(context, entry).apply(compiler);
      }
      return true;
    });
  }
}
```

很明显，针对我们配置的`entry`选项来应用不同的`Plugin`，以单入口`SingleEntryPlugin`为例，另外两个类似：

```js
class SingleEntryPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('SingleEntryPlugin', (compilation, { normalModuleFactory }) => {
      compilation.dependencyFactories.set(SingleEntryDependency, normalModuleFactory);
    });

    compiler.hooks.make.tapAsync('SingleEntryPlugin', (compilation, callback) => {
      const { entry, name, context } = this;

      const dep = SingleEntryPlugin.createDependency(entry, name);
      compilation.addEntry(context, dep, name, callback);
    });
  }

  static createDependency(entry, name) {
    const dep = new SingleEntryDependency(entry);
    dep.loc = { name };
    return dep;
  }
}
```

监听了两个很重要的事件钩子`compilation`和`make`,在我们的流程图里也有这两个钩子，等后续钩子触发我们再看具体的实现。

之后就是调用`compiler.run`：

```js
run(callback) {
    // 。。。
		const onCompiled = (err, compilation) => {
			// ...
		};
		this.hooks.beforeRun.callAsync(this, err => {
      // 。。。
			this.hooks.run.callAsync(this, err => {
        // 。。。
				this.readRecords(err => {
					// 。。。
					this.compile(onCompiled);
				});
			});
		});
	}
```

`beforeRun`和`run`两个钩子没有什么要特别注意的，最后调用了`compile`：

```js
compile(callback) {
		const params = this.newCompilationParams();
		this.hooks.beforeCompile.callAsync(params, err => {

			this.hooks.compile.call(params);

			const compilation = this.newCompilation(params);
			this.hooks.make.callAsync(compilation, err => {

				compilation.finish();
        // 此时compilation.moudles存放所有生成的modules

				compilation.seal(err => {

					this.hooks.afterCompile.callAsync(compilation, err => {
						return callback(null, compilation);
					});

				});
			});
		});
	}
```

`newCompilationParams`会实例化两个工厂类`NormalModuleFactory`、`ContextModuleFactory`，它们的`create`方法会创建`NormalModule`、`ContextModule`，通过这两个`Module`类我们可以将每个模块结合对应的`loader`转化为`js`代码。

```js
newCompilationParams() {
		const params = {
			normalModuleFactory: this.createNormalModuleFactory(),
			contextModuleFactory: this.createContextModuleFactory(),
			compilationDependencies: new Set()
		};
		return params;
	}
```

`newCompilation`用于创建一个`Compilation`对象，这个对象挂载了各种各样的构建产物，非常核心：

```js
newCompilation(params) {
		const compilation = this.createCompilation();
		compilation.fileTimestamps = this.fileTimestamps;
		compilation.contextTimestamps = this.contextTimestamps;
		compilation.name = this.name;
		compilation.records = this.records;
		compilation.compilationDependencies = params.compilationDependencies;
    this.hooks.thisCompilation.call( compilation, params ); // 最快能够获取到 Compilation 实例的任务点
		this.hooks.compilation.call(compilation, params);
		return compilation;
	}
```

注意在这里触发了`hooks.compilation`，还记得之前在`SingleEntryPlugin`注册了这个钩子吗？

```js
compiler.hooks.compilation.tap('SingleEntryPlugin', (compilation, { normalModuleFactory }) => {
  compilation.dependencyFactories.set(SingleEntryDependency, normalModuleFactory);
});
```

`dependencyFactories`是一个`Map`，用于记录`Dependency`与`ModuleFactory`之间的映射，在后续`hooks.make`钩子中会用到。

接下来就是`hooks.make`钩子了，我们的编译准备工作也做完了。

# 生成`modules`和`chunks`

`make`是代码分析的核心流程,包括创建模块、构建模块的工作，而构建模块步骤又包含了：

- `loader`来处理资源
- 处理后的`js`进行`AST`转换并分析语句
- 语句中发现的依赖关系再处理拆分成`dep`,即依赖`module`,形成依赖网
- `chunks` 生成，找到 `chunk` 所需要包含的 `modules`

`SingleEntryPlugin`也注册了`make`钩子：

```js
compiler.hooks.make.tapAsync('SingleEntryPlugin', (compilation, callback) => {
  const { entry, name, context } = this;

  const dep = SingleEntryPlugin.createDependency(entry, name);
  compilation.addEntry(context, dep, name, callback);
});
```

很简单，看看`addEntry`：

```js
  // 触发第一批 module 的解析，这些 module 就是 entry 中配置的模块。
	addEntry(context, entry, name, callback) {
		this.hooks.addEntry.call(entry, name);

		// ...
		this._addModuleChain(
			context,
			entry,
			module => {
				this.entries.push(module);
			},
			(err, module) => {
				if (module) {
					slot.module = module;
				} else {
					const idx = this._preparedEntrypoints.indexOf(slot);
					if (idx >= 0) {
						this._preparedEntrypoints.splice(idx, 1);
					}
				}
				this.hooks.succeedEntry.call(entry, name, module);
				return callback(null, module);
			}
		);
	}
```

基本上就是调用内部方法`_addModuleChain`，另外就是触发了 2 个钩子。

```js
function _addModuleChain(context, dependency, onModule, callback) {
  const Dep = /** @type {DepConstructor} */ (dependency.constructor);
  const moduleFactory = this.dependencyFactories.get(Dep);

  moduleFactory.create(
    {
      contextInfo: {
        issuer: '',
        compiler: this.compiler.name,
      },
      context: context,
      dependencies: [dependency],
    },
    (err, module) => {
      let afterFactory;

      const addModuleResult = this.addModule(module);
      module = addModuleResult.module;

      onModule(module);

      dependency.module = module;
      module.addReason(null, dependency);

      const afterBuild = () => {
        if (addModuleResult.dependencies) {
          this.processModuleDependencies(module, err => {
            callback(null, module);
          });
        } else {
          return callback(null, module);
        }
      };

      if (addModuleResult.build) {
        this.buildModule(module, false, null, null, err => {
          afterBuild();
        });
      }
    },
  );
}
```

`this.dependencyFactories.get(Dep)`就是我们在`compilation`钩子中注册的那个，对于`SingleEntryDependency`我们拿到的是`NormalModuleFactory`. 看看它的`create`方法：

```js
// lib/NormalModuleFactory.js

create(data, callback) {
		const dependencies = data.dependencies;
		const cacheEntry = dependencyCache.get(dependencies[0]);
		if (cacheEntry) return callback(null, cacheEntry);
		const context = data.context || this.context;
		const resolveOptions = data.resolveOptions || EMPTY_RESOLVE_OPTIONS;
		const request = dependencies[0].request;
		const contextInfo = data.contextInfo || {};
		this.hooks.beforeResolve.callAsync(
			{
				contextInfo,
				resolveOptions,
				context,
				request,
				dependencies
			},
			(err, result) => {
				if (err) return callback(err);

				// Ignored
				if (!result) return callback();

				const factory = this.hooks.factory.call(null);

				// Ignored
				if (!factory) return callback();

				factory(result, (err, module) => {
					if (err) return callback(err);

					if (module && this.cachePredicate(module)) {
						for (const d of dependencies) {
							dependencyCache.set(d, module);
						}
					}

					callback(null, module);
				});
			}
		);
	}
```

如果在`beforeResolve`钩子中返回`false`，则后续流程会被跳过，即此模块不会被打包。例如`IgnorePlugin`处理`moment`的打包问题就很典型：

测试发现`import moment`时会将所有`locale`都打包进了，追查发现在`moment`源码中有个函数可以执行导入,虽然默认不会执行:

```js
function loadLocale(name) {
  // ...
  require('./locale/' + name);
  //....
}
```

在`webpack`打包过程中，在解析完`moment`后发现有`locale`的依赖，就会去解析`locale`。 在`IgnorePlugin`中打断点发现会尝试解析 `./locale`（即`result.request`的值）:

```js
if ('resourceRegExp' in this.options && this.options.resourceRegExp && this.options.resourceRegExp.test(result.request)) {
  // ...
}
```

利用 `BundleAnalyzerPlugin` 可以很明显发现打包产物包含了所有 `locale` 文件。

解决办法，添加如下配置：

```js
new webpack.IgnorePlugin({
  resourceRegExp: /^\.\/locale$/,
  contextRegExp: /moment$/,
});
```

此时 `IgnorePlugin`会返回 `null`,这样我们就跳过了整个`locale`的打包。 (此插件注册了 `NormalModuleFactory` 和 `ContextModuleFactory` 的 `beforeResolve` 钩子，`locale` 的解析是在 `ContextModuleFactory` 的).

参考资料

- [ignore-plugin](https://webpack.js.org/plugins/ignore-plugin/)
- [moment issues](https://github.com/moment/moment/issues/2373)

以上就是`beforeResolve`的一个作用，接下来的`factory`钩子的监听函数中会生成`NormalModule`实例：

```js
this.hooks.factory.tap('NormalModuleFactory', () => (result, callback) => {
  // resolver解析 module 需要用到的一些属性，比如需要用到的 loaders, 资源路径 resource 等等，
  // 最终将解析完毕的参数传给 NormalModule 构建函数。
  let resolver = this.hooks.resolver.call(null);

  // Ignored
  if (!resolver) return callback();

  resolver(result, (err, data) => {
    // 此时的data就是module需要的那些属性对象
    if (err) return callback(err);

    // Ignored
    if (!data) return callback();

    // direct module
    if (typeof data.source === 'function') return callback(null, data);

    this.hooks.afterResolve.callAsync(data, (err, result) => {
      if (err) return callback(err);

      // Ignored
      if (!result) return callback();

      let createdModule = this.hooks.createModule.call(result);
      if (!createdModule) {
        if (!result.request) {
          return callback(new Error('Empty dependency (no request)'));
        }

        createdModule = new NormalModule(result);
      }

      createdModule = this.hooks.module.call(createdModule, result);

      return callback(null, createdModule);
    });
  });
});
```

传入`new NormalModule`的参数对象类型示范,这些数据是在`resolver`监听中生成的:

```js
result = {
  context,
  request,
  dependencies,
  userRequest,
  rawRequest,
  loaders,
  resource,
  matchResource,
  resourceResolveData,
  settings,
  type,
  parser,
  generator,
  resolveOptions,
};
```

生成了`NormalModule`后会回到`Compilation.prototype._addModuleChain`，并在随后调用`buildModule`方法并传入新创建的`NormalModule`：

```js
buildModule(module, optional, origin, dependencies, thisCallback) {
		let callbackList = this._buildingModules.get(module);
		if (callbackList) {
			callbackList.push(thisCallback);
			return;
		}
		this._buildingModules.set(module, (callbackList = [thisCallback]));

		const callback = err => {
			this._buildingModules.delete(module);
			for (const cb of callbackList) {
				cb(err);
			}
		};

		this.hooks.buildModule.call(module);
		module.build(
			this.options,
			this,
			this.resolverFactory.get("normal", module.resolveOptions),
			this.inputFileSystem,
			error => {
        // module.dependencies表示此module的所有依赖，例如require的其他module
				const originalMap = module.dependencies.reduce((map, v, i) => {
					map.set(v, i);
					return map;
				}, new Map());
				module.dependencies.sort((a, b) => {
					const cmp = compareLocations(a.loc, b.loc);
					if (cmp) return cmp;
					return originalMap.get(a) - originalMap.get(b);
				});

				this.hooks.succeedModule.call(module);
				return callback();
			}
		);
	}
```

核心还是`NormalModule.prototype.build`：

```js
build(options, compilation, resolver, fs, callback) {
		// ...
		return this.doBuild(options, compilation, resolver, fs, err => {
			const handleParseResult = result => {
				this._lastSuccessfulBuildMeta = this.buildMeta;
				this._initBuildHash(compilation);
				return callback();
			};

			try {
				const result = this.parser.parse(
					this._ast || this._source.source(),
					{
						current: this,
						module: this,
						compilation: compilation,
						options: options
					},
					(err, result) => {
						handleParseResult(result);
					}
				);
				if (result !== undefined) {
					// parse is sync
					handleParseResult(result);
				}
			}
		});
	}

doBuild(options, compilation, resolver, fs, callback) {
		const loaderContext = this.createLoaderContext(
			resolver,
			options,
			compilation,
			fs
		);
    // 使用module的loaders处理，得到转化后的js代码，放入_source属性中
		runLoaders(
			{
				resource: this.resource,
				loaders: this.loaders,
				context: loaderContext,
				readResource: fs.readFile.bind(fs)
			},
			(err, result) => {
				if (result) {
					this.buildInfo.cacheable = result.cacheable;
					this.buildInfo.fileDependencies = new Set(result.fileDependencies);
					this.buildInfo.contextDependencies = new Set(
						result.contextDependencies
					);
				}

				const resourceBuffer = result.resourceBuffer;
				const source = result.result[0];
				const sourceMap = result.result.length >= 1 ? result.result[1] : null;
				const extraInfo = result.result.length >= 2 ? result.result[2] : null;

				this._source = this.createSource(
					this.binary ? asBuffer(source) : asString(source),
					resourceBuffer,
					sourceMap
				);
				this._ast =
					typeof extraInfo === "object" &&
					extraInfo !== null &&
					extraInfo.webpackAST !== undefined
						? extraInfo.webpackAST
						: null;
				return callback();
			}
		);
	}
```

内部使用了`runLoaders`这个库来转化`module`，**如何确定每个`Module`对应的`loaders`呢？在初始化`NormalModuleFactory`时会解析`options.rules`得到一个`ruleSet`属性。 `ruleSet`会去匹配文件类型并结合`rules`找到需要的`loaders`。**

```js
// lib/NormalModuleFactory.js
constructor(context, resolverFactory, options) {
  // ...
  this.ruleSet = new RuleSet(options.defaultRules.concat(options.rules));
  this.hooks.resolver.tap("NormalModuleFactory", () => (data, callback) => {
    // 。。。
    const result = this.ruleSet.exec({
						resource: resourcePath,
						realResource:
							matchResource !== undefined
								? resource.replace(/\?.*/, "")
								: resourcePath,
						resourceQuery,
						issuer: contextInfo.issuer,
						compiler: contextInfo.compiler
					});
    // 。。。
  }
  // ...
}
```

`RuleSet`的解析过程比较复杂，主要是因为`rules`配置很灵活，还要兼容一些过时的配置方式，具体过程大家自行了解。

`runLoaders`在内部主要是读取`module`内容，再迭代`loaders`的处理方法，关键的代码有：

```js
// loader-runner/lib/LoaderRunner.js

function processResource(options, loaderContext, callback) {
  // set loader index to last loader
  loaderContext.loaderIndex = loaderContext.loaders.length - 1;

  var resourcePath = loaderContext.resourcePath;
  if (resourcePath) {
    loaderContext.addDependency(resourcePath);
    // 读取module内容
    options.readResource(resourcePath, function(err, buffer) {
      if (err) return callback(err);
      options.resourceBuffer = buffer;
      iterateNormalLoaders(options, loaderContext, [buffer], callback);
    });
  } else {
    iterateNormalLoaders(options, loaderContext, [null], callback);
  }
}

function iterateNormalLoaders(options, loaderContext, args, callback) {
  if (loaderContext.loaderIndex < 0) return callback(null, args);

  //当前的loader
  var currentLoaderObject = loaderContext.loaders[loaderContext.loaderIndex];

  // iterate
  if (currentLoaderObject.normalExecuted) {
    loaderContext.loaderIndex--;
    return iterateNormalLoaders(options, loaderContext, args, callback);
  }

  var fn = currentLoaderObject.normal;
  currentLoaderObject.normalExecuted = true;
  if (!fn) {
    return iterateNormalLoaders(options, loaderContext, args, callback);
  }

  convertArgs(args, currentLoaderObject.raw);

  // fn: function ( source, inputSourceMap ) { … }
  // 此处执行loader逻辑
  runSyncOrAsync(fn, loaderContext, args, function(err) {
    if (err) return callback(err);

    var args = Array.prototype.slice.call(arguments, 1);
    iterateNormalLoaders(options, loaderContext, args, callback);
  });
}
```

注释中也有写到，一个`loader`其实就是一个函数：`(source: string, inputSourceMap) => string`，比如`babel-loader`：

```js
function (source, inputSourceMap) {
    // Make the loader async
    const callback = this.async();
    loader.call(this, source, inputSourceMap, overrides).then(args => callback(null, ...args), err => callback(err));
  };
```

`doBuild`方法结束后会拿到`module`转化后的`js`代码，并在接下来使用`Parser.prototype.parse`方法将`js`转为`AST`。

```js
parse(source, initialState) {
		let ast;
		let comments;
		if (typeof source === "object" && source !== null) {
			ast = source;
			comments = source.comments;
		} else {
			comments = [];
			ast = Parser.parse(source, {
				sourceType: this.sourceType,
				onComment: comments
			});
		}

		const oldScope = this.scope;
		const oldState = this.state;
		const oldComments = this.comments;
		this.scope = {
			topLevelScope: true,
			inTry: false,
			inShorthand: false,
			isStrict: false,
			definitions: new StackedSetMap(),
			renames: new StackedSetMap()
		};
		const state = (this.state = initialState || {});
		this.comments = comments;
		if (this.hooks.program.call(ast, comments) === undefined) {
			this.detectStrictMode(ast.body);
			this.prewalkStatements(ast.body);
			this.walkStatements(ast.body);
		}
		this.scope = oldScope;
		this.state = oldState;
		this.comments = oldComments;
		return state;
	}
```

`Parser.parse`中是利用`acorn`这个第三方库来生成`AST`的，类似的还有`esprima`。

一个`Module`可能依赖其他`Module`，这需要逐个解析`AST`节点来确定，由于依赖的方式有很多种比如`require`、`require.ensure`、`import`等，对于每一种依赖都有对应的类例如`AMDRequireDependency`，依赖的形式如此之多以至于`webpack`专门建了一个`lib/dependencies`文件夹。

> 当 `parser` 解析完成之后，`module` 的解析过程就完成了。每个 `module` 解析完成之后，都会触发 `Compilation` 实例对象的任务点 `succeedModule`，我们可以在这个任务点获取到刚解析完的 `module` 对象。正如前面所说，`module` 接下来还要继续递归解析它的依赖模块，最终我们会得到项目所依赖的所有 `modules`。此时任务点 `make` 结束。注意`require.ensure`在`build`后被放入了`module.blocks`而不是`module.dependencies`。

接下来按照流程图我们会调用`Compilation`对象的`finish`和`seal`方法。`finish`很简单就触发了一个钩子，我们的重点放在`seal`上：

```js
seal(callback) {
		this.hooks.seal.call();

		this.hooks.beforeChunks.call();
    // 根据modules生成chunks。
    // webpack 中的 chunk 概念，要不就是配置在 entry 中的模块，要不就是动态引入（比如 require.ensure）的模块。
    // chunk 的生成算法：
    // 1. webpack 先将 entry 中对应的 module 都生成一个新的 chunk
    // 2. 遍历 module 的依赖列表，将依赖的 module 也加入到 chunk 中
    // 3. 如果一个依赖 module 是动态引入的模块，那么就会根据这个 module 创建一个新的 chunk，继续遍历依赖
    // 4. 重复上面的过程，直至得到所有的 chunks
		for (const preparedEntrypoint of this._preparedEntrypoints) {
			const module = preparedEntrypoint.module;
			const name = preparedEntrypoint.name;
			const chunk = this.addChunk(name);
			const entrypoint = new Entrypoint(name);
			entrypoint.setRuntimeChunk(chunk);
			entrypoint.addOrigin(null, name, preparedEntrypoint.request);
			this.namedChunkGroups.set(name, entrypoint);
			this.entrypoints.set(name, entrypoint);
			this.chunkGroups.push(entrypoint);

			GraphHelpers.connectChunkGroupAndChunk(entrypoint, chunk);
			GraphHelpers.connectChunkAndModule(chunk, module);

			chunk.entryModule = module;
			chunk.name = name;

			this.assignDepth(module); // 给module设置depth属性
		}
    // creates the Chunk graph from the Module graph
    // 在此时还只有一个入口chunk，处理完后动态引入的module会生成额外chunk
		this.processDependenciesBlocksForChunkGroups(this.chunkGroups.slice());
		this.sortModules(this.modules);
		this.hooks.afterChunks.call(this.chunks);

		this.hooks.optimize.call();


		this.hooks.afterOptimizeModules.call(this.modules);


		this.hooks.afterOptimizeChunks.call(this.chunks, this.chunkGroups);

		this.hooks.optimizeTree.callAsync(this.chunks, this.modules, err => {


			this.hooks.afterOptimizeTree.call(this.chunks, this.modules);


			this.hooks.afterOptimizeChunkModules.call(this.chunks, this.modules);

			const shouldRecord = this.hooks.shouldRecord.call() !== false;

			this.hooks.reviveModules.call(this.modules, this.records);
			this.hooks.optimizeModuleOrder.call(this.modules);
			this.hooks.advancedOptimizeModuleOrder.call(this.modules);
			this.hooks.beforeModuleIds.call(this.modules);
			this.hooks.moduleIds.call(this.modules);
			this.applyModuleIds();
			this.hooks.optimizeModuleIds.call(this.modules);
			this.hooks.afterOptimizeModuleIds.call(this.modules);

			this.sortItemsWithModuleIds();

			this.hooks.reviveChunks.call(this.chunks, this.records);
			this.hooks.optimizeChunkOrder.call(this.chunks);
			this.hooks.beforeChunkIds.call(this.chunks);
			this.applyChunkIds();
			this.hooks.optimizeChunkIds.call(this.chunks);
			this.hooks.afterOptimizeChunkIds.call(this.chunks);

			this.sortItemsWithChunkIds();

			if (shouldRecord) {
				this.hooks.recordModules.call(this.modules, this.records);
				this.hooks.recordChunks.call(this.chunks, this.records);
			}

			this.hooks.beforeHash.call();
      // 生成这次构建的 hash，同时每个chunk也会生成自己的chunkhash
			this.createHash();
			this.hooks.afterHash.call();

			if (shouldRecord) {
				this.hooks.recordHash.call(this.records);
			}

			this.hooks.beforeModuleAssets.call();
			this.createModuleAssets();
			if (this.hooks.shouldGenerateChunkAssets.call() !== false) {
				this.hooks.beforeChunkAssets.call();
        // 生成chunk代码文件放入compilation.assets
				this.createChunkAssets();
			}
			this.hooks.additionalChunkAssets.call(this.chunks);
			this.summarizeDependencies();
			if (shouldRecord) {
				this.hooks.record.call(this, this.records);
			}

			this.hooks.additionalAssets.callAsync(err => {
				if (err) {
					return callback(err);
				}
				this.hooks.optimizeChunkAssets.callAsync(this.chunks, err => {
					if (err) {
						return callback(err);
					}
					this.hooks.afterOptimizeChunkAssets.call(this.chunks);
					this.hooks.optimizeAssets.callAsync(this.assets, err => {
						if (err) {
							return callback(err);
						}
						this.hooks.afterOptimizeAssets.call(this.assets);
						if (this.hooks.needAdditionalSeal.call()) {
							this.unseal();
							return this.seal(callback);
						}
						return this.hooks.afterSeal.callAsync(callback);
					});
				});
			});
		});
	}
```

到了`seal`方法，我们已经处理了所有`Module`并统一打平放到了`compilation.modules`中，现在需要根据`modules`生成`chunks`，代码中放了一些大致流程的注释，内部的实现还是很复杂的。

`moduleId`和`chunkId`作用： 在`filename`的变换时会用到`[id]/[moduleid]`； `chunhHash`会用到`chunk id`; 生成的打包代码会将名称替换为`id`;

`createHash`的会生成`hash、moduleHash、chunkHash`,`hash`生成算法核心是`crypto.createHash + ‘md4’`。在随后的`createChunkAssets -> TemplatedPathPlugin`中替换`filename`、`chunkfileName`的`[hash]`、`[chunkhash]`.

## `modules`生成`chunks`

没有看完，这里记录掌握的东西。涉及到 3 个核心对象：

- `ChunkGroup`: 内部维护了 `chunks`、`children`、`parents`3 个数组，并添加了一系列方法来维护这 3 个数组。`chunks`表示这个`group`下面拥有多少`chunk`；
- `Chunk`：内部维护了 `groups`、`modules` 数组。`groups`表示此 `chunk` 存在于哪些 `chunkgroup` 中；`modules`表示此 `chunk` 内部含有多少 `module`
- `Module`：内部维护了 `chunks` 数组。`chunks`表示此 `module` 存在于哪些 `chunks` 当中。

`assignDepth`方法：从 entry 出发，为每个 module 添加一个 depth 属性

- `entry`的`depth`为 0
- 依赖的静态模块`depth` +1
- 动态模块的`depth`也是 +1
- 层级遍历

一些参考文档：

- [参考 1](https://medium.com/webpack/the-chunk-graph-algorithm-week-26-29-7c88aa5e4b4e)
- [参考 2](https://webpack.js.org/api/stats/)
- [参考 3](https://medium.com/webpack/webpack-4-code-splitting-chunk-graph-and-the-splitchunks-optimization-be739a861366)

生成了`chunks`之后，第二阶段就完成了，接下来就是生成打包产物阶段了。

# 生成打包产物

根据 `chunks` 生成最终文件，主要有三个步骤：

- 模板 `hash`
- 更新模板渲染 `chunk`
- 生成文件

> `Compilation` 在实例化的时候，就会同时实例化三个对象：`MainTemplate`、`ChunkTemplate`、`ModuleTemplate`。这三个对象是用来渲染 `chunk` 对象，得到最终代码的模板。第一个对应了在 `entry` 配置的入口 `chunk` 的渲染模板，第二个是动态引入的非入口 `chunk` 的渲染模板，最后是 `chunk` 中的 `module` 的渲染模板。

上面`seal`方法中调用的`createHash`就是用于生成模板`hash`的，`hash`包含两种：

- 本次构建的整体`hash`，用于替换`output`选项中的`[hash]`,如`[name].[hash].js`
- 每个`chunk`也会生成一个基于内容的`hash`，用于替换`output`选项中的`[chunkhash]`,如`[name].[chunkhash].js`

`createHash`的主要代码如下：

```js
	createHash() {
		const outputOptions = this.outputOptions;
		const hashFunction = outputOptions.hashFunction;
		const hashDigest = outputOptions.hashDigest;
		const hashDigestLength = outputOptions.hashDigestLength;
		const hash = createHash(hashFunction);
		if (outputOptions.hashSalt) {
			hash.update(outputOptions.hashSalt);
		}
		this.mainTemplate.updateHash(hash);
		this.chunkTemplate.updateHash(hash);
		for (const key of Object.keys(this.moduleTemplates).sort()) {
			this.moduleTemplates[key].updateHash(hash);
		}
		for (const child of this.children) {
			hash.update(child.hash);
		}
		for (const warning of this.warnings) {
			hash.update(`${warning.message}`);
		}
		for (const error of this.errors) {
			hash.update(`${error.message}`);
		}
		const modules = this.modules;
		for (let i = 0; i < modules.length; i++) {
			const module = modules[i];
			const moduleHash = createHash(hashFunction);
			module.updateHash(moduleHash);
			module.hash = moduleHash.digest(hashDigest);
			module.renderedHash = module.hash.substr(0, hashDigestLength);
		}
		// clone needed as sort below is inplace mutation
		const chunks = this.chunks.slice();
		/**
		 * sort here will bring all "falsy" values to the beginning
		 * this is needed as the "hasRuntime()" chunks are dependent on the
		 * hashes of the non-runtime chunks.
		 */
		chunks.sort((a, b) => {
			const aEntry = a.hasRuntime();
			const bEntry = b.hasRuntime();
			if (aEntry && !bEntry) return 1;
			if (!aEntry && bEntry) return -1;
			return byId(a, b);
		});
		for (let i = 0; i < chunks.length; i++) {
			const chunk = chunks[i];
      // 每个chunk也会生成自己的chunkhash
			const chunkHash = createHash(hashFunction);
			try {
				if (outputOptions.hashSalt) {
					chunkHash.update(outputOptions.hashSalt);
				}
				chunk.updateHash(chunkHash);
				const template = chunk.hasRuntime()
					? this.mainTemplate
					: this.chunkTemplate;
				template.updateHashForChunk(
					chunkHash,
					chunk,
					this.moduleTemplates.javascript,
					this.dependencyTemplates
				);
				this.hooks.chunkHash.call(chunk, chunkHash);
				chunk.hash = chunkHash.digest(hashDigest);
				hash.update(chunk.hash);
				chunk.renderedHash = chunk.hash.substr(0, hashDigestLength);
				this.hooks.contentHash.call(chunk);
			} catch (err) {
				this.errors.push(new ChunkRenderError(chunk, "", err));
			}
		}
		this.fullHash = hash.digest(hashDigest);
    // 本次构建的hash
		this.hash = this.fullHash.substr(0, hashDigestLength);
	}
```

`hash`生成后接下来就会利用`createChunkAssets`方法生成每个`chunk`的代码。

首先判断是否为`entry`来选择`Template`：

```js
// createChunkAssets()

const template = chunk.hasRuntime() ? this.mainTemplate : this.chunkTemplate;
```

然后生成文件名：

```js
// 根据配置中的 output.filename 来生成文件名称
file = this.getPath(filenameTemplate, fileManifest.pathOptions);
```

最后根据模板来拼接文件内容：

```js
const manifest = template.getRenderManifest({
  chunk,
  hash: this.hash,
  fullHash: this.fullHash,
  outputOptions,
  moduleTemplates: this.moduleTemplates,
  dependencyTemplates: this.dependencyTemplates,
});

// [{ render(), filenameTemplate, pathOptions, identifier, hash }]
for (const fileManifest of manifest) {
  source = fileManifest.render();
}
```

`render`方法其实是在`chunk`内容前后添加各种样板代码，例如`MainTemplate`:

```js
render(hash, chunk, moduleTemplate, dependencyTemplates) {
		// 前置启动代码
    const buf = this.renderBootstrap(
			hash,
			chunk,
			moduleTemplate,
			dependencyTemplates
		);

		let source = this.hooks.render.call(
			new OriginalSource(
				Template.prefix(buf, " \t") + "\n",
				"webpack/bootstrap"
			),
			chunk,
			hash,
			moduleTemplate,
			dependencyTemplates
		);
		if (chunk.hasEntryModule()) {
			source = this.hooks.renderWithEntry.call(source, chunk, hash);
		}

		chunk.rendered = true;
		return new ConcatSource(source, ";");
	}

  renderBootstrap(hash, chunk, moduleTemplate, dependencyTemplates) {
		const buf = [];
		buf.push(
			this.hooks.bootstrap.call(
				"",
				chunk,
				hash,
				moduleTemplate,
				dependencyTemplates
			)
		);
		buf.push(this.hooks.localVars.call("", chunk, hash));
		buf.push("");
		buf.push("// The require function");
		buf.push(`function ${this.requireFn}(moduleId) {`);
		buf.push(Template.indent(this.hooks.require.call("", chunk, hash)));
		buf.push("}");
		buf.push("");
		buf.push(
			Template.asString(this.hooks.requireExtensions.call("", chunk, hash))
		);
		buf.push("");
		buf.push(Template.asString(this.hooks.beforeStartup.call("", chunk, hash)));
		buf.push(Template.asString(this.hooks.startup.call("", chunk, hash)));
		return buf;
	}

  this.hooks.render.tap(
			"MainTemplate",
			(bootstrapSource, chunk, hash, moduleTemplate, dependencyTemplates) => {
				const source = new ConcatSource();
				source.add("/******/ (function(modules) { // webpackBootstrap\n");
				source.add(new PrefixSource("/******/", bootstrapSource));
				source.add("/******/ })\n");
				source.add(
					"/************************************************************************/\n"
				);
				source.add("/******/ (");
				source.add(
          // 遍历module生成代码
					this.hooks.modules.call(
						new RawSource(""),
						chunk,
						hash,
						moduleTemplate,
						dependencyTemplates
					)
				);
				source.add(")");
				return source;
			}
		);
```

`bootstrap`钩子在多个插件中有注册，例如`JsonpMainTemplatePlugin`中的部分示例：

```js
mainTemplate.hooks.bootstrap.tap('JsonpMainTemplatePlugin', (source, chunk, hash) => {
  if (needChunkLoadingCode(chunk)) {
    const withDefer = needEntryDeferringCode(chunk);
    const withPrefetch = needPrefetchingCode(chunk);
    return Template.asString([
      source,
      '',
      '// install a JSONP callback for chunk loading',
      'function webpackJsonpCallback(data) {',
      Template.indent([
        'var chunkIds = data[0];',
        'var moreModules = data[1];',
        withDefer ? 'var executeModules = data[2];' : '',
        withPrefetch ? 'var prefetchChunks = data[3] || [];' : '',
        '// add "moreModules" to the modules object,',
        '// then flag all "chunkIds" as loaded and fire callback',
        'var moduleId, chunkId, i = 0, resolves = [];',
        'for(;i < chunkIds.length; i++) {',
        Template.indent([
          'chunkId = chunkIds[i];',
          'if(installedChunks[chunkId]) {',
          Template.indent('resolves.push(installedChunks[chunkId][0]);'),
          '}',
          'installedChunks[chunkId] = 0;',
        ]),
        // ...
    ]);
  }
  return source;
});
```

每个`chunk`的代码生成后就会放到`compilation.assets`数组中。

生成代码后只剩最后将其输出到文件中了，这一步是在`Compiler.prototype.emitAssets`函数中：

```js
const targetPath = this.outputFileSystem.join(outputPath, targetFile);

let content = source.source(); // 待写入的文件内容

if (!Buffer.isBuffer(content)) {
  content = Buffer.from(content, 'utf8');
}

source.existsAt = targetPath;
source.emitted = true;
this.outputFileSystem.writeFile(targetPath, content, callback); // 写入文件
```

以上就是`webpack`的主体流程了~

# 参考文章

- [玩转 webpack](https://lxzjj.github.io/2017/11/02/%E7%8E%A9%E8%BD%ACwebpack%EF%BC%88%E4%B8%80%EF%BC%89/)
- [webpack 源码学习系列](https://github[.com/youngwind/blog/issues/99)](webpack 各个击破)
- [webpack 各个击破](https://bbs.huaweicloud.com/blogs/1c0ca278a42611e89fc57ca23e93a89f)
- [diving-into-webpack](https://github.com/lihongxun945/diving-into-webpack/blob/master/2-babel-loader.md)
- [webpack 源码分析](https://zhuanlan.zhihu.com/p/29551683)
