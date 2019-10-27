---
title: rrweb源码解析1
date: 2019-10-27 21:38:13
summary_img: /images/himalayan.jpg
tags: [JavaScript]
---

之前的文章有简单介绍[`rrweb`的底层设计](https://hellogithub2014.github.io/2019/10/27/rrweb-inernal-design/#more)，这篇文章开始会记录`rrweb`的源码。`rrweb`的源码由3个仓库组成：

1. [`rrweb-snapshot`](https://github.com/rrweb-io/rrweb-snapshot): 包含 `snapshot` 和 `rebuild` 功能。`snapshot` 用于将 `DOM` 及其状态转化为可序列化的数据结构；`rebuild` 则是将 `snapshot` 记录的数据结构重建为对应的 `DOM`。
2. [`rrweb`](https://github.com/rrweb-io/rrweb)： 包含 `record` 和 `replay` 两个功能。`record` 用于记录 `DOM` 中的所有变更（`mutation`）；`replay` 则是将记录的变更按照对应的时间一一重放。
3. [`rrweb-player`](https://github.com/rrweb-io/rrweb-player)：为 `rrweb` 提供一套 `UI` 控件，提供基于 `GUI` 的暂停、快进、拖拽至任意时间点播放等功能。

本文是第一篇，记录学习第2个仓库`rrweb`的笔记。

# `record`

用于记录 `DOM` 中的所有变更（`mutation`），包括初始时的一次全量`DOM`序列化，以及后续的增量变更。它最核心的是`record`函数，内部的主要代码如下：

```js

function record(options: recordOptions = {}): listenerHandler | undefined {
  const {
    emit,
    checkoutEveryNms,
    checkoutEveryNth,
    blockClass = 'rr-block',
    ignoreClass = 'rr-ignore', // 如果元素包含这个类，不会被记录
    inlineStylesheet = true,
    maskAllInputs = false,
    hooks,
  } = options;

  // 全量DOM序列化
  function takeFullSnapshot(isCheckout = false) {
    // ...
  }

  const handlers: listenerHandler[] = [];

  const init = () => {
      takeFullSnapshot();

      handlers.push(
        // 记录增量变更
        initObservers(
          {
            mutationCb: m => /* 利用MutaionObserver记录DOM变更，如节点增加/删除、属性变更、文本变更 */,
            mousemoveCb: (positions, source) => /* 记录鼠标移动 */,
            mouseInteractionCb: d => /* 记录鼠标交互，如点击、双击 */,
            scrollCb: p => /* 记录页面滚动 */,
            viewportResizeCb: d => /* 记录视口尺寸变更 */,
            inputCb: v => /* 记录input元素的各种值变动，会考虑各种type的input */,
            blockClass, // 默认是'rr-block'
            ignoreClass,  // 默认是'rr-ignore'
            maskAllInputs, // 默认false
            inlineStylesheet, // 默认true
          },
          hooks,
        ),
      );
    };

    init();

    // 执行返回的函数，会停止记录页面变更
    return () => {
      handlers.forEach(h => h());
    };
}
```

`record`函数内部，`takeFullSnapshot`用于记录全量`DOM`,而`initObservers`则会监听页面各种事件来记录增量变更。函数最后返回另一个函数，用于停止记录页面变更。

## `takeFullSnapshot`

内部利用`rrweb-snapshot`来序列化`DOM`：

```js
function takeFullSnapshot(isCheckout = false) {
    // wrappedEmit: 触发emit事件并携带event参数，业务组件可以监听emit事件并在回调函数中拿到event对象参数
    wrappedEmit(
      wrapEvent({
        type: EventType.Meta, // 4
        data: {
          href: window.location.href,
          width: getWindowWidth(),
          height: getWindowHeight(),
        },
      }),
      isCheckout,
    );
    // `rrweb-snapshot`来序列化`DOM`，
    // node： 序列化树根节点
    // idNodeMap记录每个序列化后node的唯一id
    const [node, idNodeMap] = snapshot(
      document,
      blockClass,
      inlineStylesheet,
      maskAllInputs,
    );
    mirror.map = idNodeMap;
    wrappedEmit(
      wrapEvent({
        type: EventType.FullSnapshot, // 2
        data: {
          node, // 全量DOM序列化树
          initialOffset: {
            left: document.documentElement!.scrollLeft,
            top: document.documentElement!.scrollTop,
          },
        },
      }),
    );
  }
```

核心还是利用`rrweb-snapshot`来做序列化的工作，这个库的源码在之后时间够的话再研究。

## `initObservers`

设置各种事件监听，每种事件触发时都会对应一个增量记录。

```js
function initObservers(
  o: observerParam,
  hooks: hooksParam = {},
): listenerHandler {
  mergeHooks(o, hooks); // 融合自定义hooks与内置hooks
  // 利用MutaionObserver记录DOM变更，如节点增加/删除、属性变更、文本变更
  const mutationObserver = initMutationObserver(
    o.mutationCb,
    o.blockClass,
    o.inlineStylesheet,
    o.maskAllInputs,
  );
  // 记录鼠标移动
  const mousemoveHandler = initMoveObserver(o.mousemoveCb);
  // 记录鼠标交互，如点击、双击
  const mouseInteractionHandler = initMouseInteractionObserver(
    o.mouseInteractionCb,
    o.blockClass,
  );
  // 记录页面滚动
  const scrollHandler = initScrollObserver(o.scrollCb, o.blockClass);
  // 记录视口尺寸变更
  const viewportResizeHandler = initViewportResizeObserver(o.viewportResizeCb);
  // 记录input元素的各种值变动，会考虑各种type的input
  const inputHandler = initInputObserver(
    o.inputCb,
    o.blockClass,
    o.ignoreClass,
    o.maskAllInputs,
  );
  // 执行此函数，取消监听
  return () => {
    mutationObserver.disconnect();
    mousemoveHandler();
    mouseInteractionHandler();
    scrollHandler();
    viewportResizeHandler();
    inputHandler();
  };
}
```

`initMutationObserver`监听各种`DOM` 变动，需要处理`MutationObserver`的批量异步回调机制和增量变更之间的冲突。代码细节太多没看，详情参考[官网文章](https://github.com/rrweb-io/rrweb/blob/master/docs/observer.zh_CN.md)。

除了`MutationObserver`比较复杂，剩下几个监听代码都比较简单，这里稍微总结下：

* `initMoveObserver`：监听鼠标移动、移动端触摸屏移动。包含两层节流，第一层`50ms`记录一次移动，第二层每`500ms`固定记录一次并触发增量变更
* `initMouseInteractionObserver`：监听鼠标交互，单击、双击等
* `initScrollObserver`：监听滚动事件，节流`100ms`
* `initViewportResizeObserver`：监听`window`的视口尺寸变化，节流`200ms`
* `initInputObserver`：监听`input`元素的变动，涉及各种`input type`的特殊处理
  * 不记录`password`输入框
  * 如果设置了文本加密，则将所有输入文本替换为`*`
  * 如果选中的是`radio`框，将所有相同`name`的其他`radio`取消选中
  * 监听`input`和`change`事件
  * 拦截`input`、`select`、`textArea`元素的`setter`，以监听在`js`代码里设置这些`DOM`的值

其中拦截`setter`的代码利用了`Object.defineProperty`，可以单独把实现细节拿出来说一说。

```js
// 这些元素的特定属性可以在JavaScript代码中直接设置，而不会触发DOM事件
const hookProperties: Array<[HTMLElement, string]> = [
  [HTMLInputElement.prototype, 'value'], // 拦截input的value属性设置
  [HTMLInputElement.prototype, 'checked'], // 拦截input的checked属性设置
  [HTMLSelectElement.prototype, 'value'], // 拦截select的value属性设置
  [HTMLTextAreaElement.prototype, 'value'], // 拦截textArea的value属性设置
];

hookProperties.map(p =>
  hookSetter<HTMLElement>(p[0], p[1],
  { // 新setter，记录增量变更
    set() {
      eventHandler({ target: this } as Event); // mock to a normal event
    },
  }),
)

// 拦截setter
function hookSetter<T>(
  target: T, // 目标dom元素
  key: string | number | symbol, // setter对应的属性key
  d: PropertyDescriptor, //
  isRevoked?: boolean,
): hookResetter {
  const original = Object.getOwnPropertyDescriptor(target, key);
  Object.defineProperty(
    target,
    key,
    isRevoked
      ? d
      : {
          set(value) {
            // put hooked setter into event loop to avoid of set latency
            setTimeout(() => {
              d.set!.call(this, value); // 调用新setter
            }, 0);
            // 调用原始setter
            if (original && original.set) {
              original.set.call(this, value);
            }
          },
        },
  );
  // 调用返回函数以恢复为原始setter
  return () => hookSetter(target, key, original || {}, true);
}
```

以上就是`record`函数的核心逻辑了，稍微小结一下：分为全量`DOM`序列化和增量变更记录两大部分；全量序列化利用的是`rrweb-snapshot`库；增量变量是通过监听各种页面事件来做到的，监听的事件有：

- `DOM` 变动
  - 节点创建、销毁
  - 节点属性变化
  - 文本变化

- 鼠标移动
- 鼠标交互
  - `mouse up`、`mouse down`
  - `click`、`double click`、`context menu`
  - `focus`、`blur`
  - `touch start`、`touch move`、`touch end`
- 页面或元素滚动
- 视窗大小改变
- `input`输入

给一个使用`record`的简单例子：

```js
import * as rrweb from "rrweb";
export default {
  data() {
    return {
      destroyHanlder: null,
      events: []
    };
  },
  methods: {
    record() {
      this.destroyHanlder = rrweb.record({
        emit: event => {
          this.events.push(event); // 收集数据
        }
      });
    },
    upload() {
      // 发送events到后端服务器
      fetch('xxx', {
        body: {
          events: this.events,
        },
        method: "POST",
      }).then(this.destroyHanlder); // // 停止录制
    }
  }
};
```

# `replay`

回放核心逻辑,将记录的变更按照对应的时间一一重放。包含两个`Class`：`Replayer`实现回放控制、`Timer`实现时间戳控制，保证在正确的时间点回放正确的变更。

## `Replayer`

先看看它的构造函数核心逻辑：

```js
class Replayer {
  // events就是在record阶段收集到的所有数据
  constructor(events: eventWithTime[], config?: Partial<playerConfig>) {
    this.events = events;
    const defaultConfig: playerConfig = {
      speed: 1, // 倍数
      root: document.body, // 回放沙盒放置放置在回放页面的哪里
    };
    this.config = Object.assign({}, defaultConfig, config);
    this.timer = new Timer(this.config);
    this.setupDom(); // 设置回放的核心DOM元素： warpper、鼠标模拟元素、iframe沙盒
  }
}
```

### setupDom

### play

### pause

### resume

对`Replayer`做个小结就是：

* 使用`iframe`当沙盒，独立的`div`元素模拟鼠标
* 使用`rrweb-snapshot`重建全量记录的DOM，并放置到`iframe`中
* 借助`Timer`实现异步播放逻辑，执行每个增量`event`
* 提供了核心`play`、`pause`、`resume`方法，提供给外部的`player-ui`使用
* 支持指定时间点开始播放、倍数播放，播放器`ui`传入配置即可
* 继承了`emitter`，关键事件会通知上层

## `Timer`

`Replayer`会传递一些列带有时间戳的`actions`，`Timer`会将他们按时间排序，然后在每一帧刷新时取出符合条件的`action`来执行。