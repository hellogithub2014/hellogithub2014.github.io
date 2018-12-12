---
title: 'Vue源码解析7-生成render函数'
img: new-york.jpg # Add image post (optional)
date: 2018-11-03 17:20:00
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [Vue, javascript]
---

# 前言

上篇文章说到了模板解析的第一步`parse`，现在来说第最后一步`generate`，用于生成`render`函数。这一步的代码基本都放在了`src/compiler/codegen/index.js`中，初看一下会觉得非常长，但并没有想象中复杂，只是需要处理的情况比较多。

在这篇文章里只会介绍最简单的处理，目的是了解整个`generate`的大致思路。其他的分支会在后续的其他文章里逐步介绍。同时最后会把整个源码注释放到附件里。

理解`generate`的处理过程最好是自己打断点一步步调试，这样才不会被茫茫多的处理分支弄晕。这篇文章的采用的测试代码是：

```html
<div id="app">
  <a :href="url">{{message}}</a>
  <p>静态根节点<span>静态内容</span></p>
</div>
<script type="text/javascript">
  var vm = new Vue({
    el: '#app',
    data: {
      message: '博客地址',
      url: 'https://www.baidu.com',
    },
  });
</script>
```

在`generate`之前生成的 AST 为：

```js
{
  type: 1,
  tag: "div",
  attrsList: [{name: "id", value: "app"}],
  attrsMap: {id: "app"},
  parent: undefined,
  children: [
    {
      type: 1,
      tag: 'a',
      attrsList: [{name: ":href", value: "url"}],
      attrs: [{name: "href", value: "url"}],
      attrsMap: {':href': url},
      parent: ,
      children: [{
        type: 2,
        expression: '_s(message)',
        text: '{{message}}',
        static: false
      }],
      plain: false,
      static: false,
      staticRoot: false,
      hasBindings: true
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
			text: "静态根节点",
			type: 3,
			static: true
	      },
	      {
			attrsList: [],
			attrsMap: {}
			children: [{
				text: "静态内容",
				type: 3,
				static: true
			}],
			plain: true,
			tag: "span",
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

# 入口

入口函数很简短：

```js
export function generate(ast: ASTElement | void, options: CompilerOptions): CodegenResult {
  const state = new CodegenState(options);
  const code = ast ? genElement(ast, state) : '_c("div")';
  return {
    render: `with(this){return ${code}}`,
    staticRenderFns: state.staticRenderFns,
  };
}

export class CodegenState {
  // 各种属性...

  constructor(options: CompilerOptions) {
    this.options = options;
    this.transforms = pluckModuleFunction(options.modules, 'transformCode'); // 一个空数组
    // 目前只有class和style中有定义genData,位于src/platforms/web/compiler/modules文件夹
    this.dataGenFns = pluckModuleFunction(options.modules, 'genData');
    // baseDirectives目前包含v-on、v-cloak和v-bind
    // options.directives在web端包含v-html、v-model、v-text3个
    this.directives = extend(extend({}, baseDirectives), options.directives);
    const isReservedTag = options.isReservedTag || no;
    this.maybeComponent = (el: ASTElement) => !isReservedTag(el.tag);
    this.onceId = 0;
    this.staticRenderFns = [];
  }
}
```

可以看出来最主要的处理逻辑是在`genElement`这个函数。`generate`的返回结果包含两部分:`render`字符串和`staticRenderFns`数组，后者是专门用于生成静态内容的，上篇文章也说到了`optimizer`部分对于静态内容的优化处理，主要是给静态 ast 节点添加了`static`和`staticRoot`两个属性。

# genElement

这个函数的分支很多，不过我们的示范代码中涉及到的分支比较少，这里做一下精简：

```js
export function genElement(el: ASTElement, state: CodegenState): string {
  if (el.staticRoot && !el.staticProcessed) {
    // staticRoot：自身是static的，且有且只有一个text子节点
    return genStatic(el, state);
  }
  // 其他分支略去。。。
  else {
    // component or element
    let code;
    // 处理节点的is属性会将对应值设置到component属性上.
    if (el.component) {
      code = genComponent(el.component, el, state);
    } else {
      // 如果el.plain是true，说明该结点没有属性。
      // data格式示范： "{attrs:{"id":"app"}}"
      const data = el.plain ? undefined : genData(el, state);

      const children = el.inlineTemplate ? null : genChildren(el, state, true);
      // _c函数的第二个参数data就是模板解析时添加到节点上的那些属性
      code = `_c('${el.tag}'${
        data ? `,${data}` : '' // data
      }${
        children ? `,${children}` : '' // children
      })`;
    }
    // module transforms，目前的vue中transforms还只是空数组，可忽略
    for (let i = 0; i < state.transforms.length; i++) {
      code = state.transforms[i](el, code);
    }
    return code;
  }
}
```

## genStatic

用于生成渲染静态内容的字符串。

```js
// hoist static sub-trees out
function genStatic(el: ASTElement, state: CodegenState): string {
  el.staticProcessed = true;
  state.staticRenderFns.push(`with(this){return ${genElement(el, state)}}`);
  return `_m(${state.staticRenderFns.length - 1}${el.staticInFor ? ',true' : ''})`;
}
```

在我们示范里，`el.staticInFor`为`false`。 `_m`是`renderStatic`函数的缩写：

**renderStatic**

```js
export function renderStatic(index: number, isInFor: boolean): VNode | Array<VNode> {
  const cached = this._staticTrees || (this._staticTrees = []);
  let tree = cached[index];
  // if has already-rendered static tree and not inside v-for,
  // we can reuse the same tree.
  if (tree && !isInFor) {
    return tree;
  }
  // otherwise, render a fresh tree.
  tree = cached[index] = this.$options.staticRenderFns[index].call(
    this._renderProxy,
    null,
    this, // for render fns generated for functional component templates
  );
  markStatic(tree, `__static__${index}`, false);
  return tree;
}

function markStatic(tree: VNode | Array<VNode>, key: string, isOnce: boolean) {
  if (Array.isArray(tree)) {
    for (let i = 0; i < tree.length; i++) {
      if (tree[i] && typeof tree[i] !== 'string') {
        markStaticNode(tree[i], `${key}_${i}`, isOnce);
      }
    }
  } else {
    markStaticNode(tree, key, isOnce);
  }
}

function markStaticNode(node, key, isOnce) {
  node.isStatic = true;
  node.key = key;
  node.isOnce = isOnce;
}
```

可以看到`renderStatic`会尽量复用已有的静态内容生成字符串，而不是每次重新调用`staticRenderFns`中的函数重新生成，这里算是一个性能优化，因为静态节点的内容始终是不变的。

## genData、genChildren

处理完静态内容，接下来就会到`else`分支：

```js
// component or element
let code;
// 处理节点的is属性会将对应值设置到component属性上.
if (el.component) {
  code = genComponent(el.component, el, state);
} else {
  // 如果el.plain是true，说明该结点没有属性。
  // data格式示范： "{attrs:{"id":"app"}}"
  const data = el.plain ? undefined : genData(el, state);

  const children = el.inlineTemplate ? null : genChildren(el, state, true);
  // _c函数的第二个参数data就是模板解析时添加到节点上的那些属性
  code = `_c('${el.tag}'${
    data ? `,${data}` : '' // data
  }${
    children ? `,${children}` : '' // children
  })`;
}
// module transforms，目前的vue中transforms还只是空数组，可忽略
for (let i = 0; i < state.transforms.length; i++) {
  code = state.transforms[i](el, code);
}
return code;
```

除了两个子函数`genData`和`genChildren`外，其他代码都很好理解，也加了足够多的注释，其中的`_c`是在`源码解析三`那篇文章里有说到，定义是：

```js
/ bind the createElement fn to this instance
// so that we get proper render context inside it.
// args order: tag, data, children, normalizationType, alwaysNormalize
// internal version is used by render functions compiled from templates
vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false);
```

### genData

这个函数用来收集节点上的各种属性，最后生成一个对象字符串。函数处理的情况也很多，因为属性的种类很多，这里我们照样做一下剪枝：

```js
function genData (el: ASTElement): string {
  let data = '{'

  // 其他分支...

  // attributes，格式{name: stirng,value:any}[]
  if (el.attrs) {
    data += `attrs:{${genProps(el.attrs)}},` // 把属性链接为字符串
  }
  ...
  data = data.replace(/,$/, '') + '}'
  ...
  return data
}
```

**genProps**

```js
function genProps(props: Array<{ name: string, value: any }>): string {
  let res = '';
  for (let i = 0; i < props.length; i++) {
    const prop = props[i];
    res += `"${prop.name}":${transformSpecialNewlines(prop.value)},`;
  }
  return res.slice(0, -1);
}
```

代码还是很简单的，若入参`props`为`[{name: "id",value:"app"},{name:"type",value:"123"}]`， 则最后`genProps`返回的字符串格式类似于`"id": "app","type": "123"`。

### genChildren

转换完属性就是对`children`的操作:

```js
const children = el.inlineTemplate ? null : genChildren(el, state, true);
```

不考虑`inlineTemplate`，这里我们会走到`genChildren(el, state, true)`。

```js
export function genChildren(
  el: ASTElement,
  state: CodegenState,
  checkSkip?: boolean,
  altGenElement?: Function,
  altGenNode?: Function,
): string | void {
  const children = el.children;
  if (children.length) {
    const el: any = children[0];
    // optimize single v-for
    if (children.length === 1 && el.for && el.tag !== 'template' && el.tag !== 'slot') {
      return (altGenElement || genElement)(el, state);
    }
    // normalizationType:归一化级别，可能为0、1、2
    /**
     * “归一化”其实就是把多维的children数组转换成一维，
     * 至于1和2的区别，是两种不同的方式来进行归一化，
     * 为了使归一化消耗最少，所以不同情况使用不同的方式进行归一化，
     * 感兴趣的可以翻开源码src/core/vdom/helpers/normalize-children.js，这里有详细的注释。
     */
    const normalizationType = checkSkip ? getNormalizationType(children, state.maybeComponent) : 0;
    const gen = altGenNode || genNode; // genElement or genComment or genText
    return `[${children.map(c => gen(c, state)).join(',')}]${normalizationType ? `,${normalizationType}` : ''}`;
  }
}
```

如果`el`上存在`v-for`，且`el.children`只有一个元素时，这里直接返回`genElement(el)`.

最后会遍历所有 children，生成他们对应的字符串，然后连接起来。

`normalizationType`的意义在注释里已经说了，看看如何决定它的值的：

```js
// determine the normalization needed for the children array.
// 0: no normalization needed
// 1: simple normalization needed (possible 1-level deep nested array)
// 2: full normalization needed
function getNormalizationType(children: Array<ASTNode>, maybeComponent: (el: ASTElement) => boolean): number {
  let res = 0;
  for (let i = 0; i < children.length; i++) {
    const el: ASTNode = children[i];
    if (el.type !== 1) {
      continue;
    }
    // 节点上有v-for 或 template标签 或 slot标签，或el处于v-if且某个分支满足这些条件
    if (needsNormalization(el) || (el.ifConditions && el.ifConditions.some(c => needsNormalization(c.block)))) {
      res = 2;
      break;
    }
    // maybeComponent：自定义组件，或el处于v-if且某个分支是自定义组件
    if (maybeComponent(el) || (el.ifConditions && el.ifConditions.some(c => maybeComponent(c.block)))) {
      res = 1;
    }
  }
  return res;
}

// 节点上有v-for 或 template标签 或 slot标签
function needsNormalization(el: ASTElement): boolean {
  return el.for !== undefined || el.tag === 'template' || el.tag === 'slot';
}
```

最后的`genNode`：

```js
function genNode(node: ASTNode, state: CodegenState): string {
  if (node.type === 1) {
    return genElement(node, state);
  }
  if (node.type === 3 && node.isComment) {
    return genComment(node);
  } else {
    return genText(node);
  }
}
```

大概瞄一眼`genComment`和`genText`，这俩的逻辑都很简单。

**genComment**

```js
export function genComment(comment: ASTText): string {
  return `_e(${JSON.stringify(comment.text)})`;
}
```

`_e`用于创建一个空节点，大名是`createEmptyVNode`：

```js
export const createEmptyVNode = (text: string = '') => {
  const node = new VNode();
  node.text = text;
  node.isComment = true;
  return node;
};
```

**genText**

```js
export function genText(text: ASTText | ASTExpression): string {
  return `_v(${
    text.type === 2
      ? text.expression // no need for () because already wrapped in _s()
      : transformSpecialNewlines(JSON.stringify(text.text))
  })`;
}
```

`_v`是创建一个文本结点，大名是`createTextVNode`：

```js
export function createTextVNode(val: string | number) {
  return new VNode(undefined, undefined, undefined, String(val));
}
```

最终我们的示范代码里所涉及到的逻辑都讲完了，看看最后`generate`返回的对象，这里我将他们格式化以方便理解：

**render**:

```js
with (this) {
  return _c('div', { attrs: { id: 'app' } }, [_c('a', { attrs: { href: url } }, [_v(_s(message))]), _v(' '), _m(0)]);
}
```

**staticRenderFns**:

```js
with (this) {
  return _c('p', [_v('静态根节点'), _c('span', [_v('静态内容')])]);
}
```

# 完整源码注释

[index.js](https://github.com/hellogithub2014/hellogithub2014.github.io/tree/save/source/_assets/vue-generate/index.js)

[events.js](https://github.com/hellogithub2014/hellogithub2014.github.io/tree/save/source/_assets/vue-generate/events.js)
