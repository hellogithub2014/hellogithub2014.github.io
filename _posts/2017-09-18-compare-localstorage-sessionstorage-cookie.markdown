---
title: "比较localStorage、sessionStorage、cookie"
img: indonesia.jpg # Add image post (optional)
date: 2017-09-18 17:41:00 +0800
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [JavaScript]
---

前言
===
在学习`localStorage`、`sessionStorage`、`cookie`时，对他们的作用域和生命周期总是会有些混乱，觉得需要花些时间专门做个总结。

## 有效期
### localStorage
永久存储，除非通过代码可以删除或者清除缓存
### sessionStorage
存在于会话期间，可以跨页面刷新而存在，同时如果过浏览器支持，浏览器崩溃并重启之后依然可用。当宽口或标签页被永久关闭，那么所有`sessionStorage`中的数据都会丢失。
### cookie
1. 默认的有效期很短，只能持续在浏览器的会话期间，一旦关闭会话，数据就丢失了
2. 可以明确设置`cookie`的`max-age`属性的值（单位是秒），一旦设置有效期，浏览器就会将`cookie`存储在一个文件中，并且直到过了指定的有效期才会删除该应用。


## 作用域
### localStorage
1. 限定在文档源级别，每个域单独对应一个`storage`。同源的文档间共享同一个`storage`，非同源的文档间不能读取或覆盖对方的数据。
2. 同时也受浏览器的限制，同个文档，在不同浏览器中对应着不同的`storage`。

### sessionStorage
1. 同样是文档源级别，不同源文档之间无法共享`sessionStorage`
2. 还被限定在窗口中，如果同源的文档（即使是同一份）运行在不同的tab页中，他们每个tab页都拥有单独一个`sessionStorage`，无法共享。
3. 这里提到的基于窗口作用域的`sessionStorage`指的窗口只是**顶级窗口**。如果一个标签页中包含两个`iframe`，它们所包含的文档是同源的，那么之间是可以共享`sessionStorage`.

### cookie
1. `cookie`的作用域是通过**文档源和文档路径**来确定的。默认情况下，`cookie`和创建它的页面有关，并且对**该页面以及该页面同目录或子目录**的其他web页面可见。
2. 可以设置`cookie`的`path`属性来更改其可见性，这样来自同个域的其他页面，只要其`url`是以指定的路径前缀开始，就可以共享`cookie`。例如如果将
	```
	http://www.example.com/catalog/widgets/index.html
	```
	中的cookie的路径设置为`catalog`，那么这些`cookie`对于
	```
	http://www.example.com/catalog/order/index.html
	```
	是可见的。
	或者将`path`设为`/`，那么该`cookie`对于任何

	```html
	http://www.example.com
	```
	下面的页面都是可见的。
3. 有些大型网站想要在子域间共享`cookie`，可以通过设置子域`cookie`的`domain`来达到目的。例如如果将
	```
	catalog.example.com
	```
	下面一个`cookie`的`path`设为`/`,`domain`设为`.example.com`,那么该`cookie`就对所有
	```
	catalog.example.com
	orders.example.com
	xxx.example.com // 任何example.com的子域
	```
	均可见。
4. secure
	一个布尔值，一旦`cookie`被标识为“安全的”，那么只能当浏览器和服务器通过`HTTPS`或者其他的安全协议链接时才能传递它。
5. httpOnly
	只有在服务器端才能操作cookie，浏览器端无法修改

## storage事件
 无论什么时候存储在`localStorage`、`sessionStorage`中的数据发生改变，浏览器都会在其他对此`storage`可见的窗口对象上出发`storage`事件（类似广播）。**注意**只有当数据真正发生改变时才会出发此事件，如果设置的值和已存在的值一样，或者删除一个本来就不存在的数据项都不会触发该事项。


