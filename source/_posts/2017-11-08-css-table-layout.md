---
title: "使用table构建三列自适应布局"
img: malaysia.jpg # Add image post (optional)
date: 2017-11-08 21:50:00
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [CSS,TABLE]
---

# 前言

前几天在写一个pc端的评论组件时，被一个三列自适应布局问题困扰了好久好久。需要的结构如下

![](/images/3cols-response-layout/3-cols-response-layout.jpeg)

由于我的css不厉害，只会基本的盒子模型，此前会的两列布局都是其中一列固定宽度，另一个宽度自适应。而这里的两列都是完全自适应的。

# 解决方案1： flex

在询问了一些人之后，得到回复说利用`flex`布局可以做，因为没有学过`flex`，所以这里先将代码贴出来：

![](/images/3cols-response-layout/flex.png)

`flex`写起来比较简单优雅，但因为我们的项目需要支持到IE9，而`flex`不兼容IE9，无奈只能放弃，不过也算学到了一些知识🙄😝☺️

# 解决方案2： table

后来我又去问缠着别人问，有人说利用`table`也可以做。我是知道table的，但印象中利用它来布局是以前上古时代”的做法，没有太多关注过。我就先去查了一下`table`来怎么做两列布局，看到了[知乎上的一个文章](https://zhuanlan.zhihu.com/p/21435193)，给了我很大灵感。废话不多说，贴代码：

```html
<table>
    <tr>
      <td id="left"><em>张三</em></td>
      <td id="center">Center content</td>
      <td id="right">09-09 09:09</td>
    </tr>
  </table>
  <table>
    <tr>
      <td id="left" valign="top">
        <em>张三</em> 回复 <em>李四</em>
      </td>
      <td id="center">
        Center contentCenter contentCenter
        contentCenter contentCenter contentCenter
        content
      </td>
      <td id="right" valign="top">09-09 09:09</td>
    </tr>
  </table>
```

这里有两行，每一行都单独用`table`包起来。`valign="top"`可以做到垂直顶部对齐。

```css
table{
  border: 1px solid grey;
}

#center {
  width: 100% ;
  word-break: break-all;
}

#left {
  white-space:nowrap;
  min-width: 38px;
  background-color: lightyellow;
}

#right {
  min-width: 120px;
  background-color: lightblue;
}

em{
  color:blue
}
```

* `word-break: break-all;`可以让英文折行；
* `white-space:nowrap;`可以强制不换行；
* 中间一列设置`width: 100% ;`是为了撑开内容区，这样最右边一列就不会缩过来。

**最终效果**

![](/images/3cols-response-layout/table-layout.png)


