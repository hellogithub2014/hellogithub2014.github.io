---
title: 'VueI18n源码解析'
summary_img: /images/malaysia.jpg # Add image post (optional)
date: 2018-07-17 22:30:00

tag: [vue, VueI18n]
---

这段时间一直在做国际化的项目，需要对界面上的文本都对各种语言做翻译，利用了[vue-i18n](https://github.com/kazupon/vue-i18n)这个库,它可以在切换语言时无刷新的更新页面上的文本翻译。 本文主要用来记录阅读这个库时的心得体会。

# 如何使用

按照官网教程安装完后，经过很简单的几句代码就可以使用了：

```js
import VueI18n from 'vue-i18n';

Vue.use(VueI18n);

export const i18n = new VueI18n({
  messages: preMessages,
  fallbackLocale,
  silentTranslationWarn: conf.isProductionEnv, // 生产环境禁掉warning
});

new Vue({
  i18n,
}).$mount('#app');
```

# 结构

整个插件的结构如下：

![插件结构](/images/vuei18n/vuei18n-struct.png)

# 入口

先看看`Vue.use`是如何工作的，代码位于`vue/src/core/global-api/use.js`：

```js
Vue.use = function(plugin: Function | Object) {
  // 查看已安装插件列表中是否有此插件
  const installedPlugins = this._installedPlugins || (this._installedPlugins = []);
  if (installedPlugins.indexOf(plugin) > -1) {
    return this;
  }

  // additional parameters
  const args = toArray(arguments, 1);
  args.unshift(this);
  if (typeof plugin.install === 'function') {
    plugin.install.apply(plugin, args); // 调用插件的install方法
  } else if (typeof plugin === 'function') {
    plugin.apply(null, args); // 如果没有install，那么调用插件自身
  }
  installedPlugins.push(plugin);
  return this;
};
```

接下来就是`VueI18n.install`干了些什么，代码位于`vue-i18n/src/install.js`

```js
export function install(_Vue) {
  Vue = _Vue;

  const version = (Vue.version && Number(Vue.version.split('.')[0])) || -1;
  /* istanbul ignore if */
  // 插件利用install.installed来判断是否自己已被安装过，一个很常见的小技巧。。。
  if (process.env.NODE_ENV !== 'production' && install.installed) {
    warn('already installed.');
    return;
  }
  install.installed = true;

  /* istanbul ignore if */
  if (process.env.NODE_ENV !== 'production' && version < 2) {
    warn(`vue-i18n (${install.version}) need to use Vue 2.0 or later (Vue: ${Vue.version}).`);
    return;
  }

  // 挂载$.i18n变量
  Object.defineProperty(Vue.prototype, '$i18n', {
    get() {
      return this._i18n;
    },
  });

  extend(Vue); // 在vue实例上添加各种格式化函数
  Vue.mixin(mixin); // 挂载生命周期钩子
  Vue.directive('t', { bind, update }); // 添加v-t函数，研究实现
  Vue.component(component.name, component); // 添加全局<i18n>组件

  // use object-based merge strategy
  const strats = Vue.config.optionMergeStrategies;
  strats.i18n = strats.methods; // 针对i18n的Vue选项指定合并策略
}
```

# 如何实现无刷新更新语言

这是我们最为关心的问题了，也是这个插件最核心的逻辑，其他都是为了让插件更好用。

此处逻辑放在了`Vue.mixin(mixin)`里，这里面主要是给 Vue 实例或组件添加了 2 个生命周期钩子`beforeCreate`和`beforeDestroy`。 在`beforeCreate`钩子里实现了对语言、文本等变量的监听，如果发现了变更，就会手动触发 Vue 实例或组件的`$forceUpdate`方法强制更新。在`beforeDestroy`中注销所有监听。

## beforeCreate

这个就是核心代码了，看看怎么实现的：

```js
beforeCreate (): void {
    const options: any = this.$options // Vue实例或组件的选项
    options.i18n = options.i18n || (options.__i18n ? {} : null)

    if (options.i18n) {
      if (options.i18n instanceof VueI18n) { // 按照最常见的用法，这个分支是成立的
        // init locale messages via custom blocks
        if (options.__i18n) { // 这个__i18n选项没用过，暂且忽略
          try {
            let localeMessages = {}
            options.__i18n.forEach(resource => {
              localeMessages = merge(localeMessages, JSON.parse(resource))
            })
            Object.keys(localeMessages).forEach((locale: Locale) => {
              options.i18n.mergeLocaleMessage(locale, localeMessages[locale])
            })
          } catch (e) {
            if (process.env.NODE_ENV !== 'production') {
              warn(`Cannot parse locale messages via custom blocks.`, e)
            }
          }
        }
        this._i18n = options.i18n
        this._i18nWatcher = this._i18n.watchI18nData() // 这一句和下一句是关键，用于监听翻译变量的变更并触发页面更新，待会单独讲
        this._i18n.subscribeDataChanging(this)
        this._subscribing = true
      } else if (isPlainObject(options.i18n)) { // 使用插件时传入的i18n只是一个普通对象
        // component local i18n，手动构造VueI18n对象，逻辑和上面的基本一致，略过。。。
        if (this.$root && this.$root.$i18n && this.$root.$i18n instanceof VueI18n) {
          options.i18n.root = this.$root.$i18n
          options.i18n.formatter = this.$root.$i18n.formatter
          options.i18n.fallbackLocale = this.$root.$i18n.fallbackLocale
          options.i18n.silentTranslationWarn = this.$root.$i18n.silentTranslationWarn
        }

        // init locale messages via custom blocks
        if (options.__i18n) {
          try {
            let localeMessages = {}
            options.__i18n.forEach(resource => {
              localeMessages = merge(localeMessages, JSON.parse(resource))
            })
            options.i18n.messages = localeMessages
          } catch (e) {
            if (process.env.NODE_ENV !== 'production') {
              warn(`Cannot parse locale messages via custom blocks.`, e)
            }
          }
        }

        this._i18n = new VueI18n(options.i18n)
        this._i18nWatcher = this._i18n.watchI18nData()
        this._i18n.subscribeDataChanging(this)
        this._subscribing = true

        if (options.i18n.sync === undefined || !!options.i18n.sync) {
          this._localeWatcher = this.$i18n.watchLocale()
        }
      } else {
        if (process.env.NODE_ENV !== 'production') {
          warn(`Cannot be interpreted 'i18n' option.`)
        }
      }
    } else if (this.$root && this.$root.$i18n && this.$root.$i18n instanceof VueI18n) { // 如果在根组件注册了i18n
      // root i18n
      this._i18n = this.$root.$i18n
      this._i18n.subscribeDataChanging(this) // 注意这里并没有watch的逻辑，只注册了订阅
      this._subscribing = true
    } else if (options.parent && options.parent.$i18n && options.parent.$i18n instanceof VueI18n) { // 如果在父组件注册了i18n
      // parent i18n
      this._i18n = options.parent.$i18n
      this._i18n.subscribeDataChanging(this) // 这里同样只注册了订阅
      this._subscribing = true
    }
  },
```

如果在当前组件没有注册 i18n 插件，会首先去根组件找，然后再去父组件找。只要找到了就说明如果翻译变量变化了，当前组件可以执行更新。

## watchI18nData、subscribeDataChanging

为了能够监听到翻译变量的变化，vuei18n 做了一个巧妙的事：

1.  它在内部实例化了一个 vue 实例，然后把所有相关翻译变量当做`data`选项传进去，
2.  最后再`watch`整个`data`，只要触发了`watch`就说明翻译变量发生了变化。

首先，在执行插件的构造函数时，有一个`_initVM`函数，这里就是用来实例化内部 vm 的：

```js
_initVM(data: {
	locale: Locale,
	fallbackLocale: Locale,
	messages: LocaleMessages,
	dateTimeFormats: DateTimeFormats,
	numberFormats: NumberFormats,
}): void {
	const silent = Vue.config.silent;
	Vue.config.silent = true;
	this._vm = new Vue({ data });
	Vue.config.silent = silent;
}
```

可以看到监听的有语言、默认语言、翻译词包、时间格式化函数、数字格式化函数

然后在上述的`mixin`逻辑中，有一个`watchI18nData`函数，它就是用来`watch`整个`data`对象的：

```js
watchI18nData(): Function {
	const self = this;
	return this._vm.$watch(
	 '$data',
	 () => {
	   let i = self._dataListeners.length;
	   while (i--) {
	     Vue.nextTick(() => {
	       self._dataListeners[i] && self._dataListeners[i].$forceUpdate();
	     });
	   }
	 },
	 { deep: true },
	);
}
```

`_dataListeners`是什么？ 这里是一个简单的`观察者模式`，`_dataListeners`是一个数组，存放所有对`data`感兴趣的回调函数。回调函数在哪里注册的呢？ 就是上面的

```js
this._i18n.subscribeDataChanging(this); // this指向vue组件或vue实例
```

最后只要看看`$forceUpdate`干了什么，整个插件的主体脉络就梳理清楚了，应该就是执行页面更新了.这个函数在`vue`源码中的`vue/src/core/instance/lifecycle.js`:

```js
Vue.prototype.$forceUpdate = function() {
  const vm: Component = this;
  if (vm._watcher) {
    vm._watcher.update();
  }
};
```

至于`vm._watcher.update()`干了些什么事，以后再研究。

综上： 我们可以在页面上设置一个切换语言功能，在其中只要更改语言`locale`就可以最终执行组件的`update`了，或者动态的更新词包也行。

## beforeDestroy

上面也说到，这里会卸载`watch`和`_dataListeners`,具体看看怎么做的：

```js
  beforeDestroy (): void {
    if (!this._i18n) { return }

    if (this._subscribing) {
      this._i18n.unsubscribeDataChanging(this)
      delete this._subscribing
    }

    if (this._i18nWatcher) {
      this._i18nWatcher()
      delete this._i18nWatcher
    }

    if (this._localeWatcher) {
      this._localeWatcher()
      delete this._localeWatcher
    }

    this._i18n = null
  }
```

代码很简单，略。。。。

至此，插件的核心逻辑就讲完了，其他的都是锦上添花的功能，我们也挨个来看下。

# `$t`、`$tc`

在`install`函数中执行了这个`extend(Vue)`，它会往`vue`实例上挂载各种各样的便利格式化函数：

```js
Object.defineProperty(Vue.prototype, '$t', {
  get() {
    return (key: Path, ...values: any): TranslateResult => {
      const i18n = this.$i18n;
      return i18n._t(key, i18n.locale, i18n._getMessages(), this, ...values);
    };
  },
});
// $FlowFixMe
Object.defineProperty(Vue.prototype, '$tc', {
  get() {
    return (key: Path, choice?: number, ...values: any): TranslateResult => {
      const i18n = this.$i18n;
      return i18n._tc(key, i18n.locale, i18n._getMessages(), this, choice, ...values);
    };
  },
});

// ...
```

这里重点关注最常用的`$t`和`$tc`.

## `$t`

跟踪它的代码调用，会发现最后会到一个`_render`函数，他负责将词条连同各种参数翻译成最终的文本：

```js
	// message是待翻译词条，values是参数如插值或单复数的实际值
  _render(message: string, interpolateMode: string, values: any): any {
    const ret = this._formatter.interpolate(message, values);
    // if interpolateMode is **not** 'string' ('row'),
    // return the compiled data (e.g. ['foo', VNode, 'bar']) with formatter
    return interpolateMode === 'string' ? ret.join('') : ret;
  }
```

这个函数又调用了`_formatter.interpolate`，`formatter`负责解析切割词条，返回文本片段数组。

## formatter

分为了两步：`parse`和`compile`，

### parse

负责把待翻译词条解析成特定格式的数组，数组每个元素格式如下：

```js
{
	type: string, // 纯文本text、列表list、插值named
	value: string
}
```

整个过程其实并不难，就是挨个处理字符：

```js
const RE_TOKEN_LIST_VALUE: RegExp = /^(\d)+/;
const RE_TOKEN_NAMED_VALUE: RegExp = /^(\w)+/;

export function parse(format: string): Array<Token> {
  const tokens: Array<Token> = [];
  let position: number = 0;

  let text: string = '';
  while (position < format.length) {
    let char: string = format[position++];
    if (char === '{') {
      if (text) {
        tokens.push({ type: 'text', value: text });
      }

      text = '';
      let sub: string = '';
      char = format[position++];
      while (char !== '}') {
        sub += char;
        char = format[position++];
      }

      const type = RE_TOKEN_LIST_VALUE.test(sub) ? 'list' : RE_TOKEN_NAMED_VALUE.test(sub) ? 'named' : 'unknown';
      tokens.push({ value: sub, type });
    } else if (char === '%') {
      // when found rails i18n syntax, skip text capture
      if (format[position] !== '{') {
        text += char;
      }
    } else {
      text += char;
    }
  }

  text && tokens.push({ type: 'text', value: text });

  return tokens;
}
```

比如`hello , my name is {name}, and you?`就会被解析为:

```js
[
  {
    type: 'text',
    value: 'hello , my name is ',
  },
  {
    type: 'named',
    value: 'name',
  },
  {
    type: 'text',
    value: ', and you?',
  },
];
```

这里的`name`变量真正的值就存储在`_render`函数的`values`参数中。下一步`compile`就会拿到真正的值并替换`name`变量.

## compile

同样比较简单，最后也会返回一个数组

```js
// values参数就是_render函数的values
export function compile(tokens: Array<Token>, values: Object | Array<any>): Array<any> {
  const compiled: Array<any> = [];
  let index: number = 0;

  const mode: string = Array.isArray(values) ? 'list' : isObject(values) ? 'named' : 'unknown';
  if (mode === 'unknown') {
    return compiled;
  }
  // 挨个处理parse函数返回的数组元素
  while (index < tokens.length) {
    const token: Token = tokens[index];
    switch (token.type) {
      case 'text': // 纯文本
        compiled.push(token.value);
        break;
      case 'list': // 列表插值
        compiled.push(values[parseInt(token.value, 10)]); // 拿到values中对应索引的值
        break;
      case 'named':
        if (mode === 'named') {
          compiled.push((values: any)[token.value]); // 拿到values中对应的属性值
        } else {
          if (process.env.NODE_ENV !== 'production') {
            warn(`Type of token '${token.type}' and format of value '${mode}' don't match!`);
          }
        }
        break;
      case 'unknown':
        if (process.env.NODE_ENV !== 'production') {
          warn(`Detect 'unknown' type of token!`);
        }
        break;
    }
    index++;
  }

  return compiled;
}
```

其实只要把`compiled`数组`join`就是最终`$t`的结果了，为什么不这么干呢？ 是因为想把`formatter`处理的结果给`$tc`复用。

## `$tc`

它比较『无耻』，先直接拿到`$t`的劳动果实，再从数组中挑一个想要的。

```js
  _tc(key: Path, _locale: Locale, messages: LocaleMessages, host: any, choice?: number, ...values: any): any {
    if (!key) {
      return '';
    }
    if (choice === undefined) {
      choice = 1;
    }
    return fetchChoice(this._t(key, _locale, messages, host, ...values), choice);
  }
```

`fetchChoice`的逻辑并不难，就是根据`choice`的值取数组中挑一个元素回来，各位看官自行去了解。

# v-t

这是一个全局指令，

这是一个全局指令，只有`bind`和`update`两个选项，前者会在绑定 DOM 元素时将翻译后的词条当做元素的`textContent`，后者执行更新逻辑。

## bind

```js
export function bind(el: any, binding: Object, vnode: any): void {
  // ...
  t(el, binding, vnode);
}
```

应该来说，这里的`t`函数做的事情和挂载到`Vue`实例上的`$t`、`$tc`类似，实际代码确实也是这样：

```js
function t(el: any, binding: Object, vnode: any): void {
  const value: any = binding.value; // 绑定到指令上的新值

  const { path, locale, args, choice } = parseValue(value);

  // 校验逻辑...

  const vm: any = vnode.context;
  // 单复数词条
  if (choice) {
    el._vt = el.textContent = vm.$i18n.tc(path, choice, ...makeParams(locale, args)); // 更新元素textContent
  } else {
    el._vt = el.textContent = vm.$i18n.t(path, ...makeParams(locale, args));
  }
  el._locale = vm.$i18n.locale; // 缓存当前语言到元素上面，以便在update时判断语言是否变化
}
```

## update

更新时，如果语言没变且绑定到指令上的值没有变化则什么也不做；否则执行跟`bind`相同的逻辑：

```js
export function update(el: any, binding: Object, vnode: any, oldVNode: any): void {
  // ...
  if (localeEqual(el, vnode) && looseEqual(binding.value, binding.oldValue)) {
    return;
  } // localeEqual判断语言是否由变化，会使用t函数中缓存的_locale

  t(el, binding, vnode);
}
```

这里的`looseEqual`比较有意思：如果都是数组，那么挨个比较每个数组元素；如果两个参数都是对象，那么递归比较每个属性值；如果不是对象，那么把它俩转为字符串对比：

```js
export function looseEqual(a: any, b: any): boolean {
  if (a === b) {
    return true;
  }
  const isObjectA: boolean = isObject(a);
  const isObjectB: boolean = isObject(b);
  if (isObjectA && isObjectB) {
    try {
      const isArrayA: boolean = Array.isArray(a);
      const isArrayB: boolean = Array.isArray(b);
      if (isArrayA && isArrayB) {
        return (
          a.length === b.length &&
          a.every(
            (e: any, i: number): boolean => {
              return looseEqual(e, b[i]);
            },
          )
        );
      } else if (!isArrayA && !isArrayB) {
        const keysA: Array<string> = Object.keys(a);
        const keysB: Array<string> = Object.keys(b);
        return (
          keysA.length === keysB.length &&
          keysA.every(
            (key: string): boolean => {
              return looseEqual(a[key], b[key]);
            },
          )
        );
      } else {
        /* istanbul ignore next */
        return false;
      }
    } catch (e) {
      /* istanbul ignore next */
      return false;
    }
  } else if (!isObjectA && !isObjectB) {
    return String(a) === String(b);
  } else {
    return false;
  }
}
```

# `<i18n>`

这是`VueI18n`提供的一个函数式组件，业务中用的比较少，暂且没看。。。。 它的作用是可以方便的混合普通文本翻译与 html 模板，在一些稍微复杂的情形下会比较有用。

# Vue.config.optionMergeStrategies

看到`install`方法里最后有这样两句：

```js
// use object-based merge strategy
const strats = Vue.config.optionMergeStrategies;
strats.i18n = strats.methods;
```

关于选项合并策略，[vue 的 mixin](https://cn.vuejs.org/v2/guide/mixins.html)也有描述，但具体的源码是怎样的呢？`mixin`是在什么时间点起作用的呢？

我们先回答后一个问题：

## mixin 的作用时间点

在`Vue`的构造函数(位于`/vue/src/core/instance/index.js`)中只有很短的几句：

```js
function Vue(options) {
  if (process.env.NODE_ENV !== 'production' && !(this instanceof Vue)) {
    warn('Vue is a constructor and should be called with the `new` keyword');
  }
  this._init(options);
}

initMixin(Vue);
stateMixin(Vue);
eventsMixin(Vue);
lifecycleMixin(Vue);
renderMixin(Vue);
```

其中的`_init`函数是在`initMixin`中定义的：

```js
export function initMixin(Vue: Class<Component>) {
  Vue.prototype._init = function(options?: Object) {
    const vm: Component = this;
    // a uid
    vm._uid = uid++;

    let startTag, endTag;
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`;
      endTag = `vue-perf-end:${vm._uid}`;
      mark(startTag);
    }

    // a flag to avoid this being observed
    vm._isVue = true;
    // merge options
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options);
    } else {
      vm.$options = mergeOptions(resolveConstructorOptions(vm.constructor), options || {}, vm);
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm);
    } else {
      vm._renderProxy = vm;
    }
    // expose real self
    vm._self = vm;
    initLifecycle(vm);
    initEvents(vm);
    initRender(vm);
    callHook(vm, 'beforeCreate');
    initInjections(vm); // resolve injections before data/props
    initState(vm);
    initProvide(vm); // resolve provide after data/props
    callHook(vm, 'created');

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false);
      mark(endTag);
      measure(`vue ${vm._name} init`, startTag, endTag);
    }

    if (vm.$options.el) {
      vm.$mount(vm.$options.el);
    }
  };
}
```

看到有一句

```js
vm.$options = mergeOptions(
  resolveConstructorOptions(vm.constructor), // 构造函数自己的options
  options || {},
  vm,
);
```

**这个`mergeOptions`就是处理`mixin`的过程了，可以看到这个过程非常早，早于组件初始化生命周期钩子。**再来看看`mergeOptions`

```js
/**
 * Merge two option objects into a new one.
 * Core utility used in both instantiation and inheritance.
 */
export function mergeOptions(parent: Object, child: Object, vm?: Component): Object {
  if (process.env.NODE_ENV !== 'production') {
    checkComponents(child);
  }

  if (typeof child === 'function') {
    child = child.options;
  }

  normalizeProps(child, vm);
  normalizeInject(child, vm);
  normalizeDirectives(child);
  const extendsFrom = child.extends;
  if (extendsFrom) {
    parent = mergeOptions(parent, extendsFrom, vm);
  }
  // 这里就是mixin被合并到组件option的时机，child.mixins就是指我们传入的那个mixin数组
  if (child.mixins) {
    for (let i = 0, l = child.mixins.length; i < l; i++) {
      // 按照这里的代码逻辑，靠后的mixin选项会覆盖靠前的mixin
      parent = mergeOptions(parent, child.mixins[i], vm);
    }
  }
  // 合并完整个mixin之后，再合并其他选项
  const options = {};
  let key;
  for (key in parent) {
    mergeField(key);
  }
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key);
    }
  }
  function mergeField(key) {
    const strat = strats[key] || defaultStrat; // 根据每一个选项获取对应的合并策略
    options[key] = strat(parent[key], child[key], vm, key); // 根据合并策略合并选项
  }
  return options;
}
```

好，我们已经知道`mixin`的合并时机非常早，并且会在合并组件其他选项之前就会合并`mixin`的选项。正因为这样，才有官网上说的『如果组件自身的选项与 mixin 冲突，最后会以组件自身的选项为准』。

对于`i18n`选项的合并，通过代码我们已经知道他是使用`Vue.config.optionMergeStrategies.methods`，其实对于各种合并策略，无非就是怎么处理参数中的两个对象，我们不妨把所有提供提供的合并策略挨个了解下，代码都位于`vue/src/core/util/options.js`。

**components、directives 和 filters 的合并策略都是 mergeAssets,大体就是组件选项覆盖 mixin 选项。**

```js
function mergeAssets(parentVal: ?Object, childVal: ?Object, vm?: Component, key: string): Object {
  const res = Object.create(parentVal || null);
  if (childVal) {
    return extend(res, childVal);
  } else {
    return res;
  }
}
// ASSET_TYPES => [component、directive、filter]
ASSET_TYPES.forEach(function(type) {
  strats[type + 's'] = mergeAssets;
});
```

### strats.props、strats.methods、strats.inject 、strats.computed

这几个都是使用相同的一个叫`extend`的函数:

```js
strats.props = strats.methods = strats.inject = strats.computed = function(
  parentVal: ?Object,
  childVal: ?Object,
  vm?: Component,
  key: string,
): ?Object {
  if (childVal && process.env.NODE_ENV !== 'production') {
    assertObjectType(key, childVal, vm);
  }
  if (!parentVal) return childVal;
  const ret = Object.create(null); // 空对象
  extend(ret, parentVal);
  if (childVal) extend(ret, childVal);
  return ret;
};
```

上述代码逻辑很简单，如果`parent`或`child`为空，直接返回不为空的那个；否则执行`extend`合并二者的选项，`extend`同样很简单：

```js
// from中的第一层元素覆盖to的第一层元素
export function extend(to: Object, _from: ?Object): Object {
  for (const key in _from) {
    to[key] = _from[key];
  }
  return to;
}
```

所以这几个合并策略都是最多只合并一层属性。

### strats.data

```js
strats.data = function(parentVal: any, childVal: any, vm?: Component): ?Function {
  // ...
  return mergeDataOrFn(parentVal, childVal, vm);
};

export function mergeDataOrFn(parentVal: any, childVal: any, vm?: Component): ?Function {
  if (!vm) {
    // in a Vue.extend merge, both should be functions
    if (!childVal) {
      return parentVal;
    }
    if (!parentVal) {
      return childVal;
    }
    // when parentVal & childVal are both present,
    // we need to return a function that returns the
    // merged result of both functions... no need to
    // check if parentVal is a function here because
    // it has to be a function to pass previous merges.
    return function mergedDataFn() {
      return mergeData(
        typeof childVal === 'function' ? childVal.call(this, this) : childVal,
        typeof parentVal === 'function' ? parentVal.call(this, this) : parentVal,
      );
    };
  } else {
    return function mergedInstanceDataFn() {
      // instance merge
      const instanceData = typeof childVal === 'function' ? childVal.call(vm, vm) : childVal;
      const defaultData = typeof parentVal === 'function' ? parentVal.call(vm, vm) : parentVal;
      if (instanceData) {
        return mergeData(instanceData, defaultData);
      } else {
        return defaultData;
      }
    };
  }
}
```

注意`methods`策略直接返回的合并后对象，而`data`策略返回的是一个函数，原因在代码注释里已经说的很清楚。接下来关注下其中的`mergeData`函数：

```js
/**
 * Helper that recursively merges two data objects together.
 */
function mergeData(to: Object, from: ?Object): Object {
  if (!from) return to;
  let key, toVal, fromVal;
  const keys = Object.keys(from);
  for (let i = 0; i < keys.length; i++) {
    key = keys[i];
    toVal = to[key];
    fromVal = from[key];
    if (!hasOwn(to, key)) {
      set(to, key, fromVal);
    } else if (isPlainObject(toVal) && isPlainObject(fromVal)) {
      mergeData(toVal, fromVal); // 递归合并子属性
    }
  }
  return to;
}
```

注意到这里是递归合并所有选项，而不是像[官网上说](https://cn.vuejs.org/v2/guide/mixins.html)的那样：

> 数据对象在内部会进行浅合并 (一层属性深度)，在和组件的数据发生冲突时以组件数据优先。

我们也使用以下代码也可以验证`data`的合并不是只合并一层属性。

```js
var mixin = {
  data: function() {
    return {
      message: 'hello',
      foo: 'abc',
      inner: {
        a: 1,
        b: 2,
        c: {
          x: 1,
          y: 2,
          d: {
            z: 3,
          },
        },
      },
    };
  },
};

new Vue({
  mixins: [mixin],
  data: function() {
    return {
      message: 'goodbye',
      bar: 'def',
      inner: {
        a: 2,
        b: 3,
        c: {
          x: 2,
        },
      },
    };
  },
  created: function() {
    console.log(JSON.stringify(this.$data));
    // {"message":"goodbye","bar":"def","inner":{"a":2,"b":3,"c":{"x":2,"y":2,"d":{"z":3}}},"foo":"abc"}
  },
});
```

综上，`data`合并策略返回一个函数，所有深层次的选项都会被合并。

### strats.watch

他会把所有 watch 选项最后合并成数组。

```js
/**
 * Watchers.
 *
 * Watchers hashes should not overwrite one
 * another, so we merge them as arrays.
 */
strats.watch = function(parentVal: ?Object, childVal: ?Object, vm?: Component, key: string): ?Object {
  // ...
  if (!parentVal) return childVal;
  const ret = {};
  extend(ret, parentVal);
  for (const key in childVal) {
    let parent = ret[key];
    const child = childVal[key];
    if (parent && !Array.isArray(parent)) {
      parent = [parent];
    }
    ret[key] = parent ? parent.concat(child) : Array.isArray(child) ? child : [child];
  }
  return ret;
};
```

### strats.propsData、strats.el

这两个选项只能在非生产环境下使用，

```js
/**
 * Options with restrictions
 */
if (process.env.NODE_ENV !== 'production') {
  strats.el = strats.propsData = function(parent, child, vm, key) {
    if (!vm) {
      warn(`option "${key}" can only be used during instance ` + 'creation with the `new` keyword.');
    }
    return defaultStrat(parent, child);
  };
}

/**
 * Default strategy.
 */
const defaultStrat = function(parentVal: any, childVal: any): any {
  return childVal === undefined ? parentVal : childVal;
};
```

这俩都是采用类似短路求值的方式，优先使用`childVal`.
