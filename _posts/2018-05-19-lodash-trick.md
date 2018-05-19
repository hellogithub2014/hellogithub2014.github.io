---
title: "lodash源码学习之技巧篇"
img: alaska.jpg # Add image post (optional)
date: 2018-05-19 17:30:00 +0800
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [lodash]
---

# baseGetTag 获取变量类型

以前获取变量类型主要有 3 种方法：

### typeof

`typeof` 主要用来判断变量是否为原生值类型，对于引用类型其均返回`Object`:

```js
typeof 1; // 'number'
typeof '1'; // 'string'
typeof null; // 'object'
typeof undefined; // 'undefined'
typeof {}; // 'object'

function T() {}
typeof new T(); // 'object'
```

### instanceof

`instanceof` 用来确定左操作数是否在右操作数的原型链上，并且在有多个`frame`时可能会出问题。具体机制可参见[这篇博客](https://www.ibm.com/developerworks/cn/web/1306_jiangjj_jsinstanceof/index.html)。

```js
function T() {}
var t = new T();
t instanceof T; // true
```

### Object.prototype.toString.call

`Object.prototype.toString.call` 应当来说这个是推荐用法了。见[MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/toString)的描述：

> 每个对象都有一个 toString()方法，当该对象被表示为一个文本值时，或者一个对象以预期的字符串方式引用时自动调用。默认情况下，toString()方法被每个 Object 对象继承。如果此方法在自定义对象中未被覆盖，toString()  返回  "[object type]"，其中 type 是对象的类型。

由于`toString`方法可能会被对象覆盖，所有要用上述的形式调用，而不是简单的`obj.toString`.

**toString 的具体工作机制如下**([参考](https://segmentfault.com/a/1190000014216304))：

>     1.	如果 `this` 的值是 `undefined`, 返回 `[object Undefined]`.

2.  如果 `this` 的值是 `null`, 返回 `[object Null]`.
3.  令 `O` 为以 `this` 作为参数调用 `ToObject` 的结果 .
4.  令 `class` 为 `O` 的 `[[Class]]` 内部属性的值 .
5.  返回三个字符串 `[object`, `class`, 和 `]` 连起来的字符串 .

每个内置对象都定义了`[[Class]]`内部属性，有`"Arguments", "Array", "Boolean", "Date", "Error", "Function", "JSON", "Math", "Number", "Object", "RegExp", "String"`

此方法在 ES5 中工作的很好，但在 ES6 中，添加了一种新的`Symbol`类型，以及一个内置的`Symbol`值`Symbol.toStringTag`，它拦截了`toString`的工作。`Symbol.toStringTag`应该被定义成一个`getter`，它的返回值代表变量的类型。

```js
class Normal {}

var nor = new Normal();
Object.prototype.toString.call(nor); // [object Object]

class TTT {
  get [Symbol.toStringTag]() {
    return 'TTT~~~~';
  }
}

var t = new TTT();

Object.prototype.toString.call(t); // [object TTT~~~]
```

> The Symbol.toStringTag well-known symbol is a string valued property that is used in the creation of the default string description of an object. It is accessed internally by the Object.prototype.toString() method.

[MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toStringTag)上的描述说到`Symbol.toStringTag`其实在`toString`内部用到了。 具体流程如下：

>

1.  如果  this  是  undefined ，返回  '[object Undefined]' ;
2.  如果  this  是  null , 返回  '[object Null]' ；
3.  令  O  为以  this  作为参数调用  ToObject  的结果；
4.  令  isArray  为  IsArray(O) ；
5.  ReturnIfAbrupt(isArray) （如果  isArray  不是一个正常值，比如抛出一个错误，中断执行）；
6.  如果  isArray  为  true ， 令  builtinTag  为  'Array' ;
7.  else ，如果  O is an exotic String object ， 令  builtinTag  为  'String' ；
8.  else ，如果  O  含有  [[ParameterMap]] internal slot, ， 令  builtinTag  为  'Arguments'；
9.  else ，如果  O  含有  [[Call]] internal method ， 令  builtinTag  为  Function ；
10. else ，如果  O  含有  [[ErrorData]] internal slot ， 令  builtinTag  为  Error ；
11. else ，如果  O  含有  [[BooleanData]] internal slot ， 令  builtinTag  为  Boolean ；
12. else ，如果  O  含有  [[NumberData]] internal slot ， 令  builtinTag  为  Number ；
13. else ，如果  O  含有  [[DateValue]] internal slot ， 令  builtinTag  为  Date ；
14. else ，如果  O  含有  [[RegExpMatcher]] internal slot ， 令  builtinTag  为  RegExp ；
15. else ， 令  builtinTag  为  Object ；
16. 令  tag  为  Get(O, @@toStringTag)  的返回值（ Get(O, @@toStringTag)  方法，既是在  O  是一个对象，并且具有  @@toStringTag  属性时，返回  O[Symbol.toStringTag] ）；
17. ReturnIfAbrupt(tag) ，如果  tag  是正常值，继续执行下一步；
18. 如果  Type(tag)  不是一个字符串，let tag be builtinTag ；
19. 返回由三个字符串  "[object", tag, and "]"  拼接而成的一个字符串。

前 15 步可以看成跟  es5  的作用一样，获取到数据的类型  `builtinTag` ，但是第 16 步调用了  `@@toStringTag`  的方法，其实就是`Symbol.toStringTag`对应的方法。 最终结果优先以这个方法返回值为准，不行的话再使用`builtinTag`

## baseGetTag

`lodash`中的`baseGetTag`为我们封装了上述所有逻辑：

```js
const objectProto = Object.prototype;
const hasOwnProperty = objectProto.hasOwnProperty;
const toString = objectProto.toString;
const symToStringTag = typeof Symbol != 'undefined' ? Symbol.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? '[object Undefined]' : '[object Null]';
  }
  if (!(symToStringTag && symToStringTag in Object(value))) {
    return toString.call(value);
  }
  const isOwn = hasOwnProperty.call(value, symToStringTag);
  const tag = value[symToStringTag];
  let unmasked = false;
  try {
    value[symToStringTag] = undefined;
    unmasked = true;
  } catch (e) {}

  const result = toString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}
```

一段段来看下：

```js
if (value == null) {
  return value === undefined ? '[object Undefined]' : '[object Null]';
}
```

这是对入参为空时的判断，没什么好说的。

```js
if (!(symToStringTag && symToStringTag in Object(value))) {
  return toString.call(value);
}
```

如果环境不支持`Symbol.toStringTag`或者`Symbol.toStringTag`没有在对象上没有定义，那么都直接调用原始的`toString`即可。

```js
const isOwn = hasOwnProperty.call(value, symToStringTag);
const tag = value[symToStringTag];
let unmasked = false;
try {
  value[symToStringTag] = undefined;
  unmasked = true;
} catch (e) {}
```

`isOwn`判断`symToStringTag`是在自身还是原型链上；`tag`用来备份； 之后`try...catch`里的`value[symToStringTag] = undefined`困扰了我很久，不知道什么情况下会报错，后来突然想到`Object.defineProperty`，里面如果`writable`为`false`，或者只指定了`get`没有`set`，都会报错：

```js
'use strict';
var o = {};

Object.defineProperty(o, 'readonly', {
  value: '123',
  writable: false,
});

Object.defineProperty(o, 'readonly2', {
  get: function() {
    return '456';
  },
});

o.readonly = '222'; // Uncaught TypeError: Cannot assign to read only property 'readonly' of object '#<Object>'

o.readonly2 = '222'; // Uncaught TypeError: Cannot set property readonly2 of #<Object> which has only a getter
```

最后一段

```js
const result = toString.call(value);
if (unmasked) {
  if (isOwn) {
    value[symToStringTag] = tag;
  } else {
    delete value[symToStringTag];
  }
}
```

如果`symToStringTag`是对象自身的，那么还原回去。从`try...catch`到后面的`if`分支，主要是避免对象自身的`symToStringTag`对最终结果的影响。如：

```js
var o = {
  [Symbol.toStringTag]: 'OOOOOOO',
};
baseGetTag(o); // [object Object],而不是OOOOOOO
```

# isFunction

以前判断一个变量是否为函数可以很简单的用`typeof`就行：

```js
function t() {}
typeof t === 'function'; // true
```

或者使用`Object.prototype.toString`:

```js
Object.prototype.toString.call(t); // ​​​​​[object Function]​​​​​
```

看看`Lodash`中是怎么实现的：

```js
function isFunction(value) {
  if (!isObject(value)) {
    return false;
  }
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 9 which returns 'object' for typed arrays and other constructors.
  const tag = baseGetTag(value);
  return tag == '[object Function]' || tag == '[object AsyncFunction]' || tag == '[object GeneratorFunction]' || tag == '[object Proxy]';
}
```

挨个做一下测试：

```js
function normalFunc() {}
Object.prototype.toString.call(normalFunc); // [object Function]
typeof normalFunc; // function
_.isFunction(asyncFunc); // true

async function asyncFunc() {}
Object.prototype.toString.call(asyncFunc); // [object AsyncFunction]
typeof asyncFunc; // function
_.isFunction(asyncFunc); // true

function* generatorFunc() {}
Object.prototype.toString.call(generatorFunc); // [object GeneratorFunction]
typeof generatorFunc; // function
_.isFunction(asyncFunc); // true
```

`[object Proxy]`的情况没有试出来，ES6 的`Proxy`不是函数：

```js
var proxy = new Proxy({}, {});
Object.prototype.toString.call(proxy); //[object Object]
```

但是在[underscore.js](http://underscorejs.org/underscore.js)中`isFunction`的实现就是直接利用的`typeof`：

```js
// Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
// IE 11 (#1621), Safari 8 (#1929), and PhantomJS (#2236).
var nodelist = root.document && root.document.childNodes;
if (typeof /./ != 'function' && typeof Int8Array != 'object' && typeof nodelist != 'function') {
  _.isFunction = function(obj) {
    return typeof obj == 'function' || false;
  };
}
```

综上，除了在一些『古董』上，使用`typeof`来判定函数是完全 ok 的。

# >>> 操作符

在`lodash`中经常会看到这样的代码：

```js
length = start > end ? 0 : (end - start) >>> 0;

const result = new Array(length);
```

这里的`>>>`是干嘛的？

在 js 中，`Array.length`需要是一个 0~2^31 -1 之间的无符号整数，参考[MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array)。而`>>>`是一个[无符号右移运算符](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators)，正好可以帮助我们做到这点。

`a >>> b`的作用是将`a`的二进制表示向右移`b`(<32)位，丢弃被移出的位，并使用 0 在左侧填充。于是操作结果就总是一个 0~2^31 -1 之间的无符号整数。搬运 MDN 上的例子：

```js
9 (base 10): 00000000000000000000000000001001 (base 2)
9 >>> 2 (base 10): 00000000000000000000000000000010 (base 2) = 2 (base 10)

// 对于负数
-9 (base 10): 11111111111111111111111111110111 (base 2)
-9 >>> 2 (base 10): 00111111111111111111111111111101 (base 2) = 1073741821 (base 10)
```

同时经测试它还能包容一些异常情况：

```js
'1' >>> 0; // 1
'1x' >>> 0; // 0
null >>> 0; // 0
```

有另外一个`>>`操作符，对于`a >> b`，它的作用是将 a 的二进制表示向右移  b (< 32) 位，丢弃被移出的位。如果 a 是一个非负数，那么`>>`和`>>>`的作用是一样的，差别在于负数，它会在左侧填充 1，而不是 0：

```js
-9 (base 10): 11111111111111111111111111110111 (base 2)

-9 >> 2 (base 10): 11111111111111111111111111111101 (base 2) = -3 (base 10)
```

因此如果有用到`Array.length`的地方，可以考虑用`>>>`做一些防护。
