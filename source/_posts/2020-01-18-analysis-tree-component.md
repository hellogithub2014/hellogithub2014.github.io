---
title: 一种Tree组件的实现方式
date: 2020-01-18 10:09:37
summary_img: /images/malaysia.jpg
tags: [component, vue]
---

RT，本文主要是为了介绍一种`tree`组件的实现方式，包含市面上`tree`组件的常见功能。后面会再专门研究`element-ui`中的`tree`内部实现。

# 数据结构

这是组件最核心的部分，直接关系到各种特性实现的复杂度。

## `Tree`本身

这是用于渲染`Tree`自身的，通常需要上层业务中传入树形节点数据，例如：

```js
const source = [{
  id: '1',
  label: '一级 1',
  children: [{
    id: '1-1',
    label: '二级 1-1',
    children: [{
      id: '1-1-1',
      label: '三级 1-1-1'
    }]
  }]
}, {
  id: '2',
  label: '一级 2',
  children: [{
    id: '2-1',
    label: '二级 2-1',
    children: [{
      id: '2-1-1',
      label: '三级 2-1-1'
    }]
  }, {
    id: '2-2',
    label: '二级 2-2',
    children: [{
      id: '2-2-1',
      label: '三级 2-2-1'
    }]
  }]
}]
```

```js
// Tree组件
<tree :source="source" />
```

树中的每个节点至少会包含`id`与`label`两个核心属性，前者是节点唯一标识，后者用于界面展示。那么怎么把它渲染出来呢？ 有2种常见的方法：

### 递归渲染

核心是将树节点单独封装成一个`tree-node`组件,同时`vue`允许组件内部直接引用自身。

`tree-node`组件:

```js
<template>
  <li>
    <!-- 渲染节点自身 -->
    {{ node.label }}

    <!-- 渲染子节点 -->
    <ul
      v-if="node.children"
      style="padding-left: 16px;" // 子节点层级缩进
    >
      <tree-node v-for="cnode in node.children" :key="cnode.id" :node="cnode" />
    </ul>
  </li>
</template>
<script>
export default {
  name: 'tree-node',
  props: {
    node: {
      type: Object,
      require: true,
    }
  },
}
</script>
```

这样`tree`组件自身只要负责把第一层节点渲染即可：

```js
<template>
  <ul>
    <!-- 渲染第一层 -->
    <tree-node v-for="node in source" :key="node.id" :node="node" />
  </ul>
</template>
<script>
export default {
  name: 'tree-node',
  props: {
    source: {
      type: Array,
      default: ()=>[],
    }
  },
}
</script>
```

### 打平后直接`vfor`迭代渲染

如果节点不多，也可以将`source`打平为一维数组，这样`tree`组件可以直接`v-for`一把梭：

```js
<template>
  <ul>
    <!-- 渲染打平的数组 -->
    <tree-node v-for="node in flatted" :key="node.id" :node="node" />
  </ul>
</template>
<script>
export default {
  name: 'tree-node',
  props: {
    source: {
      type: Array,
      default: ()=>[],
    }
  },
  computed: {
    flatted() {
      return this.doFlat(this.source);
    },
  },
  methods: {
    // 打平树状结构的列表
    doFlat(tree = []) {
      const flatterned = [];
      const len = list.length;
      let index = -1;
      if (!len) {
        return [];
      }

      while (++index < len) {
        const node = list[index];
        flatterned.push(node);

        const { children = [] } = node;
        if (children.length) {
          // 记录父级节点在flatterned的索引
          children.forEach((item) => {
            item.parentIndex = flatterned.length - 1;
          });
          this.doFlat(children);
        }
      }

      return flatterned;
    },
  }
}
</script>
```

本质上打平操作是对树的先序遍历，内部也是使用递归访问了一遍完整的树，顺便记录了父节点位置。好处是可以很方便的知道节点的父节点所在位置，直接使用索引访问即可。弊端也比较明显相当于遍历了两遍树，第一遍是在打平时，第二遍是在渲染时。另外如果节点支持懒加载，这种方式也不大容易理解，新加载的节点在打平数组中与父节点可能相隔很远。

此文的后面都基于第一种方式递归渲染来描述。

## 选中项

`tree`组件通常支持多选操作：

![multi-select](multi-select.png)

并且会进行数值合并的情况

![merge-selected-node](merge-selected-node.png)

如何支持这种特性呢？这里介绍一种思路：

1. 在`tree`组件中增加专门的`checkedKeys`数组，用于**记录所有选中的叶子节点**。
2. 按照每个节点的叶子节点规模进行倒序得到`sortedTreeNodes`数组,例如下面的情况`sortedTreeNodes`就是`[a,b,d,c,e,f,g,h,i,j,k]`

  ![sorted-tree-nodes](sorted-tree-nodes.jpeg)

3. 依次判断`sortedTreeNodes`中元素，
   1. 如果是叶子节点，直接加入结果集，并从`checkedKeys`删除
   2. 如果是树干节点
      1. 下属叶子节点全选，则将树干节点加入结果集，下属叶子节点全部从`checkedKeys`删除
      2. 下属叶子节点没有全选，直接跳过此树干节点

为什么要先倒序呢？因为不倒序的话可能得到的结果不对，例如下面这种情况：

![sort-example.jpeg](sort-example.jpeg)

如果先从`b`节点判断的，那么最终的结果集就是`[b]`，而不是`[a]`.

有了`checkedKeys`之后，每个`tree-node`也能方便知道自身是不是选中状态了：

`tree-node`组件:

```js
computed: {
  checked() {
    // 自身是叶子节点
    if (this.isLeaf) {
      return this.checkedKeys.includes(this.id);
    }
    // 自身是树干节点，如果下属叶子节点全部是选中状态，那么自身也就是选中状态
    return this.leafIds.every(leaf => this.checkedKeys.includes(leaf));
  },
}
```

## `throughed value`

某些业务中，还会要求拿到每个层级部分选中的节点，`throughed value`就是一个二维数组，存储每个层级全选/部分选中的节点。例如：

![throughed value](throughed-value.jpeg)

注意节点`c`下属只有`g`被选中，所以`c`是部分选中状态。 那么`throughed value`就会是：

```js
[
  [a], // 部分选中
  [b, c], // c即使是部分选中，也放到第二层级当中
  [g], // d/e/f由于已经将父节点放到结果集，忽略掉。
]
```

如何计算`throughed value`呢？其实和上面选中项的计算很像，只需改动`3.2`即可：

如果是树干节点:

   1. 下属叶子节点全选，则将树干节点加入结果集，下属叶子节点全部从`checkedKeys`删除
   2. 下属叶子节点部分选中，将树干节点加入结果集，但并不操作叶子节点

## 展开项

用于控制树干节点是展开还是收起，可以在`tree`组件中添加一个`expandedKeys`数组，存放所有已展开树干节点的`id`。在折叠/展开节点时更新这个数组。 每个`tree-node`判断自己是否展开，只需看自己的`id`在不在其中即可。

// `tree`组件

```js
<script>
export default {
  provide() {
    return {
      $expandedKeys: () => this.expandedKeys, // 展开的节点
    };
  },
  data() {
    expandedKeys: [],
  },
  methods: {
    handleToggleExpand(id) {
      if (!this.expandedKeys.includes(id)) {
        this.expandedKeys = this.expandedKeys.concat(id); // 展开节点
      } else {
        this.expandedKeys = this.expandedKeys.filter(key => key !== id); // 折叠节点
      }
    }
  },
}
</script>
```

// `tree-node`组件

```js
<template>
  <li>
    <!-- 渲染子节点 -->
    <ul
      v-if="node.children"
      v-show="expand" // 节点折叠、展开
    >
      <tree-node v-for="cnode in node.children" :key="cnode.id" :node="cnode" />
    </ul>
  </li>
</template>
<script>
export default {
  inject: [
    '$expandedKeys',
  ],
  computed: {
    // 当前节点是否展开
    expand() {
      return this.$expandedKeys().includes(node.id);
    },
  }
}
</script>
```

# 手风琴模式

有了`expandedKeys`，手风琴模式就很好实现了，关键点就是在展开当前节点时将所有兄弟节点全部从`expandedKeys`剔除即可：

```js
handleToggleExpand(id) {
  // 展开节点
  if (!this.expandedKeys.includes(id)) {
    // 手风琴模式
    if (this.accordion) {
      // 所有兄弟节点id
      const siblings = Object.values(this.treeNodesMap)
        .filter(
          node => node.parentId === treeNode.parentId && node.id !== id,
        )
        .map(node => node.id);
      // 剔除兄弟节点
      this.expandedKeys = this.expandedKeys.filter(
        key => !siblings.includes(key),
      );
    }
  }
}
```

# 懒加载

对于规模很大的树，一次性将所有节点数据全部拉取并渲染，是有些问题的。一来用户体验差，耗时很长，二来浪费流量，大多数情况下用户只会使用其中很小一部分。 懒加载就是在初始时只加载小部分最主要的数据，剩下的数据看用户点开哪个节点，点击时再去拉取一定的数据。 举例来说：

![lazy-load-example.gif](lazy-load-example.gif)

要实现这个功能有几个关键点：

1. 组件需要知道展开哪些节点时是要触发懒加载的
2. 组件需要知道如何获取懒加载数据
3. **后端接口支持懒加载**，至少支持两个参数: `root`与`depth`，前者用于定位子树的位置，后者用于拉取指定量级的数据

第1点可以在节点上加一些特殊标识，如果节点上有`hasChildren`属性，同时在展开节点前发现当前树中没有任何它的子节点，那么就可以触发懒加载了。

```js
isNeedLoadChildren(treeNode) {
  // 是否加载了children
  const hasChildrenLoaded =
    Object.values(this.treeNodesMap).filter(
      node => node.parentId === treeNode.id,
    ).length > 0;
  return treeNode.hasChildren && !hasChildrenLoaded;
}

handleToggleExpand(id) {
  const treeNode = this.treeNodesMap[id];
  if (this.lazy && this.isNeedLoadChildren(treeNode)) {
    treeNode.loading = true; // 显示加载icon
    // 触发懒加载，加载子节点。。
  }

  // 处理expandedKeys。。。
},
```

第2点获取懒加载数据，需要由上层业务决定，基础组件可以接收一个`loadChildren`的`prop`，函数的参数是展开的节点，返回值是一个`Promise`,`Promise`完成时会拿到子树数据。这样`tree`组件就可以把子树数据融合进去了。

```js
treeNode.loading = true;

this.loadChildren(treeNode).then((subtree) => {
    treeNode.loading = false;
    // 融合subtree到当前tree当中，略。。
    this.checkedKeys = this.valueToChecked(this.checkedKeys); // 更新选中节点，如果treeNode是选中状态，那么subTree中的每个节点也是选中状态
  },
);
```

# 搜索
## 本地搜索
## 懒加载下的搜索
# 吸顶效果
# 自定义渲染
## `hover`
## 面包屑