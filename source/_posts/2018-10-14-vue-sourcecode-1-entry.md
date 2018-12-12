---
title: 'Vue源码解析1-入口'
img: alaska.jpg # Add image post (optional)
date: 2018-10-14 22:20:00
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [Vue, javascript]
---

# 前言

主要是记录自己在学习 Vue 源码时的心得，学习的版本是`2.5.17-beta.0`. 主要参考的博客是[liutao/vue2.0-source](https://github.com/liutao/vue2.0-source/)。

# 入口

## `entry-runtime-with-compiler`

跟随`npm run dev`，可以看到最终的入口文件是`src/platforms/web/entry-runtime-with-compiler.js`，Vue 函数的定义是从`./runtime/index.js`中导入的。这个文件主要是

- 修改了`Vue.prototype.$mount`的定义
- 添加了`Vue.compile`

## `runtime/index`

再看看`runtime/index`中干了什么：

```js
Vue.config.mustUseProp = mustUseProp
Vue.config.isReservedTag = isReservedTag
Vue.config.isReservedAttr = isReservedAttr
Vue.config.getTagNamespace = getTagNamespace
Vue.config.isUnknownElement = isUnknownElement

// install platform runtime directives & components
extend(Vue.options.directives, platformDirectives)
extend(Vue.options.components, platformComponents)

// install platform patch function
Vue.prototype.__patch__ = inBrowser ? patch : noop

// public mount method
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): {
	// ...
}
```

- 从`src/core/index.js`导入 Vue
- 为`Vue.config`添加了一系列平台相关工具函数
- 扩展了`Vue.options.directives`（`v-model`和`v-show`）和`Vue.options.components`（`Transition`和`TransitionGroup`)
- 在`Vue.prototype`上添加了`__patch__`(虚拟 dom 相关)和`$mount`（挂载元素）

## `core/index`

在`core/index`中其实也没有什么，主要就是

```js
import Vue from './instance/index';

initGlobalAPI(Vue); // 在Vue上挂载各种全局api，之后再详细说
Vue.version = '__VERSION__';
export default Vue;
```

## `instance/index`

最后终于到了`instance/index`，这里终于可以看到`Vue`的构造函数定义了~~~~

```js
function Vue(options) {
  // ...
  this._init(options); // initMixin方法中定义
}

initMixin(Vue);
stateMixin(Vue);
//
eventsMixin(Vue);
//
lifecycleMixin(Vue);
//
renderMixin(Vue);
```

可以看到主要就是调用了一个`_init`方法，从这个函数追溯可以了解到整个 Vue 的生命周期，之后单独详细说明。

下面的其他几个方法主要就是给`Vue.prototype`挂载各种实例方法，这里先简单挨个描述

- `stateMixin`： 挂载了`$data、$props、$set、$delete、$watch`
- `eventsMixin`：挂载了`$on、$once、$off、$emit`
- `lifecycleMixin`： 挂载了`_update、$forceUpdate、$destroy`
- `renderMixin`： 挂载了`$nextTick、_render`以及一系列在`render`帮助函数，如下

      	```js
      	target._o = markOnce
      	target._n = toNumber
      	target._s = toString
      	target._l = renderList
      	target._t = renderSlot
      	target._q = looseEqual
      	target._i = looseIndexOf
      	target._m = renderStatic
      	target._f = resolveFilter
      	target._k = checkKeyCodes
      	target._b = bindObjectProps
      	target._v = createTextVNode
      	target._e = createEmptyVNode
      	target._u = resolveScopedSlots
      	target._g = bindObjectListeners
      	```

至此，我们就知道了整个`Vue`框架的入口了，从入口出发就可以了解到整个 Vue 的方方面面，后续挨个记录。
