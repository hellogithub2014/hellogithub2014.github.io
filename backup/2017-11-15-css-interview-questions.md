---
title: "css面试题"
img: canyon.jpg # Add image post (optional)
date: 2077-11-15 20:30:00 +0800
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

参考[博客](http://web.jobbole.com/83274/)

**TODO再看几遍**

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

Image Replacement 是说用图片把文字替换掉的技术，常用在标题上。

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

只用过bootstrap的栅格系统。

```html
<div class="container">
    <div class="row">
      <div class="col-xs-offset-4  col-xs-1">123</div>
      <div class="col-xs-6">123</div>
      <div class="col-xs-1">123</div>
    </div>
  </div>
```

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

**外边距合并**： 当两个垂直外边距相遇时，它们将形成一个外边距。合并后的外边距的高度等于两个发生合并的外边距的高度中的较大者。

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

relative定位的层总是相对于其最近的父元素，无论其父元素是何种定位方式

**absolute**

绝对定位的元素从文档流完全删除，并相对于其包含块（最近的已定位祖先元素）定位；如果没有positioned祖先元素，那么它是相对于文档的 body 元素，并且它会随着页面滚动而移动。

不定宽情况下，实际宽度由内容决定。left/right/top/bottom/z-index 属性有效，**设置的`left`、`right`这些值是相对于其设置了相对定位的父元素，而不是像relative那样是相对于自身**。

**定位为absolute的层脱离正常文本流，但与relative的区别是其在正常流中的位置不再存在。 **

**对于absolute定位的层总是相对于其最近的定义为absolute或relative的父层，而这个父层并不一定是其直接父层**

**fixed**

固定定位和绝对定位很类似，一个固定定位（position: fixed）元素会相对于视窗(viewport)来定位，这意味着即使页面滚动，它还是会停留在相同的位置。

**sticky**
[参考](https://developer.mozilla.org/en-US/docs/Web/CSS/position)

**z-index**
z-index 属性设置元素的堆叠顺序。拥有更高堆叠顺序的元素总是会处于堆叠顺序较低的元素的前面。
**z-index，对relative/absolute/fixed有效，即使用static 定位或无position定位的元素z-index属性是无效的**。 默认值auto。同值后面高于前面。可正可负。

同样的，top 、 right 、 bottom 和 left也只有在定位是relative/absolute/fixed才有效。

# CSS 中字母 'C' 的意思是叠层 (Cascading)。请问在确定样式的过程中优先级是如何决定的 (请举例)？如何有效使用此系统？

一般情况下，优先级如下： 
（外部样式）External style sheet <（内部样式）Internal style sheet <（内联样式）Inline style 
有个例外的情况，就是**如果外部样式放在内部样式的后面，则外部样式将覆盖内部样式。**

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

