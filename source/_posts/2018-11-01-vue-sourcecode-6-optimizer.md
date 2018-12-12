---
title: 'Vue源码解析6-静态AST优化'
summary_img: /images/malaysia.jpg # Add image post (optional)
date: 2018-11-01 08:20:00

tag: [Vue, javascript]
---

上篇文章说到了模板解析的第一步`parse`，现在来说第二步`optimize`，用于优化静态内容的渲染，主要是给静态节点打上一些标记。

`Vue`中对于生成的`AST`会做优化，静态内容是指和数据没有关系，不需要每次都刷新的内容，这一步主要就是找出 ast 中的静态内容，并加以标注。

这一步的代码比`parse`要少太多，应该压力会小很多 🙄，先看一下入口代码：

```js
/**
 * Goal of the optimizer: walk the generated template AST tree
 * and detect sub-trees that are purely static, i.e. parts of
 * the DOM that never needs to change.
 *
 * Once we detect these sub-trees, we can:
 *
 * 1. Hoist them into constants, so that we no longer need to
 *    create fresh nodes for them on each re-render;
 * 2. Completely skip them in the patching process.
 */
export function optimize(root: ?ASTElement, options: CompilerOptions) {
  if (!root) return;
  // isStaticKey: (key)=> boolean，判断一个key是否是
  // type,tag,attrsList,attrsMap,plain,parent,children,attrs其中之一
  isStaticKey = genStaticKeysCached(options.staticKeys || '');
  isPlatformReservedTag = options.isReservedTag || no;
  // first pass: mark all non-static nodes.
  markStatic(root);
  // second pass: mark static roots.
  markStaticRoots(root, false);
}
```

可以看到代码非常简短，只有两步：`markStatic`和`markStaticRoots`。我们挨个把这里的每个子函数讲一下。

## genStaticKeysCached、isStaticKey

`genStaticKeysCached`用于缓存一个函数的执行结果，这种技巧在很多地方有可以用到，比如求解斐波那契数列。

```js
const genStaticKeysCached = cached(genStaticKeys); // 缓存genStaticKeys结果，每次先从缓存中查找，找不到再执行genStaticKeys

/**
 * Create a cached version of a pure function.
 */
export function cached<F: Function>(fn: F): F {
  const cache = Object.create(null);
  return (function cachedFn(str: string) {
    const hit = cache[str];
    return hit || (cache[str] = fn(str)); // 缓存中有就直接返回，没有的话再执行求解函数
  }: any);
}

function genStaticKeys(keys: string): Function {
  return makeMap('type,tag,attrsList,attrsMap,plain,parent,children,attrs' + (keys ? ',' + keys : ''));
}

/**
 * Make a map and return a function for checking if a key
 * is in that map.
 */
export function makeMap(str: string, expectsLowerCase?: boolean): (key: string) => true | void {
  const map = Object.create(null);
  const list: Array<string> = str.split(',');
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true;
  }
  return expectsLowerCase ? val => map[val.toLowerCase()] : val => map[val];
}
```

所以经过一系列嵌套，我们的`isStaticKey`就是查找指定`key`是否存在于`makeMap`的结果中，如果之前已经查找过这个`key`那么可以直接从`cache`中拿到缓存的结果。

## markStatic

这个函数会遍历整个 AST，为了更好的了解其中的过程，最好进行断点调试每一步，比如如下的`template`：

```html
<div id="app">
  这里是文本<箭头之后的文本
  <p>{{message}}</p>
  <p>静态文本<a href="https://www.baidu.com">博客地址</a></p>
</div>
<script type="text/javascript">
  var vm = new Vue({
    el: '#app',
    data: {
      message: '动态文本',
    },
  });
</script>
```

生成的`AST`会是：

```js
{
  type: 1,
  tag: "div",
  attrsList: [{name: "id", value: "app"}],
  attrsMap: {id: "app"},
  parent: undefined,
  children: [{
	      type: 3,
	      text: '这里是文本<箭头之后的文本'
    },
    {
	      type: 1,
	      tag: 'p',
	      attrsList: [],
	      attrsMap: {},
	      parent: ,
	      children: [{
	        type: 2,
	        expression: '_s(message)',
	        text: '{{message}}'
	      }],
	      plain: true
    },
    {
	      text: " ",
	      type: 3
    },
    {
	      type: 1,
	      tag: 'p',
	      attrsList: [],
	      attrsMap: {},
	      children: [{
			text: "静态文本",
			type: 3
	  },
 	  {
	    	attrs: [{name: "href", value: '"http://www.baidu.com"'}],
			attrsList: [{name: "href", value: 'http://www.baidu.com'}],
			attrsMap: {href: 'http://www.baidu.com'}
			children: [{
				text: "博客地址",
				type: 3
			}]
			plain: false,
			tag: "a",
			type: 1
	   }
 	  ],
     plain: true
    }
  ],
  plain: false,
  attrs: [{name: "id", value: "'app'"}]
}
```

现在看看函数定义，它的目的是给 AST 上每个节点打上`static`标记。

```js
function markStatic(node: ASTNode) {
  node.static = isStatic(node);
  if (node.type === 1) {
    // do not make component slot content static. this avoids
    // 1. components not able to mutate slot nodes
    // 2. static slot content fails for hot-reloading
    if (!isPlatformReservedTag(node.tag) && node.tag !== 'slot' && node.attrsMap['inline-template'] == null) {
      return;
    }
    // 若有其中一个child的static为false，则父节点的static也需要设置为false
    for (let i = 0, l = node.children.length; i < l; i++) {
      const child = node.children[i];
      markStatic(child);
      if (!child.static) {
        node.static = false;
      }
    }
    // 若节点属于v-if、v-else-if、v-else，则只要其中一个分支不是static的，整个node就设置为不是static
    if (node.ifConditions) {
      for (let i = 1, l = node.ifConditions.length; i < l; i++) {
        const block = node.ifConditions[i].block;
        markStatic(block);
        if (!block.static) {
          node.static = false;
        }
      }
    }
  }
}
```

思路是先利用`isStatic`判断自身是否是`static`的，然后判断所有`children`，只要其中一个`child`不是`static`的，那么自己也不是`static`的；最后如果处于`v-if、v-else-if、v-else`，则只要其中一个分支不是`static`的，整个`node`就设置为不是`static`。

### isStatic

判断一个 AST 节点是否为静态的，上面也提到静态内容是指和数据没有关系，不需要每次都刷新的内容。

```js
function isStatic(node: ASTNode): boolean {
  if (node.type === 2) {
    // expression
    return false;
  }
  if (node.type === 3) {
    // text
    return true;
  }
  return !!(
    node.pre || // 节点上有v-pre指令，节点的内容是不做编译的
    (!node.hasBindings && // no dynamic bindings
    !node.if &&
    !node.for && // not v-if or v-for or v-else
    !isBuiltInTag(node.tag) && // not a built-in
    isPlatformReservedTag(node.tag) && // not a component
      !isDirectChildOfTemplateFor(node) &&
      Object.keys(node).every(isStaticKey))
  );
}

// 是否位于一个<template v-for="xxx">
function isDirectChildOfTemplateFor(node: ASTElement): boolean {
  while (node.parent) {
    node = node.parent;
    if (node.tag !== 'template') {
      return false;
    }
    if (node.for) {
      return true;
    }
  }
  return false;
}
```

可以看到标记`static`的条件有 2 个：

1. 节点上有`v-pre`指令，[官网文档](https://cn.vuejs.org/v2/api/#v-pre)也说了在编译时遇到这个指令会跳过它
2. 没有动态绑定属性 && 不是`v-if` && 不是`v-for` && 不是内置的标签`slot`、`component` && 是平台保留标签，即`HTML`或`SVG`标签 && 不是位于一个`<template v-for="xxx">` && 节点的所有属性均是`type,tag,attrsList,attrsMap,plain,parent,children,attrs`其中之一。

第二个条件非常严格，想成为`static`的还真是不容易。。。

经过这一步之后，我们的`AST`变为

```js
{
  type: 1,
  tag: "div",
  attrsList: [{name: "id", value: "app"}],
  attrsMap: {id: "app"},
  parent: undefined,
  children: [{
      type: 3,
      text: '这里是文本<箭头之后的文本',
      static: true
    },
    {
      type: 1,
      tag: 'p',
      attrsList: [],
      attrsMap: {},
      parent: ,
      children: [{
        type: 2,
        expression: '_s(message)',
        text: '{{message}}',
        static: false
      }],
      plain: true,
      static: false
    },
    {
      text: " ",
      type: 3,
      static: true
    },
    {
      type: 1,
      tag: 'p',
      attrsList: [],
      attrsMap: {},
      children: [{
          text: "静态文本",
          type: 3,
          static: true
        },
        {
          attrs: [{name: "href", value: '"http://www.baidu.com"'}],
          attrsList: [{name: "href", value: 'http://www.baidu.com'}],
          attrsMap: {href: 'http://www.baidu.com'}
          children: [{
            text: "博客地址",
            type: 3,
            static: true
          }],
          plain: false,
          tag: "a",
          type: 1,
          static: true
        }
      ],
      plain: true,
      static: true
    }
  ],
  plain: false,
  attrs: [{name: "id", value: "'app'"}],
  static: false
}
```

## markStaticRoots

用来找到那种本身是`static`的，同时只有唯一的一个`text`子节点，将他们标记为`staticRoot`,即静态根节点。

```js
function markStaticRoots(node: ASTNode, isInFor: boolean) {
  if (node.type === 1) {
    if (node.static || node.once) {
      node.staticInFor = isInFor;
    }
    // For a node to qualify as a static root, it should have children that
    // are not just static text. Otherwise the cost of hoisting out will
    // outweigh the benefits and it's better off to just always render it fresh.
    if (node.static && node.children.length && !(node.children.length === 1 && node.children[0].type === 3)) {
      // node本身是static的，同时只有唯一的一个text子节点
      node.staticRoot = true;
      return;
    } else {
      node.staticRoot = false;
    }
    // 递归children，为它们标记staticRoot
    if (node.children) {
      for (let i = 0, l = node.children.length; i < l; i++) {
        markStaticRoots(node.children[i], isInFor || !!node.for); // 注意这里比下面的递归多了一个node.for
      }
    }
    // 若节点属于v-if、v-else-if、v-else，遍历所有分支
    if (node.ifConditions) {
      for (let i = 1, l = node.ifConditions.length; i < l; i++) {
        markStaticRoots(node.ifConditions[i].block, isInFor);
      }
    }
  }
}
```

最终咱们`optimize`过的`AST`如下：

```js
{
  type: 1,
  tag: "div",
  attrsList: [{name: "id", value: "app"}],
  attrsMap: {id: "app"},
  parent: undefined,
  children: [{
      type: 3,
      text: '这里是文本<箭头之后的文本',
      static: true
    },
    {
      type: 1,
      tag: 'p',
      attrsList: [],
      attrsMap: {},
      parent: ,
      children: [{
        type: 2,
        expression: '_s(message)',
        text: '{{message}}',
        static: false
      }],
      plain: true,
      static: false,
      staticRoot: false
    },
    {
      text: " ",
      type: 3,
      static: true
    },
    {
      type: 1,
      tag: 'p',
      attrsList: [],
      attrsMap: {},
      children: [{
          text: "静态文本",
          type: 3,
          static: true
        },
        {
          attrs: [{name: "href", value: '"http://www.baidu.com"'}],
          attrsList: [{name: "href", value: 'http://www.baidu.com'}],
          attrsMap: {href: 'http://www.baidu.com'}
          children: [{
            text: "博客地址",
            type: 3,
            static: true
          }],
          plain: false,
          tag: "a",
          type: 1,
          static: true
        }
      ],
      plain: true,
      static: true,
      staticInFor: false,
      staticRoot: true
    }
  ],
  plain: false,
  attrs: [{name: "id", value: "'app'"}],
  static: false,
  staticRoot: false
}
```
