---
title: "浏览器缓存机制总结"
img: alaska.jpg # Add image post (optional)
date: 2017-10-16 23:00:00 Asia/Shanghai
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [CACHE,HTTP]
---

# 前言

前段时间在优化我们的一个前端项目，其中利用了浏览器的缓存机制，学习了一部分相关的`HTTP`头部的作用。索性翻出以前收藏的关于浏览器缓存机制的文章，做一个总结。相关参考文章放在了最后。

# 相关 Http 头部

## 缓存过期策略

### Cache-Control

#### 介绍

一个复合规则, 包含多种值, 横跨 存储策略, 过期策略 两种, 同时在请求头和响应头都可设置.语法为:

```
Cache-Control : cache-directive
```

`Cache-directive`共有如下 12 种(其中请求中指令 7 种, 响应中指令 9 种):

![](http://mmbiz.qpic.cn/mmbiz_jpg/meG6Vo0Mevh6ZLFbFgzubdHxOMcGJqZiaKQwGVkpNouAbTtzny711xHhvaqx17f4LW0Q0pRd8QNyV3zHav5FJoA/640?wx_fmt=jpeg&tp=webp&wxfrom=5&wx_lazy=1)

**`Cache-Control`有三种属性：缓冲能力、过期时间和二次验证**。

首先是**缓冲能力，它关注的是缓存到什么地方，和是否应该被缓存**。他的几个重要的属性是：

* `private`：表示它只应该存在本地缓存；
* `public`：表示它既可以存在共享缓存，也可以被存在本地缓存；
* `no-cache`：表示不论是本地缓存还是共享缓存，在使用它以前必须用缓存里的值来重新验证；
* `no-store`：表示不允许被缓存。

第二个是**过期时间，很显然它关注的是内容可以被缓存多久**。它的几个重要的属性是：

* `max-age=<seconds>`：设置缓存时间，设置单位为秒。本地缓存和共享缓存都可以；
* `s-maxage=<seconds>`：覆盖 max-age 属性。只在共享缓存中起作用。

最后一个是**二次验证，表示精细控制**。它的几个重要属性是：

* `immutable`：表示文档是不能更改的。
* `must-revalidate`：表示客户端（浏览器）必须检查代理服务器上是否存在，即使它已经本地缓存了也要检查。
* `proxy-revalidata`：表示共享缓存（CDN）必须要检查源是否存在，即使已经有缓存。

#### 详细解释

1.  **`max-age`**

    指定设置缓存最大的有效时间，定义的是时间长短。当浏览器向服务器发送请求后，在 max-age 这段时间浏览器就不会再向服务器发送请求了。

    **`max-age`会覆盖掉`Expires`**

    ![](http://mmbiz.qpic.cn/mmbiz/zPh0erYjkib2D4WtKTwFjia6LOoTP8ZGh8QQY6OlmIfZneIDnRHLhMdVoMgRiaZhibRDzG7VZBwmeKex2cpsrytl4g/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1)

2.  **`s-maxage`**

    同`max-age`，只用于共享缓存（比如 CDN 缓存）

    比如，当`s-maxage`=60 时，在这 60 秒中，即使更新了`CDN`的内容，浏览器也不会进行请求。也就是说`max-age`用于普通缓存，而`s-maxage`用于代理缓存。**如果存在`s-maxage`，则会覆盖掉`max-age`和`Expires`**。

3.  **`public`**

    指定响应会被缓存，并且在多用户间共享。也就是下图的意思。**如果没有指定`public`还是`private`，则默认为`public`**

    ![](http://mmbiz.qpic.cn/mmbiz/zPh0erYjkib2D4WtKTwFjia6LOoTP8ZGh8Cg1zJUEs2bxE7RwfeibUW9dn8YFEzrgRUn5ZPJxghtZtoTicxnYZNVWQ/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1)

4.  **`private`**

    只作为私有的缓存（见下图），不能在用户间共享。**如果要求`HTTP`认证，响应会自动设置为`private`**。

    ![](http://mmbiz.qpic.cn/mmbiz/zPh0erYjkib2D4WtKTwFjia6LOoTP8ZGh8OL46IMZjco3MibibBb1ZHQkLibIhpryUtssj6hwvAngxMaiaSqNjBUtjrA/640?tp=webp&wxfrom=5&wx_lazy=1)

5.  **`no-cache`**

    指定不缓存响应，表明资源不进行缓存.

    ![](http://mmbiz.qpic.cn/mmbiz/zPh0erYjkib2D4WtKTwFjia6LOoTP8ZGh8HmoFicWNkZ8GO2O5p5zFVmHE9QFVeyuAy7AdDL8T6iavSxqpx16fG6JA/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1)

    **但是设置了`no-cache`之后并不代表浏览器不缓存，而是在缓存前要向服务器确认资源是否被更改**。因此有的时候只设置 no-cache 防止缓存还是不够保险，还可以加上 private 指令，将过期时间设为过去的时间。

6.  **`no-store`**

    绝对禁止缓存，每次请求资源都要从服务器重新获取.

#### 如何选 cache-control

![](http://mmbiz.qpic.cn/mmbiz/zPh0erYjkib2D4WtKTwFjia6LOoTP8ZGh8Dncr9JUkdCoEAzR0hNbLFy5ibQMEpRrtKeibFxaw3Kvof30jFMiaTxDOw/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1)

### Expires

缓存过期时间，用来指定资源到期的时间，是服务器端的具体的时间点。`Expires`是 Web 服务器响应消息头字段，在响应 http 请求时告诉浏览器在过期时间前浏览器可以直接从浏览器缓存取数据，而无需再次请求。

![](http://mmbiz.qpic.cn/mmbiz/zPh0erYjkib2D4WtKTwFjia6LOoTP8ZGh8LHN0WGnaGXBDicP53guP8a8WC6z86MUnaI9FYzlGtUPArXQ5TBuFVZw/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1)

### Pragma

http1.0 字段, 通常设置为`Pragma:no-cache`, 作用同`Cache-Control:no-cache`. 当一个`no-cache`请求发送给一个不遵循 HTTP/1.1 的服务器时, 客户端应该包含 pragma 指令.

![](http://mmbiz.qpic.cn/mmbiz_png/meG6Vo0Mevh6ZLFbFgzubdHxOMcGJqZiatpllYvmaSkITypicxGYoibFsf8uYZc6oQVZCwkjJOKxn2VkZgicJAWZlw/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1)

### 浏览器默认过期时间

如果`Expires`、`Cache-Control: max-age` 或 `Cache-Control:s-maxage` 都没有在响应头中出现, 并且也没有其它缓存的设置, 那么浏览器默认会采用一个启发式的算法, 通常会取响应头的`Date`值- `Last-Modified`值的 10%作为缓存时间.

![](http://mmbiz.qpic.cn/mmbiz_png/meG6Vo0Mevh6ZLFbFgzubdHxOMcGJqZiaJLiaBJlOqZhGhSLkCAyEwUaTSFRBgwbE6Ikn2zfyb4G45uz8k7XQR2A/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1)

## 缓存协商

### Last-modified 、If-Modified-Since、If-Unmodified-Since

`Last-modified`是服务器端文件的最后修改时间，是检查服务器端资源是否更新的一种方式。当浏览器本地缓存过期时，会向服务器传送`If-Modified-Since`报头，询问`Last-Modified`时间点之后资源是否被修改过。如果没有修改，则返回码为 304，使用缓存；如果修改过，则再次去服务器请求资源，返回码和首次请求相同为 200，资源为服务器最新资源。

![](http://mmbiz.qpic.cn/mmbiz/zPh0erYjkib2D4WtKTwFjia6LOoTP8ZGh8QPtnpWibru4c8oWYr4M7sVZ8BD3uyZ5aRGOswgjIiajWf1qLlFaia2lwQ/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1)

### ETag、If-Match、If-None-Match

`ETag`是服务器根据实体内容生成的一段 hash 字符串，标识资源的状态。浏览器本地缓存过期时会将这串字符串放入`If-None-Match`请求头部传回服务器，验证资源是否已经修改。如果修改了返回 200，反之返回 304.

![](http://mmbiz.qpic.cn/mmbiz/zPh0erYjkib1skDuWvye9Lj3nYy9xy9ZhzibibjvTnvDefteCshCIl3YiaZr6HjicmUxWfbBT3tBlmI0PlyMicj8oelw/640?tp=webp&wxfrom=5&wx_lazy=1)

**`ETag`的优先级高于`Last-modified`.使用`ETag`可以解决`Last-modified`存在的一些问题**：

* 某些服务器不能精确得到资源的最后修改时间，这样就无法通过最后修改时间判断资源是否更新

* 如果资源修改非常频繁，在秒以下的时间内进行修改，而`Last-modified`只能精确到秒

* 一些资源的最后修改时间改变了，但是内容没改变，使用`ETag`就认为资源还是没有修改的。

# from memory cache 和 from disk cache

浏览器读取缓存的顺序是 `memory` -> `disk`.

**from memory cache** 表示使用内存中的缓存

* 快速读取： 会将编译解析后的文件，直接存入该进程的内存中，占据该进程一定的内存资源，以方便下次运行时的快速读取
* 时效性： 一旦该进程关闭，则该进程的内存会清空。

**from disk cache**表示使用的是硬盘中的缓存， 读取缓存需要对该缓存存放的硬盘文件进行 IO 操作，然后重新解析该缓存内容，读取复杂，比 memory cache 慢。

> 在浏览器中，会在 js 和图片等文件解析执行后直接放在内存缓存中，那么当刷新页面时只需直接从内从缓存中读取；而 css 文件则会存入硬盘文件中，每次都是`from disk cache`.

# LocalStorage、SessionStorage

参考【4】描述了微信文章是如何使用`LocalStorage`缓存资源的。

# 缓存机制流程图

盗用两张图

![](http://mmbiz.qpic.cn/mmbiz/zPh0erYjkib1skDuWvye9Lj3nYy9xy9ZhyicOTeTavSBYGSicyt8ac5hvbZ2ZLDVyLXfaW1Qicb23sYrAOFepfk6sA/640?wx_fmt=jpeg&tp=webp&wxfrom=5&wx_lazy=1)

![](http://mmbiz.qpic.cn/mmbiz/zPh0erYjkib1skDuWvye9Lj3nYy9xy9ZhEt5013jpXNj73fH1HyMvBHRYo9EKibcIvC6JH6unUED7KKWnIdx7sbg/640?wx_fmt=jpeg&tp=webp&wxfrom=5&wx_lazy=1)

# CDN 缓存

我们的内网项目中没有用到`CDN`，对这块也没有实际经验，不过参考【6】、【7】对这块有很详细的描述。

其中【7】中描述了`cookie`对缓存的影响，值得一看。

# 禁用缓存

1.  文件添加版本号
2.  `CDN`清除缓存，见参考【7】
3.  利用`Cache-Control`中的指令，比如
    ```
     Cache-Control:no-store,max-age=0
    ```

# 参考

1.  [浅谈 Web 缓存](http://mp.weixin.qq.com/s/MLmxeIlX6Zy7Uy98SEWbFw)
2.  [浏览器缓存机制剖析](http://mp.weixin.qq.com/s/yf0pWRFM7v9Ru3D9_JhGPQ)
3.  [浏览器缓存机制浅析](http://mp.weixin.qq.com/s/F5gvzdi6MTwCFXV9LKs9NQ)
4.  [localStorage 的黑科技-js 和 css 缓存机制](http://mp.weixin.qq.com/s/NplDQkr2JYaEwTVcRd0vwQ)
5.  [浏览器缓存机制剖析](http://mp.weixin.qq.com/s/yf0pWRFM7v9Ru3D9_JhGPQ)
6.  [掌握 HTTP 缓存——从请求到响应过程的一切（上）](http://mp.weixin.qq.com/s/tluGR6Xc2tCjtaOLWO9q6Q)
7.  [掌握 HTTP 缓存——从请求到响应过程的一切（下）](http://mp.weixin.qq.com/s/0ZgM2jW2a0OUziBMYVnsOg)
