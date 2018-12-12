---
title: 'Vuex源码解析'
img: sweden.jpg # Add image post (optional)
date: 2018-10-12 22:20:00
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [Vue, Vuex, javascript]
---

- [插件思路](#插件思路)
- [入口](#入口)
- [Store](#store)
  - [ModuleCollection](#modulecollection)
  - [installModule](#installmodule)
    - [**getNamespace**:](#getnamespace)
    - [**makeLocalContext**](#makelocalcontext)
    - [registerMutation](#registermutation)
    - [registerAction](#registeraction)
    - [registerGetter](#registergetter)
  - [resetStoreVM](#resetstorevm)
- [公共 api](#公共-api)
  - [commit、dispatch](#commitdispatch)
  - [registerModule](#registermodule)
  - [unregisterModule](#unregistermodule)
  - [resetStore](#resetstore)
  - [mapXXX 系列](#mapxxx-系列)
    - [mapState](#mapstate)
    - [mapGetters](#mapgetters)
    - [createNamespacedHelpers](#createnamespacedhelpers)

# 插件思路

`Vuex`将所有的数据统一存放到内部`store`中，然后内部实例化一个`vm`监听`store`的变化，业务代码中使用到`store`时就会产生依赖。 业务代码中使用的各种`mutation`、`action`最终都是尝试修改内部的`store`状态，`store`真正变化时就会自动由`Vue`通知到业务组件。

# 入口

和其他`Vue`插件一样，`Vuex`也会提供一个`install`方法作为入口，位于`store.js`：

```js
function install(_Vue) {
  // _Vue用于防止重复install
  if (Vue && _Vue === Vue) {
    // ...
    return;
  }
  Vue = _Vue;
  applyMixin(Vue);
}

// applyMixin
export default function (Vue) {
  // ...
	Vue.mixin({ beforeCreate: vuexInit })
  // ...
}

function vuexInit () {
    const options = this.$options
    // store injection
    if (options.store) {
      this.$store = typeof options.store === 'function'
        ? options.store()
        : options.store
    } else if (options.parent && options.parent.$store) {
      this.$store = options.parent.$store
    }
  }
}
```

可以看到入口代码很简单，核心之处位于`vuexInit`方法，它是把我们在`Vue`实例化选项中的`store`对象放到了`Vue.prototype.$store`中，这样我们就可以在任何组件中使用`this.$store`了。而`store`选项是我们通过`Vuex.Store`构造函数生成的，例如：

```js
const store = new Vuex.Store({
  state: {
    count: 0,
  },
  mutations: {
    increment(state) {
      state.count++;
    },
  },
});

new Vue({
  // ...
  store,
});
```

`Vuex`几乎所有的核心逻辑都是`Store`了，相关的代码位于`store.js`中。这个文件初看起来很大，不过其实逻辑大多不难，耐心看下去应该没什么问题，而其中关于`vuex module`的篇幅又占了很多，随后我们会慢慢感知到。

# Store

照常我们先从构造函数入口开始看起：

```js
constructor(options = {}) {
    // 一些校验逻辑，略去...

    const { strict = false } = options;

    // store internal state
    this._committing = false; // 用于标识是否处于mutation处理中
    this._actions = Object.create(null); // 存放所有定义的actions
    this._actionSubscribers = []; // 用于存放subscribeAction api参数的数组
    this._mutations = Object.create(null); // 存放所有定义的mutations
    this._wrappedGetters = Object.create(null); // 封装的getters，通过闭包替换真正getter的参数
    this._modules = new ModuleCollection(options); // module tree，modules.root表示树根
    this._modulesNamespaceMap = Object.create(null); // 层级的命名空间路径与module映射
    this._subscribers = []; // 用于存放subscribe api参数的数组,类似_actionSubscribers
    this._watcherVM = new Vue(); // 主要用于公共api watch方法，监听参数的变化

    // bind commit and dispatch to self
    const store = this;
    const { dispatch, commit } = this;

    // 闭包绑定dispatch函数的store参数
    this.dispatch = function boundDispatch(type, payload) {
      return dispatch.call(store, type, payload);
    };
    // 闭包绑定commit函数的store参数
    this.commit = function boundCommit(type, payload, options) {
      return commit.call(store, type, payload, options);
    };

    // strict mode
    this.strict = strict;

    const state = this._modules.root.state; // 根module的state

    // init root module.
    // this also recursively registers all sub-modules
    // and collects all module getters inside this._wrappedGetters
    installModule(this, state, [], this._modules.root);

    // initialize the store vm, which is responsible for the reactivity
    // (also registers _wrappedGetters as computed properties)
    resetStoreVM(this, state);

    // apply plugins， 基本不会管，省略
  }
```

里面有 3 个函数需要重点看下：

- `ModuleCollection`： 由于`Vuex`可以利用`module`来模块化，这个类就是用于帮助我们构建一棵 module tree，每当有一个新 module 都会根据其对应的 path 来决定插入到 tree 的何处。**整个 module tree 不会考虑 module 是否是 namespaced 的，root 对应的是 path 为空数组的那个**

- `installModule`： 与`ModuleCollection`无关，主要用于处理层级 module，**有些 module 会带有`namespaced`属性，此方法会专门进行处理**

- `resetStoreVM`： 核心逻辑是将`_wrappedGetters`挂载到一个内部`store._vm`的`computed`上，然后定义`store.getters`公共`api`供业务代码使用，而`store.getters`其实就是取的`store._vm.computed`，这样就很巧妙的利用了`Vue computed`的懒惰计算了，每个`getter`只有在内部的依赖发生变化时才会重新计算，进而业务代码的相关属性也会享受到懒惰计算的好处。

## ModuleCollection

先看看入口构造函数：

```js
constructor (rawRootModule) {
    this.register([], rawRootModule, false)
  }
```

只有在处理根 module 时会直接调用`new ModuleCollection(options)`，所以只有 root module 的 path 才是空数组，再看看`register`：

```js
  register (path, rawModule, runtime = true) {
    // 一些校验逻辑略去， 检验rawModule中的每个选项类型是否正确,例如检查getters选项中的每一个getter是否都是函数。 其中action可以为函数也可以为对象...

    const newModule = new Module(rawModule, runtime) // 构造一个新的module,其中会设置自己的state
    if (path.length === 0) {
      this.root = newModule // path为空数组时设置树根
    } else {
      const parent = this.get(path.slice(0, -1)) // 获取父module。 get函数按照path在module tree中查找对应module
      parent.addChild(path[path.length - 1], newModule) // 将newModule插入到父module的children中
    }

    // 若还有子module，则循环递归处理
    if (rawModule.modules) {
      forEachValue(rawModule.modules, (rawChildModule, key) => {
        // 注意path的变化，这样所有子module的父module就都是上面的newModule了
        this.register(path.concat(key), rawChildModule, runtime)
      })
    }
  }
```

瞄一眼`Module`的构造函数：

```js
constructor (rawModule, runtime) {
    this.runtime = runtime
    // Store some children item
    this._children = Object.create(null)
    // Store the origin module object which passed by programmer
    this._rawModule = rawModule
    const rawState = rawModule.state

    // Store the origin module's state
    this.state = (typeof rawState === 'function' ? rawState() : rawState) || {}
  }
```

一些内部的帮助函数都很简单这里就不一一说了，**整个`register`的逻辑就是构造一个`module tree`，每个 module 都会设置自己的`state`**，然后会在`installModule`中用到这棵树。

## installModule

这个函数非常核心，看看怎么实现的：

```js
function installModule(store, rootState, path, module, hot) {
  const isRoot = !path.length;
  // 根据path获取拼接的namespace字符串，会考虑沿途的namespaced module
  const namespace = store._modules.getNamespace(path);

  // 注册namespace和module的映射关系
  if (module.namespaced) {
    store._modulesNamespaceMap[namespace] = module;
  }

  // set state
  if (!isRoot && !hot) {
    // 获取path对应的局部state，所有的state也是根据path组成了一棵树
    const parentState = getNestedState(rootState, path.slice(0, -1));
    const moduleName = path[path.length - 1];

    // _withCommit会在执行fn时令_committing为true，然后就会受到enableStrictMode中watch的保护，这样改变state时就不会触发报错
    store._withCommit(() => {
      // 就是在这里，相当于所有的state也是根据path组成了一棵树
      Vue.set(parentState, moduleName, module.state);
    });
  }

  // 以当前module为上下文，定义了dispatch、commit、getters、state.下面会详细说明
  const local = (module.context = makeLocalContext(store, namespace, path));

  // 将module.mutaions添加到store._mutations数组中，会考虑namespace。wrappedMutationHandler中的第2个参数state是local的
  module.forEachMutation((mutation, key) => {
    const namespacedType = namespace + key;
    registerMutation(store, namespacedType, mutation, local);
  });

  // 将module.actions添加store._actions数组中，会考虑namespace，store._actions中的每个函数会统一返回Promise。wrappedActionHandler中每个action前4个参数是local的
  module.forEachAction((action, key) => {
    const type = action.root ? key : namespace + key;
    const handler = action.handler || action;
    registerAction(store, type, handler, local);
  });

  // 将module.getters添加到store._wrappedGetters数组中，会考虑namespace。_wrappedGetters中每个getter前2个参数是local的
  module.forEachGetter((getter, key) => {
    const namespacedType = namespace + key;
    registerGetter(store, namespacedType, getter, local);
  });

  // 递归处理子module，注意path的变化
  module.forEachChild((child, key) => {
    installModule(store, rootState, path.concat(key), child, hot);
  });
}
```

**这个函数做的事情有点多，归纳一下有以下几点：**

- 设置`_modulesNamespaceMap`，这个对象的格式为`{[namespace: string]: Module }`

- 将`module`对应的`state`插入到`state tree`中，`state tree`以`path`为路径，不会考虑`namespaced`的影响

- 将`localContext`挂载到`module.context`上

- 将`module.mutaions`添加到`store._mutations`数组中，会考虑`namespace`。`wrappedMutationHandler`中的第 2 个参数`state`是`local`的

- 将`module.actions`添加`store._actions`数组中，会考虑`namespace`，`store._actions`中的每个函数会统一返回`Promise`。`wrappedActionHandler`中每个`action`前 4 个参数是`local`的

- 将`module.getters`添加到`store._wrappedGetters`数组中，会考虑`namespace`。`_wrappedGetters`中每个`getter`前 2 个参数是`local`的

- 递归处理子`module`

然后有些比较重点的子函数再挨个单独说一下。

### **getNamespace**:

```js
function getNestedState(state, path) {
  return path.length ? path.reduce((state, key) => state[key], state) : state;
}
```

要意识到`path`和`namespace`不是一一对应的，每一段`path`只有在其`namespaced`属性为`true`时才对应一段`namespace`. 例如`path = ['a','b','c','d']`,其中`c`对应的`module`为`namespaced`的，那么最终的`namespace`字符串为 `'c/'`，而不是`'a/b/c/d'`.

### **makeLocalContext**

如上所述，会生成局部`dispatch, commit, getters and state`。

```js
/**
 * make localized dispatch, commit, getters and state
 * if there is no namespace, just use root ones
 */
function makeLocalContext(store, namespace, path) {
  const noNamespace = namespace === ''; // 表示与根module的namespace一致

  const local = {
    dispatch: noNamespace
      ? store.dispatch // 使用全局的dispatch
      : (_type, _payload, _options) => {
          // 处理对象风格的提交方式,生成归一化的type、payload、options，见https://vuex.vuejs.org/zh/guide/mutations.html
          const args = unifyObjectStyle(_type, _payload, _options);
          const { payload, options } = args;
          let { type } = args;

          if (!options || !options.root) {
            type = namespace + type; // 注意这里会处理namespace，生成加长版的type！！！！
            // 校验逻辑...
          }

          return store.dispatch(type, payload);
        },

    commit: noNamespace
      ? store.commit
      : (_type, _payload, _options) => {
          const args = unifyObjectStyle(_type, _payload, _options);
          const { payload, options } = args;
          let { type } = args;

          if (!options || !options.root) {
            type = namespace + type; // 注意这里会处理namespace，生成加长版的type！！！！
            // 校验逻辑...
          }

          store.commit(type, payload, options);
        },
  };

  // getters and state object must be gotten lazily
  // because they will be changed by vm update
  Object.defineProperties(local, {
    getters: {
      // makeLocalGetters在下面会说，主要是生成短链形式的getters子集
      get: noNamespace ? () => store.getters : () => makeLocalGetters(store, namespace),
    },
    state: {
      get: () => getNestedState(store.state, path),
    },
  });

  return local;
}
```

**注意何时一个 module 对应的 namespace 为空？并不是只有根 module 的`namespace`是空串，只要子`module`的`namespaced`属性是空或 false，那么它就不会在`namespace`上贡献自己的力量，而是使用`parent module`的`namespace`。**

全局的`dispatch`和`commit`其实定义在构造函数里，他们均硬绑定了`store`参数

```js
this.dispatch = function boundDispatch(type, payload) {
  return dispatch.call(store, type, payload);
};

this.commit = function boundCommit(type, payload, options) {
  return commit.call(store, type, payload, options);
};
```

- `local`上的`dispatch、commit`在业务代码的调用参数上均和全局的`dispatch`一致，只不过真正执行逻辑时会在`type`上添加上`namespace`前缀，这就是他们的区别。

- `local上`的`getter`也会考虑`namespace`,最后生成的`getters`是快捷键形式的，在业务代码调用时不用写上`namespace`前缀，内部逻辑会帮忙添加。这块是借助`makeLocalGetters`做到的：

```js
// 从所有的getters找到那些key以namespace为前缀的，并生成短链形式的getters子集
function makeLocalGetters(store, namespace) {
  const gettersProxy = {};

  const splitPos = namespace.length;
  // store.getters存放所有的getter，对应的键已经融合了namespace
  Object.keys(store.getters).forEach(type => {
    // 是否以namespace为前缀
    if (type.slice(0, splitPos) !== namespace) return;

    // extract local getter type，提取“短链”形式key
    const localType = type.slice(splitPos);

    // Add a port to the getters proxy.
    // Define as getter property because
    // we do not want to evaluate the getters in this time.
    Object.defineProperty(gettersProxy, localType, {
      get: () => store.getters[type],
      enumerable: true,
    });
  });
  return gettersProxy;
}
```

- `local`上的`state`也是局部的，只不过`state`是基于`path`的，而不会管`namespace`的影响。

### registerMutation

将 module.mutaions 添加到 store.\_mutations 数组中

```js
function registerMutation(store, type, handler, local) {
  const entry = store._mutations[type] || (store._mutations[type] = []);
  // wrappedMutationHandler作用就是通过闭包为真正的mutation绑定参数
  entry.push(function wrappedMutationHandler(payload) {
    handler.call(store, local.state, payload);
  });
}
```

唯一需要注意的地方是第二个参数是`local.state`，而不是`store.state`

### registerAction

```js
function registerAction(store, type, handler, local) {
  const entry = store._actions[type] || (store._actions[type] = []);
  entry.push(function wrappedActionHandler(payload, cb) {
    let res = handler.call(
      store,
      {
        dispatch: local.dispatch,
        commit: local.commit,
        getters: local.getters,
        state: local.state,
        rootGetters: store.getters,
        rootState: store.state,
      },
      payload,
      cb,
    );

    // 令最终的action始终返回Promise
    if (!isPromise(res)) {
      res = Promise.resolve(res);
    }

    // 插件的影响，略去...
    return res;
  });
}
```

与`mutation`类似，真正执行的`action`前 4 个参数均是`local`的，另外经过`wrappedActionHandler`包装的`action`始终会返回`Promise`。

### registerGetter

```js
function registerGetter(store, type, rawGetter, local) {
  // 校验
  store._wrappedGetters[type] = function wrappedGetter(store) {
    return rawGetter(
      local.state, // local state
      local.getters, // local getters
      store.state, // root state
      store.getters, // root getters
    );
  };
}
```

`_wrappedGetters`最大的作用会在`resetStoreVM`中体现出来。

## resetStoreVM

上面提到核心逻辑是将`_wrappedGetters`挂载到一个内部`store._vm`的`computed`上，然后定义`store.getters`公共`api`供业务代码使用。

```js
function resetStoreVM(store, state, hot) {
  const oldVm = store._vm;

  // bind store public getters
  store.getters = {};
  const wrappedGetters = store._wrappedGetters;
  const computed = {};

  // 将所有的wrappedGetters放到Vue.computed上，这样获取
  // getter时实际上是去拿computed，可以懒惰计算
  forEachValue(wrappedGetters, (fn, key) => {
    // use computed to leverage its lazy-caching mechanism
    computed[key] = () => fn(store);
    // store.getters底层利用了_vm的computed，这样只有在依赖改变时才重新计算
    Object.defineProperty(store.getters, key, {
      get: () => store._vm[key],
      enumerable: true, // for local getters
    });
  });

  // use a Vue instance to store the state tree
  // suppress warnings just in case the user has added
  // some funky global mixins
  const silent = Vue.config.silent;
  Vue.config.silent = true; // 置为true可以令实例化Vue时不报警
  // 所有的state和getter都挂载到了Vue实例上
  store._vm = new Vue({
    data: {
      $$state: state,
    },
    computed,
  });
  Vue.config.silent = silent;

  // enable strict mode for new vm
  if (store.strict) {
    // 设置只允许在mutation中改变state
    enableStrictMode(store);
  }

  if (oldVm) {
    if (hot) {
      // dispatch changes in all subscribed watchers
      // to force getter re-evaluation for hot reloading.

      store._withCommit(() => {
        oldVm._data.$$state = null;
      });
    }
    // 销毁旧的store._vm
    Vue.nextTick(() => oldVm.$destroy());
  }
}
```

粗略总结下这个函数做的事情：

- 将`store._wrappedGetters`挂载到`store._vm.computed`上，以此实现响应式`getter`，调用`computed[key]()` 会返回`store._wrappedGetters[key](store)`,也就是`rawGetter(local.state,local.getters, store.state, store.getters)`;

- 将`state`挂载到`store._vm.data.$$state`上

- 设置调用`store.getters[key]`会返回`store._vm[key]`,即`computed`上的值

上面的`enableStrictMode`比较有意思，因为`Vuex`中规定业务方只能通过`mutation`来改变`store`，就是通过这个函数来做到的，**核心是利用一个内部变量，只有在这个变量为 true 时，改变 state 触发的 watch 才不会警告**：

```js
// 观察state是否在_committing之外被改动
function enableStrictMode(store) {
  store._vm.$watch(
    function() {
      return this._data.$$state;
    },
    () => {
      if (process.env.NODE_ENV !== 'production') {
        // 若_committing不为true，报错
        assert(store._committing, `do not mutate vuex store state outside mutation handlers.`);
      }
    },
    { deep: true, sync: true },
  );
}
```

至此，所有 vuex 内部的核心逻辑就全部看完了。接下来看一些`Vuex`的公共 api，了解其内部实现。

# 公共 api

## commit、dispatch

最重要最常用的就是这俩了~~

**commit**

大体是找到所有符合条件的的`mutations`回调然后执行，内部利用`_withCommit`可以受到`enableStrictMode`的豁免。

```js
  commit(_type, _payload, _options) {
    // check object-style commit
    const { type, payload, options } = unifyObjectStyle(_type, _payload, _options);

    const mutation = { type, payload };
    /**
     * 在registerMutation中设置了_mutations：
     *
     *  const entry = store._mutations[type];
        entry.push(function wrappedMutationHandler(payload) {
          handler.call(store, local.state, payload);
        });
     */
    const entry = this._mutations[type];

    // 空校验略去...

    this._withCommit(() => {
      entry.forEach(function commitIterator(handler) {
        /**
         * handler指向上面的
         * function wrappedMutationHandler(payload) {
              handler.call(store, local.state, payload);
            }
        */
        handler(payload); // 调用真正业务方定义的mutaion
      });
    });

    // 调用store.subscribe(fn)时会往_subscribers数组中添加值
    this._subscribers.forEach(sub => sub(mutation, this.state));

    // 校验逻辑略去...
 }
```

**dispatch**

与 commit 类似，大体是找到所有符合条件的的`action`回调然后执行。只不过因为`action`可以执行异步逻辑，这里会使用`Promsie.all`保证所有的`action`全部执行完成再返回结果。

```js
dispatch(_type, _payload) {
    // check object-style dispatch
    const { type, payload } = unifyObjectStyle(_type, _payload);

    const action = { type, payload };
    // 在registerAction中会往store._actions中添加函数
    /**
     * store._actions: {
     *    [type:string]: ((payload,cb) => Promise)[]
     * }
     */
    const entry = this._actions[type]; // 所有符合条件的的`action`

    // 校验逻辑略去。。。

    this._actionSubscribers.forEach(sub => sub(action, this.state));

    return entry.length > 1 ? Promise.all(entry.map(handler => handler(payload))) : entry[0](payload);
  }
```

## registerModule

用于[动态注册 module](https://vuex.vuejs.org/zh/guide/modules.html#%E6%A8%A1%E5%9D%97%E5%8A%A8%E6%80%81%E6%B3%A8%E5%86%8C)，会执行和`Store`构造函数类似的逻辑

```js
registerModule(path, rawModule, options = {}) {
    if (typeof path === 'string') path = [path];

    // 将rawModule加入到整个module tree当中，设置parent和children module
    this._modules.register(path, rawModule);

    installModule(this, this.state, path, this._modules.get(path), options.preserveState);

    // reset store to update getters...
    resetStoreVM(this, this.state);
  }
```

## unregisterModule

用于动态卸载 module。

```js
unregisterModule(path) {
    if (typeof path === 'string') path = [path];

    // 校验逻辑略去。。

    this._modules.unregister(path); // 从module tree中移除此节点

    this._withCommit(() => {
    	// 从state tree中移除此局部state
      const parentState = getNestedState(this.state, path.slice(0, -1));
      Vue.delete(parentState, path[path.length - 1]);
    });
    resetStore(this); // 重置整个store
  }
```

## resetStore

重置整个 store，会重新执行 installModule 和 resetStoreVM.

```js
function resetStore(store, hot) {
  store._actions = Object.create(null);
  store._mutations = Object.create(null);
  store._wrappedGetters = Object.create(null);
  store._modulesNamespaceMap = Object.create(null);
  const state = store.state;
  // init all modules
  installModule(store, state, [], store._modules.root, true);
  // reset vm
  resetStoreVM(store, state, hot);
}
```

## mapXXX 系列

可以猜测到，这些帮助函数主要会利用到闭包来帮助我们处理跟`namespace`相关的琐碎细节。一起挨个看下。其中`mapState`、`mapMutations`、`mapActions`逻辑类似，这里只说其中一个。

### mapState

经过它的处理，会返回一个对象，将`mapState`的参数转换为了 `{[key:string]: ()=> any}`形式的对象,可以直接利用它来当做组件的`computed`

```js
/**
 * Reduce the code which written in Vue.js for getting the state.
 *
 * @param {String} [namespace] - Module's namespace
 * @param {Object|Array} states # Object's item can be a function which accept state and getters for param, you can do something for state and getters in it.
 * @param {Object}
 * @return 返回一个对象，将mapState的参数转换为了 {[key:string]: ()=> any}形式的对象,可以直接利用它来当做组件的computed
 */
// normalizeNamespace：归一化处理参数函数的namespace
export const mapState = normalizeNamespace((namespace, states) => {
  const res = {};

  // normalizeMap: 用于归一化states参数，因为可以使用多种形式
  // normalizeMap([1, 2, 3]) => [ { key: 1, val: 1 }, { key: 2, val: 2 }]
  // normalizeMap({a: 1, b: 2}) => [ { key: 'a', val: 1 }, { key: 'b', val: 2 }]
  normalizeMap(states).forEach(({ key, val }) => {
    res[key] = function mappedState() {
      let state = this.$store.state;
      let getters = this.$store.getters;
      // 若有namespace，则需要找到其对应module.context的局部api
      if (namespace) {
        // 根据获取namespace来store._modulesNamespaceMap的映射
        const module = getModuleByNamespace(this.$store, 'mapState', namespace);
        if (!module) {
          return;
        }
        state = module.context.state; // 局部state
        getters = module.context.getters; // 局部getter
      }
      // val可能是函数或字符串
      return typeof val === 'function' ? val.call(this, state, getters) : state[val];
    };
  });
  return res;
});
```

其中的`normalizeNamespace`函数，经过它的处理后，参数函数会拿到归一化之后的 namespace，`''`或者`'a/b/c/'`

```js
**
 * Return a function expect two param contains namespace and map. it will normalize the namespace and then the param's function will handle the new namespace and the map.
 * @param {Function} fn
 * @return {Function}
 */
function normalizeNamespace(fn) {
	// 这个闭包才是mapState真正本体！！！
  return (namespace, map) => {
    if (typeof namespace !== 'string') {
      map = namespace;
      namespace = '';
    } else if (namespace.charAt(namespace.length - 1) !== '/') {
      namespace += '/';
    }
    return fn(namespace, map);
  };
}
```

### mapGetters

这个函数的大体逻辑和上面是类似的，只不过在细节上有可以说的地方。

```js
/**
 * Reduce the code which written in Vue.js for getting the getters
 * @param {String} [namespace] - Module's namespace
 * @param {Object|Array} getters
 * @return {Object} 返回一个对象，将mapGetters的参数转换为了 {[key:string]: ()=> any}形式的对象,可以直接利用它来当做组件的computed.
 */
export const mapGetters = normalizeNamespace((namespace, getters) => {
  const res = {};
  normalizeMap(getters).forEach(({ key, val }) => {
    // thie namespace has been mutate by normalizeNamespace，
    // mapGetters中的val始终是字符串
    val = namespace + val;
    res[key] = function mappedGetter() {
      // 校验逻辑略去。。。

      // 注意，这里没有使用module的局部getters，而mapState和mapMutations都使用了局部context
      return this.$store.getters[val];
    };
    // mark vuex getter for devtools
    res[key].vuex = true;
  });
  return res;
});
```

上面为什么是`this.$store.getters`和而不是和`mapState`类似的`module.context.getters`呢？

其实也可以那么写，不过要就要去掉上方的`val = namespace + val`了，因为`module.context.getters`是“短链”形式，不记得的看上面的`makeLocalGetters`。

那`this.$store.getters`是在什么时候赋值的呢？主要分为 3 步：

1. 在`installModule`中

```js
module.forEachGetter((getter, key) => {
  const namespacedType = namespace + key; // “长链”形式key
  registerGetter(store, namespacedType, getter, local);
});
```

2. 在`registerGetter`中

```js
store._wrappedGetters[type] = function wrappedGetter(store) {
  return rawGetter(
    local.state, // local state
    local.getters, // local getters
    store.state, // root state
    store.getters, // root getters
  );
};
```

3. 在`resetStoreVM`中设置`store.getters`

```js
forEachValue(wrappedGetters, (fn, key) => {
  computed[key] = () => fn(store);
  // 这里给store.getter赋值
  Object.defineProperty(store.getters, key, {
    get: () => store._vm[key],
    enumerable: true, // for local getters
  });
});
```

**经过这 3 步，`store.getters`就存放了所有"长链"形式 getter。** 那么`mapGetters`中的`this.$store.getters[val]`就很容易理解了。

### createNamespacedHelpers

很简单就是利用闭包绑定`mapXXX`的`namespace`:

```js
export const createNamespacedHelpers = namespace => ({
  mapState: mapState.bind(null, namespace),
  mapGetters: mapGetters.bind(null, namespace),
  mapMutations: mapMutations.bind(null, namespace),
  mapActions: mapActions.bind(null, namespace),
});
```
