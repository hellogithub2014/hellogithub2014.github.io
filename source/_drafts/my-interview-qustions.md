
# js

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

## 【实习】原型继承

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

## 【实习、1~3】请描述事件冒泡机制 (event bubbling)。

在浏览器（以chrome为例）中，当触发一个事件时，会有3个阶段： 事件捕获、事件处理、事件冒泡。利用事件冒泡我们可以使用事件委托技术来减少内存消耗.

## 【实习、1~3】一个解析url参数工具函数
1. base64编码中可能有尾随的=
2. 参数校验

## 【实习、1~3】 请解释 JavaScript 中 `this` 是如何工作的。

由运行时在何处被调用决定的

1. 默认绑定
2. 作为对象方法调用时的**隐式绑定**
3. bind显示绑定 ---> `.call` 和 `.apply` 的区别是什么
4. 构造函数`new`调用, **优先级比bind高**

## 【实习、1~3】RequestAnimationFrame与settimeout差别

1. settimeout可能丢帧，若频幕刷新间隔16.7ms，settimeout间隔10ms，那么每第三个settimeout所作出的改变是无法看到的；raf的调用频率和浏览器刷新频率一致
2. settimeout执行时间不确定，因为其真正的任务被放到任务队列里
3. **经测试，raf、settimeout、setInterval在窗口最小化时不执行，窗口恢复再执行；**

**追问：setInterval与settitmeout差别**

1. setInterval仅当任务队列中没有该定时器的任务时才会将任务添加到队列中，这样会导致某些间隔被跳过
2. 多个setInterval定时器的代码执行间隔可能比预期的要小

## 【实习、1~3】 es6新特性、es7的async/await及其底层实现原理

**es6:** let/const、模板字符串、剪头函数、类、模块、迭代器、生成器、Promise、代理、反射、解构、展开收集操作符、Symbol、Set/Map

**转译generator**：

```js
function *foo() {
	const x = yield 42;
	console.log( x );
}
```

```js
function foo() {
	function nextState(v) {
		switch (state) {
			case 0:
				state++;
				return 42;
			case 1:
				state++;
				x = v;
				console.log( x );
				return undefined;

			// no need to handle state `2`
		}
	}

	var state = 0, x;
	return {
		next: function(v) {
			var ret = nextState( v );
			return { value: ret, done: (state == 2) };
		}
		// we'll skip `return(..)` and `throw(..)`
	};
}
```

**async、await语法糖**: 为了减少generator+Promise控制异步流时的冗余代码

```js
function async() {
  return Promise.resolve().then(() => 5);
}

function* main() {
  const r = yield async();
  console.log(r);
}

const it = main(); // 迭代器
const p = g.next().value;
p.then(r => g.next(r + 10));
```


## 【实习、1~3】数组去重

1. 要求保持原顺序
2. 不要求保持顺序； set/hashmap原理
3. 记录每个数字出现次数
4. 若数组本身已经是有序时去重优化

## 【实习、1~3】什么是闭包 (closure)、实现`Function.prototype.bind`？

作用： 显示绑定this、偏函数、延迟执行。

bind源码:

```js
if ( !Function.prototype.bind )
{
  Function.prototype.bind = function ( oThis ) {
    if ( typeof this !== 'function' )
    {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError( 'Function.prototype.bind -' +
        'what is trying to be bound is not callable' );
    }

    var aArgs = Array.prototype.slice.call( arguments, 1 ),
      fToBind = this,
      fNOP = function () { },
      fBound = function () {
        return fToBind.apply( this instanceof fNOP
          ? this
          : oThis,
          aArgs.concat( Array.prototype.slice.call( arguments ) ) );
      };

    if ( this.prototype )
    {
      // Function.prototype doesn't have a prototype property
      fNOP.prototype = this.prototype;
    }
    fBound.prototype = new fNOP();

    return fBound;
  };
}
``` 

## 【1~3】实现一个`Event`类，继承这个类的都有on、off、trigger、once方法[题目参考](http://marvel.bytedance.net/#/question/detail/?id=455&nocontri=true)

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

## 【1~3】什么是事件循环 (event loop)？
参考[博客](https://hellogithub2014.github.io/javascript-event-loop-summary/)


## 【1~3】文件上传、大文件上传


## 【1~3】DOM结构、getElementByClassName

    树形结构，采用递归

## 【1~3】模块化规范： commonjs、ES6 module

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

**3列布局中的知识均可以用到2列布局**

## 【实习】请罗列出你所知道的 display 属性的全部值

`none`、`inlie`、`inline-block`、`block`

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

relative定位的层总是相对于其最近的父元素，无论其父元素是何种定位方式

**absolute**

**定位为absolute的层脱离正常文本流，但与relative的区别是其在正常流中的位置不再存在。 **

**对于absolute定位的层总是相对于其最近的定义为absolute或relative的父层，而这个父层并不一定是其直接父层**

**fixed**

固定定位和绝对定位很类似，一个固定定位（position: fixed）元素会相对于视窗(viewport)来定位，这意味着即使页面滚动，它还是会停留在相同的位置。

**z-index**
z-index 属性设置元素的堆叠顺序。拥有更高堆叠顺序的元素总是会处于堆叠顺序较低的元素的前面。
**z-index，对relative/absolute/fixed有效，即使用static 定位或无position定位的元素z-index属性是无效的**。 默认值auto。同值后面高于前面。可正可负。

同样的，top 、 right 、 bottom 和 left也只有在定位是relative/absolute/fixed才有效。

## 【实习、1~3】请解释浏览器是如何判断元素是否匹配某个 CSS 选择器？

## 【实习、1~3】动画属性

1. name
2. duration
3. timing-function
4. delay
5. iteration-count
6. fill-mode: forwards停在终点、backwards在delay时提前到起点
7. direction: normal、reverse、alternate、alternate-reverse
8. play-state

## 【1~3】3列布局

两边定宽，然后中间的width是auto的，可以自适应内容。

1. 左右两栏使用float属性，中间栏使用margin属性进行撑开


	**缺点**是当宽度小于左右两边宽度之和时，右侧栏会被挤下去。

2. 使用position定位实现，即左右两栏使用position进行定位，中间栏使用margin进行定位

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

	**缺点**是老版本浏览器不兼容，如ie9

## 【1~3】居中

[参考文档](https://css-tricks.com/centering-css-complete-guide/)

### 水平居中

1. **行内元素inline/inline-`*`** - `text-align: center;`
2. **块级元素** - `margin:0 auto;`
3. **多个块级元素** - 对父元素设置 `text-align: center;`，对子元素设置 `display: inline-block;`

### 垂直居中

#### 行内元素 inline/inline-*
1. **单行**
	* 设置上下 padding 相等
	* 设置 line-height 和 height 相等
2. **多行**
	1. 设置 `display: table-cell;` 和 `vertical-align: middle;`
	2. 使用`flex`布局

#### 块级元素
1. **高度已知** - 父元素需使用相对布局,子元素使用绝对布局, `top: 50%;`，再用负的 `margin-top` 把子元素往上拉一半的高度.
2. **高度未知** - 父元素需使用相对布局,子元素使用绝对布局 `position: absolute; top: 50%; transform: translateY(-50%);`
3. **使用flex布局** - 选择方向，`justify-content: center;`


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

## 【1~3】请解释 ```* { box-sizing: border-box; }``` 的作用, 并且说明使用它有什么好处？

box-sizing 是 CSS3的box属性之一

```css
box-sizing: content-box|border-box|inherit;
```

* **content-box**: 此值为其默认值，其让元素维持W3C的标准Box Model。此时 width, min-width, max-width, height, min-height 与 max-height 控制内容大小。

* **border-box**: 此值让元素维持IE传统的Box Model（IE6以下版本），就是说，为元素指定的任何内边距和边框都将在已设定的宽度和高度内进行绘制，通过从已设定的宽度和高度分别减去边框和内边距才能得到内容的宽度和高度。

# 网络与安全

## 【实习、1~3】http缓存，相关header

**[浏览器缓存博客](https://hellogithub2014.github.io/browser-cache-summary/)**

缓存时间：`expires、cache-control: max-age/s-maxage/no-cache/no-store`
缓存协商：`last-modified、if-modified-since、if-unmodified-since`、`etag、if-match/if-none-match`

【追问】

1. etag与last-modified优化级？
2. 有last-modified为什么还要有etag？
	1. 前者精度有限，只能到秒
	2. 某些服务器拿不到精确时间
	3. 某些文件可能只改了时间而没有改内容，不希望重新请求
3. 有etag为什么要有last-modified？
	某些文件例如图片，如果每次都重新扫描生成etag，显示比直接修改时间慢很多。


## 【实习】tcp握手挥手； 为保持传输可靠性做了哪些事情

ACK+校验和+超时+重传+序列号


## 【实习、1~3】HTTPS

## 【实习、1~3】跨域及其解决方法

1. jsonp
2. document.domain，主域相同时
3. window.name： 其中A页面若想和跨域的B页面通信，可以在A下利用一个iframe先加载B，往window.name中设置数据，再利用此iframe转到与A同域的任一页面，此时A就能直接从iframe的window.name中拿数据了。
4. window.postMessage
5. 反向代理
6. CORS
	1. 简单请求： head/get/post，不支持自定义请求头
	2. 非简单请求： Options预请求携带origin/access-control-request-methods/access-control-request-headers；响应中携带access-control-allow-origin/access-control-allow-methods/access-control-allow-headers；之后会跟简单请求一样
7. 【加分】完全不想干的两个tab间通信： 嵌iframe+localstorage

**跨域问题解决方案**参见博客[前端跨域方法小结](https://hellogithub2014.github.io/front-end-cross-origin-summary/)

## 【实习、1~3】dns是哪一层的协议、 解析过程、在传输层使用了tcp还是udp

应用层协议

解析过程： 浏览器缓存、本地缓存、路由器缓存、ISP服务商缓存、层级查找

**底层使用tcp还是udp**： [参考](https://www.cnblogs.com/549294286/p/5172435.html)UDP报文的最大长度为512字节，而TCP则允许报文长度超过512字节。当DNS查询超过512字节时，使用TCP发送。通常传统的UDP报文一般不会大于512字节。 辅域名服务器会定时（一般时3小时）向主域名服务器进行查询以便了解数据是否有变动。如有变动，则会执行一次区域传送，进行数据同步。区域传送将使用TCP而不是UDP，因为数据同步传送的数据量比一个请求和应答的数据量要多得多。 

## 【1~3】从敲url到页面显示内容经过

**[参考博客](https://hellogithub2014.github.io/how-do-network-connect/)**

## 【1~3】为什么传统上利用多个域名来提供网站资源会更有效？

如果在以后使用了HTTP2，它具有多路复用的能力，就不用这么做了。

## 【1-3】HTTP2

[PPT](https://files.alicdn.com/tpsservice/0f6bc44e79b1aab8c849242dd6149522.pdf)

1. 2进制分帧，将header与body分别拆成不同的帧发送，使用二进制编码。 一个连接下有多个流，每个流里有多个帧
2. 多路复用，并解决了pipeline的队首阻塞问题（http层面上的队首阻塞，前一个http没有响应，后面的http连接也需要等待）。
3. 头部压缩，使用静态+动态的映射表

潜在问题：在丢包率较高时，由于tcp在丢包时会将拥塞窗口减小，导致这个唯一的连接上可以发送的数据变小，可以理解为传输层上的队首阻塞。

## 【1~3】xss、csrf

[博客](https://hellogithub2014.github.io/web-safe/)

## 【1~3】请解释 HTTP status 301 与 302 的区别？

**301 - 永久重定向**，**302 - 临时重定向**

**区别**

1. 302表示资源不是被永久移动，只是临时性的，已移动的资源对应的URL将来还有可能发生改变。
2. 301可以被缓存，浏览器第二次请求301的资源时不会发送http请求

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
6. **有storage事件**
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
* **先执行所有由 defer-script 加载的 JavaScript 代码，然后触发 DOMContentLoaded 事件**


