---
title: "css面试题"
img: canyon.jpg # Add image post (optional)
# date: 2017-11-15 20:30:00 +0800
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [CSS,INTERVIEW]
---

# 题库

[Front-end-Developer-Interview-Questions](https://github.com/h5bp/Front-end-Developer-Interview-Questions)

其他人的回答集：

* [Witcher42](http://witcher42.github.io/2014/06/04/front-end-developer-interview-questions/)
* [voidove](https://github.com/voidove/jug-jug/issues/36)

# CSS 中类 (classes) 和 ID 的区别。

* 一个元素上的class可以有多个，而id只能有一个
* 页面上可以有多个元素的class相同，而id不能有相同的
* id选择器的优先级比class高

# 请问 "resetting" 和 "normalizing" CSS 之间的区别？你会如何选择，为什么？

CSS reset的作用是让各个浏览器的CSS样式有一个统一的基准(浏览器兼容)，而这个基准更多的就是“清零”，简单粗暴；

normalizing保护有用的浏览器默认样式而不是完全去掉它们 ，修复浏览器的bug并且做到浏览器显示一致。

# 请解释浮动 (Floats) 及其工作原理。
[参考](https://github.com/voidove/jug-jug/issues/41)

![](https://cloud.githubusercontent.com/assets/5563419/6501400/c79b9326-c352-11e4-8f54-e9cb5afdb324.png)

浮动属性表示元素应该从正常文档流中被取出，并沿着它的容器的左边或右边放置，而文字和行内元素要环绕着这个元素。一个浮动元素就是一个 float 属性被计算之后不是 none 的元素。

浮动元素，脱离当前文档流，定位到父容器的边缘，或另一个float box的边缘。但仍保留在文档流中，其周围环绕的元素也都清楚它的位置。

**文档流中的inline box环绕float box**

```html
<div>test float</div>
<span>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Harum nisi molestiae, sunt eligendi ducimus velit adipisci facere repellat praesentium neque!</span>
```

```css
div{
  float:left;
  border:1px solid red;
  margin:1px;
  padding:0;
}

p{
  border:1px solid green;
}

span{
    border:1px solid blue;
}
```

![]({{site.url}}/assets/img/css-interview-questions/float-inline-box.png)

**会和文档流中的block box重叠。用clear: both|left|right避免重叠**

```html
<div>test float</div>
  <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Labore aliquam rem autem atque saepe distinctio dolor, nemo qui. Error, officiis.</p>
```

![]({{site.url}}/assets/img/css-interview-questions/float-block-box.png)

# 描述`z-index`和叠加上下文是如何形成的。

参考这篇博客：[z-index堆叠规则](https://www.cnblogs.com/starof/p/4424926.html)
**还没看**

# 请描述 BFC(Block Formatting Context) 及其如何工作。

**BFC的创建方法**

*	根元素或其它包含它的元素；
*	浮动 (元素的float不为none)；
*	绝对定位元素 (元素的position为absolute或fixed)；
*	行内块inline-blocks(元素的 display: inline-block)；
*	表格单元格(元素的display: table-cell，HTML表格单元格默认属性)；
*	overflow的值不为visible的元素；
*	弹性盒 flex boxes (元素的display: flex或inline-flex)；

但其中，最常见的就是overflow:hidden、float:left/right、position:absolute。也就是说，每次看到这些属性的时候，就代表了该元素以及创建了一个BFC了。

**BFC用处**

1. 清除浮动
2. 由于BFC的隔离作用，可以利用BFC包含一个元素，防止这个元素与BFC外的元素发生margin collapse。

参考[博客](http://web.jobbole.com/83274/)

# 列举不同的清除浮动的技巧，并指出它们各自适用的使用场景。

1. 添加空 div 标签

	```html
	<div style="clear: both;"></div>
	```

	缺点是添加太多无意义的空标签

2. 使用伪元素

	```html
	<div class="clearfix">
    	<div class="child">this is a float element</div>
  	</div>
  	<div class="other">test clear float</div>
	```

	```css
	.clearfix::after {
	  content: "";
	  display: block;
	  clear: both;
	}
	```

	**clearfix是加在浮动元素的父容器上**

# 请解释 CSS sprites，以及你要如何在页面或网站中实现它。

CSS Sprites 是把图片都合到一张大图上，这么做的目的是为了减少图片的 HTTP 请求数。

一般来说生成雪碧图都会利用工具自动生成。合并图片的工具的思路就是，用合并后的图片的位置和 CSS 中使用的位置，来算出新的位置，生成新的图片和 CSS 文件。

**TODO查看雪碧图收藏文章**

# 你最喜欢的图片替换方法是什么，你如何选择使用。

>在日常开发中，常常会有一些文字需要用图片来美化，例如 LOGO、栏目标题等。
为了保障可阅读性、搜索优化以及性能优化，我们不方便直接使用 img 标签来加载图片，而是使用 CSS 设置背景图片来达到替换文字的效果。

Image Replacement 是说用图片把文字替换掉的技术，常用在标题上。

**方法1**

```html
<h3 class="skm">CSS-Tricks</h3>
```

```css
h3.skm {
  width: 300px;
  height: 75px;
  background: url(https://s3-us-west-2.amazonaws.com/s.cdpn.io/t-90/test.png);
  text-indent: 100%;
  white-space: nowrap;
  overflow: hidden;
}
```

[更多参考](https://css-tricks.com/the-image-replacement-museum/)

# 你会如何解决特定浏览器的样式问题？

解决css浏览器兼容性，推荐使用一些css预处理工具，如autoprefixer

# 如何为有功能限制的浏览器提供网页？你会使用哪些技术和处理方法？

* 只提供符合 Web 标准的页面
* 提供另一个符合那些浏览器标准的页面
* 兼容 
**兼容**
这里有两种思路，一个是渐进增强，一个优雅降级。
* 渐进增强的思路就是提供一个可用的原型，后来再为高级浏览器提供优化。
* 优雅降级的思路是根据高级浏览器提供一个版本，然后有功能限制的浏览器只需要一个刚好能用的版本。

# 有哪些隐藏内容的方法 (如果同时还要保证屏幕阅读器可用呢)？

![](http://img.blog.csdn.net/20140729213824707?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvaG55eXNseQ==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

# 你用过栅格系统 (grid system) 吗？如果使用过，你最喜欢哪种？

[CSS GRID博客笔记](https://hellogithub2014.github.io/css-grid-note/)

# 你用过媒体查询，或针对移动端的布局/CSS 吗？

[@media](http://www.runoob.com/cssref/css3-pr-mediaquery.html)

# 你熟悉 SVG 样式的书写吗？

**TODO SVG学习**

# 如何优化网页的打印样式？

**分开屏幕显示与打印的样式**

```html
<link rel="stylesheet" type="text/css" media="screen" href="/css/styles.css" />
<link rel="stylesheet" type="text/css" media="print" href="/css/print.css" />
```

或

```html
<style type="text/css">
	@import url("screen-styles.css") screen;
 	@media url("screen-print.css") print;
</style>
```

**使用pt指定大小** - 而不是像素

```css
body {
  font-family: "Times New Roman", serif;
  font-size: 12pt;
}
```

**隐藏不必要的标签节省墨水** - 导航栏、侧边栏、搜索栏这些元素在打印时没必要显示

```css
#nav, #sidebar, #advertising, #search {
  display: none;
}
```

**去掉背景图片和颜色** - 可以让打印结果更可读

```css
body {
  background: none;
} 
```

**揭露链接** - 让链接url出现在锚文本后面

```css
a:link:after,a:visited:after {
  content: " (" attr(href) ") ";
} 
```

**强调链接锚文本**

```css
a:link, a:visited {
  color: blue;
  text-decoration: underline;
}
```

**借助打印预览**

[详细的打印样式优化经验](http://blog.csdn.net/xujie_0311/article/details/42271273)

# 在书写高效 CSS 时会有哪些问题需要考虑？

* 从右向左匹配
* ID最快，Universal最慢 - 有四种类型的key selector，解析速度由快到慢依次是：ID、class、tag和universal

	```css
	#main-navigation {   }      /* ID（最快） */
	body.home #page-wrap {   }  /* ID */
	.main-navigation {   }      /* Class */
	ul li a.current {   }       /* Class *
	ul {   }                    /* Tag */
	ul li a {  }                /* Tag */
	* {   }                     /* Universal（慢） */
	#content [title='home']     /* Universal */
	```

* 不要tag-qualify，永远不要这样做

	```css
	ul#main-navigation {  }
	```

* 后代选择器最糟糕

	```css
	html body ul li a {  }
	```

# 使用 CSS 预处理器的优缺点有哪些？
## 请描述你曾经使用过的 CSS 预处理器的优缺点。

sass预处理器
**autoprefixer是后处理器，适用于普通的css语法**

**缺点**

1. 提高了学习门槛
2. 需要专门的构建处理流程

**优点**

1. autoprefixer可以让css编写那些需要带前缀的规则时，不用手写很多的浏览器前缀
2. sass为编写css加入了编程的思想，可以利用函数、变量等特性
3. 写规则的嵌套时可以少写许多代码，提高了效率

# 如果设计中使用了非标准的字体，你该如何去实现？

**[@font-face](http://www.w3school.com.cn/css3/css3_font.asp)**

```html
<style>
@font-face
{
		font-family: myFirstFont;
		src: url('Sansation_Light.ttf'),
     url('Sansation_Light.eot'); /* IE9+ */
}

div
{
		font-family:myFirstFont;
}
</style>
```

# 请解释浏览器是如何判断元素是否匹配某个 CSS 选择器？

**从右向左**

```css
.nav div span { font-size:16px;}
```

会先找到所有`span`元素，然后针对每一个`span`做搜索，看其有没有祖先元素是`div`的，然后再次针对每个`div`做搜索，直到找到`.nav`的元素。

**为什么要这样？**

1. 在树形结构中，每个节点找到它的父节点是很容易的事情，相反父节点要遍历完子节点比较麻烦。从右向左的匹配规则，在第一步匹配之后，会过滤掉大量不符合的节点，剩下的节点逐个寻找父节点相对较容易；
2. 如果是从左到右，那么找到`.nav`的所有节点后，需要针对每个节点搜索其子节点来寻找`div`，相当于要搜索整棵子树，这种遍历操作很费时间。

# 请描述伪元素 (pseudo-elements) 及其用途。

## 伪元素

CSS **伪元素**用于向某些选择器设置特殊效果。例如`:first-line`、`:first-letter`、`:before`、`:after`

用法：

```css
selector:pseudo-element {
	property:value;
}
```

**示范**

![](http://img.blog.csdn.net/20170703222909359?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvcXFfMzMwNzI1OTM=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

```html
<div class="banner_title">和同龄孩子相比</div>
```

```css
.banner_title::before, .banner_title::after {
   content: '';
   width: 15px;
   height: 1px; // 高度设为1px，这样看起来就是一条水平线了
   background: #1e88e5;
   display: inline-block;
   vertical-align: middle; // 垂直居中
}

.banner_title::before {
    margin-right: 10px;
 }

 .banner_title::after {
    margin-left: 10px;
 }
```

## 伪类

CSS**伪类**同样用于向某些选择器添加特殊的效果。例如：`:link`、`:visited`、`:hover`、`:active`、`:first-child`、``、

语法：

```css
selector : pseudo-class {
	property: value
}
```

**示范**

```css
a:link {color: #FF0000}		/* 未访问的链接 */
a:visited {color: #00FF00}	/* 已访问的链接 */
a:hover {color: #FF00FF}	/* 鼠标移动到链接上 */
a:active {color: #0000FF}	/* 选定的链接 */
```

# 请解释你对盒模型的理解，以及如何在 CSS 中告诉浏览器使用不同的盒模型来渲染你的布局。

![](https://cloud.githubusercontent.com/assets/5563419/6568402/da5ca672-c711-11e4-9366-21d5d44f189f.png)

![](https://developer.mozilla.org/files/72/boxmodel%20(1).png)

**盒模型决定如何渲染，	一是计算尺寸(宽/高)，二是如何定位。**

**盒子本身的大小**是这样计算的：

```
Element Width = width + padding-left + padding-right + border-left + border-right
Element Height = height + padding-top + padding-bottom + border-top + border-bottom
```

**内容区域content area** 是包含元素真实内容的区域。它通常包含背景、颜色或者图片等，位于内容边界的内部，它的大小为内容宽度 或 content-box宽及内容高度或content-box高。

如果内容区域content area设置了背景、颜色或者图片，这些样式将会延伸到padding上(译者注：而不仅仅是作用于内容区域)。

**外边距合并**： 当两个垂直外边距相遇时，它们将形成一个外边距。合并后的外边距的高度等于两个发生合并的外边距的高度中的较大者。 测试发现两个inline/inline-block元素的水平margin不会合并。

[盒子模型MDN](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Box_Model/Introduction_to_the_CSS_box_model)

[margin合并](http://www.w3school.com.cn/css/css_margin_collapsing.asp)

# 请解释 ```* { box-sizing: border-box; }``` 的作用, 并且说明使用它有什么好处？

box-sizing 是 CSS3的box属性之一

```css
box-sizing: content-box|border-box|inherit;
```

* **content-box**: 此值为其默认值，其让元素维持W3C的标准Box Model。此时 width, min-width, max-width, height, min-height 与 max-height 控制内容大小。

* **border-box**: 此值让元素维持IE传统的Box Model（IE6以下版本），就是说，为元素指定的任何内边距和边框都将在已设定的宽度和高度内进行绘制，通过从已设定的宽度和高度分别减去边框和内边距才能得到内容的宽度和高度。

```html
 <div class="imgBox" id="contentBox">
 		<img src="/images/header.jpeg" alt="" />
 </div>
 <div class="imgBox" id="borderBox">
 		<img src="/images/header.jpeg" alt="" />
 </div>
```

```css
.imgBox img{
	width: 140px;
	height: 140px;
	padding: 20px;
	border: 20px solid orange;
	margin: 10px;
}
#contentBox img{
	-moz-box-sizing: content-box;
	-webkit-box-sizing: content-box;
	-o-box-sizing: content-box;
	-ms-box-sizing: content-box;
	box-sizing: content-box;
}

#borderBox img{
	-moz-box-sizing: border-box;
	-webkit-box-sizing: border-box;
	-o-box-sizing: border-box;
	-ms-box-sizing: border-box;
	box-sizing: border-box;
}
```

![](http://www.w3cplus.com/sites/default/files/box-sizing-demo1.jpg)

![](http://www.w3cplus.com/sites/default/files/box-sizing-img-box.png)


**作用，参考[css3-box-sizing](https://www.w3cplus.com/content/css3-box-sizing)**

1. 布局
2. 表单元素

[box-sizing](http://zh.learnlayout.com/box-sizing.html)

# 请罗列出你所知道的 display 属性的全部值

`none`、`inlie`、`inline-block`、`block`

**[参考1](https://css-tricks.com/almanac/properties/d/display/)**
**[MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/display)**

**inline**

![](https://css-tricks.com/wp-content/uploads/2011/09/inline-element.png)

>An inline element will accept margin and padding, but the element still sits inline as you might expect. Margin and padding will only push other elements horizontally away, not vertically.

![](https://css-tricks.com/wp-content/uploads/2011/09/inlinepadding.png)

>An inline element will not accept height and width. It will just ignore it.

**inline-block**

>An element set to inline-block is very similar to inline in that it will set inline with the natural flow of text (on the "baseline"). The difference is that you are able to set a width and height which will be respected.

![](https://css-tricks.com/wp-content/uploads/2011/09/inline-block.png)

**none**
>Totally removes the element from the page. Note that while the element is still in the DOM, it is removed visually and any other conceivable way (you can't tab to it or its children, it is ignored by screen readers, etc).

>Turns off the display of an element so that it has no effect on layout (the document is rendered as though the element did not exist). All descendant elements also have their display turned off.
To have an element take up the space that it would normally take, but without actually rendering anything, use the visibility property instead.

# 请解释 inline 和 inline-block 的区别？

**[stackoverflow](https://stackoverflow.com/questions/8969381/what-is-the-difference-between-display-inline-and-display-inline-block/14033814#14033814)**

>Imagine a <span> element inside a <div>. If you give the <span> element a height of 100px and a red border for example, it will look like this with

**`display: inline`**

![](https://i.stack.imgur.com/Emf0B.png)

**`display: inline-block`**

![](https://i.stack.imgur.com/1vbks.png)

**`display: block`**

![](https://i.stack.imgur.com/IPf9Q.png)

>Elements with display:inline-block are like display:inline elements, but they can have a width and a height. That means that you can use an inline-block element as a block while flowing it within text or other elements.
>the block elements like as p, div get a whole width line (force a line break) but respect width/height and all horizontal/vertical padding/margins. Inline-block elements have same behavior as block but without whole line break (other elements can be placed beside them) 

Difference of supported styles as summary:

* **inline**: only margin-left, margin-right, padding-left, padding-right
* **inline-block**: margin, padding, height, width

# 请解释 relative、fixed、absolute 和 static 元素的区别

[w3cplus](https://www.w3cplus.com/css/advanced-html-css-lesson2-detailed-css-positioning.html)

```css
position: static | relative | absolute | sticky | fixed
```

**static**

元素都有position属性，其默认值是“static”，这也意味着，他们没有也不接受位置属性设置（top、right、bottom、left属性值设置）。另外元素设置了position属性，将会覆盖元素的默认值“static”。

**relative**
relative 表现的和 static 一样，除非你添加了一些额外的属性。
在一个相对定位（position: relative）的元素上设置 top 、 right 、 bottom 和 left 属性会使其偏离其正常位置,**设置的值都是相对于其自身原始的位置，而不是其父元素**。其他的元素则不会调整位置来弥补它偏离后剩下的空隙。

设置了位移属性的相对定位元素，他在页面中仍然是正常的、静态的，仍属于自然流。在这种情况下，其他元素不会占用相对定位元素当初的位置。**此外，其他元素没有进行位置移动时，相对定位元素可能会和其他元素重叠。**

```html
<span class="rela">123</span><span>456</span>
```

```css
.rela{
  position:relative;
  border:1px solid red;
  left:10px;
}
```

relative定位的层总是相对于其最近的父元素，无论其父元素是何种定位方式

**absolute**

绝对定位的元素从文档流完全删除，并相对于其包含块（最近的已定位祖先元素）定位；如果没有positioned祖先元素，那么它是相对于文档的 body 元素，并且它会随着页面滚动而移动。

不定宽情况下，实际宽度由内容决定。left/right/top/bottom/z-index 属性有效，**设置的`left`、`right`这些值是相对于其设置了相对定位的父元素，而不是像relative那样是相对于自身**。

```html
<div>wwwwwwwwwwwwwwwwwwwwwwwwwwww</div>
<p>22222222</p>
```

```css
/* 后面的p会和div重叠。同时div的宽度由内容决定 */
div{
  position:absolute;
  border:1px solid blue;
}
```

**定位为absolute的层脱离正常文本流，但与relative的区别是其在正常流中的位置不再存在。 **

**对于absolute定位的层总是相对于其最近的定义为absolute或relative的父层，而这个父层并不一定是其直接父层**

**fixed**

固定定位和绝对定位很类似，一个固定定位（position: fixed）元素会相对于视窗(viewport)来定位，这意味着即使页面滚动，它还是会停留在相同的位置。

**sticky**
[参考](https://developer.mozilla.org/en-US/docs/Web/CSS/position)
>A stickily positioned element is an element whose computed position value is sticky. It's treated as relatively positioned until its containing block crosses a specified threshold, at which point it is treated as fixed.

**z-index**
z-index 属性设置元素的堆叠顺序。拥有更高堆叠顺序的元素总是会处于堆叠顺序较低的元素的前面。
**z-index，对relative/absolute/fixed有效，即使用static 定位或无position定位的元素z-index属性是无效的**。 默认值auto。同值后面高于前面。可正可负。

同样的，top 、 right 、 bottom 和 left也只有在定位是relative/absolute/fixed才有效。

# CSS 中字母 'C' 的意思是叠层 (Cascading)。请问在确定样式的过程中优先级是如何决定的 (请举例)？如何有效使用此系统？

一般情况下，优先级如下： 
（外部样式）External style sheet <（内部样式）Internal style sheet <（内联样式）Inline style 
有个例外的情况，就是**如果外部样式放在内部样式的后面，则外部样式将覆盖内部样式。**

**用一句话总结就是：就近原则。**

![]({{site.url}}/assets/img/css-interview-questions/css-rules-priority.png)

选择器的优先权：

1. 内联样式表的权值最高 1000； 
2. ID 选择器的权值为 100 
3. Class 类选择器的权值为 10 
4. HTML 标签选择器的权值为 1

CSS 优先级法则：

1. 选择器都有一个权值，权值越大越优先； 
2. **当权值相等时，后出现的样式表设置要优于先出现的样式表设置,即就近原则**； 
3. 创作者的规则高于浏览者：即网页编写者设置的CSS 样式的优先权高于浏览器所设置的样式； 
4. 继承的CSS 样式不如后来指定的CSS 样式； 
5. 在同一组属性设置中标有“!important”规则的优先级最大；

# 为什么响应式设计 (responsive design) 和自适应设计 (adaptive design) 不同？

[csdn](http://blog.csdn.net/wxl1555/article/details/52984206)

自适应是为了解决如何在不同大小的设备上呈现同样的网页（网页的主题和内容不改变） 

自适应暴露的一个问题，如果屏幕太小，即使网页能够根据屏幕大小进行适配，但是会感觉在小屏幕上查看内容太过拥挤。响应式正是针对这个问题衍生出的概念。它可以自动识别屏幕宽度、并做出相应调整的网页设计、布局和展示的内容可能会有所改变。

## 响应式设计(Responsive Web Design)

主要利用CSS3的媒介查询（Media Query）和Viewport来解决问题。通过媒介查询的设置，根据屏幕宽度、屏幕方向等各个属性来加载不同场景下不同的CSS文件来渲染页面的视觉风格。

**具体做法**

1. meta标签的viewport属性

	```html
	<meta name=”viewport” content=”width=device-width, initial-scale=1.0, 			maximum-scale=1.0, user-scalable=0”/>
	```

	* 视窗宽度width=device-width为设备宽度
	* 视窗缩放initial-scale=1  不可缩放状态   
	* maximum-scale=1  不可放大
	* user-scalable=0 不允许用户调整缩放

2. media query
	1. 通过link标签

		```html
		<!--当前屏幕宽度小于600px的时候，加载style1.css文件来渲染页面-->
		<link rel=”stylesheet” type=”text/css” media=”screen and(max-width: 600px)” 				href=”style1.css”/>
		```

	2. CSS中直接设置

		```css
		@media screen and(max-width: 600px){
				/* 具体的CSS属性设置 */
		}
		```

**优点**

1. 面对不同分辨率设备灵活性强
2. 能够快捷解决多设备显示适应问题

**缺点**

1. 兼容各种设备工作量大，效率低下
2. 代码累赘会出现隐藏无用的元素，加载时间加长
3. 一定程度上改变了网站原有的布局结构，会出现用户混淆的结果

## 自适应设计（Adaptive Design）

网页自适应显示在不同大小终端设备上。

**具体做法**

1. meta标签的viewport属性

	```html
	<meta name=”viewport” content=”width=device-width, initial-scale=1.0, 			maximum-scale=1.0, user-scalable=0”/>
	```

2. 不使用绝对宽度，由于网页会根据屏幕宽度调整布局，不能使用width: xxx px具体的像素值，使用百分比width:xxx %或者width:auto
3. 相对大小的字体，字体也不能使用绝对大小（px），而只能使用相对大小（em）设置body字体为100%，即字体大小是页面默认大小的100%，也是16px。例如：p{ font-size: 1.5em; }，即p的大小是默认大小的1.5倍（24px（ 24/16=1.5 ））。

4. 流动布局：各个区块的位置都是浮动的，不是固定不变的。Float的好处是，如果宽度太小放不下两个元素，后面的元素会自动滚到前面元素的下方，不会再水平方向溢出，避免了水平滚动条的出现。
5. 图片的自适应

	```css
	img { max-width: 100%; height: auto }
	```
# 请问为何要使用 `translate()` 而非 *absolute positioning*，或反之的理由？为什么？

从动画角度来说 使用 transform 或 position 实现动画效果时有很大差别。**使用 transform 时，可以让 GPU 参与运算，动画的 FPS 更高**。

**[如何开启GPU加速](http://www.cnblogs.com/rubylouvre/p/3471490.html)**

1. 使用3D转换

	```css
	.cube {
	   -webkit-transform: translate3d(250px,250px,250px)
	   rotate3d(250px,250px,250px,-120deg)
	   scale3d(0.5, 0.5, 0.5);
	}
	```

2. 不需要3D转换时，也可以使用GPU加速

	```css
	.cube {
	   -webkit-transform: translateZ(0);
	   -moz-transform: translateZ(0);
	   -ms-transform: translateZ(0);
	   -o-transform: translateZ(0);
	   transform: translateZ(0);
	}
	```

**position 是为页面布局而生的。 transform 是为动画而生的。不会引起DOM重排**

对元素进行动画的一些要点：

1. 尽量使用keyframes和transform进行动画，这样浏览器会自身分配每帧的长度，并作出优化
2. 如果非要使用js来进行动画，使用requestAnimateFrame
3. 使用2d transform而不是改变top/left的值，这样会有更短的repaint时间和更圆滑的动画效果
4. 移动端的动画效果可能会比pc端的差，因此一定要注意性能优化，尽量减少动画元素的DOM复杂性，待动画结束后异步执行DOM操作

* [Why Moving Elements With Translate() Is Better Than Pos:abs Top/left](https://www.paulirish.com/2012/why-moving-elements-with-translate-is-better-than-posabs-topleft/)

* [cnblogs](https://www.cnblogs.com/accordion/p/4593576.html)

# 一像素边框问题

[参考1](http://blog.csdn.net/bbnbf/article/details/51580569)
[参考2](https://segmentfault.com/a/1190000007604842)
[参考3](http://www.html-js.com/article/Mobile-terminal-H5-mobile-terminal-HD-multi-screen-adaptation-scheme%203041)

# 两列布局

布局问题参考文章：
* [CSS 布局经典问题初步整理](http://brianway.github.io/2017/05/18/css-layout-classical-problems/)
* [CSS 布局说——可能是最全的](http://mp.weixin.qq.com/s/iQ8mSr4oEAC8Ve6IdiN9jQ)

左边定宽，右边自适应

```html
<div class="left">定宽</div>
<div class="right">自适应</div>
```

1. 使用浮动+margin

	```css
	.left{
	  width: 200px;
	  height: 200px;
	  background: red;
	  float: left;
	  display: table;
	  text-align: center;
	  line-height: 200px;
	  color: #fff;
	}

	.right{
	  margin-left: 210px;
	  height: 500px;
	  background: yellow;
	  text-align: center;
	  line-height: 600px;
	}
	```

# 三列布局

两边定宽，然后中间的width是auto的，可以自适应内容。

1. 左右两栏使用float属性，中间栏使用margin属性进行撑开

	```html
	<div class="left">左栏</div>
	<div class="right">右栏</div>
	<div class="middle">中间栏</div>
	```

	```css
	.left{
	  width: 200px;
	  height: 300px;
	  background: yellow;
	  float: left;
	}
	.right{
	  width: 150px;
	  height: 300px;
	  background: green;
	  float: right;
	}
	.middle{
	  height:300px;
	  background: red;
	  margin-left: 220px;
	  margin-right: 160px;
	}
	```

	**缺点**是当宽度小于左右两边宽度之和时，右侧栏会被挤下去。

2. 使用position定位实现，即左右两栏使用position进行定位，中间栏使用margin进行定位

	```html
	<div class="left">左栏</div>
	<div class="right">右栏</div>
	<div class="middle">中间栏</div>
	```

	```css
	.left{
    background: yellow;
    width: 100px;
    height: 300px;
    position: absolute;
    top: 0;
    left: 0;
	}
	.middle{
	    height: 300px;
	    margin: 0 120px;
	    background: red;
	}
	.right{
	    height: 300px;
	    width: 100px;
	    position: absolute;
	    top: 0;
	    right: 0;
	    background: green;
	}
	```

	**缺点**是当父元素有内外边距时，会导致中间栏的位置出现偏差。

3. **双飞翼布局**,关键是 浮动 + 负margin的使用。

	```html
	<div class="middle"><!--注意中间一栏先写，因为是主题内容，优先渲染-->
        <div class="main">中间</div>
    </div>
    <div class="left">
        左栏
    </div>
    <div class="right">
        右栏
    </div>
	```

	```css
	.wrapper{
    overflow: hidden;  //清除浮动
	}
	.middle{
	    width: 100%;
	    float: left;
	}
	.middle .main{
	    margin: 0 120px;
	    background: red;
	}
	.left{
	    width: 100px;
	    height: 100px;
	    float: left;
	    background: green;
	    margin-left: -100%;
	}
	.right{
	    width: 100px;
	    height: 100px;
	    float: left;
	    background: yellow;
	    margin-left: -100px;
	}
	```

4. **圣杯布局**, 关键思想与双飞翼布局相同，都是先利用float+负margin使三列处于同一行。之后因为圣杯的html结构原因，需要通过设置padding+relative定位的方式使得三列的内容不重叠。可以参见[简书](http://www.jianshu.com/p/f9bcddb0e8b4)来理解详细细节。

	```html
	<div class="wrapper">
	    <div class="middle">中间 </div><!--同样中间一栏放前面优先渲染-->
	    <div class="left">左栏</div>
	    <div class="right">右栏</div>
	</div>
	```

	```css
	.wrapper{
	    overflow: hidden;
	    padding:0 120px;
	}
	.middle{
	    width:100%;
	    float: left;
	    background: rgba(255,0,0,0.8);
	}

	.left{
	    width: 100px;
	    height: 100px;
	    float: left;
	    position:relative;
	    left:-120px;
	    background: rgba(0,255,0,0.2);
	    margin-left: -100%;
	}
	.right{
	    width: 100px;
	    height: 100px;
	    float: left;
	    position:relative;
	    left:120px;
	    background: rgba(255,255,0,0.5);
	    margin-left: -100px;
	}
	```

5. **flex布局**

	[图解CSS3 Flexbox属性](https://www.w3cplus.com/css3/a-visual-guide-to-css3-flexbox-properties.html)

	```html
	<div class="wrapper">
	    <div class="left">左栏</div>
	    <div class="middle">中间 </div>
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

	**缺点**是老版本浏览器不兼容，如ie9


# 居中

[参考文档](https://css-tricks.com/centering-css-complete-guide/)

## 水平居中

**行内元素inline/inline-`*`** - `text-align: center;`

```html
<span  class="center-inline">woshiccc</span>
```

```css
.center-inline{
  text-align:center;
  border:1px solid red;
  width:100%;
  display:inline-block;
}
```

**块级元素** - `margin:0 auto;`

```html
<div class="center">test-center</div>
```

```css
.center{
  width:100px;
  margin:0 auto;
  border:1px solid green;
}
```

**多个块级元素** - 对父元素设置 `text-align: center;`，对子元素设置 `display: inline-block;`

```html
<div class="wrapper">
   <div class="left">左栏</div>
   <div class="middle">中间</div>
   <div class="right">右栏</div>
</div>
```

```css
.wrapper{
  text-align:center;
}

.wrapper div{
  display:inline-block;
}

.left{
    width: 200px;
    height: 200px;
    background: green;
}
.middle{
    width: 220px;
    background: red;
}
.right{
    width:200px;
    height: 100px;
    background: yellow;
}
```

## 垂直居中

### 行内元素 inline/inline-*

**单行**

* 设置上下 padding 相等
* 设置 line-height 和 height 相等

```html
<main>
  <a href="#0">We're</a>
  <a href="#0">Centered</a>
  <a href="#0">Bits of</a>
  <a href="#0">Text</a>
</main>
```

```css
main a {
  background: black;
  color: white;
  padding: 10px 10px;
  text-decoration: none;
}

// 或者
main a {
  background: black;
  color: white;
  line-height:50px;
  height:50px;
  display:inline-block;
  text-decoration: none;
}
```

**多行**

1. 设置 `display: table-cell;` 和 `vertical-align: middle;`

**[vertical-align](https://developer.mozilla.org/en-US/docs/Web/CSS/vertical-align)**

>The vertical-align CSS property specifies the vertical alignment of an inline or table-cell box.

![]({{site.url}}/assets/img/css-interview-questions/vertical-align.png
)

	```html
	<div class="center-table">
	  <p>I'm vertically centered multiple lines of text in a CSS-created table layout.</p>
	</div>
	```

	```css
	.center-table {
	  display: table;
	  height: 250px;
	  background: white;
	  width: 240px;
	  margin: 20px;
	}
	.center-table p {
	  display: table-cell;
	  margin: 0;
	  background: black;
	  color: white;
	  padding: 20px;
	  border: 10px solid white;
	  vertical-align: middle;
	}
	```

2. 使用`flex`布局

	```html
	<div class="flex-center">
	  <p>I'm vertically centered multiple lines of text in a flexbox container.</p>
	</div>
	```

	```css
	.flex-center {
	  background: black;
	  color: white;
	  border: 10px solid white;
	  display: flex;
	  flex-direction: column;
	  justify-content: center;
	  height: 200px; // 需要父元素有一个固定的高度
	  resize: vertical;
	  overflow: auto;
	}
	```

3. 使用伪元素

	```html
	<div class="ghost-center">
	  <p>I'm vertically centered multiple lines of text in a container. Centered with a ghost pseudo element</p>
	</div>
	```

	```css

	div {
	  background: white;
	  width: 240px;
	  height: 200px;
	  margin: 20px;
	  color: white;
	  resize: vertical;
	  overflow: auto;
	  padding: 20px;
	}

	.ghost-center::before {
	  content: " ";
	  display: inline-block;
	  height: 100%;
	  width: 1%;
	  vertical-align: middle;
	}

	.ghost-center p {
	  display: inline-block;
	  vertical-align: middle;
	  width: 190px;
	  margin: 0;
	  padding: 20px;
	  background: black;
	}
	```

### 块级元素

**高度已知** - 父元素需使用相对布局,子元素使用绝对布局, `top: 50%;`，再用负的 `margin-top` 把子元素往上拉一半的高度.

```html
<div>
	<p>inner</p>
</div>
```

```css
div{
  height:200px;
  width:200px;
  border:1px solid red;
  position:relative;
}

p{
  margin-top:-10px;
  height:20px; // 需要知道子元素高度，否则无法确定margin-top的值
  border:1px solid green;
  position:absolute;
  top:50%;
}
```

**高度未知** - 父元素需使用相对布局,子元素使用绝对布局 `position: absolute; top: 50%; transform: translateY(-50%);`

```html
<div>
	<p>inner</p>
</div>
```

```css
div{
  height:200px;
  width:200px;
  border:1px solid red;
  position:relative;
}

p{
  /* height:20px; */
  border:1px solid green;
  position:absolute;
  top:50%;
  transform:translateY( -50% );
  /* margin-top:-10px; */
}
```

**使用flex布局** - 选择方向，`justify-content: center;`

```html
<main>
  <div>
     I'm a block-level element with an unknown height, centered vertically within my parent.
  </div>
</main>
```

```css
main {
  background: white;
  height: 300px;
  width: 200px;
  padding: 20px;
  margin: 20px;
  display: flex; // 关键的3句
  flex-direction: column;
  justify-content: center;
  resize: vertical;
  overflow: auto;
}

main div {
  background: black;
  color: white;
  padding: 20px;
  resize: vertical;
  overflow: auto;
}
```

## 水平垂直居中

html结构：

```html
<main>
  <div>
     I'm block
  </div>
</main>
```

**定高定宽** - 先用绝对布局 `top: 50%; left: 50%;`，再用和宽高的一半相等的负 margin 把子元素回拉.

```css
main {
  background: white;
  height: 300px;
  width: 300px;
  position:relative;
}

main div {
  width:100px;
  height:30px;
  background: black;
  color: white;
  position:absolute;
  top:50%;
  left:50%;
  margin-top:-15px;
  margin-left:-50px;
}
```

**高度和宽度未知** - 与上面的类似，不同之处在于不使用负margin来调整位置，而是使用`transform`

```css
main div {
  background: black;
  color: white;
  position:absolute;
  top:50%;
  left:50%;
  transform:translate(-50%,-50%);
}
```

**flex** - `justify-content: center; align-items: center;`

```css
main {
  background: white;
  height: 200px;
  width: 60%;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  resize: both; // 需要设置overflow才能调整大小
  overflow: auto;
}

main div {
  background: black;
  color: white;
  width: 50%;
  padding: 20px;
  resize: both;
  overflow: auto;
}
```

# css grid布局

* [CSS Grid Layout: A Quick Start Guide](https://webdesign.tutsplus.com/tutorials/css-grid-layout-quick-start-guide--cms-27238)
* [CSS Grid Layout: Fluid Columns and Better Gutters](https://webdesign.tutsplus.com/tutorials/css-grid-layout-units-of-measurement-and-basic-keywords--cms-27259)
* [CSS Grid Layout: Using Grid Areas](https://webdesign.tutsplus.com/tutorials/css-grid-layout-using-grid-areas--cms-27264)
* [CSS Grid Layout: Going Responsive](https://webdesign.tutsplus.com/tutorials/css-grid-layout-going-responsive--cms-27270)
* [Understanding the CSS Grid “Auto-Placement Algorithm”](https://webdesign.tutsplus.com/tutorials/understanding-the-css-grid-auto-placement-algorithm--cms-27563)

