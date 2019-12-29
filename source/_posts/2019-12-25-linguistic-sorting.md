---
title: 多语言排序
date: 2019-12-25 18:35:30
summary_img: /images/indonesia.jpg
tags: [Unicode]
---

在国际化业务中总有很多地方需要做本地化，比如地域列表在不同国家地区的展现，在英语国家更习惯`A-Z`的排序，国内更习惯拼音排序。再精细一些的业务场景中，会遵循专业翻译人员的意见给出更本地化的排序，比如法语、意大利中会有很多带音调的字母如`Â`、`ñ`、`Ï`。

本文会尝试手动实现这样的排序标准，看看其中有哪些坑，并给出最终的方案。

# 排序标准

排序最核心的就是确定不同语言下的排序标准，这个是交给专业翻译来确定的，同时可能会结合具体业务做细节上的调整。下面给一些在我所在业务部分语种的排序标准。

英语:
`A a B b C c D d E e F f G g H h I i J j K k L l M m N n O o P p Q q R r S s T t U u V v W w X x Y y Z z`

日语：
`あ、い、う、え、お、か、き、く、け、こ、さ、し、す、せ、そ、た、ち、つ、て、と、な、に、ぬ、ね、の、は、ひ、ふ、へ、ほ、ま、み、む、め、も、や、ゆ、よ、ら、り、る、れ、ろ、わ、を、ん`

葡萄牙语：

`A a Á á B b C c D d E e É é F f G g H h I i Í í J j K k L l M m N n O o Ó ó P p Q q R r S s T t U u Ú ú V v W w X x Y y Z z`

俄语：
`А Б В Г Д Е Ё Ж З И Й К Л М Н О П Р С Т У Ф Х Ц Ч Ш Щ Ъ Ы Ь Э Ю Я`

# 排序函数

### 内置 sort

`js`内置支持`sort`方法，不过它内部的排序标准比较简单，只是将两个参数相减，如果前者比后者小就返回负数。直接将`sort`应用于英文的排序发现就产生了不一致：

```js
function sort1(arr, locale) {
  arr.sort();
  return arr;
}
```

![origin-sort.png](/images/lang-sort/origin-sort.png)

当然仅仅修复英文的排序还是比较简单的，只需针对大小写做一些特殊判断。

### 修复大小写优先级

```js
function sort2(arr) {
  arr.sort((char1, char2) => {
    // A < a
    if (char1.toLowerCase() === char2) {
      return -1;
    }
    // a > A
    if (char1.toUpperCase() === char2) {
      return 1;
    }

    // 全部用小写来比较code point
    const lower1 = char1.toLowerCase();
    const lower2 = char2.toLowerCase();

    const cp1 = lower1.codePointAt(0);
    const cp2 = lower2.codePointAt(0);
    return cp1 - cp2;
  });
  return arr;
}
```

![case-sensitive-sort](/images/lang-sort/case-sensitive-sort.png)

实际上这段排序可以满足我们业务的英语、德语、日语、韩语、马拉西亚、泰语、印度尼西亚、阿拉伯语的排序标准。

但是所有含有音调符的语言，排序全部会失败, 因为那些字母的码点比`A-Za-z`都要大：

![case-sensitive-error-pt](/images/lang-sort/case-sensitive-error-pt.png)

### 修复音调字符

音调符通常不改变原字符的意义，只是改变它的读音，类似于拼音里的`Ā Á Ǎ À`，[一些变音符的示范](https://emw3.com/unicode-accents.html)。

这些变音符很多都是由基础字符+专门的音调符组合而成的，而且组合而成的字符也是一个专门的`Unicode`字符, 他们在`js`的长度也是 1，没有办法直接拆开。

```js
"À".length; // 1
```

幸而`es6`中针对`Unicode`字符出了一系列专门的函数，其中就有一个专门用于合成、分解这种变音符的函数[`normalize`](https://es6.ruanyifeng.com/#docs/string-methods)

可以给其传入特定的字符串`NFD`表示“标准等价分解”，还有另一个差不多的`NFKD`，二者差别不大。比如`À`的分解结果如下：

```js
const normalized = "À".normalize("NFD");
normalized[0].codePointAt(0).toString(16); // 0x0041
normalized[1].codePointAt(0).toString(16); // 0x0300  这就是分解出来的音调符
```

那么利用`normalize`我们就可以处理变音符号了，修改后的`sort`方法：

```js
function sort3(arr, locale) {
  arr.sort((char1, char2) => {
    // NFD 标准等价分解: 即在标准等价的前提下，返回合成字符分解的多个简单字符。
    const r1 = /(\P{Mark})(\p{Mark}+)?/gu.exec(char1.normalize("NFD")) || [
      char1,
      char1
    ]; // exec匹配失败返回null
    const r2 = /(\P{Mark})(\p{Mark}+)?/gu.exec(char2.normalize("NFD")) || [
      char2,
      char2
    ];

    const base1 = r1[1];
    const base2 = r2[1];
    const accent1 = r1[2]; // accent可能不存在
    const accent2 = r2[2];

    // 全部用小写来比较code point
    const lowerBase1 = base1.toLowerCase();
    const lowerBase2 = base2.toLowerCase();

    // 针对 A À Á 或 a à á的情况
    if (base1 === base2) {
      return simpleAccentCompare(accent1, accent2);
    }

    // A < a、Á < á、A < á、 Á > a
    if (base1.toLowerCase() === base2) {
      if (accent1 && !accent2) {
        return 1;
      }
      return -1;
    }
    // a > A、á > Á、á > A、 a < Á、
    if (base1.toUpperCase() === base2) {
      if (!accent1 && accent2) {
        return -1;
      }
      return 1;
    }

    const cp1 = lowerBase1.codePointAt(0);
    const cp2 = lowerBase2.codePointAt(0);
    return cp1 - cp2;
  });
  return arr;
}

// 单纯比较音调符本身
function simpleAccentCompare(accent1, accent2) {
  if (!accent1 && !accent2) {
    return 0;
  }
  if (!accent1) {
    return -1;
  }
  if (!accent2) {
    return 1;
  }
  return accent1.codePointAt(0) - accent2.codePointAt(0); // 只比较二者在Unicode字符集中的位置顺序
}
```

在`sort2`方法的基础上，可以解决葡萄牙、俄国、西班牙语、菲律宾这些语种的排序。

![case-sensitive-correct-pt](/images/lang-sort/case-sensitive-correct-pt.png)

`\p{Mark}`是`es6`新增的正则表达式特性: [`Unicode属性类`](https://es6.ruanyifeng.com/#docs/regex)。

注意：`simpleAccentCompare`在比较音调符时只单纯比较了码点大小，如果业务上有要求更个性化的排序标准，可以建立一个音调符的优先级映射表。

但在法语的标准中，遇到了一些比音调符更奇怪的字符。。。

![accent-sort-error-fr](/images/lang-sort/accent-sort-error-fr.png)

经过搜索，他们是捆绑字符[`Ligature characters`](<https://en.wikipedia.org/wiki/Orthographic_ligature#Ligatures_in_Unicode_(Latin_alphabets)>).

### 修复捆绑字符

捆绑字符将两个或多个字母连在一块，看起来就像是书写时将他们连在一起了。捆绑字符的形式多种多样，而且经过测试`normalize`也无法处理这种字符。。。

不过业务中通常不会出现这么多捆绑字符，比如翻译人员给的完整排序标准中只有 `4` 个，翻译文案绝大多数情况下只会使用基本的`A-Za-z`。作为变通我们可以建立一个映射表将捆绑字符分解，与[这篇文章](https://lexsrv3.nlm.nih.gov/LexSysGroup/Projects/lvg/2014/docs/designDoc/UDF/unicode/NormOperations/splitLigatures.html)的思路是相同的。 比如

```js
var LIGATURE_MAP = {
  Æ: "AE", // U+00C6 LATIN CAPITAL LETTER AE
  æ: "ae", // U+00E6 LATIN SMALL LETTER AE
  Œ: "OE", // U+0152 LATIN CAPITAL LIGATURE OE
  œ: "oe", // U+0153 LATIN SMALL LIGATURE OE
  ƕ: "hv", // U+0195 LATIN SMALL LETTER HV
  Ƣ: "OI", // U+01A2 LATIN CAPITAL LETTER OI
  ƣ: "oi", // U+01A3 LATIN SMALL LETTER OI
  Ʀ: "YR", // U+01A6 LATIN LETTER YR
  Ȣ: "OU", // U+0222 LATIN CAPITAL LETTER OU
  ȣ: "ou", // U+0223 LATIN SMALL LETTER OU
  ȸ: "db", // U+0238 LATIN SMALL LETTER DB DIGRAPH
  ȹ: "qp", // U+0239 LATIN SMALL LETTER QP DIGRAPH
  ɶ: "OE", // U+0276 LATIN LETTER SMALL CAPITAL OE
  ʣ: "DZ", // U+02A3 LATIN SMALL LETTER DZ DIGRAPH
  ʦ: "ts", // U+02A6 LATIN SMALL LETTER TS DIGRAPH
  ʪ: "ls", // U+02AA LATIN SMALL LETTER LS DIGRAPH
  ʫ: "lz" // U+02AB LATIN SMALL LETTER LZ DIGRAPH
};
```

所以我们的`sort`可以改一改：

```js
function compareChar(char1, char2) {
  if (!char1 && !char2) {
    return 0;
  }
  if (!char1) {
    return -1;
  }
  if (!char2) {
    return 1;
  }

  // NFD 标准等价分解: 即在标准等价的前提下，返回合成字符分解的多个简单字符。
  const regexp = /([A-Za-z])([\u0300-\u036f\ufe20-\ufe2f\u20d0-\u20ff])?/gu; // \u0300-\u036f\ufe20-\ufe2f\u20d0-\u20ff 常见音调符
  const r1 = regexp.exec(char1.normalize("NFD")) || [char1, char1]; // exec匹配失败返回null
  regexp.lastIndex = 0;
  const r2 = regexp.exec(char2.normalize("NFD")) || [char2, char2];

  const base1 = r1[1];
  const base2 = r2[1];
  const accent1 = r1[2]; // accent可能不存在
  const accent2 = r2[2];

  // 如果是捆绑字符，使用分解后的形式来对比
  const splited1 = LIGATURE_MAP[char1];
  const splited2 = LIGATURE_MAP[char2];
  if (splited1 && splited2) {
    return compareStr(splited1, splited2); // splited1和splited1都是包含多个字符的字符串了，递归调用
  } else if (splited1) {
    // 基准字符一致的情况下，捆绑字符比单个字符要靠后， 如 A a À â Æ
    if (splited1[0].toLowerCase() === base2.toLowerCase()) {
      return 1;
    }
    return compareStr(splited1, char2);
  } else if (splited2) {
    // 基准字符一致的情况下，捆绑字符比单个字符要靠后， 如 A a À â Æ
    if (base1.toLowerCase() === splited2[0].toLowerCase()) {
      return -1;
    }
    return compareStr(char1, splited2);
  }

  // 全部用小写来比较code point
  const lowerBase1 = base1.toLowerCase();
  const lowerBase2 = base2.toLowerCase();

  // 针对 A À Á 或 a à á的情况
  if (base1 === base2) {
    return simpleAccentCompare(accent1, accent2);
  }

  // A < a、Á < á、A < á、 Á > a
  if (base1.toLowerCase() === base2) {
    if (accent1 && !accent2) {
      return 1;
    }
    if (accent1 && accent2) {
      return simpleAccentCompare(accent1, accent2);
    }
    return -1;
  }
  // a > A、á > Á、á > A、 a < Á、
  if (base1.toUpperCase() === base2) {
    if (!accent1 && accent2) {
      return -1;
    }
    if (accent1 && accent2) {
      return simpleAccentCompare(accent1, accent2);
    }
    return 1;
  }

  const cp1 = lowerBase1.codePointAt(0);
  const cp2 = lowerBase2.codePointAt(0);
  return cp1 - cp2;
}

function compareStr(str1 = "", str2 = "") {
  const casted1 = Array.from(str1);
  const casted2 = Array.from(str2);

  // 长度补齐
  if (casted1.length < casted2.length) {
    casted1.push(...new Array(casted2.length - casted1.length).fill(undefined));
  }

  const diff = casted1.map((val, index) => {
    const result = compareChar(val, casted2[index]);
    return result;
  });

  const first = diff.findIndex(item => item !== 0);

  // 两个数组完全一样
  if (first < 0) {
    return 0;
  }

  return diff[first];
}

function sort4(arr, locale) {
  arr.sort(compareStr);
  return arr;
}
```

这样就修复了捆绑字符的问题：

![ligature-correct-fr](/images/lang-sort/ligature-correct-fr.png)

正当以为坑都踩完了，`Unicode`告诉我`too young too simple, sometimes naive`，给我一记重拳。。。还有更大的坑等着我

![stroke-letter-error-pl](/images/lang-sort/stroke-letter-error-pl.png)

### `stroke letter`

这种字符中间带一个横杠的，也不知道该怎么称呼，就叫`stroke letter`吧,在`Unicode`中还挺多的,[给一些例子](https://unicode-search.net/unicode-namesearch.pl?term=BAR)

`stroke letter`无法用`normalize`分解，数量众多也不大好建立映射表，看起来是没有办法的。

无意中看到[`lodash.deblurr`方法](https://lodash.com/docs/4.17.15#deburr)，函数注释中说可以处理所有在 [Latin-1 Supplement](<https://en.wikipedia.org/wiki/Latin-1_Supplement_(Unicode_block)#Character_table>) and [Latin Extended-A letters](https://en.wikipedia.org/wiki/Latin_Extended-A)这里两个`script`的字符，去掉所有[`combining diacritical marks`](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks)， 其中就包含很多`stroke letter`. 它是怎么做的呢？

查看源码可以得知核心的一句是：

```js
function deburr(string) {
  string = toString(string);
  return (
    string && string.replace(reLatin, deburrLetter).replace(reComboMark, "")
  );
}
```

`string.replace(reLatin, deburrLetter)`是讲所有变音符、`stroke letter`暴力替换为`素颜`形式，比如`Ł --> L`。它在内部维护了一个很大的映射表，基于它来做暴力替换，所以它也只处理了两个`script`的字符。实在是力不从心。。。

![lodash-deblurr-mapping](/images/lang-sort/lodash-deblurr-mapping.png)

到这里要反思是不是思路不对？目前都是从字符本身着手的，所以需要处理各种各样奇怪的`Unicode`字符，边界情况非常的多。

### localeCompare

换个思路，在业务场景中更多的是**先定下来整个页面的语种，然后再基于这个语种来对文案进行排序**。也就是说如果页面是日文的，即使文案本身是韩文，也将韩文按照日文的排序标准来排序。 有没有一些能在给定语种的情况下排序的开源库或者函数呢？

在`stackoverflow`上搜索果然有相关问题,[比如这个](https://stackoverflow.com/questions/12624532/locale-based-sort-in-javascript-sort-accented-letters-and-other-variants-in-a-p)。其中提到了[`localeCompare`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare)和[`Intl.Collator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Collator)，看了下`MDN`二者其实差不多，传的参数也是一样的。以下就只讨论`localeCompare`。

函数声明是：

```js
referenceStr.localeCompare(compareString[, locales[, options]])
```

- `locales`参数表明按照什么语种来排序，可以传递数组
- `options`提供细节控制，比如
  - `sensitivity` 是否忽略大小写，是否忽略音调符等等
  - `caseFirst` 大写优先还是小写优先
  - `numeric` 数字是否参与比较

稍微棘手的是`locales`改怎么传，文档中给了一些[`参考链接`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation)以及[`language-subtag-registry`](http://www.iana.org/assignments/language-subtag-registry/language-subtag-registry)，不过这两还是不大清晰易懂，经过努力又找到另一个文档[`language code`](http://www.lingoes.net/zh/translator/langcode.htm)。

我们试试它的效果如何：

```js
function sort5(arr, locale) {
  arr.sort((str1, str2) =>
    str1.localeCompare(str2, locale, {
      caseFirst: "upper", // 大写优先
      numeric: true, // 比较数字
      ignorePunctuation: true // 忽略标点符号
    })
  );

  return arr;
}
```

令人感到惊喜的是`stroke letter`、捆绑字符、音调符都很好的处理了，只有一小部分的细节与翻译人员定的标准不一致，基本都是多个音调符的顺序不一致。可能是`locale`设置的不对，也可能是标准本身定的就不是很准确。不一致的部分可以和 PM 沟通看看是否可以接收，因为业务中很有可能是不会出现那些音调符的。

真香！

后续 TODO: 研究 V8 中的`localeCompare`源码。

# 总结

本文探索了手写一个多语言排序函数具体会遇到哪些坑，并在最后使用`localeCompare`满足了业务需求。本文所有涉及代码和排序在[这里](https://github.com/hellogithub2014/hellogithub2014.github.io/tree/save/source/_assets/lang-sort/lang-sort.html)，右键查看源码即可。
