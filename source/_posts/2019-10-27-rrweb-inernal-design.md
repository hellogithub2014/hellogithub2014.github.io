---
title: rrweb 底层设计简要总结
date: 2019-10-27 20:14:50
summary_img: /images/contact.jpg
tags: [javascript]
---

[rrweb](https://github.com/rrweb-io/rrweb)可以进行屏幕录制和回放，用它做一个用户自助反馈功能，可以大幅度降低 `bug` 反馈成本。 这里简要介绍它的核心内部设计，后续会研究它的源码以增加一些定制功能。

`rrweb`并不是真的在录制视频，而是将页面`DOM`序列化后记录下来，再利用反序列化还原成`DOM`来回放。

## 代码组成

主要分为 3 个部分（参照官方 `README`）：

- [`rrweb-snapshot`](https://github.com/rrweb-io/rrweb-snapshot): 包含 snapshot 和 rebuild 功能。snapshot 用于将 DOM 及其状态转化为可序列化的数据结构；rebuild 则是将 snapshot 记录的数据结构重建为对应的 DOM。
- [`rrweb`](https://github.com/rrweb-io/rrweb)： 包含 record 和 replay 两个功能。record 用于记录 DOM 中的所有变更（mutation）；replay 则是将记录的变更按照对应的时间一一重放。
- [`rrweb-player`](https://github.com/rrweb-io/rrweb-player)：为 rrweb 提供一套 UI 控件，提供基于 GUI 的暂停、快进、拖拽至任意时间点播放等功能。

对于一个自助反馈功能来说，需要`rrweb`+`rrweb-snapshot`来生成一组序列化的`snapshot`，并发送给回放后台；后台回放页面拿到`snapshot`后，利用`rrweb-snapshot`还原为`DOM`，结合`replay`功能后就可以在`rrweb-player`中"播放"了。

## 内部设计

这个部分主要也是阅读了`rrweb`官网的 4 篇文章后，进行的一个简要总结，原始链接如下：

- [serialization](https://github.com/rrweb-io/rrweb/blob/master/docs/serialization.md)
- [incremental snapshot](https://github.com/rrweb-io/rrweb/blob/master/docs/observer.md)
- [replay](https://github.com/rrweb-io/rrweb/blob/master/docs/replay.md)
- [sandbox](https://github.com/rrweb-io/rrweb/blob/master/docs/sandbox.md)

### 序列化

并不需要将每时每刻的 DOM 都全量序列化，这样一来数据量很大，另外会有很多重复数据。rrweb 会在初始时进行一次全量序列化，然后将各种页面活动比如按钮点击转变为增量序列化。

#### 全量序列化

将`DOM`树转为”虚拟 DOM“树形数据结构。例如：

```html
<html>
  <body>
    <header></header>
  </body>
</html>
```

会被序列化为：

```js
{
  "type": "Document",
  "childNodes": [
    {
      "type": "Element",
      "tagName": "html",
      "attributes": {},
      "childNodes": [
        {
          "type": "Element",
          "tagName": "head",
          "attributes": {},
          "childNodes": [],
          "id": 3 // 唯一id
        },
        {
          "type": "Element",
          "tagName": "body",
          "attributes": {},
          "childNodes": [
            {
              "type": "Text",
              "textContent": "\n    ",
              "id": 5
            },
            {
              "type": "Element",
              "tagName": "header",
              "attributes": {},
              "childNodes": [
                {
                  "type": "Text",
                  "textContent": "\n    ",
                  "id": 7
                }
              ],
              "id": 6
            }
          ],
          "id": 4
        }
      ],
      "id": 2
    }
  ],
  "id": 1
}
```

基于这样的树形结构后，假如要记录某个按钮的点击，对于这个操作就可以序列化为类似如下的结构：

```js
type clickSnapshot = {
  source: 'MouseInteraction',
  type: 'Click',
  id: Number, // 按钮id
};
```

#### 增量序列化

在完成一次全量快照之后，需要基于当前视图状态观察所有可能对视图造成改动的事件，目前在 rrweb 中已经观察了以下事件：

- `DOM` 变动
  - 节点创建、销毁
  - 节点属性变化
  * 文本变化

* 鼠标移动
* 鼠标交互
  - `mouse up`、`mouse down`
  - `click`、`double click`、`context menu`
  - `focus`、`blur`
  - `touch start`、`touch move`、`touch end`
* 页面或元素滚动
* 视窗大小改变
* `input`输入

`rrweb`基于[`MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)来观察所有这些变更，`MutationObserver`的一个示范：

```js
// Select the node that will be observed for mutations
const targetNode = document.getElementById('some-id');

// Options for the observer (which mutations to observe)
const config = { attributes: true, childList: true, subtree: true };

// Callback function to execute when mutations are observed
const callback = function(mutationsList, observer) {
  for (let mutation of mutationsList) {
    if (mutation.type === 'childList') {
      console.log('A child node has been added or removed.');
    } else if (mutation.type === 'attributes') {
      console.log('The ' + mutation.attributeName + ' attribute was modified.');
    }
  }
};

// Create an observer instance linked to the callback function
const observer = new MutationObserver(callback);

// Start observing the target node for configured mutations
observer.observe(targetNode, config);

// Later, you can stop observing
observer.disconnect();
```

##### 新增节点

由于`MutationObserver`在触发时，`callback`收到的是一批操作记录，这个特性会影响`rrweb`的序列化过程，比如

```
body
  n1
    n2
```

1. 创建节点 `n1` 并 `append` 在 `body` 中，再创建节点 `n2` 并 `append` 在 `n1` 中
2. 创建节点 `n1`、`n2`，将 `n2` `append` 在 `n1` 中，再将 `n1` `append` 在 `body` 中。

这两种操作的最终结果是一致的，不过在增量序列化时，前者会产生两条记录，后者只有一条记录，`rrweb`需要区分开来。最终采取的方案是：

**在新增节点时，所有 `mutation` 记录都需要先收集，再新增节点去重并序列化之后再做处理。**

##### 节点属性变化

对于节点属性的变化，比如`resize textarea`时宽高会发生多次变更，这会导致增量记录大大增加，经权衡只记录最终的值。

##### 鼠标移动

与节点属性变化的处理类似，记录鼠标轨迹也需要尽量减少增量记录。有两层节流：

- 每 `20 ms` 最多记录一次鼠标坐标
- 每 `500 ms` 最多发送一次鼠标坐标集，主要是做的一个分段

##### `input`输入变更

1. 界面交互引起的，主要靠监听 `input` 和 `change` 两个事件
2. `js`代码设置引起的，比如设置`input DOM`的`value`属性，这种主要是利用`Object.defineProperty`拦截`DOM`属性的`setter`,类似于`Vue`中的响应式数据

### 沙盒

在拿”录屏“数据后的回放界面中，需要禁用被录制页面中的所有`js`，同时还有很多其他交互，比如表单提交、`window.open`打开新窗口、内联脚本等等。 所以`rrweb`在回放系统中会将所有重建后的`DOM`放到一个`iframe`中，并设置相关[sandbox 属性](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/iframe)来禁用。

`a`链接跳转也是需要禁止的，通过事件代理来`preventDefault`掉所有`a`链接的`click`事件。

### 回放播放器

每个变更记录都带有时间戳，所以是可以做一个”播放器“来按时间顺序”播放“变更记录的。`rrweb`利用`requestAnimationFrame`来模拟随时间变化的回放。

**从任意时间点开始播放**：当在播放器中拖动到指定进度后，将进度之前的变更记录一次性同步执行掉，进度之后的再按照`requestAnimationFrame`异步播放。

**倍数**：播放器还可以支持例如`2`倍、`4`倍数播放，这个也比较好做，相当于此前在一个`raf`回调中执行一个变更记录，现在是执行`2`个、`4`个变更记录。
