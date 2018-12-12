---
title: "javascript面试题"
img: canyon.jpg # Add image post (optional)
# date: 2017-11-11 17:20:00 +0800
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [JAVASCRIPT,INTERVIEW]
---

# 题库

[Front-end-Developer-Interview-Questions](https://github.com/h5bp/Front-end-Developer-Interview-Questions)

# 请解释事件代理 (event delegation)
当我们需要对很多元素添加事件的时候，可以通过将事件添加到它们的父节点而将事件委托给父节点来触发处理函数。这主要得益于**浏览器的事件冒泡机制.事件有3个阶段：事件捕获、事件处理、事件冒泡。**。

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
¡
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

**构造函数内部的几个细节**

1. 新创建一个对象
2. 新建对象的原型指向函数的原型
3. 函数执行时的this指向新建对象
4. 如果构造函数最后没有显示的return其他对象，那么构造函数最后默认返回这个新建对象。

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

**特性检测**

目标不是识别特定的浏览器，而是识别浏览器的能力。采用这种方式不必顾及特定的浏览器如何如何，只要确定浏览器支持特定的能力，就可以给出解决方案

```js
if(object.propertyInQuestion){
	// 使用object.propertyInQuestion
}
```

**怪癖检测**

目标是识别浏览器的特殊行为，但与能力检测确认浏览器支持什么能力不同，怪癖检测是想要知道浏览器存在什么缺陷。通常需要运行一小段代码，以确定某一特性不能正常工作。

例如IE8及更早版本中存在一个bug，即如果某个实例属性与[[Enumerable]]标记为false的某个原型属性同名，那么该实例属性将不会出现在for-in循环中，可以使用如下代码：

```js
var hasDontEnumQuirk=function(){
	var o={toString:function(){}};
	for(var prop in o){
		if(prop == "toString"){
			return false;
		}
	}
	return true;
}
```

**用户代理检测**

通过检测用户代理字符串来确定实际使用过的浏览器。`userAgent`请求头有关。

# 请尽可能详尽的解释 Ajax 的工作原理。
## 工作原理
[参考文章：](https://www.cnblogs.com/SanMaoSpace/archive/2013/06/15/3137180.html)

Ajax相当于在用户和服务器之间加了—个中间层(AJAX引擎),使用户操作与服务器响应异步化。并不是所有的用户请求都提交给服务器,像—些数据验证和数据处理等都交给Ajax引擎自己来做, 只有确定需要从服务器读取新数据时再由Ajax引擎代为向服务器提交请求。

Ajax其核心有JavaScript、XMLHTTPRequest、DOM对象组成，通过XmlHttpRequest对象来向服务器发异步请求，从服务器获得数据，然后用JavaScript来操作DOM而更新页面。这其中最关键的一步就是从服务器获得请求数据。

Ajax的一个最大的特点是无需刷新页面便可向服务器传输或读写数据(又称无刷新更新页面),这一特点主要得益于XMLHTTPRequest对象。

## 优缺点
### 优点
1. 不刷新页面的情况下更新数据
2. 异步请求。虽然也可以同步来请求数据（XHR对象open方法的参数），但基本不使用。

### 缺点
1. 破坏了浏览器历史记录，使用ajax更新页面时，url并没有刷新，用户无法点击返回回到之前的状态。 **但现在的SPA都是通过url hash来解决这个问题的**
2. 安全问题，请求数据暴露在外，但可以通过HTTPS来解决。


## XHR

### 创建XHR

在现代浏览器中，直接使用

```
var xhr=new XMLHttpRequest()
```

### api

1. **open**

	使用XHR第一个要调用的方法就是`open`

	```js
	open(method:string,url:string,async:boolean)
	```

	例如：

	```
	xhr.open("get","www.test.com/test.do",false);
	```
2. send - 发送响应，可以在其中传入请求体数据。**如果不需要数据，则必须传入null**

2. 响应属性 - 收到响应后，xhr对象中就有几个相关的属性
	1. responseText - 作为响应主体返回的文本字符串
	2. responseXML - 没用过
	3. status - HTTP 响应码，如200
	4. statusText - HTTP响应码描述，如OK

3. readyState - 在异步请求中，可以检测xhr对象的readyState属性，表示请求过程的当前活动阶段。他有几个特殊值，我们一般关心的是**4，即完成请求，以收到全部响应数据，而且可以在客户端使用了**。

4.  onreadystatechane - 每次readyState变化时，都会触发此事件。 **必须在open之前指定此事件的处理函数才能保证浏览器兼容性**。 例如：

	```js
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
	   if (xhr.readyState === 4) {
	       if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
	           bodyTemplate = JSON.parse(xhr.responseText);
	       } else {
	           alert('获取mock数据模板失败, 模板路径: ' + templateUrl);
	       }
	   }
	};
	xhr.open('get',url, false);
	xhr.setRequestHeader("MyHeader","123");
	xhr.send();
	```

5. setRequestHeader - 设置请求头，**必须在调用open方法之后且调用send方法之前设置请求头**
6. getRequestHeader - 获取响应头信息
7. getAllRequestHeader - 获取到所有响应头信息的长字符串
8. abort - 终止请求

## XHR 2级

### FormData
为序列化表单以及创建与表单格式相同的数据提供了便利。例如上传文件：

```js
function testFormData(file) {
   let _this = this;
   let formData = new FormData();
   formData.append('file', file);
   $.ajax({
       type: 'POST',
       url: _this.options.url,
       cache: false,
       data: formData,
       dataType: 'json',
       processData: false,
       contentType: false,
       success: function(response) {
           handleUploadResponse.call(_this, response, file.name);
       },
       error: function(XMLHttpRequest, textStatus, errorThrown) {
           if (errorThrown) {
               console.error(errorThrown);
           }
       },
   });
}
```

**在使用表单提交数据时，请求头的`content-type`是`multipart/form-data`，同时会有一个`boundary`属性用于标识请求体的分隔符**

### 超时设定
可以给XHR设置timeout属性，如果在规定时间内还没有收到响应，就会触发timeout事件。

```js
xhr.timeout=1000;
xhr.ontimeout=function(){
	// code here
}
```

### overrideMimeType

用于重写响应的MIME类型。

```js
xhr.overrideMimeType('text/xml'); // 强迫将响应当做xml来处理，而不是纯文本
```

## 进度事件

* loadstart - 接收到响应的第一个字节时触发
* **progress** - 在接收到响应期间不断触发，事件对象中包含： lengthComputed进度信息是否可用、position: 已经接受的字节数、totalSize：总字节数。 **必须在open方法之前添加此事件处理函数。**
* error - 请求出错时触发
* abort - 因为调用`abort`而终止链接时触发
* load - 在接受到完整的响应数据时触发
* loadend - 通信完成或者触发error、abort、load事件后触发

# 请解释 JSONP 的工作原理，以及它为什么不是真正的 Ajax。
## 原理
通过script标签来加载JavaScript可以任意跨域。 当想通过GET请求一个跨域后台接口时，直接通过ajax是行不通的。

可以将这个请求的url放在script标签的src属性上，同时提供一个callback回调函数名作为url查询参数。

后台接口接收到请求，先拿到callback函数名，获取到请求对应的数据后，通过字符串拼接操作，将函数名和数据拼成一段可执行的javascript脚本，然后返回给前端。

前端拿到这段脚本后，直接在script标签中执行，这样就达到了跨域的目的.

## 为什么不是真正的ajax
从原理中可以看出，并没有真正通过XHR发送请求，而是借助了script标签的能力自动发送一个请求。 另外，由于script标签的限制，JSONP只能处理GET请求的跨域。

# 你使用过 JavaScript 模板系统吗？如有使用过，请谈谈你都使用过哪些库？
在开发nodejs程序时，简单使用过jade；
![](http://segmentfault.com/img/bVcgWB)
另外，编写angular程序时，也一直在写模板，它使用Mustache风格的`{ { } }`

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

例如，当浏览器渲染`<input type="text" value="Bob">`时，它将创建相应 DOM 节点， 其valueproperty 被初始化为 “Bob”。

当用户在输入框中输入 “Sally” 时，DOM 元素的value property 变成了 “Sally”。 但是这个 HTML value attribute 保持不变。如果我们读取 input 元素的 attribute，就会发现确实没变：input.getAttribute('value') // 返回 "Bob"。

HTML attribute value指定了初始值；DOM value property 是当前值。

disabled attribute 是另一个古怪的例子。按钮的disabled property 是false，因为默认情况下按钮是可用的。 当我们添加disabled attribute 时，只要它出现了按钮的disabled property 就初始化为true，于是按钮就被禁用了。

添加或删除disabled attribute会禁用或启用这个按钮。但 attribute 的值无关紧要，这就是我们为什么没法通过 `<button disabled="false">仍被禁用</button>`这种写法来启用按钮。

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

**SEO优化细节[参考](https://mp.weixin.qq.com/s?__biz=MjM5MTA1MjAxMQ==&mid=205585890&idx=1&sn=4bfe730ee605915c5192dfe9fac7ceee&scene=38#wechat_redirect)**

1. 标题title，包含关键字
2. 关键词布局 - 合理的使用h1–6标签 及 strong、b、em等标签
3. 网站结构布局 - 搜索引擎蜘蛛爬行的抓取页面的顺序是从上到下，从左到右。最先出现的链接和关键字 权重也越大。
4. URL层级 - 链接目录层级越浅，权重越大。
5. URL唯一性 - 在搜索引擎里， 只有链接完全一样，才会认为是同一个链接，如果链接带上参数，虽然访问到的内容还是一样，但是在搜索引擎看来确是不同的链接，页面抓取也会出现多次，从而导致多个链接，内容一样。
6. 站内锚文本 - `<a href=”http://www.test.com” >锚文本</a>`.如果一个网站页面的站内链接锚文本足够精确，那这个网站页面在搜索引擎里面的排序就有非常大的机会排前。
7. 链接权重传递 - 对于不需要排名的链接，统一加上`nofollow`属性。

**SEO优化的基础思路：四处一词:**

1. 当前页面的title上出现这个关键词
2. 当前页面keywords、description标签出现这个关键词
3. 当前页面的内容里，多次出现这个关键词，并在第一次出现时，加粗
4. 其他页面的锚文本里，出现这个关键词


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
Promise可以解决回调地狱问题，转而使用链式操作。

# 你会使用怎样的语言结构来遍历对象属性 (object properties) 和数组内容？

遍历对象:

```js
// 使用for-in
for(let key in o){
	if(o.hasOwnProperty(key)){
		// code here
	}
}

// 使用Object.keys
for(let key of Object.keys(o)){
	console.log(o[key]);
}
```

遍历数组：

```js
for(let item of arr){
	console.log(item);
}
```

# 请解释可变 (mutable) 和不变 (immutable) 对象的区别。
可变对象： 可以直接修改对象的属性值
不变对象：不能修改对象的属性值，或者每次尝试修改都会得到一个新对象。

## 举出 JavaScript 中一个不变性对象 (immutable object) 的例子？
字符串

## 不变性 (immutability) 有哪些优缺点？

1. 减少了潜在的BUG，开发者可以相信此变量不会意外的被修改，变量是只读的，或者得到一个新的复本
2. 提升了变更检测效率，在例如angular这样的框架中，变更检测如果只用检查对象引用是否相等就能确定是否重新渲染，那么效率就会大大提升。不可变对象就可以帮助我们做到这一点。

参考stackoverflow的[讨论](https://stackoverflow.com/questions/34385243/why-is-immutability-so-importantor-needed-in-javascript)

## 如何用你自己的代码来实现不变性 (immutability)？

1. [利用Object.freeze](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze)

```js
// To do so, we use this function.
function deepFreeze(obj) {

  // Retrieve the property names defined on obj
  var propNames = Object.getOwnPropertyNames(obj);

  // Freeze properties before freezing self
  propNames.forEach(function(name) {
    var prop = obj[name];

    // Freeze prop if it is an object
    if (typeof prop == 'object' && prop !== null)
      deepFreeze(prop);
  });

  // Freeze self (no-op if already frozen)
  return Object.freeze(obj);
}

obj2 = {
  internal: {}
};

deepFreeze(obj2);
obj2.internal.a = 'anotherValue';
obj2.internal.a; // undefined
```

2. [Immutable.js](https://github.com/facebook/immutable-js/)

# 什么是事件循环 (event loop)？
参考[博客](https://hellogithub2014.github.io/javascript-event-loop-summary/)

## 请问调用栈 (call stack) 和任务队列 (task queue) 的区别是什么？
1. 每次事件循坏，JavaScript线程会从任务队列中取出任务放到调用栈中执行。
2. 调用栈是一个堆栈结构，先进后出；任务队列是一个队列，先进先出


## 描述浏览器重绘和回流，哪些方法能够改善由于dom操作产生的回流

**重绘Repaint**

当页面元素样式的改变不影响元素在文档流中的位置时（例如`background-color`, `border-color`,`visibility`）,浏览器只会将新样式赋予元素并进行重绘操作。

**回流/重排Reflow**

当页面上的改变影响了文档内容、结构或者元素定位时，就会发生重排（或称“重新布局”）。重排通常由以下改变触发：

* DOM 操作（如元素增、删、改或者改变元素顺序）。
* 内容的改变，包括 Form 表单中文字的变化。
* 计算或改变 CSS 属性。
* 增加或删除一个样式表。
* 改变”class”属性。
* 浏览器窗口的操作（改变大小、滚动窗口）。
* 激活伪类（如:hover状态）。

**优化建议**

* 要改变元素的样式，修改“class”属性是最高效的方式之一
* 将dom元素克隆，操作克隆元素，然后再一次性替换掉
* “离线”操作，操作`documentFragment`，然后将其中的内容放置到DOM中
* 循环体外部缓存DOM查询结果
* 先将DOM节点隐藏，然后操作，最后显示DOM节点

## 算法

[常见算法面试题](https://mp.weixin.qq.com/s/lracv6RudV1DHY7cYXRG-w)


## 实现页面进度条

阅读[公众号文章](https://mp.weixin.qq.com/s/1sNFQz1-R4ZLyv5wAuz4Ag)

## jQuery extend函数源码

此题应当考察的是深拷贝、浅拷贝的知识。

**深拷贝**

1. 利用JSON

	```js
	var copy = JSON.parse(JSON.stringify(target));
	```

	它的缺点是依赖JSON的解析，如果某个属性值不能被JSON解析（如函数），那么这个属性值不会被拷贝过去。

2. 查看jQuery.extend源码[公众号文章](https://mp.weixin.qq.com/s/S2T52-yyK3isO0zVABli0g)

	```js
	jQuery.extend = jQuery.fn.extend = function() {
    	var options, name, src, copy, copyIsArray, clone,
       		 target = arguments[ 0 ] || {},
       		 i = 1,
        	length = arguments.length,
        	deep = false;
	    // Handle a deep copy situation
	    if ( typeof target === "boolean" ) {
	        deep = target;
	        // Skip the boolean and the target
	        target = arguments[ i ] || {};
	        i++;
	    }
	    // Handle case when target is a string or something (possible in deep copy)
	    if ( typeof target !== "object" && !jQuery.isFunction( target ) ) {
	        target = {};
	    }
	    // Extend jQuery itself if only one argument is passed
	    if ( i === length ) {
	        target = this;
	        i--;
	    }
	    for ( ; i < length; i++ ) {
	        // Only deal with non-null/undefined values
	        if ( ( options = arguments[ i ] ) != null ) {
	            // Extend the base object
	            for ( name in options ) {
	                src = target[ name ];
	                copy = options[ name ];
	                // Prevent never-ending loop
	                if ( target === copy ) {
	                    continue;
	                }
	                // Recurse if we're merging plain objects or arrays
	                if ( deep && copy && ( jQuery.isPlainObject( copy ) || ( copyIsArray = Array.isArray( copy ) ) ) ) 				{
	                    if ( copyIsArray ) {
	                        copyIsArray = false;
	                        clone = src && Array.isArray( src ) ? src : [];
	                    } else {
	                        clone = src && jQuery.isPlainObject( src ) ? src : {};
	                    }
	                    // Never move original objects, clone them
	                    target[ name ] = jQuery.extend( deep, clone, copy );
	                // Don't bring in undefined values
	                } else if ( copy !== undefined ) {
	                    target[ name ] = copy;
	                }
	            }
	        }
	    }
	    // Return the modified object
	    return target;
	};
	```

**浅拷贝**

实际jQuery.extend就能实现浅拷贝了。这里给一个简单版的：

```js
function assign(target, ...origins) {
    target = target || {};
    for (let origin of origins) {
        for (let key in origin) {
            if (origin.hasOwnProperty(key) && !target.hasOwnProperty(key)) {
                target[key] = origin[key];
            }
        }
    }
    return target;
}

var a = { a: 1, b: 2, c: { x: 1 } };

var b = { a: 1, b: 2, c: { x: 2 }, d: 4 };

console.log(assign(a, b)); // { a: 1, b: 2, c: { x: 1 }, d: 4 }
```

## 实现拖拽功能，比如把5个兄弟节点中的最后一个节点拖拽到节点1和节点2之间

具体API细节可以参考红宝书**16.2**节

html：

```html
 <ul id="test">
   <li draggable="true">1</li>
   <li draggable="true">2</li>
   <li draggable="true">3</li>
   <li draggable="true">4</li>
   <li draggable="true">5</li>
</ul>
```

css

```css
li {
    border: 1px solid red;
    margin: 10px;
}

ul {
    list-style: none;
}
```

js

```js
$(document).ready(function() {
    var ul = document.getElementById('test');
	  // 开始拖动元素时
    ul.ondragstart = function(e) {
        if (e.target.nodeName !== "LI") {
            return;
        }
        e.dataTransfer.effectAllowed = "move"; // 改变光标样式
        // 存储拖拽源的列表索引
        e.dataTransfer.setData("text", $("#test li").index(e.target));
   };

	 // 为了把`li`变为有效的放置目标，需要重写dragenter和dragover事件的默认行为

	 // 被拖动元素进入放置目标上时
    ul.ondragenter = function(e) {
        if (e.target.nodeName !== "LI") {
            return;
        }
        e.preventDefault();
        e.dataTransfer.effectAllowed = "move";
    };
	 // 被拖动元素在放置目标上移动时
    ul.ondragover = function(e) {
        if (e.target.nodeName !== "LI") {
            return;
        }
        e.preventDefault();
    };
	 // 被拖动元素放到了放置目标上时
    ul.ondrop = function(e) {
        if (e.target.nodeName !== "LI") {
            return;
        }
        e.preventDefault();

		  // 获取拖拽源的索引
        var sourceIndex = parseInt(e.dataTransfer.getData("text"));
        $(e.target).before($("#test li").get(sourceIndex)); // 将源插入目标前面
        e.dataTransfer.clearData();
    };
});

```


## 实现parseInt

```js
function myParseInt(str) {
    if (!str) { // 空值
        return NaN;
    }

    if (Object.prototype.toString.call(str) !== '[object String]') { // 非字符串
        return str;
    }

    if (str.trim() === "") { // 空串
        return NaN;
    }

    str = str.trim(); // 去除多余空格

    let isMinus = false; // 是否负数
    if (str[0] === "-") {
        isMinus = true;
        str = str.slice(1);
    }

    // 如果以非数字开头，返回NaN；
    const firstCharCode = str[0].charCodeAt();
    if (firstCharCode <= '0'.charCodeAt() || firstCharCode >= '9'.charCodeAt()) {
        return NaN;
    }

    var temp = doParse(str);
    return isMinus ? -1 * temp : temp;

}

function doParse(str) {
    var result = 0;
    const charCode0 = '0'.charCodeAt();
    const charCode9 = '9'.charCodeAt();

    for (let i = 0; i < str.length; i++) {
        const curCharCode = str[i].charCodeAt();
        if (curCharCode >= charCode0 && curCharCode <= charCode9) {
            result = result * 10 + curCharCode - charCode0; // 默认10进制
        } else { // 如果中间出现了非数字，则截断
            break;
        }
    }
    return result;
}

console.log(myParseInt("")); // NaN
console.log(parseInt("")); // NaN
console.log(myParseInt("123a")); // 123
console.log(parseInt("123a")); // 123
console.log(myParseInt("-123a")); // -123
console.log(parseInt("-123a")); // -123
console.log(myParseInt("a123")); // NaN
console.log(parseInt("a123")); // NaN

```


## promise的实现原理，进一步会问async、await是否使用过
**promise原理**

没有看明白，附上[参考](https://segmentfault.com/a/1190000009478377)

**async、await**

```js
async function testAsync() {
    return new Promise((resolve, reject) =>
        setTimeout(resolve(100), 2000)
    );
}

(async function() {
    const res = await testAsync();
    console.log(res);
})();
```

**async/await 与promise/generator对比**

使用promise+generator：

```js
function foo(x,y) {
	return request( "http://some.url.1/?x=" + x + "&y=" + y );  // 一个promise
}

function *main() {
	try {
		var text = yield foo( 11, 31 );
		console.log( text );
	}
	catch (err) {
		console.error( err );
	}
}

var it = main();
var p = it.next().value;
// wait for the `p` promise to resolve
p.then(
	function(text){
		it.next( text );
	},
	function(err){
		it.throw( err );
	}
);
```

使用async+await

```js
function foo(x,y) {
	return request( "http://some.url.1/?x=" + x + "&y=" + y );  // 一个promise
}

async function main(){
	try {
		var text = await foo( 11, 31 );
		console.log( text );
	}
	catch (err) {
		console.error( err );
	}
}

main();
```

## vue双向数据绑定的实现

**[公众号文章](https://mp.weixin.qq.com/s?__biz=MjM5MTA1MjAxMQ==&mid=2651226470&idx=2&sn=001eb263b242cb43c47a1889d69c6de2&chksm=bd4958e28a3ed1f45698d903a6ff9bc8c4867f2c94a2070c2fb32c5db09002c116171bacce03&scene=38#wechat_redirect)**

## 图片预览

```html
<input type="file" name="file" onchange="showPreview(this)" />
<img id="portrait" src="" width="70" height="75">
```

```js
function showPreview(source) {
  var file = source.files[0];
  if(window.FileReader) {
      var fr = new FileReader();
      fr.onloadend = function(e) {
        document.getElementById("portrait").src = e.target.result;
      };
      fr.readAsDataURL(file);
  }
}
```

[FileReader](https://developer.mozilla.org/en-US/docs/Web/API/FileReader)


## 图片懒加载

[参考1](http://www.jianshu.com/p/4f6ea540516a)
[参考2](https://www.cnblogs.com/flyromance/p/5042187.html)

**原理**： 页面中的img元素，如果没有src属性，浏览器就不会发出请求去下载图片，一旦通过javascript设置了图片路径src，浏览器才会送请求。

生产环境推荐使用**[jquery-lazyload](https://github.com/tuupola/jquery_lazyload)**

**步骤**

1. 每个img初始时不设置src，而是将值存在一个自定义属性如data-url中

	```html
	<img data-url="www.test.com/1.png">
	```

2. 在滚动事件中，判断图片是否出现在了视口中，如果出现了则将img的src设置为data-url存储的值。
	1. 判断元素是否出现在视口中，可以使用元素的文档坐标，与视口的高度+滚动条高度作对比

		```js
		// 获取元素距离文档顶部的距离，即文档坐标的“高”
		function getTop(obj){
		    var h = 0;
		    while(obj){
		        h += obj.offsetTop; // offsetTop距离父元素顶部的距离
		        obj = obj.offsetParent;
		    }
		    return h;
		}

		// 视口区高度+滚动条高度
		var t = document.documentElement.clientHeight
			 + (document.body.scrollTop || document.documentElement.scrollTop);
		```

	2. 滚动事件处理

		```js
		var imgs = document.getElementsByTagName('img');
		window.onscroll = function(){
		    for(var i=0;i<imgs.length;i++){
		        if(getTop(imgs[i]) < t){
		        		imgs[i].src = imgs[i].getAttribute('data-url');
		        }
		    }
		}
		```

## 图片预加载

[参考1](https://segmentfault.com/a/1190000000684923)
[参考2](http://www.topcss.org/image-preloading/)

### 单张图片预加载

```js
function preloadImg(url) {
    var img = new Image();
    img.src = url;
	/**
	 * complete代表浏览器本地是否已缓存了此张图片
	 */
    if(img.complete) {
        //接下来可以使用图片了
        //do something here
    } else {
        img.onload = function() {
            //接下来可以使用图片了
            //do something here
        };
    }
}
```

### 多张图片

1. **并行加载** - 适用于不需要控制图片预加载顺序的情形

```js
function preloadImagesAsync(imgUrls){
	for (var i = 0; i < imgUrls.length; ++i) {
		var img = new Image();
		img.src = imgUrls[i];
	}
}
```

2. **顺序加载** - 适用于可以预知哪些图片应当较先预加载的情形

```js
function preloadImagesSync(imgUrls,index){
	index = index || 0;
    if (imgUrls && imgUrls.length > index) {
        var img = new Image();
		// 加载完当前图片再加载下一张图片
        img.onload = function() {
            preload(imgUrls, index + 1);
        }
        img.src = imgUrls[index];
    }
}
```

