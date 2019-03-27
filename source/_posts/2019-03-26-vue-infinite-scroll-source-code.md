---
title: 无限滚动插件vue-infinite-scroll源码解析
date: 2019-03-26 21:34:27
summary_img: /images/new-york.jpg
tags: [js, dom]
---

最近在项目中遇到一个需求，有一个列表需要滚动加载，类似于微博的无限滚动。当时第一反应时监听滚动事件，在判断滚动到达底部时加载下一页，同时心里也清楚，监听滚动事件需要做好截流。顺手搜索了下发现有一个现成的插件[vue-infinite-scroll](https://github.com/ElemeFE/vue-infinite-scroll),用法也很简单，于是乎就用了起来。 需求上线后，对它的实现挺好奇的，于是研究了一番源码，这篇文章就是源码解析笔记。

# 插件使用方法

这是一个 vue 的指令，按照 github 仓库上的介绍，用法挺简单的，例如：

```html
<div class="app" v-infinite-scroll="loadMore" infinite-scroll-disabled="busy" infinite-scroll-distance="10">
  <div class="content"></div>
  <div class="loading" v-show="busy">loading.....</div>
</div>
```

```css
.app {
  height: 1000px;
  border: 1px solid red;
  width: 600px;
  margin: 0 auto;
  overflow: auto;
}
.content {
  height: 1300px;
  background-color: #ccc;
  width: 80%;
  margin: 0 auto;
}
.loading {
  font-weight: bold;
  font-size: 20px;
  color: red;
  text-align: center;
}
```

```js
var app = document.querySelector('.app');
new Vue({
  el: app,
  directives: {
    InfiniteScroll,
  },
  data: function() {
    return { busy: false };
  },
  methods: {
    loadMore: function() {
      var self = this;
      self.busy = true;
      console.log('loading... ' + new Date());
      setTimeout(function() {
        var target = document.querySelector('.content');
        var height = target.clientHeight;
        target.style.height = height + 300 + 'px';
        console.log('end... ' + new Date());
        self.busy = false;
      }, 1000);
    },
  },
});
```

这里的指令宿主元素自身设置了`overflow:auto`，内部元素用来支撑滚动，当滚动到底部时，增加内部元素的高度从而模拟了无限滚动。效果如下：

![infinite-scroll-self](/images/vue-infinite-scroll/infinite-scroll.gif)

另外可以将父元素设置为滚动，当自身滚动到父元素底部时，增加自身的高度，模拟拉取下一页数据的操作。 例如：

```html
<div class="app">
  <div class="content" v-infinite-scroll="loadMore" infinite-scroll-disabled="busy" infinite-scroll-distance="10"></div>
  <div class="loading" v-show="busy">loading.....</div>
</div>
```

达到的效果和上面完全相同。

# 源码解析

接下来就是看看内部怎么实现的。照例从入口开始看起。因为这个插件就是一个 `vue` 的指令，所以入口还是挺简单的：

## 指令入口

```js
export default {
  bind(el, binding, vnode) {
    el[ctx] = {
      el,
      vm: vnode.context,
      expression: binding.value, // 滚动到底部时需要的监听函数，通常用于加载下一页数据
    };
    const args = arguments;
    // 监听宿主元素所在组件的mounted事件
    el[ctx].vm.$on('hook:mounted', function() {
      el[ctx].vm.$nextTick(function() {
        // 判断元素是否已经在页面上
        if (isAttached(el)) {
          // 获取各项指令相关属性，执行各种事件绑定
          doBind.call(el[ctx], args);
        }

        el[ctx].bindTryCount = 0;

        // 间隔50ms轮训10次，判断元素是否已经在页面上
        var tryBind = function() {
          if (el[ctx].bindTryCount > 10) return; //eslint-disable-line
          el[ctx].bindTryCount++;
          if (isAttached(el)) {
            doBind.call(el[ctx], args);
          } else {
            setTimeout(tryBind, 50);
          }
        };

        tryBind();
      });
    });
  },

  unbind(el) {
    // 事件解绑
    if (el && el[ctx] && el[ctx].scrollEventTarget) el[ctx].scrollEventTarget.removeEventListener('scroll', el[ctx].scrollListener);
  },
};
```

核心就是在宿主元素渲染后，执行`doBind`方法，我们猜测会在`doBind`绑定滚动父元素的`scroll`事件。

`isAttached`方法用于判断一个元素是否已渲染在页面上，判断方法是查看是否有组件元素的标签名为`HTML`：

```js
// 判断元素是否已经在页面上
var isAttached = function(element) {
  var currentNode = element.parentNode;
  while (currentNode) {
    if (currentNode.tagName === 'HTML') {
      return true;
    }
    // 11 表示DomFragment
    if (currentNode.nodeType === 11) {
      return false;
    }
    currentNode = currentNode.parentNode;
  }
  return false;
};
```

## 参数解析与事件绑定

现在看看`doBind`方法，逻辑比较多，不过都不难。

```js
var doBind = function() {
  if (this.binded) return; // 只绑定一次
  this.binded = true;

  var directive = this;
  var element = directive.el;

  // throttleDelayExpr: 截流间隔。 设置在元素的属性上
  var throttleDelayExpr = element.getAttribute('infinite-scroll-throttle-delay');
  var throttleDelay = 200;
  if (throttleDelayExpr) {
    // 优先尝试组件上的throttleDelayExpr属性值， 如 <div infinite-scroll-throttle-delay="myDelay"></div>
    throttleDelay = Number(directive.vm[throttleDelayExpr] || throttleDelayExpr);
    if (isNaN(throttleDelay) || throttleDelay < 0) {
      throttleDelay = 200;
    }
  }
  directive.throttleDelay = throttleDelay;

  // 监听滚动父元素的scroll时间，监听函数设置了函数截流
  directive.scrollEventTarget = getScrollEventTarget(element); // 设置了滚动的父元素
  directive.scrollListener = throttle(doCheck.bind(directive), directive.throttleDelay);
  directive.scrollEventTarget.addEventListener('scroll', directive.scrollListener);

  this.vm.$on('hook:beforeDestroy', function() {
    directive.scrollEventTarget.removeEventListener('scroll', directive.scrollListener);
  });

  // infinite-scroll-disabled: 是否禁用无限滚动
  // 可以为表达式
  var disabledExpr = element.getAttribute('infinite-scroll-disabled');
  var disabled = false;

  if (disabledExpr) {
    this.vm.$watch(disabledExpr, function(value) {
      directive.disabled = value;
      // 当disable为false时，重启check
      if (!value && directive.immediateCheck) {
        doCheck.call(directive);
      }
    });
    disabled = Boolean(directive.vm[disabledExpr]);
  }
  directive.disabled = disabled;

  // 宿主元素到滚动父元素底部的距离阈值，小于这个值时，触发listen-for-event监听函数
  var distanceExpr = element.getAttribute('infinite-scroll-distance');
  var distance = 0;
  if (distanceExpr) {
    distance = Number(directive.vm[distanceExpr] || distanceExpr);
    if (isNaN(distance)) {
      distance = 0;
    }
  }
  directive.distance = distance;

  // immediate-check：是否在bind后立即检查一遍，也会在disable失效时立即触发检查
  var immediateCheckExpr = element.getAttribute('infinite-scroll-immediate-check');
  var immediateCheck = true;
  if (immediateCheckExpr) {
    immediateCheck = Boolean(directive.vm[immediateCheckExpr]);
  }
  directive.immediateCheck = immediateCheck;

  if (immediateCheck) {
    doCheck.call(directive);
  }

  // 当组件上设置的此事件触发时，执行一次检查
  var eventName = element.getAttribute('infinite-scroll-listen-for-event');
  if (eventName) {
    directive.vm.$on(eventName, function() {
      doCheck.call(directive);
    });
  }
};
```

整个看下来，核心就是利用各种参数控制`doCheck`的调用，包括时间间隔、`disabled`、距离阈值、`immediate-check`、组件事件。
`doCheck`因为会非常频繁的调用，所以用`throttle`进行了截流，具体逻辑这里不再赘述。

在`getScrollEventTarget`查找滚动父元素时，有一个细节就是会从自身开始查找，这也就是我们上面的`demo`中可以将指令宿主元素赋值给滚动元素自身的原因：

```js
// 从自身开始，寻找设置了滚动的父元素。 overflow-y 为scroll或auto
var getScrollEventTarget = function(element) {
  var currentNode = element;
  // bugfix, see http://w3help.org/zh-cn/causes/SD9013 and http://stackoverflow.com/questions/17016740/onscroll-function-is-not-working-for-chrome
  // nodeType 1表示元素节点
  while (currentNode && currentNode.tagName !== 'HTML' && currentNode.tagName !== 'BODY' && currentNode.nodeType === 1) {
    var overflowY = getComputedStyle(currentNode).overflowY;
    if (overflowY === 'scroll' || overflowY === 'auto') {
      return currentNode;
    }
    currentNode = currentNode.parentNode;
  }
  return window;
};
```

## doCheck

这个函数用于判断是否已经滚动到底部，可以说是整个插件的核心逻辑。由于滚动的元素可以是自身，也可以是某个父元素，所以判断会分成两个分支。

```js
var doCheck = function(force) {
  var scrollEventTarget = this.scrollEventTarget; // 滚动父元素
  var element = this.el;
  var distance = this.distance; // 距离阈值

  if (force !== true && this.disabled) return;
  var viewportScrollTop = getScrollTop(scrollEventTarget); // 被隐藏在内容区上方的像素数
  // viewportBottom： 元素底部与文档坐标顶部的距离； visibleHeight：元素不带边框的高度
  var viewportBottom = viewportScrollTop + getVisibleHeight(scrollEventTarget);

  var shouldTrigger = false;

  // 滚动元素就是自身
  if (scrollEventTarget === element) {
    // scrollHeight - 在没有滚动条的情况下，元素内容的总高度，是元素的内容区加上内边距再加上任何溢出内容的尺寸。
    // shouldTrigger为true表示已经滚动到元素的足够底部了。
    // 参考https://hellogithub2014.github.io/2017/10/19/dom-element-size-summary/
    shouldTrigger = scrollEventTarget.scrollHeight - viewportBottom <= distance;
  } else {
    // 当前元素与不是父元素，此时通常意味着当前元素的高度比滚动父元素要高，这样父元素才会出现滚动

    //  getElementTop(element) - getElementTop(scrollEventTarget) 当前元素顶部与滚动父元素顶部的距离
    // offsetHeight元素带边框的高度
    // elementBottom: 元素底部与文档坐标顶部的距离
    var elementBottom = getElementTop(element) - getElementTop(scrollEventTarget) + element.offsetHeight + viewportScrollTop;

    shouldTrigger = viewportBottom + distance >= elementBottom;
  }

  if (shouldTrigger && this.expression) {
    this.expression(); // 触发绑定的无限滚动函数，通常是获取下一页数据。 之后scrollEventTarget.scrollHeight会变大
  }
};
```

这里涉及到了多种尺寸值，包括`scrollTop`、`offsetTop`、`clientHeight`、`scrollHeight`等等，如果不清楚的话整个函数的逻辑就很难看懂，关于它们的具体意义可以参考我之前写的[一篇博客](https://hellogithub2014.github.io/2017/10/19/dom-element-size-summary/)。

这里我用两幅图来辅助理解上面的逻辑，相信会好懂很多。

### 滚动元素是自身

![scroll-on-self](/images/vue-infinite-scroll/scroll-on-self.png)
如下，我们的目标是判断元素是否已滚动到底部的距离阈值之内，很容易可以看出来，距离内容底部的距离公式为：

```js
const { scrollHeight, clientHeight, scrollTop } = scrollEventTarget;
const currentDistance = scrollHeight - clientHeight - scrollTop;
```

这也就是函数`if`分支的逻辑，当`currentDistance`小于`distance`时，我们就可以加载下一页数据了。

### 父级元素设置滚动

![scroll-on-parent](/images/vue-infinite-scroll/scroll-on-parent.png)

此时就没有`scrollTop`属性可以操作了，但是元素的高度仍然可以用上面的属性：滚动父元素的高度可以用`scrollEventTarget.clientHeight`，子元素内容高度可以用`element.offsetHeight`，剩下的就是计算`topGap`了。

我们知道`DOM`的坐标有两种：文档坐标、视口坐标，计算`topGap`只要始终在其中一个坐标系计算就可以了，这里我们采用视口坐标。`ele.getBoundingClientRect().top`可以知道一个元素距离视口顶部的距离，那么`topGap`的计算公式就是：

```js
const topGap = scrollEventTarget.getBoundingClientRect().top - element.getBoundingClientRect().top;
```

综上，子元素底部与父元素底部的距离公式就是：

```js
const currentDistance =
  element.offsetHeight - scrollEventTarget.clientHeight - (scrollEventTarget.getBoundingClientRect().top - element.getBoundingClientRect().top);
```

这也就是函数的`else`分支逻辑。

以上就是`doCheck`的核心检测逻辑了，同时针对`scrollEventTarget`为`document`时做了一些特殊处理，留给大家自己去看。
