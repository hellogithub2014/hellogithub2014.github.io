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
  - 定位图形： 也叫`Timing Patterns`，是两根黑白相间的长条，每一根的头尾都是黑色。主要用来协助机器扫描的
  - 校正图形： 是比较小的回字，用于校正
    ![alignment-patterns](http://officialblog-wordpress.stor.sinaapp.com/uploads/2013/10/31.jpg)
    不同的`version`拥有不同数量的校正图形，例如
    ![alignment-patterns-count](http://officialblog-wordpress.stor.sinaapp.com/uploads/2013/10/6.png)
    举例`version 8`的`(6,24,42)`是如何画校正图形的：
    ![alignment-patterns-example](http://officialblog-wordpress.stor.sinaapp.com/uploads/2013/10/7.png)
- 编码区，实际存储有意义数据的区域，包含 3 个子部分

  - 格式信息：所有`version`的二维码都有，存放二维码的容错级别+数据掩码+二者的纠错码
  - 版本信息：表示二维码的`version`，[`version >=7`才会绘制这个区域](https://www.thonky.com/qr-code-tutorial/format-version-information)。（其实肉眼数格子也可以知道版本信息 😆 ）
  - 数据和纠错码：存储真正的数据，同时由于纠错码的存在，使得即使二维码污损了一部分也可以读取. 整个灰色区域都用来存放此部分数据。二维码支持 4 种级别的纠错：

    | Error Correction Level | Error Correction Capability |
    | ---------------------- | --------------------------- |
    | L                      | Recovers 7% of data         |
    | M                      | Recovers 15% of data        |
    | Q                      | Recovers 25% of data        |
    | H                      | Recovers 30% of data        |

    纠错级别越高，恢复能力越强，代价是能存储的有效数据越少，因为纠错码的占比会越高。

接下来主要介绍核心的数据和纠错码部分。

# 编码步骤

步骤是先对源数据进行编码，然后依据编码结果计算得到纠错码，最后再在结尾加上一些用于补齐的字节就 ok 了。

## 源数据编码

### 编码模式（模式指示符）

类似于`utf8`编码，这部分也就是给定一个字符串，然后将其编码成一串二进制数。支持的编码模式有：

1. [数字编码(`Numeric Mode`)](https://zhuanlan.zhihu.com/p/25432628): 只支持数字 0~9 的编码
2. [字符编码(`Alphanumeric Mode`)](https://zhuanlan.zhihu.com/p/25432642)：支持包含数字、**大写**的`A-Z`(不包含小写)、以及`$ % * + – . / :`和空格
   ![alphanumeric-mode](http://officialblog-wordpress.stor.sinaapp.com/uploads/2013/10/21.png)
3. [字节编码(`Byte Mode`)](https://zhuanlan.zhihu.com/p/25432647): 支持`0x00`~`0xFF`内所有的字符
4. [日文编码(`Kanji Mode`)](https://zhuanlan.zhihu.com/p/25432667)： 只能支持`0x8140`~`0x9FFC`、`0xE040`~`0xEBBF`的字符，可以[在这里找到](http://www.rikai.com/library/kanjitables/kanji_codes.sjis.shtml)
5. `ECI mode`: 主要用于特殊的字符集。并不是所有的扫描器都支持这种编码
6. `Structured Append mode`: 用于混合编码，也就是说，这个二维码中包含了多种编码格式
7. `FNC1 mode`: 这种编码方式主要是给一些特殊的工业或行业用的。比如 GS1 条形码之类的。

每种模式都由 4 位二进制的模式指示符确定：

| Mode Name         | Mode Indicator |
| ----------------- | -------------- |
| Numeric Mode      | `0001`         |
| Alphanumeric Mode | `0010`         |
| Byte Mode         | `0100`         |
| Kanji Mode        | `1000`         |
| ECI Mode          | `0111`         |

例如字符串`123`，就可以使用`Numeric Mode`；而`HELLO WORLD`需要用`Alphanumeric Mode`；`Hello world`需要使用`Byte Mode`.

### 版本、纠错级别确定

首先依据源字符串可以知道应该采用哪种编码方式，然后需要先确定纠错级别，[最后不同版本在此纠错级别+编码方式下的数据容量是不同的](https://www.thonky.com/qr-code-tutorial/character-capacities)。我们只需找到最小的能容纳所有数据的那个版本即可。

举例来说：字符串 `HELLO WORLD`包含 11 个字符，通过上面的介绍得知，它应该使用字符编码`Alphanumeric Mode`，如果设定纠错级别是`Q`,通过查表得知`1-Q`可以容纳 16 个字符，那么最低就可以使用版本 1：

![character-capacities-table](character-capacities-table.png)

如果是字符串`HELLO THERE WORLD`(17 个字符)，那么最低版本就只能选 2 了。

另外，可以推断，**二维码是存在数据容量上限的**，它应该是`40-L`的容量：

| Encoding Mode | Maximum number of characters a 40-L code can contain in that mode |
| ------------- | ----------------------------------------------------------------- |
| Numeric       | 7089 characters                                                   |
| Alphanumeric  | 4296 characters                                                   |
| Byte          | 2953 characters                                                   |
| Kanji         | 1817 characters                                                   |

也就是说，单纯存储数字的话，可以存 7089 个；只存大写字母的话，可以存大约 4k 个。

### 字符计数指示符

是一串二进制数字，表示源字符串的字符个数。字符计数指示符必须**放在模式指示符之后**。此外，字符计数指示符有特定的位长，具体取决于二维码的版本和编码模式：

| 单位 bits         | Versions 1 ~ 9 | Versions 10 ~ 26 | Versions 27 ~ 40 |
| ----------------- | -------------- | ---------------- | ---------------- |
| Numeric mode      | 10             | 12               | 14               |
| Alphanumeric mode | 9              | 11               | 13               |
| Byte mode         | 8              | 16               | 16               |
| Kanji mode        | 8              | 10               | 12               |

具体步骤是：计算原始输入文本的字符数，将其转为二进制数字。根据版本和编码模式找到对应的位长，不够位长的在前面加 0 补齐。

例如 `HELLO WORLD`, 版本号为 1，则字符计数指示符需要 9 bits.
`HELLO WORLD`的字符数为 11，转为二进制`1011`，不够 9 位，需要补上 5 个 0，最终结果是`000001011`

那么针对`HELLO WORLD`，我们目前获得的二进制串是`0010 000001011`，`0010`是模式指示符`Alphanumeric Mode`。

### 字符串编码

这一步就是利用编码模式对源字符串进行编码，我们仍以`HELLO WORLD`为例，使用[`Alphanumeric Mode`](https://zhuanlan.zhihu.com/p/25432642)。

1. 将字符以 2 为间隔分组，得到`(H,E)`、 `(L,L)`、`(O, )`、`(W,O)`、`(R,L)`、`(D)`
2. 在[字母索引表](http://officialblog-wordpress.stor.sinaapp.com/uploads/2013/10/21.png)中找到对应的`value`，得到`(17,14)`、 `(21,21)`、`(24,36)`、`(32,24)`、`(27,21)`、`(13)`
3. 对于每组数字，将第一个数字乘以 45 加上第二个数字（最大结果 2024），得到的结果再转为长度为 11 的二进制串，长度不足的前面补 0。例如`(17,14) => 17*45+14=779 => 1100001011 => 01100001011`。如果最后一组是单个字符，则用 6 位表示就行。最终得到结果：

   ```js
   01100001011 01111000110 10001011100 10110111000 10011010100 001101
   ```

追加到模式指示符和字符计数指示符之后，得到结果：

```js
0010 000001011 01100001011 01111000110 10001011100 10110111000 10011010100 001101
```

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
