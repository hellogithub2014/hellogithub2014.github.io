---
title: 'javascript中的instanceof操作符'
summary_img: /images/indonesia.jpg # Add image post (optional)
date: 2018-01-21 21:25:00

tag: [JAVASCRIPT]
---

`JavaScript`中的`instanceof`操作符是用来检测某个变量是否为某个特定类型的。之前一直以为很简单，但是某天和别人讨论的时候，才发现自己理解的完全错了。于是专门去查阅了资料，在这里记录下来。

# 错误的理解

```js
x instanceof A;
```

一直以为如果 x 的`constructor`属性指向的是 A，那么返回`true`，反之返回`false`。但是这样解释不了如下代码：

```js
function A() {}

function B() {}

var a = new A();
B.prototype = a;
var b = new B();
b instanceof B; // true
```

这里是一个很简单的继承关系，B 继承 A。如果按照我上面的理解，那么 b 首先在它自身寻找`constructor`,发现没有，于是去原型 a 上找，也会发现没有，于是查找`A.prototype.constructor`，这时得到结果`A`。所以`b.constructor`是`A`这个函数，操作符的结果返回`false`。 所以我上面对`instanceof`的理解肯定是错的。

# 正确的解释

搜索了一下`instanceof`，看到了[这篇博客](https://www.ibm.com/developerworks/cn/web/1306_jiangjj_jsinstanceof/index.html)，觉得讲的很好。

其实`instanceof`操作符是判断右操作数的`prototype`是否处于左操作数的原型链上，只要存在，不管是在原型链的哪个节点上，都会返回 true。借用上面博客的一段代码，可以很清晰的知道整个查找过程：

```js
function instance_of(L, R) {
  //L 表示左表达式，R 表示右表达式
  var O = R.prototype; // 取 R 的显示原型
  L = L.__proto__; // 取 L 的隐式原型
  while (true) {
    if (L === null) return false;
    if (O === L)
      // 这里重点：当 O 严格等于 L 时，返回 true
      return true;
    L = L.__proto__;
  }
}
```

按照上面的代码逻辑，我那个`b instanceof B`就可以很容易知道结果为`true`了 😆

最后需要注意一下多个窗口时，`instanceof`会有一些问题，具体见[MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/instanceof)
