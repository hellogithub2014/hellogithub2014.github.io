---
title: '从浏览器输入url按回车后发生了什么'
summary_img: /images/nevada.jpg # Add image post (optional)
date: 2017-09-24 10:08:00

tag: [NetWork]
---

之前看到有个很火的面试题，大概是说从浏览器输入 url 按回车到页面显示内容期间发生了什么，恰好这段时间在读《网络是怎样连接的》，就边看书边试着回答这个问题。

## 一、生成 HTTP 请求消息

1. 解析 url，用来确定访问的目标. 需要进行 DNS 解析。
2. 生成 HTTP 请求报文，例如

```
GET /js/lib/jquery-1.10.2_d88366fd.js HTTP/1.1
Host: ss0.bdstatic.com
Connection: keep-alive
Pragma: no-cache
Cache-Control: no-cache
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6)
    AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36
Accept: */*
Referer: https://www.baidu.com/
Accept-Encoding: gzip, deflate, br
Accept-Language: zh-CN,zh;q=0.8,en;q=0.6
```

web 服务器的响应报文格式如下

```
HTTP/1.1 200 OK
Server: bfe/1.0.8.13-sslpool-patch
Date: Mon, 18 Sep 2017 15:22:05 GMT
Content-Type: application/x-javascript
Transfer-Encoding: chunked
Connection: keep-alive
ETag: W/"593645fd-19baa"
Last-Modified: Tue, 06 Jun 2017 06:04:45 GMT
Expires: Wed, 20 Sep 2017 20:18:25 GMT
Age: 2401420
Cache-Control: max-age=2592000
Accept-Ranges: bytes
Vary: Accept-Encoding
Content-Encoding: gzip
Ohc-Response-Time: 1 0 0 0 0 0
```

## 二、DNS 查询 IP 地址

### 如果不用 ip 而是直接用域名会怎么样？

ip 地址的长度为 32 比特，也就是 4 字节，而域名最短也要十几字节。如果换成域名，会增加路由器的负担，传输数据也会话费更长时间。

### Socket 库

浏览器会调用操作系统的`Socket`库中的域名解析器向 DNS 服务器发送请求，服务器返回的响应消息中会包含 ip 地址，解析器取出地址，并写入浏览器指定的内存地址中。向 DNS 服务器发送消息时，也是需要知道 DNS 服务器的 ip 地址，只不过这个地址是作为`TCP/IP`的一个设置项目在操作系统中事先设置好的。我们在连接上网络时，会由路由器分配给 ip 地址和 dns 服务器地址。

### 域名的层次结构

DNS 服务器中的所有信息都是按照域名以分层级的结构来保存的。在域名中，越靠右的位置表示其层级越高，相当于一个层级的部分称为域。这种具有层级结构的域名信息会注册到 DNS 服务器中，而每个域都是作为一个整体来处理的

### DNS 查找

#### 前提知识

- DNS 服务器也会有层级。首先会将负责管理下级域名的 DNS 服务器的 IP 地址注册到它的上级 DNS 服务器中，然后上级 DNS 服务器的 IP 地址再注册到更上一级的 DNS 服务器中，以此类推。这样我们就能通过上级 DNS 服务器查询出下级 DNS 服务器的 IP 地址，也就可以向下级 DNS 服务器发送查询消息了。

- 互联网中的`com`、`cn`这些顶级域名其实并不是最顶层的，上面还有一级**根域**，在`www.baidu.com.`后面实际上还有一个句点，只不过一般不写出来，这个句点就是根域。

- 根域的 DNS 服务器信息会保存在互联网所有的 DNS 服务器中，这样任何 DNS 服务器都可以找到并访问根域 DNS 服务器了。

#### 查找过程

1. 以`www.lab.glasscom.com`为例。 客户端会先访问最近的一台 DNS 服务器，也就是客户端的 TCP/IP 设置中填写的 DNS 服务器地址，如果找到了就直接返回，否则就会进行下面的步骤。
2. 从最近的这台 DNS 服务器中找到保存的根域 DNS 服务器地址，然后向其发送查询；根域查不到会往其下属管理的`com`域查询，一直往下，直到找到为止。
3. 以上的过程可以利用书中的两张图示意
   ![找到目标DNS服务器](/images/how-network-works/find-target-dns-server.png)
   ![DNS服务器之间的操作](/images/how-network-works/operation-between-dns-servers.png)

#### DNS 缓存

DNS 服务器有一个缓存功能，可以记住之前查询过的域名；如果要查询的域名和相关信息已经在缓存中，那么就可以直接返回响应。并且当要查询的域名不存在时，“不存在”这一结果也会被缓存；缓存会有一个有效期。

## 三、委托协议栈发送消息

1. TCP 按照网络包的长度对数据进行拆分，在每个包前面加上 TCP 头部并转交给 IP. TCP 头部内容如下：
   ![TCP头部](/images/how-network-works/tcp-headers.png)

2. IP 在 TCP 包前加上 IP 头部，然后利用 ARP 协议查询 MAC 地址并加上 MAC 头部，然后将包转交给网卡驱动。 IP 头部和 MAC 头部如下：
   ![IP头部](/images/how-network-works/ip-headers.png)
   ![MAC头部](/images/how-network-works/mac-headers.png)

3. 网卡将数据转成电信号并通过双绞线发送出去

## 四、数据通过集线器、交换机、路由器等网络设备到达服务器端的网络

### 交换机、路由器区别

#### 交换机

1. 基于以太网设计的
2. 交换机的设计是将网络包原样转发到目的地，它会根据接收方的 MAC 地址查询内部的 MAC 地址表，然后决定这个包应该转发到哪个端口
3. 另外**交换机端口的 MAC 模块不具有 MAC 地址**，因为交换机不核对接收方的 MAC 地址，所以不需要它

#### 路由器

1. 基于 IP 协议设计的
2. **路由器的各个端口都具有 MAC 地址和 IP 地址**。每个端口会以实际的发送方或接收方的身份来收发网络包。
3. 路由器在转发时，会基于内部维护的路由表来查询应该转发给谁，路由表是根据 ip 地址来查询的。
4. 一旦转发的包长度超过了输出端口能传输的最大长度，就会进行分片，缩短每个包的长度。

## 五、服务器端网络对包的操作

### 服务器端的局域网中有防火墙，对进入的包进行检查，判断是否允许通过

防火墙的基本思路是只允许发往特定服务器中的特定应用程序的包通过，然后屏蔽其他的包。

包过滤的方式是利用网络包中的`接收方IP地址`、`发送方IP地址`、`发送方端口号`、`接收方端口号`、`TCP控制位`，可以判断出通信的起点和终点、应用程序种类以及访问的方向。

利用 TCP 控制位： TCP 在执行连接操作时需要收发 3 个包，第一个包中的 SYN=1、ACK=0。 如果我们想要限制从 web 服务器往互联网的通信，那么通过判断 TCP 头部是否为 SYN=1、ACK=0，以及发送方 IP 是否为 web 服务器的地址，就可以知道是否是服务器往外部的连接操作了。 如果是 web 服务器响应互联网的请求，那么 SYN 和 ACK 不会同时满足要求，所以不会被过滤掉。

### 如果服务器端设置了负载均衡服务器

负载均衡服务器的目的是将请求平均分配给多台 web 服务器来平衡负载。

使用负载均衡，首先要用负载均衡服务器的 ip 地址代替 web 服务器的实际地址注册到 DNS 服务器上。于是客户端就会认为负载均衡服务器是真正的 web 服务器，并向其发送请求，然后由负载均衡器来判断将请求转发给哪台 web 服务器。

![MAC头部](/images/how-network-works/load-balance-server.png)

### web 服务器前面如果有缓存服务器，会拦截通过防火墙的包。如果用户请求的页面已经缓存在服务器上，则代替服务器向用户返回页面数据。

#### 如何设置缓存服务器

缓存服务器需要代替 Web 服务器被注册到 DNS 服务器中，然后客户端会向缓存服务器发送 HTTP 请求消息。缓存服务器需要判断应该将请求消息转发给哪台 Web 服务器，比较有代表性的是根据请求消息的 URI 中的目录名来进行判断，**其实也就是相当于反向代理**。

### 如果请求没有被缓存，缓存服务器会将请求转发给 web 服务器

![MAC头部](/images/how-network-works/cache-server.png)

## 六、服务器内部对网络包处理

1. web 服务器收到包后，网卡和网卡驱动会接收这个包,将其转为数字信息，校验 MAC 地址是否发给自己的，一切无误后转交给协议栈
2. 协议栈依次检查 IP 头部和 TCP 头部，如果没有问题则取出 HTTP 消息的数据块并进行组装
3. HTTP 消息被恢复成原始形态，然后通过 socket 库转交给 web 服务器
4. web 服务器分析 HTTP 消息的内容，并根据请求内容将交给对应的服务器端程序，程序内部路由到对应的代码，将处理的数据返回给客户端。

## 七、浏览器渲染页面过程

WebKit 渲染的过程,图片来源[webkit 渲染](http://mp.weixin.qq.com/s/7eY3XIhLXeCMqBYIQh6WwA)：
![WebKit渲染的过程](http://mmbiz.qpic.cn/mmbiz_jpg/zPh0erYjkib2bsVdjOuFlloia1GkjzgwkcwZNU3ncVFK6UTzJvoDJdZdyQqmfo3kPaJWHG5Phy8g28l5rtwKR9Eg/640?wx_fmt=jpeg&tp=webp&wxfrom=5&wx_lazy=1)

具体解析过程请参考[这篇文章](http://mp.weixin.qq.com/s/I9IgzC_NvKLP2-TmuDTSKQ)

1. Create/Update DOM And request css/image/js：浏览器请求到 HTML 代码后，在生成 DOM 的最开始阶段（应该是 Bytes → characters 后），并行发起 css、图片、js 的请求，无论他们是否在 HEAD 里。
   注意：发起 js 文件的下载 request 并不需要 DOM 处理到那个 script 节点，比如：简单的正则匹配就能做到这一点，虽然实际上并不一定是通过正则：）。这是很多人在理解渲染机制的时候存在的误区。
2. Create/Update Render CSSOM：CSS 文件下载完成，开始构建 CSSOM
3. Create/Update Render Tree：所有 CSS 文件下载完成，CSSOM 构建结束后，和 DOM 一起生成 Render Tree。
4. Layout：有了 Render Tree，浏览器已经能知道网页中有哪些节点、各个节点的 CSS 定义以及他们的从属关系。下一步操作称之为 Layout，顾名思义就是计算出每个节点在屏幕中的位置。
5. Painting：Layout 后，浏览器已经知道了哪些节点要显示（which nodes are visible）、每个节点的 CSS 属性是什么（their computed styles）、每个节点在屏幕中的位置是哪里（geometry）。就进入了最后一步：Painting，按照算出来的规则，通过显卡，把内容画到屏幕上。

### 图片资源的加载与渲染时机

在上面的过程中，并没有明确图片在什么时候加载和渲染。 [这篇文章](http://mp.weixin.qq.com/s/1neKv_knMnnzb1hyRx789Q)
详细的描述了具体细节。大致来说，关于图片的时机点有：

- 解析 HTML**遇到`<img>`标签加载图片** —> 构建 DOM 树
- 加载样式 —> 解析样式 **遇到背景图片链接不加载** —> 构建样式规则树
- 加载 javascript —> 执行 javascript 代码
- 把 DOM 树和样式规则树匹配构建渲染树 **加载渲染树上的背景图片**
- 计算元素位置进行布局
- 绘制 **开始渲染图片**

还有几种特殊情况，具体请阅读上面的文章。

## 八、三次握手、4 次挥手

TCP 连接、断开的流程如下：
![MAC头部](/images/how-network-works/tcp-connection-close.png)

### 断开连接操作的注意点：

**断开连接时为什么需要两边都发送 FIN 信号，亦关闭连接是四次挥手呢？**

参考[一篇博客](http://www.cnblogs.com/Jessy/p/3535612.html)的说法:

> 由于 TCP 连接是全双工的，因此每个方向都必须单独进行关闭。这原则是当一方完成它的数据发送任务后就能发送一个 FIN 来终止这个方向的连接。收到一个 FIN 只意味着这一方向上没有数据流动，一个 TCP 连接在收到一个 FIN 后仍能发送数据。首先进行关闭的一方将执行主动关闭，而另一方执行被动关闭。

> 关闭行为是在发起方数据发送完毕之后，给对方发出一个 FIN（finish）数据段。直到接收到对方发送的 FIN，且对方收到了接收确认 ACK 之后，双方的数据通信完全结束，过程中每次接收都需要返回确认数据段 ACK。

**为什需要三次握手？**

参考[微信文章](http://mp.weixin.qq.com/s/7eY3XIhLXeCMqBYIQh6WwA):

> 《计算机网络》第四版中讲“三次握手”的目的是“为了防止已失效的连接请求报文段突然又传送到了服务端，因而产生错误”

> 书中的例子是这样的，“已失效的连接请求报文段”的产生在这样一种情况下：client 发出的第一个连接请求报文段并没有丢失，而是在某个网络结点长时间的滞留了，以致延误到连接释放以后的某个时间才到达 server。本来这是一个早已失效的报文段。但 server 收到此失效的连接请求报文段后，就误认为是 client 再次发出的一个新的连接请求。于是就向 client 发出确认报文段，同意建立连接

> 假设不采用“三次握手”，那么只要 server 发出确认，新的连接就建立了。由于现在 client 并没有发出建立连接的请求，因此不会理睬 server 的确认，也不会向 server 发送数据。但 server 却以为新的运输连接已经建立，并一直等待 client 发来数据。这样，server 的很多资源就白白浪费掉了。采用“三次握手”的办法可以防止上述现象发生。例如刚才那种情况，client 不会向 server 的确认发出确认。server 由于收不到确认，就知道 client 并没有要求建立连接。”。主要目的防止 server 端一直等待，浪费资源。

## 最后

还有两篇收藏的文章讲的更详细，这里就不搬运了。请参考

[从输入 URL 到页面加载完成的过程中都发生了什么事情？（上）](http://mp.weixin.qq.com/s/KHkFc7A5AZ4K7LAnMMpxqQ)

[从输入 URL 到页面加载完成的过程中都发生了什么事情？（下）](http://mp.weixin.qq.com/s/wbzeB8SFW3xAnt74ElpU9A)
