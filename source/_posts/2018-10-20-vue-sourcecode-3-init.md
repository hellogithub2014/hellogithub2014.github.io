---
title: 'Vue源码解析3-初始化流程'
summary_img: /images/canyon.jpg # Add image post (optional)
date: 2018-10-20 12:20:00

tag: [Vue, javascript]
---

从`_init`函数出发可以慢慢追溯到整个`Vue`的生命周期，这篇文章主要是记录每一步大致都干了些什么事。

先直接看看`_init`的代码：

```js
Vue.prototype._init = function(options?: Object) {
  const vm: Component = this;
  // a uid
  vm._uid = uid++;

  // a flag to avoid this being observed
  vm._isVue = true;
  // merge options
  if (options && options._isComponent) {
    // optimize internal component instantiation
    // since dynamic options merging is pretty slow, and none of the
    // internal component options needs special treatment.
    initInternalComponent(vm, options);
  } else {
    // mergeOptions就是Vue.mixin中所用的，在前面文章有专门描述
    vm.$options = mergeOptions(resolveConstructorOptions(vm.constructor), options || {}, vm);
  }
  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production') {
    initProxy(vm);
  } else {
    vm._renderProxy = vm;
  }
  // expose real self
  vm._self = vm;
  initLifecycle(vm);
  initEvents(vm);
  initRender(vm);
  callHook(vm, 'beforeCreate');
  initInjections(vm); // resolve injections before data/props
  initState(vm);
  initProvide(vm); // resolve provide after data/props
  callHook(vm, 'created');

  if (vm.$options.el) {
    vm.$mount(vm.$options.el);
  }
};
```

上面的代码基本都是来操作 vm 的，给它添加各种成员，光在脑海里想太抽象了，最好拿一个简单的例子跑一下，然后每一步打断点看看 vm 的变化。例如如下的简单代码：

```js
	<div id="app">
    <p>{{message}}~~</p>
  </div>

  <script type="text/javascript">
    var vm = new Vue( {
      el: '#app',
      data: {
        message: '第一个vue实例'
      }
    } )
  </script>
```

# resolveConstructorOptions

用于合并构造器及构造器父级上定义的`options`。

```js
function resolveConstructorOptions(Ctor: Class<Component>) {
  let options = Ctor.options;
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super); // 父级构造器的选项
    const cachedSuperOptions = Ctor.superOptions;
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions;
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor);
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions);
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions);
      if (options.name) {
        options.components[options.name] = Ctor;
      }
    }
  }
  return options;
}
```

我们的测试代码中没有父构造器，这里直接返回`Ctor.options`。打印一下它：

```js
{
	components: {
		KeepAlive,
		Transition,
		TransitionGroup
	},
	directives:{
		model,
		show
	},
	filters:{},
	_base: Vue,

}
```

随后调用`mergeOptions`之后，会把我们`new Vue`是传入的选项合并进去，打印一下 merge 之后的结果：

```js
{
	components: {
		KeepAlive,
		Transition,
		TransitionGroup
	},
	directives:{
		model,
		show
	},
	filters:{},
	_base: Vue,
	el: '#app',
	data: function mergedInstanceDataFn(){}
}
```

可以看到添加了 2 个属性，正好是我们传给 Vue 的成员。

# initLifecycle

给 vm 添加`$parent`、`$root`、`$children`、`$refs`等属性。

```js
function initLifecycle(vm: Component) {
  const options = vm.$options;

  // locate first non-abstract parent
  let parent = options.parent;

  // 跳过抽象的父级组件
  if (parent && !options.abstract) {
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent;
    }
    parent.$children.push(vm);
  }

  vm.$parent = parent;
  vm.$root = parent ? parent.$root : vm;

  vm.$children = [];
  vm.$refs = {};

  vm._watcher = null;
  vm._inactive = null;
  vm._directInactive = false;
  vm._isMounted = false;
  vm._isDestroyed = false;
  vm._isBeingDestroyed = false;
}
```

抽象组件比如`keep-alive`、`transition`等,所有的子组件`$root`都指向顶级组件.

# initEvents

初始化事件相关的属性，`_parentListeners`是父组件中绑定在自定义标签上的事件，供子组件处理。

```js
function initEvents(vm: Component) {
  vm._events = Object.create(null);
  vm._hasHookEvent = false;
  // init parent attached events
  const listeners = vm.$options._parentListeners;
  if (listeners) {
    updateComponentListeners(vm, listeners);
  }
}

function updateComponentListeners(vm: Component, listeners: Object, oldListeners: ?Object) {
  target = vm;
  updateListeners(listeners, oldListeners || {}, add, remove, vm);
  target = undefined;
}

function updateListeners(on: Object, oldOn: Object, add: Function, remove: Function, vm: Component) {
  let name, def, cur, old, event;
  for (name in on) {
    def = cur = on[name];
    old = oldOn[name];
    event = normalizeEvent(name);

    if (isUndef(cur)) {
      // warning...
    } else if (isUndef(old)) {
      // 新增的事件监听
      if (isUndef(cur.fns)) {
        cur = on[name] = createFnInvoker(cur);
      }
      add(event.name, cur, event.once, event.capture, event.passive, event.params);
    } else if (cur !== old) {
      // 更新了事件监听
      old.fns = cur;
      on[name] = old;
    }
  }

  // 移除不用的事件监听
  for (name in oldOn) {
    if (isUndef(on[name])) {
      event = normalizeEvent(name);
      remove(event.name, oldOn[name], event.capture);
    }
  }
}
```

我们暂时还没有添加监听器，所以上面的处理会被跳过。

# initRender

给 vm 添加`$slots`、`$scopeSlots`、`_c`、`$createElement`、`$attrs`、`$listeners`等属性；

```js
function initRender(vm: Component) {
  vm._vnode = null; // the root of the child tree
  vm._staticTrees = null; // v-once cached trees
  const options = vm.$options;
  const parentVnode = (vm.$vnode = options._parentVnode); // the placeholder node in parent tree
  const renderContext = parentVnode && parentVnode.context;
  vm.$slots = resolveSlots(options._renderChildren, renderContext);
  vm.$scopedSlots = emptyObject;
  // bind the createElement fn to this instance
  // so that we get proper render context inside it.
  // args order: tag, data, children, normalizationType, alwaysNormalize
  // internal version is used by render functions compiled from templates
  vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false);
  // normalization is always applied for the public version, used in
  // user-written render functions.
  vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true);

  // $attrs & $listeners are exposed for easier HOC creation.
  // they need to be reactive so that HOCs using them are always updated
  const parentData = parentVnode && parentVnode.data;

  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production') {
    defineReactive(
      vm,
      '$attrs',
      (parentData && parentData.attrs) || emptyObject,
      () => {
        !isUpdatingChildComponent && warn(`$attrs is readonly.`, vm);
      },
      true,
    );
    defineReactive(
      vm,
      '$listeners',
      options._parentListeners || emptyObject,
      () => {
        !isUpdatingChildComponent && warn(`$listeners is readonly.`, vm);
      },
      true,
    );
  } else {
    defineReactive(vm, '$attrs', (parentData && parentData.attrs) || emptyObject, null, true);
    defineReactive(vm, '$listeners', options._parentListeners || emptyObject, null, true);
  }
}
```

`_c`和`createElement`是与虚拟 dom 相关的，`$slots`和`$scopedSlots`和 slot 相关，他们的具体逻辑先略过。

其中`$attrs`和`$listeners`通过`defineReactive`设置.

## defineReactive

它就是 Vue 的响应式核心代码，用到了我们熟知的`Object.defineProperty`来重写属性值的`getter`和`setter`。 具体逻辑见代码注释。

```js
function defineReactive(obj: Object, key: string, val: any, customSetter?: ?Function, shallow?: boolean) {
  const dep = new Dep();

  const property = Object.getOwnPropertyDescriptor(obj, key);
  // configurable为false是不允许修改属性描述符的
  if (property && property.configurable === false) {
    return;
  }

  // cater for pre-defined getter/setters
  const getter = property && property.get; // 缓存原始的getter和setter
  const setter = property && property.set;
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key];
  }
  // observe会深入到val每个成员中，对每个key-value调用defineReactive，最后返回Observer对象
  let childOb = !shallow && observe(val);
  // 重写getter和setter
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter() {
      const value = getter ? getter.call(obj) : val;
      // Dep.target是一个Watcher对象
      if (Dep.target) {
        dep.depend(); // 让dep和Dep.target互相“关注”，互相收集依赖
        if (childOb) {
          childOb.dep.depend(); // childOb.dep和Dep.target互相“关注”
          if (Array.isArray(value)) {
            // value数组的每个元素与Dep.target互相“关注”
            dependArray(value);
          }
        }
      }
      return value;
    },
    set: function reactiveSetter(newVal) {
      const value = getter ? getter.call(obj) : val;
      // 值没有改变或者NaN时，不会触发setter
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return;
      }

      if (setter) {
        setter.call(obj, newVal); // 调用原始setter进行属性值修改
      } else {
        val = newVal;
      }
      childOb = !shallow && observe(newVal); // 观测newVal，为其收集依赖
      dep.notify(); // 通知dep的所有watcher执行update逻辑
    },
  });
}
```

核心逻辑还是利用 Dep 和 Watcher 这两个类来收集依赖，同时用到了观察者设计模式。

# callHook

用来调用 vm 特定的生命周期钩子。

```js
export function callHook(vm: Component, hook: string) {
  // #7573 disable dep collection when invoking lifecycle hooks
  // pushTarget参数为undefined，可以令全局的Dep.target为空，这样就关闭了依赖收集
  pushTarget();
  const handlers = vm.$options[hook]; // 可能一个钩子有多个处理函数
  if (handlers) {
    for (let i = 0, j = handlers.length; i < j; i++) {
      try {
        handlers[i].call(vm);
      } catch (e) {
        handleError(e, vm, `${hook} hook`);
      }
    }
  }
  if (vm._hasHookEvent) {
    vm.$emit('hook:' + hook);
  }
  popTarget(); // 恢复Dep.target
}
```

上面的`vm.$options[hook]`是在什么时候被赋值的呢？ 其实也是在`_init`的

```js
vm.$options = mergeOptions(resolveConstructorOptions(vm.constructor), options || {}, vm);
```

比如我们设置了`beforeCreate`钩子，那么`options`中就会有这个成员函数。那么生命周期钩子的合并策略是怎样的呢？ 在`options.js`中已经定义好了：

```js
/**
 * Hooks and props are merged as arrays.
 */
function mergeHook(parentVal: ?Array<Function>, childVal: ?Function | ?Array<Function>): ?Array<Function> {
  return childVal ? (parentVal ? parentVal.concat(childVal) : Array.isArray(childVal) ? childVal : [childVal]) : parentVal;
}

LIFECYCLE_HOOKS.forEach(hook => {
  strats[hook] = mergeHook;
});

export const LIFECYCLE_HOOKS = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'beforeDestroy',
  'destroyed',
  'activated',
  'deactivated',
  'errorCaptured',
];
```

可以很容易看出来所有同名钩子回调都会合并到一个数组中。

# initInjections、initProvide

用于解析`inject`和`provide`选项的，这俩可能有些人不知道，在[官网教程中](https://cn.vuejs.org/v2/api/#provide-inject)有描述.

```js
export function initProvide(vm: Component) {
  const provide = vm.$options.provide;
  if (provide) {
    vm._provided = typeof provide === 'function' ? provide.call(vm) : provide;
  }
}

export function initInjections(vm: Component) {
  const result = resolveInject(vm.$options.inject, vm);
  if (result) {
    // result[key]不是响应式的，defineReactive中的obseve会跳过
    toggleObserving(false);
    Object.keys(result).forEach(key => {
      defineReactive(vm, key, result[key]);
    });
    toggleObserving(true);
  }
}
```

`resolveInject`用于归一化`inject`，并找到每个`inject`成员在祖先组件中对应的`provide`。最终每个解析到的`inject`都是直接放到 vm 上。

## initState

处理`props`、`methods`、`data`、`computed`、`watch`，将他们统统挂载到 vm 上.

```js
function initState(vm: Component) {
  vm._watchers = [];
  const opts = vm.$options;
  if (opts.props) initProps(vm, opts.props);
  if (opts.methods) initMethods(vm, opts.methods);
  if (opts.data) {
    initData(vm);
  } else {
    observe((vm._data = {}), true /* asRootData */);
  }
  if (opts.computed) initComputed(vm, opts.computed);
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch);
  }
}
```

这里对数据的操作很多，如果没有耐心，可直接跳过看看处理完之后 vm 的变化，在我们的例子中,我列出了一部分：

```js
{
  $attrs:{},
  $children:[],
  $createElement: f(a,b,c,d),
  $listeners:{},
  $options: {
    components: {
      KeepAlive,
      Transition,
      TransitionGroup,
    },
    data:mergedInstanceDataFn,
    directives: {
      model,
      show,
    },
    filters:{},
    el: '#app',
    _base: Vue
  },
  $parent: undefined,
  $refs:{},
  $root: vm,
  $scopedSlots:{},
  $slots:{},
  $vnode:undefined,
  message: "第一个vue实例",
  _c: ƒ( a, b, c, d ),
  _data: { __ob__: Observer },
  _isMounted: false,
  _uid: 0
  _vnode: null
  _watcher: null
  _watchers: []
}
```

# \$mount

经过我们上篇文章，我们已经知道，`vm.$mount`真正的定义是在`entry-runtime-with-compiler.js`中。

```js
const mount = Vue.prototype.$mount;
Vue.prototype.$mount = function(el?: string | Element, hydrating?: boolean): Component {
  el = el && query(el);

  // 一些warning判断...

  const options = this.$options;
  // resolve template/el and convert to render function
  // 如果没有定义render函数，那么从我们的options中获取template
  if (!options.render) {
    let template = options.template;
    if (template) {
      if (typeof template === 'string') {
        if (template.charAt(0) === '#') {
          template = idToTemplate(template);
          // 一些warning判断...
        }
      } else if (template.nodeType) {
        template = template.innerHTML;
      } else {
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this);
        }
        return this;
      }
    } else if (el) {
      template = getOuterHTML(el);
    }

    // 拿到warning后，将template编译成render函数
    if (template) {
      // compileToFunctions调用的是src/compiler/to-function.js中的compileToFunctions
      const { render, staticRenderFns } = compileToFunctions(
        template,
        {
          shouldDecodeNewlines,
          shouldDecodeNewlinesForHref,
          delimiters: options.delimiters,
          comments: options.comments,
        },
        this,
      );
      options.render = render;
      options.staticRenderFns = staticRenderFns;
    }
  }
  return mount.call(this, el, hydrating);
};
```

## compileToFunctions

他就是 Vue 模板编译器的入口了，完成之后返回的`render`和`staticRenderFns`，前者用于生成 vnode，后者专门用于渲染纯静态节点。

`compileToFunctions`的生成逻辑有点绕，核心处理逻辑最后是在`src/compiler/index.js`，含有 3 个核心步骤：

```js
// `createCompilerCreator` allows creating compilers that use alternative
// parser/optimizer/codegen, e.g the SSR optimizing compiler.
// Here we just export a default compiler using the default parts.
export const createCompiler = createCompilerCreator(function baseCompile(template: string, options: CompilerOptions): CompiledResult {
  // 第一步，将template编译成AST
  const ast = parse(template.trim(), options);
  if (options.optimize !== false) {
    // 第二步：优化静态节点的处理
    optimize(ast, options);
  }
  // 第三步，根据AST生成render和staticRenderFns
  const code = generate(ast, options);
  return {
    ast,
    render: code.render,
    staticRenderFns: code.staticRenderFns,
  };
});
```

每一步的具体逻辑我们以后的文章专门再讲，逻辑很多。不过我们可以先打断点看看每一步生成的结果，为了生成一个 staticRenderFns，需要有纯静态节点，我们将测试代码`template`稍作修改：

```js
<div id="app">
  <p>
    这是
    <span>静态内容</span>
  </p>
  <p>{{ message }}</p>
</div>
```

**第一步 parse 生成的 AST 为：**

```js
var ast = {
  attrs: [
    {
      name: 'id',
      value: 'app',
    },
  ],
  attrList: [
    {
      name: 'id',
      value: 'app',
    },
  ],
  attrsMap: {
    id: 'app',
  },
  children: [
    {
      attrsList: [],
      attrsMap: {},
      children: [
        {
          text: '这是',
          type: 3,
        },
        {
          attrsList: [],
          attrsMap: {},
          children: [
            {
              text: '静态内容',
              type: 3,
            },
          ],
          parent: {
            plain: true, // 这里的plain为true
            tag: 'p',
            type: 1,
            // 父级p元素各种其他ast属性。。
          },
          plain: true, // 这里的plain为true
          tag: 'span',
          type: 1,
        },
      ],
      plain: true, // 这里的plain为true
      tag: 'p',
      type: 1,
      parent: {
        plain: false,
        tag: 'div',
        type: 1,
        // div#app的各种其他ast属性...
      },
    },
    {
      text: ' ',
      type: 3,
    },
    {
      attrsList: [],
      attrsMap: {},
      children: [
        {
          expression: '_s(message)',
          text: '{{message}}',
          tokens: [
            {
              '@binding': 'message',
            },
          ],
          type: 2,
        },
      ],
      parent: {
        plain: false,
        tag: 'div',
        type: 1,
        // div#app的各种其他ast属性...
      },
      plain: true,
      tag: 'p',
      type: 1,
    },
  ],
  parent: undefined,
  plain: false,
  tag: 'div',
  type: 1,
};
```

**第二步 optimize 之后的结果：**

```js
var ast = {
  attrs: [
    {
      name: 'id',
      value: 'app',
    },
  ],
  attrList: [
    {
      name: 'id',
      value: 'app',
    },
  ],
  attrsMap: {
    id: 'app',
  },
  children: [
    {
      attrsList: [],
      attrsMap: {},
      children: [
        {
          text: '这是',
          type: 3,
          static: true,
        },
        {
          attrsList: [],
          attrsMap: {},
          children: [
            {
              text: '静态内容',
              type: 3,
              static: true,
            },
          ],
          parent: {
            plain: true, // 这里的plain为true
            tag: 'p',
            type: 1,
            // 父级p元素各种其他ast属性。。
          },
          plain: true, // 这里的plain为true
          static: true,
          tag: 'span',
          type: 1,
        },
      ],
      plain: true, // 这里的plain为true
      static: true,
      staticInFor: false,
      staticRoot: true,
      tag: 'p',
      type: 1,
      parent: {
        plain: false,
        tag: 'div',
        type: 1,
        // div#app的各种其他ast属性...
      },
    },
    {
      text: ' ',
      type: 3,
      static: true,
    },
    {
      attrsList: [],
      attrsMap: {},
      children: [
        {
          expression: '_s(message)',
          text: '{{message}}',
          tokens: [
            {
              '@binding': 'message',
            },
          ],
          type: 2,
          static: false,
        },
      ],
      parent: {
        plain: false,
        tag: 'div',
        type: 1,
        // div#app的各种其他ast属性...
      },
      plain: true, // 这里的plain为true,
      static: false,
      staticRoot: false,
      tag: 'p',
      type: 1,
    },
  ],
  parent: undefined,
  plain: false,
  static: false,
  staticRoot: false,
  tag: 'div',
  type: 1,
};
```

主要是给各种 ast 节点添加上`static`、`staticRoot`、`staticInFor`以标记是否为静态 ast，文字和纯静态 dom 节点的`static`都为 true。

**第三步 generate 生成的 render 和 staticRenderFns 为：**

```js
var render = `
	with (this) {
	  return _c(
	    'div',
	    {
	      attrs: { id: 'app' },
	    },
	    [_m(0), _v(' '), _c('p', [_v(_s(message))])],
	  );
	}
`;

var staticRenderFns = [
  `
		with (this) {
		  return _c('p', [_v('这是'), _c('span', [_v('静态内容')])]);
		}
	`,
];
```

注意`render`和`staticRenderFns`的内容在这里都还只是字符串形式，经过`compileToFunctions`的处理会变成真正的匿名函数。

`_c`是`(a, b, c, d) => createElement(vm, a, b, c, d, false)`。

我们简单说一下`createElement`干了什么。`a`是要创建的标签名，这里是`div`。接着`b`是`data`，也就是模板解析时，添加到`div`上的属性等。`c`是子元素数组，所以这里又调用了`_c`来创建一个`p`标签。

`_v`是`createTextVNode`，也就是创建一个文本结点。`_s`是`_toString`，也就是把`message`转换为字符串，在这里，因为有`with(this)`，所以`message`传入的就是我们`data`中定义的第一个`vue`实例。

## mount

拿到`render`和`staticRenderFns`后，会调用`mount`，它的真正代码放在了`src/core/instance/lifecycle.js`的`mountComponent`中：

```js
function mountComponent(vm: Component, el: ?Element, hydrating?: boolean): Component {
  vm.$el = el;

  callHook(vm, 'beforeMount');

  let updateComponent;

  updateComponent = () => {
    vm._update(vm._render(), hydrating);
  };

  // we set this to vm._watcher inside the watcher's constructor
  // since the watcher's initial patch may call $forceUpdate (e.g. inside child
  // component's mounted hook), which relies on vm._watcher being already defined
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
  hydrating = false;

  // manually mounted instance, call mounted on self
  // mounted is called for render-created child components in its inserted hook
  if (vm.$vnode == null) {
    vm._isMounted = true;
    callHook(vm, 'mounted');
  }
  return vm;
}
```

大体做了几件事：

1. 调用`beforeMount`钩子
2. 调用`vm._render`生成 vnode
3. 调用`vm._update`,传入 vnode
4. 调用`vm.__patch__`
5. 调用`mounted`钩子

### Watcher

看到在`mountComponent`中还生成了一个`Watcher`对象，会绑定在 vm.\_watcher 上。 Watcher 的构造函数看看长什么样：

```js
  constructor (vm: Component, expOrFn: string | Function, cb: Function, options?: ?Object, isRenderWatcher?: boolean) {
    this.vm = vm
    if (isRenderWatcher) {
      vm._watcher = this
    }
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
      // 一些warning判断。。
    }
    this.value = this.lazy ? undefined : this.get()
  }
```

最后的`this.get()`会把我们在`mountComponent`中会把传入的`updateComponent`调用一次，这样我们的`_update`和`_render`才会被执行。

### vm.\_render

会利用我们的 render 函数生成 vnode：

```js
Vue.prototype._render = function(): VNode {
  const vm: Component = this;
  const { render, _parentVnode } = vm.$options;

  // reset _rendered flag on slots for duplicate slot check
  if (process.env.NODE_ENV !== 'production') {
    for (const key in vm.$slots) {
      // $flow-disable-line
      vm.$slots[key]._rendered = false;
    }
  }

  if (_parentVnode) {
    vm.$scopedSlots = _parentVnode.data.scopedSlots || emptyObject;
  }

  // set parent vnode. this allows render functions to have access
  // to the data on the placeholder node.
  vm.$vnode = _parentVnode;
  // render self
  let vnode;

  vnode = render.call(vm._renderProxy, vm.$createElement);

  // set parent
  vnode.parent = _parentVnode;
  return vnode;
};
```

可以看到核心的`render.call(vm._renderProxy, vm.$createElement)`，跟我们自己写`render`很像，也是有一个`$createElement`参数。

### vm.\_update

在这一步之前，页面的 dom 还没有真正渲染.

如果是初始化，则会把 vnode 渲染到页面中；如果是页面更新，则会执行新旧 vnode 的对比，即著名的`patch`算法，将修改的部分更新到页面。

```js
Vue.prototype._update = function(vnode: VNode, hydrating?: boolean) {
  const vm: Component = this;
  const prevEl = vm.$el;
  const prevVnode = vm._vnode;
  const prevActiveInstance = activeInstance;
  activeInstance = vm;
  vm._vnode = vnode;
  // Vue.prototype.__patch__ is injected in entry points
  // based on the rendering backend used.
  if (!prevVnode) {
    // initial render
    vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */);
  } else {
    // updates
    vm.$el = vm.__patch__(prevVnode, vnode);
  }
  activeInstance = prevActiveInstance;
  // update __vue__ reference
  if (prevEl) {
    prevEl.__vue__ = null;
  }
  if (vm.$el) {
    vm.$el.__vue__ = vm;
  }
  // if parent is an HOC, update its $el as well
  if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
    vm.$parent.$el = vm.$el;
  }
  // updated hook is called by the scheduler to ensure that children are
  // updated in a parent's updated hook.
};
```

上面的`__patch__`就会执行我们的初始化或 diff 过程，后续会专门来说。

# 小结

粗略的总结一下 Vue 在初始化时都干了些什么：

1. 合并构造器及构造器父级上定义的 options。
2. 给 vm 添加$parent、$root、$children、$refs 等属性
3. 给 vm 添加$slots、$scopeSlots、\_c、$createElement、$attrs、\$listeners 等属性
4. 调用`beforeCreate`钩子
5. 解析 inject，将拿到的值放到 vm 上
6. 处理 props、methods、data、computed、watch.，将他们统统挂载到 vm 上
7. 解析 provide
8. 调用`created`钩子
9. 编译`template`，拿到`render`函数
10. 调用`beforeMount`钩子
11. 调用`render`获取`vnode`
12. 调用`patch`创建真实 dom 并渲染到页面
13. 调用`mounted`钩子
