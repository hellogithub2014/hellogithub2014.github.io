---
title: 'Vue源码解析12-patch中的diff算法'
img: canyon.jpg # Add image post (optional)
date: 2018-11-10 21:20:00 Asia/Shanghai
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [Vue, javascript]
---

# 前言

上篇文章说到了`patch`中的新增`dom`过程，这篇会说`diif`算法。`Vue`的`diff`算法是基于[`snabbdom`](https://github.com/snabbdom/snabbdom)的，另外网上也有很多分析的文章，我自己是看的[掘金上的篇博客](https://juejin.im/entry/58d3857544d90400692458ee)。

在这里我主要会从代码实现上来描述。

# 入口

在`patch`函数中，如果新旧 vnode 属于`sameVnode`，那么就会执行`patchVnode`过程：

```js
function patch(oldVnode, vnode, hydrating, removeOnly) {
  // ...

  if (isUndef(oldVnode)) {
    // 创建dom
  } else {
    const isRealElement = isDef(oldVnode.nodeType); // 是否为真实dom元素
    // sameVnode成立条件： key相同 && tag相同 && 都有data && 相同的input type
    if (!isRealElement && sameVnode(oldVnode, vnode)) {
      // 有新vnode有旧vnode，同时oldVnode不是真实dom，需要执行diff逻辑
      // patch existing root node
      patchVnode(oldVnode, vnode, insertedVnodeQueue, removeOnly);
    }
  }
  // ...
}
```

`sameVnode`的判断逻辑如下：

```js
function sameVnode(a, b) {
  return (
    a.key === b.key && // key相等
    ((a.tag === b.tag && // 标签名相同
    a.isComment === b.isComment &&
    isDef(a.data) === isDef(b.data) && // 都有vnode.data或都没有vnode.data
      sameInputType(a, b)) || // 相同的input type
      (isTrue(a.isAsyncPlaceholder) && a.asyncFactory === b.asyncFactory && isUndef(b.asyncFactory.error)))
  );
}

function sameInputType(a, b) {
  if (a.tag !== 'input') return true;
  let i;
  const typeA = isDef((i = a.data)) && isDef((i = i.attrs)) && i.type; // data.attrs.type
  const typeB = isDef((i = b.data)) && isDef((i = i.attrs)) && i.type;
  return typeA === typeB || (isTextInputType(typeA) && isTextInputType(typeB));
}
```

`Vue`对于`sameVnode`的判断逻辑和`snabbdom`不同，这点可以了解下。真正的`patch`逻辑在`patchVnode`函数中。

# patchVnode

```js
function patchVnode(oldVnode, vnode, insertedVnodeQueue, removeOnly) {
  if (oldVnode === vnode) {
    return;
  }

  const elm = (vnode.elm = oldVnode.elm);

  // ...

  // reuse element for static trees.
  // note we only do this if the vnode is cloned -
  // if the new node is not cloned it means the render functions have been
  // reset by the hot-reload-api and we need to do a proper re-render.
  if (isTrue(vnode.isStatic) && isTrue(oldVnode.isStatic) && vnode.key === oldVnode.key && (isTrue(vnode.isCloned) || isTrue(vnode.isOnce))) {
    vnode.componentInstance = oldVnode.componentInstance;
    return;
  }

  let i;
  const data = vnode.data;
  // 调用prepatch钩子
  if (isDef(data) && isDef((i = data.hook)) && isDef((i = i.prepatch))) {
    i(oldVnode, vnode);
  }

  const oldCh = oldVnode.children;
  const ch = vnode.children;
  if (isDef(data) && isPatchable(vnode)) {
    // 调用update钩子，主要是处理属性和事件绑定
    for (i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode);
    if (isDef((i = data.hook)) && isDef((i = i.update))) i(oldVnode, vnode);
  }
  if (isUndef(vnode.text)) {
    if (isDef(oldCh) && isDef(ch)) {
      // 新旧children均存在，调用diff来更新children
      if (oldCh !== ch) updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly);
    } else if (isDef(ch)) {
      // 只有新children，全部插入到elm下
      if (isDef(oldVnode.text)) nodeOps.setTextContent(elm, ''); // 消除文本节点
      addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue); // 内部调用的是createElm来生成每个child dom
    } else if (isDef(oldCh)) {
      // 只有旧children，删除他们
      removeVnodes(elm, oldCh, 0, oldCh.length - 1); // 主要是调用remove和destroy钩子
    } else if (isDef(oldVnode.text)) {
      // 新旧children均没有，删除文本节点
      nodeOps.setTextContent(elm, '');
    }
  } else if (oldVnode.text !== vnode.text) {
    // 更新静态文本内容
    nodeOps.setTextContent(elm, vnode.text);
  }
  if (isDef(data)) {
    // postpatch钩子
    if (isDef((i = data.hook)) && isDef((i = i.postpatch))) i(oldVnode, vnode);
  }
}
```

`isStatic`属性为`true`的条件是当前节点是静态节点，所以这里`vnode`和`oldVnode`都是静态节点。

`(isTrue(vnode.isCloned) || isTrue(vnode.isOnce))` 我们在生成`render`函数字符串中，会有`_m`或`_o`，他们分别是`renderStatic`和`markOnce`方法`(src/core/instance/render-static.js中)`。我们的`patchVnode`是在数据变化后调用，`render`方法是不变的，只不过因为执行`render`函数时数据变了，所以生成的`vnode`对象和之前不同。以`_m`为例，再次执行`_m`函数，会直接从`vm._staticTrees`中获取`tree`，并通过`cloneVNode`方法克隆一份出来，这种情况下`vnode.isCloned`值为`true`。

`addVnodes`和`removeVnodes`用于批量新增、删除`dom`，这里不再展开。

剩下的主要逻辑是在`updateChildren`中，它是用于比较两个数组。

# updateChildren

```js
function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue, removeOnly) {
  let oldStartIdx = 0;
  let newStartIdx = 0;
  let oldEndIdx = oldCh.length - 1;
  let oldStartVnode = oldCh[0];
  let oldEndVnode = oldCh[oldEndIdx];
  let newEndIdx = newCh.length - 1;
  let newStartVnode = newCh[0];
  let newEndVnode = newCh[newEndIdx];
  let oldKeyToIdx, idxInOld, vnodeToMove, refElm;

  // removeOnly is a special flag used only by <transition-group>
  // to ensure removed elements stay in correct relative positions
  // during leaving transitions
  const canMove = !removeOnly;

  if (process.env.NODE_ENV !== 'production') {
    checkDuplicateKeys(newCh);
  }

  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (isUndef(oldStartVnode)) {
      // 旧数组的开头为空，向后移一位
      oldStartVnode = oldCh[++oldStartIdx]; // Vnode has been moved left
    } else if (isUndef(oldEndVnode)) {
      // 旧数组的结尾为空，向前移一位
      oldEndVnode = oldCh[--oldEndIdx];
    } else if (sameVnode(oldStartVnode, newStartVnode)) {
      // 旧数组的开头和新数组的开头sameVnode，调用patcVnode，各自均向后移一位
      patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
      oldStartVnode = oldCh[++oldStartIdx];
      newStartVnode = newCh[++newStartIdx];
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      // 旧数组的结尾和新数组的结尾sameVnode，调用patcVnode，各自均向前移一位
      patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
      oldEndVnode = oldCh[--oldEndIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldStartVnode, newEndVnode)) {
      // Vnode moved right
      // 旧数组的开头和新数组的结尾sameVnode，调用patcVnode，旧数组向后移一位，新数组向前移一位
      patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
      // 将oldChildren的开头节点放到oldChildren结束节点之后，注意不是newEndVnode之后
      canMove && nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm));
      oldStartVnode = oldCh[++oldStartIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldEndVnode, newStartVnode)) {
      // Vnode moved left
      // 旧数组的结尾和新数组的开头sameVnode，调用patcVnode，旧数组向前移一位，新数组向后移一位
      patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
      // oldChildren的结尾节点放到oldChildren开头节点之前，注意不是newStartVnode之前，也不是整个oldChildren的开头
      canMove && nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
      oldEndVnode = oldCh[--oldEndIdx];
      newStartVnode = newCh[++newStartIdx];
    } else {
      // oldKeyToIdx: oldCh中每个元素的key到索引的映射
      if (isUndef(oldKeyToIdx)) oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
      // 找到newStartVnode在旧数组中的位置：根据key来映射或者迭代查找
      idxInOld = isDef(newStartVnode.key) ? oldKeyToIdx[newStartVnode.key] : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx);
      if (isUndef(idxInOld)) {
        // New element，创建新节点，并插入到oldStartVnode之前
        // 如果索引不存在，说明这个节点是新创建的，插入到旧数组的当前开头之前
        createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx);
      } else {
        // 待删除元素，这是需要移动位置的节点
        vnodeToMove = oldCh[idxInOld];
        if (sameVnode(vnodeToMove, newStartVnode)) {
          patchVnode(vnodeToMove, newStartVnode, insertedVnodeQueue);
          oldCh[idxInOld] = undefined;
          // 将这个待删除节点移到旧数组开头节点之前
          canMove && nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm);
        } else {
          // same key but different element. treat as new element
          createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx);
        }
      }
      newStartVnode = newCh[++newStartIdx]; // 新数组向后移一位
    }
  }
  if (oldStartIdx > oldEndIdx) {
    // oldCh已经全部比较完，将newCh中剩下元素当做新增节点，放到最后
    refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm;
    // 新增的节点
    addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
  } else if (newStartIdx > newEndIdx) {
    // newCh已经全部比较完，将oldCh中剩下元素全部移除
    removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
  }
}
```

这就是`diff`算法的核心了，已经加上了非常详细的注释。大家可以先参考其他的文章了解`diff`，然后再来这里看代码的实现会轻松很多。
