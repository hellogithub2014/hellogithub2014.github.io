---
title: "JavaScript闭包小结"
summary_img: /images/alaska.jpg # Add image post (optional)
date: 2017-11-04 22:00:00

tag: [CLOSURE,JAVASCRIPT]
---

# 闭包
一个函数定义在另一个函数内部，并将它暴露出来。内部函数将能够访问到外部函数作用域中的变量，即使外部函数已经执行完毕。

满足以下两个条件的函数才算闭包：

1. 即使创建它的上下文已经销毁，它仍然存在（比如，内部函数从父函数中返回）
2. 在代码中引用了它外部作用域的变量

# 变量对象、活动对象、执行环境和作用域链
这些东西我在看书时一直迷迷糊糊的，总是理解不好，直到看了一些公众号文章（参考【1】、【2】、【3】）才好了一些。这些文章讲的已经非常好了，我这里只是将一些我关注的东西贴过来。

## 变量对象(variable object，VO)

>原文：Every execution context has associated with it a variable object. Variables and functions declared in the source text are added as properties of the variable object. For function code, parameters are added as properties of the variable object.

简言之就是：**每一个执行上下文都会分配一个变量对象(variable object)，变量对象的属性由 变量(variable) 和 函数声明(function declaration) 构成。在函数上下文情况下，参数列表(parameter list)也会被加入到变量对象(variable object)中作为属性。变量对象与当前作用域息息相关。不同作用域的变量对象互不相同，它保存了当前作用域的所有函数和变量。**

### 关于Global Object
当js编译器开始执行的时候会初始化一个Global Object用于关联全局的作用域。对于全局环境而言，global object就是变量对象(variable object)。变量对象对于程序而言是不可读的，只有编译器才有权访问变量对象。在浏览器端，global object被具象成window对象，也就是说 global object === window === 全局环境的variable object。因此global object对于程序而言也是唯一可读的variable object。

## 活动对象(activation object，AO)
>原文：When control enters an execution context for function code, an object called the activation object is created and associated with the execution context. The activation object is initialised with a property with name arguments and attributes { DontDelete }. The initial value of this property is the arguments object described below.
The activation object is then used as the variable object for the purposes of variable instantiation.

简言之：**当函数被激活，那么一个活动对象(activation object)就会被创建并且分配给执行上下文。活动对象由特殊对象 arguments 初始化而成。随后，他被当做变量对象(variable object)用于变量初始化。**

用代码来说明就是：

```js
function a(name, age){
    var gender = "male";
    function b(){}
}
a(“k”,10);
```

a被调用时，在a的执行上下文会创建一个活动对象AO，并且被初始化为`AO = [arguments]`。随后AO又被当做变量对象VO进行变量初始化,此时 `VO=[arguments].concat([name,age,gender,b])。`

## 执行环境和作用域链(execution context and scope chain)

**执行环境/执行上下文（execution context**可以抽象的理解为一个object，它由以下几个属性构成：

```js
executionContext：{
    variable object：vars,functions,arguments,
    scope chain: variable object + all parents scopes
    thisValue: context object
}
```

此外在js解释器运行阶段还会维护一个环境栈，当执行流进入一个函数时，函数的环境就会被压入环境栈，当函数执行完后会将其环境弹出，并将控制权返回前一个执行环境。环境栈的顶端始终是当前正在执行的环境。

**作用域链**，它在解释器进入到一个执行环境时初始化完成并将其分配给当前执行环境。每个执行环境的作用域链由当前环境的变量对象及父级环境的作用域链构成。

作用域链的构建流程：

```js
function test(num){
    var a = "2";
    return a+num;
}
test(1);
```

1.	执行流开始 初始化function test，test函数会维护一个私有属性 [[scope]],并使用当前环境的作用域链初始化，在这里就是 test.[[Scope]]=global scope. 
2.	test函数执行，这时候会为test函数创建一个执行环境，然后通过复制函数的[[Scope]]属性构建起test函数的作用域链。此时 test.scopeChain = [test.[[Scope]]] 
3.	test函数的活动对象被初始化，随后活动对象被当做变量对象用于初始化。即 test.variableObject = test.activationObject.contact[num,a] = [arguments].contact[num,a] 
4.	test函数的变量对象被压入其作用域链，此时 test.scopeChain = [ test.variableObject, test.[[scope]]];

# 闭包应用

## 实现对象数据的私有

当使用闭包来实现数据私有时，被封装的变量只能在闭包容器函数作用域中使用,无法绕过对象被授权的方法在外部访问这些数据。

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

## 偏函数

>一个过程，它传给某个函数其中一部分参数，然后返回一个新的函数，该函数等待接受后续参数。换句话说，偏函数应用是一个函数，它接受另一个函数为参数，这个作为参数的函数本身接受多个参数，它返回一个函数，这个函数与它的参数函数相比，接受更少的参数。偏函数应用提前赋予一部分参数，而返回的函数则等待调用时传入剩余的参数。

我们通常会使用原生的`bind`方法来实现偏函数：
```js
function add(a,b,c){
	return a+b+c;
}

var patitialAdd = add.bind(null,1,2);
patitialAdd(3); //6
patitialAdd(0); //3
```

也可以自己实现一个简陋的bind：

```js
const partialApply = (fn, ...fixedArgs) => {
  return function (...remainingArgs) {
    return fn.apply(this, fixedArgs.concat(remainingArgs));
  };
};

var myPatitialAdd=partialApply(add,1,2);
myPatitialAdd(3); //6
myPatitialAdd(0); //3
```

## 定时器、事件处理函数

```js
function fn() {
    console.log('this is test.')
}
var timer =  setTimeout(fn, 1000);
console.log(timer);
```

执行上面的代码，变量timer的值，会立即输出出来，表示setTimeout这个函数本身已经执行完毕了。但是一秒钟之后，fn才会被执行。

# 参考
1. [一道 JS 面试题引发的思考](https://mp.weixin.qq.com/s/8OcJZADyB5w3EZwkxMdAmw)
2. [前端基础进阶（四）：详细图解作用域链与闭包](https://mp.weixin.qq.com/s/taddUMUOcPgAriW6xZWFcA)
3. [JavaScript 深入之变量对象](https://mp.weixin.qq.com/s?__biz=MzAxODE2MjM1MA==&mid=2651552190&idx=2&sn=a287b3557008fe72e4b6c1ed7135ce11&chksm=8025ae7fb7522769c897728fca97b3cc8be31e7b99ee4903457741627a23284c1a1d2017623c&scene=21#wechat_redirect)


