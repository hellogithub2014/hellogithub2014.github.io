---
title: 混合多语种的字符长度计算
date: 2019-06-20 21:22:52
summary_img: /images/canyon.jpg
tags: [js, unicode]
---

业务中通常有很多界面的输入框需要限定长度，如果输入的全部是英文字符那么计算长度非常简单，直接利用`String.prototype.length`就行。可是现实很骨感，经常还允许输入中文，甚至在国际化业务中涉及到的语种更多，比如日语韩语西班牙语等。同时`PM`还会要求不同语言字符的长度不同，例如一个汉字/韩文长度是 2、一个英文/日文字符长度是 1、全角字符长度是 2、半角字符是 1。这就要求我们能够判断一个字符是否属于特定的自然语言，或者更理想一点直接能够检测字符所属的自然语言。

# 技术调研

最初的想法是寻找能够检测字符串所属语言的库，为此搜了一些相关的工具。

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

4.

# 思路

看来市面上已有的这些库都不能很好满足我们的需求，又必要重新捋一捋思路。首先为了能够处理语言混排的情况，就不能用整个字符串去判断语言，只能逐个字符来看；然后利用单个字符直接检测所属自然语言是不大现实的，存在一些困难：

1. 很多字符如`p`在多种语言中都有用到
2. 如何判断单个字符直接检测所属自然语言呢？

问题 1 这个不是很难，可以设置一个语言的检测优先级，第一个检测到的语言直接返回；问题 2 看起来是有办法的，因为只要找到自然语言的范围，然后看目标字符是否在此范围内即可。下面的篇幅重点都在问题 2 的讨论。

# `Unicode Script`

如何确定一个自然语言的字符范围，或者更精确一点：**如何确定一个自然语言在`Unicode`字符集中的范围？** 进行了一番搜索后，发现比想象中要复杂。

注：涉及到多种语言的字符，就得小心在`js`中处理`Unicode`字符的注意事项，参考[以前写的文章](https://hellogithub2014.github.io/2018/08/22/unicode/)。

1. 首先在[stackoverflow](https://stackoverflow.com/questions/6432926/how-can-i-relate-unicode-blocks-to-languages-scripts)上搜到一个相关的讨论，发现在`unicode`中并不存在自然语言与码点范围的直接映射关系
2. 一个自然语言可能对应了很多`unicode script`，如日语会用到`CJK`中文、`Hiragana`平假名、`Katakana`片假名这 3 个；并且而一个`unicode script`也可能被多种自然语言使用，如`Latin`会在英语、法语、德语、意大利语种使用。简而言之，自然语言和`unicode script`是多对多的关系

`unicode script`是什么？参考[`wiki`](<https://en.wikipedia.org/wiki/Script_(Unicode)>)的说法，它是`Unicode`中一组字母、标点符号、变音符的集合，例如`Latin`、`Greek`等等。 可以在[这里](https://unicode.org/charts/)查阅所有的`script`，点击每个`script`会展示其内部的字符：

![script_char_example.png](/images/string-length/script_char_example.png)

因为`script`是存在确定范围的，所以我们的问题又变成了**如何确定一个自然语言对应哪些`unicode script`？**

经过一番搜索，发现[List_of_languages_by_writing_system](https://en.wikipedia.org/wiki/List_of_languages_by_writing_system)这个`wiki`比较符合我们的需求，只不过它是反过来的，列出了一个`script`被哪些自然语言使用了。 我们得逐个反向查找，例如：

![list_of_languages_by_writing_system.png](/images/string-length/list_of_languages_by_writing_system.png)

[List of writing scripts by adoption](https://en.wikipedia.org/wiki/List_of_writing_systems)里有个大表格，记录了常见`script`被哪些语言使用了。

所以最终我们的思路就是：**设置一个映射，存储每种自然语言对应的`script`列表，针对字符串的每个字符，只要其位于自然语言的`script`范围内，就认为这个字符属于这个自然语言。**

当然这个思路存在一些问题：

1. 如果某个`script`被多个自然语言用到，但业务上这些认定这些自然语言的长度不一致，比如法语中的`p`长度算 2，英语中的`p`长度算 `1`. 如果真的有这种变态需求建议把`PM`锤爆并说这个需求做不了。
   ![做不了.png](https://www.jiuwa.net/tuku/20180404/kANEOyoT.jpg)
2. 语言很多，如果对语言不熟悉，那么映射可能不完整，例如遗漏一些`script`,导致一些特殊字符检测不出来

问题 2 除了更细心一些没有特别好的办法。问题 1 可以在业务上约定不同自然语言中的相同字母长度都一样。

# 具体实现

遇到的第一个问题就是：**怎么收集一个`script`对应的码点范围？** 有两个办法：

1. 在[这里](https://unicode.org/charts/)手动查阅然后放到代码里。。。 例如`go`语言的[内置包](https://golang.org/pkg/unicode/)
2. 利用第三方库生成： [`node-unicode-data`](https://github.com/mathiasbynens/node-unicode-data)可以生成各版本`Unicode`规范的`Script`集合，例如`12.1.0`版本的[检测`Han`的正则表达式](https://github.com/mathiasbynens/unicode-12.1.0/blob/master/Script/Han/regex.js)

随后的工作就容易很多了，此处给出一种简单的实现示范：

```js
// 自然语言所对应的Unicode script列表，以及PM规定的字符长度。注：此映射不是非常精确，只选取了最常见的
const LANG_SCRIPT_LENGTH = {
  chinese: {
    scripts: ['Han'],
    length: 2,
  },
  japanese: {
    scripts: ['Hiragana', 'Katakana'], // 只检测平假名、片假名， 中文字符使用Han判断
    length: 1,
  },
  english: {
    scripts: ['Latin'],
    length: 1,
  },
};

const LENGTH_MAP = {}; // 记录每个script的PM规定长度

// 初始化LENGTH_MAP
function init() {
  Object.values(LANG_SCRIPT_LENGTH).forEach(({ scripts = [], length = 1 }) => {
    scripts.forEach(script => {
      const regex = require(`unicode-12.1.0/Script/${script}/regex`);
      LENGTH_MAP[script] = { regex, length };
    });
  });
}

init();

function getCharLength(char = '') {
  const target = Object.values(LENGTH_MAP).find(({ regex }) => regex.test(char));
  return target ? target.length : 1;
}

function stringLength(str = '') {
  let length = 0;
  for (const symbol of str) {
    length += getCharLength(symbol);
  }
  return length;
}
```

利用`stringLength`即可：

```js
stringLength('abc'); // 3
stringLength('字符规则'); // 8
stringLength('テスト'); // 3
stringLength('abc字符规则テスト'); // 14
```

看起来我们的需求实现了，不过还剩下最后两个问题没有解决：

1. 全角、半角的检测，
2. 组合字符

下面依次来看。

## 全角、半角

在[这里](https://unicode.org/charts/PDF/UFF00.pdf)可以查看到全角/半角字符与标点的范围，发现一些需要注意的：

1. 部分全宽`Latin`字母和`Latin Script`的范围是重合的，如`\uFF21`是全宽的`Ａ`，也被放到`Latin Script`里了
2. 标点符合、数字是不属于任何`script`的
3. 全角字符的范围比较连续就是`\uFF00`~`\uFFEF`，但半角字符范围很零碎，被分为了多段，需要细心分拣

![full_width_half_width.png](/images/string-length/full_width_half_width.png)

所以全角、半角需要额外检测，同时需要放到任何`script`检测之前。

在示范代码中，我们将全角、半角的配置放到`LENGTH_MAP`初始化之中，这样在检测时会优先匹配它俩：

```js
const LENGTH_MAP = {
  FullWidth: {
    regex: /[\uFF00-\uFFEF]/,
    length: 2, // 全角字符长度算作2
  },
  HalfWidth: {
    regex: /[\u0020-\u007e\u00a2-\u00a9\u2190-\u2193\u2502-\u2502\u25A0-\u25A0\u25CB-\u25CB\u2985-\u2985\u3001-\u3001\u300c-\u300d\u30a1-\u30ff\u3131-\u3164]/,
    length: 1, // 半角字符长度算作1
  },
};

function init() {
  // 初始化正常的script配置
}
```

如果想使`LENGTH_MAP`的迭代顺序更稳定，可以考虑将其改为数组存储。

## 组合字符串

有些`Unicode`字符是由几个其他字符组合而来的，其中一部分子字符叫做[`Combining character`](https://en.wikipedia.org/wiki/Combining_character) ：

![Cyrillic Combining character](https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/U_niesk%C5%82adovaje_Unicode.svg/220px-U_niesk%C5%82adovaje_Unicode.svg.png)

上图中的“眉毛”就是`Combining character`。再比如泰语的`ณี`是由`ณ`(`\u0E13`)和 `ี` (`\u0E35`)两个字符组成的， `` ี`也是`Combining character`:

![cobining_mark1.png](/images/string-length/cobining_mark1.png)

那些带有虚线空心圆的`Combining character`常用来改变音调，增加或删掉它不会影响字符本身的表达意思,在网络上有一些更夸张的组合字符如 Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞ 。

组合字符在`js`中是被分开对待的，即如果一个组合字符是由 N 个子字符合成，那么在`js`中会认为它是**N 个独立的**字符，验证如下：

```js
'Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞'.length; // 75

for (char of 'ณี') console.log(char); // ณ  ี

'ณี'.codePointAt(0).toString(16); // 0x0e13
'ณี'.codePointAt(1).toString(16); // 0x0e35
```

这就造成长度计算存在误差,针对这种情况有两种解决办法。

### `normalize`

这是`ES6`新增的字符串处理方法，用于将两个子字符合成为一个字符。 [`MDN`上的解释](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize)不是那么好懂，推荐看[`阮大`的`ES6入门`](http://es6.ruanyifeng.com/#docs/string-methods#%E5%AE%9E%E4%BE%8B%E6%96%B9%E6%B3%95%EF%BC%9Anormalize)。具体用法这里不再细述，只说一下不足之处。

1. 如果想要合成的目标字符并不在`Unicode`中，那么`normalize`还是会返回原样的`N`个子字符，而不是一个字符。例如上面的`ณี`就是一个例子，它并不存在于`Unicode`字符集中，只是展示时看起来是一个字符：

```js
const nor = '\u0e13\u0e35'.normalize();
nor.codePointAt(0).toString(16); // 0x0e13
nor.codePointAt(1).toString(16); // 0x0e35  如果normalize成功了，那么此处的输出必然会不一样
```

1. 只能处理 2 个子字符的合成，对于 3 个或三个以上字符的合成无能为力。

### 正则替换

这种方法属于正面刚，先利用正则表达式去掉所有`Combining character`，再计算剩下字符的长度。由于字符串意义没有变更，只是部分子符读音发生变化，所以影响不是很大。参考了[这篇博客](https://my.oschina.net/u/3375885/blog/2998185)

```js
const regexSymbolWithCombiningMarks = /(\P{Mark})(\p{Mark}+)/gu;
// 去除str中所有的Combining character
const normalized = str.replace(regexSymbolWithCombiningMarks, ($0, symbol, combiningMarks) => symbol);
```

核心是利用了`ES2018`对于正则表达式新增的`Unicode 属性类`特性，允许正则表达式匹配符合 `Unicode` 某种属性的所有字符，同样可以参考[阮大的文章](http://es6.ruanyifeng.com/#docs/regex#Unicode-%E5%B1%9E%E6%80%A7%E7%B1%BB)。

`\p{Mark}`用于匹配所有的`Combining character`，`\P{Mark}`是反向匹配所有的非`Combining character`。

经过上面的处理，`ณี`就会被处理成`ณ`,丢掉了`ี`.

如果`ES2018`在项目中还不能使用，那么可以将正则用`Babel`先转掉，会是相当长的一串：

![babeled_combining_marks_regexp.png](/images/string-length/babeled_combining_marks_regexp.png)

这种方法也存在一个缺点，例如一个组合字符由 3 个子字符组成，但只有一个`Combining character`，那么即使处理后也会被认为是 2 个子字符。例如[印地语的`त्र`](https://codepoints.net/search?q=%E0%A4%A4%E0%A5%8D%E0%A4%B0&na=&int=&Bidi_M=&Bidi_C=&CE=&Comp_Ex=&XO_NFC=&XO_NFD=&XO_NFKC=&XO_NFKD=&Join_C=&Upper=&Lower=&OUpper=&OLower=&CI=&Cased=&CWCF=&CWCM=&CWL=&CWKCF=&CWT=&CWU=&IDS=&OIDS=&XIDS=&IDC=&OIDC=&XIDC=&Pat_Syn=&Pat_WS=&Dash=&Hyphen=&QMark=&Term=&STerm=&Dia=&Ext=&SD=&Alpha=&OAlpha=&Math=&OMath=&Hex=&AHex=&DI=&ODI=&LOE=&WSpace=&Gr_Base=&Gr_Ext=&OGr_Ext=&Gr_Link=&Ideo=&UIdeo=&IDSB=&IDST=&Radical=&Dep=&VS=&NChar=):

![hindi_example.png](/images/string-length/hindi_example.png)

这种情形暂时没有想到好的办法，有知道解决办法的欢迎和我交流 🙃

后续 TODO： 完善`LANG_SCRIPT_LENGTH`映射，包括`script`列表的收集和更多自然语言的处理。

最后的代码放在了[这里](https://github.com/hellogithub2014/hellogithub2014.github.io/tree/save/source/_assets/pre-cache/unicodeUtil.js)
