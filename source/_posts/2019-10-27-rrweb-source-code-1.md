---
title: rrweb源码解析1
date: 2019-10-27 21:38:13
summary_img: /images/himalayan.jpg
tags: [JavaScript]
---

之前的文章有简单介绍[`rrweb`的底层设计](https://hellogithub2014.github.io/2019/10/27/rrweb-inernal-design/#more)，这篇文章开始会记录`rrweb`的源码。`rrweb`的源码由 3 个仓库组成：

1. [`rrweb-snapshot`](https://github.com/rrweb-io/rrweb-snapshot): 包含 `snapshot` 和 `rebuild` 功能。`snapshot` 用于将 `DOM` 及其状态转化为可序列化的数据结构；`rebuild` 则是将 `snapshot` 记录的数据结构重建为对应的 `DOM`。
2. [`rrweb`](https://github.com/rrweb-io/rrweb)： 包含 `record` 和 `replay` 两个功能。`record` 用于记录 `DOM` 中的所有变更（`mutation`）；`replay` 则是将记录的变更按照对应的时间一一重放。
3. [`rrweb-player`](https://github.com/rrweb-io/rrweb-player)：为 `rrweb` 提供一套 `UI` 控件，提供基于 `GUI` 的暂停、快进、拖拽至任意时间点播放等功能。

本文是第一篇，记录学习第 2 个仓库`rrweb`的笔记。

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
function initObservers(o: observerParam, hooks: hooksParam = {}): listenerHandler {
  mergeHooks(o, hooks); // 融合自定义hooks与内置hooks
  // 利用MutaionObserver记录DOM变更，如节点增加/删除、属性变更、文本变更
  const mutationObserver = initMutationObserver(o.mutationCb, o.blockClass, o.inlineStylesheet, o.maskAllInputs);
  // 记录鼠标移动
  const mousemoveHandler = initMoveObserver(o.mousemoveCb);
  // 记录鼠标交互，如点击、双击
  const mouseInteractionHandler = initMouseInteractionObserver(o.mouseInteractionCb, o.blockClass);
  // 记录页面滚动
  const scrollHandler = initScrollObserver(o.scrollCb, o.blockClass);
  // 记录视口尺寸变更
  const viewportResizeHandler = initViewportResizeObserver(o.viewportResizeCb);
  // 记录input元素的各种值变动，会考虑各种type的input
  const inputHandler = initInputObserver(o.inputCb, o.blockClass, o.ignoreClass, o.maskAllInputs);
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

- `initMoveObserver`：监听鼠标移动、移动端触摸屏移动。包含两层节流，第一层`50ms`记录一次移动，第二层每`500ms`固定记录一次并触发增量变更
- `initMouseInteractionObserver`：监听鼠标交互，单击、双击等
- `initScrollObserver`：监听滚动事件，节流`100ms`
- `initViewportResizeObserver`：监听`window`的视口尺寸变化，节流`200ms`
- `initInputObserver`：监听`input`元素的变动，涉及各种`input type`的特殊处理
  - 不记录`password`输入框
  - 如果设置了文本加密，则将所有输入文本替换为`*`
  - 如果选中的是`radio`框，将所有相同`name`的其他`radio`取消选中
  - 监听`input`和`change`事件
  - 拦截`input`、`select`、`textArea`元素的`setter`，以监听在`js`代码里设置这些`DOM`的值

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
import * as rrweb from 'rrweb';
export default {
  data() {
    return {
      destroyHanlder: null,
      events: [],
    };
  },
  methods: {
    record() {
      this.destroyHanlder = rrweb.record({
        emit: event => {
          this.events.push(event); // 收集数据
        },
      });
    },
    upload() {
      // 发送events到后端服务器
      fetch('xxx', {
        body: {
          events: this.events,
        },
        method: 'POST',
      }).then(this.destroyHanlder); // // 停止录制
    },
  },
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
    this.setupDom(); // 设置回放的核心DOM元素： wrapper、鼠标模拟元素、iframe沙盒
  }
}
```

除了一些核心数据的初始化之外，就是`setuoDom`方法了。

### setupDom

用于构建回放页面的关键`DOM`元素，最核心的是两个：`iframe`沙盒、鼠标模拟元素。

```js
// 设置回放的核心DOM元素： warpper、鼠标模拟元素、iframe沙盒
private setupDom() {
  this.wrapper = document.createElement('div');
  this.wrapper.classList.add('replayer-wrapper');
  this.config.root.appendChild(this.wrapper);

  this.mouse = document.createElement('div');
  this.mouse.classList.add('replayer-mouse');
  this.wrapper.appendChild(this.mouse);

  this.iframe = document.createElement('iframe');
  // allow-same-origin: 如果没有使用该关键字，嵌入的浏览上下文将被视为来自一个独立的源，这将使 same-origin policy 同源检查失败
  // https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/iframe
  this.iframe.setAttribute('sandbox', 'allow-same-origin');
  this.iframe.setAttribute('scrolling', 'no'); // 控制是否要在框架内显示滚动条
  // pointer-events:指定在什么情况下( 如果有 ) 某个特定的图形元素可以成为鼠标事件的 target。
  // https://developer.mozilla.org/zh-CN/docs/Web/CSS/pointer-events
  this.iframe.setAttribute('style', 'pointer-events: none');
  this.wrapper.appendChild(this.iframe);
}
```

此时回放页面的结构如下：

```
root
  wrapper
    mouse
    iframe
```

不难猜出`mouse`应该是利用`position: absoute`定位到 wrapper 内部，在回放时会动态设置它的`top/right/bottom/left`属性模拟鼠标移动。在`src/replay/styles/style.css`文件中可以找到它的样式：

```css
.replayer-mouse {
  position: absolute;
  width: 20px;
  height: 20px;
  transition: 0.05s linear;
  background-size: contain;
  background-position: center center;
  background-repeat: no-repeat;
  background-image: url('data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9JzMwMHB4JyB3aWR0aD0nMzAwcHgnICBmaWxsPSIjMDAwMDAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGRhdGEtbmFtZT0iTGF5ZXIgMSIgdmlld0JveD0iMCAwIDUwIDUwIiB4PSIwcHgiIHk9IjBweCI+PHRpdGxlPkRlc2lnbl90bnA8L3RpdGxlPjxwYXRoIGQ9Ik00OC43MSw0Mi45MUwzNC4wOCwyOC4yOSw0NC4zMywxOEExLDEsMCwwLDAsNDQsMTYuMzlMMi4zNSwxLjA2QTEsMSwwLDAsMCwxLjA2LDIuMzVMMTYuMzksNDRhMSwxLDAsMCwwLDEuNjUuMzZMMjguMjksMzQuMDgsNDIuOTEsNDguNzFhMSwxLDAsMCwwLDEuNDEsMGw0LjM4LTQuMzhBMSwxLDAsMCwwLDQ4LjcxLDQyLjkxWm0tNS4wOSwzLjY3TDI5LDMyYTEsMSwwLDAsMC0xLjQxLDBsLTkuODUsOS44NUwzLjY5LDMuNjlsMzguMTIsMTRMMzIsMjcuNThBMSwxLDAsMCwwLDMyLDI5TDQ2LjU5LDQzLjYyWiI+PC9wYXRoPjwvc3ZnPg==');
}
.replayer-mouse::after {
  content: '';
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 10px;
  background: rgb(73, 80, 246);
  transform: translate(-10px, -10px);
  opacity: 0.3;
}
.replayer-mouse.active::after {
  animation: click 0.2s ease-in-out 1;
}
```

最终模拟出来的样式是这样的：

![mouse](/images/rrweb/mouse.png)

在初始化`Replayer`之后，需要由外部`player-ui`手动调用`play`、`pause`、`resume`来模拟回放，依次看看实现。

### play

```js
/**
  * This API was designed to be used as play at any time offset.
  * Since we minimized the data collected from recorder, we do not
  * have the ability of undo an event.
  * So the implementation of play at any time offset will always iterate
  * all of the events, cast event before the offset synchronously
  * and cast event after the offset asynchronously with timer.
  * @param timeOffset number 表示一个时长，目的是指定时间开始播放，比如指定第5s开始播放
  */
public play(timeOffset = 0) {
  this.timer.clear();
  this.baselineTime = this.events[0].timestamp + timeOffset; // 重置基准时间戳为：初始事件时间戳+用户指定的时长
  const actions = new Array<actionWithDelay>();
  for (const event of this.events) {
    const isSync = event.timestamp < this.baselineTime;
    const castFn = this.getCastFn(event, isSync);
    if (isSync) {
      castFn(); // 在baselineTime之前的event先同步执行掉
    } else {
      actions.push({ doAction: castFn, delay: this.getDelay(event) });
    }
  }
  this.timer.addActions(actions);
  this.timer.start(); // 由timer保证在正确的时间点执行正确的actions
}
```

注意这里是如何实现**指定时间点播放**的：

1. 传入的`timeOffset`决定了`baselineTime`，`baselineTime`表示从`record`阶段的哪个时间戳开始回放
2. `isSync`为`true`表示此`event`位于起始播放时间戳之前，不会被放到`timer`的`actoins`数组中，会被直接执行掉。而`Timer`是在每一帧异步取出一些`action`执行。所以我们会看到`baselineTime`之前的`action`一闪而过，后续的`action`会一帧一帧的“播放”。

传给`timer`的每个`action`都带有一个`delay`属性，表示在播放到何时执行此`action`，大体来说：

```js
delay = event.timestamp - this.baselineTime;
```

即由绝对时间戳转换为相对时间。

由于在录制时生成的`event`具有多种`type`，不同`type`表示不同动作，有的表示全量`DOM`序列化，有的表示增量`mutation`。所以在 `getCastFn`通过闭包进行了一次包装，这样`timer`就可以不管实现细节，直接无脑执行`castFn`就行。

```js
private getCastFn(event: eventWithTime, isSync = false) {
  let castFn: undefined | (() => void);
  switch (event.type) {
    // 其他EventType这里略去...
    case EventType.FullSnapshot: // 全量记录
      castFn = () => {
        this.rebuildFullSnapshot(event); // 重建完整DOM到沙盒iframe
      };
      break;
    case EventType.IncrementalSnapshot: // 增量记录
      castFn = () => {
        // 增量mutation回放。。。
      };
      break;
    default:
  }
  const wrappedCastFn = () => {
    if (castFn) {
      castFn();
    }
    // ...
  };
  return wrappedCastFn;
}
```

#### 重建完整 `DOM` 到沙盒 `iframe`

```js
private rebuildFullSnapshot(
  event: fullSnapshotEvent & { timestamp: number },
) {
  this.missingNodeRetryMap = {};
  /**
    * 构建页面完整DOM
    * rebuild will build the DOM according to the taken snapshot. There are several things will be done during rebuild:
    * 1. Add data-rrid attribute if the Node is an Element.
    * 2. Create some extra DOM node like text node to place inline CSS and some states.
    * 3. Add data-extra-child-index attribute if Node has some extra child DOM.
    */
  mirror.map = rebuild(event.data.node, this.iframe.contentDocument!)[1];
  // 利用<style>插入css到iframe的head
  const styleEl = document.createElement('style');
  const { documentElement, head } = this.iframe.contentDocument!;
  documentElement!.insertBefore(styleEl, head);
  const injectStylesRules = getInjectStyleRules(this.config.blockClass) // 设置iframe的样式
      .concat(this.config.insertStyleRules); // 用户传入的其他内联样式
  for (let idx = 0; idx < injectStylesRules.length; idx++) {
    (styleEl.sheet! as CSSStyleSheet).insertRule(injectStylesRules[idx], idx);
  }
  // pause when loading style sheet, resume when loaded all timeout exceed
  this.waitForStylesheetLoad(); // 内部细节有些多，暂时没有研究，后续如果有需要再看
}
```

最核心的`rebuild`方法位于`rrweb-snapshot`包，这个后续的文章会专门分析。将全量`DOM`以及样式插入到`iframe`后，后续就是挨个异步增量变更了。

#### 异步执行增量变更

这块的代码细节很多，只会讲主要脉络，太细节的我也没怎么看 🤣

```js
this.applyIncremental(event, isSync);
// nextUserInteractionEvent下一个由用户交互触发的增量变更
if (event === this.nextUserInteractionEvent) {
  this.nextUserInteractionEvent = null;
  this.restoreSpeed();  // 恢复倍数
}
// skipInactive： 跳过不活跃的？
if (this.config.skipInactive && !this.nextUserInteractionEvent) {
  // 查找下一个用户交互事件
  for (const _event of this.events) {
    if (_event.timestamp! <= event.timestamp!) {
      continue;
    }
    // 是否属于用户交互产生的事件: MouseMove、MouseInteraction、Scroll、ViewportResize、Input
    if (this.isUserInteraction(_event)) {
      // 如果_event在当前这一帧之后才会执行，才是合格的
      if (
        _event.delay! - event.delay! >
        SKIP_TIME_THRESHOLD * this.config.speed // config.speed倍数
      ) {
        this.nextUserInteractionEvent = _event;
      }
      break;
    }
  }
  // 设置倍数
  if (this.nextUserInteractionEvent) {
    this.noramlSpeed = this.config.speed;
    const skipTime =
      this.nextUserInteractionEvent.delay! - event.delay!;
    const payload = {
      speed: Math.min(Math.round(skipTime / SKIP_TIME_INTERVAL), 360),
    };
    this.setConfig(payload);
  }
}
```

除了一堆跟播放器相关的细节外，剩下的就是`applyIncremental`方法了，它用于应用一个增量变更到当前沙盒状态中。在录制过程中处理的种种细节在这里都会一一小心处理，所以这个函数内部会有一个很大的`switch-case`：

```js
applyIncremental(e: incrementalSnapshotEvent & { timestamp: number },isSync: boolean) {
  const { data: d } = e;
  switch ( d.source )
  {
    case IncrementalSource.Mutation:
      // 模拟节点DOM变化：节点创建/销毁、节点属性变化、文本变化
      break;
    case IncrementalSource.MouseMove:
      // 还原鼠标移动
      break;
    case IncrementalSource.MouseInteraction: {
      // 还原鼠标交互
      switch ( d.type ) {
        case MouseInteractions.Blur:
          // 失焦
          break;
        case MouseInteractions.Focus:
          // 聚焦
          break;
        case MouseInteractions.Click:
        case MouseInteractions.TouchStart:
        case MouseInteractions.TouchEnd:
          // 点击
          break;
      }
      break;
    }
    case IncrementalSource.Scroll: {
      // 模拟滚动
      break;
    }
    case IncrementalSource.ViewportResize:
      // 模拟视口尺寸变化
      break;
    case IncrementalSource.Input: {
      // 模拟input元素值变化
      break;
    }
    default:
  }
}
```

阅读细节时可以参照[这篇文章](https://github.com/rrweb-io/rrweb/blob/master/docs/replay.md)来看。

看完了`play`方法后，`pause`和`resume`方法就很轻松了，尤其是`resume`方法除了一些初始操作外剩下都一样，这里就不啰嗦了。

## `Timer`

`Replayer`会传递一些列带有时间戳的`actions`，`Timer`会将他们按时间排序，然后在每一帧刷新时取出符合条件的`action`来执行。

```js
public start() {
  this.actions.sort((a1, a2) => a1.delay - a2.delay); // 升序排列
  this.timeOffset = 0;
  let lastTimestamp = performance.now();
  const { actions, config } = this;
  const self = this;
  // time是requestAnimationFrame在执行回调时传入的时间戳
  function check(time: number) {
    self.timeOffset += (time - lastTimestamp) * config.speed; // 计时器走过的时长，比如10s
    lastTimestamp = time;
    // 将所有在timeOffset之前的action全部执行掉
    while (actions.length) {
      const action = actions[0];
      if (self.timeOffset >= action.delay) {
        actions.shift();
        action.doAction();
      } else {
        break;
      }
    }
    // 如果还有action，则在下一帧继续重复
    if (actions.length > 0 || self.config.liveMode) {
      self.raf = requestAnimationFrame(check);
    }
  }
  this.raf = requestAnimationFrame(check);
}
```

这里注意一下是如何实现**倍数回放**的：

```js
self.timeOffset += (time - lastTimestamp) * config.speed; // 计时器走过的时长，比如10s
```

`config.speed`就是配置的倍数，默认是`1`。如果配置为`2`，那么在原先相同时间内就会走过 2 倍的时长，即`self.timeOffset`的大小是原先的`2`倍。

```js
if (self.timeOffset >= action.delay) {
  actions.shift();
  action.doAction();
}
```

在这里会判断每个`action`是否小于`self.timeOffset`，也就是说这个`action`是不是当前进度条之前的`action`了，通过这种简单巧妙的方法就实现了倍数播放。

最后对`replay`做个小结就是：

- 使用`iframe`当沙盒，独立的`div`元素模拟鼠标
- 使用`rrweb-snapshot`重建全量记录的 DOM，并放置到`iframe`中
- 借助`Timer`实现异步播放逻辑，执行每个增量`event`
- 提供了核心`play`、`pause`、`resume`方法，提供给外部的`player-ui`使用
- 支持指定时间点开始播放、倍数播放，播放器`ui`传入配置即可
- 继承了`emitter`，关键事件会通知上层
