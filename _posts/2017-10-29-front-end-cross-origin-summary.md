---
title: "前端跨域方法小结"
img: indonesia.jpg # Add image post (optional)
date: 2017-10-29 22:30:00 +0800
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [CROSS-ORIGIN,JAVASCRIPT]
---

# 前言

在公众号中陆陆续续有看到一些讲前端跨域的文章，自己工作中也用到了一些。印象中的跨域方法有很多种，但一直记不全，索性将之前收藏的文章再过一遍，自己做个总结，以后就不用辛苦翻看那些零散的文档了。🙄🙄🙄

# `JSONP`
### 适用范围
前端向跨域后端接口请求数据。

### 缺陷

1. 它没有关于`JSONP`调用的错误处理，一旦回调函数调用失败，浏览器会以静默失败的方式处理。
2. 它只支持`GET`请求，这是由于该技术本身的特性所决定的。因此，对于一些需要对安全性有要求的跨域请求，`JSONP`的使用需要谨慎一点了。

### 优点
由于`JSONP`对于老浏览器兼容性方面比较良好，因此，对于那些对`IE8`以下仍然需要支持的网站来说，仍然被广泛应用。

### 原理
通过`script`标签引入的`js`是不受同源策略的限制的。所以我们可以通过`script`标签引入一个`js`或者是一个其他后缀形式（如`php`等）的文件，此文件返回一个`js`函数的调用。`JSONP`正是利用这个特性来实现的。

### 示范
详细细节参考【1】，大致如下：

**前端**

```html
<script type="text/javascript">
    function dosomething(jsondata){
        //处理获得的json数据
    }
</script>
<script src="http://example.com/data.php?callback=dosomething"></script>
```

**后端**

```php
$callback = $_GET['callback'];//得到回调函数名
$data = array('a','b','c');//要返回的数据
echo $callback.'('.json_encode($data).')';//输出
```

或者利用jquery封装的方法

```html
<script type="text/javascript">
    $.getJSON('http://example.com/data.php?callback=?,function(jsondata)'){
        //处理获得的json数据
    });
</script>
```

# `document.domain`
### 适用范围
两个前端页面拥有共同的主域，但子域不同，可自由相互通信。

推荐一个使用iframe跨域的库`https://github.com/jpillora/xdomain`。

### 示范
详细细节参考【1】，大致如下：

把`http://www.example.com/a.html` 和 `http://example.com/b.html`这两个页面的`document.domain`都设成相同的域名就可以了。

但要注意的是，`document.domain`的设置是有限制的，我们只能把`document.domain`设置成自身或更高一级的父域，且主域必须相同。例如：`a.b.example.com` 中某个文档的`document.domain` 可以设成`a.b.example.com`、`b.example.com` 、`example.com`中的任意一个，但是不可以设成 `c.a.b.example.com`,因为这是当前域的子域，也不可以设成`baidu.com`,因为主域已经不相同了。

# window.name
### 适用范围
两个前端页面完全跨域，更多用于单向通信

### 原理
`window`对象有个`name`属性，该属性有个特征：即在一个窗口(`window`)的生命周期内,窗口载入的所有的页面都是共享一个`window.name`的，每个页面对`window.name`都有读写的权限，`window.name`是持久存在一个窗口载入过的所有页面中的，并不会因新页面的载入而进行重置。

### 示范
详细细节参考【1】。

其中A页面若想和跨域的B页面通信，可以在A下利用一个`iframe`先加载B，往`window.name`中设置数据，再利用此`iframe`转到与A同域的任一页面，此时A就能直接从`iframe`的`window.name`中拿数据了。

# `iframe`+`location.hash`
### 适用范围
两个前端页面完全跨域，可自由相互通信。

### 原理
与上面介绍的`window.name`有一点类似，只不过一个是修改`name`，一个是修改`url hash`。

监听`hash`变化可以使用`onhashchange`事件，在不支持的浏览器上通过只能通过定时器轮询。

### 缺点
1. 在改变`hash`时还会增加浏览器历史记录。
2. 数据直接暴露在了`url`中，数据容量和类型都有限等。

### 示范
此方法用的比较少，详细细节参照【2】

# `window.postMessage`
### 适用范围
两个前端页面完全跨域，可自由相互通信。此为`HTML5`的API，具体使用可以参见`MDN`，在此不详述。

# 反向代理
主要是利用`http`服务器例如`nginx`的反向代理配置来转发请求。例如：

```
{
     "/test-nginx": {
        "target": "http://localhost:3000",
        "secure": false,
        "pathRewrite": {
            "^/test-nginx": ""
        }
    }
}
```

# `CORS`
### 适用范围
与`JSONP`类似，前端向跨域后端接口请求数据。

### 优点
1. 除了 `GET` 方法外，也支持其它的 `HTTP` 请求方法如 `POST`、 `PUT` 等。
2. 可以使用 `XHR`进行传输，所以它的错误处理方式比 `JSONP` 好。

### 原理
通过一系列新增的`HTTP`头信息来实现服务器和客户端之间的通信。所以，要支持`CORS`，服务端需要做好相应的配置。具体细节参见【5】

# 其他
* `WebSocket`协议跨域【3】

【4】中介绍了一种在两个完全不相干的浏览器跨域tab页之间进行通信的技巧，核心思想是这两个tab页都嵌入一个`iframe`，两个`iframe`加载两个同域的页面。 tab页和`iframe`之间的通信可以使用上面说的方法（例如`postMessage`），两个`iframe`之间因为是同域的，可以使用`localStorage`传递数据。
![]({{site.url}}/assets/img/cross-origin/tabs-communicate.png)

# 参考
1. [JS 中几种实用的跨域方法原理详解](https://mp.weixin.qq.com/s/IWMm7t5362xrj9WRoTlPfw)
2. [JavaScript 跨域总结与解决办法](https://mp.weixin.qq.com/s/Ulh3dq-9eHwbS2ggOcu7jA)
3. [前端常见跨域解决方案（全）](https://mp.weixin.qq.com/s/fDlyrRTv6zp-PQ1iRkTpBQ)
4. [跨浏览器tab页的通信解决方案尝试](https://mp.weixin.qq.com/s?__biz=MjM5MTA1MjAxMQ==&mid=2651226984&idx=1&sn=4fbe4e3903afbf5f33035870b38d04b5&chksm=bd495aec8a3ed3fa86404f9d24d326a7aeab481f9fd61bbbf818be78099d1559c7025413ed4e&scene=21#wechat_redirect)
5. [详解 CORS 跨域资源共享](https://mp.weixin.qq.com/s/-1FUAU29nBGzvOWquEzunQ)

