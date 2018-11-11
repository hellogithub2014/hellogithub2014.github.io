---
title: 'Vue源码解析10-patch函数入口'
img: alaska.jpg # Add image post (optional)
date: 2018-11-04 22:20:00 +0800
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [Vue, javascript]
---

# 前言

前面简单介绍了`compile`的最后一步：生成`render`函数，还剩下很多分支细节没说，主要是各种内置指令以及自定义组件和`slot`，这些结合之后的`patch`过程说效果会好一些。

这篇文章主要是介绍`patch`函数的入口，把`patch`过程当做黑盒子，从整体的角度讲`patch`的作用。

# patch 入口

在生成`render`函数后，下一步就是调用位于`src/core/instance/lifecycle.js`的`mountComponent`函数，其中一个关键步骤是：

```js
updateComponent = () => {
  vm._update(vm._render(), hydrating);
};

new Watcher(
  vm,
  updateComponent,
  noop,
  {
    before() {
      if (vm._isMounted) {
        callHook(vm, 'beforeUpdate');
      }
    },
  },
  true /* isRenderWatcher */,
);
```

在`mount`过程中通过将`updateComponent`传给`Watcher`实例，可以在`watcher`对应的`Deps`发生改变时重新执行`updateComponent`。

`updateComponent`又分为两个子步骤：`_render`和`_update`。前者用于执行`render`函数生成虚拟`dom`，后者用于比较新旧`vnode`。具体看一下`_update`的代码：

```js
Vue.prototype._update = function(vnode: VNode, hydrating?: boolean) {
  const vm: Component = this;
  const prevVnode = vm._vnode;
  vm._vnode = vnode;
  // Vue.prototype.__patch__ is injected in entry points
  // based on the rendering backend used.
  if (!prevVnode) {
    // initial render
    vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */);
  } else {
    // updates
    vm.$el = vm.__patch__(prevVnode, vnode);
  }
  // ...
};
```

在`Vue`初始化第一次调用`_update`时，`prevVnode`是`undefined`，这样`__patch__`实际上做的事情就是将`vnode`转成真实的 dom 绘制到页面上；之后再次调用`_update`时新旧`vnode`都会存在，此时会执行`diff`算法，以最小粒度更新 dom。

在`Vue.prototype.$destroy`中也会调用`__patch__`:

```js
// invoke destroy hooks on current rendered tree
vm.__patch__(vm._vnode, null);
```

传入的第二个参数为`null`，此时会删除所有`vnode`。

那么`__patch__`在何处定义的呢？答案是在`src/platforms/web/runtime/index.js`中：

```js
// install platform patch function
Vue.prototype.__patch__ = inBrowser ? patch : noop;
```

只在浏览器环境下才有`patch`操作，`patch`函数的定义：

```js
// the directive module should be applied last, after all
// built-in modules have been applied.
const modules = platformModules.concat(baseModules);

export const patch: Function = createPatchFunction({ nodeOps, modules });
```

涉及到几个配置项，挨个说下：

1. `nodeOps`：封装了许许多多对原生 dom 操作的方法，都比较简单，例如

   ```js
   export function createComment(text: string): Comment {
     return document.createComment(text);
   }
   ```

2. `platformModules`： 平台相关的一些属性的处理，包括`attrs`、`class`、`domProps`、`on`、`style`和`show`。代码位于`src/platforms/web/runtime/modules/index.js`，每个子`module`都会包含`create`和`update`两个钩子。

3. `baseModules`：是`web`和`weex`都有的处理，包括`directives`和`ref`属性的处理。代码位于`src/core/vdom/modules/index.js`，每个子`module`同样会包含`create`和`update`两个钩子。

最后我们的`createPatchFunction`就是真正的`patch`函数定义之处了，代码非常的长，这里先只展示最重要的轮廓：

```js
const hooks = ['create', 'activate', 'update', 'remove', 'destroy'];

export function createPatchFunction(backend) {
  let i, j;
  const cbs = {};

  const { modules, nodeOps } = backend;

  /**
   * 将每个modules中每个子moudle定义的各种钩子统一放到cbs中，最后cbs的结构示范
   * {
   *    create: [module1Create, module2Create],
   *    update: [module1Update, module2Update],
   * }
   */
  for (i = 0; i < hooks.length; ++i) {
    cbs[hooks[i]] = [];
    for (j = 0; j < modules.length; ++j) {
      if (isDef(modules[j][hooks[i]])) {
        cbs[hooks[i]].push(modules[j][hooks[i]]);
      }
    }
  }

  // 很多的帮助函数...

  return function patch(oldVnode, vnode, hydrating, removeOnly) {
    // ...
  };
}
```

到这里我们就从整体上了解了`patch`的入口在哪以及它的作用，会在接下来的文章里详细描述`patch`的具体代码。
