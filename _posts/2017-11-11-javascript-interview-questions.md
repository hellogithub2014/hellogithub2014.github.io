---
title: "javascript面试题"
img: canyon.jpg # Add image post (optional)
date: 2017-11-11 17:20:00 +0800
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [JAVASCRIPT,INTERVIEW]
---

# 题库

[Front-end-Developer-Interview-Questions](https://github.com/h5bp/Front-end-Developer-Interview-Questions)

# 请解释事件代理 (event delegation)
当我们需要对很多元素添加事件的时候，可以通过将事件添加到它们的父节点而将事件委托给父节点来触发处理函数。这主要得益于**浏览器的事件冒泡机制**。

假入有如下结构：

```html
<ul id="parent-list">
  <li id="post-1">Item 1</li>
  <li id="post-2">Item 2</li>
  <li id="post-3">Item 3</li>
  <li id="post-4">Item 4</li>
  <li id="post-5">Item 5</li>
  <li id="post-6">Item 6</li>
</ul>
```

如果要给每个li添加点击事件，那么很多人估计会这么写：

```js
var ulNode = document.getElementById("parent-list");
var liNodes = ulNode.getElementByTagName("li");

for(let i=0, len = liNodes.length; i < len; i++){
   liNodes[i].onclick= function(){
   	// code here
   }
}
```

这段代码会给每个li都单独添加一个点击事件，如果有很多个li，那么就有很多一模一样的事件处理函数，浪费了内存。

因为li上的事件会冒泡到父元素ul上，可以将事件处理函数放在ul上，这样只需一个事件处理函数：

```js
ulNode.onclick=function(e){
	if(e.target && e.target.nodeName.toUpperCase === "LI"){
		// code here
	}
}
```

# 请解释 JavaScript 中 `this` 是如何工作的。
this是由函数在运行时在何处被调用决定的，有4种情况：

1. 默认绑定

	```js
	var a=1;
	function test(){
		console.log(this.a);
	}

	test(); // 严格模式下报错，非严格模式下 输出1
	```

2. 作为对象方法调用时的**隐式绑定**

	```js
	var o={
		a: 2
	};

	function test(){
		console.log(this.a);
	}

	o.test=test;

	o.test(); // 2
	```

3. 显示绑定

	```js
	var o={
		a: 2
	};

	function test(){
		console.log(this.a);
	}

	test.bind(o)(); // 2
	```

4. 构造函数`new`调用, **优先级比bind高**

	```js
	function test(){
		this.a=3;
	}

	var t= new test();
	t.a; // 3
	```

	下列代码用来描述`new`和`bind`的优先级

	```js
	var o={
		a: 2
	};

	function test(){
		this.a=3;
	}

	var t= new (test.bind(o));
	t.a // 3
	o.a // 2
	```

# 请解释原型继承 (prototypal inheritance) 的原理。

```
function Person(name){
    this.name=name;
}

Person.prototype.sayName=function(){
    console.log(this.name);
}

function Student(name,grade){
    Person.call(this,name); // 借用构造函数
    this.grade=grade;
}

Student.prototype=Object.create(Person.prototype); // 原型继承
// Student.prototype.constructor=Student;

Object.defineProperty( Student.prototype, "constructor",{
    writable:true,
    enumerable:false,
    configurable:false,
    value:Student,
} );

Student.prototype.sayGrade=function(){
    console.log(this.grade);
}

var s=new Student("xiaoming",3);

s.sayGrade();
s.sayName();
```

# 你怎么看 AMD vs. CommonJS？
* 二者都是用于模块加载
* CommonJS是同步加载模块的，AMD是异步加载的
* CommonJS主要在服务器端使用，AMD主要在浏览器使用

[参考](https://www.cnblogs.com/chenguangliang/p/5856701.html)

# 请解释为什么接下来这段代码不是 IIFE (立即调用的函数表达式)：`function foo(){ }();`.
最后的`()`和前面的函数声明是完全不相干的东西，整段代码相当于：

```js
function foo(){ }
(); // 这里会报错，括号里不能为空
```

## 要做哪些改动使它变成 IIFE?

```js
(function foo(){ })();
```

因为括号内部不能包含语句，当解析器对代码进行解释的时候，先碰到了()，然后碰到function关键字就会自动将()里面的代码识别为函数表达式.


# 描述以下变量的区别：`null`，`undefined` 或 `undeclared`？
* js中有7中原生类型： `Null`、`Undefined`、`Boolean`、`String`、`Number`、`Object`、`Symbol`；
* `null`是唯一的`Null`类型值，`undefined`是唯一的`Undefined`类型值。
* `null`和`undefined`均可以表示“空”的值，不过`null`一般用来表示一个变量指向空的引用，而`undefined`表示这个变量还未初始化。
## 该如何检测它们？
1. 使用`typeof`

	```js
	var a;
	typeof a;// undefined

	var b=null;
	typeof b;// object
	```
2. 使用`Object.prototype.toString.call`

	```js
	var a;
	Object.prototype.toString.call(a);// "[object Undefined]"

	var b=null;
	Object.prototype.toString.call(b);// "[object Null]"
	```
# 什么是闭包 (closure)，如何使用它，为什么要使用它？
1. 闭包：定义在函数内部的函数，通过执行外部函数将内部函数保存在一个外部变量中，即使外部函数已经执行完毕，依然可以通过闭包访问外部函数中的变量
2. 如何使用闭包：闭包需要两个条件
	1. 即使创建它的上下文已经销毁，它仍然存在（比如，内部函数从父函数中返回）
	2. 在代码中引用了它外部作用域的变量
	3. 示范

		```js
		function outer(){
			var outerVar=1;
			return function(){
				console.log(outerVar);
			};
		}

		var func=outer();
		func(); // 1
		```
3. 为什么要使用闭包？ 可以从闭包的几个典型用法回答
	1. 创建js模块，封装内部私有变量
	2. 创建偏函数
	3. setTimeout、事件点击处理函数中

# 请举出一个匿名函数的典型用例？
匿名函数主要用于临时性需要一个函数，又不想费力去给它想一个名字。

1. setTimeout

	```js
	setTimeout(function(){
		console.log(1);
	},100)
	```
2. 事件点击处理函数

	```js
	var btn= document.getElementById('test');
	btn.onclick=function(){
		console.log(1);
	}
	```

# 你是如何组织自己的代码？是使用模块模式，还是使用经典继承的方法？
1. 模块模式：
	```js
	var module=(function(){
	    var privateVariable=1;
	    var publicVariable=2;

	    function privateMethod(){
	        console.log(privateVariable);
	    }

	    function publicMethod(){
	        console.log(publicVariable);
	    }

	    return {
	        publicVariable:publicVariable,
	        publicMethod:publicMethod,
	    };
	})();

	module.publicMethod(); // 2
	module.publicVariable; // 2

	module.privateVariable; // error
	module.privateMethod(); // error
	```
2. 继承看上面的寄生组合继承问题。

# 请指出 JavaScript 宿主对象 (host objects) 和原生对象 (native objects) 的区别？
1. 本地对象：那些官方定义好了的对象，包括

	```js
	Object、Function、Array、String、Boolean、Number、Date、RegExp、Error。。。。
	```
2. 内置对象： 本地对象的一种，其只包含Global对象和Math对象。
3. 宿主对象： 宿主指js的运行环境，即“操作系统”和“浏览器”。所有的BOM和DOM对象都是宿主对象。

# 请指出以下代码的区别：`function Person(){}`、`var person = Person()`、`var person = new Person()`？

1. `var person = Person()` 此时person为undefined
2. `var person = new Person()`,此时person为一个Person类型对象。

# `.call` 和 `.apply` 的区别是什么？
二者都是为了显示绑定`this`，区别只是函数传参的方式不同。

```js
function add(x,y,z){
	return x+y+z;
}

add.call(null,1,2,3);
add.apply(null,[1,2,3]);
```

# 请解释 `Function.prototype.bind`？
作用： 显示绑定this，偏函数、延迟执行。

延迟执行：

```js
var add = function() {
    var _this = this,
    _args = arguments
    return function cb() {
        if (!arguments.length) {
            var sum = 0;
            for (var i = 0,c; c = _args[i++];){
              sum += c
            }
            return sum
        } else {
            Array.prototype.push.apply(_args, arguments)
            return cb
        }
    }
}
add(1)(2)(3)(4)();//10
```

通用的写法：

```js
var curry = function(fn) {
    var _args = []
    return function cb() {
        if (arguments.length == 0) {
            return fn.apply(this, _args)
        }
        Array.prototype.push.apply(_args, arguments);
        return cb;
    }
}
```

**[参见博客](https://hellogithub2014.github.io/javascript-bind/)**

# 请指出浏览器特性检测，特性推断和浏览器 UA 字符串嗅探的区别？
**TODO看书回答**

# 请尽可能详尽的解释 Ajax 的工作原理。
## 工作原理
[参考文章：](https://www.cnblogs.com/SanMaoSpace/archive/2013/06/15/3137180.html)

Ajax相当于在用户和服务器之间加了—个中间层(AJAX引擎),使用户操作与服务器响应异步化。并不是所有的用户请求都提交给服务器,像—些数据验证和数据处理等都交给Ajax引擎自己来做, 只有确定需要从服务器读取新数据时再由Ajax引擎代为向服务器提交请求。

Ajax其核心有JavaScript、XMLHTTPRequest、DOM对象组成，通过XmlHttpRequest对象来向服务器发异步请求，从服务器获得数据，然后用JavaScript来操作DOM而更新页面。这其中最关键的一步就是从服务器获得请求数据。

Ajax的一个最大的特点是无需刷新页面便可向服务器传输或读写数据(又称无刷新更新页面),这一特点主要得益于XMLHTTPRequest对象。

**TODO XHR详细细节**

## 优缺点
### 优点
1. 不刷新页面的情况下更新数据
2. 异步请求。虽然也可以同步来请求数据（XHR对象open方法的参数），但基本不使用。

### 缺点
1. 破坏了浏览器历史记录，使用ajax更新页面时，url并没有刷新，用户无法点击返回回到之前的状态。 **但现在的SPA都是通过url hash来解决这个问题的**
2. 安全问题，请求数据暴露在外，但可以通过HTTPS来解决。

# 请解释 JSONP 的工作原理，以及它为什么不是真正的 Ajax。
## 原理
通过script标签来加载JavaScript可以任意跨域。 当想通过GET请求一个跨域后台接口时，直接通过ajax是行不通的。

可以将这个请求的url放在script标签的src属性上，同时提供一个callback回调函数名作为url查询参数。

后台接口接收到请求，先拿到callback函数名，获取到请求对应的数据后，通过字符串拼接操作，将函数名和数据拼成一段可执行的javascript脚本，然后返回给前端。

前端拿到这段脚本后，直接在script标签中执行，这样就达到了跨域的目的。

## 为什么不是真正的ajax
从原理中可以看出，并没有真正通过XHR发送请求，而是借助了script标签的能力自动发送一个请求。 另外，由于script标签的限制，JSONP只能处理GET请求的跨域。

# 你使用过 JavaScript 模板系统吗？如有使用过，请谈谈你都使用过哪些库？
在开发nodejs程序时，简单使用过jade；
![](http://segmentfault.com/img/bVcgWB)
另外，编写angular程序时，也一直在写模板，它使用Mustache风格的{{}}

# 请解释变量声明提升 (hoisting)。
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

# 请描述事件冒泡机制 (event bubbling)。

在浏览器（以chrome为例）中，当触发一个事件时，会有3个阶段： 事件捕获、事件处理、事件冒泡。

![](http://img.blog.csdn.net/20150128220404748?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvYWl0YW5neW9uZw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

以点击事件为例，当用户点中了一个元素，其实还有父元素和祖先元素包围着它，类似一个同心圆，最里面的那个元素才是我们用户真正想点击的元素。

**事件捕获阶段** - 事件从同心圆外面逐步传递到圆心的过程；
**事件处理阶段** - 在事件到达圆心后执行设置的回调函数；
**事件冒泡阶段** - 事件从圆心在逐步传递到外部的过程；

**应用**：

1. 如果在事件捕获阶段阻止事件传播，那么就不会执行在事件目标上设置的回调函数
2. 如果在事件处理阶段阻止了冒泡，那么之后的事件冒泡就不会执行
3. 利用事件冒泡我们可以使用事件委托技术来减少内存消耗，**见事件代理那一题**

# "attribute" 和 "property" 的区别是什么？

[参考Angular官网](https://angular.cn/guide/template-syntax#html-attribute-与-dom-property-的对比)

**attribute 是由 HTML 定义的。property 是由 DOM (Document Object Model) 定义的。**

* 少量 HTML attribute 和 property 之间有着 1:1 的映射，如id。
* 有些 HTML attribute 没有对应的 property，如colspan。
* 有些 DOM property 没有对应的 attribute，如textContent。
* 大量 HTML attribute看起来映射到了property…… 但却不像我们想的那样！ 
最后一类尤其让人困惑…… 除非我们能理解这个普遍原则：

**attribute 初始化 DOM property，然后它们的任务就完成了。property 的值可以改变；attribute 的值不能改变。**

例如，当浏览器渲染<input type="text" value="Bob">时，它将创建相应 DOM 节点， 其valueproperty 被初始化为 “Bob”。

当用户在输入框中输入 “Sally” 时，DOM 元素的value property 变成了 “Sally”。 但是这个 HTML value attribute 保持不变。如果我们读取 input 元素的 attribute，就会发现确实没变：input.getAttribute('value') // 返回 "Bob"。

HTML attribute value指定了初始值；DOM value property 是当前值。

disabled attribute 是另一个古怪的例子。按钮的disabled property 是false，因为默认情况下按钮是可用的。 当我们添加disabled attribute 时，只要它出现了按钮的disabled property 就初始化为true，于是按钮就被禁用了。

添加或删除disabled attribute会禁用或启用这个按钮。但 attribute 的值无关紧要，这就是我们为什么没法通过 <button disabled="false">仍被禁用</button>这种写法来启用按钮。

设置按钮的disabled property（如，通过 Angular 绑定）可以禁用或启用这个按钮。 这就是 property 的价值。

**就算名字相同，HTML attribute 和 DOM property 也不是同一样东西。**

# 为什么扩展 JavaScript 内置对象不是好的做法？

如果在某个窗口内扩展了内置对象，会影响到此窗口内所有其他代码。由于JavaScript是通过原型继承的，在任何时候修改了原型上的方法，所有原型链下方的对象都会实时响应。


```js
[1].concat([2]); // [1,2]

Array.prototype.concat=function(arr){
    return [1,2,3];
}

[1].concat([2]) // [1,2,3]
```

# 请指出 document load 和 document DOMContentLoaded 两个事件的区别。
**TODO查资料**

# `==` 和 `===` 有什么不同？

`==`在两边操作数的类型不同时会执行类型转换。

```js
1 == “1” // true
```

`===`执行严格的相等检查，即同时检查类型和真正的值。

```js
1 === “1” // false
```

# 请解释 JavaScript 的同源策略 (same-origin policy)。

同源策略是施加于在浏览器中运行的JavaScript的，目的是为了保护网站的安全性，不让恶意的网站随意获取数据。当在一个域中的脚本想要与另外一个域通信时，就会受到同源策略的检查。

具体来说，目标域和当前域只要 **域名**、**端口**、**协议**任意一个不同，他们就不在同一个源上，此时就会产生跨域，浏览器会在控制台报错。注意：

* 如果是协议和端口造成的跨域问题“前台”是无能为力的，
* 在跨域问题上，域仅仅是通过“URL的首部”来识别而不会去尝试判断相同的ip地址对应着两个域或两个域是否在同一个ip上。

**跨域问题解决方案**参见博客[前端跨域方法小结](https://hellogithub2014.github.io/front-end-cross-origin-summary/)

# 如何实现下列代码：
```javascript
[1,2,3,4,5].duplicator(); // [1,2,3,4,5,1,2,3,4,5]
```

```js
Array.prototype.duplicator = function() {
    // return [...this, ...this];
    return this.concat(this);
}
```

# 什么是 `"use strict";` ? 使用它的好处和坏处分别是什么？

`"use strict";`使得Javascript在更严格的条件下运行，目的有：

* 消除Javascript语法的一些不合理、不严谨之处，减少一些怪异行为;
* 消除代码运行的一些不安全之处，保证代码运行的安全；
* 提高编译器效率，增加运行速度；
* 为未来新版本的Javascript做好铺垫。

严格模式有两种模式：

1. 将"use strict"放在脚本文件的第一行，则整个脚本都将以"严格模式"运行，如果这行语句不在第一行，则无效。

	```html
	<script>
　　　　"use strict";
　　　　console.log("这是严格模式。");
　　</script>
	```
2. 将"use strict"放在函数体的第一行，则整个函数以"严格模式"运行。

	```js
	function strict(){
　　　　"use strict";
　　　　return "这是严格模式。";
　　}
	```

**坏处**：一些在正常模式下运行的代码在严格模式下可能会失败，例如`with`语句.

```js
"use strict";
var v = 1;
with (o){ // 语法错误  	v = 2; }
```

# 请实现一个遍历至 `100` 的 for loop 循环，在能被 `3` 整除时输出 **"fizz"**，在能被 `5` 整除时输出 **"buzz"**，在能同时被 `3` 和 `5` 整除时输出 **"fizzbuzz"**。

```js
for (var i = 1; i <= 100; i++) {
    if (i % 3 === 0 && i % 5 === 0) {
        console.log(`i=${i} ---> fizzbuzz`)
    } else if (i % 3 === 0) {
        console.log(`i=${i} ---> fizz`)
    } else if (i % 5 === 0) {
        console.log(`i=${i} ---> buzz`)
    }
}
```

# 请解释什么是单页应用 (single page app), 以及如何使其对搜索引擎友好 (SEO-friendly)。

单页应用在整个web app运行期间都不会刷新url，前端管理路由，页面的切换使用url hash和history api，页面数据更新使用ajax，缺点是SEO。

SEO方案：服务端渲染

# 你使用过 Promises 及其 polyfills 吗? 请写出 Promise 的基本用法（ES6）。

```js
const p1 = new Promise((resolve, reject) => {
    resolve(1);
});

const p2 = new Promise((resolve, reject) => {
    reject(new Error(2));
});

p1.then(console.log); // 1
p2.catch(console.error); // 错误堆栈,Error: 2

const p3 = Promise.resolve(3);
const p4 = Promise.reject(4);
p3.then(console.log); //3
p4.catch(console.error); // 4

Promise.all([p1, p3]).then(console.log); // [1,3]
Promise.race([p1, p3]).then(console.log); // 1
```

# 使用 Promises 而非回调 (callbacks) 优缺点是什么？
# 使用一种可以编译成 JavaScript 的语言来写 JavaScript 代码有哪些优缺点？
# 你使用哪些工具和技术来调试 JavaScript 代码？
# 你会使用怎样的语言结构来遍历对象属性 (object properties) 和数组内容？
# 请解释可变 (mutable) 和不变 (immutable) 对象的区别。
## 举出 JavaScript 中一个不变性对象 (immutable object) 的例子？
## 不变性 (immutability) 有哪些优缺点？
## 如何用你自己的代码来实现不变性 (immutability)？


