---
title: 二维码原理
date: 2019-08-05 21:30:59
summary_img: /images/canyon.jpg
tags: [QR]
---

# 前言

前阵子在项目里用到了二维码的生成，当时直接拿了第三方库来做，觉得很神奇，恰好这两天有一点时间，就学习了一波底层原理。学习的过程中参考了好几个博客，不同的博客在不同的细节上写的比较好，趁着还没忘就趁热打铁记录在博客里。

**二维码本质上是对字符串的编码规则，最终转换成二进制串**。不过在这个串里加了各种辅助信息以及纠错信息，最终绘制到页面上时就成了眼睛看到的样子。

# 基础知识

二维码一共有`40`个尺寸(也可以称为版本、`Version`)。`Version 1`是`21 x 21`的矩阵，`Version 2`是 `25 x 25`的矩阵。每增加一个`version`，长宽就增加 4，公式是：

```js
(V - 1) * 4 + 21;
```

最高版本是`40`，所以是`177 x 177`的正方形。 每个`1x1`都是一个小方块，黑色表示 1，白色表示 0。所以通过个人微信二维码的版本是多少呢？🙃

![qr-smallest-unit](https://upload-images.jianshu.io/upload_images/7154520-add155b96bb60412.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/599/format/webp)

二维码图案分为很多子部分，如下：

![qr-code-functionl-split](https://user-images.githubusercontent.com/13174560/48657450-e3db4b00-ea6b-11e8-925b-e279de3025a2.png)

- 功能区域，不包含实质性的信息，只是一些辅助作用
  - 位置探测区域：一共有 3 个，用于决定二维码的哪一边应该朝上,这样我们不管从什么方向扫码都不会混乱了。它是一个固定大小的回字
    ![position-detection](https://upload-images.jianshu.io/upload_images/7154520-38a3b2ecf9b8189a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/148/format/webp)
  - 位置探测图形分隔符：将位置探测区域围起来的固定宽度 1 的白色“围栏”
  - 定位图形： 也叫`Timing Patterns`，

# 编码步骤

## 源数据编码

主要参考： https://zhuanlan.zhihu.com/p/25432676

### 版本、纠错级别确定

### 编码方式

数字、字符、字节、日文。。 主要参考： https://zhuanlan.zhihu.com/p/25427146

### 字符串长度编码

### 字符串编码

### 结束符 0000

### 末尾补 0 直到 8 的倍数

### 根据版本+纠错级别 -> 数据区长度

### 填充 magic 补齐码到数据区长度

## 纠错码生成

主要参考：https://www.freebuf.com/geek/204516.html

## 最终的数据

数据区编码+纠错码+N 个字节的剩余位（全 0，具体个数由版本决定： https://www.thonky.com/qr-code-tutorial/structure-final-message

## 绘制二维码

### 3 个位置探测方块

### N 个校正方块

### 2 个定位条

### 格式信息

### 版本信息

### 数据区+纠错码区

### 掩码图案：为了避免大片空白或黑块造成识别困难

# 解码过程

参考https://www.freebuf.com/geek/204516.html

# 参考资料

- http://blog.sae.sina.com.cn/archives/1139
- https://bytekm.bytedance.net/kmf/articleDetail/2546
- https://www.jianshu.com/p/38c4781c1f5d
- https://www.freebuf.com/geek/204516.html
- https://zhuanlan.zhihu.com/p/25423714
- 英文 tutorial：https://www.thonky.com/qr-code-tutorial/
