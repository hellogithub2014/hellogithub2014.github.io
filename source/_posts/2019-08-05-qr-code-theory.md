---
title: 二维码原理
date: 2019-08-05 21:30:59
summary_img: /images/canyon.jpg
tags: [QR]
---

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
