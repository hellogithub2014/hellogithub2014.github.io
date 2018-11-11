---
title: 'Vue源码解析2-全局api'
img: bora-bora.jpg # Add image post (optional)
date: 2018-10-16 22:20:00 +0800
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [Vue, javascript]
---

上篇文章有提到在`core/index.js`中会调用`initGlobalAPI`来给`Vue`上挂载全局 api，也就是各种静态函数。这些静态函数是在我们业务代码调用`new Vue`之前就执行的了。 这里就来记录具体有哪些全局 api。

函数定义为：

```js
export function initGlobalAPI(Vue: GlobalAPI) {
  // config
  const configDef = {};
  configDef.get = () => config;
  // ...
  Object.defineProperty(Vue, 'config', configDef);

  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive,
  };

  Vue.set = set;
  Vue.delete = del;
  Vue.nextTick = nextTick;

  Vue.options = Object.create(null);
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null);
  });

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  Vue.options._base = Vue;

  extend(Vue.options.components, builtInComponents);

  initUse(Vue);
  initMixin(Vue);
  initExtend(Vue);
  initAssetRegisters(Vue);
}
```

首先定义`Vue.config`，之后会在这上面添加各种全局配置。

`ASSET_TYPES`数组中含有`component`、`directive`和`filter`，所以之后就有了`Vue.options .components`、`Vue.options.directives`和`Vue.options.filter`3 个空对象。

`builtInComponents`中只含有一个`KeepAlive`组件,所以经过

```js
extend(Vue.options.components, builtInComponents);
```

就有了第一个全局组件`<keep-alive>`.

## `initUse`

定义了`Vue.use`，此函数就是用来安装各种 Vue 插件的。

```js
Vue.use = function(plugin: Function | Object) {
  const installedPlugins = this._installedPlugins || (this._installedPlugins = []);
  // 若此前以安装过此插件
  if (installedPlugins.indexOf(plugin) > -1) {
    return this;
  }

  // additional parameters
  const args = toArray(arguments, 1);
  args.unshift(this);
  // 调用插件函数
  if (typeof plugin.install === 'function') {
    plugin.install.apply(plugin, args);
  } else if (typeof plugin === 'function') {
    plugin.apply(null, args);
  }
  installedPlugins.push(plugin);
  return this;
};
```

可以看到插件安装的代码非常简洁，然后`Vue.installedPlugins`会存放所有已安装过的插件。

## `initMixin`

定义了`Vue.mixin`方法：

```js
Vue.mixin = function(mixin: Object) {
  this.options = mergeOptions(this.options, mixin);
  return this;
};
```

经过`mergeOptions`的处理，mixin 的选项就会和`Vue.options`混合到一起了，效果是全局性的。

`mergeOptions`涉及到各种合并策略，在另一篇博客[vue-i18n](https://github.com/hellogithub2014/hellogithub2014.github.io/blob/master/_posts/2018-07-17-vue-i18n-source-code.md)中有详细的介绍，这里就不再重复。

## `initExtend`

定义了`Vue.extend`方法，`Vue.extend`会返回一个`VueComponent`构造函数，它会继承`Vue`函数。

```js
Vue.cid = 0;
let cid = 1;

/**
 * Class inheritance
 */
Vue.extend = function(extendOptions: Object): Function {
  extendOptions = extendOptions || {};
  const Super = this;
  const SuperId = Super.cid; // 每个构造函数会有唯一的cid

  const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {}); // 构造函数缓存池，以cid为key

  // 如果缓存中已有目标子构造函数
  if (cachedCtors[SuperId]) {
    return cachedCtors[SuperId];
  }

  const name = extendOptions.name || Super.options.name;

  // 校验逻辑略去...

  const Sub = function VueComponent(options) {
    this._init(options);
  };
  Sub.prototype = Object.create(Super.prototype);
  Sub.prototype.constructor = Sub;
  Sub.cid = cid++; // 每个id都是递增的

  // 这里调用了和Vue.mixin相同的核心函数来合并两个options
  Sub.options = mergeOptions(Super.options, extendOptions);
  Sub['super'] = Super;

  // For props and computed properties, we define the proxy getters on
  // the Vue instances at extension time, on the extended prototype. This
  // avoids Object.defineProperty calls for each instance created.
  if (Sub.options.props) {
    initProps(Sub);
  }
  if (Sub.options.computed) {
    initComputed(Sub);
  }

  // allow further extension/mixin/plugin usage
  Sub.extend = Super.extend;
  Sub.mixin = Super.mixin;
  Sub.use = Super.use;

  // create asset registers, so extended classes
  // can have their private assets too.
  ASSET_TYPES.forEach(function(type) {
    Sub[type] = Super[type];
  });
  // enable recursive self-lookup
  if (name) {
    Sub.options.components[name] = Sub;
  }

  // keep a reference to the super options at extension time.
  // later at instantiation we can check if Super's options have
  // been updated.
  Sub.superOptions = Super.options;
  Sub.extendOptions = extendOptions;
  Sub.sealedOptions = extend({}, Sub.options);

  // cache constructor
  cachedCtors[SuperId] = Sub;
  return Sub;
};
```

大部分代码都很简单，就是典型的 js 继承，然后设置了一堆变量各种引用。 其中的`initProps`和`initComputed`单独说下。

### initProps

用于初始化`Comp.prototype`的`props`。在`Sub.prototype._props`对象中存储每一个`Sub.options.props`上每一个`prop`，以便在`Sub.prototype`进行代理访问.

```js
function initProps(Comp) {
  const props = Comp.options.props;
  for (const key in props) {
    proxy(Comp.prototype, `_props`, key);
  }
}

function proxy(target: Object, sourceKey: string, key: string) {
  sharedPropertyDefinition.get = function proxyGetter() {
    return this[sourceKey][key];
  };
  sharedPropertyDefinition.set = function proxySetter(val) {
    this[sourceKey][key] = val;
  };
  Object.defineProperty(target, key, sharedPropertyDefinition);
}
```

这样之后，访问`Comp.prototype[key]`会实际访问`Comp.prototype._props[key]`,而`vm._props`会在`src/core/instance/state.js`的`initState`中得到初始化，`vm._props[key]`指向一个组件的具体`prop`。

### initComputed

用于初始化`Comp.prototype`的响应式`computed`

```js
function initComputed(Comp) {
  const computed = Comp.options.computed;
  for (const key in computed) {
    defineComputed(Comp.prototype, key, computed[key]);
  }
}

export function defineComputed(target: any, key: string, userDef: Object | Function) {
  const shouldCache = !isServerRendering();
  // 定义computed的get和set
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = shouldCache ? createComputedGetter(key) : userDef;
    sharedPropertyDefinition.set = noop;
  } else {
    sharedPropertyDefinition.get = userDef.get ? (shouldCache && userDef.cache !== false ? createComputedGetter(key) : userDef.get) : noop;
    sharedPropertyDefinition.set = userDef.set ? userDef.set : noop;
  }

  Object.defineProperty(target, key, sharedPropertyDefinition);
}

function createComputedGetter(key) {
  return function computedGetter() {
    const watcher = this._computedWatchers && this._computedWatchers[key];
    if (watcher) {
      if (watcher.dirty) {
        watcher.evaluate(); // 涉及到Dep和Watcher，这是Vue响应式的两个核心类，后续专门说
      }
      if (Dep.target) {
        watcher.depend();
      }
      return watcher.value;
    }
  };
}
```

## initAssetRegisters

用于定义`Vue.component`、`Vue.directive`和`Vue.filter`，它们都是定义全局的 options 的，成功后会把结果放到`Vue.options.xxxx`上。

```js
// ASSET_TYPES => [component, directive, filter]
ASSET_TYPES.forEach(type => {
  Vue[type] = function(id: string, definition: Function | Object): Function | Object | void {
    // 如没有提供定义则尝试返回已有的匹配项
    if (!definition) {
      return this.options[type + 's'][id];
    } else {
      // 定义全局组件
      if (type === 'component' && isPlainObject(definition)) {
        definition.name = definition.name || id;
        // initGlobalAPI定义了this.options._base就是Vue
        definition = this.options._base.extend(definition); //返回VueComponent函数
      }
      // 定义全局指令
      if (type === 'directive' && typeof definition === 'function') {
        definition = { bind: definition, update: definition };
      }
      this.options[type + 's'][id] = definition;
      return definition;
    }
  };
});
```

至此，所有的 Vue 静态函数就全局介绍完了~~~ 最终我们得到的全局 api 有

- `Vue.config`
- `Vue.util.warn/extend/mergeOptions/defineReactive`
- `Vue.set`
- `Vue.delete`
- `Vue.nextTick`
- `Vue.options`，内部包含`components`、`directives`、`filters`、`_base`
- `Vue.use`
- `Vue.mixin`
- `Vue.extend`
- `Vue.component`
- `Vue.directive`
- `Vue.filter`
