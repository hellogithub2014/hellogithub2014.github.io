---
title: "css flex布局学习笔记"
img: new-zealand.jpg # Add image post (optional)
date: 2017-12-03 15:25:00 Asia/Shanghai
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [CSS]
---

# 前言

前端时间学习了flex布局，是[这篇博客](https://www.w3cplus.com/css3/a-visual-guide-to-css3-flexbox-properties.html)， 觉得很神奇。 正好在很多例如两列布局、三列布局中flex可以很轻松的完成任务。 于是写这篇博客记录一下flex在布局中的应用。

# 两列布局

## 一列定宽一列自适应

```html
<div class="wrapper">
    <div class="left">左栏</div>
    <div class="middle">中间中间中间中间中间中间中间中间中间中间中间中间中间 </div>
</div>
```

```css
.wrapper {
    display: flex;
}

.left {
    height: 200px;
    /* shrink是关键，用于表示在空间不够时保持原有大小 */
    flex-shrink: 0;
    flex-basis: 100px;
    /* 或者使用简写属性 */
    /* flex:0 0 100px; */
    background: green;
}

.middle {
    background: red;
}
```

## 两列均自适应

```html
<div>
   <em>张三：</em>
   <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Tempora laborum minus voluptatem quis tempore, expedita, fugit aliquid ipsum totam atque eos asperiores. Odio repellat sit molestiae consequuntur, ex quo perferendis.</p>
   <em>2017-09-09 09:09</em>
</div>
<div>
   <em class="indent">张三回复李四：</em>
   <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Tempora laborum minus voluptatem quis tempore, expedita, fugit aliquid ipsum totam atque eos asperiores. Odio repellat sit molestiae consequuntur, ex quo perferendis.</p>
   <em>2017-09-09 09:09</em>
</div>
```

```css
*{
  margin:0;
  padding:0;
}
div{
  display:flex;
}

em{
  white-space:nowrap;
}
.indent{
  text-indent:40px;
}
```

# 三列布局

本质上和两列布局是一样的。

```html
<div class="wrapper">
	    <div class="left">左栏</div>
	    <div class="middle">中间中间中间中间中间中间中间中间中间中间中间中间中间111 </div>
        <div class="right">右栏</div>
  </div>
```

```css
.wrapper {
    display: flex;
}

.left {
    height: 200px;
    /* shrink是关键，用于表示在空间不够时保持原有大小 */
    flex-shrink: 0;
    flex-basis: 100px;
    /* 或者使用简写属性 */
    flex:0 0 100px;
    background: green;
}

.middle {
    background: red;
}

.right {
    height: 200px;
    flex:0 0 100px;
    background: green;
    text-align:right;
}
```

[这里](http://blog.csdn.net/javaloveiphone/article/details/51098427)有一个利用flex实现圣杯布局的例子。

# 水平垂直居中

```html
<div class="flex-center">
  <p>I'm vertically and horizon centered multiple lines of text in a flexbox container.</p>
</div>
```

```css
.flex-center {
  /*用于演示的样式*/
  background-color:black;
  color:white;
  border: 1px solid white;
  /* 关键样式 */
  display: flex;
  flex-direction: row;
  justify-content: center;  /* 用于水平居中 */
  align-items:center;  /* 用于垂直居中 */
  /*试试调整大小*/
  resize: both;
  overflow: auto;
}
p {
  border: 1px solid blue;
  /*试试调整大小*/
  resize: both;
  overflow: auto;
}
```

