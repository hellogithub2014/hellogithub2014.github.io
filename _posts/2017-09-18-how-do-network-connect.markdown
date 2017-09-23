---
title: "从浏览器输入url按回车后发生了什么"
img: nevada.jpg # Add image post (optional)
date: 2017-09-18 22:41:00 +0800
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [NetWork]
---

前言
===
之前看到有个很火的面试题，大概是说从浏览器输入url按回车后发生了什么，恰好这段时间在读《网络是怎样连接的》，就边看书边试着回答这个问题。

## 一、生成HTTP请求消息
1. 解析url，用来确定访问的目标
2. 生成HTTP请求报文，例如

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
web服务器的响应报文格式如下
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
## 二、DNS查询IP地址
### 如果不用ip而是直接用域名会怎么样？
ip地址的长度为32比特，也就是4字节，而域名最短也要十几字节。如果换成域名，会增加路由器的负担，传输数据也会话费更长时间。
### Socket库
浏览器会调用操作系统的`Socket`库中的域名解析器向DNS服务器发送请求，服务器返回的响应消息中会包含ip地址，解析器取出地址，并写入浏览器指定的内存地址中。向DNS服务器发送消息时，也是需要知道DNS服务器的ip地址，只不过这个地址是作为`TCP/IP`的一个设置项目在操作系统中事先设置好的。

### 域名的层次结构
DNS服务器中的所有信息都是按照域名以分层级的结构来保存的。在域名中，越靠右的位置表示其层级越高，相当于一个层级的部分称为域。这种具有层级结构的域名信息会注册到DNS服务器中，而每个域都是作为一个整体来处理的

### DNS查找
#### 前提知识
* DNS服务器也会有层级。首先会将负责管理下级域名的DNS服务器的IP地址注册到它的上级DNS服务器中，然后上级DNS服务器的IP地址再注册到更上一级的DNS服务器中，以此类推。这样我们就能通过上级DNS服务器查询出下级DNS服务器的IP地址，也就可以向下级DNS服务器发送查询消息了。

* 互联网中的`com`、`cn`这些顶级域名其实并不是最顶层的，上面还有一级**根域**，在`www.baidu.com.`后面实际上还有一个句点，只不过一般不写出来，这个句点就是根域。

* 根域的DNS服务器信息会保存在互联网所有的DNS服务器中，这样任何DNS服务器都可以找到并访问根域DNS服务器了。

#### 查找过程
1. 以`www.lab.glasscom.com`为例。 客户端会先访问最近的一台DNS服务器，也就是客户端的TCP/IP设置中填写的DNS服务器地址，如果找到了就直接返回，否则就会进行下面的步骤。
2. 从最近的这台DNS服务器中找到保存的根域DNS服务器地址，然后向其发送查询；根域查不到会往其下属管理的`com`域查询，一直往下，直到找到为止。
3. 以上的过程可以利用书中的两张图示意
![找到目标DNS服务器]({{ site.url }}/assets/img/how-network-works/find-target-dns-server.png)
![DNS服务器之间的操作]({{ site.url }}/assets/img/how-network-works/operation-between-dns-servers.png)

#### DNS缓存
DNS服务器有一个缓存功能，可以记住之前查询过的域名；如果要查询的域名和相关信息已经在缓存中，那么就可以直接返回响应。并且当要查询的域名不存在时，“不存在”这一结果也会被缓存；缓存会有一个有效期。

## 三、委托协议栈发送消息
1. TCP按照网络包的长度对数据进行拆分，在每个包前面加上TCP头部并转交给IP. TCP头部内容如下：
![TCP头部]({{ site.url }}/assets/img/how-network-works/tcp-headers.png)

2. IP在TCP包前加上IP头部，然后利用ARP协议查询MAC地址并加上MAC头部，然后将包转交给网卡驱动。 IP头部和MAC头部如下：
![IP头部]({{ site.url }}/assets/img/how-network-works/ip-headers.png)
![MAC头部]({{ site.url }}/assets/img/how-network-works/mac-headers.png)

3. 网卡将数据转成电信号并通过双绞线发送出去

## 四、数据通过集线器、交换机、路由器等网络设备到达服务器端的网络
### 交换机、路由器区别
#### 交换机
1. 基于以太网设计的
2. 交换机的设计是将网络包原样转发到目的地，它会根据接收方的MAC地址查询内部的MAC地址表，然后决定这个包应该转发到哪个端口
3. 另外**交换机端口的MAC模块不具有MAC地址**，因为交换机不核对接收方的MAC地址，所以不需要它

#### 路由器
1. 基于IP协议设计的
2. **路由器的各个端口都具有MAC地址和IP地址**。每个端口会以实际的发送方或接收方的身份来收发网络包。
3. 路由器在转发时，会基于内部维护的路由表来查询应该转发给谁，路由表是根据ip地址来查询的。
4. 一旦转发的包长度超过了输出端口能传输的最大长度，就会进行分片，缩短每个包的长度。

## 五、服务器端网络对包的操作
### 服务器端的局域网中有防火墙，对进入的包进行检查，判断是否允许通过
**TODO 包过滤方式机制**

### web服务器前面如果有缓存服务器，会拦截通过防火墙的包。如果用户请求的页面已经缓存在服务器上，则代替服务器向用户返回页面数据。
**TODO 如何设置缓存服务器**

### 如果请求没有被缓存，缓存服务器会将请求转发给web服务器

## 六、服务器内部对网络包处理
1. web服务器收到包后，网卡和网卡驱动会接收这个包并转交给协议栈
2. 协议栈依次检查IP头部和TCP头部，如果没有问题则取出HTTP消息的数据块并进行组装
3. HTTP消息被恢复成原始形态，然后通过socket库转交给web服务器
4. web服务器分析HTTP消息的内容，并根据请求内容将处理的数据返回给客户端


## 七、TODO浏览器解析DOM过程

## 三次握手、4次挥手， 为什么要4次
