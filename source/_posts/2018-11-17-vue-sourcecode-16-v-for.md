---
title: 'Vue源码解析16-v-for的处理'
summary_img: /images/nevada.jpg # Add image post (optional)
date: 2018-11-17 17:20:00

tag: [Vue, javascript]
---

# parse

`processFor`用于处理`v-for`指令：

```js
export function processFor(el: ASTElement) {
  let exp;
  // 从attrsMap中获取key为‘v-for’的属性值，例如 "(value,key,index) in items"
  if ((exp = getAndRemoveAttr(el, 'v-for'))) {
    const res = parseFor(exp);
    if (res) {
      extend(el, res);
    }
  }
}
```

依然还是用例子来帮助理解，假设`html`为：

```js
<div id="app">
  <div v-for="(value,key,index) in items">111</div>
</div>
```

首先`getAndRemoveAttr`看名字应该能查到它是获取并删除特定的节点属性：

```js
// note: this only removes the attr from the Array (attrsList) so that it
// doesn't get processed by processAttrs.
// By default it does NOT remove it from the map (attrsMap) because the map is
// needed during codegen.
export function getAndRemoveAttr(el: ASTElement, name: string, removeFromMap?: boolean): ?string {
  let val;
  // attrsMap用于快速查找有没有某个属性，attrsList用于存放所有的属性
  if ((val = el.attrsMap[name]) != null) {
    const list = el.attrsList;
    for (let i = 0, l = list.length; i < l; i++) {
      if (list[i].name === name) {
        list.splice(i, 1);
        break;
      }
    }
  }
  if (removeFromMap) {
    delete el.attrsMap[name];
  }
  return val;
}
```

由于我们没有传入`removeFromMap`参数，所以节点上还是保留了`v-for`属性。这样我们拿到的`exp`就是`(value,key,index) in items`，`parseFor`用于解析这个表达式，获取其中的各个部分：

```js
export function parseFor(exp: string): ?ForParseResult {
  // 若exp为(value,key,index)， inMatch为
  /**
   * [
   *    "(value,key,index) in items",
        "(value,key,index)",
        "items"
   * ]
  */
  const inMatch = exp.match(forAliasRE);
  if (!inMatch) return;
  const res = {};
  res.for = inMatch[2].trim();
  // 去掉两边括号，结果为‘value,key,index’
  const alias = inMatch[1].trim().replace(stripParensRE, '');
  /**
   * iteratorMatch示范
   * [
   *    ",key,index",
        "key",
        "index"
   * ]
  */
  const iteratorMatch = alias.match(forIteratorRE);
  if (iteratorMatch) {
    res.alias = alias.replace(forIteratorRE, ''); // 'value'
    res.iterator1 = iteratorMatch[1].trim(); // 'key'
    if (iteratorMatch[2]) {
      res.iterator2 = iteratorMatch[2].trim(); // 'index'
    }
  } else {
    res.alias = alias; // ‘value,key,index’
  }
  return res;
}
```

注释应该很详细，之所以有很多`if`判断是因为`v-for`的格式可以有很多种，需要针对性处理。我们的示范经过`parseFor`处理后拿到结果为：

```js
{
    for: 'items',
    alias: 'value',
    iterator1: 'key'
    iterator2: 'index'
  }
```

最终经过`parse`，上面的这几个属性会全部放到`el`这个`AST`节点上。

# generate

`src/compiler/codegen/index.js`中的`genFor`用于处理`AST`节点上与`v-for`相关的属性，生成对应字符串：

```js
export function genFor(el: any, state: CodegenState, altGen?: Function, altHelper?: string): string {
  const exp = el.for;
  const alias = el.alias;
  const iterator1 = el.iterator1 ? `,${el.iterator1}` : '';
  const iterator2 = el.iterator2 ? `,${el.iterator2}` : '';

  el.forProcessed = true; // avoid recursion
  // 示范："_l((items),function(value,key,index){return _c('p',[_v(_s(index)+". "+_s(key)+" : "+_s(value))])})"
  return `${altHelper || '_l'}((${exp}),` + `function(${alias}${iterator1}${iterator2}){` + `return ${(altGen || genElement)(el, state)}` + '})';
}
```

炒鸡简单有木有，我们生成的字符串如下：

```js
`_l(items, function(value, key, index) {
  return _c('div', [_v('111')]);
})`;
```

`_v`（`createTextVNode`）用于创建一个`vnode`文本结点：

```js
export function createTextVNode(val: string | number) {
  return new VNode(undefined, undefined, undefined, String(val));
}
```

`_c`在之前讲述`vnode`时提过,这里再贴出来下：

```js
vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false);
```

`_l`(`renderList`)用于渲染列表：

```js
/**
 * Runtime helper for rendering v-for lists.
 */
export function renderList(val: any, render: (val: any, keyOrIndex: string | number, index?: number) => VNode): ?Array<VNode> {
  let ret: ?Array<VNode>, i, l, keys, key;
  if (Array.isArray(val) || typeof val === 'string') {
    ret = new Array(val.length);
    for (i = 0, l = val.length; i < l; i++) {
      ret[i] = render(val[i], i);
    }
  } else if (typeof val === 'number') {
    ret = new Array(val);
    for (i = 0; i < val; i++) {
      ret[i] = render(i + 1, i);
    }
  } else if (isObject(val)) {
    keys = Object.keys(val);
    ret = new Array(keys.length);
    for (i = 0, l = keys.length; i < l; i++) {
      key = keys[i];
      ret[i] = render(val[key], key, i);
    }
  }
  if (isDef(ret)) {
    (ret: any)._isVList = true;
  }
  return ret;
}
```

参数`val`的形式可以有多种：字符串、数字、对象、数组，代码比较简单很快能看懂。

最终我们拿到的`render`字符串为：

```js
`
with (this) {
  return _c(
    'div',
    { attrs: { id: 'app' } },
    _l(items, function(value, key, index) {
      return _c('div', [_v('111')]);
    }),
  );
}
`;
```

之后就是生成`vnode`了，`v-for`的痕迹就看不到了。
