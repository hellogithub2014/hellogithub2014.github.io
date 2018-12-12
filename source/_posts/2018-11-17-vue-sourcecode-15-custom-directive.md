---
title: 'Vue源码解析15-自定义指令'
img: malaysia.jpg # Add image post (optional)
date: 2018-11-17 16:20:00

tag: [Vue, javascript]
---

`Vue`可以自定义局部和全局指令，具体用法参考官网即可，这篇文章讲述其内部实现。

# `parse`

在上篇指令概述中已有大概说到，在`processAttrs`函数中会处理自定义指令，这里详细说下。

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
      // 其他处理...

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

      // v-model处理...
    }
  }
}
```

直接看代码有点抽象，我们用一个例子:

```html
<p v-mydir:myarg.foo.bar="msg">111</p>
```

经过`parseModifiers`处理后得到的`modifiers`为

```js
{
  foo: true,
  bar: true,
}
```

然后经过`replace(modifierRE, '')`和`replace(dirRE, '')`后，我们得到的`name`就是`mydir:myarg`了。其中`myarg`是指令的参数，指令是可以接收参数的，参考[官网教程](https://cn.vuejs.org/v2/guide/syntax.html#%E6%8C%87%E4%BB%A4)。之后的`argMatch`就是用来解析指令的参数，最终我们得到的`name`就是`mydir`，`arg`是就是`myarg`。

`addDirective`向`el.directives`塞入上述得到的几个属性值：

```js
export function addDirective(el: ASTElement, name: string, rawName: string, value: string, arg: ?string, modifiers: ?ASTModifiers) {
  (el.directives || (el.directives = [])).push({ name, rawName, value, arg, modifiers });
  el.plain = false;
}
```

所以最终我们的`el.directives`为：

```js
[
  {
    arg: 'myarg',
    modifiers: { foo: true, bar: true },
    name: 'mydir',
    rawName: 'v-mydir:myarg.foo.bar',
    value: 'msg',
  },
];
```

# `generate`

依然如上篇文章所提，在`genData`中会首先调用`genDirectives`处理自定义指令：

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

经过处理，我们拿到的字符串为：

```js
`
directives:[
  {
    name:"mydir",
    rawName:"v-mydir:myarg.foo.bar",
    value:(msg),expression:"msg",
    arg:"myarg",
    modifiers:{"foo":true,"bar":true}
  }
]
`;
```

之后经过`render`生成`vnode`，这些都会放到`vnode.data.directives`上。

# patch

上篇概述里已提到`_update`中会在不停阶段调用指令的不同选项：

```js
function _update(oldVnode, vnode) {
  const isCreate = oldVnode === emptyNode; // 第一次创建，oldVnode为空
  const isDestroy = vnode === emptyNode; // 销毁时，vnode为空。
  const oldDirs = normalizeDirectives(oldVnode.data.directives, oldVnode.context);
  const newDirs = normalizeDirectives(vnode.data.directives, vnode.context);

  const dirsWithInsert = [];
  const dirsWithPostpatch = [];

  let key, oldDir, dir;
  for (key in newDirs) {
    oldDir = oldDirs[key];
    dir = newDirs[key];
    if (!oldDir) {
      // new directive, bind
      callHook(dir, 'bind', vnode, oldVnode); // 调用指令的bind方法
      if (dir.def && dir.def.inserted) {
        dirsWithInsert.push(dir);
      }
    } else {
      // existing directive, update
      dir.oldValue = oldDir.value;
      callHook(dir, 'update', vnode, oldVnode); // 调用指令的update方法
      if (dir.def && dir.def.componentUpdated) {
        dirsWithPostpatch.push(dir);
      }
    }
  }

  if (dirsWithInsert.length) {
    const callInsert = () => {
      for (let i = 0; i < dirsWithInsert.length; i++) {
        // 调用指令的inserted方法
        callHook(dirsWithInsert[i], 'inserted', vnode, oldVnode);
      }
    };
    if (isCreate) {
      // 将callInsert合并到vnode.data.hook[‘insert’]数组中，不会立即调用
      mergeVNodeHook(vnode, 'insert', callInsert);
    } else {
      callInsert();
    }
  }

  if (dirsWithPostpatch.length) {
    // 将callInsert合并到vnode.data.hook[‘postpatch’]数组中，不会立即调用
    mergeVNodeHook(vnode, 'postpatch', () => {
      for (let i = 0; i < dirsWithPostpatch.length; i++) {
        callHook(dirsWithPostpatch[i], 'componentUpdated', vnode, oldVnode);
      }
    });
  }

  if (!isCreate) {
    for (key in oldDirs) {
      if (!newDirs[key]) {
        // no longer present, unbind，调用指令的unbind方法
        callHook(oldDirs[key], 'unbind', oldVnode, oldVnode, isDestroy);
      }
    }
  }
}
```

`normalizeDirectives`用于获取自定义指令的具体选项：

```js
function normalizeDirectives(dirs: ?Array<VNodeDirective>, vm: Component): { [key: string]: VNodeDirective } {
  const res = Object.create(null);
  if (!dirs) {
    return res;
  }
  let i, dir;
  for (i = 0; i < dirs.length; i++) {
    dir = dirs[i];
    if (!dir.modifiers) {
      dir.modifiers = emptyModifiers;
    }
    res[getRawDirName(dir)] = dir;
    dir.def = resolveAsset(vm.$options, 'directives', dir.name, true);
  }
  return res;
}

function getRawDirName(dir: VNodeDirective): string {
  return dir.rawName || `${dir.name}.${Object.keys(dir.modifiers || {}).join('.')}`;
}
```

返回的`res`对象中存放着指令的定义，`key`为指令名，`value`为指令的选项对象，通常包含`bind`、`insert`、`update`等钩子函数。`resolveAsset`方法就是获取指令的定义，会将指令名转为驼峰、中划线的各种形式来尝试获取

拿到指令定义后，如果是新增的指令，则执行`callHook(dir, 'bind', vnode, oldVnode)`调用指令的`bind`方法：

```js
function callHook(dir, hook, vnode, oldVnode, isDestroy) {
  const fn = dir.def && dir.def[hook];
  if (fn) {
    try {
      fn(vnode.elm, dir, vnode, oldVnode, isDestroy);
    } catch (e) {
      handleError(e, vnode.context, `directive ${dir.name} ${hook} hook`);
    }
  }
}
```

如果不是第一次绑定，则调用`update`钩子函数。

之后如果`vnode`是第一次创建，`isCreate`为`true`，会把`dirsWithInsert`数组中的回调合并到 `vnode.data.hook.insert`中。,如果不是则直接执行`dirsWithInsert`中的回调。`insert`钩子的执行时机应该是`dom`节点已经插入到页面中。

剩下的逻辑都很简单了，这里不再赘述。
