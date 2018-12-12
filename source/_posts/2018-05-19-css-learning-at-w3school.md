---
title: "css学习笔记之w3school启蒙"
summary_img: /images/malaysia.jpg # Add image post (optional)
date: 2018-05-19 09:30:00

tag: [css]
---

# W3SCHOOL 学习笔记-CSS

## [参考手册](http://www.w3school.com.cn/cssref/index.asp)

## [选择器](http://www.w3school.com.cn/cssref/css_selectors.asp)

## 字体

### 使用 em 来设置字体大小

- 1em 等于当前的字体尺寸。如果一个元素的`font-size`为 16 像素。那么对于该元素，1em 就等于 16 像素。在设置字体大小时，em 的值会相对于父元素的字体大小改变。
- 浏览器中默认的文本大小是 16 像素。因此 1em 的默认尺寸是 16 像素
- 假设父元素的`font-size`为 20px，那么 1em 就是 20px
- 可以使用 px、em、百分比来设置字体

## 链接链接的特殊性在于能够根据他们所处的状态来设置它们的样式

### 链接的四种状态

- `a:link`-普通未被访问的链接
- `a:visited`-用户已访问的链接
- `a:hover`-鼠标位于链接的上方
- `a:active`-链接被点击的时刻

当为链接的不同状态设置样式时，请按照以下次序规则

- `a:hover`必须位于`a:link`和`a:visited`之后
- `a:active`必须位于`a:hover`之后

### 常见的链接样式

- 文本修饰`text-decoration`-大多用于去掉链接的下划线

```css
a:link {
  text-decoration: none;
}
a:visited {
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}
a:active {
  text-decoration: underline;
}
```

- background-color 设置链接的背景色

## 列表

### `list-style-type`

要修改列表项的标志类型，可以使用此属性
`ul {list-style-type : square}`

### `list-style-image`

对各标志使用一个图像
`ul li {list-style-image : url(xxx.gif)}`

### `list-style-position`

确定标志位出现在列表项内容之外还是内容内部

### 简写列表样式

可以将上面的 3 个列表样式合并为一个`list-style`
`li {list-style : url(example.gif) square inside}`
`list-style`的值可以按任何顺序列出，而且这些值都可以忽略。只要提供了一个值，其他的就会填入其默认值。

## 表格

### 表格边框

如需在 css 中设置表格边框，可以使用`border`属性

```
table, th, td
{
border: 1px solid blue;
}
```

### 折叠边框

`border-collapse`属性设置是否将表格边框折叠为单一边框：

```table
  {
  border-collapse:collapse;
  }

table,th, td
  {
  border: 1px solid black;
  }
```

### 表格宽度和高度通过 width 和 height 属性定义表格的宽度和高度

### 表格文本对齐

- `text-align`和`vertical-align`属性设置表格中文本的对齐方式。
- `text-align`设置水平对齐方式，如左对齐、右对齐或居中
- `vertical-align`设置垂直对齐方式，如顶部对齐、底部对齐或居中对齐

### 表格内边距如需控制表格中内容与边框的距离，请为`td`和`th`设置`padding`属性

```
   td
  {
  padding:15px;
  }
```

### 表格颜色使用`border`设置边框和文字的颜色，`background-color`来设置背景颜色

### Table 属性

| 属性            | 描述                           |
| --------------- | ------------------------------ |
| border-collapse | 是否把表格边框合并为单一的边框 |
| border-spacing  | 分隔单元格边框的距离           |
| caption-side    | 设置表格标题的位置             |
| empty-cells     | 是否显示表格中的空单元格       |
| table-layout    | 设置显示单元、行、列的算法     |

## 轮廓轮廓属性，与 border 很类似。发现轮廓显示在边框外面

| 属性          | 描述                           |
| ------------- | ------------------------------ |
| outline       | 在一个声明中设置所有的轮廓属性 |
| outline-color | 轮廓颜色                       |
| outline-style | 轮廓样式                       |
| outline-width | 轮廓的宽度                     |

## 框模型

### 内边距

- padding 接受长度值或百分比，但不允许使用负值.数值的单位可以是 cm、px、em
- padding 的百分比数值是相对于其父元素的 width 计算的，这一点与外边距一样。**上下内边距与左右内边距一致；即上下内边距的百分数会相对于父元素的宽度设置，而不是相对于高度**

### 边框

- 边框的样式`border-style` \* 可以为一个边框定义多个样式，eg：
  `p.aside {border-style: solid dotted dashed double;}`
  上面这条规则为类名为 aside 的段落定义了四种边框样式：实线上边框、点线右边框、虚线下边框和一个双线左边框。同样遵循**上右下左**的顺序。
- 边框的宽度`border-width`
  - 为边框指定宽度有两种方法：长度值，如 px、em,或者使用 3 个关键字之一：`thin`、`medium`、`thick`。（\*css 没有设置这 3 个关键字的具体宽度\*)。
- 没有边框
  _ **`border-style`默认值为 none**
  _ **如果希望显示某种边框，必须设置边框样式**。 \* 如果把边框样式设置为`none`，此时即使设置了边框的宽度，也不会显示边框，而且浏览器中边框宽度自动变为 0.
- 边框颜色`border-color`
  _ 可以使用命名颜色、十六进制、RGB
  _ 默认的边框颜色是元素本身的前景色，如果没有声明边框颜色，它将与文本颜色相同 \* 如果元素没有任何文本，那么其边框颜色就是其父元素的文本颜色（因为 color 可以继承）
- 透明边框

  ```css
  a:link,
  a:visited {
    border-style: solid;
    border-width: 5px;
    border-color: transparent;
  }
  a:hover {
    border-color: gray;
  }
  ```

- 从某种意义上说，利用 transparent，使用边框就像是而外的内边距一样；此外还有一个好处，就是能在需要的时候使其可见。

### 外边距`margin`

- `margin`接收任何长度单位，可以是像素、英寸、百分比、毫米或 em，还可以设置为 auto
- 百分比单位是相对于父元素的`width`计算的。
- 值复制

      	![值复制](http://www.w3school.com.cn/i/ct_css_margin_value.gif)

### 外边距合并

**当两个垂直外边距相遇时，他们将形成一个外边距。合并后的外边距的高度等于两个发生合并的外边距的高度中的较大者**。

- 当一个元素出现在另一个元素上面时，第一个元素的下边距与第二个元素的上边距发生合并
  ![margin合并](http://www.w3school.com.cn/i/ct_css_margin_collapsing_example_1.gif)
- 当一个元素包含在另一个元素中时（假设没有内边距或者边框把外边距分隔开），他们的上和/或下外边距也会发生合并
  ![margin合并](http://www.w3school.com.cn/i/ct_css_margin_collapsing_example_2.gif)
- 尽管有些奇怪，但是外边距甚至可以和自身发生合并。假设有一个空元素，他有外边距，但是没有边框或填充。此时，上外边距就和下外边距合并到一起了：
  ![margin合并](http://www.w3school.com.cn/i/ct_css_margin_collapsing_example_3.gif)
  假如这个外边距遇到另一个元素的外边距，他们还会发生合并：
  ![margin合并](http://www.w3school.com.cn/i/ct_css_margin_collapsing_example_4.gif)
- 外边距合并的效果示范
  ![示范](http://www.w3school.com.cn/i/ct_css_margin_collapsing.gif)
- **只有普通的文档流中块框才会发生外边距合并。行框、浮动框或绝对定位之间的外边距之间的外边距不会合并**

## 定位

### 定位概述

#### 一切皆为框

- **块框**： `div`、`h1`或`p`元素常常被称为块级元素，亦即块框
- **行内框**： `span`、`strong`等元素成为行内元素，亦即行内框
- **行框**： 所有行高当中最大值构成的行内框。[行框参考](http://www.jianshu.com/p/f1019737e155)
- 行内框在一行中水平布置，可以使用水平内边距、边框和外边距调整它们的间距。但是垂直内边距、边框和外边距不影响行内框的高度。**由一行形成的水平框成为行框**，行框的高度总是足以容纳它包含的行内框。不过设置行高可以增加这个框的高度。
- 可以使用`display`属性改变生成的框的类型。通过将`display`属性设置为`block`，可以让行内元素表现的像块级元素一样。还可以把`display`设置为`none`，让生成的元素根本没有框。这样的话，该框及其所有内容就不再显示，不占用文档内的空间。
- 在一种情况下，即使没有显示定义，也会创建块级元素。在把一些文本添加到一个块级元素的开头。即使没有把这些文本定义为段落，他也会被当做段落对待。

      	```
      	<div>
      	some text
      	<p>Some more text.</p>
      	</div>
      	```

在这种情况下，这个框成为无名块框，因为它不与专门的元素相关联

#### 定位机制

- css 有三种**定位机制**：普通流、浮动和绝对定位

#### **position**属性

- **static** - 元素框正常生成，块级元素生成一个矩形框，作为文档流的一部分，行内元素则会创建一个或多个行框，置于其父元素中。
- **relative** - 元素框偏移某个距离。元素仍保持其未定位前的形状，它原本所占的空间仍保留
- **absolute** - 元素框从文档流完全删除，并相对于其包含块定位。包含块可能是文档中的另一个元素或者是初始包含块。元素原先在正常文档流中所占用的空间会关闭，就好像元素原来不存在一样。元素定位后生成一个块级框，而不论原来他在正常流中生成何种类型的框
- **fixed** - 元素框的表现类似于将`position`设置为`absolute`，不过其包含块是视窗本身
- 相对定位实际上被看做普通流定位模型的一部分，因为元素的位置相对于它在普通流中的位置

#### css 定位属性

- `overflow`规定当元素的内容溢出其区域时发生的事情。
  _ 如果值为`scroll`，不论是否需要，用户代理都会提供一种滚动机制。因此有可能即使元素框中可以放下所有内容也会出现滚动条
  _ `visable`默认值。内容不会被修剪，会呈现在元素框之外
  _ `hidden`内容会被修剪，并且其余内容是不可见的
  _ `scroll`内容会被修剪，但是浏览器会显示滚动条以便查看其余内容
  _ `auto`如果内容被修剪，则浏览器会显示滚动条以便查看其余的内容
  _ `inherit`规定应该从父元素继承`overflow`属性的值
- `vertical-align`设置元素的垂直对齐方式 \* 该属性定义行内元素的基线相对于该元素所在行的基线的垂直对齐。允许指定负长度值和百分比值。这会使得元素降低而不是升高。在表单元格中，这个属性会设置单元格框中的单元格内容的对齐方式
- `z-index`设置元素的堆叠顺序
  _ 拥有更高堆叠顺序的严肃总是会处于堆叠顺序较低的元素前面
  _ 可拥有负的属性值 \* 仅能在定位元素上奏效（例如`position:absolute`）

| 属性           | 描述                                                         |
| -------------- | ------------------------------------------------------------ |
| position       | 把元素放置到一个静态的、相对的、绝对的、或固定的位置中。     |
| top            | 定义了一个定位元素的上外边距边界与其包含块上边界之间的偏移。 |
| right          | 定义了定位元素右外边距边界与其包含块右边界之间的偏移。       |
| bottom         | 定义了定位元素下外边距边界与其包含块下边界之间的偏移。       |
| left           | 定义了定位元素左外边距边界与其包含块左边界之间的偏移。       |
| overflow       | 设置当元素的内容溢出其区域时发生的事情。                     |
| clip           | 设置元素的形状。元素被剪入这个形状之中，然后显示出来。       |
| vertical-align | 设置元素的垂直对齐方式。                                     |
| z-index        | 设置元素的堆叠顺序。                                         |

### 相对定位设置为相对定位的元素框会偏移某个距离，元素仍然会保持其未定位前的形状，它原本所占的空间仍保留。

**注意**在使用相对定位时，无论是否进行移动，元素仍然占据原来的空间。因此，移动元素会导致它覆盖其他框。
![相对定位](http://www.w3school.com.cn/i/ct_css_positioning_relative_example.gif)

### 绝对定位

- 设置为绝对定位的元素框从文档流中完全删除，并相对于其包含块定位，包含块可能是文档中的另一个元素或者是初始包含块。元素原先在正常文档流中所占的空间会被关闭，就好像该元素原来不存在一样。元素定位后生成一个*块级框*，而不论原来他在正常流中生成何种类型的框。
- 绝对定位的元素的位置相对于最近的已定位祖先元素，如果元素没有已定位的祖先元素，那么它的位置相对于**最初的包含块**。根据用户代理的不同，最初的包含块可能是画布或 HTML 元素。
- **提示**： 因为绝对定位的框与文档流无关，所以他们可以覆盖页面上的其他元素。可以通过设置`z-index`属性来控制这些框的堆放次序。

### 浮动

- 浮动的框可以向左或者向右移动，直到它的外边缘碰到包含框或另一个浮动框的边框为止
- 由于浮动框不在文档的普通流中，所以文档中的普通流中的**块框**表现的就像浮动框不存在一样（行内框呢？）

![浮动1](http://www.w3school.com.cn/i/ct_css_positioning_floating_right_example.gif)

![浮动2](http://www.w3school.com.cn/i/ct_css_positioning_floating_left_example.gif)

![浮动3](http://www.w3school.com.cn/i/ct_css_positioning_floating_left_example_2.gif)

#### 行框和清理

- 浮动框旁边的行框被缩短，从而给浮动框留出空间，行框围绕浮动框。因此创建浮动框可以使文本围绕图像。

![行框与清理1](http://www.w3school.com.cn/i/ct_css_positioning_floating_linebox.gif)

- 要想阻止行框围绕浮动框，需要对该框应用`clear属性`。属性的值可以是 left、right、both 或 none，他表示框的那些边不应该挨着浮动框。为了实现这种效果，会在被清理的元素**上外边距**上添加足够的空间，使元素的顶边缘垂直下降到浮动框下面。

![浮动与清理2](http://www.w3school.com.cn/i/ct_css_positioning_floating_clear.gif)

- 发现清理只对块框有效果，对行框清理没有反应。。。

## CSS 选择器

### 类选择器

#### 多类选择器

- 通过把多个类选择器链接在一起，仅可以选择**同时包含**这些类名的元素，_类名的顺序不限_
- 如果一个多类选择器中包含类名列表中没有的一个类名，匹配就会失败
- 类名列表中的类可以比多类选择器中的多。即`.class1.class2`可以匹配`class='class1 class2 class3'`

```html
<style>
.class1.class2{color:red}//class中同时包含class1和class2的元素颜色为red。这两个类的次序无所谓。
</style>

<p class="class1 class2">
This paragraph is a very important warning.
</p>
```

### 属性选择器

- 简单属性选择器：`a[href] {color:red;}`
- 根据多个属性进行选择：`a[href][title]{color:red}`
- 根据具体属性值选择

      	```
      	a[href='www.baidu.com']{color:red}

      	a[href='www.baidu.com'][title='baidu']{color:red}
      	```

- 属性与属性值必须完全匹配


    ```html
    <p class="important warning">This paragraph is a very important warning.</p>
    ```

    ```css
    p[class='important']//无法匹配
    ```

    ```css
    p[class='important warning']//可以匹配
    ```

- 根据部分属性值选择如果需要根据属性值中的**词列表的某个词**进行选择，则需要使用波浪号。

      ```html
      <p class="important warning">This paragraph is a very important warning.</p>
      ```

      ```css
      p[class~='important']//匹配
      ```

- 子串匹配属性选择器提示：任何属性都可以使用这些选择器

      | 类型          | 描述                                       |
      | ------------- | ------------------------------------------ |
      | [abc\^='def'] | 选择abc属性值以‘def’**开头**的所有元素   |
      | [abc$='def']  | 选择abc属性值以‘def’**结尾**的所有元素   |
      | [abc*='def']  | 选择abc属性值**包含子串**‘def’的所有元素 |

- 特定属性选择器类型
  `[att|='val']`可以用于匹配`att`属性等于`val`或以`val-`开头的所有属性。


    ```css
    *[lang|="en"] {color: red;}
    ```

    ```html
    <p lang="en">Hello!</p> <!-- 匹配 -->
    <p lang="en-us">Greetings!</p><!-- 匹配 -->
    <p lang="en-au">G'day!</p><!-- 匹配 -->
    <p lang="fr">Bonjour!</p><!-- 不匹配 -->
    <p lang="cy-en">Jrooana!</p><!-- 不匹配 -->
    ```

- 属性选择器小结

        | 选择器          | 描述                                         |
        | --------------- | -------------------------------------------- |
        | `[abc]`         | 选择带有`abc`属性的元素                      |
        | `[abc='def']`   | 选择`abc`属性值为`def`的元素                 |
        | `[abc~='def']`  | 选择`abc`属性值中包含`def`这个词汇的元素     |
        | `[abc|='def']`  | 选择`abc`属性值为`def`或者以`def-`开头的元素 |
        | `[abc\^='def']` | 选择`abc`属性值以`def`**开头**的所有元素     |
        | `[abc$='def']`  | 选择`abc`属性值以`def`**结尾**的所有元素     |
        | `[abc*='def']`  | 选择`abc`属性值**包含子串**`def`的所有元素   |

### 后代选择器又称包含选择器，选择作为某元素后代的元素。

`h1 em {color:red;}`

**注意**：后代选择器的两个元素之间的层次间隔可以是无限的。
`h1 em`匹配从`h1`元素继承的所有`em`元素，而不论`em`嵌套层次多深。

### 子元素选择器子元素选择器只能选择作为某元素子元素的元素。

```
h1>strong {color:red}
```

### 相邻兄弟选择器可选择**紧邻在另一元素后**的元素，且二者有相同的父元素。他只能选择两个相邻兄弟中的第二个元素。

1.  示范 1

    ```css
    h1 + p {
      color: red;
    } //紧邻在h1元素后的p，h1和p拥有相同的父元素
    ```

    ```html
    <body>
    <p>This is paragraph.</p>
    <h1>This is a heading.</h1>
    <p>This is paragraph.</p> <!-- 只有这一个p被选择，其他的都不会 -->
    <p>This is paragraph.</p>
    <p>This is paragraph.</p>
    <p>This is paragraph.</p>
    <p>This is paragraph.</p>
    </body>
    ```

2.  示范 2

    ```css
    li + li {
      color: red;
    }
    ```

    ```html
    <div>
    	<ul>
    		<li>List item 1</li> <!-- 没有选中 -->
    		<li>List item 2</li> <!-- 被选中 -->
    		<li>List item 3</li> <!-- 被选中 -->
    	</ul>
    	<ol>
    		<li>List item 1</li> <!-- 没有选中 -->
    		<li>List item 2</li> <!-- 被选中 -->
    		<li>List item 3</li> <!-- 被选中 -->
    	</ol>
    </div>
    ```

### 伪类用于向某些选择器添加特殊的效果。

#### 锚伪类

```css
a:link {
  color: #ff0000;
} /* 未访问的链接 */
a:visited {
  color: #00ff00;
} /* 已访问的链接 */
a:hover {
  color: #ff00ff;
} /* 鼠标移动到链接上 */
a:active {
  color: #0000ff;
} /* 选定的链接 */
```

- `a:hover`必须被置于`a:link`和`a:visted`之后才有效
- `a:active`必须被置于`a:hover`之后才有效
- 伪类名称对大小写不敏感

#### `：first-child`伪类选择作为某元素的第一个子元素 ele，而不是选择 ele 的第一个子元素。**注意选择的是元素节点，而不是其他类型的节点，见示范 3**

1.  示范 1

    ```css
    p:first-child {
      font-weight: bold;
    }
    li:first-child {
      text-transform: uppercase;
    }
    ```

    ```html
    <div>
    <p>These are the necessary steps:</p><!-- 被选中 -->
    <ul>
    <li>Intert Key</li><!-- 被选中 -->
    <li>Turn key <strong>clockwise</strong></li>
    <li>Push accelerator</li>
    </ul>
    <p>Do <em>not</em> push the brake at the same time as the accelerator.</p>
    </div>
    ```

2.  示范 2

    ```html
    	<html>
    		<head>
    			<style type="text/css">
    				p:first-child {
    				  color: red;
    				  }
    			</style>
    		</head>

    		<body>
    			<p>some text</p> <!-- 被选中 -->
    			<p>some text</p>
    		</body>
    	</html>
    ```

3.  示范 3

    ```html
    <html>
    <head>
    <style type="text/css">
    p > i:first-child {
      font-weight:bold; //匹配所有 <p> 元素中的第一个 <i> 元素. 注意，这里即使i不是p下面的第一个节点，仍然可以被选中，他前面的那些文字不是元素，而是文本节点。
      }
    </style>
    </head>

    <body>
    <p>some <i>text</i>. some <i>text</i>.</p>
    <p>some <i>text</i>. some <i>text</i>.</p>
    </body>
    </html>
    ```

#### `：lang`伪类为不同的语言定义特殊的规则。

```html
<html>
<head>

<style type="text/css">
q:lang(no)
   {
   quotes: "~" "~"// 为属性值为no的q元素定义引号的类型
   }
</style>

</head>

<body>
<p>文字<q lang="no">段落中的引用的文字</q>文字</p>
</body></html>
```

#### 小结属性|描述|CSS

-----|----|----
:active|向被激活的元素添加样式。|1
:focus|向拥有键盘输入焦点的元素添加样式。|2
:hover|当鼠标悬浮在元素上方时，向元素添加样式。|1
:link|向未被访问的链接添加样式。|1
:visited|向已被访问的链接添加样式。|1
:first-child|向元素的第一个子元素添加样式。|2
:lang|向带有指定 lang 属性的元素添加样式。|2

### 伪元素用于向某些选择器设置特殊效果。

#### `：first-line`伪元素向文本的首行设置特殊样式，**只能用于块级元素**

```html
<html>
<head>
<style type="text/css">
p:first-line //对p元素的第一行文本进行格式化
{
color: #ff0000;
font-variant: small-caps
}
</style>
</head>

<body>
<p>
You can use the :first-line pseudo-element to add a special effect to the first line of a text!
</p>
</body>
</html>
```

下面的属性可用于`first-line`伪元素

- font
- color
- background
- word-spacing
- letter-spacing
- text-decoration
- vertical-align
- text-transform
- line-height
- clear

#### `:first-letter`伪元素向文本的首字母设置特殊样式，**只能用于块级元素**

下面的属性可用于`first-line`伪元素

- font
- color
- background
- margin
- padding
- border
- text-decoration
- vertical-align(仅当 float 为 none 时)
- text-transform
- line-height
- float
- clear

#### `：before`伪元素用于在元素的内容前面插入新内容

```css
h1:before//在每个h1的内部最前面插入一副图片 {
  content: url(logo.gif);
}
```

#### `：after`伪元素用于在元素的内容之后插入新内容

```css
h1:before//在每个h1的内部最后面插入一副图片 {
  content: url(logo.gif);
}
```

#### 小结属性|描述|CSS

---|-----|-----
:first-letter|向文本的第一个字母添加特殊样式。|1
:first-line|向文本的首行添加特殊样式。|1
:before|在元素之前添加内容。|2
:after|在元素之后添加内容。|2

## css 高级

### 水平对齐块级元素文本对齐参见[CSS 文本](http://www.w3school.com.cn/css/css_text.asp)

- 使用`margin`进行**水平**对齐将左右外边距设置为`auto`来对齐块元素，设为`auto`是均等分配可用的外边距，结果就是居中的元素


    ```html
    <!DOCTYPE html>
    <html>
    <head>
    <style>
    .center
    {
    margin:auto;
    width:70%; //若宽度设为100%，看不出来效果
    background-color:#b0e0e6;
    }
    </style>
    </head>

    <body>

    <div class="center">
    <p>这是一个段落。这是一个段落。这是一个段落。这是一个段落。这是一个段落。</p>
    <p>这是一个段落。这是一个段落。这是一个段落。这是一个段落。这是一个段落。</p>
    </div>

    </body>
    </html>
    ```

- 使用`position`进行**左和右**对齐关键思想是使用绝对定位

  ````html
  <!DOCTYPE html>
  <html>
  <head>
  <style>
  .right
  {
  position:absolute;//绝对定位
  right:0px;//靠右对齐
  width:300px;
  background-color:#b0e0e6;
  }
  </style>
  </head>

      	<body>

      	<div class="right">
      	<p>这是一个段落。这是一个段落。这是一个段落。这是一个段落。这是一个段落。</p>
      	<p>这是一个段落。这是一个段落。这是一个段落。这是一个段落。这是一个段落。</p>
      	</div>

      	</body>
      	</html>
      	```
  ````

- 使用`float`进行**左和右**对齐

  ````html
  <!DOCTYPE html>
  <html>
  <head>
  <style>
  .right
  {
  float:right;//右浮动来进行右对齐
  width:300px;
  background-color:#b0e0e6;
  }
  </style>
  </head>

      	<body>

      	<div class="right">
      	<p>这是一个段落。这是一个段落。这是一个段落。这是一个段落。这是一个段落。</p>
      	<p>这是一个段落。这是一个段落。这是一个段落。这是一个段落。这是一个段落。</p>
      	</div>

      	</body>
      	</html>
      	```
  ````

### css 尺寸这些属性的值都可以使用 px、em、百分比、数值进行表示属性|描述

----|-----
height|设置元素的高度。
line-height|设置行高。
max-height|设置元素的最大高度。
max-width|设置元素的最大宽度。
min-height|设置元素的最小高度。
min-width|设置元素的最小宽度。
width|设置元素的宽度。

### css 分类分类属性允许控制如何显示元素、设置图像显示于另一元素的何处、相对于其正常的位置来定位元素、使用绝对值来定位元素、元素的可见度。

| 属性                                                                    | 描述                                                     |
| ----------------------------------------------------------------------- | -------------------------------------------------------- |
| [clear](http://www.w3school.com.cn/cssref/pr_class_clear.asp)           | 设置一个元素的侧面是否允许其他的浮动元素。               |
| [cursor](http://www.w3school.com.cn/cssref/pr_class_cursor.asp)         | 规定当指向某元素之上时显示的指针类型。                   |
| [display](http://www.w3school.com.cn/cssref/pr_class_display.asp)       | 设置是否及如何显示元素。                                 |
| [float](http://www.w3school.com.cn/cssref/pr_class_float.asp)           | 定义元素在哪个方向浮动。                                 |
| [position](http://www.w3school.com.cn/cssref/pr_class_position.asp)     | 把元素放置到一个静态的、相对的、绝对的、或固定的位置中。 |
| [visibility](http://www.w3school.com.cn/cssref/pr_class_visibility.asp) | 设置元素是否可见或不可见。                               |

### css2 媒介类型 `@media`

允许定义以何种媒介来提交文档。文档可以被显示在显示器、纸媒或者听觉浏览器等。

```html
<html>
<head>

<style>
@media screen //在显示器上展示时
{
p.test {font-family:verdana,sans-serif; font-size:14px}
}

@media print // 需要被打印时
{
p.test {font-family:times,serif; font-size:10px}
}

@media screen,print
{
p.test {font-weight:bold}
}
</style>

</head>

<body>....</body>

</html>
```

| 媒介类型   | 描述                                                   |
| ---------- | ------------------------------------------------------ |
| all        | 用于所有的媒介设备。                                   |
| aural      | 用于语音和音频合成器。                                 |
| braille    | 用于盲人用点字法触觉回馈设备。                         |
| embossed   | 用于分页的盲人用点字法打印机。                         |
| handheld   | 用于小的手持的设备。                                   |
| print      | 用于打印机。                                           |
| projection | 用于方案展示，比如幻灯片。                             |
| screen     | 用于电脑显示器。                                       |
| tty        | 用于使用固定密度字母栅格的媒介，比如电传打字机和终端。 |
| tv         | 用于电视机类型的设备。                                 |

# W3SCHOOL 学习笔记-CSS3

## [CSS3 属性参考手册](http://www.w3school.com.cn/cssref/index.asp)

## [CSS3 选择器参考手册](http://www.w3school.com.cn/cssref/css_selectors.asp)

## css3 边框

### `border-radius`属性用于创建圆角

```
div
{
border:2px solid;
border-radius:25px;
-moz-border-radius:25px; /* Old Firefox */
}
```

### `border-shadow`用于向方框添加阴影

```
div
{
box-shadow: 10px 10px 5px #888888;
}
```

### `border-image`使用图片来创建边框

```
div
{
border-image:url(border.png) 30 30 round;
-moz-border-image:url(border.png) 30 30 round; /* 老的 Firefox */
-webkit-border-image:url(border.png) 30 30 round; /* Safari 和 Chrome */
-o-border-image:url(border.png) 30 30 round; /* Opera */
}
```

### 小结新边框属性

| 属性                                                                    | 描述                                           | CSS |
| ----------------------------------------------------------------------- | ---------------------------------------------- | --- |
| [border-image](http://www.w3school.com.cn/cssref/pr_border-image.asp)   | 设置所有 border-image-\* 属性的简写属性。      | 3   |
| [border-radius](http://www.w3school.com.cn/cssref/pr_border-radius.asp) | 设置所有四个 border-\*-radius 属性的简写属性。 | 3   |
| [box-shadow](http://www.w3school.com.cn/cssref/pr_box-shadow.asp)       | 向方框添加一个或多个阴影。                     | 3   |

## CSS3 背景

### `background-size`属性

- 规定背景图片的尺寸。 在 css3 之前，背景图片的尺寸是否图片的实际尺寸决定的。
- 能够以像素或者百分比规定尺寸
- 如果以百分比规定尺寸，那么尺寸相对于父元素的宽度和高度

- 示范 1

```
div
{
background:url(bg_flower.gif);
-moz-background-size:63px 100px; /* 老版本的 Firefox */
background-size:63px 100px;
background-repeat:no-repeat;
}
```

- 示范 2

```
div
{
background:url(bg_flower.gif);
-moz-background-size:40% 100%; /* 老版本的 Firefox */
background-size:40% 100%;
background-repeat:no-repeat;
}
```

### `background-origin`属性

- 规定背景图片的定位区域
- 背景图片可以放置于 content-box、padding-box 或 border-box 区域
  ![box](http://www.w3school.com.cn/i/background-origin.gif)
- 示范

```
div
{
background:url(bg_flower.gif);
background-repeat:no-repeat;
background-size:100% 100%;
-webkit-background-origin:content-box; /* Safari */
background-origin:content-box;
}
```

### CSS3 多重背景图片

- CSS3 允许为元素使用多个背景图像，多个图片会重合叠加在一起
- 示范

```
body
{
background-image:url(bg_flower.gif),url(bg_flower_2.gif);
}
```

### 小结属性|描述|CSS

-----|------|-----
[background-clip](http://www.w3school.com.cn/cssref/pr_background-clip.asp)|规定背景的绘制区域。|3
[background-origin](http://www.w3school.com.cn/cssref/pr_background-origin.asp)|规定背景图片的定位区域。(跟上面的有什么区别？)|3
[background-size](http://www.w3school.com.cn/cssref/pr_background-size.asp)|规定背景图片的尺寸。|3

## CSS3 文本效果

### `text-shadow`属性

- 向文本应用阴影
- 能够规定水平、垂直、模糊阴影，以及阴影的颜色
- 示范

```
h1
{
text-shadow: 5px 5px 5px #FF0000;
}
```

### `word-wrap`属性正常情况下，单词太长可能会超出某个区域。此属性允许强制文本进行换行，即使这意味着会对单词进行拆分。

```css
p {
  word-wrap: break-word;
} /* 允许对长单词进行拆分，并换行到下一行 */
```

### 新的文本属性小结属性|描述|CSS

----|------|----
[hanging-punctuation](http://www.w3school.com.cn/cssref/pr_hanging-punctuation.asp)|规定标点字符是否位于线框之外。|3
[punctuation-trim](http://www.w3school.com.cn/cssref/pr_punctuation-trim.asp)|规定是否对标点字符进行修剪。|3
[text-align-last]()|设置如何对齐最后一行或紧挨着强制换行符之前的行。|3
[text-emphasis](http://www.w3school.com.cn/cssref/pr_text-emphasis.asp)|向元素的文本应用重点标记以及重点标记的前景色。|3
[text-justify](http://www.w3school.com.cn/cssref/pr_text-justify.asp)|规定当 text-align 设置为 "justify" 时所使用|的对齐方法。3
[text-outline](http://www.w3school.com.cn/cssref/pr_text-outline.asp)|规定文本的轮廓。|3
[text-overflow](http://www.w3school.com.cn/cssref/pr_text-overflow.asp)|规定当文本溢出包含元素时发生的事情。|3
[text-shadow](http://www.w3school.com.cn/cssref/pr_text-shadow.asp)|向文本添加阴影。|3
[text-wrap](http://www.w3school.com.cn/cssref/pr_text-wrap.asp)|规定文本的换行规则。|3
[word-break](http://www.w3school.com.cn/cssref/pr_word-break.asp)|规定非中日韩文本的换行规则。|3
[word-wrap](http://www.w3school.com.cn/cssref/pr_word-wrap.asp)|允许对长的不可分割的单词进行分割并换行到下一行。|3

## CSS3 字体

- 通过 css3，web 设计师再也不必被迫使用`web-safe`字体了

### css3 `@font-face`规则

- 在 css3 之前，web 设计师必须使用已在用户计算机上安装好的字体
- 通过 css3，当找到或者购买到希望使用的字体时，可以将该字体文件放在 web 服务器上，他会在需要时被自动下载到用户的计算机上
- “自己的”字体是在 css3 的`@font-face`规则中定义的

- 在这个规则中，必须先定义字体的名称，然后指向该字体文件

```css
<style>
@font-face
{
font-family: myFirstFont;
src: url('Sansation_Light.ttf'),
     url('Sansation_Light.eot'); /* IE9+ */
}

div
{
font-family:myFirstFont;
}
</style>
```

## css3 2d 转换通过转换，能够对元素进行移动、缩放、转动或拉伸

### `translate()`方法根据给定的位置参数使元素从其当前位置移动。测试发现这会使元素脱离文档流。

```
div
{
transform: translate(50px,100px);
-ms-transform: translate(50px,100px);		/* IE 9 */
-webkit-transform: translate(50px,100px);	/* Safari and Chrome */
-o-transform: translate(50px,100px);		/* Opera */
-moz-transform: translate(50px,100px);		/* Firefox */
}
```

### `rotate()`方法元素顺时针给定的角度。允许负值，此时元素逆时针旋转。角度的单位使用**deg**

```
div
{
transform: rotate(30deg);
-ms-transform: rotate(30deg);		/* IE 9 */
-webkit-transform: rotate(30deg);	/* Safari and Chrome */
-o-transform: rotate(30deg);		/* Opera */
-moz-transform: rotate(30deg);		/* Firefox */
}
```

### `scale()`方法缩放，元素的尺寸会增加或减少。

```
div
{
transform: scale(2,4);/* 宽度×2，高度×4 */
-ms-transform: scale(2,4);	/* IE 9 */
-webkit-transform: scale(2,4);	/* Safari 和 Chrome */
-o-transform: scale(2,4);	/* Opera */
-moz-transform: scale(2,4);	/* Firefox */
}
```

### `skew()`方法根据给定的 X 轴和 Y 轴参数使元素翻转给定的角度。

```
div
{
transform: skew(30deg,20deg);/* x轴翻转30度，y轴翻转20度 */
-ms-transform: skew(30deg,20deg);	/* IE 9 */
-webkit-transform: skew(30deg,20deg);	/* Safari and Chrome */
-o-transform: skew(30deg,20deg);	/* Opera */
-moz-transform: skew(30deg,20deg);	/* Firefox */
}
```

### `matrix()`方法把所有的 2d 转换方法组合在一起。

### 小结

#### 新的转换属性

| 属性                                                                          | 描述                         | CSS |
| ----------------------------------------------------------------------------- | ---------------------------- | --- |
| [transform](http://www.w3school.com.cn/cssref/pr_transform.asp)               | 向元素应用 2D 或 3D 转换。   | 3   |
| [transform-origin](http://www.w3school.com.cn/cssref/pr_transform-origin.asp) | 允许你改变被转换元素的位置。 | 3   |

#### 2d 转换方法函数|描述

---|---
matrix(n,n,n,n,n,n)|定义 2D 转换，使用六个值的矩阵。
translate(x,y)|定义 2D 转换，沿着 X 和 Y 轴移动元素。
translateX(n)|定义 2D 转换，沿着 X 轴移动元素。
translateY(n)|定义 2D 转换，沿着 Y 轴移动元素。
scale(x,y)|定义 2D 缩放转换，改变元素的宽度和高度。
scaleX(n)|定义 2D 缩放转换，改变元素的宽度。
scaleY(n)|定义 2D 缩放转换，改变元素的高度。
rotate(angle)|定义 2D 旋转，在参数中规定角度。(rotateX/rotateY 用于 3d 转换)
skew(x-angle,y-angle)|定义 2D 倾斜转换，沿着 X 和 Y 轴。
skewX(angle)|定义 2D 倾斜转换，沿着 X 轴。
skewY(angle)|定义 2D 倾斜转换，沿着 Y 轴。

## css3 3d 转换

### `rotateX`方法元素围绕其 X 轴旋转 ，**横着的那根线——————**

```
div
{
transform: rotateX(120deg);
-webkit-transform: rotateX(120deg);	/* Safari 和 Chrome */
-moz-transform: rotateX(120deg);	/* Firefox */
}
```

### `rotateY`方法元素围绕其 Y 轴旋转 ，**竖着的那根线 |**

```
div
{
transform: rotateY(130deg);
-webkit-transform: rotateY(130deg);	/* Safari 和 Chrome */
-moz-transform: rotateY(130deg);	/* Firefox */
}
```

### 小结

#### 转换属性属性|描述|CSS

---|---|---
[transform](http://www.w3school.com.cn/cssref/pr_transform.asp)|向元素应用 2D 或 3D 转换。|3
[transform-origin](http://www.w3school.com.cn/cssref/pr_transform-origin.asp)|允许你改变被转换元素的位置。|3
[transform-style](http://www.w3school.com.cn/cssref/pr_transform-style.asp)|规定被嵌套元素如何在 3D 空间中显示。|3
[perspective](http://www.w3school.com.cn/cssref/pr_perspective.asp)|规定 3D 元素的透视效果。|3
[perspective-origin](http://www.w3school.com.cn/cssref/pr_perspective-origin.asp)|规定 3D 元素的底部位置。|3
[backface-visibility](http://www.w3school.com.cn/cssref/pr_backface-visibility.asp)|定义元素在不面对屏幕时是否可见。|3

#### 3D Transform 方法

| 函数                                      | 描述                                      |
| ----------------------------------------- | ----------------------------------------- |
| matrix3d(n,n,n,n,n,n,n,n,n,n,n,n,n,n,n,n) | 定义 3D 转换，使用 16 个值的 4x4 矩阵。   |
| translate3d(x,y,z)                        | 定义 3D 转化。                            |
| translateX(x)                             | 定义 3D 转化，仅使用用于 X 轴的值。       |
| translateY(y)                             | 定义 3D 转化，仅使用用于 Y 轴的值。       |
| translateZ(z)                             | 定义 3D 转化，仅使用用于 Z 轴的值。       |
| scale3d(x,y,z)                            | 定义 3D 缩放转换。                        |
| scaleX(x)                                 | 定义 3D 缩放转换，通过给定一个 X 轴的值。 |
| scaleY(y)                                 | 定义 3D 缩放转换，通过给定一个 Y 轴的值。 |
| scaleZ(z)                                 | 定义 3D 缩放转换，通过给定一个 Z 轴的值。 |
| rotate3d(x,y,z,angle)                     | 定义 3D 旋转。                            |
| rotateX(angle)                            | 定义沿 X 轴的 3D 旋转。                   |
| rotateY(angle)                            | 定义沿 Y 轴的 3D 旋转。                   |
| rotateZ(angle)                            | 定义沿 Z 轴的 3D 旋转。                   |
| perspective(n)                            | 定义 3D 转换元素的透视视图。              |

## CSS3 过渡当元素从一种样式变换为另一种样式时为元素添加效果。必须规定两项内容：

- 希望把效果添加到哪个 css 属性上（可指定多个）
- 效果的时长（默认值为 0，此时没有过渡效果，直接完成变换）

效果开始于指定的 css 属性值发生改变时。

```
div
{
transition: width 2s; /* 应用于宽度的改变，时长2s */
-moz-transition: width 2s;	/* Firefox 4 */
-webkit-transition: width 2s;	/* Safari 和 Chrome */
-o-transition: width 2s;	/* Opera */
}
```

```
div:hover /* 当鼠标位于div上面时，转换开始。 当鼠标移出时，慢慢变回原来的样子 */
{
width:300px;
}
```

- 多项改变如需向多个样式添加过渡效果，请添加多个属性，由逗号隔开

```
div
{
transition: width 2s, height 2s, transform 2s;
-moz-transition: width 2s, height 2s, -moz-transform 2s;
-webkit-transition: width 2s, height 2s, -webkit-transform 2s;
-o-transition: width 2s, height 2s,-o-transform 2s;
}
```

### 小结

#### 过渡属性属性|描述|CSS

---|---|---
[transition](http://www.w3school.com.cn/cssref/pr_transition.asp)|简写属性，用于在一个属性中设置四个过渡属性。|3
[transition-property](http://www.w3school.com.cn/cssref/pr_transition-property.asp)|规定应用过渡的 CSS 属性的名称。|3
[transition-duration](http://www.w3school.com.cn/cssref/pr_transition-duration.asp)|定义过渡效果花费的时间。默认是 0。|3
[transition-timing-function](http://www.w3school.com.cn/cssref/pr_transition-timing-function.asp)|规定过渡效果的时间曲线。默认是 "ease"。|3
[transition-delay](http://www.w3school.com.cn/cssref/pr_transition-delay.asp)|规定过渡效果何时开始。默认是 0。|3

- 使用示范 1，非简写

```
div
{
transition-property: width;
transition-duration: 1s;
transition-timing-function: linear;
transition-delay: 2s;
/* Firefox 4 */
-moz-transition-property:width;
-moz-transition-duration:1s;
-moz-transition-timing-function:linear;
-moz-transition-delay:2s;
/* Safari 和 Chrome */
-webkit-transition-property:width;
-webkit-transition-duration:1s;
-webkit-transition-timing-function:linear;
-webkit-transition-delay:2s;
/* Opera */
-o-transition-property:width;
-o-transition-duration:1s;
-o-transition-timing-function:linear;
-o-transition-delay:2s;
}
```

- 使用示范 2，简写

```
div
{
transition: width 1s linear 2s;
/* Firefox 4 */
-moz-transition:width 1s linear 2s;
/* Safari and Chrome */
-webkit-transition:width 1s linear 2s;
/* Opera */
-o-transition:width 1s linear 2s;
}
```

## css3 动画

### `@keyframes`规则此规则用于创建动画，在其中规定某项 css 样式，就能创建由当前样式逐渐改为新样式的动画效果。示范：

```
@keyframes myfirst
{
from {background: red;}
to {background: yellow;}
}

@-moz-keyframes myfirst /* Firefox */
{
from {background: red;}
to {background: yellow;}
}

@-webkit-keyframes myfirst /* Safari 和 Chrome */
{
from {background: red;}
to {background: yellow;}
}

@-o-keyframes myfirst /* Opera */
{
from {background: red;}
to {background: yellow;}
}
```

### 动画

- 当在`@keyframes`中创建动画时，需要把它捆绑到某个选择器，否则不会产生动画效果.**测试发现动画结束时，又回到本来的样式了**
- 通过规定至少以下两项动画属性，即可将动画绑定到选择器
  _ 动画的名称
  _ 动画的时长（默认值为 0）


    	```
    	div
    	{
    	animation: myfirst 5s;/* 测试发现动画结束时，又回到本来的样式了 */
    	-moz-animation: myfirst 5s;	/* Firefox */
    	-webkit-animation: myfirst 5s;	/* Safari 和 Chrome */
    	-o-animation: myfirst 5s;	/* Opera */
    	}
    	```

- 百分比来规定变化发生的时间，或者用关键词`from`、`to`，等同于 0%（动画的开始）、100%（动画的结束）。**为了得到最佳的浏览器支持，应该始终定义 0%和 100%的选择器**

      	```
      	@keyframes myfirst /* 当动画为 25% 及 50% 时改变背景色，然后当动画 100% 完成时再次改变：

  \*/
  {
  0% {background: red;}
  25% {background: yellow;}
  50% {background: blue;}
  100% {background: green;}
  }

      	@-moz-keyframes myfirst /* Firefox */
      	{
      	0%   {background: red;}
      	25%  {background: yellow;}
      	50%  {background: blue;}
      	100% {background: green;}
      	}

      	@-webkit-keyframes myfirst /* Safari 和 Chrome */
      	{
      	0%   {background: red;}
      	25%  {background: yellow;}
      	50%  {background: blue;}
      	100% {background: green;}
      	}

      	@-o-keyframes myfirst /* Opera */
      	{
      	0%   {background: red;}
      	25%  {background: yellow;}
      	50%  {background: blue;}
      	100% {background: green;}
      	}
      	```


    ```
    @keyframes myfirst /* 改变背景色和位置：

\*/
{
0% {background: red; left:0px; top:0px;}
25% {background: yellow; left:200px; top:0px;}
50% {background: blue; left:200px; top:200px;}
75% {background: green; left:0px; top:200px;}
100% {background: red; left:0px; top:0px;}
}

    @-moz-keyframes myfirst /* Firefox */
    {
    0%   {background: red; left:0px; top:0px;}
    25%  {background: yellow; left:200px; top:0px;}
    50%  {background: blue; left:200px; top:200px;}
    75%  {background: green; left:0px; top:200px;}
    100% {background: red; left:0px; top:0px;}
    }

    @-webkit-keyframes myfirst /* Safari 和 Chrome */
    {
    0%   {background: red; left:0px; top:0px;}
    25%  {background: yellow; left:200px; top:0px;}
    50%  {background: blue; left:200px; top:200px;}
    75%  {background: green; left:0px; top:200px;}
    100% {background: red; left:0px; top:0px;}
    }

    @-o-keyframes myfirst /* Opera */
    {
    0%   {background: red; left:0px; top:0px;}
    25%  {background: yellow; left:200px; top:0px;}
    50%  {background: blue; left:200px; top:200px;}
    75%  {background: green; left:0px; top:200px;}
    100% {background: red; left:0px; top:0px;}
    }
    ```

### 小结

#### 动画属性属性|描述|CSS

---|---|---
[@keyframes](http://www.w3school.com.cn/cssref/pr_keyframes.asp)|规定动画。|3
[animation](http://www.w3school.com.cn/cssref/pr_animation.asp)|所有动画属性的简写属性，除了 animation-play-state 属性。|3
[animation-name](http://www.w3school.com.cn/cssref/pr_animation-name.asp)|规定 @keyframes 动画的名称。|3
[animation-duration](http://www.w3school.com.cn/cssref/pr_animation-duration.asp)|规定动画完成一个周期所花费的秒或毫秒。默认是 0。|3
[animation-timing-function](http://www.w3school.com.cn/cssref/pr_animation-timing-function.asp)|规定动画的速度曲线。默认是 "ease"。|3
[animation-delay](http://www.w3school.com.cn/cssref/pr_animation-delay.asp)|规定动画何时开始。默认是 0。|3
[animation-iteration-count](http://www.w3school.com.cn/cssref/pr_animation-iteration-count.asp)|规定动画被播放的次数。默认是 1。|3
[animation-direction](http://www.w3school.com.cn/cssref/pr_animation-direction.asp)|规定动画是否在下一周期逆向地播放。默认是 "normal"。|3
[animation-play-state](http://www.w3school.com.cn/cssref/pr_animation-play-state.asp)|规定动画是否正在运行或暂停。默认是 "running"。|3
[animation-fill-mode](http://www.w3school.com.cn/cssref/pr_animation-fill-mode.asp)|规定对象动画时间之外的状态。|3

- 示范 1，非简写

```
div
{
animation-name: myfirst;
animation-duration: 5s;
animation-timing-function: linear;
animation-delay: 2s;
animation-iteration-count: infinite;
animation-direction: alternate;
animation-play-state: running;
/* Firefox: */
-moz-animation-name: myfirst;
-moz-animation-duration: 5s;
-moz-animation-timing-function: linear;
-moz-animation-delay: 2s;
-moz-animation-iteration-count: infinite;
-moz-animation-direction: alternate;
-moz-animation-play-state: running;
/* Safari 和 Chrome: */
-webkit-animation-name: myfirst;
-webkit-animation-duration: 5s;
-webkit-animation-timing-function: linear;
-webkit-animation-delay: 2s;
-webkit-animation-iteration-count: infinite;
-webkit-animation-direction: alternate;
-webkit-animation-play-state: running;
/* Opera: */
-o-animation-name: myfirst;
-o-animation-duration: 5s;
-o-animation-timing-function: linear;
-o-animation-delay: 2s;
-o-animation-iteration-count: infinite;
-o-animation-direction: alternate;
-o-animation-play-state: running;
}
```

- 示范 2，简写

```
div
{
animation: myfirst 5s linear 2s infinite alternate;
/* Firefox: */
-moz-animation: myfirst 5s linear 2s infinite alternate;
/* Safari 和 Chrome: */
-webkit-animation: myfirst 5s linear 2s infinite alternate;
/* Opera: */
-o-animation: myfirst 5s linear 2s infinite alternate;
}
```

## css3 多列创建多个列对文本进行布局

### `column-count`属性规定元素应该被分隔的列数

```
div
{
-moz-column-count:3; 	/* Firefox */
-webkit-column-count:3; /* Safari 和 Chrome */
column-count:3;
}
```

### `column-gap`属性规定列之间的间隔，经测试不支持负数

```
div
{
-moz-column-gap:40px;		/* Firefox */
-webkit-column-gap:40px;	/* Safari 和 Chrome */
column-gap:40px;
}
```

### `column-rule`属性设置**列之间**的宽度、样式和颜色规则

```
div
{
-moz-column-rule:3px outset #ff0000;	/* Firefox */
-webkit-column-rule:3px outset #ff0000;	/* Safari and Chrome */
column-rule:3px outset #ff0000;
}
```

### 小结新的多列属性

| 属性                                                                            | 描述                                               | CSS |
| ------------------------------------------------------------------------------- | -------------------------------------------------- | --- |
| [column-count](http://www.w3school.com.cn/cssref/pr_column-count.asp)           | 规定元素应该被分隔的列数。                         | 3   |
| [column-fill](http://www.w3school.com.cn/cssref/pr_column-fill.asp)             | 规定如何填充列。                                   | 3   |
| [column-gap](http://www.w3school.com.cn/cssref/pr_column-gap.asp)               | 规定列之间的间隔。                                 | 3   |
| [column-rule](http://www.w3school.com.cn/cssref/pr_column-rule.asp)             | 设置所有 column-rule-\* 属性的简写属性。           | 3   |
| [column-rule-color](http://www.w3school.com.cn/cssref/pr_column-rule-color.asp) | 规定列之间规则的颜色。                             | 3   |
| [column-rule-style](http://www.w3school.com.cn/cssref/pr_column-rule-style.asp) | 规定列之间规则的样式。                             | 3   |
| [column-rule-width](http://www.w3school.com.cn/cssref/pr_column-rule-width.asp) | 规定列之间规则的宽度。                             | 3   |
| [column-span](http://www.w3school.com.cn/cssref/pr_column-span.asp)             | 规定元素应该横跨的列数。                           | 3   |
| [column-width](http://www.w3school.com.cn/cssref/pr_column-width.asp)           | 规定列的宽度。                                     | 3   |
| [columns](http://www.w3school.com.cn/cssref/pr_columns.asp)                     | 规定设置 column-width 和 column-count 的简写属性。 | 3   |

## css3 用户界面

### `resize`属性规定是否可由用户调整元素尺寸

```
div
{
resize:both;
overflow:auto;
}
```

### `box-sizing`属性允许以确切的方式定义适应某个区域的具体内容

```css
div /* 规定两个并排的带边框方框： */
 {
  box-sizing: border-box;
  -moz-box-sizing: border-box; /* Firefox */
  -webkit-box-sizing: border-box; /* Safari */
  width: 50%;
  float: left;
}
```

### `outline-offset`属性对轮廓进行偏移，并在超出边框边缘的位置绘制轮廓。轮廓与边框的不同：

- 轮廓不占用空间
- 轮廓可能是非矩形

```
div /* 规定边框边缘之外 15 像素处的轮廓： */
{
border:2px solid black;
outline:2px solid red;
outline-offset:15px;
}
```

### 小结新的用户界面属性

| 属性                                                                      | 描述                                               | CSS |
| ------------------------------------------------------------------------- | -------------------------------------------------- | --- |
| [appearance](http://www.w3school.com.cn/cssref/pr_appearance.asp)         | 允许您将元素设置为标准用户界面元素的外观           | 3   |
| [box-sizing](http://www.w3school.com.cn/cssref/pr_box-sizing.asp)         | 允许您以确切的方式定义适应某个区域的具体内容。     | 3   |
| [icon](http://www.w3school.com.cn/cssref/pr_icon.asp)                     | 为创作者提供使用图标化等价物来设置元素样式的能力。 | 3   |
| [nav-down](http://www.w3school.com.cn/cssref/pr_nav-down.asp)             | 规定在使用 arrow-down 导航键时向何处导航。         | 3   |
| [nav-index](http://www.w3school.com.cn/cssref/pr_nav-index.asp)           | 设置元素的 tab 键控制次序。                        | 3   |
| [nav-left](http://www.w3school.com.cn/cssref/pr_nav-left.asp)             | 规定在使用 arrow-left 导航键时向何处导航。         | 3   |
| [nav-right](http://www.w3school.com.cn/cssref/pr_nav-right.asp)           | 规定在使用 arrow-right 导航键时向何处导航。        | 3   |
| [nav-up](http://www.w3school.com.cn/cssref/pr_nav-up.asp)                 | 规定在使用 arrow-up 导航键时向何处导航。           | 3   |
| [outline-offset](http://www.w3school.com.cn/cssref/pr_outline-offset.asp) | 对轮廓进行偏移，并在超出边框边缘的位置绘制轮廓。   | 3   |
| [resize](http://www.w3school.com.cn/cssref/pr_resize.asp)                 | 规定是否可由用户对元素的尺寸进行调整。             | 3   |
