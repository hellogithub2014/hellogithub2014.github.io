---
title: 'javascript bind函数小结'
summary_img: /images/sweden.jpg # Add image post (optional)
date: 2017-10-08 21:30:00

tag: [JavaScript]
---

本文用于总结 JavaScript bind 函数的机制，分析其源码以及应用。

# 介绍

根据`MDN`上的介绍：

> The bind() method creates a new function that, when called, has its this keyword set to the provided value, with a given sequence of arguments preceding any provided when the new function is called.

就是说 bind() 方法会创建一个新函数。当这个新函数被调用时，bind() 的第一个参数将作为它运行时的 this，之后的一序列参数将会在传递的实参前传入作为它的参数。

# bind 应用

### 创建硬绑定的`this`

使用`MDN`上的例子：

```js
this.x = 9; // this refers to global "window" object here in the browser
var module = {
  x: 81,
  getX: function() {
    return this.x;
  },
};

module.getX(); // 81

var retrieveX = module.getX;
retrieveX();
// returns 9 - The function gets invoked at the global scope

// Create a new function with 'this' bound to module
// New programmers might confuse the
// global var x with module's property x
var boundGetX = retrieveX.bind(module);
boundGetX(); // 81
```

可以看到，在一个函数上使用`bind`，其在调用时的`this`始终会指向给`bind`传递的第一个参数，这就是硬绑定。

硬绑定还可以用于`setTimeout`、事件处理函数。在`setTimeout`中，`this`的值默认是 window，事件处理函数中的`this`通常情况下是事件发生的目标`DOM`节点。在很多时候不注意就会产生 BUG，此时就可以使用 bind 来显示指定`this`的值。`MDN`例子：

```js
function LateBloomer() {
  this.petalCount = Math.floor(Math.random() * 12) + 1;
}

// Declare bloom after a delay of 1 second
LateBloomer.prototype.bloom = function() {
  window.setTimeout(this.declare.bind(this), 1000);
};

LateBloomer.prototype.declare = function() {
  console.log('I am a beautiful flower with ' + this.petalCount + ' petals!');
};

var flower = new LateBloomer();
flower.bloom();
// after 1 second, triggers the 'declare' method
```

如果写成

```js
window.setTimeout(this.declare, 1000);
```

那么运行`declare`函数时，`this`的值指向`window`,而`window`中没有`petalCount`，就会报错。

`bind`在事件处理函数中的应用与`setTimeout`类似，这里就不赘述了。

### 函数柯里化

柯里化是把接受多个参数的函数变换成接受一个单一参数（最初函数的第一个参数）的函数，并且返回接受余下的参数而且返回结果的新函数的技术。

也可以理解为如果一个函数接收多个参数，那么柯里化会把函数的前几个参数固定为特定的值，之后的参数会在调用时再指定。还是来看`MDN`上的例子

```js
function list() {
  return Array.prototype.slice.call(arguments);
}

var list1 = list(1, 2, 3); // [1, 2, 3]

// Create a function with a preset leading argument
var leadingThirtysevenList = list.bind(null, 37);

var list2 = leadingThirtysevenList();
// [37]

var list3 = leadingThirtysevenList(1, 2, 3);
// [37, 1, 2, 3]
```

可以看到，`list`函数在没有使用柯里化时，所有的参数都需要在调用时指定。在进行柯里化之后的`leadingThirtysevenList`函数，其第一个参数被固定为了`37`，在真正调用`leadingThirtysevenList`时传递的参数都会在这个`37`之后。

这里注意，调用`bind`时，若第一个参数是`null`，并不是说柯里化之后的函数的`this`被绑定为了`null`，而是`undefined`或者`window`，取决于是否在严格模式下。

### 延迟执行

这是参考的[前端开发者进阶之函数柯里化 Currying](http://www.cnblogs.com/pigtail/p/3447660.html)这篇博客。

柯里化还可以用于延迟执行：不断的柯里化，累积传入的参数，最后执行。例如：

```js
var add = function() {
  var _this = this,
    _args = arguments;
  return function cb() {
    if (!arguments.length) {
      var sum = 0;
      for (var i = 0, c; (c = _args[i++]); ) {
        sum += c;
      }
      return sum;
    } else {
      Array.prototype.push.apply(_args, arguments);
      return cb;
    }
  };
};
add(1)(2)(3)(4)(); //10
```

通用的写法：

```js
var curry = function(fn) {
  var _args = [];
  return function cb() {
    if (arguments.length == 0) {
      return fn.apply(this, _args);
    }
    Array.prototype.push.apply(_args, arguments);
    return cb;
  };
};
```

# 源码分析

先贴上`MDN`上的源码：

```js
if (!Function.prototype.bind) {
  Function.prototype.bind = function(oThis) {
    if (typeof this !== 'function') {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError('Function.prototype.bind -' + 'what is trying to be bound is not callable');
    }

    var aArgs = Array.prototype.slice.call(arguments, 1),
      fToBind = this,
      fNOP = function() {},
      fBound = function() {
        return fToBind.apply(this instanceof fNOP ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
      };

    if (this.prototype) {
      // Function.prototype doesn't have a prototype property
      fNOP.prototype = this.prototype;
    }
    fBound.prototype = new fNOP();

    return fBound;
  };
}
```

1. 使用

   ```js
   if (!Function.prototype.bind)
   ```

   是兼容不支持`bind`的浏览器，`bind`是在 ES5 中才出现的，在较新的浏览器上都已经有了原生的`bind`实现，所以不需要使用垫片。

2. 函数最开始的判断是因为`bind`只能在函数上调用，非函数上调用需要报错。

3. `aArgs`是调用`bind`时参入的固定参数，可以看到最终的`fBound`在调用时的实参是综合了固定参数和后来调用`fBound`传递的参数，这就实现了柯里化。

4. 为什么不直接使`fBound`的原型和`this`的原型相同，即

   ```js
   fBound.prototype = this.prototype;
   ```

   因为这样就会导致在改变`fBound`时连带着改变了调用`bind`的那个函数，即`fToBind`。
   所以使用一个空函数`fNOP`作为中转。此时原型链的示意为

   `fBound.prototype -----> new fNOP() ---> this.prototype`

5. `fToBind.apply(this instanceof fNOP? this: oThis, ...)`的作用：
   这是因为当`bind`返回的函数作为构造函数的时候，`bind`指定的`this`值会失效，此时的`this`会指向构造出来的那个对象实例。具体可以参见`MDN`给的例子：

   ```js
   function Point(x, y) {
     this.x = x;
     this.y = y;
   }

   Point.prototype.toString = function() {
     return this.x + ',' + this.y;
   };

   var p = new Point(1, 2);
   p.toString(); // '1,2'

   // not supported in the polyfill below,

   // works fine with native bind:

   var YAxisPoint = Point.bind(null, 0 /*x*/);
   ```


    var emptyObj = {};
    var YAxisPoint = Point.bind(emptyObj, 0/*x*/);

    var axisPoint = new YAxisPoint(5);
    axisPoint.toString(); // '0,5'

    axisPoint instanceof Point; // true
    axisPoint instanceof YAxisPoint; // true
    new Point(17, 42) instanceof YAxisPoint; // true
    ```

# 软绑定

此节内容参考[你不懂 JS：this 豁然开朗](http://mp.weixin.qq.com/s/af_193kB_y0_XFeMgG6XSA)

硬绑定 是一种通过强制函数绑定到特定的 this 上，来防止函数调用在不经意间退回到 默认绑定 的策略（除非你用 new 去覆盖它！）。问题是，硬绑定 极大地降低了函数的灵活性，阻止我们手动使用 隐式绑定 或后续的 明确绑定 尝试来覆盖 this。

为默认绑定 提供不同的默认值（不是 global 或 undefined），同时保持函数可以通过 隐式绑定 或 明确绑定 技术来手动绑定 this。

模拟代码：
![](http://mmbiz.qpic.cn/mmbiz_jpg/meG6Vo0MevgEs7nYqpK68qZ7ZwicHEHvCqHq2SkVnsmblQpknzRRF7nJdF3ry0O9RE4eAibl6x0iaZaMBwOicSQdbA/640?wx_fmt=jpeg&tp=webp&wxfrom=5&wx_lazy=1)

这里提供的 softBind(..)工具的工作方式和 ES5 内建的 bind(..)工具很相似，除了我们的 软绑定 行为。他用一种逻辑将指定的函数包装起来，这个逻辑在函数调用时检查 this，如果它是 global 或 undefined，就使用预先指定的 默认值 （obj），否则保持 this 不变。它也提供了可选的柯里化行为。

来看看它的用法：
![](http://mmbiz.qpic.cn/mmbiz_jpg/meG6Vo0MevgEs7nYqpK68qZ7ZwicHEHvClal5e2h9HCKvZaiaGAUO4LZs3qdN2do4sbDRqfic0Dv92hJL3ic26MiaZQ/640?wx_fmt=jpeg&tp=webp&wxfrom=5&wx_lazy=1)

# 参考

1. [JavaScript 深入之 bind 的模拟实现](http://mp.weixin.qq.com/s/PdMWx9Rus0w3QqxNhbHM8Q)
2. [你不懂 JS：this 豁然开朗](http://mp.weixin.qq.com/s/af_193kB_y0_XFeMgG6XSA)
3. [MDN: bind](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)
