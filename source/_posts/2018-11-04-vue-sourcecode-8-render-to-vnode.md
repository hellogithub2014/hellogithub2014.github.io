---
title: 'Vue源码解析8-render函数生成vnode'
img: new-zealand.jpg # Add image post (optional)
date: 2018-11-04 16:20:00 Asia/Shanghai
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [Vue, javascript]
---

# 前言

前面说到模板编译完会生成一个`render`函数，这篇文章要讲的是如何根据`render`函数生成对应的`vnode`。入口代码位于`src/core/instance/render.js`的`Vue.prototype._render`：

```js
vnode = render.call(vm._renderProxy, vm.$createElement);
```

一个`render`函数的格式在前面也说到过，类似于：

```js
with (this) {
  return _c('div', { attrs: { id: 'app' } }, [_c('a', { attrs: { href: url } }, [_v(_s(message))]), _v(' '), _m(0)]);
}
```

看到这里调用了`vm._c`，而`$createElement`是我们自己编写`render`函数作为参数传递的。看看`$createElement`及`_c`的格式：

```js
// bind the createElement fn to this instance
// so that we get proper render context inside it.
// args order: tag, data, children, normalizationType, alwaysNormalize
// internal version is used by render functions compiled from templates
vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false);
// normalization is always applied for the public version, used in
// user-written render functions.
vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true);
```

二者底层都是调用的`createElement`这个函数，唯一差别在于最后一个参数`alwaysNormalize`的赋值不一样，这个参数表示是否做深层归一化，后面会说。

不知道大家有没有注意到`render`函数的细节：它是被`with(this)`包围起来的，同时在调用`render`时传入了`vm._renderProxy`。暂时可以把`vm._renderProxy`当做`vm`，这样我们`render`函数内部所有变量如`url`都是在`vm`上来查找，**这也就是模板上的变量如何与我们组件中的数据如何关联起来的关键!**

至此，我们知道生成`vnode`的绝大部分逻辑都在这个`createElement`里。不过在此之前还是说一下`vnode`是个什么。

# vnode

它的构造函数位于`src/core/vdom/vnode.js`，含有的成员变量非常多，大部分变量已经加了注释。

```js
export default class VNode {
  tag: string | void;
  data: VNodeData | void;
  children: ?Array<VNode>;
  text: string | void;
  elm: Node | void;
  ns: string | void; // 命名空间
  context: Component | void; // rendered in this component's scope
  key: string | number | void;
  componentOptions: VNodeComponentOptions | void;
  componentInstance: Component | void; // component instance
  parent: VNode | void; // component placeholder node

  // strictly internal
  raw: boolean; // contains raw HTML? (server only)
  isStatic: boolean; // hoisted static node
  isRootInsert: boolean; // necessary for enter transition check
  isComment: boolean; // empty comment placeholder?
  isCloned: boolean; // is a cloned node?
  isOnce: boolean; // is a v-once node?
  asyncFactory: Function | void; // async component factory function
  asyncMeta: Object | void;
  isAsyncPlaceholder: boolean;
  ssrContext: Object | void;
  fnContext: Component | void; // real context vm for functional nodes
  fnOptions: ?ComponentOptions; // for SSR caching
  fnScopeId: ?string; // functional scope id support

  constructor(
    tag?: string, // 标签名
    data?: VNodeData, // 结点相关数据
    children?: ?Array<VNode>, // 子结点对象数组
    text?: string, // 文本内容
    elm?: Node, // 原生节点元素
    context?: Component, // context指当前元素所在的Vue实例
    componentOptions?: VNodeComponentOptions, // VNode对象如果对应的是一个自定义组件，componentOptions保存组件相关事件、props数据等
    asyncFactory?: Function,
  ) {
    this.tag = tag;
    this.data = data;
    this.children = children;
    this.text = text;
    this.elm = elm;
    this.ns = undefined;
    this.context = context;
    this.fnContext = undefined;
    this.fnOptions = undefined;
    this.fnScopeId = undefined;
    this.key = data && data.key;
    this.componentOptions = componentOptions;
    this.componentInstance = undefined;
    this.parent = undefined;
    this.raw = false;
    this.isStatic = false;
    this.isRootInsert = true;
    this.isComment = false;
    this.isCloned = false;
    this.isOnce = false;
    this.asyncFactory = asyncFactory;
    this.asyncMeta = undefined;
    this.isAsyncPlaceholder = false;
  }
}
```

# createElement

位于`src/core/vdom/create-element.js`：

```js
const SIMPLE_NORMALIZE = 1;
const ALWAYS_NORMALIZE = 2;

// wrapper function for providing a more flexible interface
// without getting yelled at by flow
export function createElement(
  context: Component,
  tag: any,
  data: any,
  children: any,
  normalizationType: any,
  alwaysNormalize: boolean,
): VNode | Array<VNode> {
  if (Array.isArray(data) || isPrimitive(data)) {
    normalizationType = children;
    children = data;
    data = undefined;
  }
  if (isTrue(alwaysNormalize)) {
    normalizationType = ALWAYS_NORMALIZE;
  }
  return _createElement(context, tag, data, children, normalizationType);
}
```

所以可以看出来`$createElement`对应的`normalizationType`值为 2，`_c`对应的是 1。这个函数只是针对性的处理了参数传递并没有实质逻辑，干活的是`_createElement`：

```js
export function _createElement(
  context: Component,
  tag?: string | Class<Component> | Function | Object,
  data?: VNodeData,
  children?: any,
  normalizationType?: number,
): VNode | Array<VNode> {
  // object syntax in v-bind
  if (isDef(data) && isDef(data.is)) {
    tag = data.is;
  }
  if (!tag) {
    // in case of component :is set to falsy value
    return createEmptyVNode();
  }

  // support single function children as default scoped slot
  // 如果子元素只有一个函数，则作为默认的slot。slot流程很长之后单独说。
  if (Array.isArray(children) && typeof children[0] === 'function') {
    data = data || {};
    data.scopedSlots = { default: children[0] };
    children.length = 0;
  }
  // 处理children归一化
  if (normalizationType === ALWAYS_NORMALIZE) {
    children = normalizeChildren(children); // 完全归一化为一层
  } else if (normalizationType === SIMPLE_NORMALIZE) {
    children = simpleNormalizeChildren(children); // 只归一化第一层
  }
  let vnode, ns;
  if (typeof tag === 'string') {
    let Ctor;
    ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag); // 命名空间
    if (config.isReservedTag(tag)) {
      // platform built-in elements，平台保留标签名
      vnode = new VNode(config.parsePlatformTagName(tag), data, children, undefined, undefined, context);
    } else if (isDef((Ctor = resolveAsset(context.$options, 'components', tag)))) {
      // resolveAsset在context.$options.components中查找key为tag的
      // component，处理自定义组件
      vnode = createComponent(Ctor, data, context, children, tag);
    } else {
      // unknown or unlisted namespaced elements
      // check at runtime because it may get assigned a namespace when its
      // parent normalizes children
      vnode = new VNode(tag, data, children, undefined, undefined, context);
    }
  } else {
    // direct component options / constructor
    vnode = createComponent(tag, data, context, children);
  }
  if (Array.isArray(vnode)) {
    return vnode;
  } else if (isDef(vnode)) {
    if (isDef(ns)) applyNS(vnode, ns);
    if (isDef(data)) registerDeepBindings(data);
    return vnode;
  } else {
    return createEmptyVNode();
  }
}
```

`data`参数就是我们在`generate -> genData`中的返回值。 归一化涉及到两个函数`normalizeChildren`和`simpleNormalizeChildren`，会单独用一篇文章来描述。

后面判断了 tag 的类型，如果是字符串，那么分为 3 种情况：

1. 如果是平台保留标签名，则直接创建 vnode 对象

2. 如果`resolveAsset(context.$options, 'components', tag)`能够拿到值，那么执行`createComponent`函数。`resolveAsset`其实就是在获取我们的自定义组件选项，同样`createComponent`也是在生成我们自定义组件的`vnode`。`resolveAsset`的逻辑比较简单，获取通过各种方式去尝试获取`vm.$options['components'][tag]`

   ```js
   /**
    * Resolve an asset.
    * This function is used because child instances need access
    * to assets defined in its ancestor chain.
    */
   export function resolveAsset(options: Object, type: string, id: string, warnMissing?: boolean): any {
     if (typeof id !== 'string') {
       return;
     }
     const assets = options[type];
     // check local registration variations first
     if (hasOwn(assets, id)) return assets[id];
     const camelizedId = camelize(id);
     if (hasOwn(assets, camelizedId)) return assets[camelizedId];
     const PascalCaseId = capitalize(camelizedId);
     if (hasOwn(assets, PascalCaseId)) return assets[PascalCaseId];
     const res = assets[id] || assets[camelizedId] || assets[PascalCaseId];
     if (process.env.NODE_ENV !== 'production' && warnMissing && !res) {
       warn('Failed to resolve ' + type.slice(0, -1) + ': ' + id, options);
     }
     return res;
   }
   ```

3. 如果既不是平台保留标签也不是自定义组件标签，那么也是直接创建`vnode`

如果`tag`的类型不是字符串，那么也是当做自定义组件来处理。最后返回我们的`vnode`。现在我们就是剩下`createComponent`这一种情况需要了解。

# createComponent 生成自定义组件 vnode

代码位于`src/core/vdom/create-component.js`，有点长：

```js
const componentVNodeHooks = {
  init(vnode: VNodeWithData, hydrating: boolean): ?boolean {
    // ...
  },
  prepatch(oldVnode: MountedComponentVNode, vnode: MountedComponentVNode) {
    // ...
  },
  insert(vnode: MountedComponentVNode) {
    // ...
  },
  destroy(vnode: MountedComponentVNode) {
    // ...
  },
};

const hooksToMerge = Object.keys(componentVNodeHooks);

export function createComponent(
  Ctor: Class<Component> | Function | Object | void,
  data: ?VNodeData,
  context: Component,
  children: ?Array<VNode>,
  tag?: string,
): VNode | Array<VNode> | void {
  const baseCtor = context.$options._base; // 也就是Vue构造函数

  // plain options object: turn it into a constructor
  if (isObject(Ctor)) {
    Ctor = baseCtor.extend(Ctor); // Vue.extend
  }

  // async component暂时略去。。。

  data = data || {};

  // resolve constructor options in case global mixins are applied after
  // component constructor creation
  // 递归合并父构造器上的选项到Ctor.options上
  resolveConstructorOptions(Ctor);

  // transform component v-model data into props & events
  if (isDef(data.model)) {
    transformModel(Ctor.options, data);
  }

  // extract props
  /**
   * 在子组件中获取父组件的方法和数据时，是通过props来传递的。
   * 使用的时候需要在子组件中定义props属性，来指定使用父组件传递的哪些数据，
   * 以及每个属性的类型是什么。
   *
   * extractPropsFromVNodeData就是获取定义的props数据，它们的值是
   * 父组件的tempalte中定义在子组件的节点上，然后通过genData收集放到了这里的data参数上
   */
  const propsData = extractPropsFromVNodeData(data, Ctor, tag);

  // functional component函数式组件暂时略去。。。

  // extract listeners, since these needs to be treated as
  // child component listeners instead of DOM listeners
  // 保存的是我们绑定在元素上的事件，且该事件没有加native修饰符
  const listeners = data.on;
  // replace with listeners with .native modifier
  // so it gets processed during parent component patch.
  // 保存的是添加了native修饰符的事件
  data.on = data.nativeOn;

  if (isTrue(Ctor.options.abstract)) {
    // abstract components do not keep anything
    // other than props & listeners & slot

    // work around flow
    const slot = data.slot;
    data = {};
    if (slot) {
      data.slot = slot;
    }
  }

  // install component management hooks onto the placeholder node
  installComponentHooks(data);

  // return a placeholder vnode
  const name = Ctor.options.name || tag;
  const vnode = new VNode(
    `vue-component-${Ctor.cid}${name ? `-${name}` : ''}`,
    data,
    undefined,
    undefined,
    undefined,
    context,
    { Ctor, propsData, listeners, tag, children },
    asyncFactory,
  );

  return vnode;
}
```

大部分代码都打了注释，专门看看一些帮助函数。

## extractPropsFromVNodeData

用于解析子组件定义的`props`的实际值，这些实际值都是在父组件的`template`中放到子组件标签上的。

```js
/**
 * 从attrs或props中抽取props配置的数据
 *
 * @author liubin.frontend
 * @export
 * @param {VNodeData} data genData的返回值
 * @param {Class<Component>} Ctor
 * @param {string} [tag]
 * @returns {?Object}
 */
export function extractPropsFromVNodeData(data: VNodeData, Ctor: Class<Component>, tag?: string): ?Object {
  // we are only extracting raw values here.
  // validation and default values are handled in the child
  // component itself.
  const propOptions = Ctor.options.props;
  if (isUndef(propOptions)) {
    return;
  }
  const res = {};
  const { attrs, props } = data;
  if (isDef(attrs) || isDef(props)) {
    for (const key in propOptions) {
      const altKey = hyphenate(key);
      checkProp(res, props, key, altKey, true) || checkProp(res, attrs, key, altKey, false);
    }
  }
  return res;
}

// 将找到的值放到res中
function checkProp(res: Object, hash: ?Object, key: string, altKey: string, preserve: boolean): boolean {
  if (isDef(hash)) {
    if (hasOwn(hash, key)) {
      res[key] = hash[key];
      if (!preserve) {
        delete hash[key];
      }
      return true;
    } else if (hasOwn(hash, altKey)) {
      res[key] = hash[altKey];
      if (!preserve) {
        delete hash[altKey];
      }
      return true;
    }
  }
  return false;
}
```

我们看到解析`props`的值是从子组件标签的`props`或`attrs`上找，而且优先级是`props`>`attrs`.并且在`checkProps`中可以看到，如果在`props`中找到了，还会从`props`中删掉它。

另外一个小细节是`altKey`是烤串形式书写的，所以这就要求`props`和`attrs`中的名称也是烤串形式的。

## installComponentHooks

用于将 data 上的钩子和默认钩子进行合并，合并后的钩子再放回 data 上。

```js
function installComponentHooks(data: VNodeData) {
  const hooks = data.hook || (data.hook = {});
  // hooksToMerge: [ 'init', 'prepatch', 'insert','destroy']
  for (let i = 0; i < hooksToMerge.length; i++) {
    const key = hooksToMerge[i];
    const existing = hooks[key];
    const toMerge = componentVNodeHooks[key];
    if (existing !== toMerge && !(existing && existing._merged)) {
      hooks[key] = existing ? mergeHook(toMerge, existing) : toMerge;
    }
  }
}

function mergeHook(f1: any, f2: any): Function {
  const merged = (a, b) => {
    // flow complains about extra args which is why we use any
    f1(a, b);
    f2(a, b);
  };
  merged._merged = true;
  return merged;
}
```

有 4 种默认钩子`init`、`prepatch`、`insert`、`destroy`，它们分别会在`patch`过程中的`vnode`对象初始化、`patch`之前、插入到`dom`中、`vnode`销毁的时候调用。合并后的钩子会再调用时依次执行两个子钩子。

最后`createComponent`函数执行完后就会调用`VNode`的构造函数，返回的`vnode`的`tag`格式为`vue-component-cid-name`。至此我们的`render`生成`vnode`流程就讲完了。可以看到花费篇幅最大的还是自定义组件的 vnode 生成。
