---
title: 混合多语种的字符长度计算
date: 2019-06-20 21:22:52
summary_img: /images/canyon.jpg
tags: [js, unicode]
---

业务中通常有很多界面的输入框需要限定长度，如果输入的全部是英文字符那么计算长度非常简单，直接利用`String.prototype.length`就行。可是现实很骨感，经常还允许输入中文，甚至在国际化业务中涉及到的语种更多，比如日语韩语西班牙语等。同时`PM`还会要求不同语言字符的长度不同，例如一个汉字/韩文长度是 2、一个英文/日文字符长度是 1、全角字符长度是 2、半角字符是 1。这就要求我们能够判断一个字符是否属于特定的自然语言，或者更理想一点直接能够检测字符所属的自然语言。

# 技术调研

1. [jschardet](https://www.npmjs.com/package/jschardet) 给定一串二进制，判断是由何种编码转换而来的,如`UTF-8`、`BIG5`等等。[背后原理](https://www-archive.mozilla.org/projects/intl/UniversalCharsetDetection.html)。

```js
var jschardet = require('jschardet');

// "àíàçã" in UTF-8
jschardet.detect('\xc3\xa0\xc3\xad\xc3\xa0\xc3\xa7\xc3\xa3');
// { encoding: "UTF-8", confidence: 0.9690625 }

// "次常用國字標準字體表" in Big5
jschardet.detect('\xa6\xb8\xb1\x60\xa5\xce\xb0\xea\xa6\x72\xbc\xd0\xb7\xc7\xa6\x72\xc5\xe9\xaa\xed');
// { encoding: "Big5", confidence: 0.99 }
```

但是编码与自然语言之间并不存在一一对应的关系，这个库不符合我们的需求。

2. [langdetect](https://www.npmjs.com/package/langdetect) 检测一段字符串可能的自然语言，返回的每条结果带有概率：

```js
var langdetect = require('langdetect');

console.log(langdetect.detect("Questo a che ora comincia? I don't know"));

/**
 * [ { lang: 'it', prob: 0.5714266536058858 }, { lang: 'en', prob: 0.42857225563212514 } ]
 */
```

原理：内部有一个非常大的概率映射，存储常见的字符、单词在各种语言中出现的频率，迭代每个字符来不断更新每种语言的概率判断，最后返回概率最大的那些语言。

缺点：比较依赖内部的概率映射，通常检测单个字符结果不大准：

```js
langdetect.detect('P'); // [{lang: "en", prob: 0.9999933792301934}]
```

另外多语言混排时计算的概率也不大准,因为每个字符都会参与最后的概率排序：

```js
langdetect.detect('我是谁 who am i'); // [{lang: "en", prob: 0.9999983325842828}]
```

性能问题：在内部它会首先针对每个字符，遍历所有`Unicode Block`(大约 270+个)来进行一些过滤操作，对于稍微长一些的字符串就比较耗费性能。

3. [node-cld](https://www.npmjs.com/package/cld) 基于`google`的`cld2`(`Compact Language Detector`)库实现的自然语言检测库。 在谷歌翻译中有用到（添加配图），安装比较困难，单个字符无法提示。 头条的评论系统利用了`cld2`。 TODO: 尝试安装并测试

TODO: 增加一些第三方库的调研

# `Unicode Block`

[go 语言内置包](https://golang.org/pkg/unicode/)

[Unicode 12.1 Character Code Charts](https://unicode.org/charts/)

1. 手动拷贝
2. 利用第三方库生成： [`node-unicode-data`](https://github.com/mathiasbynens/node-unicode-data)

## 如何找到自然语言所属的`Block`？

没有找到特别好的方法，只能用笨方法：先按区域缩小范围，再逐个搜索此`Block`对应的语言是否在目标地区通用。

# 全角、半角

1. [wiki](https://zh.wikipedia.org/wiki/%E5%85%A8%E5%BD%A2%E5%92%8C%E5%8D%8A%E5%BD%A2)
2. [Unicode Block](https://unicode.org/charts/PDF/UFF00.pdf)

# 组合字符串

## `normalize`

## 正则替换

1. `Unicode` 属性类

2. `Babel`转义
