---
title: 利用sticky定位实现吸顶列表
date: 2019-03-22 14:36:32
summary_img: /images/nevada.jpg
tags: [css]
---

最近在项目里遇到一个需求，有个侧边栏菜单列表，里面的元素在滚动时需要有同级层自动吸顶的效果，示范如下：
![需求](/images/sticky-list/wiki.gif)

当时脑海里想到了 2 个方案：

1. 利用`absolute`定位，滚动过程中判断需要吸顶的元素是否滚动到了指定位置，然后利用`js`修改`top`值
2. 使用`sticky`定位，它是`position`的一个可选值，具体可以参考[MDN](https://developer.mozilla.org/zh-CN/docs/Web/CSS/position)

方案 1 想想就觉得复杂度很高，同时很有可能遇到性能的问题，在滚动过程中浏览器默认会批量重排重绘元素，如果我们突然计算 DOM 元素的`top`属性，这导致强制重绘。

方案 2 最大的优点就是浏览器自动帮助我们做好了这些，缺点就是兼容性不大好：

![can i use](/images/sticky-list/sticky-compatiable.png),为了专门在后端查看了我们站点用户的浏览器分布，看到只有一个用户使用了不支持的浏览器版本。`sticky`定位在不支持的浏览器上会表现的和`relative`定位一样，所以在我们站点上使用此特性的性价比还是很高的。

# 介绍 sticky

正如 MDN 上所说，粘性定位可以被认为是相对定位和固定定位的混合。元素在跨越特定阈值前为相对定位，之后为固定定位。例如：

```css
#one {
  position: sticky;
  top: 10px;
}
```

在 `viewport` 视口滚动到元素 `top` 距离小于 10px 之前，元素为相对定位。之后，元素将固定在与顶部距离 10px 的位置，直到 `viewport` 视口回滚到阈值以下。

粘性定位常用于定位字母列表的头部元素。标示 B 部分开始的头部元素在滚动 A 部分时，始终处于 A 的下方。而在开始滚动 B 部分时，B 的头部会固定在屏幕顶部，直到所有 B 的项均完成滚动后，才被 C 的头部替代。

须指定 `top`, `right`, `bottom` 或 `left` 四个阈值其中之一，才可使粘性定位生效。否则其行为与相对定位相同。

经过试验发现，不仅仅对于上面的所说的相对于`viewport`，我们可以在页面任意一个父元素应用此特性，也就是说**我们可以实现局部的吸顶列表。**

`MDN`上给了一个很好的示范`sticky`使用方法的例子，大家自己去看就好。

# 具体做法

假如我们有一个 3 级列表，列表顶部有个搜索框，如图：

![example](/images/sticky-list/example.png)

我们想要实现在滚动过程中，一级、二级列表各自吸顶，同时滚动过程中搜索框保持不动。

我们的示范`html`：

```html
<div class="above">something above</div>
<div class="wrapper-container">
  <input type="text" placeholder="搜索" class="filter" />

  <!-- 第一层 -->
  <div class="node header">dimensions</div>
  <!-- 第二层 -->
  <div class="node dt">A</div>
  <!-- 第三层 -->
  <div class="node dd">Andrew W.K.</div>
  <div class="node dd">Apparat</div>
  <div class="node dd">Arcade Fire</div>
  <div class="node dd">At The Drive-In</div>
  <div class="node dd">Aziz Ansari</div>
  <!-- 第二层 -->
  <div class="node dt">C</div>
  <!-- 第三层 -->
  <div class="node dd">Chromeo</div>
  <div class="node dd">Common</div>
  <div class="node dd">Converge</div>
  <div class="node dd">Crystal Castles</div>
  <div class="node dd">Cursive</div>
  <!-- 第二层 -->
  <div class="node dt">E</div>
  <!-- 第三层 -->
  <div class="node dd">Explosions In The Sky</div>

  <!-- 第一层 -->
  <div class="node header">matrix</div>
  <!-- 第二层 -->
  <div class="node dt">X</div>
  <!-- 第三层 -->
  <div class="node dd">Andrew W.K.</div>
  <div class="node dd">Apparat</div>
  <div class="node dd">Arcade Fire</div>
  <div class="node dd">At The Drive-In</div>
  <div class="node dd">Aziz Ansari</div>
  <!-- 第二层 -->
  <div class="node dt">Y</div>
  <!-- 第三层 -->
  <div class="node dd">Chromeo</div>
  <div class="node dd">Common</div>
  <div class="node dd">Converge</div>
  <div class="node dd">Crystal Castles</div>
  <div class="node dd">Cursive</div>
  <!-- 第二层 -->
  <div class="node dt">Z</div>
  <!-- 第三层 -->
  <div class="node dd">Explosions In The Sky</div>
</div>
```

`header`类表示第一层节点，`dt`表示第二层，`dd`表示第三层。

为了产生滚动，父元素需要设置`overflow`：

```css
.wrapper-container {
  border: 1px solid green;
  width: 400px;
  height: 600px;
  overflow: auto;
  position: relative;
}
```

另外注意上面的层级列表 DOM 节点是打平的，并没有使用层级嵌套。这是发现的一个坑：**如果父元素设置的`sticky`定位，子元素不会产生滚动效果。**

## 搜索栏吸顶

这个比较简单，简单设置一下`sticky`就行。

```css
.filter {
  width: 100%;
  height: 50px;
  position: sticky;
  top: 0;
}
```

## 一层列表吸顶

和顶部搜索栏的区别是设置的`top`值不同，一层列表需要在搜索栏下方吸顶，所以它的`top`就是搜索栏的`height`：

```css
.node.header {
  position: sticky;
  top: 56px; // 搜索栏高度 + 一些input元素固有border的高度
  background: green;
}

.node {
  margin: 0;
  background: #fff;
  height: 50px;
}
```

## 二层列表吸顶

依样画葫芦，设置它的`top`为搜索栏加上一层列表节点的高度即可：

```css
.dt {
  border-bottom: 1px solid #989ea4;
  border-top: 1px solid #717d85;
  padding-left: 32px;
  position: sticky;
  top: 106px; /* 56px + 50px */
  background: red;
}
```

## 普通节点

只需设置一些常规属性即可，不用设置`sticky`定位。

```css
.dd {
  padding-left: 52px;
}

.dd + .dd {
  border-top: 1px solid #ccc;
}

.above {
  height: 100px;
  border: 1px solid yellow;
}
```

## 效果

最终的效果：![sticky-list](/images/sticky-list/sticky-list.gif)

# 组件抽象

可以将上述思路包装成一个通用的树形组件，每个叶子节点可以被选中，非叶子节点可以收起或展开，最终的组件代码可以[参考这里](https://github.com/hellogithub2014/hellogithub2014.github.io/tree/save/source/_assets/sticky-list/sticky-tree-menu.vue)

组件使用方法比较简单，例如

```html
<sticky-tree-menu :list="list" :selected="selected" @select="updateSelect" />
```

```js
export default {
  data() {
    return {
      selected: ['campaign_name'],
    };
  },
  computed: {
    list() {
      return [
        {
          key: 'dimensions', // 第一层节点
          i18nPath: 'reporting-dimensions',
          children: [
            {
              key: 'settings',  // 第二层节点
              i18nPath: 'reporting-dimensions-settings',
              children: [
              {
                key: 'campaign',  // 第三层节点
                i18nPath: 'common_Campaign',
                children: [
                  {
                    key: 'campaign_name',  // 第四层节点
                    i18nPath: 'campaign_name',
                  },
                  {
                    key: 'campaign_id',
                    i18nPath: 'campaign_id',
                  },
                ],
              },
            }
          ]
        },
        // ...
      ];
    },
  },
  methods:{
    // value: 切换选中的key值； checked：是否选中
    updateSelect({ type = '', value = '', checked = false }){}
  }
}
```

注意到为了更方便使用，传入的`list`是树状结构的，组件内部会自动打平它。
