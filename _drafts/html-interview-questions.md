---
title: "html面试题"
img: canyon.jpg # Add image post (optional)
# date: 2017-11-12 17:20:00 +0800
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [HTML,INTERVIEW]
---

# 题库

[Front-end-Developer-Interview-Questions](https://github.com/h5bp/Front-end-Developer-Interview-Questions)

其他人的回答集：

* [Witcher42](http://witcher42.github.io/2014/06/04/front-end-developer-interview-questions/)
* [简书](http://www.jianshu.com/p/2b427ee7eeea)
* [voidove](https://github.com/voidove/jug-jug/labels/interview)
* [laiqun](http://www.bubuko.com/infodetail-1552147.html)

# `doctype`(文档类型) 的作用是什么？

```html
<!DOCTYPE html>
```

Web网页是使用浏览器来打开、渲染、显示，如何才能让浏览器正确地显示文档呢，这就需要了解文档的类型！
 
HTML有多个不同的版本，**只有准确的在页面中指定确切的HTML版本，浏览器才能正确无误的显示HTML页面。这就是<!DOCTYPE>的用处。**
<!DOCTYPE> 不是HTML标签，它只是为浏览器提供一项声明，因此它没有闭合/结束标签！

[参考博客](https://www.cnblogs.com/idayln/p/3390783.html)

# 浏览器标准模式 (standards mode) 、几乎标准模式（almost standards mode）和怪异模式 (quirks mode) 之间的区别是什么？

参考[简书](http://www.jianshu.com/p/dcab7cde8c04)

因此，现代的浏览器一般都有两种渲染模式：标准模式和怪异模式。在**标准模式**下，浏览器按照HTML与CSS标准对文档进行解析和渲染；而在**怪异模式**下，浏览器则按照旧有的非标准的实现方式对文档进行解析和渲染。

这样的话，对于旧有的网页，浏览器启动怪异模式，就能够使得旧网页正常显示；对于新的网页，则可以启动标准模式，使得新网页能够使用HTML与CSS的标准特性。

**浏览器根据`DOCTYPE`确定该使用哪种模式**

**标准模式与怪异模式的两个常见区别**
1. **盒模型的处理差异：**标准CSS盒模型的宽度和高度等于内容区的高度和宽度，不包含内边距和边框，而IE6之前的浏览器实现的盒模型的宽高计算方式是包含内边距和边框的。因此，对于IE，怪异模式和标准模式下的盒模型宽高计算方式是不一样的；
2. **行内元素的垂直对齐：**很多早期的浏览器对齐图片至包含它们的盒子的下边框，虽然CSS的规范要求它们被对齐至盒内文本的基线。标准模式下，基于Gecko的浏览器将会对齐至基线，而在quirks模式下它们会对齐至底部。最直接的例子就是图片的显示。在标准模式下，图片并不是与父元素的下边框对齐的，如果仔细观察，你会发现图片与父元素下边框之间存在一点小空隙。那是因为标准模式下，图片是基线对齐的。而怪异模式下，则不存在这个问题。

# HTML 和 XHTML 有什么区别？

XHTML要求浏览器强制执行错误检查。

# 如果网页内容需要支持多语言，你会怎么做？

[参考1](http://blog.csdn.net/xujie_0311/article/details/42047407)
[参考2](http://blog.csdn.net/yzhz/article/details/2045295)

**需要注意的地方：**  可以参考[7 Tips and Techniques For Multi-lingual Website Accessibility](见 7 Tips and Techniques For Multi-lingual Website Accessibility)

1. 采用统一编码UTF-8方式编码
2. 语言书写习惯&导航结构 - 有些国家的语言书写习惯是从右到左
3. 文字长度，相同意思的单词在不同语言上占用的长度不同
3. 数据库驱动型网站 - 当客户可以留言并向数据库添加信息时，应当考虑如何从技术上实现对不同语言数据信息的收集和检索。

**多语言网站实现计划 ：**

1. 页面编写方式
	1. **静态**：就是为每种语言分别准备一套页面文件，要么通过文件后缀名来区分不同语言，要么通过子目录来区分不同语言。
	2. **动态**：站点内所有页面文件都是动态页面文件（PHP，ASP等）而不是静态页面文件，在需要输出语言文字的处所同一采用语言变量来表现，这些语言变量可以根据用户选择不同的语言赋予不同的值，从而能够实现在不同的语言环境下输出不同的文字。
2. 动态数据存贮
	1. 在数据库级别支撑多语言：为每种语言建立独立的数据库，不同语言的用户把持不同的数据库。
	2. 在表级别支撑多语言：为每种语言建立独立的表，不同语言的用户把持不同的表，但是它们在同一个数据库中。
	3. 在字段级别支撑多语言：在同一个表中为每种语言建立独立的字段，不同语言的用户把持不同的字段，它们在同一个表中。
3. 空间域名需要支持多浏览地址

# 使用 `data-` 属性的好处是什么？

[参考链接](http://blog.csdn.net/xujie_0311/article/details/42048237)

**为前端开发者提供自定义的属性，可以利用它在元素上存放数据。**这些属性集可以通过对象的dataset属性获取，不支持该属性的浏览器可以通过 getAttribute方法获取

```
<div data-author="david" data-time="2011-06-20" data-comment-num="10">...</div>
div.dataset.commentNum; // 10。 注意在标签上写的是烤串格式，js中的是小写驼峰格式
```

```
<div id="content" data-user-list="user_list">data-user_list自定义属性 </div>
//js
var content= document.getElementById('content');
alert(content.dataset.userList)

//jquery
$('#content').data('userList');//读
```

# 如果把 HTML5 看作做一个开放平台，那它的构建模块有哪些？

* 标签及属性 - `<article>`、`<aside>`、`<datalist>`等等
* 地理位置Geolocation
* 画布canvas
* 视频video
* 音频audio
* 拖放drag
* 应用缓存Application Cache
* Web存储 - localStorage、sessionStorage
* web workers
* 服务器发送事件 - 允许网页获得来自服务器的更新

# 请描述 `cookies`、`sessionStorage` 和 `localStorage` 的区别。

**cookies**

1. 以域名+路径作为划分，对该路径及其子路径下的所有页面均可见
2. 如果不设置有效期，默认窗口关闭就会清楚；如果设置了max-age，那么就会保存在本地硬盘上，直到过期才会删除
3. 如果设置了secure，那么只有在HTTPS中才会传递
4. httpOnly - 只有在服务器端才能操作cookie，浏览器端无法修改
5. cookies会发送到服务器端
6. cookie数据不能超过4k

**sessionStorage**

1. 以窗口和源作为划分，**不同源文档之间无法共享`sessionStorage`**
2. 窗口刷新仍会存在
3. 窗口关闭就会消失
4. 不同窗口的sessionStorage不共享
5. 这里提到的基于窗口作用域的`sessionStorage`指的窗口只是**顶级窗口**。如果一个标签页中包含两个`iframe`，它们所包含的文档是同源的，那么之间是可以共享`sessionStorage`.
6. **也有storage事件**
7. sessionStorage虽然也有存储大小的限制，但比cookie大得多，可以达到5M或更大。

**localStorage**

1. 以域名划分
2. 除非手动或通过api清除缓存，会一直存在
3. 有storage事件
4. localStorage 虽然也有存储大小的限制，但比cookie大得多，可以达到5M或更大。


# 请解释 `<script>`、`<script async>` 和 `<script defer>` 的区别。

![](https://pic4.zhimg.com/v2-b574cf32f8d968ec8546418eac91ac03_b.png)

**`<script>`** - 加载和解析时会阻塞DOM解析

**`<script async>`**

* 加载时不会阻塞DOM解析，加载完成后立即执行，此时会阻塞DOM解析；
* 多个async执行顺序不一定，因为每一个都是加载完立即执行
* **async-script 可能在 DOMContentLoaded 触发之前或之后执行，但一定在 load 触发之前执行**

**`<script defer>`**

* 加载时不会阻塞DOM解析，在DOM解析完成后才会执行；
* defer 不会改变 script 中代码的执行顺序
* **所有由 defer-script 加载的 JavaScript 代码，然后触发 DOMContentLoaded 事件**

# 为什么通常推荐将 CSS `<link>` 放置在 `<head></head>` 之间，而将 JS `<script>` 放置在 `</body>` 之前？你知道有哪些例外吗？

**`<link>`**

1. css加载和解析都是阻塞的
2. 如果将link放在页面靠后的位置，浏览器可能会先显示一部分内容，然后css解析完成后，页面样式又会改变，造成闪烁的效果，体验不好

**`<script>`**

1. js加载和解析默认也都是阻塞的，因为它可以读取和修改 DOM 属性
2. 如果将其放在靠前的位置，所有位于其后的内容都不会显示，直到js加载完成，这样会延迟首屏的展现

**[FOUC](https://web.archive.org/web/20150513055019/http://www.bluerobot.com/web/css/fouc.asp/)**

# 什么是渐进式渲染 (progressive rendering)？

[What is progressive rendering?](https://stackoverflow.com/questions/33651166/what-is-progressive-rendering)

例如：

* 图片懒加载，利用js先加载在视野内的图片，而不是所有图片
* 页面可以庞大，不过，只要你在短时间内(最好少于 1 秒)呈现给用户一些内容，他们仍然觉得载入很快。

# 你用过哪些不同的 HTML 模板语言？
jade、angular模板


# `input`和`textarea`区别

```html
<textarea name="textarea" rows="10" cols="50">
    Write something here
</textarea>

<input type="range" name="range" value="2" min="0" max="100" step="10">
<input type="file" name="file" accept="image/*">
<input type="month" name="month" value="2017-11">
```

1.	`<textarea>`标签是成对的，有结束标签进行闭合，标签的内容写在标签对中间；`<input>`是单个标签，标签的内容通过 value 属性设置；
2.	`<textarea>`的值是纯文本；`<input>`的值根据类型不同而不同；
3.	`<textarea>`没有type属性；`<input>`有多种type来满足表单与用户的数据交互；
4.	`<textarea>`的值可以是多行的，并且有rows和cols来控制多行结构；`<input>`的值是单行的；

# 用一个div模拟textarea的实现

[segmentfault](https://segmentfault.com/a/1190000011837105)
[张鑫旭](http://www.zhangxinxu.com/wordpress/2010/12/div-textarea-height-auto/)

1.	给 div 添加一个HTML全局属性：contenteditable="true"，使 div 元素变成用户可编辑的;
2.	给 div 添加样式 resize: vertical;，使 div 可以被用户调整尺寸，注意：别忘了设置 overflow: auto; 样式，因为resize样式不适用于overflow: visible;的块，不然 resize 不起效哦；
3.	增加一个属性：placeholder="I am placeholder"；
4.	通过 CSS 选择器获取并显示 placeholder 的值；

```html
<div class="test_box" contenteditable="true" placeholder="This is placeholder"></div>
```

```css
.test_box {
   width: 300px;
   min-height: 200px; /* 可使高度自适应 */
   padding: 4px;
   border: 1px solid red;
   /* resize: vertical; */ /* 可调节高度 */
   /* overflow: auto; */
}

/* 设置placeholder */
.test_box:empty::before { /* 这里的before使用两个冒号，不然不起作用。。 或者写成 :empty:before */
   content: attr(placeholder);
   color: #bbb;
}
```

* **`contenteditable`** - HTML5全局属性,规定是否可编辑元素的内容。
* **`:empty`** - 选择每个没有任何子级的元素（包括文本节点）。
* **`::before`** - 在被选元素的内容前面插入内容,使用 **content 属性**来指定要插入的内容。
* **`content`** - :before 及 :after 伪元素配合使用，来插入生成内容
* **`attr()`** - 获取选择到的元素的某一HTML属性值，并用于其样式.它也可以用于伪元素，属性值采用伪元素所依附的元素。[MDN](https://developer.mozilla.org/zh-CN/docs/Web/CSS/attr)

# div模拟select

见自己封装的git**[crm-selector](https://github.com/hellogithub2014/crm-selector)**

原理是使用一个div模拟选中的项（即header），点击header展开所有选项（利用ul封装的列表body），然后监听各种事件，改变header的值以及body的显示隐藏。

展开body时，为了随意点击页面其他地方均可收起，用一个类似back-drop的div元素充当背景，点击背景收起body。

back-drop的关键css是：

```css
position:fixed;
index:999; /* index只针对已定位（fixed、absolute、relative）元素才起作用 */
top:0;
bottom:0;
left:0;
right:0;
```
