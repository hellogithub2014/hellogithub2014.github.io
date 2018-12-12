---
title: 'Vue源码解析14-指令处理概述'
summary_img: /images/indonesia.jpg # Add image post (optional)
date: 2018-11-17 14:20:00

tag: [Vue, javascript]
---

接下来的几篇文章焦点放到`Vue`的指令处理上，我们知道`Vue`内置了一些指令，比如常用的`v-for`、`v-if`等。这篇文章会先从整体上讲述对指令的处理，不会涉及具体指令的细节。

# `parse`阶段

依然是从`parse`阶段开始，在`src/compiler/parser/index.js`中，会调用各个指令的`processXXX`：

```js
// 处理v-pre指令, 如<span v-pre>{{ this will not be compiled }}</span>
// 若有，则element.pre=true
processPre(element);

// ...

// structural directives
processFor(element); // 处理节点上的v-for属性
processIf(element); // 处理节点上的v-if属性
// v-once只渲染元素和组件一次。随后的重新渲染，元素/组件及其所有的子节点将被视为静态内容并跳过。这可以用于优化更新性能。
processOnce(element); // 处理节点上的v-once属性
// element-scope stuff
processElement(element, options); // 处理ref、slot、is、自定义指令以及其他所有普通属性
```

`processElement`函数处理 `ref`、`slot`、`is`、自定义指令以及其他所有普通属性：

```js
export function processElement(element: ASTElement, options: CompilerOptions) {
  processKey(element); // 处理静态或动态key属性

  // ...

  processRef(element); // 处理静态或动态ref属性
  processSlot(element); // 处理slot，获取slotTarget和slotScope属性
  processComponent(element); // 处理is属性，将对应值设置到component属性上
  // 处理class、style module的transformNode
  for (let i = 0; i < transforms.length; i++) {
    /**
     * transforms目前只在class和style的module中有定义，逻辑类似
     * 见src/platforms/web/compiler/modules文件夹。
     * 其中
     * 1. class的transforms作用：
     *   a. 获取静态绑定的class属性，放到el.staticClass
     *   b. 获取动态绑定的class属性，放到el.classBinding
     * 2. style的transforms作用：
     *  a. 获取静态绑定的style属性，放到el.staticStyle
     *  b. 获取动态绑定的style属性，放到el.styleBinding
     */
    element = transforms[i](element, options) || element;
  }
  processAttrs(element); // 处理element上的所有属性，根据属性名分为自定义指令和普通属性
}
```

`processAttrs`处理`element`上的所有其他属性，包括自定义指令和普通属性：

```js
function processAttrs(el) {
  // attrsList结构示范：[{name:'id',value:'app'}]
  const list = el.attrsList;
  let i, l, name, rawName, value, modifiers, isProp;
  for (i = 0, l = list.length; i < l; i++) {
    name = rawName = list[i].name;
    value = list[i].value;
    // v- 或 @ 或 : 开头的属性名
    if (dirRE.test(name)) {
      // mark element as dynamic
      el.hasBindings = true;
      // modifiers修饰符， 即.xxx，若存在则返回一个对象， {m1: true, m2:true}
      modifiers = parseModifiers(name);
      if (modifiers) {
        name = name.replace(modifierRE, ''); // 去除修饰符
      }
      if (bindRE.test(name)) {
        // v-bind，: 或 v-bind: 开头的属性绑定
        name = name.replace(bindRE, ''); // 去掉: 或 v-bind:
        value = parseFilters(value); // 解析可能的过滤器，若存在则返回的value是一个字符串
        isProp = false;
        if (modifiers) {
          // 见v-bind api: https://cn.vuejs.org/v2/api/#v-bind
          // .prop修饰符：被用于绑定 DOM 属性 (property)
          if (modifiers.prop) {
            isProp = true;
            name = camelize(name);
            if (name === 'innerHtml') name = 'innerHTML'; // innerHtml.prop
          }
          // .camel - (2.1.0+) 将 kebab-case 特性名转换为 camelCase
          if (modifiers.camel) {
            name = camelize(name);
          }
          // .sync (2.3.0+) 语法糖，会扩展成一个更新父组件绑定值的 v-on 侦听器。
          if (modifiers.sync) {
            addHandler(el, `update:${camelize(name)}`, genAssignmentCode(value, `$event`)); // 添加事件监听
          }
        }
        if (isProp || (!el.component && platformMustUseProp(el.tag, el.attrsMap.type, name))) {
          addProp(el, name, value);
        } else {
          // attrs只存在动态绑定的属性，如[{name: "href"，value: 'xxx'}]
          // attrsList存在的是大杂烩，存在所有动态/静态属性
          //      [{name: ":href"，value: 'xxx'},
          //      {name: "target", value: "_blank"},
          //      {name: "@click.native", value: "log"}]
          addAttr(el, name, value); // 将去除修饰符之后的属性添加到el.attrs数组
        }
      } else if (onRE.test(name)) {
        // v-on事件处理见此前文章，此处略过...
      } else {
        // normal directives，普通指令， v-xxx
        name = name.replace(dirRE, '');
        // parse arg，解析指令参数
        const argMatch = name.match(argRE);
        const arg = argMatch && argMatch[1];
        if (arg) {
          name = name.slice(0, -(arg.length + 1));
        }
        // 添加el.directives数组元素
        // el.directives.push({ name, rawName, value, arg, modifiers })
        addDirective(el, name, rawName, value, arg, modifiers);
        if (process.env.NODE_ENV !== 'production' && name === 'model') {
          checkForAliasModel(el, value);
        }
      }
    } else {
      // 往el.attrs上添加元素,attrs的结构与attrsList相同
      addAttr(el, name, JSON.stringify(value));
    }
  }
}
```

对于自定义指令是通过`addDirective`处理并放到`el.directives`：

```js
export function addDirective(el: ASTElement, name: string, rawName: string, value: string, arg: ?string, modifiers: ?ASTModifiers) {
  (el.directives || (el.directives = [])).push({ name, rawName, value, arg, modifiers });
  el.plain = false;
}
```

以上就是`parse`阶段对指令的处理了，处理完后并在`ast`上添加各种属性。

# `generate`阶段生成`render`字符串

在这个阶段的`genData`中会处理`parse`阶段放到`ast`上的各种指令属性：

```js
export function genData(el: ASTElement, state: CodegenState): string {
  let data = '{';

  // directives first. 自定义指令
  // directives may mutate the el's other properties before they are generated.
  const dirs = genDirectives(el, state);
  if (dirs) data += dirs + ',';

  // key
  if (el.key) {
    data += `key:${el.key},`;
  }
  // ref
  if (el.ref) {
    data += `ref:${el.ref},`;
  }
  if (el.refInFor) {
    data += `refInFor:true,`;
  }
  // pre
  if (el.pre) {
    data += `pre:true,`;
  }
  // record original tag name for components using "is" attribute
  if (el.component) {
    data += `tag:"${el.tag}",`;
  }
  // module data generation functions。
  // 目前只有class和style中有定义genData,位于src/platforms/web/compiler/modules文件夹
  /**
   * style的genData将el.staticStyle（静态style）和el.styleBinding（动态绑定的style）放入data中
   * class的genData将el.staticClass和el.classBinding放入data中
   */
  for (let i = 0; i < state.dataGenFns.length; i++) {
    data += state.dataGenFns[i](el);
  }
  // attributes，格式{name: stirng,value:any}[]
  if (el.attrs) {
    data += `attrs:{${genProps(el.attrs)}},`;
  }
  // DOM props
  if (el.props) {
    data += `domProps:{${genProps(el.props)}},`;
  }

  // 事件处理略...

  // slot target
  // only for non-scoped slots
  if (el.slotTarget && !el.slotScope) {
    data += `slot:${el.slotTarget},`;
  }
  // scoped slots，作用域插槽
  if (el.scopedSlots) {
    data += `${genScopedSlots(el.scopedSlots, state)},`;
  }
  // component v-model
  if (el.model) {
    data += `model:{value:${el.model.value},callback:${el.model.callback},expression:${el.model.expression}},`;
  }

  data = data.replace(/,$/, '') + '}';
  // v-bind data wrap
  if (el.wrapData) {
    data = el.wrapData(data);
  }
  // v-on data wrap
  if (el.wrapListeners) {
    data = el.wrapListeners(data);
  }
  return data;
}
```

我们的自定义指令在最开始就被`genDirectives`处理：

```js
/**
 * 自定义指令的render字符串生成，若节点的html为<p v-loading.foo.bar="loading">123</p>，
 * 则在parse阶段后，el.directives数组会有一个元素，它的关键属性有：
 * {
 *    name: "loading"
      rawName: "v-loading.foo.bar"
      value: "loading"
      arg: null，
      modifiers: {foo: true, bar: true}
 * }
 *
 * @author liubin.frontend
 * @param {ASTElement} el
 * @param {CodegenState} state
 * @returns {(string | void)} 示范："directives:[{name:"loading",rawName:"v-loading.foo.bar",value:(loading),expression:"loading",modifiers:{"foo":true,"bar":true}}]"
 */
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

以上就是在`generate`阶段对于指令的处理，处理完后会将各种属性放到`data`对象上，这个对象在`render`生成`vnode`时会被放到`vnode.data`上。

# `patch`阶段处理`vnode.data`

在`patch`的`invokeCreateHooks`中调用`cbs`上各种子`module`的钩子来处理`vnode.data`上的数据：

```js
function invokeCreateHooks(vnode, insertedVnodeQueue) {
  // 调用每个module的create钩子，一共8个module，见cbs定义处的注释
  for (let i = 0; i < cbs.create.length; ++i) {
    /**
     * 各个子module的create功能：
     * 1. attrs：将新增data.attrs放入vnode.elm，同时移除旧的data.attrs
     * 2. style: 将data.staticStyle/style放入vnode.elm.style，同时移除旧的style
     * 3. class: 将静态class和动态class结合，直接覆盖到vnode.elm.class
     * 4. events：利用新旧vnode的data.on更新vnode.elm的事件处理函数，使用addEventListener/removeEventListener
     * 5. domProps:处理原生dom属性，如textContent、innerHTML、value等，将新的dom属性加到vnode.elm，移除旧的dom属性
     * 6. transition: 略
     * 7. ref: 处理data.ref，令 vnode.context.refs[data.ref] = vnode.elm, 即指向的是原生dom
     * 8. directives: 处理指令，根据不同阶段调用指令的不同钩子，例如新建时调用bind钩子、更新时调用update钩子
     */
    cbs.create[i](emptyNode, vnode);
  }

  // ...
}
```

其中对于自定义组件的处理是在`directives`这个钩子中,代码位于`src/core/vdom/modules/directives.js`:

```js
export default {
  create: updateDirectives,
  update: updateDirectives,
  destroy: function unbindDirectives(vnode: VNodeWithData) {
    updateDirectives(vnode, emptyNode);
  },
};

function updateDirectives(oldVnode: VNodeWithData, vnode: VNodeWithData) {
  if (oldVnode.data.directives || vnode.data.directives) {
    _update(oldVnode, vnode);
  }
}
```

`_update`就是调用自定义组件上的各个选项函数，如`bind`、`update`、`inserted`等。

以上就是指令处理的概述，接下来的几篇文章会针对各个指令详细描述。
