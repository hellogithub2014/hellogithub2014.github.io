---
title: "前端效率与网络相关面试题"
img: canyon.jpg # Add image post (optional)
# date: 2017-11-18 11:25:00 +0800
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [INTERVIEW,NETWORK,PERFORMANCE]
---

# 题库

[Front-end-Developer-Interview-Questions](https://github.com/h5bp/Front-end-Developer-Interview-Questions)

# 效率相关

## 你会用什么工具来查找代码中的性能问题？

1. 使用chrome控制台的`network`面板查看应用启动的性能
2. 使用`performance`面板查看`timeline`和`cpu profiler`
3. 使用`memory`面板查看内存使用情况
4. 使用Fiddler抓包分析真机上发出的Http请求

## 你会用什么方式来增强网站的页面滚动效能？

1. 如果在滚动时会执行一些操作并反映到dom元素上，那么可以考虑使用函数节流来避免太频繁的dom操作
2. 资源预加载，很多时候会一边滚动一边渲染新的页面元素，可以先将这些资源缓存起来
3. 在列表页中可能会给每个列表项注册一些事件处理函数，如果每次渲染出新的列表项都单独注册事件处理函数，那么就可能浪费内存从而造成卡顿。 考虑使用事件代理，将所有事件处理都注册到列表本身上。

## 请解释 layout、painting 和 compositing 的区别。

这些都是浏览器渲染页面时的步骤，**[参考博客](https://hellogithub2014.github.io/browser-render-summary/)**

# 网络相关

## 为什么传统上利用多个域名来提供网站资源会更有效？

因为在HTTP1中，每个域名同时请求资源数目有一个最大限制，一般是6或者4。 如果网站资源数比较多，那么后面的资源就会等待，为了避免这种限制，会考虑将资源部署到多个域名中。这样网站的启动速度就会变快。

如果在以后使用了HTTP2，它具有多路复用的能力，就不用这么做了。

## 请尽可能完整得描述从输入 URL 到整个网页加载完毕及显示在屏幕上的整个流程。

**[参考博客](https://hellogithub2014.github.io/how-do-network-connect/)**

## Long-Polling、Websockets 和 Server-Sent Event 之间有什么区别？

[参考1](http://blog.csdn.net/liang0000zai/article/details/40537059)
[参考2](http://blog.csdn.net/lambert310/article/details/52911889)

**AJAX Polling**

1.	客户端使用普通的http方式向服务器端请求网页
2.	客户端执行网页中的JavaScript轮询脚本，定期循环的向服务器发送请求（例如每5秒发送一次请求），获取信息
3.	服务器对每次请求作出响应，并返回相应信息，就像正常的http请求一样.

**AJAX Long-Polling**

1.	客户端使用普通的http方式向服务器端请求网页
2.	客户端执行网页中的JavaScript脚本，向服务器发送数据、请求信息
3.	服务器并不是立即就对客户端的请求作出响应，而是等待有效的更新
4.	当信息是有效的更新时，服务器才会把数据推送给客户端
5.	当客户端接收到服务器的通知时，立即会发送一个新的请求，进入到下一次的轮询

**SSE/EventSource**

1.	客户端使用普通的http方式向服务器端请求网页
2.	客户端执行网页中的JavaScript脚本，与服务器之间建立了一个连接
3.	当服务器端有有效的更新时，会发送一个事件到客户端
	* 服务器到客户端数据的实时推送，大多数内容是你需要的
	* 你需要一台可以做Event Loop的服务器
	* 不允许跨域的连接

客户端对数据的通信是通过js的EventSource来进行的，EventSource提供了三个事件：

1. open：当成功建立连接时产生
2. message：当接收到消息时产生
3. error：当出现错误时产生

```js
var es = new EventSource("/sse.php");  
es.addEventListener("message", function(e){  
   j = JSON.parse(e.data);  
  		document.getElementById("sse_content").innerHTML += "\n" + j.test;  
},false);  
```

**HTML5 Websockets**

1.	客户端使用普通的http方式向服务器端请求网页
2.	客户端执行网页中的JavaScript脚本，与服务器之间建立了一个连接
3.	服务器和客户端之间，可以双向的发送有效数据到对方
	*	服务器可以实时的发送数据到客户端，同时客户端也可以实时的发送数据到服务器
	*	你需要一台可以做Event Loop的服务器
	*	使用 WebSockets 允许跨域的建立连接
	*	它同样支持第三方的websocket主机服务器，例如Pusher或者其它。这样你只需要关心客户端的实现 ，降低了开发难度。

可以参考**《图解HTTP》**中对于Web socket的描述。

```js
var socket = new WebSocket('ws://example.com/test');
socket.onopen=function(){
	setInterval(function(){
		if(socket.bufferedAmount == 0){
			socket.send(getUpdatedDate());
		}
	},50);
};
```

**Comet**

Comet是一种用于web的推送技术，能使服务器实时地将更新的信息传送到客户端，而无须客户端发出请求，目前有两种实现方式，长轮询和iframe流。

**区别**

SSE和websocket不同的是，ws是全双工的，本质上是一个额外的tcp连接，而sse是直接建立在当前http连接上的，本质上是保持一个http长连接，但是和comet不同的是：comet是每次服务端返回数据后，连接关闭然后客户端马上再次发起连接。而sse是保持长连接常驻。

## 请描述以下 request 和 response headers：
### Diff. between Expires, Date, and If-Modified-...

1. **Expires** - HTTP响应头，是一个服务器上的日期，表示浏览器可以在这个日期之前都使用本地缓存
2. **Date、Age** - 没有很明白，参考[csdn博客](http://blog.csdn.net/xifeijian/article/details/46460631)
4. **If-Modified** - 缓存协商使用的请求头，如果在它表示的日期之后服务器上的资源发生改变，返回200响应，反之返回304响应头；类似的还有`If-Unmodified`、`If-None-match`、`If-match`

### Do Not Track

请求头，意思是拒绝个人信息被收集，是表示拒绝被精准广告追踪的一种方式。

* 0 - 同意被追踪
* 1 - 拒绝被追踪

### Cache-Control、ETag

详情参见**[浏览器缓存博客](https://hellogithub2014.github.io/browser-cache-summary/)**

### Transfer-Encoding

规定了传输报文主体时采用的编码方式。HTTP1.1中的传输编码方式仅对分块传输编码有效。

**Content-Encoding**通常用于对实体内容进行压缩编码，目的是优化传输，例如用 gzip 压缩文本文件

### X-Frame-Options

响应头，用于控制网站内容在其他web网站的frame标签内的显示问题。其主要目的是为了防止点击劫持攻击。可能有两个值：

* DENY - 拒绝（MDN上的很多资源都设置成了这个）
* SAMEORIGIN - 仅同域下的页面匹配时许可

### X-XSS-Protecttion

响应头，针对XSS攻击的一种对策，用于控制浏览器XSS防护机制的开关。可能的值：

* 0 - 将XSS过滤设置成无效状态
* 1 - 将XSS过滤设置成有效状态

## 什么是 HTTP method？请罗列出你所知道的所有 HTTP method，并给出解释。

一般来说会问HTTP的GET和POST区别。

## 请解释 HTTP status 301 与 302 的区别？

**301 - 永久重定向**

表示请求的资源已被分配了新的URL，以后应该使用资源现在所指的URL，即HTTP响应头中的`Location`字段值。

如果在指定资源URL时忘记了添加结尾的`/`时，就会产生301状态码：

```
https://hellogithub2014.github.io/how-do-network-connect
```

![]({{site.url}}/assets/img/network-performance-interview-questions/response-301.png)

**302 - 临时重定向**

同样表示请求的资源已被分配了新的URL，**希望本次**能使用新的URL访问。

**区别**

302表示资源不是被永久移动，只是临时性的，已移动的资源对应的URL将来还有可能发生改变。

