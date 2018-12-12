---
title: 'Vue源码解析11-patch创建dom'
img: bora-bora.jpg # Add image post (optional)
date: 2018-11-10 17:20:00 Asia/Shanghai
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [Vue, javascript]
---

# 前言

上篇文章了解了`patch`的入口，这篇文章的目的是了解`patch`函数功能的一部分：**创建 DOM**。`patch`的功能大致分为 3 块：

1. 有`oldVnode`无`vnode`，调用`oldVnode`的`destroy`流程
2. 无`oldVnode`有`vnode`，调用创建`dom`流程
3. 有`oldVnode`有`vnode`，调用`diff`流程

这块的代码是：

```js
function patch(oldVnode, vnode, hydrating, removeOnly) {
  if (isUndef(vnode)) {
    if (isDef(oldVnode)) invokeDestroyHook(oldVnode); // 没有新vnode只有旧vnode，表明在destroy
    return;
  }

  let isInitialPatch = false;
  const insertedVnodeQueue = [];

  if (isUndef(oldVnode)) {
    // empty mount (likely as component), create new root element
    isInitialPatch = true;
    // 没有旧vnode有新的vnode，表明在进行初始渲染
    createElm(vnode, insertedVnodeQueue);
  } else {
    const isRealElement = isDef(oldVnode.nodeType); // 是否为真实dom元素
    // sameVnode成立条件： key相同 && tag相同 && 都有data && 相同的input type
    if (!isRealElement && sameVnode(oldVnode, vnode)) {
      // 有新vnode有旧vnode，同时oldVnode不是真实dom，需要执行diff逻辑
      // patch existing root node
      patchVnode(oldVnode, vnode, insertedVnodeQueue, removeOnly);
    } else {
      // 有新vnode有旧vnode，同时oldVnode是真实dom，，执行创建元素流程
      // createElm创建元素流程....
    }
  }
}
```

`patch`就会开始真正操作`dom`元素了，此前都是操作`vnode`。今天我们的重点就是最后的`createElm创建元素流程`. 有个细节，可以看到上面有 2 个分支会调用`createElm`，第一个是`isUndef(oldVnode)`成立的那个`if`，这个很好理解。 那最下面的那个`createElm`何时成立呢？

在`Vue.prototype._update`中是这样调用`patch`的：

```js
if (!prevVnode) {
  vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false); //initial render
} else {
  vm.$el = vm.__patch__(prevVnode, vnode); // update
}
```

也就是说在初始化时传入的`oldVnode`实际上是`vm.$el`这个真实的`dom`元素，这时我们的`isRealElement`就会是`true`。 接下来就会描述具体创建流程。

# 创建 dom

此分支的具体代码：

```js
if (isRealElement) {
  oldVnode = emptyNodeAt(oldVnode); // 创建一个空的vnode
}

// replacing existing element
const oldElm = oldVnode.elm;
const parentElm = nodeOps.parentNode(oldElm); // 通常我们的vm.$el的父元素是body

// create new node
createElm(
  vnode,
  insertedVnodeQueue,
  // extremely rare edge case: do not insert if old element is in a
  // leaving transition. Only happens when combining transition +
  // keep-alive + HOCs. (#4590)
  oldElm._leaveCb ? null : parentElm,
  nodeOps.nextSibling(oldElm), // createElm的新创建元素的参照物锚点元素
);
// update parent placeholder node element, recursively
if (isDef(vnode.parent)) {
  let ancestor = vnode.parent;
  const patchable = isPatchable(vnode);
  while (ancestor) {
    // 1. 调用子moudle的destroy钩子
    for (let i = 0; i < cbs.destroy.length; ++i) {
      cbs.destroy[i](ancestor);
    }
    // 2. 更新elm
    ancestor.elm = vnode.elm;
    if (patchable) {
      // 3. 调用子moudle的create钩子
      for (let i = 0; i < cbs.create.length; ++i) {
        cbs.create[i](emptyNode, ancestor);
      }
      // #6513
      // invoke insert hooks that may have been merged by create hooks.
      // e.g. for directives that uses the "inserted" hook.
      const insert = ancestor.data.hook.insert;
      if (insert.merged) {
        // start at index 1 to avoid re-invoking component mounted hook
        for (let i = 1; i < insert.fns.length; i++) {
          insert.fns[i]();
        }
      }
    } else {
      registerRef(ancestor);
    }
    ancestor = ancestor.parent;
  }
}

// destroy old node
if (isDef(parentElm)) {
  removeVnodes(parentElm, [oldVnode], 0, 0);
} else if (isDef(oldVnode.tag)) {
  invokeDestroyHook(oldVnode);
}
```

可以看到主要分为 3 块： `createElm`、更新父元素、删除`oldVnode`。

## createElm

```js
function createElm(vnode, insertedVnodeQueue, parentElm, refElm, nested, ownerArray, index) {
  if (isDef(vnode.elm) && isDef(ownerArray)) {
    // This vnode was used in a previous render!
    // now it's used as a new node, overwriting its elm would cause
    // potential patch errors down the road when it's used as an insertion
    // reference node. Instead, we clone the node on-demand before creating
    // associated DOM element for it.
    vnode = ownerArray[index] = cloneVNode(vnode);
  }

  vnode.isRootInsert = !nested; // for transition enter check
  if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
    return;
  }

  const data = vnode.data;
  const children = vnode.children;
  const tag = vnode.tag;
  if (isDef(tag)) {
    // nodeOps位于src/platforms/web/runtime/node-ops.js
    // createElement主要是document.createElement(tag)
    // 此时vnode.elm就是一个真正的DOM元素了！！
    vnode.elm = vnode.ns ? nodeOps.createElementNS(vnode.ns, tag) : nodeOps.createElement(tag, vnode);
    setScope(vnode); // 尝试为vnode.elm添加scopeId attribute

    // 为每个child生成child.elm，并以vnode.elm作为父节点
    createChildren(vnode, children, insertedVnodeQueue);
    if (isDef(data)) {
      // 调用8个子module的create钩子，为vnode.elm增加各种属性或事件处理
      invokeCreateHooks(vnode, insertedVnodeQueue);
    }
    // 将vnode.elm插入到parentElm的children中，这样到下次页面渲染时就可以绘制到页面了~
    // refElm是新创建元素的参照物锚点元素
    insert(parentElm, vnode.elm, refElm);
  } else if (isTrue(vnode.isComment)) {
    // 创建注释dom
    vnode.elm = nodeOps.createComment(vnode.text);
    insert(parentElm, vnode.elm, refElm);
  } else {
    // 创建文本dom
    vnode.elm = nodeOps.createTextNode(vnode.text);
    insert(parentElm, vnode.elm, refElm);
  }
}
```

其中`createComponent`用于创建自定义组件这里先略过后续再说。那么剩下的其他代码就很好理解了，大致就是利用`vnode`的各种属性来创建真实的 dom，最后插入到父 dom 节点上，等到下次页面渲染我们就能看到更新了。

参数上的`refElm`是新创建元素并插入父节点时的参照物锚点元素，在`insert`函数中：

```js
function insert(parent, elm, ref) {
  if (isDef(parent)) {
    if (isDef(ref)) {
      if (nodeOps.parentNode(ref) === parent) {
        nodeOps.insertBefore(parent, elm, ref);
      }
    } else {
      nodeOps.appendChild(parent, elm);
    }
  }
}
```

如果有`ref`则放到`ref`前面，如果没有则放到最后。

接下来我们主要看看`createChildren`和`invokeCreateHooks`怎么实现的。

### createChildren

```js
// 为每个child生成child.elm，并以vnode.elm作为父节点
function createChildren(vnode, children, insertedVnodeQueue) {
  if (Array.isArray(children)) {
    for (let i = 0; i < children.length; ++i) {
      // 生成children[i].elm，并以vnode.elm作为父节点
      createElm(children[i], insertedVnodeQueue, vnode.elm, null, true, children, i);
    }
  } else if (isPrimitive(vnode.text)) {
    nodeOps.appendChild(vnode.elm, nodeOps.createTextNode(String(vnode.text)));
  }
}
```

如果`children`是数组，那么递归调用元素来`createElm`；如果是个普通文本，那么直接创建一个文本节点插入到父节点。这样我们就生成了一个 dom 子树。

### invokeCreateHooks

主要调用各种子`module`的`create`钩子，虽然代码比较短，但是涉及的内容很多。

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
  // 经过上面的for循环，vnode.data.hook可能会增加各种钩子，如insert或postpatch等
  i = vnode.data.hook; // Reuse variable
  if (isDef(i)) {
    if (isDef(i.create)) i.create(emptyNode, vnode);
    if (isDef(i.insert)) insertedVnodeQueue.push(vnode);
  }
}
```

我在注释里只说了每种`module`的`create`钩子干了什么，而没有说具体是怎么做的，这个留给大家自己去看，基本上代码都很不难。

`cbs`我们在上篇文章也有说过，这里再提下，它相当于一个钩子的分类汇总对象：

```js
const cbs = {};
const { modules, nodeOps } = backend;

/**
 * 将每个modules中每个子moudle定义的各种钩子统一放到cbs中，最后cbs的结构示范
 * {
 *    create: [module1Create, module2Create],
 *    update: [module1Update, module2Update],
 *    remove: [xxx],
 *    destroy: [xxx],
 *    activate: [xxx],
 * }
 *
 * 钩子分为两类：platformModules和baseModules
 *
 * platformModules： 平台相关的一些属性的处理，包括attrs、class、domProps、events、style和transtion。
 * 代码位于src/platforms/web/runtime/modules/index.js，每个子module都会包含create和update两个钩子。
 *
 * baseModules：是web和weex都有的处理，包括directives和ref属性的处理。
 * 代码位于src/core/vdom/modules/index.js，每个子module同样会包含create和update两个钩子。
 */
for (i = 0; i < hooks.length; ++i) {
  cbs[hooks[i]] = [];
  for (j = 0; j < modules.length; ++j) {
    if (isDef(modules[j][hooks[i]])) {
      cbs[hooks[i]].push(modules[j][hooks[i]]);
    }
  }
}
```

`backend`是调用`createPatchFunction`传入的参数，可以在`src/platforms/web/runtime/patch.js`找到。

## removeVnodes、invokeDestroyHook

用于删除一个`vnode`。

### removeVnodes

```js
function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
  for (; startIdx <= endIdx; ++startIdx) {
    const ch = vnodes[startIdx];
    if (isDef(ch)) {
      if (isDef(ch.tag)) {
        removeAndInvokeRemoveHook(ch); // 调用remove钩子
        invokeDestroyHook(ch); // 调用自身及后代的destroy钩子
      } else {
        // Text node
        removeNode(ch.elm);
      }
    }
  }
}
```

主要就是调用`remove`和`destroy`两个钩子。

### invokeDestroyHook

```js
function invokeDestroyHook(vnode) {
  let i, j;
  const data = vnode.data;
  if (isDef(data)) {
    if (isDef((i = data.hook)) && isDef((i = i.destroy))) i(vnode);
    for (i = 0; i < cbs.destroy.length; ++i) cbs.destroy[i](vnode);
  }
  if (isDef((i = vnode.children))) {
    for (j = 0; j < vnode.children.length; ++j) {
      invokeDestroyHook(vnode.children[j]);
    }
  }
}
```

可以看到和`invokeCreateHooks`逻辑非常类似，这里就交给大家自己看了。

最后光看代码在一些细节上很容易蒙圈，最好拿着简单的`demo`逐步打断点调试，例如：

```js
<div id="app">
    <a :href="url" style="color:red;" class="aaa">{{message}}</a>
    <p>静态根节点<span>静态内容</span></p>
    <button ref="btn" @click="num += 1">ceshi</button>
    <input type="range" v-model="num" @blur="num+=123">
  </div>
```

可以覆盖这里说的大部分的主要场景。
