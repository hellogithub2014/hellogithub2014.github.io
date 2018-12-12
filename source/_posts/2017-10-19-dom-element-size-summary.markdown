---
title: "DOM元素大小、形状和滚动总结"
img: alaska.jpg # Add image post (optional)
date: 2017-10-19 23:20:00
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [DOM,JAVASCRIPT]
---

# 前言

学DOM的知识时一直对元素的大小、形状和滚动相关的那好几个属性傻傻分不清楚，索性专门花一些时间好好专研然后总结下来。

# 文档坐标、视口坐标

![]({{site.url}}/assets/img/dom-element-size/document-viewport-cordinate.jpg)

文档坐标 - 滚动量 = 视口坐标

如果文档比视口小，或者还没出现滚动条，那么文档的左上角就是视口的左上角，此时他们坐标的起点是相同的。

鼠标的时间处理函数中，鼠标指针的位置是在视口坐标系中的。

# 元素大小

## 偏移量offset

包括元素在屏幕上占用的**所有可见空间（由高度、宽度、内边距、滚动条和边框决定，不包括外边距）**。与偏移量相关的4个属性：

* `offsetHeight` - 元素在垂直方向上占用的空间大小
* `offsetWidth` - 水平方向占用的空间大小
* `offsetLeft` - 元素的左外边框**至包含元素（保存在`offsetParent`属性中）**的左内边框之间的像素距离
* `offetTop` - 元素的上外边框**至包含元素**的上内边框之间的像素距离

![]({{site.url}}/assets/img/dom-element-size/offset.jpeg)

要想知道某个元素在页面上的偏移量，将这个元素的`offsetLeft`和`offetTop`与其`offsetParent`的相同属性相加，如此循环直到根元素即可：

```js
// 对很多元素来说，这是在计算文档坐标
function getElementLeft(element){
	var actualLeft=element.offsetLeft;
	var current=element.offsetParent;

	while(current){
		actualLeft += current.offsetLeft;
		current = current.offsetParent;
	}
	return actualLeft;
}
```

**注意** - 所有这些偏移量都是只读的，而且每次访问他们都需要重新计算。

## 客户区大小client

指的是**元素内容及其内边距所占据的空间**大小,**滚动条占用的空间不算在内**。相关属性有2个：

* `clientWidth` - 元素内容区宽度加上左右内边距宽度,
* `clientHeight` - 元素内容区高度加上上下内边距的高度

![]({{site.url}}/assets/img/dom-element-size/client.jpeg)

最常用到这些属性的情况，就是确定浏览器视口大小。要确定浏览器视口大小，可以使用`doucment.documentElement`或`document.body`的`clientWidth`和`clientHeight`。

```js
function getViewPort(){
	// compatMode用来判断当前浏览器采用的渲染方式。
	//
	if(document.compatMode === 'BackCompat'){ // 标准兼容模式关闭
		return {
			width: document.body.clientWidth,
			height:document.body.clientHeight,
		};
	} else {
		return {
			width: document.documentElement.clientWidth,
			height:document.documentElement.clientHeight,
		};
	}
}
```

**注意** - 与偏移量相似，客户区大小也都是只读的，而且每次访问他们都需要重新计算。

## 滚动大小

指的是**包含滚动内容的元素**的大小。有些元素（如<html>）能自动添加滚动条，有些则需要通过设置css的`overflow`才能滚动。相关的4个属性：

* `scrollHeight` - 在没有滚动条的情况下，元素内容的总高度，是元素的内容区加上内边距再加上任何溢出内容的尺寸。
* `scrollWidth` - 在没有滚动条的情况下，元素内容的总宽度，是元素的内容区加上内边距再加上任何溢出内容的尺寸。
* `scrollLeft` - 被隐藏在内容区左侧的像素数。**通过设置这个属性可以改变元素的滚动位置**。
* `scrollTop` - 被隐藏在内容区上方的像素数。**通过设置这个属性可以改变元素的滚动位置**。

![]({{site.url}}/assets/img/dom-element-size/scroll.jpg)

`scrollHeight`和`scrollWidth`主要用于确定元素内容的实际大小。例如通常认为<html>元素是在浏览器视口中滚动的元素，因此带有垂直滚动条的页面总高度就是`document.documentElement.scrollHeight`或`document.body.scrollHeight`。
此时**浏览器的垂直滚动条高度**就是`document.documentElement.scrollTop`或`document.body.scrollTop`。

在确定文档总高度时（包括基于视口的最小高度时），必须取得`scrollWidth`/`clientWidth`和`scrollHeight`/`clientHeight`中的最大值，才能保证在跨浏览器的环境下得到精确的结果。

```js
var docWidth=Math.max(
	document.documentElement.scrollWidth,document.documentElement.clientWidth
);// 或者document.body
var docHeight=Math.max(
	document.documentElement.scrollHeight,document.documentElement.clientHeight
);// 或者document.body
```

**通过`scrollLeft`和`scrollTop`既可以确定元素当前滚动的状态，也可以设置元素的滚动位置**。例如在元素尚未被滚动时，这两个属性均为0.如果元素被垂直滚动了，那么`scrollTop`的值会大于0，且表示元素上方不可见内容的像素高度。将元素的`scrollTop`设置为0，就可以重置元素的垂直滚动位置。

```js
// 如果元素不是位于顶部，将其回滚到顶部
function scrollToTop(element){
	if(element.scrollTop!==0){
		element.scrollTop =0;
	}
}
```

### 滚动

除了上面说到的设置`scrollLeft`和`scrollTop`来让元素滚动外，window对象的**`scrollTo()`**(和其同义词`scroll()`)也可以做到，它接收一个文档坐标并作为滚动条的偏移量去设置他们，也就是说窗口滚动到指定的点出现的视口的左上角。

以下代码可以让浏览器滚动到文档最底部可见：

```js
var docHeight=document.documentElement.offsetHeight;
var viewportHeight=getViewPort().height;// 见上面客户区大小的方法
window.scrollTo(0,docHeight-viewportHeight);
```

window的**`scrollBy()`**和`scrollTo()`、`scroll()`类似，不过他的参数是相对的，并在当前滚动条的偏移量上增加。 例如每秒向下滚动10像素：

```js
setInterval(function(){
	scrollBy(10);
},1000)
```

在元素上调用**`scrollIntoView`**会让浏览器滚动到此元素可见的位置，默认情况下它试图将元素的上边缘放在或尽量接近视口的上边缘，如果只传递false作为参数，它将试图将元素的下边缘放在或者尽量接近视口的下边缘。

## 确定元素大小

`getBoundingClientRect`方法会返回一个矩形对象，包含4个属性： `left`、`top`、`right`、`bottom`.这些属性是元素在页面中**相对于视口的位置**，即视口坐标。其返回的坐标包含边框和内边距，但不包含外边距。另外，这个方法返回的坐标是一个快照版本，不会实时更新。

为了将其转化为文档坐标，需要加上浏览器滚动条的大小（见上面滚动大小小节）。

# 参考
本文内容均是参考自`JavaScript`红宝书(第12章)和权威指南(15.8)的。


