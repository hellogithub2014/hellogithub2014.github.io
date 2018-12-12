---
title: 'Vue源码解析9-children归一化'
img: sweden.jpg # Add image post (optional)
date: 2018-11-04 18:20:00
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [Vue, javascript]
---

# 前言

归一化操作其实就是将多维的数组，合并转换成一个一维的数组。在 Vue 中归一化分为三个级别，

- 0：不需要进行归一化
- 1：只需要简单的归一化处理，将数组打平一层
- 2：完全归一化，将一个 N 层的 children 完全打平为一维数组

归一化的代码位于`src/core/vdom/create-element.js`的`createElement`中，我们的`vm._c`和`vm.$createElement`都会调用这个函数。

```js
const SIMPLE_NORMALIZE = 1
const ALWAYS_NORMALIZE = 2

wrapper function for providing a more flexible interface
without getting yelled at by flow
export function createElement (
  context: Component,
  tag: any,
  data: any,
  children: any,
  normalizationType: any,
  alwaysNormalize: boolean
): VNode | Array<VNode> {
  if (Array.isArray(data) || isPrimitive(data)) {
    normalizationType = children
    children = data
    data = undefined
  }
  if (isTrue(alwaysNormalize)) {
    normalizationType = ALWAYS_NORMALIZE
  }
  return _createElement(context, tag, data, children, normalizationType)
}

export function _createElement (
  context: Component,
  tag?: string | Class<Component> | Function | Object,
  data?: VNodeData,
  children?: any,
  normalizationType?: number
): VNode | Array<VNode> {
	...

	处理children归一化
  if (normalizationType === ALWAYS_NORMALIZE) {
    children = normalizeChildren(children)
  } else if (normalizationType === SIMPLE_NORMALIZE) {
    children = simpleNormalizeChildren(children)
  }

  ...
}
```

`vm._c`传入的`alwaysNormalize`为`false`，而`vm.$createElement`传入的`alwaysNormalize`为`true`。所以最终前者会调用`simpleNormalizeChildren`来处理`children`，后者会使用`normalizeChildren`。

> The template compiler attempts to minimize the need for normalization by
> statically analyzing the template at compile time.
> For plain HTML markup, normalization can be completely skipped because the
> generated render function is guaranteed to return Array<VNode>. There are
> two cases where extra normalization is needed.

# 1. simpleNormalizeChildren

> When the children contains components - because a functional component
> may return an Array instead of a single root. In this case, just a simple
> normalization is needed - if any child is an Array, we flatten the whole
> thing with Array.prototype.concat. It is guaranteed to be only 1-level deep
> because functional components already normalize their own children.

```js
export function simpleNormalizeChildren(children: any) {
  for (let i = 0; i < children.length; i++) {
    if (Array.isArray(children[i])) {
      return Array.prototype.concat.apply([], children);
    }
  }
  return children;
}
```

如果有任何一个 child 是数组，那么直接整个 children 打平一层,例如：

```js
var arr = [1,2,3,4,[5,6,[7,8]]]
Array.prototype.concat.apply([],arr ) => [1, 2, 3, 4, 5, 6, [7,8]]
```

我们可以试着手动调用一下`vm._c`：

```js
var h = vm._c;
h('div', null, ['test', [h('p'), h('p'), ['inner']]], 1);
```

返回的 vnode 结果关键属性有：

```js
{
	tag: "div",
	children:[
		'test',
		 {tag: "p"}, // VNode
		 {tag: "p"}, // VNode
		 ['inner']
	]
}
```

可以看到只打平了一层。

# 2. normalizeChildren

> When the children contains constructs that always generated nested Arrays,
> e.g. <template>, <slot>, v-for, or when the children is provided by user
> with hand-written render functions / JSX. In such cases a full normalization
> is needed to cater to all possible types of children values.

```js
export function normalizeChildren(children: any): ?Array<VNode> {
  return isPrimitive(children) ? [createTextVNode(children)] : Array.isArray(children) ? normalizeArrayChildren(children) : undefined;
}

function isTextNode(node): boolean {
  return isDef(node) && isDef(node.text) && isFalse(node.isComment);
}

// 将整个children完全打平成一维数组，如[1,2,[3,4,[5,6]]] => [1,2,3,4,5,6]
function normalizeArrayChildren(children: any, nestedIndex?: string): Array<VNode> {
  const res = [];
  let i, c, lastIndex, last;
  for (i = 0; i < children.length; i++) {
    c = children[i];
    if (isUndef(c) || typeof c === 'boolean') continue;
    lastIndex = res.length - 1;
    last = res[lastIndex];
    //  nested
    if (Array.isArray(c)) {
      if (c.length > 0) {
        c = normalizeArrayChildren(c, `${nestedIndex || ''}_${i}`); // 打平后的一维数组c
        // merge adjacent text nodes, 将res最后一个元素和c的第一个元素合并
        if (isTextNode(c[0]) && isTextNode(last)) {
          res[lastIndex] = createTextVNode(last.text + (c[0]: any).text);
          c.shift();
        }
        res.push.apply(res, c);
      }
    } else if (isPrimitive(c)) {
      if (isTextNode(last)) {
        // merge adjacent text nodes
        // this is necessary for SSR hydration because text nodes are
        // essentially merged when rendered to HTML strings
        res[lastIndex] = createTextVNode(last.text + c);
      } else if (c !== '') {
        // convert primitive to vnode
        res.push(createTextVNode(c));
      }
    } else {
      if (isTextNode(c) && isTextNode(last)) {
        // merge adjacent text nodes
        res[lastIndex] = createTextVNode(last.text + c.text);
      } else {
        // default key for nested array children (likely generated by v-for)
        if (isTrue(children._isVList) && isDef(c.tag) && isUndef(c.key) && isDef(nestedIndex)) {
          c.key = `__vlist${nestedIndex}_${i}__`;
        }
        res.push(c);
      }
    }
  }
  return res;
}
```

其实就是利用递归来处理的，同时处理了一些边界情况。同样手动调用下`vm.$createElement`来触发此逻辑：

```js
var h = vm.$createElement;
h('div', ['test', [h('p'), h('p'), ['inner']], null, true]);
```

返回 vnode 结果的关键属性：

```js
{
	tag: "div",
	children: [
		{ text: "test", tag: undefined }, // VNode
		{ tag: "p" } , // VNode
		{ tag: "p" } , // VNode
		{ text: "inner", tag: undefined }, // VNode
	]
}
```

可以看到全部都打平了。
