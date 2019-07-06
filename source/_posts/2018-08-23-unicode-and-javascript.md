---
title: 'Unicode与Javascript'
summary_img: /images/new-zealand.jpg # Add image post (optional)
date: 2018-08-23 22:20:00

tag: [unicode, javascript]
---

# ES5 中的字符操作

es5 中提供了一些跟字符相关的操作，在某些需要精细化处理字符串的场所可能有帮助。

## 字符转义

可以使用`\u`来转义各种十六进制数为相应字符：

```js
'\u0041'; // A
'\u0061'; // a
'\u4E25'; // 严
'\u2603'; // ☃
```

## fromCharCode、charCodeAt、charAt、length

1.  `String.fromCharcode` - 可以基于『代码点』创建字符串，暂时可以把『代码点』理解为就是一串十六进制数

    ```js
    String.fromCharCode(0x0041); // A
    String.fromCharCode(0x4e25); // 严
    ```

2.  `String.prototype.charAt(position)` 获取字符串在特定位置的字符

    ```js
    'ABCDE'.charAt(2); // C
    '万几皮'.charAt(2); // 皮
    ```

3.  `String.prototype.charCodeAt(position)`，与`charAt`类似，只不过是获取在特定位置的那个字符的『代码点』。同时可以很容易看出来这个方法是`fromCharCode`的反向操作。

    ```js
    'ABCDE'.charCodeAt(2).toString(16); // 0x0043
    '万几皮'.charCodeAt(2).toString(16); // 0x76AE

    // 验证反向操作
    String.fromCharCode('万几皮'.charCodeAt(2)); // "皮"
    ```

4.  `length`属性很熟悉了，就是计算长度呗

    ```js
    'ABCDE'.length; // 5
    '万几皮'.length; // 3
    ```

# 遇到 Unicode 字符时遇到的问题

到目前为准都没什么问题，配合`String.prototype`上的各种工具方法，可以处理各种各样常见字符串操作。不过随着`emoji`表情的盛行，慢慢就会发现已有的工具出现各种各样的问题。

## fromCharCode、charCodeAt 的反向操作

先看看上面的反向操作还能不能工作：

```js
String.fromCharCode('💩'.charCodeAt(0)); // "�"
```

结果是乱码？？？

那么再看看`length`：

```js
'💩'.length; // 2
```

因吹丝停，看来遇到了一些奇怪的问题，如果继续尝试，可以发现一些其他的『BUG』：

## 翻转字符串

翻转字符串可能是一个比较常见的字符串操作，通常可能有一个如下的工具函数：

```js
function reverse(str) {
  return str
    .split('')
    .reverse()
    .join('');
}

reverse('abc'); // 'cba'
reverse('万几皮'); // "皮几万"
```

如果用来操作表情呢？

```js
reverse('💩');
('��');
```

感觉好像表情被拆散成了 2 个奇怪的字符。

在正则匹配时，也有奇怪的事情发生

## 正则匹配

### 范围匹配

正则表达式中经常会用到范围匹配：

```js
/[a-c]/.test('a') // true
/[我-皮]/.test('皮') // true
```

但是这种方法在遇到表情时可能会出问题：

```js
/[💩-💫]/;
// Uncaught SyntaxError: Invalid regular expression: /[💩-💫]/: Range out of order in character class
```

囧，竟然直接就报错了。。

### 数量匹配

正则中可以用一些量词来匹配某个选项多次,如`*`,`+`, `?`, `{n}`, `{n,}`, `{n,m}`，这些在处理『常见普通』字符时没问题：

```js
/a{2}/.test('aa') //true
/皮{2}/.test('皮皮') //true
```

不出意料，遇到表情也会出问题：

```js
/💩{2}/.test('💩💩'); // false
```

种种奇怪的现象都表明，js 在处理 emoji 时有问题，而这种现象在普通英文字母和汉字上不会存在，而脑海里跟 emoji 最相关的就是 Unicode 了，看来有必要了解下 Unicode。那 Unicode 到底是个啥？

# Unicode 简介

Unicode 是一个字符集（注意不是编码方式，时不时听到有人说 Unicode 编码，实际上是不正确的说法），它把目前世界上所有字符包含在内了。每个符号都与一个称为代码点（`Code Point`）的十六进制数对应，代码点通常有一个`U+`前缀，例如：

```js
U+0041 =>  A
U+0061 =>   a
U+2603 =>   ☃
```

[codepoints](https://codepoints.net/)上可以浏览各种各样的 Unicode 字符，我们 💩 先生的代码点是`U+1F4A9`~~~

Code Point 的取值范围是`U+0000`~`U+10FFFF`，大约有 110 万个。 为了好组织，所有`Code Point`被分为了 17 个`Plane`，每个`Plane`中大约包含 65K 个`Code Point`。 见[维基百科](https://en.wikipedia.org/wiki/Unicode)

![](https://hellogithub2014.github.io/images/Unicode/Unicode-Panel.png)

其中第一个`Plane`（U+0000~ U+FFFF）被称为`BMP`（`Basic Multilingual Plane`）,包含了几乎所有的常用字符。

剩下的其他`Plane`（U+10000~ U+10FFFF）被称为`supplementary planes（SMP）`或者  `astral planes`，对应的字符通常称为`SMP字符`。

另： 汉字的 Unicode 码点范围[可以参照这里](http://www.qqxiuzi.cn/zh/hanzi-unicode-bianma.php)

关于 Unicode 先介绍这么多，我们关心的是，这个跟上面遇到的那些 BUG 有什么关系呢？这就要从 js 内部对字符的表示说起了。

# js 内部的字符表示

上面说到 Unicode 只是字符集，在计算机内部不会直接存储字符集中的字符，而是会通过某种编码把它转换为一个个字节。对于大部分常见的字符，都是用 2 个字节表示的；而对于 emoji 表情，可能有人已经猜到了，是用 4 个字节表示的。

更具体的来说： 对于`SMP字符`，JavaScript 实际上把它拆成了上下两半（`H`、`L`）分别来表示，`H` 和 `L`都是 2 个字节的。

H、L 的计算公式：

```js
H = Math.floor((C - 0x10000) / 0x400) + 0xd800;
L = ((C - 0x10000) % 0x400) + 0xdc00;
```

因为 `SMP字符` 的范围是`U+010000 → U+10FFFF`，故

`H`的范围就是 `0xD800`~`0xDBFF`， 一共 2^10 个字符
`L`的范围就是 `0xDC00` ~ `0xDFFF`，一共 2^10 个字符

貌似很巧合的是：因为`SMP字符`的范围是`U+10000`~`U+10FFFF`,一共 2^20 个字符，所以 H 和 L 结合起来，正巧能表示全部的`SMP字符`。而 BMP 中`U+D800`到`U+DFFF`是一个空段，里面不对应任何字符。

例如对于"💩"(0x1F4A9)，通过上面公式计算可以得到`H = 0xD83D`、`L = 0xDCA9`，也就是说 js 内部会使用`0xD83D`和`0xDCA9`一共 4 个字节来表示它。

同时，对于 BMP 区间的代码点，js 中会直接将码点转为十六进制形式的 2 字节：

```js
U+4E25  => 0x4E25
```

我们上面碰到的所有`SMP字符`BUG 都是因为 H、L 导致，理解了这个也就知道该如何解决了。 不过在想办法解决它之前，我们来正面回答一下，**js 内部是使用什么编码方式处理字符的？**

## js 中的字符编码

好吧，这块的知识是从[阮老师的这篇博客](http://www.ruanyifeng.com/blog/2014/12/unicode.html)了解到的，我直接说结论吧。

js 使用的其实是`UCS-2`编码，由于这种编码被整合进了`UTF-16`编码，也可以认为 js 使用的是`UTF-16`编码处理字符。不过在细节上这两种编码还是有一些区别的：

**UTF-16 编码对于基本平面的字符占用 2 个字节，对于辅助平面的字符占用 4 个字节；** 也就是说：对于"💩"，`UTF-16`会认为它是一个字符，占用 4 个字节。

**而 UCS-2 认为所有字符都是 2 个字节**，而对于辅助平面的字符例如 💩，就比较尴尬了，UCS-2 认为它是 2 个字符（H 和 L），每个字符占 2 个字节。

### UTF-16 编码

再稍微说一下`UTF-16`编码，知道了 H、L，理解`UTF-16`就很容易了。上面提到它是一种变长的编码，结果可能是 2 个字节，也可能是 4 个字节。

具体来说：

1. 如果是 BMP 字符，那么其代码点就是编码结果，如`U+4E25 => 0x4E25`
2. 如果是 SMP 字符，那么计算 H、L，H 和 L 拼凑起来的 4 个字节，就是最终结果，如`0x1F4A9`的结果就是`0xD83DDCA9`

# es5 中处理`SMP字符`

1.  **length**：💩 的`length`为 2 应该可以理解了，实际上它是 H、L 两个字符，可以看出`length`的结果并不是肉眼所看到的字符个数。
2.  **`charCodeAt`**： 如果猜测的没错，对于 💩，可以分别得出`charCodeAt(0)`和`charCodeAt(1)`，它们的结果正好就是 H 和 L：

    ```js
    '💩'.charCodeAt(0).toString(16); // 0xD83D
    '💩'.charCodeAt(1).toString(16); // 0xDCA9
    ```

3.  **`fromCharcode`** - 只能处理位于 BMP 区间(`U+0000`~`U+FFFF`)的`BMP`字符,会直接截断`SMP字符`的高位字节:

    ```js
    String.fromCharCode(0x0041); // A
    String.fromCharCode(0x1f4a9); // ''  U+F4A9, not U+1F4A9
    ```

    解决的办法是根据上面计算 `H、L` 的公式先计算出 `H、L`,然后再传入`String.fromCharCode`：

    ```js
    String.fromCharCode(0xd83d, 0xdca9); // "💩"
    ```

4.  **数量匹配`SMP字符`**: 匹配失败的原因是 `SMP字符`被打散成了 H、L

    ```js
    /💩{2}/   => /\uD83D\uDCA9{2}/  // 其实匹配的是 H+L*2
    ```

    一个可行的方案是直接采用括号包裹对应的`<H，L>`来写正则

    ```js
    /(\uD83D\uDCA9){2}/.test('💩💩'); // true
    ```

5.  **范围匹配`SMP字符`**： 报错的原因也是`H、L`：

    ```js
    /[💩-💫]/  =>   /[\uD83D\uDCA9-\uD83D\uDCAB]/
    ```

    上面的`\uDCA9-\uD83D`左边的值比右边大，导致报错。一个很挫的解决方案是提供他们的 H、L 公共范围并精简表达式：

    ```js
    /\uD83D[\uDCA9-\uDCAB]/.test('💩') // true
    /\uD83D[\uDCA9-\uDCAB]/.test('💫') // true
    ```

    这种方法的缺点也很明显，对于两个跨度很大的`SMP`字符，需要精心的分段，稍不留神就会出错：

    ```js
    /[𐄑-💫]/

    =>

    /\uD800[\uDD11-\uDFFF]|[\uD801-\uD83C][\uDC00-\uDFFF]|\uD83D[\uDC00-\uDCAB]/.test('💪') // true
    ```

6.  **`reverse`函数**：遇到`SMP字符`会直接把 H、L 颠倒，而每个独立的 H、L 都是『乱码』，只有二者结合在一起才有意义。如果要解决问题，需要知道在碰到 H 的时候，下一个字符会是 L，不要把二者颠倒就行。

    不过[esrever](https://github.com/mathiasbynens/esrever)提供了一个更巧妙的思路：先将 H、L 颠倒一次，然后再执行一次普通的 reverse 即可：

    ```js
    const regexSurrogatePair = /([\uD800-\uDBFF])([\uDC00-\uDFFF])/g;

    function reverse(string) {
      const tempStr = string.replace(regexSurrogatePair, '$2$1');

      return tempStr
        .split('')
        .reverse()
        .join('');
    }

    console.log(reverse('abcd')); // dcba
    console.log(reverse('💩万几皮')); // 皮几万💩​​​​​
    ```

# ES6 中如何解决 Unicode 问题

在 es5 中处理 SMP 字符需要时刻记住 H、L 的存在，既麻烦又容易出错。好在 es6 中新增了一系列特性来专门处理 SMP 字符，下面逐一说明。

## 字符转义

es5 中的`\u`字符转义不能正确处理 SMP 字符，例如 😄(`U+1F604, H=0xD83D L=0xDE04`)：

```js
'\u1F604'; // "ὠ4"   '\u1F60' + '4'
```

除非使用 H、L 的形式：

```js
'\uD83D\uDE04'; // 😄
```

es6 中提供了更好的方法，使用`{}`包裹代码点即可：

```js
'\u{1f604}'; // 😄
```

## codePointAt

`charCodeAt`只能正确获取 BMP 字符的代码点，对于 SMP 字符只能获取 H 或 L；es6 中新增的`codePointAt`,他能统一处理好 BMP 以及 SMP 字符：

```js
'😄'.codePointAt(0).toString(16); // 0x1f604
'abc'.codePointAt(0).toString(16); // 0x0061
'呵呵哒'.codePointAt(2).toString(16); // 0x54D2
```

## fromCodePoint

同样的，`fromCharcode`也只能正确处理 BMP 字符； es6 新增的`fromCodePoint`解决了这个问题：

```js
String.fromCodePoint(0x1f604); // 😄
String.fromCodePoint(0x0061); // a
String.fromCodePoint(0x54d2); // 哒
```

## 正则匹配

ES6 对正则表达式添加了**`u`**修饰符，含义为“Unicode 模式”，用来正确处理大于`U+FFFF`的 SMP 字符。

也就是说：我们可以直接用`u`修饰符加上原始的代码点或字符就能正确匹配所有的 Unicode 字符了。

### 单字符匹配

若没有`u`修饰符，即使使用 es6 中的字符转义也不能正确匹配 SMP 字符：

```js
/\u{1f604}/.test('😄'); // false
```

由于 H、L 的存在，即使`.`点号也不能匹配 SMP 字符：

```js
/foo.bar/.test('foo😄bar'); // false
```

使用`u`修饰符可以处理这个问题：

```js
/\u{1f604}/u.test('😄'); // true
/foo.bar/u.test('foo😄bar'); // true
```

### 范围匹配

上面已经提到过，在 es5 中 SMP 范围匹配会直接报错：

```js
/[💩-💫]/; // // Uncaught SyntaxError: Invalid regular expression: /[💩-💫]/: Range out of order in character class
```

`u`在这里扮演了救世主：

```js
// 💩 0x1f4a9 => H=0xD83D ,L=0xDCA9
// 💪 0x1f4aa => H=0xD83D ,L=0xDCAA
// 💫 0x1f4ab => H=0xD83D ,L=0xDCAB

/[💩-💫]/u.test('💩') // true
/[💩-💫]/u.test('💪') // true
/[💩-💫]/u.test('💫') // true
```

直接使用 H、L 的形式来写正则也不会报错了：

```js
/[\uD83D\uDCA9-\uD83D\uDCAB]/u.test('💩') // true
/[\uD83D\uDCA9-\uD83D\uDCAB]/u.test('💪') // true
/[\uD83D\uDCA9-\uD83D\uDCAB]/u.test('💫') // true
```

### 数量匹配

复习一下 es5 在数量匹配 SMP 时的问题：

```js
/😄{2}/.test('😄😄'); // false
```

继续看看`u`的作用：

```js
/😄{2}/u.test('😄😄') // true
/\u{1f604}{2}/u.test('😄😄') // true
/\uD83D\uDE04{2}/u.test('😄😄') // true ， 注意这里没有使用括号
```

## 表单校验中的 pattern

在表单校验中，`input`元素有一个规则属性是`pattern`，可以给它设置一个正则表达式，若表单项的值匹配了`pattern`，会默认添加一个`valid`的伪类，反之添加`invalid`伪类。

```html
<style>
  :invalid {
    color: red;
  }
  :valid {
    color: green;
  }
</style>
```

```html
<form action="">
  <input type="text" pattern="\d+" value="123" />
  <!-- 界面上显示绿色 -->
  <input type="text" pattern="\d+" value="abc" />
  <!-- 界面上显示红色 -->
</form>
```

幸运的是，不需要我们做什么 hack 操作，`u`修饰符已经默认附加在了 pattern 上：

```html
<form action="" class="form">
  <input type="text" pattern="😄{2}" value="😄😄" />
  <!-- green -->
  <input type="text" pattern="💩-💫" value="💫" />
  <!-- green -->
</form>
```

## 兼容性

`u`修饰符的兼容性参考[test-RegExp_y_and_u_flags](http://kangax.github.io/compat-table/es6/#test-RegExp_y_and_u_flags)

![](https://hellogithub2014.github.io/images/Unicode/u-flag-compatiable.png)

## Array.from

可能有时候需要计算字符串中的『字数』(即肉眼见到的字符数)，例如界面提示用户输入了多少字。如上所述，这个时候不能简单的使用`length`属性，因为对于一个`SMP`字符它会返回 2.

在 es5 中我们可以这么做：

```js
var regexSMP = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;

// 将每个SMP字符转换成一个BMP字符，然后直接计算最终结果的length即可。
function countSymbols(string) {
  return string.replace(regexSMP, '_').length;
}

countSymbols('😄你好阿，test©'); // 10
```

es6 中借助`Array.from`或者扩散运算符`...`可以更简便，他会帮助我们处理好 Unicode 字符：

```js
function countSymbols2(string) {
  return Array.from(string).length;
}

countSymbols2('😄你好阿，test©'); // 10

function countSymbols3(string) {
  return [...string].length;
}

countSymbols3('😄你好阿，test©'); // 10
```

同样`reverse`函数也能用`Array.from`：

```js
function reverse2(string) {
  return Array.from(string)
    .reverse()
    .join('');
}
reverse2('😄你好阿，test©'); // "©tset，阿好你😄"
```

# 参考

1.  [javascript-unicode](https://mathiasbynens.be/notes/javascript-unicode)
2.  [谈谈 Unicode 编码](http://pcedu.pconline.com.cn/empolder/gj/other/0505/616631_all.html#content_page_1)
3.  [Unicode 与 JavaScript 详解](http://www.ruanyifeng.com/blog/2014/12/unicode.html)
4.  [wiki unicode](https://en.wikipedia.org/wiki/Unicode)
5.  [The Absolute Minimum Every Software Developer Absolutely, Positively Must Know About Unicode and Character Sets](https://www.joelonsoftware.com/2003/10/08/the-absolute-minimum-every-software-developer-absolutely-positively-must-know-about-unicode-and-character-sets-no-excuses/)
6.  [Unicode-aware regular expressions in ES2015](https://mathiasbynens.be/notes/es6-unicode-regex)
7.  [es6 字符串的扩展](http://es6.ruanyifeng.com/#docs/string)
8.  [es6 正则的扩展](http://es6.ruanyifeng.com/#docs/regex)
9.  [ASCII，Unicode 和 UTF-8](http://www.ruanyifeng.com/blog/2007/10/ascii_unicode_and_utf-8.html)
