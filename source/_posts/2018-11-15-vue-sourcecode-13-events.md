---
title: 'Vue源码解析13-事件处理'
summary_img: /images/himalayan.jpg # Add image post (optional)
date: 2018-11-15 21:20:00

tag: [Vue, javascript]
---

到这里为止，Vue 的主要逻辑就已经全部介绍完了。接下来的文章会从其他角度来解析，如事件处理、各个指令的处理等等。先从事件处理开始。

`Vue`的事件处理分为两类：`DOM`事件和自定义事件，二者走的是完全不同的处理流程，不过在处理子组件时，会联系到一起，后面会说到。

# DOM 事件

在模板中通过`@`或`v-on`指令放在元素节点上的，如：

```js
<div id="app">
  <p @click="log">{{msg}}</p>
</div>
<script type="text/javascript">
  var vm = new Vue({
    data: {
      msg: 'ttttt'
    },
    methods: {
      log(){
        console.log(this.msg);
      }
    }
  }).$mount('#app');
</script>
```

对于 DOM 事件的处理会依次经过`compile`、`render`和`patch`几个阶段。

## compile 阶段转为 AST

在模板编译时，对于节点上的各种属性处理，如静态属性、动态绑定属性、事件绑定等都会放到`processAttrs`这个函数中处理，这个函数代码有点多，我只展示关键的逻辑：

```js
function processAttrs(el) {
  // ...
  // v-on，事件绑定
  if (onRE.test(name)) {
    // onRE = /^@|^v-on:/ @或v-on开头
    name = name.replace(onRE, ''); // 获取单纯的事件名
    // 添加事件监听,处理el.nativeEvents或el.events对象，他们的格式为
    /**
     * {
     *    [eventName]: handler | handler[],
     * }，
     * handler格式
     * {
     *    value: string,
     *    modifiers: { [name: string]: true }
     * }
     * 针对不同的内置修饰符，eventName的格式有所不同，如name.once会变成 `~name`
     */
    addHandler(el, name, value, modifiers, false, warn);
  }
  // ...
}
```

`addHandler`会在`el.nativeEvents`或`el.events`对象上添加`handler`属性：

```js
export function addHandler(el: ASTElement, name: string, value: string, modifiers: ?ASTModifiers, important?: boolean, warn?: Function) {
  // modifiers事件修饰符对象，如{ native: true }
  modifiers = modifiers || emptyObject;

  // check capture modifier
  if (modifiers.capture) {
    delete modifiers.capture;
    name = '!' + name; // mark the event as captured
  }
  if (modifiers.once) {
    delete modifiers.once;
    name = '~' + name; // mark the event as once
  }
  /* istanbul ignore if */
  if (modifiers.passive) {
    delete modifiers.passive;
    name = '&' + name; // mark the event as passive
  }

  // normalize click.right and click.middle since they don't actually fire
  // this is technically browser-specific, but at least for now browsers are
  // the only target envs that have right/middle clicks.
  if (name === 'click') {
    if (modifiers.right) {
      name = 'contextmenu'; // 将click.right修改为contextmenu事件
      delete modifiers.right;
    } else if (modifiers.middle) {
      name = 'mouseup'; // 将click.middle修改为mouseup事件
    }
  }

  let events; // 容纳所有事件处理器的包装对象
  if (modifiers.native) {
    delete modifiers.native;
    events = el.nativeEvents || (el.nativeEvents = {});
  } else {
    events = el.events || (el.events = {});
  }

  const newHandler: any = {
    value: value.trim(),
  };
  // 除了上述列举的修饰符，还有其他修饰符
  if (modifiers !== emptyObject) {
    newHandler.modifiers = modifiers;
  }

  const handlers = events[name];
  /* istanbul ignore if */
  if (Array.isArray(handlers)) {
    // 在el上已有多个对此事件的处理器，将所有处理器放到一个数组里
    important ? handlers.unshift(newHandler) : handlers.push(newHandler);
  } else if (handlers) {
    // 在el上已有1个对此事件的处理器
    events[name] = important ? [newHandler, handlers] : [handlers, newHandler];
  } else {
    // 在el上还没有对此事件的处理器
    events[name] = newHandler;
  }

  el.plain = false;
}
```

代码还是不难的，主要分为两步： 先处理函数名，将一些内置修饰符转为函数名中的前缀； 之后将处理函数放到`events`上。

## generate 阶段生成 render 字符串

下一步就到了生成`render`了，在`genData`函数中会处理`el.events`、`el.nativeEvents`,放到`data.on`、`data.nativeOn`上:

```js
export function genData(el: ASTElement, state: CodegenState): string {
  let data = '{';

  // ...

  // event handlers
  /**
   * el.nativeEvents或el.events对象的格式为:
   * {
        [eventName]: handler | handler[],
      }
      handler 格式:
      {
        value: string,
        modifiers: { [name: string]: true }
      }
   */
  if (el.events) {
    data += `${genHandlers(el.events, false, state.warn)},`;
  }
  if (el.nativeEvents) {
    data += `${genHandlers(el.nativeEvents, true, state.warn)},`;
  }

  //...
  return data;
}
```

都是调用的同一个`genHandlers`:

```js
/**
 * events格式：
 *  {
      [eventName]: handler | handler[],
    }
    handler 格式:
    {
      value: string,
      modifiers: { [name: string]: true }
    }
 *
 *
 * 若html为<p @click.foo.bar.left="show">{{text}}</p>，
 * 则返回
 * {
    on: {
      "click": function($event) {
        if ( !( 'button' in $event ) &&
        _k( $event.keyCode, "foo", undefined, $event.key, undefined ) &&
        _k( $event.keyCode, "bar", undefined, $event.key, undefined ) )
          return null;

        return show( $event )
      }
    }
  }
 */
export function genHandlers(events: ASTElementHandlers, isNative: boolean, warn: Function): string {
  let res = isNative ? 'nativeOn:{' : 'on:{';
  for (const name in events) {
    res += `"${name}":${genHandler(name, events[name])},`;
  }
  return res.slice(0, -1) + '}';
}
```

针对`events`中每种类型的事件处理，调用`genHandler`处理`events[name]`，`events[name]`可能是数组也可能是独立对象，取决于`name`是否有多个处理函数。

```js
function genHandler(name: string, handler: ASTElementHandler | Array<ASTElementHandler>): string {
  if (!handler) {
    return 'function(){}';
  }

  if (Array.isArray(handler)) {
    return `[${handler.map(handler => genHandler(name, handler)).join(',')}]`;
  }

  const isMethodPath = simplePathRE.test(handler.value); // 绑定的直接是函数定义，如 @click="()=>test+=1"
  const isFunctionExpression = fnExpRE.test(handler.value); // 绑定的是函数路径，如@click="obj['name']" 或@click="emitData"

  // 没有修饰符
  if (!handler.modifiers) {
    if (isMethodPath || isFunctionExpression) {
      return handler.value;
    }
    // 如果绑定的直接是函数定义，也不是函数路径，那么就是一个内联的表达式了，如@click="test+=1"
    return `function($event){${handler.value}}`; // inline statement
  } else {
    let code = '';
    let genModifierCode = '';
    const keys = [];
    for (const key in handler.modifiers) {
      if (modifierCode[key]) {
        // key为内置修饰符
        genModifierCode += modifierCode[key];
        // left/right
        if (keyCodes[key]) {
          keys.push(key);
        }
      } else if (key === 'exact') {
        // exact修饰符表示有且仅有指定的按键被按下时触发，而不能伴随这4个辅助按键
        const modifiers: ASTModifiers = (handler.modifiers: any);
        // genGuard = condition => `if(${condition})return null;`
        genModifierCode += genGuard(
          ['ctrl', 'shift', 'alt', 'meta']
            .filter(keyModifier => !modifiers[keyModifier])
            .map(keyModifier => `$event.${keyModifier}Key`)
            .join('||'),
        );
      } else {
        keys.push(key);
      }
    }
    if (keys.length) {
      code += genKeyFilter(keys);
    }
    // Make sure modifiers like prevent and stop get executed after key filtering
    if (genModifierCode) {
      code += genModifierCode;
    }
    const handlerCode = isMethodPath ? `return ${handler.value}($event)` : isFunctionExpression ? `return (${handler.value})($event)` : handler.value;

    return `function($event){${code}${handlerCode}}`;
  }
}
```

如果绑定的是函数定义、一个函数路径、没有事件修饰符，处理都很简单。`genModifierCode`用于处理携带修饰符的情形，`modifierCode`生成内置修饰符的处理：

```js
const modifierCode: { [key: string]: string } = {
  stop: '$event.stopPropagation();',
  prevent: '$event.preventDefault();',
  self: genGuard(`$event.target !== $event.currentTarget`),
  ctrl: genGuard(`!$event.ctrlKey`),
  shift: genGuard(`!$event.shiftKey`),
  alt: genGuard(`!$event.altKey`),
  meta: genGuard(`!$event.metaKey`),
  left: genGuard(`'button' in $event && $event.button !== 0`),
  middle: genGuard(`'button' in $event && $event.button !== 1`),
  right: genGuard(`'button' in $event && $event.button !== 2`),
};
```

`keyCodes`是内置按键别名：

```js
// KeyboardEvent.keyCode aliases
const keyCodes: { [key: string]: number | Array<number> } = {
  esc: 27,
  tab: 9,
  enter: 13,
  space: 32,
  up: 38,
  left: 37,
  right: 39,
  down: 40,
  delete: [8, 46],
};
```

`genKeyFilter`用于生成一段过滤的字符串：

```js
// 返回的是一个判断: 不符合一定条件就return null
function genKeyFilter(keys: Array<string>): string {
  return `if(!('button' in $event)&&${keys.map(genFilterCode).join('&&')})return null;`;
}

function genFilterCode(key: string): string {
  const keyVal = parseInt(key, 10);
  if (keyVal) {
    return `$event.keyCode!==${keyVal}`;
  }
  const keyCode = keyCodes[key];
  const keyName = keyNames[key];
  // _k checkKeyCodes函数
  return `_k($event.keyCode,` + `${JSON.stringify(key)},` + `${JSON.stringify(keyCode)},` + `$event.key,` + `${JSON.stringify(keyName)}` + `)`;
}
```

最终我们的函数处理字符串被包裹在`function($event){}`函数体当中。

## patch 阶段添加事件处理到 DOM 上

在`render`函数生成`vnode`期间不会处理生成的函数字符串，之后在`patch`阶段的`invokeCreateHooks`中会调用各个钩子来处理`data`对象上的属性（`data`对象就是我们上面`genData`的返回值），其中就会将`data.on`、`data.nativeOn`上的事件处理函数添加到`DOM`上。在`invokeDestroyHook`中又会卸载`DOM`上的事件处理函数。

```js
function invokeCreateHooks(vnode, insertedVnodeQueue) {
  // 调用每个module的create钩子，一共8个module，见cbs定义处的注释
  for (let i = 0; i < cbs.create.length; ++i) {
    /**
     * 各个子module的create功能：
     * 1. attrs：将新增data.attrs放入vnode.elm，同时移除旧的data.attrs
     * 2. style: 将data.staticStyle/style放入vnode.elm.style，同时移除旧的style
     * 3. class: 将静态class和动态class结合，直接覆盖到vnode.elm.class
     * 4. events：利用新旧vnode的data.on更新vnode.elm的事件处理函数，使用addEventListener/removeEventListener
     * 5. domProps:处理原生dom属性，如textContent、innerHTML、value等，将新的dom属性加到vnode.elm，移除旧的dom属性
     * 6. transition: 略
     * 7. ref: 处理data.ref，令 vnode.context.refs[data.ref] = vnode.elm, 即指向的是原生dom
     * 8. directives: 处理指令，根据不同阶段调用指令的不同钩子，例如新建时调用bind钩子、更新时调用update钩子
     */
    cbs.create[i](emptyNode, vnode);
  }
  // 经过上面的for循环，vnode.data.hook可能会增加各种钩子，如insert或postpatch等
  // 另外自定义组件的data.hook在rendor生成vnode时会挂载4个钩子函数，见componentVNodeHooks
  i = vnode.data.hook; // Reuse variable
  if (isDef(i)) {
    if (isDef(i.create)) i.create(emptyNode, vnode);
    if (isDef(i.insert)) insertedVnodeQueue.push(vnode);
  }
}
```

处理事件的`module`定义在`src/platforms/web/runtime/modules/events.js`的`updateDOMListeners`：

```js
function updateDOMListeners(oldVnode: VNodeWithData, vnode: VNodeWithData) {
  if (isUndef(oldVnode.data.on) && isUndef(vnode.data.on)) {
    return;
  }
  const on = vnode.data.on || {};
  const oldOn = oldVnode.data.on || {};
  target = vnode.elm;
  normalizeEvents(on); // 针对性的处理input[type=range]上的v-model
  // 更新vnode.elm上的事件处理函数
  updateListeners(on, oldOn, add, remove, vnode.context);
  target = undefined;
}
```

此处的`add`、`remove`是两个帮助函数，核心是用`addEventListener`、`removeEventListener`添加事件处理到`DOM`上：

```js
function add(event: string, handler: Function, once: boolean, capture: boolean, passive: boolean) {
  handler = withMacroTask(handler);
  if (once) handler = createOnceHandler(handler, event, capture);
  target.addEventListener(event, handler, supportsPassive ? { capture, passive } : capture);
}

function remove(event: string, handler: Function, capture: boolean, _target?: HTMLElement) {
  (_target || target).removeEventListener(event, handler._withTask || handler, capture);
}
```

`updateListeners`会将`data.on`上新增的事件处理利用`add`添加到`DOM`上，将`oldOn`上的过时的事件处理用`remove`移除掉：

```js
export function updateListeners(on: Object, oldOn: Object, add: Function, remove: Function, vm: Component) {
  let name, def, cur, old, event;
  for (name in on) {
    def = cur = on[name];
    old = oldOn[name];
    event = normalizeEvent(name); // 处理事件名的前缀 ! ~ &,转为 once passive capture标志

    if (isUndef(old)) {
      // 新增的事件处理
      if (isUndef(cur.fns)) {
        cur = on[name] = createFnInvoker(cur);
      }
      // 在vnode.elm上使用addEventListener添加事件
      add(event.name, cur, event.once, event.capture, event.passive, event.params);
    } else if (cur !== old) {
      // 更新的事件处理函数
      old.fns = cur;
      on[name] = old;
    }
  }
  // 遗弃的事件处理函数
  for (name in oldOn) {
    if (isUndef(on[name])) {
      event = normalizeEvent(name);
      // 在vnode.elm上使用removeEventListener添加事件
      remove(event.name, oldOn[name], event.capture);
    }
  }
}
```

上面的`normalizeEvent`就是用来处理在`compile`阶段为函数名添加的各种内置修饰符前缀如`~ ！`等，将他们反向解析会`passive`、`once`等：

```js
const normalizeEvent = cached(
  (
    name: string,
  ): {
    name: string,
    once: boolean,
    capture: boolean,
    passive: boolean,
    handler?: Function,
    params?: Array<any>,
  } => {
    const passive = name.charAt(0) === '&';
    name = passive ? name.slice(1) : name;
    const once = name.charAt(0) === '~'; // Prefixed last, checked first
    name = once ? name.slice(1) : name;
    const capture = name.charAt(0) === '!';
    name = capture ? name.slice(1) : name;
    return {
      name,
      once,
      capture,
      passive,
    };
  },
);
```

以上就是`Vue`对于`DOM`事件的处理流程了，还是比想象中复杂许多的。

# 自定义事件

`Vue`也可以利用`$emit`、`$on`、`$off`、`once`等创建自定义事件，使用方法很简单大家自己去看官网即可。他们的内部实现其实主要也是利用了观察者模式，代码其实挺简单的，挨个看下：

## `$on`

```js
Vue.prototype.$on = function(event: string | Array<string>, fn: Function): Component {
  const vm: Component = this;
  if (Array.isArray(event)) {
    for (let i = 0, l = event.length; i < l; i++) {
      this.$on(event[i], fn);
    }
  } else {
    (vm._events[event] || (vm._events[event] = [])).push(fn);
    // optimize hook:event cost by using a boolean flag marked at registration
    // instead of a hash lookup
    if (hookRE.test(event)) {
      vm._hasHookEvent = true;
    }
  }
  return vm;
};
```

所有的事件监听都会放到`vm`内部的`_events`上，按照事件名进行分类。

## `$once`

```js
Vue.prototype.$once = function(event: string, fn: Function): Component {
  const vm: Component = this;
  function on() {
    vm.$off(event, on);
    fn.apply(vm, arguments);
  }
  on.fn = fn;
  vm.$on(event, on);
  return vm;
};
```

`$once`和`$on`很像，唯一的差别是`$once`在执行完一次后就会利用`$off`卸载掉。

## `$off`

```js
Vue.prototype.$off = function(event?: string | Array<string>, fn?: Function): Component {
  const vm: Component = this;
  // all
  if (!arguments.length) {
    vm._events = Object.create(null);
    return vm;
  }
  // array of events
  if (Array.isArray(event)) {
    for (let i = 0, l = event.length; i < l; i++) {
      this.$off(event[i], fn);
    }
    return vm;
  }
  // specific event
  const cbs = vm._events[event];
  if (!cbs) {
    return vm;
  }
  if (!fn) {
    vm._events[event] = null;
    return vm;
  }
  if (fn) {
    // specific handler
    let cb;
    let i = cbs.length;
    while (i--) {
      cb = cbs[i];
      if (cb === fn || cb.fn === fn) {
        cbs.splice(i, 1);
        break;
      }
    }
  }
  return vm;
};
```

用于卸载一个事件监听，代码虽然看起来挺长，其实就是考虑了多种参数情况而已，可能是卸载全部所有事件处理、卸载指定名称的全部事件处理、卸载指定名称的指定事件处理。

# `$emit`

用于触发事件：

```js
Vue.prototype.$emit = function(event: string): Component {
  const vm: Component = this;

  let cbs = vm._events[event];
  if (cbs) {
    cbs = cbs.length > 1 ? toArray(cbs) : cbs;
    const args = toArray(arguments, 1);
    for (let i = 0, l = cbs.length; i < l; i++) {
      try {
        cbs[i].apply(vm, args);
      } catch (e) {
        handleError(e, vm, `event handler for "${event}"`);
      }
    }
  }
  return vm;
};
```

以上就是自定义事件的全部处理，很简单。

# 自定义组件 DOM 事件

相信大家也看出来了，上面说的`DOM`事件和自定义事件完全没有任何关联。但在处理自定义组件时，貌似又说不通，例如：

```html
<div id="app"><my-component @click="change"></my-component></div>
<script type="text/javascript">
  var vm = new Vue({
    el: '#app',
    methods: {
      change() {
        console.log('change');
      },
    },
    components: {
      myComponent: {
        data() {
          return {
            msg: 'testtesttest',
          };
        },
        template: `<p>{{msg}}</p>`,
      },
    },
  });
</script>
```

我们在`my-component`上添加了一个`DOM`事件，并期望点击时可以出现`log`日志，但实际上`change`事件并没有被调用。

如果我们修改下`template`：

```html
<my-component @click.native="change"></my-component>
```

很神奇此时`log`可以出现。

或者只改写子组件自身的逻辑：

```js
myComponent: {
        data() {
          return {
            msg: 'testtesttest',
          };
        },
        methods: {
          emit(){
            this.$emit('click');
          }
        },
        template: `<p @click="emit">{{msg}}</p>`,
      },
```

不出所料，此时`log`也是可以出现的。

很明显，在处理自定义组件时，`Vue`会做一些处理以将二者联系起来。回顾下我们此前介绍的`Vue`生命周期，最开始处理子组件的地方就是`render`生成`vnode`了。在`src/core/vdom/create-component.js`的`createComponent`方法就是用于生成自定义组件的`vnode`，其中有一段：

```js
export function createComponent(
  Ctor: Class<Component> | Function | Object | void,
  data: ?VNodeData,
  context: Component,
  children: ?Array<VNode>,
  tag?: string,
): VNode | Array<VNode> | void {
  // ...

  // extract listeners, since these needs to be treated as
  // child component listeners instead of DOM listeners
  // 保存的是我们绑定在元素上的事件，且该事件没有加native修饰符
  const listeners = data.on;
  // replace with listeners with .native modifier
  // so it gets processed during parent component patch.
  // 保存的是添加了native修饰符的事件
  data.on = data.nativeOn;

  // ...

  // install component management hooks onto the placeholder node
  installComponentHooks(data);

  // ...

  // return a placeholder vnode
  const name = Ctor.options.name || tag;
  const vnode = new VNode(
    `vue-component-${Ctor.cid}${name ? `-${name}` : ''}`,
    data,
    undefined,
    undefined,
    undefined,
    context,
    { Ctor, propsData, listeners, tag, children }, // 将父组件上的data.on处理放到listeners, 子组件在初始化时会调用initEvents处理
    asyncFactory,
  );

  return vnode;
}
```

看到上面关于事件处理的两句赋值：

```js
const listeners = data.on;
data.on = data.nativeOn;
```

我们`.native`事件处理放到`data.on`上，再将其他事件监听放到`listeners`上，那么再什么时候会处理这两个属性呢？没错，还是在`patch`阶段。

`patch`会在不同时候调用在`vnode.data`上不同的钩子，这些钩子是在`installComponentHooks`方法中被赋值的，主要有 4 个钩子：`init`、`prepatch`、`insert`、`destroy`，他们定义在`src/core/vdom/create-component.js`的`componentVNodeHooks`对象上，只有自定义子组件会拥有这些钩子。

```js
const componentVNodeHooks = {
  init(vnode: VNodeWithData, hydrating: boolean): ?boolean {
    // ...
  },

  prepatch(oldVnode: MountedComponentVNode, vnode: MountedComponentVNode) {
    // ...
  },

  insert(vnode: MountedComponentVNode) {
    // ...
  },

  destroy(vnode: MountedComponentVNode) {
    // ...
  },
};
```

接下来我们看看这些钩子具体在何时调用。

`patch`在初始化的某个时候会调用`createComponent`方法，在这里会调用`init`钩子：

```js
function createComponent(vnode, insertedVnodeQueue, parentElm, refElm) {
  let i = vnode.data;
  if (isDef(i)) {
    const isReactivated = isDef(vnode.componentInstance) && i.keepAlive;
    if (isDef((i = i.hook)) && isDef((i = i.init))) {
      // 执行子组件的init，在componentVNodeHooks中,
      // 会进行$mount，所以之后vnode.componentInstance.$el就会被赋值
      i(vnode, false /* hydrating */);
    }
    // after calling the init hook, if the vnode is a child component
    // it should've created a child instance and mounted it. the child
    // component also has set the placeholder vnode's elm.
    // in that case we can just return the element and be done.
    if (isDef(vnode.componentInstance)) {
      initComponent(vnode, insertedVnodeQueue); // 初始化子组件
      insert(parentElm, vnode.elm, refElm);
      if (isTrue(isReactivated)) {
        reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm);
      }
      return true;
    }
  }
}
```

`init`钩子主要会将子组件挂载到`vnode.elm`上：

```js
init (vnode: VNodeWithData, hydrating: boolean): ?boolean {
    const child = (vnode.componentInstance = createComponentInstanceForVnode(vnode, activeInstance))
    child.$mount(hydrating ? vnode.elm : undefined, hydrating)
},
```

`$mount`操作就又回到了我们很早前将的`Vue`生命周期了，只不过针对子组件会特殊处理`listeners`属性，回顾上我们刚刚说的在子组件`render`时会将`data.on`赋值给`listeners`。处理`listeners`是在`src/core/instance/events.js`的`initEvents`方法：

```js
export function initEvents(vm: Component) {
  vm._events = Object.create(null);
  vm._hasHookEvent = false;
  // init parent attached events
  // 生成vnode时的createComponent方法会将父组件上的data.on处理放到listeners,
  // 在这里子组件会来处理。大体处理是将所有处理函数利用$on放到vm._events上，这样组件自身$emit时就会
  // 在vm._events上找到父组件传入的处理函数。
  // 要注意的是： 即使父组件的处理函数传给了子组件，但每个处理函数的this仍然是父组件，因为已经经过了bind操作
  const listeners = vm.$options._parentListeners;
  if (listeners) {
    updateComponentListeners(vm, listeners);
  }
}
```

`updateComponentListeners`底层依然调用的是`updateListeners`，这与我们此前说`DOM`事件处理时调用的是同一个函数，不同的是`add`和`remove`参数：

```js
function add(event, fn, once) {
  if (once) {
    target.$once(event, fn);
  } else {
    target.$on(event, fn);
  }
}

function remove(event, fn) {
  target.$off(event, fn);
}

export function updateComponentListeners(vm: Component, listeners: Object, oldListeners: ?Object) {
  target = vm;
  updateListeners(listeners, oldListeners || {}, add, remove, vm);
  target = undefined;
}
```

`target`是子组件的`vm`，`listeners`是父组件`template`中定义在子组件标签上的事件处理函数。我们的`add`和`remove`在这里其实利用的是`$on/$once`和`$off`，而不是`addEventListeners`和`removeEventListeners`。

所以真相大白了：**父组件针对子组件的非`native`事件监听函数，其实最后是传到了子组件内部的自定义事件处理流程中，只不过这些函数已经绑定了父组件的`this`。**

那么`native`事件呢？

在`patch`中调用完子组件的`init`钩子后，会继续调用`initComponent`函数：

```js
function initComponent(vnode, insertedVnodeQueue) {
  vnode.elm = vnode.componentInstance.$el;
  if (isPatchable(vnode)) {
    // 此时vnode是子组件的vnode如vue-component-1-my-component，同时vnode.elm指向子组件的根元素，
    // 所以在经过invokeCreateHooks的8个钩子处理后，会将vnode.data上的
    // 各种属性都放到vnode.elm上，比如class、style、data.on
    invokeCreateHooks(vnode, insertedVnodeQueue);
    setScope(vnode); // 尝试为vnode.elm添加scopeId attribute
  }
}
```

我们的`native`事件在生成`vnode`时被放到了`data.on`上，在`invokeCreateHooks`中就会被处理：`events`这个子`module`会将`data.on`上的事件处理函数放到`vnode.elm`也就是子组件的根元素上，底层用的是`addEventListener/removeEventListener`，具体请看此前讲解`patch`处理的文章。

这样我们就知道了：**父组件放到子组件标签上的`native`事件处理，其实最后还是放到了子组件的根元素上，这样当子组件中的元素节点触发事件时，就会冒泡到子组件根元素上，事件得到处理。事件处理函数的`this`依然事先就被绑定到了父组件的`vm`上。**
