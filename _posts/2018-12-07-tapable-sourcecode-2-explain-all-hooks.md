---
title: 'tapable源码解析2-解析各个钩子内部原理'
img: alaska.jpg # Add image post (optional)
date: 2018-12-07 17:20:00 +0800
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [Tabpable, javascript]
---

- [前言](#前言)
- [SyncBailHook](#syncbailhook)
  - [demo](#demo)
  - [执行结果](#执行结果)
  - [生成函数](#生成函数)
- [SyncLoopHook](#syncloophook)
  - [demo](#demo-1)
  - [执行结果](#执行结果-1)
  - [生成函数](#生成函数-1)

# 前言

上一篇文章我们以`SyncHook`为例讲解了`tapable`对于钩子的内部处理逻辑，这篇文章会挨个讲解剩余每种钩子，会直接对照例子和生成的代码来帮助大家理解。

# SyncBailHook

上一个回调函数的返回值如果不为空，后面的回调就再也不会执行，相当于被截断.

## demo

```js
let queue = new SyncBailHook(['name']);

queue.tap('1', function(name) {
  console.log(name, 1);
});
queue.tap('2', function(name) {
  console.log(name, 2);
  return 'wrong'; // tap3的回调不会执行
});
queue.tap('3', function(name) {
  console.log(name, 3);
});

queue.call('webpack');
```

## 执行结果

```js
webpack 1
webpack 2
```

## 生成函数

```js
function anonymous(name) {
  'use strict';
  var _context;
  var _x = this._x;
  var _fn0 = _x[0];
  var _result0 = _fn0(name);
  if (_result0 !== undefined) {
    return _result0;
  } else {
    var _fn1 = _x[1];
    var _result1 = _fn1(name);
    if (_result1 !== undefined) {
      return _result1;
    } else {
      var _fn2 = _x[2];
      var _result2 = _fn2(name);
      if (_result2 !== undefined) {
        return _result2;
      } else {
      }
    }
  }
}
```

# SyncLoopHook

只要某个监听的回调返回值不为空就会一直循环执行这个回调，直到返回空才会执行下一个回调.

## demo

```js
let queue = new SyncLoopHook(['name']);
let count = 3;
queue.tap('1', function(name) {
  console.log('tap1 count: ', count--);
  if (count > 0) {
    return true;
  }
  return;
});

queue.tap('2', function(name) {
  count = 1;
  console.log('tap2  count: ', count--);
  if (count > 0) {
    return true;
  }
  return;
});

queue.call('webpack');
```

## 执行结果

```js
tap1 count:  3
tap1 count:  2
tap1 count:  1
tap2 count:  1
```

## 生成函数

```js
function anonymous(name) {
  'use strict';
  var _context;
  var _x = this._x;
  var _loop;
  do {
    _loop = false;
    var _fn0 = _x[0];
    var _result0 = _fn0(name);
    if (_result0 !== undefined) {
      _loop = true;
    } else {
      var _fn1 = _x[1];
      var _result1 = _fn1(name);
      if (_result1 !== undefined) {
        _loop = true;
      } else {
        if (!_loop) {
        }
      }
    }
  } while (_loop);
}
```
