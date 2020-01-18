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

![multi-select](/images/tree-component/multi-select.png)

并且会进行数值合并的情况

![merge-selected-node](/images/tree-component/merge-selected-node.png)

如何支持这种特性呢？这里介绍一种思路：

1. 在`tree`组件中增加专门的`checkedKeys`数组，用于**记录所有选中的叶子节点**。
2. 按照每个节点的叶子节点规模进行倒序得到`sortedTreeNodes`数组,例如下面的情况`sortedTreeNodes`就是`[a,b,d,c,e,f,g,h,i,j,k]`

  ![sorted-tree-nodes](/images/tree-component/sorted-tree-nodes.jpeg)

3. 依次判断`sortedTreeNodes`中元素，
   1. 如果是叶子节点，直接加入结果集，并从`checkedKeys`删除
   2. 如果是树干节点
      1. 下属叶子节点全选，则将树干节点加入结果集，下属叶子节点全部从`checkedKeys`删除
      2. 下属叶子节点没有全选，直接跳过此树干节点

为什么要先倒序呢？因为不倒序的话可能得到的结果不对，例如下面这种情况：

![sort-example.jpeg](/images/tree-component/sort-example.jpeg)

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

![throughed value](/images/tree-component/throughed-value.jpeg)

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

要注意到，**不管是选中项还是`throughed value`的计算，都依赖对原始数据结构的多次遍历操作，同时还涉及对整个树的排序操作，因此在树规模较大时，不可避免的有性能上问题。一种解决方案是把这些遍历操作转化为节点自身的各种属性，例如判断每个节点自身是否选中，不要看下属叶子的选中情况，而是直接判断自身的`checked`属性。**

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

![accordion-example.gif](/images/tree-component/accordion-example.gif)

# 懒加载

对于规模很大的树，一次性将所有节点数据全部拉取并渲染，是有些问题的。一来用户体验差，耗时很长，二来浪费流量，大多数情况下用户只会使用其中很小一部分。 懒加载就是在初始时只加载小部分最主要的数据，剩下的数据看用户点开哪个节点，点击时再去拉取一定的数据。 举例来说：

![lazy-load-example.gif](/images/tree-component/lazy-load-example.gif)

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

树节点变多时，通常会提供搜索功能，搜索分两种：前端本地搜索和远程搜索。前者比较简单，后者结合懒加载会有一些坑需要注意。

## 本地搜索

本地搜索的关键是组件需要知道搜索关键词`keyword`，同时允许业务方自定义匹配函数`filterMethod`。组件内部观察`keyword`的变化，只展示命中的节点。

```js
watch: {
  keyword(val) {
    const hits = [];
    const misses = [];
    // 迭代每个节点，判断节点应该显示还是隐藏。
    // treeNodesMap是每个节点的id与节点引用之间的映射： {[id: string]: Object}
    Object.values(this.treeNodesMap).forEach((node) => {
      if (this.filterMethod(val, node)) {
        hits.push(node.id);
      } else {
        misses.push(node.id);
      }
    });

    // 隐藏所有不匹配的节点
    misses.forEach((id) => {
      this.treeNodesMapForSearch[id] = {
        ...this.treeNodesMap[id],
        visible: false,
      };
    });

    // 。。。
  }
}
```

## 懒加载下的搜索

这种场景下的最大困难是前端不知道完整的树是什么样子，前端只有一个局部子树。举两个可能的坑，若某个时刻的情况如下：

![lazyload-remote-search.png](/images/tree-component/lazyload-remote-search.jpeg)

即前端只加载了`a、b、c`3个节点，剩下的节点并未拉取。

1. 情形1️⃣：搜索某个关键词返后端回的节点是`g、h、i`，如果用户将这3个节点全部选中了，返回给上层的选中值不应该是`g、h、i`，而应该是他们的上层节点`d`，但前端并不知道`d`的存在。

2. 情形2：如果先勾选了`b`节点，然后搜索某个关键词返回的节点是`g`，此时即使选中`g`也不应该返回给上层组件，因为`g`的组件节点`b`已经被选中了。

解决方案是：**后端返回命中节点到根节点的完整通路子树，前端将这个子树直接当做`tree`组件的新`source`**。例如如果命中了`h、i、j`,那么返回的子树就是：

![lazyload-remote-search-solution.jpeg](/images/tree-component/lazyload-remote-search-solution.jpeg)

只有这样前端才能知道完整的信息。

# 吸顶效果

![sticky-scroll.gif](/images/tree-component/sticky-scroll-example.gif)

借助`position:sticky`可以方便实现滚动吸顶，这里只示范第一层级节点的滚动吸顶，其他低层级节点类似，区别在于`z-index`和`top`值的设定。

![sticky-scrolll-detail-2.png](/images/tree-component/sticky-scrolll-detail-2.jpeg)

![sticky-scrolll-detail.png](/images/tree-component/sticky-scrolll-detail.png)

# 自定义渲染

在很多场景下需要自定义每个节点的渲染，除了默认的`label`外还会有业务上的特殊定制。例如每个节点hover上去后出现节点的一些明细信息。

自定义渲染的关键在于给业务方暴露`slot`，同时基础组件内部提供一个最常见的默认实现。

// `tree-node`组件，提供原始`slot`

```html
<slot :item="node" name="node"/>
```

// `tree`组件，进行一次转发

```html
<tree-node v-for="node in source" :key="node.id" :node="node">
  <template slot="node" slot-scope="{ item }">
    <!-- 这里提供一个默认实现 -->
    <slot :item="item" name="node">{{ item.label }}</slot>
  </template>
</tree-node>
```

下面是一个常见的自定义渲染示范

## `hover` & 展示节点面包屑

// 业务组件

```html
<tree :source="source">
  <template slot="node" slot-scope="{ item }">
    <!-- 鼠标放到节点上弹出的hover -->
    <vi-popover>
      <slot :item="item" name="hover">
        <!-- 节点名 -->
        <div>{{ item.label }}</div>
        <!-- 节点层级面包屑 -->
        <div>
          <span v-for="(breadcrumb, index) in item.breadcrumbs" :key="index">
            <i v-if="index > 0" class="vi-icon-arrow-right" />
            <span>{{ breadcrumb }}</span>
          </span>
        </div>
      </slot>
      <!-- 节点自身渲染 -->
      <span slot="reference">
        <span>{{ item.label }}</span>
      </span>
    </vi-popover>
  </template>
</tree>
```

效果如下：

![custom-render-example.gif](/images/tree-component/custom-render-example.gif)

# 总结

本文主要介绍了一种`tree`组件的底层实现细节，并指出了底层数据结构的潜在性能问题和可能的解决方案。