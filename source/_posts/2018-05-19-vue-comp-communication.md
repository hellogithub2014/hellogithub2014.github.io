---
title: "vue组件通信小结"
img: canyon.jpg # Add image post (optional)
date: 2018-05-19 12:30:00

tag: [vue]
---

# vue 组件通信小结

# prop + event

最常见的通信方式了，父组件通过`prop`将数据传给子组件，子组件若想将数据回传给父组件，发送`event`即可,如图：

![](/images/vue-comp-communication/prop+event1.png)

举个例子：

**father.component**

```js
Vue.component('father', {
  template: `<child :msg="msg" @update="updateMsg"></child>`,
  data() {
    return {
      msg: 'hello wolrd',
    };
  },
  methods: {
    updateMsg(newMsg) {
      this.msg = newMsg;
    },
  },
});
```

**child.component**

```js
Vue.component('child', {
  template: `<input :value='msg' @input="upperCaseInput($event.target.value)">`,
  props: {
    msg: {
      type: String,
      required: true,
    },
  },
  methods: {
    upperCaseInput(val) {
      this.$emit('update', val.toUpperCase());
    },
  },
});
```

这种方式适用于组件层级较浅的情况，因为不管是`prop`还是`event`都只能在父子组件之间传递，如果组件层级较深，这时传值就会很麻烦：

![](/images/vue-comp-communication/prop+event2.png)

上面的图中，如果`grandfather`想要把数据传给`child`，就必须经过两次`prop`的传递，反之`child`传递数据给`grandfather`也是一样。

这种做法还有一个更深的影响： 它使得组件之间的耦合变得严重，尤其是`father`，它需要知道上下游组件的接口细节，这些都是在其关注点之外的，这让它变得不通用。

# emitter mixin

此方法借鉴的是**BUI**的源码。`prop + event`在传递`event`时存在重复的繁琐细节：必须先把事件传给父组件，然后再由父组件传递给祖父组件，依次类推。父组件其实什么事情也没做，只是单纯的做个『传话员』。

如果可以直接指定任意祖先组件发送事件给其父组件，并带上想要的数据，就节省了很多多余的步骤。如图：

![](/images/vue-comp-communication/emitter mixin.png)

为了使每个组件都有这种能力，借助了`vue`的[mixin](https://cn.vuejs.org/v2/guide/mixins.html),它可以很方便的让组件复用功能。

**具体代码**

```js
const emitter = {
  methods: {
    // 找到指定name的祖先组件，让其发送指定event并携带数据
    dispatch(componentName, eventName, params) {
      let parent = this.$parent || this.$root;
      let { name } = parent.$options;
      while (parent && (!name || name !== componentName)) {
        parent = parent.$parent;
        if (parent) {
          name = parent.$options.name;
        }
      }
      if (parent) {
        parent.$emit(...[eventName].concat(params));
      }
    },
  },
};

Vue.component('grandson', {
  template: `<button @click='emit'>grandson</button>`,
  mixins: [emitter], // mixin
  methods: {
    emit() {
      // use mixin
      this.dispatch('father', 'update', 'TEST EMITTER');
    },
  },
});
```

缺点：这种方式只是缓解了`prop + event`的症状，并没有从根本上解决，只能是一个临时的方案。

# eventBus

在[vue 官网](https://cn.vuejs.org/v2/guide/components.html#%E9%9D%9E%E7%88%B6%E5%AD%90%E7%BB%84%E4%BB%B6%E7%9A%84%E9%80%9A%E4%BF%A1)上提到一种利用`vue`当做事件总线来通信的方法，示意图如下：

![](/images/vue-comp-communication/event-bus.png)

事件总线可以贯穿整个组件树，每个组件都可以利用这根总线进行发布订阅。举个例子：

```js
var eventBus = new Vue();

Vue.component('grandson', {
  template: `<button @click='emit'>grandson</button>`,
  mixins: [emitter],
  mounted() {
    eventBus.$on('gs2', msg => {
      // 订阅
      this.dispatch('father', 'update', msg);
    });
  },
  methods: {
    // ...
  },
});

Vue.component('grandson2', {
  template: `<button @click='emit2'>grandson2</button>`,
  methods: {
    emit2() {
      eventBus.$emit('gs2', 'GS2'); // 发布
    },
  },
});
```

来看看`$emit`和`$on`是怎么实现的：

**Vue.prototype.$emit**

```js
Vue.prototype.$emit = function(event) {
  var vm = this;

  // ... 校验event格式

  var cbs = vm._events[event];
  // 通知所有订阅者
  if (cbs) {
    cbs = cbs.length > 1 ? toArray(cbs) : cbs;
    var args = toArray(arguments, 1);
    for (var i = 0, l = cbs.length; i < l; i++) {
      try {
        cbs[i].apply(vm, args);
      } catch (e) {
        handleError(e, vm, 'event handler for "' + event + '"');
      }
    }
  }
  return vm;
};
```

**Vue.prototype.$on**

```js
Vue.prototype.$on = function(event, fn) {
  var this$1 = this;

  var vm = this;
  if (Array.isArray(event)) {
    for (var i = 0, l = event.length; i < l; i++) {
      this$1.$on(event[i], fn);
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

可以看到`eventBus`其实就是利用观察者模式实现的。

这种方式依然针对的是事件传播，只不过现在它可以在任意组件之间传播事件，而不仅仅局限于具有祖先关系的组件。不过对于`prop`传递繁琐的问题还是没有解决。

# vuex

按照[vuex 官网](https://vuex.vuejs.org/zh-cn/intro.html)的解释：

> 把组件的共享状态抽取出来，以一个全局单例模式管理。在这种模式下，我们的组件树构成了一个巨大的“视图”，不管在树的哪个位置，任何组件都能获取状态或者触发行为。

> 它采用集中式存储管理应用的所有组件的状态，并以相应的规则保证状态以一种可预测的方式发生变化。

示意图：
![](https://vuex.vuejs.org/zh-cn/images/vuex.png)

使用`vuex`很好的解决了上面几种方法的缺点：

- 祖先组件和子组件共享同一份数据，所有组件不再是层层传递`prop`，而是直接和`vuex`打交道
- 也不在需要『逐层冒泡』`event`了，道理同上
- 很好的支持了关注点分离，每个组件只专注于处理关心的数据，不用管这些数据在哪里被用到，这样也提高了可复用性

唯一的缺点是在比较小的应用中会显得累赘，有点杀鸡用牛刀的感觉。
