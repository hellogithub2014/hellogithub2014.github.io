---
title: 'Vue源码解析4-双向数据绑定'
img: himalayan.jpg # Add image post (optional)
date: 2018-10-20 20:20:00 Asia/Shanghai
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [Vue, javascript]
---

# 原理

Vue 的响应式原理见
[官网的这张图](https://camo.githubusercontent.com/3845b9554e62650727fa7cae8f1c169060b879f7/68747470733a2f2f636e2e7675656a732e6f72672f696d616765732f646174612e706e67)

Vue 的更新是生成`render`函数，然后生成虚拟`dom`，映射到页面上。左侧的部分其实就是我们`watcher`的回调，右下角的`data`就是通过我们上面说的`Observer`来添加`getter`和`setter`。`watcher`通过`dependency`和`data`联系在一起，并触发`re-render`.

在代码层面上，有 3 个核心的相关类：`Observer`、`Dep`和`Watcher`，`Observer`是`Dep`和`Watcher`之间的桥梁，通过`Observer`可以为被观察对象设置`Dep`，然后在特定时刻与`Dep.target`这个`Watcher`互相建立以来，从而建立联系。

`Watcher`会在所关注的`Dep`发生变化时执行传入的回调，要么是更新数据要么是更新 DOM。

`Dep`和`Watcher`是通过观察者模式结合的，`Dep`是被观察对象，`Watcher`是观察者。二者是多对多的关系，一个`Dep`可以被多个`Watcher`观察，一个`Watcher`也可以观察多个`Dep`。

# Observer

```js
constructor (value: any) {
    this.value = value
    // value整体有一个对应的dep
    this.dep = new Dep()
    this.vmCount = 0
    def(value, '__ob__', this)
    if (Array.isArray(value)) {
      // protoAugment： target.__proto__ = src
      // copyAugment: 将src上的值复制到target上
      const augment = hasProto ? protoAugment : copyAugment
      augment(value, arrayMethods, arrayKeys)
      // 为每一个数组成员调用observe
      this.observeArray(value)
    } else {
      // 为value的每一个成员属性定义getter、setter
      this.walk(value)
    }
  }
```

上面的`arrayMethods`是做了特殊的处理数组`Array.prototype`，更改了实现：

```js
const arrayProto = Array.prototype;
export const arrayMethods = Object.create(arrayProto);

const methodsToPatch = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];

/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function(method) {
  // cache original method
  const original = arrayProto[method];
  def(arrayMethods, method, function mutator(...args) {
    const result = original.apply(this, args);
    const ob = this.__ob__;
    let inserted;
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args;
        break;
      case 'splice':
        inserted = args.slice(2);
        break;
    }
    // inserted表示执行数组方法后新增的数组元素
    if (inserted) ob.observeArray(inserted);
    // notify change
    ob.dep.notify();
    return result;
  });
});
```

如何监听数组的变化可以参考[这个 issue](https://github.com/youngwind/blog/issues/85#issuecomment-284974136)。大体来说是类似`Array.prototype`和`Object.prototype`这样的原生对象上的 method 是不会受到业务代码的影响的，即使继承一个子类来手动覆盖。

`observeArray`用于观察一个数组，为每一个数组元素收集依赖：

```js
observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }

  /**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
export function observe (value: any, asRootData: ?boolean): Observer | void {
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob: Observer | void
  // 如果已经被observe过，那么在Observer构造器中会被设置value.__ob__属性
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (shouldObserve && !isServerRendering() && (Array.isArray(value) || isPlainObject(value)) && Object.isExtensible(value) && !value._isVue) {
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}
```

`walk`方法用于处理一个 Object，为每一个 key-value 重新定义`getter`和`setter`：

```js
/**
   * Walk through each property and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   */
  walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }

/**
 * Define a reactive property on an Object.
 */
export function defineReactive (obj: Object, key: string, val: any, customSetter?: ?Function, shallow?: boolean) {
  const dep = new Dep() // 每一对key、val有一个自己的Dep

  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  // 原始的getter、setter
  const getter = property && property.get
  const setter = property && property.set
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }

  let childOb = !shallow && observe(val) // observe会返回一个Observer实例
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      const value = getter ? getter.call(obj) : val
      // Dep.target指向一个Watcher，在特定时刻，某个watcher会将其指向自己
      if (Dep.target) {
        // Dep和watcher互相“关注”
        dep.depend()
        if (childOb) {
          childOb.dep.depend() // childOb.dep与watcher互相关注
          if (Array.isArray(value)) {
            dependArray(value) // value数组每一个元素的dep与watcher互相关注
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      const value = getter ? getter.call(obj) : val
      // 值没有变，或NaN
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }

      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      childOb = !shallow && observe(newVal) // 为newVal收集依赖
      dep.notify() // 通知对dep关心的所有watcher调用update逻辑
    }
  })
}

function dependArray (value: Array<any>) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}
```

`defineReactive`在前一篇文章也有所描述。最终达到的效果是在调用`new Obersver(value)`或者`observe(value)`时，都是重写属性的`getter`和`setter`。 之后如果有其他地方对 value 的属性值感兴趣，在读取的时候就会收集`Watcher`作为依赖，在更改属性值时就会触发`watcher`的更新回调。

# Dep

这个类比较简单，核心是内部维护一个`subs`数组，表示所有对此`Dep`感兴趣的`Watcher`。

```js
export default class Dep {
  static target: ?Watcher; // 其他地方会在必要时将Dep.target设置为特定的Watcher
  id: number;
  subs: Array<Watcher>;

  constructor() {
    this.id = uid++;
    this.subs = [];
  }

  addSub(sub: Watcher) {
    this.subs.push(sub);
  }

  removeSub(sub: Watcher) {
    remove(this.subs, sub);
  }

  // 让全局的Dep.target这个watcher观察自己；同时将这个watcher加入自己的订阅者中
  // 通俗来说就是让Dep.target和自己互相关注
  depend() {
    if (Dep.target) {
      Dep.target.addDep(this);
    }
  }

  notify() {
    // stabilize the subscriber list first
    const subs = this.subs.slice();
    if (process.env.NODE_ENV !== 'production' && !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      subs.sort((a, b) => a.id - b.id);
    }
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update();
    }
  }
}
```

# Watcher

先看一下构造函数

```js
constructor (vm: Component, expOrFn: string | Function, cb: Function, options?: ?Object, isRenderWatcher?: boolean) {
    this.vm = vm
    if (isRenderWatcher) {
      vm._watcher = this
    }
    // vm内部有一个_watchers数组
    vm._watchers.push(this)
    // options
    if (options) {
      this.deep = !!options.deep
      this.user = !!options.user
      this.lazy = !!options.lazy
      this.sync = !!options.sync
      this.before = options.before
    } else {
      this.deep = this.user = this.lazy = this.sync = false
    }
    this.cb = cb
    this.id = ++uid // uid for batching
    this.active = true
    this.dirty = this.lazy // for lazy watchers
    this.deps = []
    this.newDeps = []
    this.depIds = new Set()
    this.newDepIds = new Set()
    this.expression = process.env.NODE_ENV !== 'production' ? expOrFn.toString() : ''
    // parse expression for getter
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      this.getter = parsePath(expOrFn)

		}
    this.value = this.lazy ? undefined : this.get()
  }
```

看到最后一句会调用`get`，它用于执行传入的`expOrFn`：

```js
	/**
   * Evaluate the getter, and re-collect dependencies.
   */
  get () {
    pushTarget(this)
    let value
    const vm = this.vm
    try {
      // 在这个getter中，我们或渲染页面，或获取某个数据的值。总之，会调用相关data的getter，来建立数据的双向绑定。
      value = this.getter.call(vm, vm)
    } catch (e) {
      if (this.user) {
        handleError(e, vm, `getter for watcher "${this.expression}"`)
      } else {
        throw e
      }
    } finally {
      // "touch" every property so they are all tracked as
      // dependencies for deep watching
      if (this.deep) {
        traverse(value)
      }
      popTarget()
      this.cleanupDeps() // 清除不用的Dep
    }
    return value
  }
```

`pushTarget(this)`和`popTarget()`是一对操作，前者用于将`Dep.target`设置为当前`Watcher`，后者用于还原`Dep.target`:

```js
const targetStack = [];

export function pushTarget(_target: ?Watcher) {
  if (Dep.target) targetStack.push(Dep.target);
  Dep.target = _target;
}

export function popTarget() {
  Dep.target = targetStack.pop();
}
```

在`Dep.depend`方法中会调用`Watcher.addDep`，它用于将一个`Dep`放到自己的`deps`数组，这是这个`Watcher`实例所有的依赖`Dep`。

```js
	/**
   * Add a dependency to this directive.
   */
  addDep (dep: Dep) {
    const id = dep.id
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id)
      this.newDeps.push(dep)
      if (!this.depIds.has(id)) {
        dep.addSub(this)
      }
    }
  }
```

**在什么时候会实例化一个`Watcher`呢？**目前已知的有两处：

1. 在`mountComponent`中会第一次调用`new Watcher`,最终的目的是用于更新模板

   ```js
   new Watcher(vm, updateComponent, noop, {
       before () {
         if (vm._isMounted) {
           callHook(vm, 'beforeUpdate')
         }
       }
     }
   ```

2. 在`state.js`中的`initComputed`也会调用`new Watcher`，并会将返回的`watcher`实例放入`vm._computedWatchers`对象，目的是监听某个值的变化。

   ```js
   watchers[key] = new Watcher(vm, getter || noop, noop, computedWatcherOptions);
   ```

接着看一下在`Dep.notify`中会调用的`Watcher.update`方法：

```js
	/**
   * Subscriber interface.
   * Will be called when a dependency changes.
   */
  update () {
    /* istanbul ignore else */
    if (this.lazy) {
      this.dirty = true
    } else if (this.sync) {
      this.run()
    } else {
      queueWatcher(this)
    }
  }

  /**
   * Scheduler job interface.
   * Will be called by the scheduler.
   */
  run () {
    if (this.active) {
      const value = this.get()
      if (
        value !== this.value ||
        // Deep watchers and watchers on Object/Arrays should fire even
        // when the value is the same, because the value may
        // have mutated.
        isObject(value) ||
        this.deep
      ) {
        // set new value
        const oldValue = this.value
        this.value = value

        this.cb.call(this.vm, value, oldValue)
      }
    }
  }
```

`update`主要有两个出口，一个是`run`另一个是`queueWatcher`。如果需要立即执行，那么就会调用`run`反之会将其加入一个`queue`中。

`run`先会调用`get`获取最新的值，然后和缓存的 value 对比，发生改变时执行`new Watcher`传入的`cb`回调函数。

最后看一下`queueWatcher`。

## queueWatcher

```js
function queueWatcher(watcher: Watcher) {
  const id = watcher.id;
  if (has[id] == null) {
    has[id] = true;
    // flushing表示当前是否正在冲洗队列中的所有watcher
    if (!flushing) {
      queue.push(watcher);
    } else {
      // if already flushing, splice the watcher based on its id
      // if already past its id, it will be run next immediately.
      // 根据id执行插入排序，index表示当前正在执行哪个watcher的run函数
      let i = queue.length - 1;
      while (i > index && queue[i].id > watcher.id) {
        i--;
      }
      queue.splice(i + 1, 0, watcher);
    }
    // queue the flush
    if (!waiting) {
      waiting = true;

      if (process.env.NODE_ENV !== 'production' && !config.async) {
        flushSchedulerQueue();
        return;
      }
      nextTick(flushSchedulerQueue); // 在下一时刻flush queue
    }
  }
}
```

会有一个专门的调度器`Scheduler`管理`queue`，在 flush 时会挨个调用`watcher`的`run`方法。

```js
/**
 * Flush both queues and run the watchers.
 */
function flushSchedulerQueue() {
  flushing = true;
  let watcher, id;

  // Sort queue before flush.
  // This ensures that:
  // 1. Components are updated from parent to child. (because parent is always
  //    created before the child)
  // 2. A component's user watchers are run before its render watcher (because
  //    user watchers are created before the render watcher)
  // 3. If a component is destroyed during a parent component's watcher run,
  //    its watchers can be skipped.
  queue.sort((a, b) => a.id - b.id);

  // do not cache length because more watchers might be pushed
  // as we run existing watchers。
  // 注意循环中没有缓存queue.length，因为在执行flush时可能陆续有新watcher加入queue队列
  for (index = 0; index < queue.length; index++) {
    watcher = queue[index];
    if (watcher.before) {
      // before是在new watcher的options参数中传递，表示执行run之间的前置逻辑
      watcher.before();
    }
    id = watcher.id;
    has[id] = null;
    watcher.run();
    // in dev build, check and stop circular updates.
    if (process.env.NODE_ENV !== 'production' && has[id] != null) {
      circular[id] = (circular[id] || 0) + 1;
      // 检测循环watcher，最多100次
      if (circular[id] > MAX_UPDATE_COUNT) {
        warn(
          'You may have an infinite update loop ' +
            (watcher.user ? `in watcher with expression "${watcher.expression}"` : `in a component render function.`),
          watcher.vm,
        );
        break;
      }
    }
  }

  // keep copies of post queues before resetting state
  const activatedQueue = activatedChildren.slice();
  const updatedQueue = queue.slice();

  resetSchedulerState(); // flush完重置整个调度器的状态

  // call component updated and activated hooks
  callActivatedHooks(activatedQueue); // 调用queue中每个vm的activated钩子
  callUpdatedHooks(updatedQueue); // 调用queue中每个vm的updated钩子
}
```

上面的`watcher.before()`目前只在`mountComponent`时设置：

```js
new Watcher(
  vm,
  updateComponent,
  noop,
  {
    before() {
      if (vm._isMounted) {
        callHook(vm, 'beforeUpdate');
      }
    },
  },
  true /* isRenderWatcher */,
);
```

也就是说每次执行`watcher.update`之前都会调用一次`beforeUpdate`钩子。

还有一个有意思的变量`MAX_UPDATE_COUNT`，在开发环境下如果两个`watcher`互相触发对方的`update`就会陷入死循环，利用这个变量来打破循环。例如下面的代码就会陷入无限循环中：

```js
	watch: {
        a(){
          this.b = this.b + 1;
        },
        b(){
          this.a = this.a + 1;
        },
      },
```

# 小结

Vue 的响应式原理核心在于 3 个类，关键之处在于利用`Object.defineProperty`来重写属性值的`getter`、`setter`，利用`getter`来收集依赖，利用`setter`来触发更新回调，以达到更新 dom 或数据的目的。
