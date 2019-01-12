---
title: quicklink源码解析
summary_img: /images/indonesia.jpg
date: 2019-01-12 20:51:50
tags: [js]
---

前一阵子在逛`github`时看到一个`GoogleChromeLabs`推出的缓存工具库[`quicklink`](https://github.com/GoogleChromeLabs/quicklink),介绍上说它是`Faster subsequent page-loads by prefetching in-viewport links during idle time`。也就是说可以提前缓存在接下来要访问的页面资源。此前了解过[`<link rel="prefetch" href="xxx" as="xxx">`](https://www.w3.org/TR/resource-hints/#prefetch)也可以做这个事，这俩是什么关系呢？`README`上说到其实底层就是用的`prefetch`，只不过由于兼容性问题，会提供降级方案。所以这个库是将这些东西封装起来了，然后暴露出更易用的`api`。本文主要是解析它的代码实现。

预缓存其实涉及到两个核心问题：

- 缓存策略：缓存哪些资源，即如何知道哪些资源需要预缓存
- 缓存方式：具体通过什么方式来预缓存

# 缓存策略

`quicklink`给出的默认实现是缓存那些在视口中的链接，也提供了`api`来手动指定缓存哪些资源。

首先第一个问题是：如何知道哪些链接在视口当中？一种方式是监听`scoll`事件，判断每个链接在视口中的坐标。缺点很明显，`scroll`触发很频繁需要截流操作，另外判断坐标的方式会触发重排重绘。`quicklink`使用的是[`IntersectionObserver`](https://developer.mozilla.org/zh-CN/docs/Web/API/IntersectionObserver)，它提供了一种异步的方式来监听目标元素是否进入了视口或指定祖先元素。`google developers`上有[一篇文章](https://developers.google.com/web/updates/2016/04/intersectionobserver)介绍了如何以及哪里使用它，例如图片懒加载。

看看`quicklink`中的实现方式：

```js
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    // isIntersecting: entry是否进入了视口
    if (entry.isIntersecting) {
      const link = entry.target;
      // ...
      prefetcher(link.href); // 预缓存指定链接
    }
  });
});

// options.el: 监听哪个元素下面的链接
Array.from((options.el || document).querySelectorAll('a'), link => {
  observer.observe(link);
});
```

唯一的缺点是`IntersectionObserver`兼容性不大好：

![兼容性](/images/quicklink/IntersectionObserver-compatibale.png)

为此需要一个[polyfill](https://github.com/w3c/IntersectionObserver/tree/master/polyfill)。

另外为了不影响主线程，将兼容逻辑放到了[`requestIdleCallback`](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestIdleCallback)中，只在浏览器空闲时执行`observe`。 如果不支持`requestIdleCallback`会回退到`setTimeout`的实现：

```js
const requestIdleCallback =
  requestIdleCallback ||
  function(cb) {
    const start = Date.now();
    return setTimeout(function() {
      cb({
        didTimeout: false,
        timeRemaining: function() {
          return Math.max(0, 50 - (Date.now() - start));
        },
      });
    }, 1);
  };
```

以上就是`quicklink`的缓存策略，[Guess.js](https://guess-js.github.io/) 做的更多，使用统计学和机器学习来基于用户行为预测预缓存资源。

# 缓存方式

上面也说到会优先使用`prefetch`, 降级方案是`XHR`，关于二者的区别在[这篇博客](https://juejin.im/post/5c21f8435188256d12597789#heading-3)中有提到：

![xhr与prefetch区别](https://user-gold-cdn.xitu.io/2018/12/25/167e4b291f960c09?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)

如何判断浏览器是否支持`prefetch`，主要是借助`link.relList.supports`：

```js
function support(feature) {
  const link = document.createElement('link');
  return link.relList && link.relList.supports && link.relList.supports(feature);
}

support('prefetch'); // true
```

使用`prefetch`其实挺简单，创建`link`标签设置适当的属性即可：

```js
function linkPrefetchStrategy(url) {
  return new Promise((resolve, reject) => {
    const link = document.createElement(`link`);
    link.rel = `prefetch`;
    link.href = url;

    link.onload = resolve;
    link.onerror = reject;

    document.head.appendChild(link);
  });
}
```

注意：因为`quicklink`无法知道目标`url`是什么类型，所以此处没有办法设置`link`的`as`属性。

降级的`XHR`方案同样简单：

```js
function xhrPrefetchStrategy(url) {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest();

    req.open(`GET`, url, (req.withCredentials = true));

    req.onload = () => {
      req.status === 200 ? resolve() : reject();
    };

    req.send();
  });
}
```

这里没有考虑`status`是`30x`的情况，不知道是出于何种原因。
