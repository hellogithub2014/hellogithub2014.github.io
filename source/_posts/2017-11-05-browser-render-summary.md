---
title: "浏览器渲染过程小结"
img: canyon.jpg # Add image post (optional)
date: 2017-11-05 11:30:00 Asia/Shanghai
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [BROWSER]
---

# 渲染过程
![](http://mmbiz.qpic.cn/mmbiz_jpg/zPh0erYjkib2bsVdjOuFlloia1GkjzgwkcwZNU3ncVFK6UTzJvoDJdZdyQqmfo3kPaJWHG5Phy8g28l5rtwKR9Eg/640?wx_fmt=jpeg&tp=webp&wxfrom=5&wx_lazy=1)

以下参考【2】

1. **Create/Update DOM And request css/image/js**：浏览器请求到HTML代码后，在生成DOM的最开始阶段（应该是 Bytes → characters 后），并行发起css、图片、js的请求，无论他们是否在HEAD里。**注意**：发起 js 文件的下载 request 并不需要 DOM 处理到那个 script 节点。
2. **Create/Update Render CSSOM**：CSS文件下载完成，开始构建CSSOM
3. **Create/Update Render Tree**：所有CSS文件下载完成，CSSOM构建结束后，和 DOM 一起生成 Render Tree。
4. **Layout**：有了Render Tree，浏览器已经能知道网页中有哪些节点、各个节点的CSS定义以及他们的从属关系。下一步操作称之为Layout，顾名思义就是计算出每个节点在屏幕中的位置。
5. **Painting**：Layout后，浏览器已经知道了哪些节点要显示（which nodes are visible）、每个节点的CSS属性是什么（their computed styles）、每个节点在屏幕中的位置是哪里（geometry）。就进入了最后一步：Painting，按照算出来的规则，通过显卡，把内容画到屏幕上。

以上五个步骤前3个步骤之所有使用 “Create/Update” 是因为DOM、CSSOM、Render Tree都可能在第一次Painting后又被更新多次，比如JS修改了DOM或者CSS属性。

Layout 和 Painting 也会被重复执行，除了DOM、CSSOM更新的原因外，图片下载完成后也需要调用Layout 和 Painting来更新网页。

**值得注意的地方**：

1. 首屏时间和DomContentLoad事件没有必然的先后关系
2. 所有CSS尽早加载是减少首屏时间的最关键,因为渲染树需要CSSOM的参与
3. js的下载和执行会阻塞Dom树的构建（严谨地说是中断了Dom树的更新），所以script标签放在首屏范围内的HTML代码段里会截断首屏的内容。**也就是说，会只显示在script上方的内容。**
4. 普通script标签放在body底部，做与不做async或者defer处理，都不会影响首屏时间，但影响DomContentLoad和load的时间，进而影响依赖他们的代码的执行的开始时间。

## DOM树构建过程

DOM 树的构建过程是一个深度遍历过程：当前节点的所有子节点都构建好后才会去构建当前节点的下一个兄弟节点。DOM 和 CSSOM 都是以 Bytes → characters → tokens → nodes → object model. 这样的方式生成最终的数据。如下图所示：

![]({{site.url}}/assets/img/browser-render/DOM-tree.png)

## 渲染树
DOM 和 CSSOM 合并后生成 Render Tree：

![]({{site.url}}/assets/img/browser-render/render-tree.png)

**注意**：display:none 的节点不会被加入 Render Tree，而 visibility: hidden 则会，所以，如果某个节点最开始是不显示的，设为 display:none 是更优的。

## 图片加载时机

参考【3】

* 解析HTML**遇到`<img>`标签加载图片** —> 构建DOM树
* 加载样式 —> 解析样式 **遇到背景图片链接不加载** —> 构建样式规则树
* 加载javascript —> 执行javascript代码
* 把DOM树和样式规则树匹配构建渲染树 **加载渲染树上的背景图片**
* 计算元素位置进行布局
* 绘制 **开始渲染图片**

![]({{site.url}}/assets/img/browser-render/img-load-time.png)

这里需要注意：

**设置了display:none属性的元素，图片不会渲染出来，但会加载**

```html
<style>
.img-purple {
    background-image: url(../image/purple.png);
}
</style>
<img src="../image/pink.png" style="display:none">
<div class="img-purple" style="display:none"></div>
```

![]({{site.url}}/assets/img/browser-render/display-none-img.png)

**这里是我不明白的地方，如果按照上图的解释，purple那张图应该不会加载**

# 阻塞渲染：CSS 与 JavaScript

现代浏览器总是并行加载资源。例如，当 HTML 解析器（HTML Parser）被脚本阻塞时，解析器虽然会停止构建 DOM，但仍会识别该脚本后面的资源，并进行预加载。不同浏览器并行加载的数量可能会不同，chrome对于同个域名，一次最多并行加载6个资源。

同时，由于下面两点：

*	默认情况下，CSS 被视为阻塞渲染的资源，这意味着浏览器将不会渲染任何已处理的内容，直至 CSSOM 构建完毕。
*	JavaScript 不仅可以读取和修改 DOM 属性，还可以读取和修改 CSSOM 属性。 

存在阻塞的 CSS 资源时，浏览器会延迟 JavaScript 的执行和 DOM 构建。另外：

1.	当浏览器遇到一个 script 标记时，DOM 构建将暂停，直至脚本完成执行。
2.	JavaScript 可以查询和修改 DOM 与 CSSOM。
3.	CSSOM 构建时，JavaScript 执行将暂停，直至 CSSOM 就绪。 

# defer 与 async
## defer

```html
<script src="app1.js" defer></script>
<script src="app2.js" defer></script>
<script src="app3.js" defer></script>
```
defer 属性表示延迟执行引入的 JavaScript，即这段 JavaScript 加载时 HTML 并未停止解析，这两个过程是并行的。整个 document 解析完毕且 defer-script 也加载完成之后（这两件事情的顺序无关），会**执行所有由 defer-script 加载的 JavaScript 代码，然后触发 DOMContentLoaded 事件**。

**defer 不会改变 script 中代码的执行顺序**，示例代码会按照 1、2、3 的顺序执行。

所以，defer 与相比普通 script，有两点区别：

* 载入 JavaScript 文件时不阻塞 HTML 的解析，
* 执行阶段被放到 HTML 标签解析完成之后。

## async

```html
<script src="app.js" async></script>
<script src="ad.js" async></script>
<script src="statistics.js" async></script>
```

async 属性表示异步执行引入的 JavaScript，与 defer 的区别在于，如果已经加载好，就会开始执行——无论此刻是 HTML 解析阶段还是 DOMContentLoaded 触发之后。需要注意的是，这种方式加载的 JavaScript 依然会阻塞 load 事件。换句话说，**async-script 可能在 DOMContentLoaded 触发之前或之后执行，但一定在 load 触发之前执行**。

从上一段也能推出，**多个 async-script 的执行顺序是不确定的**。值得注意的是，向 document 动态添加 script 标签时，async 属性默认是 true

## 试验验证

```html
<body>
    <script src="./lodash.js" defer></script>
    <!-- <script src="./lodash.js" async></script> -->
</body>
```

在chrome -> network中，将网速调成`slow 3G`，然后测试`lodash`是在`DOMContentLoaded`之前还是之后加载完成.

`defer` - 始终在`DOMContentLoaded`之前完成，最差情况下也是一起完成

![]({{site.url}}/assets/img/browser-render/defer-domcontentloaded.png)

`async` - 网速快时会在`DOMContentLoaded`之前加载完成，网速慢时会在它之后完成

![]({{site.url}}/assets/img/browser-render/async-domcontentload.png)


# 重绘 Repaint

当页面元素样式的改变不影响元素在文档流中的位置时（例如background-color, border-color,visibility）,浏览器只会将新样式赋予元素并进行重绘操作。

# 回流/重排 Reflow

当改变影响文档内容或者结构，或者元素位置时，回流操作就会被触发，一般有以下几种情况：

* DOM操作（对元素的增删改，顺序变化等）；
* 内容变化，包括表单区域内的文本改变；
* CSS属性的更改或重新计算；
* 增删样式表内容；
* 修改class属性；
* 浏览器窗口变化（滚动或缩放）；
* 伪类样式激活（:hover等）。 

# 参考
1. [前端开发者应知必会：浏览器是如何渲染网页的](https://mp.weixin.qq.com/s/1XDgtEFb_6YHxcdJQ92rbg)
2. [JS 一定要放在 Body 的最底部么？聊聊浏览器的渲染机制](https://mp.weixin.qq.com/s/I9IgzC_NvKLP2-TmuDTSKQ)
3. [Web图片资源的加载与渲染时机](https://mp.weixin.qq.com/s/1neKv_knMnnzb1hyRx789Q)

