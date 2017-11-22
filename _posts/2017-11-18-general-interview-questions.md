---
title: "前端常见一般面试题"
img: canyon.jpg # Add image post (optional)
date: 2017-11-18 11:25:00 +0800
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [INTERVIEW]
---

# 题库

[Front-end-Developer-Interview-Questions](https://github.com/h5bp/Front-end-Developer-Interview-Questions)

其他人的回答：

* [简书](http://www.jianshu.com/p/d93c8dab3895)
* [kujian](http://caibaojian.com/f2e-interview.html)

# 你最近遇到过什么技术挑战？你是如何解决的？

**ionic懒加载黑屏、返回键问题**

TODO复制pdf文档，**添加通过学习nodejs、vscode的调试工具来加快理解并修改ionic的构建流程**

**WK webview解决列表分页加载问题**

**TODO复制pdf文档**

**pc端分页组件**

在我们pc端有很多分页列表页面，顶部是一个个性的搜索区域，中间是列表展示区域，底部有分页区域。

在我之前的人都是拷贝已有的代码，我做了两个这样的页面之后，发现有相当多的代码是通用的。于是就想着怎么做一个通用的组件出来，于是花了一个周末写了一个这样的组件，并在我写的第三个分页列表页面中用上了，成倍的提升了效率。

同时我将编写组件的思路总结成了博客文章，并将代码上传到了我的`github`上。

其实我一直喜欢封装公用组件，在很早前做移动端ionic项目时，也封装了一个类似的组件，不过只适用于自己小组的项目。

于是在封装pc端的这个组件时，我一开始就想着要做的更好更通用些，不仅要支持自己小组的项目，而是别的小组拿过去也能很方便的使用。

# 在制作一个网页应用或网站的过程中，你是如何考虑其 UI、安全性、高性能、SEO、可维护性以及技术因素的？

## 安全性

**见博客[前端安全](https://hellogithub2014.github.io/web-safe/)**

## 可维护性

**目录结构**

我们移动端的Angular+ionic项目最开始是由我搭建起来的，在最初就考虑了这个问题，我的做法时遵循angular官网的规范，将应用划分模块，使用组件化开发，同时指定公共组件、公共服务的目录结构。这种结构可以很好的支持多个小组同时协作开发，很大程度上避免了提交代码时的冲突。我们同时有4个小组的人在这个项目上开发，一个应用光是页面就有130+。

**代码规范**

由我主动牵头制定了部门级前端typescript代码规范，同时推广了tslint检查工具的使用，并说服了部门的大部分人同意开启严格规范检查。

**公共功能拆分应用**

我们部门目前有3~4个移动端应用，他们有一些功能是相同的，之前都是通过代码拷贝的方式来进行维护，易错且麻烦。后来由我最开始提出并实施了拆分应用的想法，将其中一个最常用的功能拆分成了独立应用，并将所用细节总结成了文档分享给了部门其他人，现在每个小组都在陆陆续续拆分公共应用。

## UI

应当建立应用级的UI规范，譬如字体、颜色、组件样式等都应当在早期就确定好，这样可以在很大程度上提高开发效率，开发人员不用就每个展示细节询问UI设计师，直接参考规范文档即可。

## SEO

我们做的应用是给自己的客户经理使用，不怎么关注SEO，但了解过angular universal的服务端渲染。

## 高性能

**后端**

分库分表、redis缓存、es搜索、单表查询

**前端**

参照前端性能优化回答

## 技术因素

围绕业务实现的目标，我们部门做的是CRM系统，偏向管理类型后台那种，功能点较多，经常会多个团队在一个大项目中分工开发。所以在前框框架上更喜欢大而全的Anuglar，因为不用所有东西都不用折腾了，省去了很多团队间沟通成本。

另外，我们很多前端开发人员是从java后端转过来的，他们在学习typescript时会非常快，降低了门槛。

最后，我们很早以前是使用的angular.js的，当时部门与一个业界大牛建立了良好的合作关系。那位大牛在Angular社区也非常有影响力，我们也想好好利用这种关系，在遇到搞不定的难题时也可以去请教一番。

# 你能描述当你制作一个网页的工作流程吗？

1. 分析原型图，理解页面结构及交互逻辑
2. 编写静态页面，在使用jQuery和Angular开发时有所不同
	1. jquery我会先把mock数据写死在html中，然后添加各种css，最后达到原型图的要求
	2. Angular因为是MVVM的框架，我会先将数据模型建好，并mock数据，然后模板文件中可以不区别是否是mock数据；同时会尽量拆分组件，这样可以兼顾可维护性和可扩展性。
	3. 不管是jquery还是Angular都会尽量利用已有的公共组件提高效率；同时如果发现有类似功能，会抽象成公共组件
3. 如果页面交互逻辑比较复杂，会先写好自测集
3. 编写页面交互逻辑，对于ajax请求，会使用mock库来模拟后台返回的数据；此过程会不断利用自测集来驱动代码开发
4. 遵循自测集进行功能测试
5. 测试浏览器兼容性，主要是ie9
6. 页面性能优化

# 假若你有 5 个不同的样式文件 (stylesheets), 整合进网站的最好方式是?

1. 提取公共样式为单独文件
2. 利用工具将他们压缩为一份，减少http请求数目

# 你能描述渐进增强 (progressive enhancement) 和优雅降级 (graceful degradation) 之间的不同吗?

**渐进增强** - 一开始值构建站点的最小特性，然后不断针对每个浏览器追加功能，性能越好的设备能够显示更加出众的效果。
**优雅降级** - 一开始就构造站点的完整功能，然后针对浏览器测试和修复。

# 你如何对网站的文件和资源进行优化？

从前端性能优化的角度回答

# 浏览器同一时间可以从一个域名下载多少资源？有什么例外吗？

一般来说是6个，例如chrome浏览器。

**例外:HTTP2**

HTTP2的多路复用允许同时通过单一的 HTTP/2 连接发起多重的请求-响应消息。

HTTP/1.1

![]({{site.url}}/assets/img/general-interview-questions/http1.1.png)

HTTP/2

![]({{site.url}}/assets/img/general-interview-questions/http2.png)

![]({{site.url}}/assets/img/general-interview-questions/compare-http1-http2.png)

# 请说出三种减少页面加载时间的方法。(加载时间指感知的时间或者实际加载时间)

从前端性能优化的角度回答

# 请写一个简单的幻灯效果页面。

**考察的是css动画**

参考如下：

```html
<!DOCTYPE html>
<html>
<head>
    <title></title>
    <style type="text/css">
        .myDiv {
            width: 600px;
            height: 400px;
            margin: 20px auto;
            background-size: over;
            background-position: center;
            -webkit-animation-name: 'loop';
            -webkit-animation-duration: 20s;
            -webkit-animation-iteration-count: infinite;
        }
        @-webkit-keyframes "loop"{
            0% {background: url(http://img5.duitang.com/uploads/blog/201408/12/20140812150016_8NMUU.jpeg) no-repeat;}
            25% {background: url(http://pic29.nipic.com/20130518/9908282_142904524164_2.jpg) no-repeat;}
            50% {background: url(http://uploadfile.huiyi8.com/2014/0605/20140605114503719.jpg) no-repeat;}
            75% {background: url(http://img3.redocn.com/20100322/Redocn_2010032112222793.jpg) no-repeat;}
            100% {background: url(http://uploadfile.huiyi8.com/2014/0605/20140605114447934.jpg) no-repeat;}
        }
    </style>
</head>
<body>
    <div class="myDiv"></div>
</body>
</html>
```

# 什么是 FOUC (无样式内容闪烁)？你如何来避免 FOUC？

Flash Of Unstyled Content

1. IE浏览器上如果页面引用样式的方式是采用@import，并且css文件放在了页面底部，出现短暂的闪烁。
2. 原因：当样式表晚于结构性html加载，当加载到此样式表时，页面将停止之前的渲染。此样式表被下载和解析后，将重新渲染页面，也就出现了短暂的花屏现象。

解决方法：将样式表放在文档HEAD中。

**另外** - 在谷歌浏览器上进行了测试，即使将css文件放在底部，也不会出现闪烁。

# 请解释 CSS 动画和 JavaScript 动画的优缺点。

**TODO  学习css、js动画**

[segmentfault](https://segmentfault.com/q/1010000000645415)
[cnblogs](https://www.cnblogs.com/wangpenghui522/p/5394778.html)

# 什么是跨域资源共享 (CORS)？它用于解决什么问题？
**参考跨域博客[](https://hellogithub2014.github.io/front-end-cross-origin-summary/)**

# 前端性能优化

1. 减少资源请求数，合并多个css/js文件
2. css文件放置在head，js放置在文档尾部；并酌情使用async、defer、pre-load。
2. gzip压缩
3. 利用HTTP缓存 [浏览器缓存博客](https://hellogithub2014.github.io/browser-cache-summary/)
4. 图片使用雪碧图，或合并到字体文件中
5. 使用骨架屏优化用户体验（以pc端评论为例）
6. cdn托管
7. 静态资源放在多个域名下，规避浏览器的最大同时请求数目


