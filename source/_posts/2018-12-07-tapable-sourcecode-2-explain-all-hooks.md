---
title: 'tapable源码解析2-解析各个钩子内部原理'
img: alaska.jpg # Add image post (optional)
date: 2018-12-07 17:20:00
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
- [SyncWaterfallHook](#syncwaterfallhook)
  - [demo](#demo-2)
  - [运行结果](#运行结果)
  - [生成函数](#生成函数-2)
- [AsyncParallelBailHook](#asyncparallelbailhook)
  - [tap - callAsync](#tap---callasync)
    - [demo](#demo-3)
    - [运行结果](#运行结果-1)
    - [生成函数](#生成函数-3)
  - [tapAsync - callAsync](#tapasync---callasync)
    - [demo](#demo-4)
    - [运行结果](#运行结果-2)
    - [生成函数](#生成函数-4)
  - [tapPromise - promise](#tappromise---promise)
    - [demo](#demo-5)
    - [运行结果](#运行结果-3)
    - [生成函数](#生成函数-5)
- [AsyncParallelHook](#asyncparallelhook)
  - [tap - callAsync](#tap---callasync-1)
    - [demo](#demo-6)
    - [运行结果](#运行结果-4)
    - [生成函数](#生成函数-6)
  - [tapAsync -callAsync](#tapasync--callasync)
    - [demo](#demo-7)
    - [运行结果](#运行结果-5)
    - [生成函数](#生成函数-7)
  - [tapPromise - promise](#tappromise---promise-1)
    - [demo](#demo-8)
    - [运行结果](#运行结果-6)
    - [生成函数](#生成函数-8)
- [AsyncSeriesBailHook](#asyncseriesbailhook)
  - [tap - callAsync](#tap---callasync-2)
    - [demo](#demo-9)
    - [运行结果](#运行结果-7)
    - [生成函数](#生成函数-9)
  - [tapAsync - callAsync](#tapasync---callasync-1)
    - [demo](#demo-10)
    - [运行结果](#运行结果-8)
    - [生成函数](#生成函数-10)
  - [tapPromise - promise](#tappromise---promise-2)
    - [demo](#demo-11)
    - [运行结果](#运行结果-9)
    - [生成函数](#生成函数-11)
- [AsyncSeriesHook](#asyncserieshook)
  - [tap - callAsync](#tap---callasync-3)
    - [demo](#demo-12)
    - [运行结果](#运行结果-10)
    - [生成函数](#生成函数-12)
  - [tapAsync - callAsync](#tapasync---callasync-2)
    - [demo](#demo-13)
    - [运行结果](#运行结果-11)
    - [生成函数](#生成函数-13)
  - [tapPromise - promise](#tappromise---promise-3)
    - [demo](#demo-14)
    - [运行结果](#运行结果-12)
    - [生成函数](#生成函数-14)
- [AsyncSeriesWaterfallHook](#asyncserieswaterfallhook)
  - [tap - callAsync](#tap---callasync-4)
    - [demo](#demo-15)
    - [运行结果](#运行结果-13)
    - [生成函数](#生成函数-15)
  - [tapAsync - callAsync](#tapasync---callasync-3)
    - [demo](#demo-16)
    - [运行结果](#运行结果-14)
    - [生成函数](#生成函数-16)
  - [tapPromise - promise](#tappromise---promise-4)
    - [demo](#demo-17)
    - [运行结果](#运行结果-15)
    - [生成函数](#生成函数-17)

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

# SyncWaterfallHook

上一个回调函数的返回值如果不为空，就会传给下一个回调函数当做参数

## demo

```js
let queue = new SyncWaterfallHook(['name']);

queue.tap('1', function(name) {
  console.log(name, 1);
  // return 1; // 返回值为空，会将参数name透传给下一个回调函数
});
queue.tap('2', function(data) {
  console.log(data, 2);
  return 2;
});
queue.tap('3', function(data) {
  console.log(data, 3);
});

queue.call('webpack');
```

## 运行结果

```js
webpack 1
webpack 2
2 3
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
    name = _result0;
  }
  var _fn1 = _x[1];
  var _result1 = _fn1(name);
  if (_result1 !== undefined) {
    name = _result1;
  }
  var _fn2 = _x[2];
  var _result2 = _fn2(name);
  if (_result2 !== undefined) {
    name = _result2;
  }
  return name;
}
```

# AsyncParallelBailHook

剩下的都是异步钩子了，每个钩子会讲述 3 种监听发布方式

- `tap - callAsync`
- `tapAsync - callAsync`
- `tapPromise - promise`

## tap - callAsync

只要前一个回调的返回值不为空或者抛异常，就会直接执行 callAsync 的回调，后续的 tap 回调不会被执行。
**每个监听函数的执行应当都是同步的。**

### demo

```js
queue1.tap('1', function(name) {
  console.log(name, 1);
  // return 1;
});
queue1.tap('2', function(name) {
  console.log(name, 2);
  return 'tap2 result';
});
queue1.tap('3', function(name) {
  console.log(name, 3);
});
queue1.callAsync('webpack', (err, result) => {
  console.log('err: ', err, 'result: ', result);
  console.timeEnd('cost');
});
```

### 运行结果

```js
webpack 1
webpack 2
err:  null result:  tap2 result
cost: 12.483ms
```

### 生成函数

```js
function anonymous(name, _callback) {
  'use strict';
  var _context;
  var _x = this._x;
  var _results = new Array(3);
  // 检查_results中是否存在result或error属性不为空的，若存在则直接调用_callback
  var _checkDone = () => {
    for (var i = 0; i < _results.length; i++) {
      var item = _results[i];
      if (item === undefined) return false;
      if (item.result !== undefined) {
        _callback(null, item.result);
        return true;
      }
      if (item.error) {
        _callback(item.error);
        return true;
      }
    }
    return false;
  };
  do {
    var _counter = 3;
    var _done = () => {
      _callback();
    };
    if (_counter <= 0) break;
    var _fn0 = _x[0];
    var _hasError0 = false;
    try {
      var _result0 = _fn0(name);
    } catch (_err) {
      _hasError0 = true;
      if (_counter > 0) {
        if (0 < _results.length && ((_results.length = 1), (_results[0] = { error: _err }), _checkDone())) {
          _counter = 0;
        } else {
          if (--_counter === 0) _done();
        }
      }
    }
    if (!_hasError0) {
      if (_counter > 0) {
        if (0 < _results.length && (_result0 !== undefined && (_results.length = 1), (_results[0] = { result: _result0 }), _checkDone())) {
          _counter = 0;
        } else {
          if (--_counter === 0) _done();
        }
      }
    }
    if (_counter <= 0) break;
    if (1 >= _results.length) {
      if (--_counter === 0) _done();
    } else {
      var _fn1 = _x[1];
      var _hasError1 = false;
      try {
        var _result1 = _fn1(name);
      } catch (_err) {
        _hasError1 = true;
        if (_counter > 0) {
          if (1 < _results.length && ((_results.length = 2), (_results[1] = { error: _err }), _checkDone())) {
            _counter = 0;
          } else {
            if (--_counter === 0) _done();
          }
        }
      }
      if (!_hasError1) {
        if (_counter > 0) {
          if (1 < _results.length && (_result1 !== undefined && (_results.length = 2), (_results[1] = { result: _result1 }), _checkDone())) {
            _counter = 0;
          } else {
            if (--_counter === 0) _done();
          }
        }
      }
    }
    if (_counter <= 0) break;
    if (2 >= _results.length) {
      if (--_counter === 0) _done();
    } else {
      var _fn2 = _x[2];
      var _hasError2 = false;
      try {
        var _result2 = _fn2(name);
      } catch (_err) {
        _hasError2 = true;
        if (_counter > 0) {
          if (2 < _results.length && ((_results.length = 3), (_results[2] = { error: _err }), _checkDone())) {
            _counter = 0;
          } else {
            if (--_counter === 0) _done();
          }
        }
      }
      if (!_hasError2) {
        if (_counter > 0) {
          if (2 < _results.length && (_result2 !== undefined && (_results.length = 3), (_results[2] = { result: _result2 }), _checkDone())) {
            _counter = 0;
          } else {
            if (--_counter === 0) _done();
          }
        }
      }
    }
  } while (false);
}
```

## tapAsync - callAsync

1. 若 `callback` 被同步执行：只要前一个回调函数的 `callback` 在调用时不传 `error/result` 参数，在执行完后就会顺序执行后一个回调。若 `callback` 在调用时传了非空 `error/result` 参数，会直接执行 `callAsync` 的回调，并将非空 `error/result` 参数当做入参。
2. 若 `callback` 被异步执行：上述情况会改变，若调用 `callback` 时传了 `error/result` 参数，在执行完后就会执行 `callAsync` 的回调，只不过后续的回调因为是异步的，所以依然有机会执行，只不过 `callAsync` 的回调只会执行一次

### demo

```js
queue2.tapAsync('1', function(name, callback) {
  setTimeout(() => {
    console.log(name, 1);
    callback();
  }, 1000);
});
queue2.tapAsync('2', function(name, callback) {
  // setTimeout( () => {
  console.log(name, 2);
  // 如果此处的callback是在异步环境中被调用如被注释的setTimeout，那么tapAsync3依然有机会被调用；
  // 如果是在同步环境中被调用，tapAsync3不会被调用
  callback(undefined, 123);
  // })
});
queue2.tapAsync('3', function(name, callback) {
  setTimeout(() => {
    console.log(name, 3);
    callback();
  }, 3000);
});

queue2.callAsync('webpack', (err, result) => {
  // 此处的err,result是某个cb调用时传入的
  console.log('over', 'error: ', err, 'result: ', result);
  console.timeEnd('cost1');
});
```

### 运行结果

```js
webpack 2
webpack 1
over error:  null result:  123
cost1: 1012.450ms
```

### 生成函数

```js
function anonymous(name, _callback) {
  'use strict';
  var _context;
  var _x = this._x;
  var _results = new Array(3); // 每个tap的回调函数cb可能的调用参数
  // 检查_results结果集中是否存在不是undefined的
  var _checkDone = () => {
    for (var i = 0; i < _results.length; i++) {
      var item = _results[i];
      if (item === undefined) return false;
      if (item.result !== undefined) {
        _callback(null, item.result);
        return true;
      }
      if (item.error) {
        _callback(item.error);
        return true;
      }
    }
    return false;
  };
  do {
    var _counter = 3;
    var _done = () => {
      _callback();
    };
    if (_counter <= 0) break;
    var _fn0 = _x[0];
    // 调用tapAsync的回调函数，(_err0, _result0) => xxx是传给cb的实参
    _fn0(name, (_err0, _result0) => {
      // 如果cb在执行时传入了err参数
      if (_err0) {
        if (_counter > 0) {
          if (0 < _results.length && ((_results.length = 1), (_results[0] = { error: _err0 }), _checkDone())) {
            _counter = 0;
          } else {
            if (--_counter === 0) _done();
          }
        }
      } else {
        // 如果未传入err参数
        if (_counter > 0) {
          if (0 < _results.length && (_result0 !== undefined && (_results.length = 1), (_results[0] = { result: _result0 }), _checkDone())) {
            _counter = 0;
          } else {
            if (--_counter === 0) _done();
          }
        }
      }
    });
    if (_counter <= 0) break;
    if (1 >= _results.length) {
      if (--_counter === 0) _done();
    } else {
      var _fn1 = _x[1];
      _fn1(name, (_err1, _result1) => {
        if (_err1) {
          if (_counter > 0) {
            if (1 < _results.length && ((_results.length = 2), (_results[1] = { error: _err1 }), _checkDone())) {
              _counter = 0;
            } else {
              if (--_counter === 0) _done();
            }
          }
        } else {
          if (_counter > 0) {
            if (1 < _results.length && (_result1 !== undefined && (_results.length = 2), (_results[1] = { result: _result1 }), _checkDone())) {
              _counter = 0;
            } else {
              if (--_counter === 0) _done();
            }
          }
        }
      });
    }
    if (_counter <= 0) break;
    if (2 >= _results.length) {
      if (--_counter === 0) _done();
    } else {
      var _fn2 = _x[2];
      _fn2(name, (_err2, _result2) => {
        if (_err2) {
          if (_counter > 0) {
            if (2 < _results.length && ((_results.length = 3), (_results[2] = { error: _err2 }), _checkDone())) {
              _counter = 0;
            } else {
              if (--_counter === 0) _done();
            }
          }
        } else {
          if (_counter > 0) {
            if (2 < _results.length && (_result2 !== undefined && (_results.length = 3), (_results[2] = { result: _result2 }), _checkDone())) {
              _counter = 0;
            } else {
              if (--_counter === 0) _done();
            }
          }
        }
      });
    }
  } while (false);
}
```

## tapPromise - promise

如果某个`tapPromsie`的回调`Promise resolve`或`reject`的参数不为空，
会直接导致`Hook.promise`得到`resolve`或`reject`，而不会等后面的`tapPromise`回调得到`resolve`或`reject`
只不过因为`promise`是异步的，所以后续的`promise`依然有机会执行，只不过`Hook.promise`的`then / catch`只会执行一次.

### demo

```js
queue3.tapPromise('1', function(name) {
  return new Promise(function(resolve, reject) {
    setTimeout(() => {
      console.log(name, 1);
      resolve();
    }, 1000);
  });
});

queue3.tapPromise('2', function(name) {
  return new Promise(function(resolve, reject) {
    setTimeout(() => {
      console.log(name, 2);
      reject('tapPromise2 wrong'); // resolve或reject的参数非undefined时，会直接resolve或reject最后的queue3.promise
    }, 2000);
  });
});

queue3.tapPromise('3', function(name) {
  return new Promise(function(resolve, reject) {
    setTimeout(() => {
      console.log(name, 3);
      resolve();
    }, 3000);
  });
});

queue3
  .promise('webpack')
  // 此处的result和err都是某个tapPromise回调resolve或reject的参数
  .then(
    result => {
      console.log('over', 'result: ', result);
      console.timeEnd('cost3');
    },
    err => {
      console.error('error: ', err);
      console.timeEnd('cost3');
    },
  );
```

### 运行结果

```js
webpack 1
webpack 2
error:  tapPromise2 wrong
cost3: 2014.422ms
webpack 3 // 注意tapPromise3的回调promise依然有机会执行，只不过是在Hook.promise之后
```

### 生成函数

```js
function anonymous(name) {
  'use strict';
  return new Promise((_resolve, _reject) => {
    var _sync = true;
    var _context;
    var _x = this._x;
    var _results = new Array(3);
    var _checkDone = () => {
      for (var i = 0; i < _results.length; i++) {
        var item = _results[i];
        if (item === undefined) return false;
        if (item.result !== undefined) {
          _resolve(item.result);
          return true;
        }
        if (item.error) {
          if (_sync)
            _resolve(
              Promise.resolve().then(() => {
                throw item.error;
              }),
            );
          else _reject(item.error);
          return true;
        }
      }
      return false;
    };
    do {
      var _counter = 3;
      var _done = () => {
        _resolve();
      };
      if (_counter <= 0) break;
      var _fn0 = _x[0];
      var _hasResult0 = false;
      var _promise0 = _fn0(name);
      if (!_promise0 || !_promise0.then) throw new Error('Tap function (tapPromise) did not return promise (returned ' + _promise0 + ')');
      _promise0.then(
        _result0 => {
          _hasResult0 = true;
          if (_counter > 0) {
            if (0 < _results.length && (_result0 !== undefined && (_results.length = 1), (_results[0] = { result: _result0 }), _checkDone())) {
              _counter = 0;
            } else {
              if (--_counter === 0) _done();
            }
          }
        },
        _err0 => {
          if (_hasResult0) throw _err0;
          if (_counter > 0) {
            if (0 < _results.length && ((_results.length = 1), (_results[0] = { error: _err0 }), _checkDone())) {
              _counter = 0;
            } else {
              if (--_counter === 0) _done();
            }
          }
        },
      );
      if (_counter <= 0) break;
      if (1 >= _results.length) {
        if (--_counter === 0) _done();
      } else {
        var _fn1 = _x[1];
        var _hasResult1 = false;
        var _promise1 = _fn1(name);
        if (!_promise1 || !_promise1.then) throw new Error('Tap function (tapPromise) did not return promise (returned ' + _promise1 + ')');
        _promise1.then(
          _result1 => {
            _hasResult1 = true;
            if (_counter > 0) {
              if (1 < _results.length && (_result1 !== undefined && (_results.length = 2), (_results[1] = { result: _result1 }), _checkDone())) {
                _counter = 0;
              } else {
                if (--_counter === 0) _done();
              }
            }
          },
          _err1 => {
            if (_hasResult1) throw _err1;
            if (_counter > 0) {
              if (1 < _results.length && ((_results.length = 2), (_results[1] = { error: _err1 }), _checkDone())) {
                _counter = 0;
              } else {
                if (--_counter === 0) _done();
              }
            }
          },
        );
      }
      if (_counter <= 0) break;
      if (2 >= _results.length) {
        if (--_counter === 0) _done();
      } else {
        var _fn2 = _x[2];
        var _hasResult2 = false;
        var _promise2 = _fn2(name);
        if (!_promise2 || !_promise2.then) throw new Error('Tap function (tapPromise) did not return promise (returned ' + _promise2 + ')');
        _promise2.then(
          _result2 => {
            _hasResult2 = true;
            if (_counter > 0) {
              if (2 < _results.length && (_result2 !== undefined && (_results.length = 3), (_results[2] = { result: _result2 }), _checkDone())) {
                _counter = 0;
              } else {
                if (--_counter === 0) _done();
              }
            }
          },
          _err2 => {
            if (_hasResult2) throw _err2;
            if (_counter > 0) {
              if (2 < _results.length && ((_results.length = 3), (_results[2] = { error: _err2 }), _checkDone())) {
                _counter = 0;
              } else {
                if (--_counter === 0) _done();
              }
            }
          },
        );
      }
    } while (false);
    _sync = false;
  });
}
```

# AsyncParallelHook

## tap - callAsync

只要前一个回调函数不抛异常，在执行完后就会顺序执行后一个回调。若抛异常，会直接执行 callAsync 的回调，并将异常当做参数

### demo

```js
console.time('cost');
queue1.tap('1', function(name) {
  console.log(name, 1);
});
queue1.tap('2', function(name) {
  console.log(name, 2);
  throw 'tap2 err'; // 后面的tap3不会执行了
});
queue1.tap('3', function(name) {
  console.log(name, 3);
});
queue1.callAsync('webpack', err => {
  console.error('err: ', err);
  console.timeEnd('cost');
});
```

### 运行结果

```js
webpack 1
webpack 2
err:  tap2 err
cost: 4.520ms
```

### 生成函数

```js
function anonymous(name, _callback) {
  'use strict';
  var _context;
  var _x = this._x; // 所有hook.tap的监听函数数组
  do {
    var _counter = 3;
    var _done = () => {
      _callback();
    };
    if (_counter <= 0) break;
    var _fn0 = _x[0];
    var _hasError0 = false;
    try {
      _fn0(name);
    } catch (_err) {
      _hasError0 = true;
      if (_counter > 0) {
        _callback(_err);
        _counter = 0;
      }
    }
    if (!_hasError0) {
      if (--_counter === 0) _done();
    }
    if (_counter <= 0) break;
    var _fn1 = _x[1];
    var _hasError1 = false;
    try {
      _fn1(name);
    } catch (_err) {
      _hasError1 = true;
      if (_counter > 0) {
        _callback(_err);
        _counter = 0;
      }
    }
    if (!_hasError1) {
      if (--_counter === 0) _done();
    }
    if (_counter <= 0) break;
    var _fn2 = _x[2];
    var _hasError2 = false;
    try {
      _fn2(name);
    } catch (_err) {
      _hasError2 = true;
      if (_counter > 0) {
        _callback(_err);
        _counter = 0;
      }
    }
    if (!_hasError2) {
      if (--_counter === 0) _done();
    }
  } while (false);
}
```

## tapAsync -callAsync

1. 若 `callback` 被同步执行：只要前一个回调函数的 `callback` 在调用时不传 `error` 参数，在执行完后就会顺序执行后一个回调。若 `callback` 在调用时传了非空 `error` 参数，会直接执行 `callAsync` 的回调，并将非空 `error` 参数当做入参。
2. 若 `callback` 被异步执行：上述情况会改变，若调用 `callback` 时传了 `error` 参数，在执行完后就会执行 `callAsync` 的回调，只不过后续的回调因为是异步的，所以依然有机会执行，只不过 `callAsync` 的回调只会执行一次

### demo

```js
queue2.tapAsync('1', function(name, callback) {
  setTimeout(() => {
    console.log(name, 1);
  }, 1000);
});
queue2.tapAsync('2', function(name, callback) {
  setTimeout(() => {
    console.log(name, 2);
    // 如果此处的callback是在异步环境中被调用如被注释的setTimeout，那么tapAsync3依然有机会被调用；
    // 如果是在同步环境中被调用，tapAsync3不会被调用
    callback('error2');
  }, 2000);
});
queue2.tapAsync('3', function(name, callback) {
  setTimeout(() => {
    console.log(name, 3);
    // callback("error3");
  }, 3000);
});

queue2.callAsync('webpack', err => {
  console.log('over');
  console.log('err', err);
  console.timeEnd('cost1');
});
```

### 运行结果

```js
webpack 1
webpack 2
over
err error2
cost1: 2033.607ms
webpack 3
```

### 生成函数

```js
function anonymous(name, _callback) {
  'use strict';
  var _context;
  var _x = this._x;
  do {
    var _counter = 3;
    var _done = () => {
      _callback();
    };
    if (_counter <= 0) break;
    var _fn0 = _x[0];
    // _err0: tapAsync回调触发时传入的参数， 回调触发后才会修改counter
    // 如果第二个参数是异步被执行的，那么后面的fn1依然有机会执行
    _fn0(name, _err0 => {
      if (_err0) {
        if (_counter > 0) {
          _callback(_err0);
          _counter = 0;
        }
      } else {
        if (--_counter === 0) _done();
      }
    });
    if (_counter <= 0) break;
    var _fn1 = _x[1];
    _fn1(name, _err1 => {
      if (_err1) {
        if (_counter > 0) {
          _callback(_err1);
          _counter = 0;
        }
      } else {
        if (--_counter === 0) _done();
      }
    });
    if (_counter <= 0) break;
    var _fn2 = _x[2];
    _fn2(name, _err2 => {
      if (_err2) {
        if (_counter > 0) {
          _callback(_err2);
          _counter = 0;
        }
      } else {
        if (--_counter === 0) _done();
      }
    });
  } while (false);
}
```

## tapPromise - promise

若回调的 `promise` 被 `resolve`，在执行完后就会顺序执行后一个回调，若 `reject` 了就会只会跳到 `Hook.promise` 的 `catch` 回调。只不过因为 `promise` 是异步的，所以后续的 `promise` 依然有机会执行，只不过 `Hook.promise` 的 `then/catch` 只会执行一次。

### demo

```js
queue3.tapPromise('1', function(name) {
  return new Promise(function(resolve, reject) {
    setTimeout(() => {
      console.log(name, 1);
      resolve();
    }, 1000);
  });
});

queue3.tapPromise('2', function(name) {
  return new Promise(function(resolve, reject) {
    setTimeout(() => {
      console.log(name, 2);
      // resolve();
      // 会导致接下来直接执行Hook.promise的catch，不过tapPromise3的回调promise依然会被执行
      reject('tapPromise2 error');
    }, 2000);
  });
});

queue3.tapPromise('3', function(name) {
  return new Promise(function(resolve, reject) {
    setTimeout(() => {
      console.log(name, 3);
      resolve();
    }, 3000);
  });
});

queue3.promise('webpack').then(
  () => {
    console.log('over');
    console.timeEnd('cost3');
  },
  err => {
    console.log('error: ', err);
    console.timeEnd('cost3');
  },
);
```

### 运行结果

```js
webpack 1
webpack 2
error:  tapPromise2 error
cost3: 2011.6462669968605ms
webpack 3 // 注意tapPromise3的回调promise依然有机会执行，只不过是在Hook.promise之后
```

### 生成函数

```js
function anonymous(name) {
  'use strict';
  return new Promise((_resolve, _reject) => {
    var _sync = true;
    var _context;
    var _x = this._x;
    do {
      var _counter = 3;
      var _done = () => {
        _resolve();
      };
      if (_counter <= 0) break;
      var _fn0 = _x[0];
      var _hasResult0 = false;
      var _promise0 = _fn0(name);
      if (!_promise0 || !_promise0.then) throw new Error('Tap function (tapPromise) did not return promise (returned ' + _promise0 + ')');
      _promise0.then(
        _result0 => {
          _hasResult0 = true;
          if (--_counter === 0) _done();
        },
        _err0 => {
          if (_hasResult0) throw _err0;
          if (_counter > 0) {
            if (_sync)
              _resolve(
                Promise.resolve().then(() => {
                  throw _err0;
                }),
              );
            else _reject(_err0);
            _counter = 0;
          }
        },
      );
      if (_counter <= 0) break;
      var _fn1 = _x[1];
      var _hasResult1 = false;
      var _promise1 = _fn1(name);
      if (!_promise1 || !_promise1.then) throw new Error('Tap function (tapPromise) did not return promise (returned ' + _promise1 + ')');
      _promise1.then(
        _result1 => {
          _hasResult1 = true;
          if (--_counter === 0) _done();
        },
        _err1 => {
          if (_hasResult1) throw _err1;
          if (_counter > 0) {
            if (_sync)
              _resolve(
                Promise.resolve().then(() => {
                  throw _err1;
                }),
              );
            else _reject(_err1);
            _counter = 0;
          }
        },
      );
      if (_counter <= 0) break;
      var _fn2 = _x[2];
      var _hasResult2 = false;
      var _promise2 = _fn2(name);
      if (!_promise2 || !_promise2.then) throw new Error('Tap function (tapPromise) did not return promise (returned ' + _promise2 + ')');
      _promise2.then(
        _result2 => {
          _hasResult2 = true;
          if (--_counter === 0) _done();
        },
        _err2 => {
          if (_hasResult2) throw _err2;
          if (_counter > 0) {
            if (_sync)
              _resolve(
                Promise.resolve().then(() => {
                  throw _err2;
                }),
              );
            else _reject(_err2);
            _counter = 0;
          }
        },
      );
    } while (false);
    _sync = false;
  });
}
```

# AsyncSeriesBailHook

## tap - callAsync

`callback`的返回值不为`null`，或者回调抛出异常，就会直接执行`callAsync`绑定的回调函数

### demo

```js
queue1.tap('1', function(name) {
  console.log(1);
});
queue1.tap('2', function(name) {
  console.log(2);
  // return "tap2 result";
  throw 'tap2 error';
});
queue1.tap('3', function(name) {
  console.log(3);
});
queue1.callAsync('webpack', err => {
  console.error('err: ', err);
  console.timeEnd('cost1');
});
```

### 运行结果

```js
1
2
err:  tap2 error
cost1: 3.979ms
```

### 生成函数

```js
function anonymous(name, _callback) {
  'use strict';
  var _context;
  var _x = this._x;
  var _fn0 = _x[0];
  var _hasError0 = false;
  try {
    var _result0 = _fn0(name);
  } catch (_err) {
    _hasError0 = true;
    _callback(_err);
  }
  if (!_hasError0) {
    if (_result0 !== undefined) {
      _callback(null, _result0);
    } else {
      var _fn1 = _x[1];
      var _hasError1 = false;
      try {
        var _result1 = _fn1(name);
      } catch (_err) {
        _hasError1 = true;
        _callback(_err);
      }
      if (!_hasError1) {
        if (_result1 !== undefined) {
          _callback(null, _result1);
        } else {
          var _fn2 = _x[2];
          var _hasError2 = false;
          try {
            var _result2 = _fn2(name);
          } catch (_err) {
            _hasError2 = true;
            _callback(_err);
          }
          if (!_hasError2) {
            if (_result2 !== undefined) {
              _callback(null, _result2);
            } else {
              _callback();
            }
          }
        }
      }
    }
  }
}
```

## tapAsync - callAsync

`callback: (err, result) => any`

注意和`AsyncParallelBailHook-tapAsync-callAsync`的对比：

1. `AsyncSeriesBailHook`是异步串行，`callback`的`err`或`result`参数不为`null`，不管是同步还是异步环境中执行的，都会直接执行`callAsync`绑定的回调函数，会将`callback`的参数携带过去，后续的`tapAsync`不会被执行。
2. `AsyncParallelBailHook`是异步并行，如果`callback`是在异步环境中被调用如被注释的`setTimeout`，那么后续的`tapAsync`回调依然有机会被调用

### demo

```js
queue2.tapAsync('1', function(name, callback) {
  setTimeout(function() {
    console.log(name, 1);
    callback();
  }, 1000);
});
queue2.tapAsync('2', function(name, callback) {
  setTimeout(function() {
    console.log(name, 2);
    // callback( 'wrong' );
    callback(undefined, 'tapAsync2 result');
  }, 2000);
});
queue2.tapAsync('3', function(name, callback) {
  setTimeout(function() {
    console.log(name, 3);
    callback();
  }, 3000);
});
queue2.callAsync('webpack', (err, result) => {
  console.log('err: ', err, 'result: ', result);
  console.log('over');
  console.timeEnd('cost2');
});
```

### 运行结果

```js
webpack 1
webpack 2
err:  null result:  tapAsync2 result
over
cost2: 3014.616ms
```

### 生成函数

```js
function anonymous(name, _callback) {
  'use strict';
  var _context;
  var _x = this._x;
  var _fn0 = _x[0];
  _fn0(name, (_err0, _result0) => {
    if (_err0) {
      _callback(_err0);
    } else {
      if (_result0 !== undefined) {
        _callback(null, _result0);
      } else {
        var _fn1 = _x[1];
        _fn1(name, (_err1, _result1) => {
          if (_err1) {
            _callback(_err1);
          } else {
            if (_result1 !== undefined) {
              _callback(null, _result1);
            } else {
              var _fn2 = _x[2];
              _fn2(name, (_err2, _result2) => {
                if (_err2) {
                  _callback(_err2);
                } else {
                  if (_result2 !== undefined) {
                    _callback(null, _result2);
                  } else {
                    _callback();
                  }
                }
              });
            }
          }
        });
      }
    }
  });
}
```

## tapPromise - promise

如果某个`tapPromsie`的回调`Promise resolve`或`reject`的参数不为空，
会直接导致`Hook.promise`得到`resolve`或`reject`，后续的`tapPromise`回调没有机会执行.
注意和`AsyncParallelBailHook-tapPromise-promise`的区别,一个是异步串行，一个是异步并行.

### demo

```js
queue3.tapPromise('1', function(name) {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      console.log(name, 1);
      resolve();
    }, 1000);
  });
});
queue3.tapPromise('2', function(name) {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      console.log(name, 2);
      reject('tapPromise2 error');
    }, 2000);
  });
});
queue3.tapPromise('3', function(name) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      console.log(name, 3);
      resolve();
    }, 3000);
  });
});
queue3.promise('webpack').then(
  result => {
    console.log('result: ', result);
    console.log('over');
    console.timeEnd('cost3');
  },
  err => {
    console.error('err: ', err);
    console.timeEnd('cost3');
  },
);
```

### 运行结果

```js
webpack 1
webpack 2
err:  tapPromise2 error
cost3: 3017.608ms
```

### 生成函数

```js
function anonymous(name) {
  'use strict';
  return new Promise((_resolve, _reject) => {
    var _sync = true;
    var _context;
    var _x = this._x;
    var _fn0 = _x[0];
    var _hasResult0 = false;
    var _promise0 = _fn0(name);
    if (!_promise0 || !_promise0.then) throw new Error('Tap function (tapPromise) did not return promise (returned ' + _promise0 + ')');
    _promise0.then(
      _result0 => {
        _hasResult0 = true;
        if (_result0 !== undefined) {
          _resolve(_result0);
        } else {
          var _fn1 = _x[1];
          var _hasResult1 = false;
          var _promise1 = _fn1(name);
          if (!_promise1 || !_promise1.then) throw new Error('Tap function (tapPromise) did not return promise (returned ' + _promise1 + ')');
          _promise1.then(
            _result1 => {
              _hasResult1 = true;
              if (_result1 !== undefined) {
                _resolve(_result1);
              } else {
                var _fn2 = _x[2];
                var _hasResult2 = false;
                var _promise2 = _fn2(name);
                if (!_promise2 || !_promise2.then) throw new Error('Tap function (tapPromise) did not return promise (returned ' + _promise2 + ')');
                _promise2.then(
                  _result2 => {
                    _hasResult2 = true;
                    if (_result2 !== undefined) {
                      _resolve(_result2);
                    } else {
                      _resolve();
                    }
                  },
                  _err2 => {
                    if (_hasResult2) throw _err2;
                    if (_sync)
                      _resolve(
                        Promise.resolve().then(() => {
                          throw _err2;
                        }),
                      );
                    else _reject(_err2);
                  },
                );
              }
            },
            _err1 => {
              if (_hasResult1) throw _err1;
              if (_sync)
                _resolve(
                  Promise.resolve().then(() => {
                    throw _err1;
                  }),
                );
              else _reject(_err1);
            },
          );
        }
      },
      _err0 => {
        if (_hasResult0) throw _err0;
        if (_sync)
          _resolve(
            Promise.resolve().then(() => {
              throw _err0;
            }),
          );
        else _reject(_err0);
      },
    );
    _sync = false;
  });
}
```

# AsyncSeriesHook

## tap - callAsync

不关心每个`tap`回调参数的返回值，除非抛出异常会直接调用`callAsync`的回调,此时后续`tap`回调均不会执行

### demo

```js
queue1.tap( '1', function ( name ) {
  console.log( 1 );
  return "Wrong";
} );
queue1.tap( '2', function ( name ) {
  console.log( 2 );
  throw new Error('tap2 error')
} );
queue1.tap( '3', function ( name ) {
  console.log( 3 );
} );
queue1.callAsync( 'zfpx', err => {
  console.log( err );
  console.timeEnd( 'cost1' );
} );
```

### 运行结果

```js
1
2
tap2 error
cost1: 3.933ms
```

### 生成函数

```js
function anonymous(name, _callback) {
  'use strict';
  var _context;
  var _x = this._x;
  var _fn0 = _x[0];
  var _hasError0 = false;
  try {
    _fn0(name);
  } catch (_err) {
    _hasError0 = true;
    _callback(_err);
  }
  if (!_hasError0) {
    var _fn1 = _x[1];
    var _hasError1 = false;
    try {
      _fn1(name);
    } catch (_err) {
      _hasError1 = true;
      _callback(_err);
    }
    if (!_hasError1) {
      var _fn2 = _x[2];
      var _hasError2 = false;
      try {
        _fn2(name);
      } catch (_err) {
        _hasError2 = true;
        _callback(_err);
      }
      if (!_hasError2) {
        _callback();
      }
    }
  }
}
```

## tapAsync - callAsync

只有执行了前一个`tapAsync`回调里的`callback`后，才会执行后一个`tapAsync`的回调。
如果执行`callback`时传入了非空值，会被当做时`error`，
此时会跳过后续的`tapAsync`回调，直接执行`callAsync`的回调,并传入`error`

### demo

```js
queue2.tapAsync( '1', function ( name, callback ) {
  setTimeout( () => {
    console.log( name, 1 );
    callback();
  }, 1000 );
} );
queue2.tapAsync( '2', function ( name, callback ) {
  setTimeout( () => {
    console.log( name, 2 );
    callback('tapAsync2 error');
  }, 2000 );
} );
queue2.tapAsync( '3', function ( name, callback ) {
  setTimeout( () => {
    console.log( name, 3 );
    callback();
  }, 3000 );
} );

queue2.callAsync( 'webpack', ( err ) => {
  console.log( err );
  console.log( 'over' );
  console.timeEnd( 'cost2' );
} );
```

### 运行结果

```js
webpack 1
webpack 2
tapAsync2 error
over
cost2: 3019.621ms
```

### 生成函数

```js
function anonymous(name, _callback) {
  'use strict';
  var _context;
  var _x = this._x;
  var _fn0 = _x[0];
  _fn0(name, _err0 => {
    if (_err0) {
      _callback(_err0);
    } else {
      var _fn1 = _x[1];
      _fn1(name, _err1 => {
        if (_err1) {
          _callback(_err1);
        } else {
          var _fn2 = _x[2];
          _fn2(name, _err2 => {
            if (_err2) {
              _callback(_err2);
            } else {
              _callback();
            }
          });
        }
      });
    }
  });
}
```

## tapPromise - promise

只有执行了前一个`tapPromise`回调里的`Promise resolve`后，才会执行后一个`tapPromise`的回调`Promise`。
如果`Promsie reject`了，此时会跳过后续的`tapPromise`回调，直接执行`hook.promise`的`then`回调，参数就是`error`对象

### demo

```js
queue3.tapPromise( '1', function ( name ) {
  return new Promise( function ( resolve, reject ) {
    setTimeout( function () {
      console.log( name, 1 );
      resolve();
      // reject( 'tapPromise1 error' );
    }, 1000 )
  } );
} );
queue3.tapPromise( '2', function ( name ) {
  return new Promise( function ( resolve, reject ) {
    setTimeout( function () {
      console.log( name, 2 );
      // resolve();
      reject( 'tapPromise2 error' );
    }, 2000 )
  } );
} );
queue3.tapPromise( '3', function ( name ) {
  return new Promise( function ( resolve ) {
    setTimeout( function () {
      console.log( name, 3 );
      resolve();
    }, 3000 )
  } );
} );
queue3.promise( 'webapck' ).then( result => {
  console.log( 'result: ', result );
  console.timeEnd( 'cost3' );
},err=>{
  console.log( 'err: ', err );
  console.timeEnd( 'cost3' );
} )
```

### 运行结果

```js
webapck 1
webapck 2
err:  tapPromise2 error
cost3: 3021.817ms
```

### 生成函数

```js
function anonymous(name) {
  'use strict';
  return new Promise((_resolve, _reject) => {
    var _sync = true;
    var _context;
    var _x = this._x;
    var _fn0 = _x[0];
    var _hasResult0 = false;
    var _promise0 = _fn0(name);
    if (!_promise0 || !_promise0.then) throw new Error('Tap function (tapPromise) did not return promise (returned ' + _promise0 + ')');
    _promise0.then(
      _result0 => {
        _hasResult0 = true;
        var _fn1 = _x[1];
        var _hasResult1 = false;
        var _promise1 = _fn1(name);
        if (!_promise1 || !_promise1.then) throw new Error('Tap function (tapPromise) did not return promise (returned ' + _promise1 + ')');
        _promise1.then(
          _result1 => {
            _hasResult1 = true;
            var _fn2 = _x[2];
            var _hasResult2 = false;
            var _promise2 = _fn2(name);
            if (!_promise2 || !_promise2.then) throw new Error('Tap function (tapPromise) did not return promise (returned ' + _promise2 + ')');
            _promise2.then(
              _result2 => {
                _hasResult2 = true;
                _resolve();
              },
              _err2 => {
                if (_hasResult2) throw _err2;
                if (_sync)
                  _resolve(
                    Promise.resolve().then(() => {
                      throw _err2;
                    }),
                  );
                else _reject(_err2);
              },
            );
          },
          _err1 => {
            if (_hasResult1) throw _err1;
            if (_sync)
              _resolve(
                Promise.resolve().then(() => {
                  throw _err1;
                }),
              );
            else _reject(_err1);
          },
        );
      },
      _err0 => {
        if (_hasResult0) throw _err0;
        if (_sync)
          _resolve(
            Promise.resolve().then(() => {
              throw _err0;
            }),
          );
        else _reject(_err0);
      },
    );
    _sync = false;
  });
}

```

# AsyncSeriesWaterfallHook

## tap - callAsync

上一个监听函数的返回值, 可以作为下一个监听函数的参数。 如果监听函数报错，直接执行`callAsync`的回调,后续tap回调不会被执行

### demo

```js
queue1.tap( '1', function ( name ) {
  console.log( name, 1 );
  return 'lily'
} );
queue1.tap( '2', function ( data ) {
  console.log( 2, data );
  return 'Tom';
} );
queue1.tap( '3', function ( data ) {
  console.log( 3, data );
} );
queue1.callAsync( 'webpack', err => {
  console.log( err );
  console.log( 'over' );
  console.timeEnd( 'cost1' );
} );
```

### 运行结果

```js
webpack 1
2 'lily'
3 'Tom'
null
over
cost1: 5.525ms
```

### 生成函数

```js
function anonymous(name, _callback) {
  'use strict';
  var _context;
  var _x = this._x;
  var _fn0 = _x[0];
  var _hasError0 = false;
  try {
    var _result0 = _fn0(name);
  } catch (_err) {
    _hasError0 = true;
    _callback(_err);
  }
  if (!_hasError0) {
    if (_result0 !== undefined) {
      name = _result0;
    }
    var _fn1 = _x[1];
    var _hasError1 = false;
    try {
      var _result1 = _fn1(name);
    } catch (_err) {
      _hasError1 = true;
      _callback(_err);
    }
    if (!_hasError1) {
      if (_result1 !== undefined) {
        name = _result1;
      }
      var _fn2 = _x[2];
      var _hasError2 = false;
      try {
        var _result2 = _fn2(name);
      } catch (_err) {
        _hasError2 = true;
        _callback(_err);
      }
      if (!_hasError2) {
        if (_result2 !== undefined) {
          name = _result2;
        }
        _callback(null, name);
      }
    }
  }
}
```

## tapAsync - callAsync

上一个监听函数`callback`的第二个调用参数, 可以作为下一个监听函数的`data`参数。
如果`callback`的第一个参数不为空，会被当做`error`参数，直接执行`callAsync`的回调并传入`error`，后续`tapAsync`不会执行

### demo

```js
queue2.tapAsync( '1', function ( name, callback ) {
  setTimeout( function () {
    console.log( '1: ', name );
    callback( null, 'tapAsync1' );
  }, 1000 )
} );
queue2.tapAsync( '2', function ( data, callback ) {
  setTimeout( function () {
    console.log( '2: ', data );
    callback( 'tapAsync2 error');
  }, 2000 )
} );
queue2.tapAsync( '3', function ( data, callback ) {
  setTimeout( function () {
    console.log( '3: ', data );
    callback( null, 'tapAsync3' );
  }, 3000 )
} );
queue2.callAsync( 'webpack', (err,result) => {
  console.log( "err: ", err, 'result: ', result );
  console.log( 'over' );
  console.timeEnd( 'cost2' );
} );
```

### 运行结果

```js
1:  webpack
2:  tapAsync1
err:  tapAsync2 error result:  undefined
over
cost2: 3016.889ms
```

### 生成函数

```js
function anonymous(name, _callback) {
  'use strict';
  var _context;
  var _x = this._x;
  var _fn0 = _x[0];
  _fn0(name, (_err0, _result0) => {
    if (_err0) {
      _callback(_err0);
    } else {
      if (_result0 !== undefined) {
        name = _result0;
      }
      var _fn1 = _x[1];
      _fn1(name, (_err1, _result1) => {
        if (_err1) {
          _callback(_err1);
        } else {
          if (_result1 !== undefined) {
            name = _result1;
          }
          var _fn2 = _x[2];
          _fn2(name, (_err2, _result2) => {
            if (_err2) {
              _callback(_err2);
            } else {
              if (_result2 !== undefined) {
                name = _result2;
              }
              _callback(null, name);
            }
          });
        }
      });
    }
  });
}
```

## tapPromise - promise

上一个监听函数`Promise`的`resolve`结果, 可以作为下一个监听函数的`data`参数。
如果调用了`reject`，直接执行`Hook.promise`的`catch`回调，并传入`reject`参数，后续`tapPromsie`回调不会再执行

### demo

```js
queue3.tapPromise( '1', function ( name ) {
  return new Promise( function ( resolve, reject ) {
    setTimeout( function () {
      console.log( '1:', name );
      resolve( 'tapPromise1' );
      // reject( 'tapPromise1 error' ) // 后续的tapPromise回调不会执行，直接执行Hook.promise的catch回调。
    }, 1000 )
  } );
} );
queue3.tapPromise( '2', function ( data ) {
  return new Promise( function ( resolve,reject ) {
    setTimeout( function () {
      console.log( '2:', data );
      // resolve( '2' );
      reject('tapPromise2 error');
    }, 2000 )
  } );
} );
queue3.tapPromise( '3', function ( data ) {
  return new Promise( function ( resolve ) {
    setTimeout( function () {
      console.log( '3:', data );
      resolve( 'over' );
    }, 3000 )
  } );
} );
queue3.promise( 'webpack' ).then( result => {
  console.log( 'result: ', result );
  console.timeEnd( 'cost3' );
}, err => {
  console.log( "err: ", err );
  console.timeEnd( 'cost3' );
} );
```

### 运行结果

```js
1: webpack
2: tapPromise1
err:  tapPromise2 error
cost3: 3019.126ms
```

### 生成函数

```js
function anonymous(name) {
  'use strict';
  return new Promise((_resolve, _reject) => {
    var _sync = true;
    var _context;
    var _x = this._x;
    var _fn0 = _x[0];
    var _hasResult0 = false;
    var _promise0 = _fn0(name);
    if (!_promise0 || !_promise0.then) throw new Error('Tap function (tapPromise) did not return promise (returned ' + _promise0 + ')');
    _promise0.then(
      _result0 => {
        _hasResult0 = true;
        if (_result0 !== undefined) {
          name = _result0;
        }
        var _fn1 = _x[1];
        var _hasResult1 = false;
        var _promise1 = _fn1(name);
        if (!_promise1 || !_promise1.then) throw new Error('Tap function (tapPromise) did not return promise (returned ' + _promise1 + ')');
        _promise1.then(
          _result1 => {
            _hasResult1 = true;
            if (_result1 !== undefined) {
              name = _result1;
            }
            var _fn2 = _x[2];
            var _hasResult2 = false;
            var _promise2 = _fn2(name);
            if (!_promise2 || !_promise2.then) throw new Error('Tap function (tapPromise) did not return promise (returned ' + _promise2 + ')');
            _promise2.then(
              _result2 => {
                _hasResult2 = true;
                if (_result2 !== undefined) {
                  name = _result2;
                }
                _resolve(name);
              },
              _err2 => {
                if (_hasResult2) throw _err2;
                if (_sync)
                  _resolve(
                    Promise.resolve().then(() => {
                      throw _err2;
                    }),
                  );
                else _reject(_err2);
              },
            );
          },
          _err1 => {
            if (_hasResult1) throw _err1;
            if (_sync)
              _resolve(
                Promise.resolve().then(() => {
                  throw _err1;
                }),
              );
            else _reject(_err1);
          },
        );
      },
      _err0 => {
        if (_hasResult0) throw _err0;
        if (_sync)
          _resolve(
            Promise.resolve().then(() => {
              throw _err0;
            }),
          );
        else _reject(_err0);
      },
    );
    _sync = false;
  });
}
```
