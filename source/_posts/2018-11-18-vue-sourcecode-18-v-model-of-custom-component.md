---
title: 'Vue源码解析18-自定义组件的v-model'
img: new-zealand.jpg # Add image post (optional)
date: 2018-11-18 12:20:00
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [Vue, javascript]
---

# 前言

这篇文章主要讨论自定义组件的`v-model`处理，会顺带提一提普通标签上的`v-model`处理。`v-model`算是比较复杂的一个内置指令了，主要是对于不同的宿主元素它需要不同的特殊处理，所以分支比较多。

# parse

在`parse`阶段，它是和自定义指令在`processAttrs`函数内的同一个分支进行处理的，不同的是会多一个校验：

```js
function processAttrs(el) {
  // ...
  addDirective(el, name, rawName, value, arg, modifiers);
  if (process.env.NODE_ENV !== 'production' && name === 'model') {
    checkForAliasModel(el, value);
  }
  // ...
}
```

`checkForAliasModel`用于检查`v-model`的参数是否是`v-for`的迭代对象：

```js
function checkForAliasModel(el, value) {
  let _el = el;
  while (_el) {
    if (_el.for && _el.alias === value) {
      warn(
        `<${el.tag} v-model="${value}">: ` +
          `You are binding v-model directly to a v-for iteration alias. ` +
          `This will not be able to modify the v-for source array because ` +
          `writing to the alias is like modifying a function local variable. ` +
          `Consider using an array of objects and use v-model on an object property instead.`,
      );
    }
    _el = _el.parent;
  }
}
```

这个函数会去找是否有某个祖先元素存在`v-for`，而不仅仅是父元素。

# generate

同样和指令处理流程一致，会调用`genDirectives`：

```js
function genDirectives(el: ASTElement, state: CodegenState): string | void {
  const dirs = el.directives; // 节点上的普通指令
  if (!dirs) return;
  let res = 'directives:[';
  let hasRuntime = false;
  let i, l, dir, needRuntime;
  for (i = 0, l = dirs.length; i < l; i++) {
    dir = dirs[i];
    needRuntime = true;
    // state.directives目前包含v-on、v-bind、v-cloak、v-html、v-model、v-text
    const gen: DirectiveFunction = state.directives[dir.name];
    if (gen) {
      // compile-time directive that manipulates AST.
      // returns true if it also needs a runtime counterpart.
      needRuntime = !!gen(el, dir, state.warn);
    }
    if (needRuntime) {
      hasRuntime = true;
      res += `{name:"${dir.name}",rawName:"${dir.rawName}"${dir.value ? `,value:(${dir.value}),expression:${JSON.stringify(dir.value)}` : ''}${
        dir.arg ? `,arg:"${dir.arg}"` : ''
      }${dir.modifiers ? `,modifiers:${JSON.stringify(dir.modifiers)}` : ''}},`;
    }
  }
  if (hasRuntime) {
    return res.slice(0, -1) + ']';
  }
}
```

`v-model`指令存在于`state.directives`之中，所以`gen`会被执行，`v-model`的`gen`位于`src/platforms/web/compiler/directives/model.js`的`model`函数：

```js
export default function model(el: ASTElement, dir: ASTDirective, _warn: Function): ?boolean {
  warn = _warn;
  const value = dir.value;
  const modifiers = dir.modifiers;
  const tag = el.tag;
  const type = el.attrsMap.type;

  if (process.env.NODE_ENV !== 'production') {
    // inputs with type="file" are read only and setting the input's
    // value will throw an error.
    if (tag === 'input' && type === 'file') {
      warn(`<${el.tag} v-model="${value}" type="file">:\n` + `File inputs are read only. Use a v-on:change listener instead.`);
    }
  }

  if (el.component) {
    genComponentModel(el, value, modifiers);
    // component v-model doesn't need extra runtime
    return false;
  } else if (tag === 'select') {
    genSelect(el, value, modifiers);
  } else if (tag === 'input' && type === 'checkbox') {
    genCheckboxModel(el, value, modifiers);
  } else if (tag === 'input' && type === 'radio') {
    genRadioModel(el, value, modifiers);
  } else if (tag === 'input' || tag === 'textarea') {
    genDefaultModel(el, value, modifiers);
  } else if (!config.isReservedTag(tag)) {
    genComponentModel(el, value, modifiers);
    // component v-model doesn't need extra runtime
    return false;
  } else if (process.env.NODE_ENV !== 'production') {
    warn(
      `<${el.tag} v-model="${value}">: ` +
        `v-model is not supported on this element type. ` +
        "If you are working with contenteditable, it's recommended to " +
        'wrap a library dedicated for that purpose inside a custom component.',
    );
  }

  // ensure runtime directive metadata
  return true;
}
```

这里针对自定义组件、`select`、`checkbox`、`radio`、`textarea`做了特殊处理，我们的兴趣在自定义组件，其余的可以自己去了解，代码并不复杂。

可以看到针对自定义组件，`model`函数返回的是`false`，所以在`genDirectives`中也不会把结果放到`res`中，之后在`patch`阶段也不会执行各种指令钩子函数。接下来看看`genComponentModel`：

```js
/**
 * Cross-platform code generation for component v-model
 */
export function genComponentModel(el: ASTElement, value: string, modifiers: ?ASTModifiers): ?boolean {
  const { number, trim } = modifiers || {};

  const baseValueExpression = '$$v';
  let valueExpression = baseValueExpression;
  if (trim) {
    valueExpression = `(typeof ${baseValueExpression} === 'string'` + `? ${baseValueExpression}.trim()` + `: ${baseValueExpression})`;
  }
  if (number) {
    valueExpression = `_n(${valueExpression})`;
  }
  const assignment = genAssignmentCode(value, valueExpression);

  el.model = {
    value: `(${value})`,
    expression: `"${value}"`,
    callback: `function (${baseValueExpression}) {${assignment}}`,
  };
}
```

光看这段代码有点抽象，况且还调用了其他子函数，最好使用测试代码打个断点看看。我们使用的测试代码是：

```html
<div id="app"><my-comp v-model="txt"></my-comp></div>
<script type="text/javascript">
  var vm = new Vue({
    el: '#app',
    data() {
      return {
        txt: 'ttttt',
      };
    },
    components: {
      myComp: {
        props: {
          value: {
            type: String,
            default: '',
          },
        },
        template: `
                                                                  <p>{{value}}</p>
                                                                `,
      },
    },
  });
</script>
```

执行完`genComponentModel`后，`el.model`添加的 3 个属性值为：

```js
el.model = {
  callback: 'function ($$v) {txt=$$v}',
  expression: '"txt"',
  value: '(txt)',
};
```

`genAssignmentCode`子函数主要是处理绑定到`v-model`的各种形式，如`value、value.a、value['a']、value[0]`，这里不赘述。

之后在`genData`中又会有专门的分支处理`el.model`，这是为自定义组件准备的：

```js
export function genData(el: ASTElement, state: CodegenState): string {
  // ...
  // component v-model
  if (el.model) {
    data += `model:{value:${el.model.value},callback:${el.model.callback},expression:${el.model.expression}},`;
  }
  //...
}
```

所以我们的测试代码最后给`data`对象添加的属性值为：

```js
`
data.model = {
  value: txt,
  callback: function($$v) {
    txt = $$v;
  },
  expression: 'txt',
};
`;
```

# render 生成 vnode

自定义组件在创建`vnode`对象时，会调用`createComponent`方法(位于`src/core/vdom/create-component.js`),其中会专门处理`data.model`:

```js
export function createComponent(
  Ctor: Class<Component> | Function | Object | void,
  data: ?VNodeData,
  context: Component,
  children: ?Array<VNode>,
  tag?: string,
): VNode | Array<VNode> | void {
  // ...
  // transform component v-model data into props & events
  if (isDef(data.model)) {
    transformModel(Ctor.options, data);
  }

  //...
}
```

因为自定义组件可以定制`v-model`的`props`和`event`名称，`transformModel`就是来处理这种定制情形的：

```js
// transform component v-model info (value and callback) into
// prop and event handler respectively.
function transformModel(options, data: any) {
  const prop = (options.model && options.model.prop) || 'value';
  const event = (options.model && options.model.event) || 'input';
  (data.props || (data.props = {}))[prop] = data.model.value;
  const on = data.on || (data.on = {});
  if (isDef(on[event])) {
    on[event] = [data.model.callback].concat(on[event]);
  } else {
    on[event] = data.model.callback;
  }
}
```

在拿到`prop`和`event`的真正名称后，就会将`data.model.value`和`data.model.callback`赋值给`data.props`和`data.on`，之后`v-model`的痕迹就消失了，到这里应该可以看出来`v-model`其实只是一个语法糖。
