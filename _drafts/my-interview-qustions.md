
# js

## 【实习、1~3】 请解释 JavaScript 中 `this` 是如何工作的。

由运行时在何处被调用决定的

1. 默认绑定
2. 作为对象方法调用时的**隐式绑定**
3. bind显示绑定 ---> `.call` 和 `.apply` 的区别是什么
4. 构造函数`new`调用, **优先级比bind高**

## 【1~3】实现 `Function.prototype.bind`？
作用： 显示绑定this，偏函数、延迟执行。

**[参见博客](https://hellogithub2014.github.io/javascript-bind/)**

## 【实习、1~3】什么是闭包 (closure)

## 【1~3】实现一个`Event`类，继承这个类的都有on、off、trigger、once方法[题目参考](http://marvel.bytedance.net/#/question/detail/?id=455&nocontri=true)


## 【实习】请解释变量声明提升 (hoisting)。
JavaScript在编译期，会在每个作用域中寻找变量声明、函数声明，将它们提升到作用域的最前面，这样即使在每个声明之前使用对应的标识符也不会报错。

```js
test(); // 在有重名的情况下，函数声明的优先级要比变量名声明高，会忽略之后的变量名声明。此时test是一个函数

var test=123; // 在运行期执行到这一句，test变量会被指向123

test;// 123

function test(){
	console.log(a); // undefined

	var a=1;

	console.log(a); // 1
}

//function test(){// 如果有多个重复的函数声明名称，以最后的那个为准。此时上面的test函数会作废
//		console.log(2);
// }
```

## 【实习、1~3】请描述事件冒泡机制 (event bubbling)。

在浏览器（以chrome为例）中，当触发一个事件时，会有3个阶段： 事件捕获、事件处理、事件冒泡。利用事件冒泡我们可以使用事件委托技术来减少内存消耗.

## 【1~3】请指出 document load 和 document DOMContentLoaded 两个事件的区别。

参考[知乎文章](https://zhuanlan.zhihu.com/p/25876048)

**当一个 HTML 文档被加载和解析完成后，DOMContentLoaded 事件便会被触发。**

浏览器向服务器请求到了 HTML 文档后便开始解析，产物是 DOM（文档对象模型），到这里 HTML 文档就被加载和解析完成了。

**同步脚本**

JavaScript 可以阻塞 DOM 的生成，也就是说当浏览器在解析 HTML 文档时，如果遇到 `<script>`，便会停下对 HTML 文档的解析，转而去处理脚本。如果脚本是内联的，浏览器会先去执行这段内联的脚本，如果是外链的，那么先会去加载脚本，然后执行。在处理完脚本之后，浏览器便继续解析 HTML 文档。

另外，因为 JavaScript 可以查询任意对象的样式，所以意味着在 CSS 解析完成，也就是 CSSOM 生成之后，JavaScript 才可以被执行。

在任何情况下，DOMContentLoaded 的触发不需要等待图片等其他资源加载完成。

所以，**当文档中没有脚本时，浏览器解析完文档便能触发 DOMContentLoaded 事件；如果文档中包含脚本，则脚本会阻塞文档的解析，而脚本需要等 CSSOM 构建完成才能执行。**

**defer 与 DOMContentLoaded**

如果 script 标签中包含 defer，那么这一块脚本将不会影响 HTML 文档的解析，而是等到 HTML 解析完成后才会执行。而 DOMContentLoaded 只有在 defer 脚本执行结束后才会被触发。 所以这意味着什么呢？HTML 文档解析不受影响，等 DOM 构建完成之后 defer 脚本执行，但脚本执行之前需要等待 CSSOM 构建完成。在 DOM、CSSOM 构建完毕，defer 脚本执行完成之后，DOMContentLoaded 事件触发。

即 DOM+CSSOM ------>   defer script  ------> DOMContentLoaded

**async 与 DOMContentLoaded**

如果 script 标签中包含 async，则 HTML 文档构建不受影响，解析完毕后，DOMContentLoaded 触发，而不需要等待 async 脚本执行、样式表加载等等。

即    DOM  ------>  DOMContentLoaded；
或者	DOM+CSSOM ------>   async script ----->  DOM ------> DOMContentLoaded

取决于 async的加载速度。

**DOMContentLoaded 与 load**

当 HTML 文档解析完成就会触发 DOMContentLoaded，而所有资源加载完成之后，load 事件才会被触发。

`$(document).ready(function(){}` 监听的是DOMContentLoaded事件；
`$(document).load(function(){}` 监听的是load事件；


## 【1~3】`Promise`及`FileReader`
1. 第一张图片上传完再上传第二张
	
	```js
	let p = Promise.resolve();
	[0, 1, 2, 3, 4].forEach((index) => {
	  p = p
	    .then(_ => loadImg(index + 1))
	    .then((_) => {
	      console.log(`加载第${index + 1}张图片成功`);
	    })
	    .catch((_) => {
	      console.error(`加载第${index + 1}张图片失败`);
	    });
	});
	```

2.  5张图片都上传完后弹出提示语: `Promise.all`、全局标志位
3. 5张图片都已放入dom中，需要添加事件，点击每张图片时弹出『我是第几张图片』，考察作用域链(var与IIFE、let)。
4. 前端预览上传的图片: `FileReader/URL`

## 【实习、1~3】一个解析url参数工具函数
1. base64编码中可能有尾随的=
2. 参数校验

## 【1~3】什么是事件循环 (event loop)？
参考[博客](https://hellogithub2014.github.io/javascript-event-loop-summary/)

## 【实习、1~3】 es6新特性、es7新特性、async/await及其底层实现原理

## 【1~3】文件上传、大文件上传

# 【实习】原型继承

```js
Student.prototype=Object.create(Person.prototype); // 寄生组合继承
Student.prototype.constructor=Student;

Object.defineProperty( Student.prototype, "constructor",{
    writable:true,
    enumerable:false,
    configurable:false,
    value:Student,
} );
```

## 【实习、1~3】数组去重

1. 要求保持原顺序
2. 不要求保持顺序； set/hashmap原理
3. 记录每个数字出现次数
4. 若数组本身已经是有序时去重优化

## 【1~3】DOM结构、getElementByClassName

    树形结构，采用递归

## 【1~3】模块化规范： commonjs、ES6 module

TODO: 手机里的回答

* 二者都是用于模块加载
* CommonJS是同步加载模块的，AMD是异步加载的
* CommonJS主要在服务器端使用，AMD主要在浏览器使用

[参考](https://www.cnblogs.com/chenguangliang/p/5856701.html)

## 【1~3】函数截流 ： debounce、throtle

```js
function debounce(fn, delay) {
  let timer;
  return function func() {
    const context = this;
    const args = arguments;
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(context, args);
    }, delay);
  };
}
```

```js
function throttle(fn, delay) {
  const _self = fn;
  let timer;
  let firstTime = true;
  return function func() {
    const args = arguments;
    const _me = this;

    if (firstTime) {
      _self.apply(_me, args);
      firstTime = false;
      return;
    }

    if (timer) {
      return false;
    }

    timer = setTimeout(() => {
      clearTimeout(timer);
      timer = null;
      _self.apply(_me, args);
    }, delay || 500); // 默认500毫秒延迟
  };
}
```

# css

## 【实习】两列布局

布局问题参考文章：
* [CSS 布局经典问题初步整理](http://brianway.github.io/2017/05/18/css-layout-classical-problems/)
* [CSS 布局说——可能是最全的](http://mp.weixin.qq.com/s/iQ8mSr4oEAC8Ve6IdiN9jQ)

**3列布局中的知识均可以用到2列布局**

## 【1~3】3列布局

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


## 【1~3】居中

[参考文档](https://css-tricks.com/centering-css-complete-guide/)

### 水平居中

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

### 垂直居中

#### 行内元素 inline/inline-*

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

#### 块级元素

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

### 水平垂直居中

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


## 【实习、1~3】flex

1. 容器属性： flex-direction、flex-wrap、justify-content、align-items、align-content（类似justify-content）

2. 子项目属性： order（控制顺序）、flex-grow（空余空间中的放大）、flex-shrink（设置为0时会固定大小）、flex-basis、align-self

## 【实习、1~3】position的几种值


[w3cplus](https://www.w3cplus.com/css/advanced-html-css-lesson2-detailed-css-positioning.html)

```css
position: static | relative | absolute | sticky | fixed
```

**static**
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

## 【实习】请罗列出你所知道的 display 属性的全部值

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




## 【1~3】BFC(Block Formatting Context) 及其如何工作。

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

## 【实习、1~3】请解释浏览器是如何判断元素是否匹配某个 CSS 选择器？

**从右向左**

```css
.nav div span { font-size:16px;}
```

会先找到所有`span`元素，然后针对每一个`span`做搜索，看其有没有祖先元素是`div`的，然后再次针对每个`div`做搜索，直到找到`.nav`的元素。

**为什么要这样？**

1. 在树形结构中，每个节点找到它的父节点是很容易的事情，相反父节点要遍历完子节点比较麻烦。从右向左的匹配规则，在第一步匹配之后，会过滤掉大量不符合的节点，剩下的节点逐个寻找父节点相对较容易；
2. 如果是从左到右，那么找到`.nav`的所有节点后，需要针对每个节点搜索其子节点来寻找`div`，相当于要搜索整棵子树，这种遍历操作很费时间。

## 【1~3】请解释 ```* { box-sizing: border-box; }``` 的作用, 并且说明使用它有什么好处？

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

# 网络与安全

## 【实习、1~3】http缓存，相关header

**[浏览器缓存博客](https://hellogithub2014.github.io/browser-cache-summary/)**

缓存时间：expires、cache-control: max-age、
缓存协商：if-modified-since、if-unmodified-since、if-match/if-unmatch

## 【实习】tcp握手挥手、为保持传输可靠性做了哪些事情
ACK+校验和+超时+重传+序列号

## 【1~3】从敲url到页面显示内容经过

**[参考博客](https://hellogithub2014.github.io/how-do-network-connect/)**

## 【1~3】为什么传统上利用多个域名来提供网站资源会更有效？

因为在HTTP1中，每个域名同时请求资源数目有一个最大限制，一般是6或者4。 如果网站资源数比较多，那么后面的资源就会等待，为了避免这种限制，会考虑将资源部署到多个域名中。这样网站的启动速度就会变快。

如果在以后使用了HTTP2，它具有多路复用的能力，就不用这么做了。

## 【实习、1~3】dns是哪一层的协议、 解析过程、在传输层使用了tcp还是udp

应用层协议

解析过程： 浏览器缓存、本地缓存、路由器缓存、ISP服务商缓存、层级查找

底层使用tcp还是udp： [参考](https://www.cnblogs.com/549294286/p/5172435.html)

## 【1~3】跨域及其解决方法

**跨域问题解决方案**参见博客[前端跨域方法小结](https://hellogithub2014.github.io/front-end-cross-origin-summary/)

## 【1~3】xss、csrf

[博客](https://hellogithub2014.github.io/web-safe/)

## 【1~3】请解释 HTTP status 301 与 302 的区别？

**301 - 永久重定向**

表示请求的资源已被分配了新的URL，以后应该使用资源现在所指的URL，即HTTP响应头中的`Location`字段值。

如果在指定资源URL时忘记了添加结尾的`/`时，就会产生301状态码：

```
https://hellogithub2014.github.io/how-do-network-connect
```

![]({{site.url}}/assets/img/network-performance-interview-questions/response-301.png)

**302 - 临时重定向**

同样表示请求的资源已被分配了新的URL，**希望本次**能使用新的URL访问。

**区别**

302表示资源不是被永久移动，只是临时性的，已移动的资源对应的URL将来还有可能发生改变。



# html

## 【实习】请描述 `cookies`、`sessionStorage` 和 `localStorage` 的区别。

**cookies**

1. 以域名+路径作为划分，对该路径及其子路径下的所有页面均可见
2. 如果不设置有效期，默认窗口关闭就会清楚；如果设置了max-age，那么就会保存在本地硬盘上，直到过期才会删除
3. 如果设置了secure，那么只有在HTTPS中才会传递
4. httpOnly - 只有在服务器端才能操作cookie，浏览器端无法修改
5. cookies会发送到服务器端
6. cookie数据不能超过4k

**sessionStorage**

1. 以窗口和源作为划分，**不同源文档之间无法共享`sessionStorage`**
2. 窗口刷新仍会存在
3. 窗口关闭就会消失
4. 不同窗口的sessionStorage不共享
5. 这里提到的基于窗口作用域的`sessionStorage`指的窗口只是**顶级窗口**。如果一个标签页中包含两个`iframe`，它们所包含的文档是同源的，那么之间是可以共享`sessionStorage`.
6. **也有storage事件**
7. sessionStorage虽然也有存储大小的限制，但比cookie大得多，可以达到5M或更大。

**localStorage**

1. 以域名划分
2. 除非手动或通过api清除缓存，会一直存在
3. 有storage事件
4. localStorage 虽然也有存储大小的限制，但比cookie大得多，可以达到5M或更大。


## 【1~3】请解释 `<script>`、`<script async>` 和 `<script defer>` 的区别。

![](https://pic4.zhimg.com/v2-b574cf32f8d968ec8546418eac91ac03_b.png)

**`<script>`** - 加载和解析时会阻塞DOM解析

**`<script async>`**

* 加载时不会阻塞DOM解析，加载完成后立即执行，此时会阻塞DOM解析；
* 多个async执行顺序不一定，因为每一个都是加载完立即执行
* **async-script 可能在 DOMContentLoaded 触发之前或之后执行，但一定在 load 触发之前执行**

**`<script defer>`**

* 加载时不会阻塞DOM解析，在DOM解析完成后才会执行；
* defer 不会改变 script 中代码的执行顺序
* **所有由 defer-script 加载的 JavaScript 代码，然后触发 DOMContentLoaded 事件**


