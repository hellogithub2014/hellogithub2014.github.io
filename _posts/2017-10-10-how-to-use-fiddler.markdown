---
title: "Fiddler搭建指南"
img: new-york.jpg # Add image post (optional)
date: 2017-10-10 20:00:00 +0800
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [TOOL,FIDDLER]
---

# 前言
老早之前学习了使用`Fiddler`来抓包，来帮助调试我们公司的移动web app。其实当时也总结了如何搭建，不过是使用`Word`来记录然后存放在本地的。既然有了博客站点，那就索性迁移到线上来。`Fiddler`的功能很强大，我只使用了它最基本的功能，之后有机会再仔细研究一番。

# `Fiddler`介绍
>`Fiddler`是一个web调试代理。它能够记录所有客户端和服务器间的http请求，允许你监视，设置断点，甚至修改输入输出数据。	

它的功能有：

* 网络状况监视
* 调试线上js\css
* 查看一个文件及其所引用文件的请求加载速度
* 抓取线上文件(html\js\css\img\xml….)
* 始终从服务器刷新
* 解码器功能
* ie下调试localhost

# 搭建指南
## 准备
### 下载并安装`Fiddler`

[官网下载链接](https://www.telerik.com/download/fiddler)

![]({{ site.url }}/assets/img/fiddler/download-fiddler.png)

下载完傻瓜式安装就好。

## 配置

1. 安装好之后，可以看到界面如下。把鼠标放在界面右上角的“Online”上，会出现一个小弹框，最下面那串数字就是当前电脑的ip地址，一般是192开头的。

	![]({{ site.url }}/assets/img/fiddler/ip-fiddler.png)

	**提示**：上图查看ip地址的方法偶尔会不准确,更保险的做法是在windows上可以通过打开cmd命令行，输入`ipconfig`来查看。

	![]({{ site.url }}/assets/img/fiddler/ipconfig.png)

2. 打开`Fiddler->Tools->Telerik Fiddler Options`，在弹出的窗口里，进行下列配置。**全部完成后，关闭`Fiddler`并重新打开`Fiddler`**。

	![]({{ site.url }}/assets/img/fiddler/fiddler-option-1.png)
![]({{ site.url }}/assets/img/fiddler/fiddler-option-2.png)

3. 使电脑和手机连上同一个网络，例如同个wifi,比如我这里的LieBaoWifi703

4. 在手机上配置连接上的这个wifi的代理，各个手机可能方法不一定，我的华为手机是长按那个wifi的名字。
	![]({{ site.url }}/assets/img/fiddler/huawei-wifi.png)

	![]({{ site.url }}/assets/img/fiddler/liebao-wifi-set-android.png)

	在iphone上:

	![]({{ site.url }}/assets/img/fiddler/liebao-wifi-set-iphone.png)

**注意：电脑和手机共同连接的那个wifi决定了手机能访问哪些网站**，如果是内网wifi，手机就能浏览公司的内部网页；外网wifi，手机就能上百度。

## `iphone`证书安装

安卓手机到这里就配置好了~  iphone需要再多一步来安装证书。

1. 使用safari打开 http://XXXX:8888，XXXX是电脑的ip地址
2. 在打开的页面上安装证书，有时候我发现会打不开这个页面，然后等个几分钟又莫名其妙能打开了。

	![]({{ site.url }}/assets/img/fiddler/iphone-fiddler-cer-1.png)

	![]({{ site.url }}/assets/img/fiddler/iphone-fiddler-cer-2.png)

	![]({{ site.url }}/assets/img/fiddler/iphone-fiddler-cer-3.png)

## 使用`Fiddler`

到这里，不管是安卓还是iphone，全部都配置好了。终于可以使用Fiddler了~~~
打开Fiddler，然后随意用手机登录什么网站，Fiddler上显示的内容是下面这种样子：

![]({{ site.url }}/assets/img/fiddler/fiddler-common-usage.png)

可以看到左边这一排就是手机浏览器的所有网络请求了，按时间顺序从上到下依次排列；右边的面板上有各种各样的选项卡，比如TimeLine等等。

**应用的性能分析，TimeLine为例:**

![]({{ site.url }}/assets/img/fiddler/fiddler-timeline.png
)

随便单击左边的一个请求，右边的timeline上都会显示这个请求的起始和结束时间。也可以选中多个请求来综合分析，按ctrl键可以随意选择任意个，按shift可以范围选择，与windows上文件操作一样。

## 小贴士

手机浏览器也许会进行各种各样奇怪的请求，这样Fiddler左边的面板就会显得很混乱，我们真正想分析的请求会被淹没在其中。可以利用右边面板的Filter来进行过滤。比如我们只想看到所有来自`127.0.0.1`请求，那么可以设置为下面这样：

![]({{ site.url }}/assets/img/fiddler/fiddler-host-filter-example.png)




