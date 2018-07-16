---
title: "css学习笔记之bootstrap at mooc"
img: indonesia.jpg # Add image post (optional)
date: 2018-05-19 08:30:00 +0800
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [css]
---

[toc]

[MOOC课程地址](http://www.imooc.com/learn/141)
#  排版
##  强调内容
如果想让一个段落p突出显示，可以通过添加类名`.lead`实现，其作用就是增大文本字号，加粗文本，而且对行高和margin也做相应的处理。

```
.lead {
	margin-bottom: 20px;
	font-size: 16px;
	font-weight: 200;
	line-height: 1.4;
}
@media (min-width: 768px) {/*大中型浏览器字体稍大*/
	.lead {
		font-size: 21px;
	  }
}
```
##   粗体
普通元素中通过font-weight设置为bold关键词给文本加粗，在bootstrap中可以使用`<b>`和`<strong>`标签让文本直接加粗。

	```css
	b,strong {
	  font-weight: bold; /*文本加粗*/
	}
	```

##  斜体
除了可以给元素设置样式font-style值为italic实现之外，在Bootstrap中还可以通过使用标签`<em>`或`<i>`来实现

##   强调相关的类
这些强调类都是通过颜色来表示强调
	•	.text-muted：提示，使用浅灰色（#999）
	•	.text-primary：主要，使用蓝色（#428bca）
	•	.text-success：成功，使用浅绿色(#3c763d)
	•	.text-info：通知信息，使用浅蓝色（#31708f）
	•	.text-warning：警告，使用黄色（#8a6d3b）
	•	.text-danger：危险，使用褐色（#a94442）

##  文本对齐风格
###  原生css
常常使用text-align来实现文本的对齐风格的设置。
  ☑  左对齐，取值left
  ☑  居中对齐，取值center
  ☑  右对齐，取值right
  ☑  两端对齐，取值justify
###  bootstrap
  定义了4个类名来控制文本的对齐风格
    ☑   .text-left：左对齐
  ☑   .text-center：居中对齐
  ☑   .text-right：右对齐
  ☑   .text-justify：两端对齐
 
## 列表--简介
1. 在HTML文档中，列表结构主要有三种：有序列表`ol`、无序列表`ul`和定义列表

	```
	<dl>
	    <dt>…</dt>
	    <dd>…</dd>
	</dl>
	```
2. bootstrap提供了6种形式的列表
	 ☑  普通列表
   ☑  有序列表
   ☑  去点列表
   ☑  内联列表
   ☑  描述列表
   ☑  水平描述列表

###  无序列表、有序列表
使用方式和我们平时使用的一样，在样式方面，Bootstrap只是在此基础上做了一些细微的优化

### 去点列表
通过给无序列表添加一个类名`.list-unstyled`,这样就可以去除默认的列表样式的风格。源码：

```
.list-unstyled {
	padding-left: 0;
	list-style: none;
}
```

### 内联列表
添加类名`.list-inline`来实现内联列表，简单点说就是把**垂直列表换成水平列表，而且去掉项目符号（编号），保持水平显示**。也可以说**内联列表就是为制作水平导航而生**。源码：

	```
	.list-inline {
		padding-left: 0;
		margin-left: -5px;
		list-style: none;
	}
	.list-inline > li {
		display: inline-block;
		padding-right: 5px;
		padding-left: 5px;
	}
	```
### 定义列表
Bootstrap并没有做太多的调整，只是调整了行间距，外边距和字体加粗效果

### 水平定义列表
水平定义列表就像内联列表一样，Bootstrap可以给`<dl>`添加类名`.dl-horizontal`给定义列表实现水平显示效果.*源码请查看bootstrap.css文件第608行~第621行*

	```
	@media (min-width: 768px) {
		.dl-horizontal dt {
			float: left;
			width: 160px;
			overflow: hidden;
			clear: left;
			text-align: right;
			text-overflow: ellipsis;
			white-space: nowrap;
	  	}
		.dl-horizontal dd {
			margin-left: 180px;
	  	}
	}
	```

## 代码
### 一
在Bootstrap主要提供了三种代码风格：
1. 使用`<code></code>`来显示单行内联代码
2. 使用`<pre></pre>`来显示多行块代码
3. 使用`<kbd></kbd>`来显示用户输入代码
### 二
在pre标签上添加类名“.pre-scrollable”，就可以控制代码块区域最大高度为340px，一旦超出这个高度，就会在**Y轴出现滚动条**。*源码请查看bootstrap.css第731行~第734行*

```
.pre-scrollable {
	max-height: 340px;
	overflow-y: scroll;
}

```

## 表格
Bootstrap为表格提供了**1种基础样式**和**4种附加样式**以及**1个支持响应式的表格**。在使用Bootstrap的表格过程中，只需要添加对应的类名就可以得到不同的表格风格。
☑  .table：基础表格
  ☑  .table-striped：斑马线表格
  ☑  .table-bordered：带边框的表格
  ☑  .table-hover：鼠标悬停高亮的表格
  ☑  .table-condensed：紧凑型表格
  ☑  .table-responsive：响应式表格
### 表格行的类
Bootstrap还为表格的行元素<tr>提供了五种不同的类名，每种类名控制了行的不同背景颜色。
![图片](http://img.mukewang.com/53ad213f0001b08807340508.jpg)
只需要在`<tr>`元素中添加上表对应的类名，就能达到你自己需要的效果.
**特别提示**：除了”.active”之外，其他四个类名和”.table-hover”配合使用时，Bootstrap针对这几种样式也做了相应的悬浮状态的样式设置，所以如果需要给tr元素添加其他颜色样式时，在”.table-hover”表格中也要做相应的调整。

### 基础表格
在Bootstrap中，对于基础表格是通过类名“.table”来控制

```
<table class="table">
…
</table>
```
基础表格样式如下：
![图片](http://img.mukewang.com/53c617ea0001a48108560141.jpg)

### 斑马线表格
在Bootstrap中实现这种表格效果并不困难，只需要在`<table class="table">`的基础上增加类名“.table-striped”即可：

```
<table class="table table-striped">
…
</table>
```
其效果与基础表格相比，仅是在tbody**隔行有一个浅灰色的背景色**。
源码请查看bootstrap.css文件第1465行~第1468行：

```
.table-striped > tbody > tr:nth-child(odd) > td,
.table-striped > tbody > tr:nth-child(odd) > th {
	background-color: #f9f9f9;
}
```
### 带边框的表格
Bootstrap中带边框的表格使用方法和斑马线表格的使用方法类似，只需要在基础表格`<table class="table">`基础上添加一个“.table-bordered”类名即可.表格样式：
![图片](http://img.mukewang.com/53c6218300019ab105870211.jpg)
其源码可以查看bootstrap.css文件第1450行~第1464行

```
.table-bordered {
  border: 1px solid #ddd;/*整个表格设置边框*/
}
.table-bordered > thead > tr > th,
.table-bordered > tbody > tr > th,
.table-bordered > tfoot > tr > th,
.table-bordered > thead > tr > td,
.table-bordered > tbody > tr > td,
.table-bordered > tfoot > tr > td {
  border: 1px solid #ddd; /*每个单元格设置边框*/
}
.table-bordered > thead > tr > th,
.table-bordered > thead > tr > td {
  border-bottom-width: 2px;/*表头底部边框*/
}
```
### 鼠标悬浮高亮的表格
鼠标悬停高亮的表格使用也简单，仅需要<table class="table">元素上添加类名“table-hover”即可。
![鼠标悬浮高亮的表格](http://img.mukewang.com/53c6224a0001ec1608570206.jpg)
鼠标悬浮高亮的效果主要是通过“hover”事件来实现，设置了“tr:hover”时的th、td的背景色为新颜色。
其源码请查看bootstrap.css文件中第1469行~第1472行：

```
.table-hover > tbody > tr:hover > td,
.table-hover > tbody > tr:hover > th {
	background-color: #f5f5f5;
}
```
**注**：其实，鼠标悬浮高亮表格，可以和Bootstrap其他表格混合使用。简单点说，只要你想让你的表格具备悬浮高亮效果，你只要给这个表格添加“table-hover”类名就好了。

```
<table class="table table-striped table-bordered table-hover">
…
</table>
```
### 紧凑型表格
紧凑型表格，简单理解，就是单元格没内距或者内距较其他表格的内距更小.
紧凑型表格的运用，也只是需要在`<table class="table">`基础上添加类名“table-condensed”
![紧凑型表格](http://img.mukewang.com/53c62647000158e708620159.jpg)
Bootstrap中紧凑型的表格与基础表格差别不大，因为只是将单元格的内距由**8px调至5px**,源码请查看bootstrap.css文件第1442行~第1449行：

```
.table-condensed > thead > tr > th,
.table-condensed > tbody > tr > th,
.table-condensed > tfoot > tr > th,
.table-condensed > thead > tr > td,
.table-condensed > tbody > tr > td,
.table-condensed > tfoot > tr > td {
	padding: 5px;
}
```
**在使用Bootstrap表格时，千万注意，你的`<table>`元素中一定不能缺少类名“table”**

### 响应式表格
1. Bootstrap提供了一个容器，并且此容器设置类名“.table-responsive”,此容器就具有响应式效果，然后将`<table class="table">`置于这个容器当中，这样表格也就具有响应式效果。
2. Bootstrap中响应式表格效果表现为：**当你的浏览器可视区域小于768px时，表格底部会出现水平滚动条。当你的浏览器可视区域大于768px时，表格底部水平滚动条就会消失**。

```
<div class="table-responsive">
	<table class="table table-bordered">
	   …
	</table>
</div>
```

# 表单
## 基础表单
在Bootstrap框架中，通过定制了一个类名`form-control`，如果input、select、textarea使用了类名“form-control”，将会实现一些设计上的定制效果。
1. 宽度变成了100%
2. 设置了一个浅灰色（#ccc）的边框
3. 具有4px的圆角
4. 设置阴影效果，并且元素得到焦点之时，阴影和边框效果会有所变化
5. 设置了placeholder的颜色为#999

详细请查阅bootstrap.css文件第1690行~第1732行。

## 水平表单
1. Bootstrap框架默认的表单是垂直显示风格，但很多时候我们需要的水平表单风格（标签居左，表单控件居右）
![水平表单](http://img.mukewang.com/53d07cb5000111c403540091.jpg)

2. 在Bootstrap框架中要实现水平表单效果，必须满足以下两个条件：
	1. 在`<form>`元素上使用类名“form-horizontal”。
	2. 配合Bootstrap框架的网格系统。（网格布局会在以后的章节中详细讲解）

3. 在`<form>`元素上使用类名“form-horizontal”主要有以下几个作用：
	1. 设置表单控件padding和margin值。
	2. 改变“form-group”的表现形式，类似于网格系统的“row”。


```css
.form-horizontal .control-label,
.form-horizontal .radio,
.form-horizontal .checkbox,
.form-horizontal .radio-inline,
.form-horizontal .checkbox-inline {
	padding-top: 7px;
	margin-top: 0;
	margin-bottom: 0;
}
.form-horizontal .radio,
.form-horizontal .checkbox {
	min-height: 27px;
}
.form-horizontal .form-group {
	margin-right: -15px;
	margin-left: -15px;
}
.form-horizontal .form-control-static {
	padding-top: 7px;
}
@media (min-width: 768px) {
	.form-horizontal .control-label {
		text-align: right;
	  }
}
.form-horizontal .has-feedback .form-control-feedback {
	top: 0;
	right: 15px;
}
```

## 内联表单
将表单的控件都在一行内显示
![内联表单](http://img.mukewang.com/53b2532a000107b003190032.jpg)
在Bootstrap框架中实现这样的表单效果只需要在`<form>`元素中添加类名“form-inline”即可。
内联表单实现原理非常简单，欲将表单控件在一行显示，就需要将表单控件设置成内联块元素`display:inline-block`。

## 表单控件
### 输入框
为了让控件在各种表单风格中样式不出错，需要添加类名“form-control”，如：

```
<form role="form">
<div class="form-group">
<input type="email" class="form-control" placeholder="Enter email">
</div>
</form>
```
### 下拉选择框
Bootstrap框架中的下拉选择框使用和原始的一致，多行选择设置multiple属性的值为multiple。
### 文本域textarea
如果textarea元素中添加了类名“form-control”类名，则无需设置cols属性。因为Bootstrap框架中的“form-control”样式的表单控件宽度为100%或auto
### 复选框checkbox和单选择按钮radio
Bootstrap框架中checkbox和radio有点特殊，Bootstrap针对他们做了一些特殊化处理，主要是checkbox和radio与label标签配合使用会出现一些小问题（最头痛的是对齐问题）。使用Bootstrap框架，开发人员无需考虑太多，只需要按照下面的方法使用即可

```html
<form role="form">
	<div class="checkbox">
		<label>
		<input type="checkbox" value="">
		记住密码
		</label>
	</div>
<div class="radio">
	<label>
		<input type="radio" name="optionsRadios" id="optionsRadios1" value="love" checked>
		喜欢
	</label>
</div>
<div class="radio">
	<label>
	<input type="radio" name="optionsRadios" id="optionsRadios2" value="hate">
	不喜欢
</label>
</div>
</form>
```

1. 不管是checkbox还是radio都使用label包起来了
2. checkbox连同label标签放置在一个名为“.checkbox”的容器内
3. radio连同label标签放置在一个名为“.radio”的容器内

在Bootstrap框架中，主要借助“.checkbox”和“.radio”样式，来处理复选框、单选按钮与标签的对齐方式。
```css
.radio,
.checkbox {
	display: block;
	min-height: 20px;
	padding-left: 20px;
	margin-top: 10px;
	margin-bottom: 10px;
}
.radio label,
.checkbox label {
	display: inline;
	font-weight: normal;
	cursor: pointer;
}
.radio input[type="radio"],
.radio-inline input[type="radio"],
.checkbox input[type="checkbox"],
.checkbox-inline input[type="checkbox"] {
	float: left;
	margin-left: -20px;
}
.radio + .radio,
.checkbox + .checkbox {
	margin-top: -5px;
}
```
### 复选框和单选按钮水平排列
为了布局的需要，将复选框和单选按钮需要水平排列。Bootstrap框架也做了这方面的考虑：

1. 如果checkbox需要水平排列，只需要在label标签上添加类名“checkbox-inline”
2. 如果radio需要水平排列，只需要在label标签上添加类名“radio-inline”


```html
<form role="form">
  <div class="form-group">
    <label class="checkbox-inline">
      <input type="checkbox"  value="option1">游戏
    </label>
    <label class="checkbox-inline">
      <input type="checkbox"  value="option2">摄影
    </label>
    <label class="checkbox-inline">
    <input type="checkbox"  value="option3">旅游
    </label>
  </div>
  <div class="form-group">
    <label class="radio-inline">
      <input type="radio"  value="option1" name="sex">男性
    </label>
    <label class="radio-inline">
      <input type="radio"  value="option2" name="sex">女性
    </label>
    <label class="radio-inline">
      <input type="radio"  value="option3" name="sex">中性
    </label>
  </div>
</form>
```

源码：

```css
.radio-inline,
.checkbox-inline {
	display: inline-block;
	padding-left: 20px;
	margin-bottom: 0;
	font-weight: normal;
	vertical-align: middle;
	cursor: pointer;
}
.radio-inline + .radio-inline,
.checkbox-inline + .checkbox-inline {
	margin-top: 0;
	margin-left: 10px;
}
```
### 按钮
制作按钮通常使用下面代码来实现：
 ☑  input[type=“submit”]
  ☑  input[type=“button”]
  ☑  input[type=“reset”]
  ☑  `<button>`
在Bootstrap框架中的按钮都是采用`<button>`来实现。

### 表单控件大小
1. 可以通过设置控件的height，line-height，padding和font-size等属性来实现控件的**高度设置**。
2. 不过Bootstrap框架还提供了两个不同的类名，用来**控制表单控件的高度**,适用于表单中的input，textarea和select控件
	1. input-sm:让控件比正常大小更小
	2. input-lg:让控件比正常大小更大
	3. 源码

	```css
	.input-sm {
		height: 30px;
		padding: 5px 10px;
		font-size: 12px;
		line-height: 1.5;
		border-radius: 3px;
	}
	select.input-sm {
		height: 30px;
		line-height: 30px;
	}
	textarea.input-sm,
	select[multiple].input-sm {
		height: auto;
	}
	.input-lg {
		height: 46px;
		padding: 10px 16px;
		font-size: 18px;
		line-height: 1.33;
		border-radius: 6px;
	}
	select.input-lg {
		height: 46px;
		line-height: 46px;
	}
	textarea.input-lg,
	select[multiple].input-lg {
		height: auto;
	}
	```

3. 需要**控件宽度**也要做一定的变化处理。这个时候就要借住Bootstrap框架的网格系统

### 表单控件状态
#### 焦点状态
1. 焦点状态是通过伪类“:focus”来实现。Bootstrap框架中表单控件的焦点状态删除了outline的默认样式，重新添加阴影效果.源码：

	```css
	.form-control:focus {
		border-color: #66afe9;
		outline: 0;
		  -webkit-box-shadow: inset 0 1px 1pxrgba(0,0,0,.075), 0 0 8px rgba(102, 175, 233, .6);
		box-shadow: inset 0 1px 1pxrgba(0,0,0,.075), 0 0 8px rgba(102, 175, 233, .6);
	}
	```

	要让控件在焦点状态下有上面样式效果，需要给控件添加类名“form-control"

2. 在Bootstrap框架中，file、radio和checkbox控件在焦点状态下的效果也与普通的input控件不太一样.

```css
input[type="file"]:focus,
input[type="radio"]:focus,
input[type="checkbox"]:focus {
	outline: thin dotted;
	outline: 5px auto -webkit-focus-ring-color;
	outline-offset: -2px;
}
```
#### 禁用状态
1. 在相应的表单控件上添加属性“disabled”。和其他表单的禁用状态不同的是，Bootstrap框架做了一些样式风格的处理.源码：

	```css
	.form-control[disabled],
	.form-control[readonly],
	fieldset[disabled] .form-control {
		cursor: not-allowed;
		background-color: #eee;
		opacity: 1;
	}
	```

2. 如果控件中不使用类名“form-control”，禁用的控件只会有一个不准输入的手型出来。源码

	```css
	input[type="radio"][disabled],
	input[type="checkbox"][disabled],
	.radio[disabled],
	.radio-inline[disabled],
	.checkbox[disabled],
	.checkbox-inline[disabled],
	fieldset[disabled] input[type="radio"],
	fieldset[disabled] input[type="checkbox"],
	fieldset[disabled] .radio,
	fieldset[disabled] .radio-inline,
	fieldset[disabled] .checkbox,
	fieldset[disabled] .checkbox-inline {
		cursor: not-allowed;
	}
	```
3. 在Bootstrap框架中，如果fieldset设置了disabled属性，整个域都将处于被禁用状态
4. 据说对于整个禁用的域中，如果legend中有输入框的话，这个输入框是无法被禁用的

```html
<form role="form">
<fieldset disabled>
<legend><input type="text" class="form-control" placeholder="显然我颜色变灰了，但是我没被禁用，不信？单击试一下" /></legend>
    …
</fieldset>
</form>
```
#### 验证状态
1. 在Bootstrap框架中同样提供这几种效果。
	1. `.has-warning`:警告状态（黄色）
	2. `.has-error`：错误状态（红色）
	3. `.has-success`：成功状态（绿色）
	4. 使用的时候只需要在form-group容器上对应添加状态类名。
2. 很多时候，在表单验证的时候，不同的状态会提供不同的 icon，比如成功是一个对号（√），错误是一个叉号（×）等。在Bootstrap框中也提供了这样的效果。如果你想让表单在对应的状态下显示 icon 出来，只需要在对应的状态下添加类名`has-feedback`.**此类名要与“has-error”、“has-warning”和“has-success”在一起**
	1. 效果

		![](http://img.mukewang.com/53b27e8600013fdf02910117.jpg)
	2. 在 Bootstrap 的小图标都是使用@font-face来制作，而且必须在表单中添加了一个 span 元素。

```html
		<div class="form-group has-success has-feedback">
    <label class="control-label" for="inputSuccess1">成功状态</label>
    <input type="text" class="form-control" id="inputSuccess1" placeholder="成功状态" >
    <span class="glyphicon glyphicon-ok form-control-feedback"></span>
  </div>
```

## 表单提示信息
1. 在Bootstrap框架中也提供了这样的效果。使用了一个`help-block`样式，将提示信息以**块状显示在控件底部**。

	```html
	<form role="form">
	<div class="form-group has-success has-feedback">
	  <label class="control-label" for="inputSuccess1">成功状态</label>
	  <input type="text" class="form-control" id="inputSuccess1" placeholder="成功状态" >
	  <span class="help-block">你输入的信息是正确的</span>
	  <span class="glyphiconglyphicon-ok form-control-feedback"></span>
	</div>
	  …
	</form>
	```
	源码：

	```css
	.help-block {
		display: block;
		margin-top: 5px;
		margin-bottom: 10px;
		color: #737373;
	}
	```

2. 让提示信息显示在控件的后面，也就是同一水平显示,可以添加这段代码：

	```css
	.help-inline{
	  display:inline-block;
	  padding-left:5px;
	  color: #737373;
	}
	```

3. 如果你不想为bootstrap.css增加自己的代码，而且设计又有这种样的需求，那么只能借助于Bootstrap的网格系统。例如

```html
<form role="form">
<div class="form-group">
	<label class="control-label" for="inputSuccess1">成功状态</label>
	<div class="row">
		<div class="col-xs-6">
			<input type="text" class="form-control" id="inputSuccess1" placeholder="成功状态" >
		</div>
		<span class="col-xs-6 help-block">你输入的信息是正确的</span>
	</div>
</div>
</form>
```

## 按钮
### 基本按钮
Bootstrap框架中的考虑了不同浏览器的解析差异，进行了比较安全的兼容性处理，使按钮效果在不同的浏览器中所呈现的效果基本相同。源码：

```css
.btn {
	display: inline-block;
	padding: 6px 12px;
	margin-bottom: 0;
	font-size: 14px;
	font-weight: normal;
	line-height: 1.42857143;
	text-align: center;
	white-space: nowrap;
	vertical-align: middle;
	cursor: pointer;
	  -webkit-user-select: none;
	     -moz-user-select: none;
	      -ms-user-select: none;
	user-select: none;
	background-image: none;
	border: 1px solid transparent;
	border-radius: 4px;
}
```
示范：

```html
<button class="btn" type="button">我是一个基本按钮</button>
```
### 默认按钮
通过“.btn-default”定义了一个默认的按钮风格。**默认按钮的风格就是在基础按钮的风格的基础上修改了按钮的背景颜色、边框颜色和文本颜色**。源码：

```css
.btn-default {
	color: #333;
	background-color: #fff;
	border-color: #ccc;
}
```
示范
```html
<button class="btn btn-default" type="button">默认按钮</button>
```

### 多标签支持
一般制作按钮除了使用`<button>`标签元素之外，还可以使用`<input type="submit">`和`<a>`标签等。同样，在Bootstrap框架中制作按钮时，除了刚才所说的这些标签元素之外，还可以使用在其他的标签元素上，唯一需要注意的是，**要在制作按钮的标签元素上添加类名“btn”。如果不添加是不会有任何按钮效果**

```html
<button class="btn btn-default" type="button">button标签按钮</button>
<input type="submit" class="btn btn-default" value="input标签按钮"/>
<a href="##" class="btn btn-default">a标签按钮</a>
<span class="btn btn-default">span标签按钮</span>
<div class="btn btn-default">div标签按钮</div>
```
### 定制风格
在Bootstrap框架中不同的按钮风格都是通过不同的类名来实现,每种风格的其实都一样，不同之处就是按钮的背景颜色、边框颜色和文本颜色.只需要在基础按钮“.btn”基础上追加对应的类名，就可以得到需要的按钮风格。
![1](http://img.mukewang.com/53b367bd0001d59c07530312.jpg)
![2](http://img.mukewang.com/53b367d10001846a08020810.jpg)

### 按钮大小
类似于input一样，通过在基础按钮“.btn”的基础上追加类名来控制按钮的大小。
![1](http://img.mukewang.com/53b36a7600014af106910605.jpg)
在Bootstrap框架中控制按钮的大小都是通过修改按钮的padding、line-height、font-size和border-radius几个属性。源码：

```css
.btn-lg,
.btn-group-lg> .btn {
	padding: 10px 16px;
	font-size: 18px;
	line-height: 1.33;
	border-radius: 6px;
}
.btn-sm,
.btn-group-sm> .btn {
	padding: 5px 10px;
	font-size: 12px;
	line-height: 1.5;
	border-radius: 3px;
}
.btn-xs,
.btn-group-xs> .btn {
	padding: 1px 5px;
	font-size: 12px;
	line-height: 1.5;
	border-radius: 3px;
}
```
这几个类名可以配合按钮中其他颜色类名一起使用，但唯一一点不能缺少“.btn”类名。(如果是button标签，那么也不要少了`type="button"`)

### 块状按钮
Bootstrap框架中提供了一个类名“btn-block”。按钮使用这个类名就可以**让按钮充满整个容器，并且这个按钮不会有任何的padding和margin值**。在实际当中，常把这种按钮称为**块状按钮**。源码：

```css
.btn-block {
	display: block;
	width: 100%;
	padding-right: 0;
	padding-left: 0;
}
.btn-block + .btn-block {
	margin-top: 5px;
}
input[type="submit"].btn-block,
input[type="reset"].btn-block,
input[type="button"].btn-block {
	width: 100%;
}
```
使用方法和前面的类似，只需要在原按钮类名上添加“.btn-block”类名，当然“.btn”类名是不可或缺的.

### 按钮状态
在Bootstrap框架中针对按钮的状态效果主要分为两种：**活动状态**和**禁用状态**。
#### 活动状态
主要包括按钮的**悬浮状态(:hover)**，**点击状态(:active)**和**焦点状态（:focus）**几种


```css
.btn:focus,
.btn:active:focus,
.btn.active:focus {
	outline: thin dotted;
	outline: 5px auto -webkit-focus-ring-color;
	outline-offset: -2px;
}
.btn:hover,
.btn:focus {
	color: #333;
	text-decoration: none;
}
.btn:active,
.btn.active {
	background-image: none;
	outline: 0;
	  -webkit-box-shadow: inset 0 3px 5px rgba(0, 0, 0, .125);
	box-shadow: inset 0 3px 5px rgba(0, 0, 0, .125);
}
```
不同风格下的按钮都具有这几种状态效果，只是颜色做了一定的调整，以默认风格（btn-default）为例：

```css
.btn-default:hover,
.btn-default:focus,
.btn-default:active,
.btn-default.active,
.open .dropdown-toggle.btn-default {
	color: #333;
	background-color: #ebebeb;
	border-color: #adadad;
}
.btn-default:active,
.btn-default.active,
.open .dropdown-toggle.btn-default {
	background-image: none;
}
```
当按钮处理正在点击状态（也就是鼠标按下的未松开的状态），对于`<button>`元素是通过“:active”伪类实现，而对于`<a>`这样的标签元素则是通过添加类名“.active”来实现。

#### 禁用状态
1. 禁用状态与其他状态按钮相比，就是背景颜色的透明度做了一定的处理，opcity的值从100%调整为65%.
2. 在Bootstrap框架中，要禁用按钮有两种实现方式：
	1. 在标签中添加disabled属性
	2. 在元素标签中添加类名“disabled”
	3. 二者的主要区别：
	“.disabled”样式不会禁止按钮的默认行为，比如说提交和重置行为等。如果想要让这样的禁用按钮也能禁止按钮的默认行为，则需要通过JavaScript这样的语言来处理。对于`<a>`标签也存在类似问题，如果通过类名“.disable”来禁用按钮，其链接行为是无法禁止。而**在元素标签中添加“disabled”属性的方法是可以禁止元素的默认行为的**。

3. 示范

	```html
	<button class="btnbtn-primary btn-lgbtn-block" type="button" disabled="disabled">通过disabled属性禁用按钮</button>
	<button class="btnbtn-primary btn-block disabled" type="button">通过添加类名disabled禁用按钮</button>
	<button class="btnbtn-primary btn-smbtn-block" type="button">未禁用的按钮</button>
	```
	css源码：

	```css
	.btn.disabled,
	.btn[disabled],
	fieldset[disabled] .btn {
		pointer-events: none;
		cursor: not-allowed;
		filter: alpha(opacity=65);
		  -webkit-box-shadow: none;
		box-shadow: none;
		opacity: .65;
	}
	```
4. 其他风格按钮也具有这样的效果，只是颜色做了一定的调整，比如信息按钮(.btn-info）

```css
.btn-info.disabled,
.btn-info[disabled],
fieldset[disabled] .btn-info,
.btn-info.disabled:hover,
.btn-info[disabled]:hover,
fieldset[disabled] .btn-info:hover,
.btn-info.disabled:focus,
.btn-info[disabled]:focus,
fieldset[disabled] .btn-info:focus,
.btn-info.disabled:active,
.btn-info[disabled]:active,
fieldset[disabled] .btn-info:active,
.btn-info.disabled.active,
.btn-info[disabled].active,
fieldset[disabled] .btn-info.active {
	background-color: #5bc0de;
	border-color: #46b8da;
}
```

## 图像
### 风格
在Bootstrap框架中对于图像的样式风格提供以下几种风格:

1. img-responsive：响应式图片，主要针对于响应式设计
2. img-rounded：圆角图片
3. img-circle：圆形图片
4. img-thumbnail：缩略图片

只用在`<img>`标签上加上对应类名即可，eg:

```html
<img  alt="140x140" src="http://placehold.it/140x140">
<img  class="img-rounded" alt="140x140" src="http://placehold.it/140x140">
<img  class="img-circle" alt="140x140" src="http://placehold.it/140x140">
<img  class="img-thumbnail" alt="140x140" src="http://placehold.it/140x140">
<img  class="img-responsive" alt="140x140" src="http://placehold.it/140x140">
```
源码：

```css
img {
	vertical-align: middle;
}
.img-responsive,
.thumbnail>img,
.thumbnail a >img,
.carousel-inner > .item >img,
.carousel-inner > .item > a >img {
	display: block;
	max-width: 100%;
	height: auto;
}
.img-rounded {
	border-radius: 6px;
}
.img-thumbnail {
	display: inline-block;
	max-width: 100%;
	height: auto;
	padding: 4px;
	line-height: 1.42857143;
	background-color: #fff;
	border: 1px solid #ddd;
	border-radius: 4px;
	  -webkit-transition: all .2s ease-in-out;
	transition: all .2s ease-in-out;
}
.img-circle {
	border-radius: 50%;
}
```
### 图片大小
需要通过其他的方式来处理图片大小。比如说控制图片容器大小。（注意不可以通过css样式直接修改img图片的大小，这样操作就不响应了）

## 图标
### 一
1. Bootstrap框架中图标都是使用CSS3的@font-face属性配合字体来实现的icon效果。源码：

	```css
	@font-face {
		font-family: 'Glyphicons Halflings';
		src: url('../fonts/glyphicons-halflings-regular.eot');
		src: url('../fonts/glyphicons-halflings-regular.eot?#iefix') format('embedded-opentype'), url('../fonts/glyphicons-halflings-regular.woff') format('woff'), url('../fonts/glyphicons-halflings-regular.ttf') format('truetype'), url('../fonts/glyphicons-halflings-regular.svg#glyphicons_halflingsregular') format('svg');
	}
	```
2. 在Bootstrap框架中有一个fonts的目录，这个目录中提供的字体文件就是用于制作icon的字体文件。

3. 自定义完字体之后，需要对icon设置一个默认样式，在Bootstrap框架中是通过给元素添加“glyphicon”类名来实现，然后通过伪元素“:before”的“content”属性调取对应的icon编码

	```css
	.glyphicon {
		position: relative;
		top: 1px;
		display: inline-block;
		font-family: 'Glyphicons Halflings';
		font-style: normal;
		font-weight: normal;
		line-height: 1;
		  -webkit-font-smoothing: antialiased;
		  -moz-osx-font-smoothing: grayscale;
	}
	.glyphicon-asterisk:before {
		content: "\2a";
	}
	```

### 二
在网页中使用图标也非常的简单，在任何**内联元素**上应用所对应的样式即可

```html
<span class="glyphicon glyphicon-search"></span>
<span class="glyphicon glyphicon-asterisk"></span>
<span class="glyphicon glyphicon-plus"></span>
<span class="glyphicon glyphicon-cloud"></span>
```
[所有bootstrap图标](http://getbootstrap.com/components/#glyphicons)

除了使用glyphicon.com提供的图标之外，还可以使用第三方为Bootstrap框架设计的图标字体，如[Font Awesome](http://www.bootcss.com/p/font-awesome/)

# 网格系统
## 实现原理
通过定义容器大小，平分12份(也有平分成24份或32份，但12份是最常见的)，再调整内外边距，最后结合媒体查询，就制作出了强大的响应式网格系统。Bootstrap框架中的网格系统就是将容器平分成**12份**。
## 工作原理
1. 原理
	1. 数据行(.row)必须包含在容器（.container）中，以便为其赋予合适的对齐方式和内距(padding)。如：

		```html
		<div class="container">
			<div class="row"></div>
		</div>
		```
	2. 在行(.row)中可以添加列(.column)，但列数之和不能超过平分的总列数，比如12.

		```html
		<div class="row">
		  <div class="col-md-4"></div>
		  <div class="col-md-8"></div>
		</div>
		```
	3. 具体内容应当放置在列容器（column）之内，而且只有列（column）才可以作为行容器(.row)的直接子元素
	4. 通过设置内距（padding）从而创建列与列之间的间距。然后通过为第一列和最后一列设置负值的外距（margin）来抵消内距(padding)的影响

2. 示范图
![](http://img.mukewang.com/53b0f9c000018b9305540282.jpg)

	1. 最外边框，带有一大片白色区域，就是相当于浏览器的可视区域。在Bootstrap框架的网格系统中带有响应式效果，其带有四种类型的浏览器（超小屏，小屏，中屏和大屏），其断点（像素的分界点）是768px、992px和1220px。
	2. 第二个边框(1)相当于容器(.container)。针对不同的浏览器分辨率，其宽度也不一样：自动、750px、970px和1170px。

		```css
		.container {
			  padding-right: 15px;
			  padding-left: 15px;
			  margin-right: auto;
			  margin-left: auto;
		  	@media (min-width: 768px) {
			  .container {
			    width: 750px;
			  }
		  }
		  @media (min-width: 992px) {
			  .container {
			    width: 970px;
			  }
		  }
		  @media (min-width: 1200px) {
			  .container {
			    width: 1170px;
			  }
		  }
	  }
		```
	3. ２号横条阐述的是，将容器的行（.row）平分了12等份，也就是列。每个列都有一个“padding-left:15px”(图中粉红色部分)和一个“padding-right:15px”(图中紫色部分)。这样也导致了第一个列的padding-left和最后一列的padding-right占据了总宽度的30px，从而致使页面不美观

		```css
			.col-xs-1, .col-sm-1, .col-md-1, .col-lg-1, .col-xs-2, .col-sm-2, .col-md-2, .col-lg-2, .col-xs-3, .col-sm-3, .col-md-3, .col-lg-3, .col-xs-4, .col-sm-4, .col-md-4, .col-lg-4, .col-xs-5, .col-sm-5, .col-md-5, .col-lg-5, .col-xs-6, .col-sm-6, .col-md-6, .col-lg-6, .col-xs-7, .col-sm-7, .col-md-7, .col-lg-7, .col-xs-8, .col-sm-8, .col-md-8, .col-lg-8, .col-xs-9, .col-sm-9, .col-md-9, .col-lg-9, .col-xs-10, .col-sm-10, .col-md-10, .col-lg-10, .col-xs-11, .col-sm-11, .col-md-11, .col-lg-11, .col-xs-12, .col-sm-12, .col-md-12, .col-lg-12 {
					  position: relative;
					  min-height: 1px;
					  padding-right: 15px;
					  padding-left: 15px;
				  }
		```

	4. ３号横条就是行容器(.row),其定义了“margin-left”和”margin-right”值为”-15px”，用来抵消第一个列的左内距和最后一列的右内距。

		```css
		.row {
		  margin-right: -15px;
		  margin-left: -15px;
		}
		```
	5. 将行与列给合在一起就能看到横条4的效果。也就是我们期望看到的效果，第一列和最后一列与容器（.container）之间没有间距
	6. 横条５只是想向大家展示，你可以根据需要，任意组合列与列，只是他们的组合数之和不要超过总列数
## 基本用法
Bootstrap框架的网格系统中有**四种基本的用法**。由于Bootstrap框架在不同屏幕尺寸使用了不同的网格样式.屏幕尺寸：
![1](http://img.mukewang.com/53e483500001c7f408770494.jpg)
### 列组合
列组合简单理解就是**更改数字来合并列**（原则：列总和数不能超12），有点类似于表格的colspan属性。

```html
<div class="container">
  <div class="row">
    <div class="col-md-4">.col-md-4</div>
    <div class="col-md-8">.col-md-8</div>
  </div>
  <div class="row">
    <div class="col-md-4">.col-md-4</div>
    <div class="col-md-4">.col-md-4</div>
    <div class="col-md-4">.col-md-4</div>
  </div>
  <div class="row">
    <div class="col-md-3">.col-md-3</div>
    <div class="col-md-6">.col-md-6</div>
    <div class="col-md-3">.col-md-3</div>
 </div>
</div>
```
实现列组合方式非常简单，只涉及两个CSS两个特性：**浮动与宽度百分比**

```css
/*确保所有列左浮动*/
.col-md-1, .col-md-2, .col-md-3, .col-md-4, .col-md-5, .col-md-6, .col-md-7, .col-md-8, .col-md-9, .col-md-10, .col-md-11, .col-md-12 {
    float: left;
 }
```

```css
/*定义每个列组合的宽度（使用的百分比）*/
  .col-md-12 {
    width: 100%;
  }
  .col-md-11 {
    width: 91.66666667%;
  }
    /* ... */
  .col-md-1 {
    width: 8.33333333%;
  }
```
### 列偏移
只需要在列元素上添加类名“col-md-offset-*”(其中星号代表要偏移的列组合数)，那么具有这个类名的列就会向右偏移。例如，你在列元素上添加“col-md-offset-4”，表示该列向右移动4个列的宽度

```html
<div class="container">
	<div class="row">
		<div class="col-md-4">.col-md-4</div>
		<div class="col-md-2 col-md-offset-4">列向右移动四列的间距</div>
		<div class="col-md-2">.col-md-3</div>
	</div>
	<div class="row">
		<div class="col-md-4">.col-md-4</div>
		<div class="col-md-4 col-md-offset-4">列向右移动四列的间距</div>
	</div>
</div>
```
实现原理非常简单，就是利用十二分之一（1/12）的margin-left。然后有多少个offset，就有多少个margin-left.源码：

```css
 .col-md-offset-12 {
   margin-left: 100%;
}
  .col-md-offset-11 {
    margin-left: 91.66666667%;
  }
    /* ... */
    .col-md-offset-0 {
    margin-left: 0;
  }
```

**注意**：使用”col-md-offset-*”对列进行向右偏移时，要保证列与偏移列的总数不超过12，不然会致列断行显示。

### 列排序
列排序其实就是改变列的方向，就是改变左右浮动，并且设置浮动的距离。在Bootstrap框架的网格系统中是通过添加类名`col-md-push-*`和`col-md-pull-*`.Bootstrap仅通过设置left和right来实现定位效果。

```css
.col-md-pull-12 {
    right: 100%;
  }
  .col-md-pull-11 {
    right: 91.66666667%;
  }
  /* ... */
  .col-md-pull-0 {
    right: 0;
  }

  .col-md-push-12 {
    left: 100%;
  }
  .col-md-push-11 {
    left: 91.66666667%;
  }
    /* ... */
  .col-md-push-0 {
    left: 0;
  }
```
### 列的嵌套
可以在一个列中添加一个或者多个行（row）容器，然后在这个行容器中插入列（像前面介绍的一样使用列）。但在列容器中的行容器（row），宽度为100%时，就是当前外部列的宽度.例如：

```html
<div class="container">
    <div class="row">
        <div class="col-md-8">
        我的里面嵌套了一个网格
            <div class="row">
            <div class="col-md-6">col-md-6</div>
            <div class="col-md-6">col-md-6</div>
          </div>
        </div>
    <div class="col-md-4">col-md-4</div>
    </div>
    <div class="row">
        <div class="col-md-4">.col-md-4</div>
    <div class="col-md-8">
    我的里面嵌套了一个网格
        <div class="row">
          <div class="col-md-4">col-md-4</div>
          <div class="col-md-4">col-md-4</div>
          <div class="col-md-4">col-md-4</div>
        </div>
    </div>
    </div>
</div>
```
效果如下：
![1](http://img.mukewang.com/53b10c9e0001e28b05540070.jpg)
注意：**嵌套的列总数也需要遵循不超过12列**。不然会造成末位列换行显示

# 菜单、按钮和导航
## 下拉菜单
### 基本用法
在使用Bootstrap框架的下拉菜单时，必须调用Bootstrap框架提供的bootstrap.js文件。特别声明：**因为Bootstrap的组件交互效果都是依赖于jQuery库写的插件，所以在使用bootstrap.min.js之前一定要先加载jquery.min.js才会生效果**。
示范：

```html
<div class="dropdown">
	<button class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu1" data-toggle="dropdown">
	下拉菜单
	<span class="caret"></span>
	</button>
	<ul class="dropdown-menu" role="menu" aria-labelledby="dropdownMenu1">
	   <li role="presentation"><a role="menuitem" tabindex="-1" href="#">下拉菜单项</a></li>
	   …
	   <li role="presentation" class="divider"></li>
	   <li role="presentation"><a role="menuitem" tabindex="-1" href="#">下拉菜单项</a></li>
	</ul>
</div>
```
使用方法：
**在使用Bootstrap框架中的下拉菜单组件时，其结构运用的正确与否非常的重要，如果结构和类名未使用正确，直接影响组件是否能正常运用**。我们来简单的看看：

1. 使用一个名为“dropdown”的容器包裹了整个下拉菜单元素，示例中为:
`<div class="dropdown"></div>`
2. 使用了一个`<button>`按钮做为父菜单，并且定义类名“dropdown-toggle”和自定义“data-toggle”属性，且值必须和最外容器类名一致，此示例为:
data-toggle="dropdown"
3. 下拉菜单项使用一个ul列表，并且定义一个类名为“dropdown-menu”，此示例为:
`<ul class="dropdown-menu">`

### 原理分析
Bootstrap框架中的下拉菜单组件，其下拉菜单项默认是隐藏的:
![](http://img.mukewang.com/53e1f1850001230803900164.jpg)
因为“dropdown-menu”默认样式设置了“display:none”:

```css
.dropdown-menu {
  position: absolute;/*设置绝对定位，相对于父元素div.dropdown*/
  top: 100%;/*让下拉菜单项在父菜单项底部，如果父元素不设置相对定位，该元素相对于body元素*/
  left: 0;
  z-index: 1000;/*让下拉菜单项不被其他元素遮盖住*/
  display: none;/*默认隐藏下拉菜单项*/
  float: left;
  min-width: 160px;
  padding: 5px 0;
  margin: 2px 0 0;
  font-size: 14px;
  list-style: none;
  background-color: #fff;
  background-clip: padding-box;
  border: 1px solid #ccc;
  border: 1px solid rgba(0, 0, 0, .15);
  border-radius: 4px;
  -webkit-box-shadow: 0 6px 12px rgba(0, 0, 0, .175);
  box-shadow: 0 6px 12px rgba(0, 0, 0, .175);
}
```
当用户点击父菜单项时，下拉菜单将会被显示出来,当用户再次点击时，下拉菜单将继续隐藏.实现原理是通过js技术手段，给父容器“div.dropdown”添加或移除类名“open”来控制下拉菜单显示或隐藏。
```css
.open > .dropdown-menu {
  display: block;
}
```
### 下拉分隔线
下拉分隔线，假设下拉菜单有两个组，那么组与组之间可以通过添加一个空的`<li>`，并且给这个`<li>`添加类名“divider”来实现添加下拉分隔线的功能.

```css
.dropdown-menu .divider {
  height: 1px;
  margin: 9px 0;
  overflow: hidden;
  background-color: #e5e5e5;
}
```

![](http://img.mukewang.com/53e346260001aed304220432.jpg)

### 菜单标题
可以给每个组添加一个头部（标题）,添加一个`li`，并加上类名`dropdown-header`:

```html
<div class="dropdown">
	<button class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu1" data-toggle="dropdown">
		下拉菜单
		<span class="caret"></span>
	</button>
	<ul class="dropdown-menu" role="menu" aria-labelledby="dropdownMenu1">
		<li role="presentation" class="dropdown-header">第一部分菜单头部</li>
		<li role="presentation"><a role="menuitem" tabindex="-1" href="#">下拉菜单项</a></li>
		…
		<li role="presentation" class="divider"></li>
		<li role="presentation" class="dropdown-header">第二部分菜单头部</li>
		…
		<li role="presentation"><a role="menuitem" tabindex="-1" href="#">下拉菜单项</a></li>
	</ul>
</div>
```
css源码：

```css
.dropdown-header {
  display: block;
  padding: 3px 20px;
  font-size: 12px;
  line-height: 1.42857143;
  color: #999;
}
```

![](http://img.mukewang.com/53e34b1e0001ccdd07440651.jpg)

### 对齐方式
Bootstrap框架中下拉菜单默认是左对齐，如果你想让下拉菜单相对于父容器右对齐时，可以在“dropdown-menu”上添加一个“pull-right”或者“dropdown-menu-right”类名.

```html
<div class="dropdown">
  <button class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu1" data-toggle="dropdown">
  下拉菜单
  <span class="caret"></span>
  </button>
  <ul class="dropdown-menu pull-right" role="menu" aria-labelledby="dropdownMenu1">
   …
  </ul>
</div>
```
css源码：

```css
.dropdown-menu.pull-right {
  right: 0;
  left: auto;
}
.dropdown-menu-right {
  right: 0;
  left: auto;
}
```
同时一定要为.dropdown添加float:leftcss样式。

```css
.dropdown{
  float: left;
}
```
效果：
![](http://img.mukewang.com/53e34c370001522204970469.jpg)

与此同时，还有一个类名刚好与“dropdown-menu-right”相反的类名“dropdown-menu-left”，其效果就是让下拉菜单与父容器左边对齐，其实就是默认效果。

```css
.dropdown-menu-left {
  right: auto;
  left: 0;
}
```
### 菜单项状态
下拉菜单项的默认的状态（不用设置）有悬浮状态（:hover）和焦点状态（:focus）

```css
.dropdown-menu > li > a:hover,
.dropdown-menu > li > a:focus {
  color: #262626;
  text-decoration: none;
  background-color: #f5f5f5;
}
```
下拉菜单项除了上面两种状态，还有当前状态（.active）和禁用状态（.disabled）。这两种状态使用方法只需要在对应的菜单项上添加对应的类名：

```html
<div class="dropdown">
  <button class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu1" data-toggle="dropdown">
  下拉菜单
  <span class="caret"></span>
  </button>
  <ul class="dropdown-menu" role="menu" aria-labelledby="dropdownMenu1">
    <li role="presentation" class="active"><a role="menuitem" tabindex="-1" href="#">下拉菜单项</a></li>
    ….
    <li role="presentation" class="disabled"><a role="menuitem" tabindex="-1" href="#">下拉菜单项</a></li>
  </ul>
</div>
```
效果：
![](http://img.mukewang.com/53e44d0d000131d208720446.jpg)

css源码


```css
dropdown-menu > .active > a,
.dropdown-menu > .active > a:hover,
.dropdown-menu > .active > a:focus {
  color: #fff;
  text-decoration: none;
  background-color: #428bca;
  outline: 0;
}
.dropdown-menu > .disabled > a,
.dropdown-menu > .disabled > a:hover,
.dropdown-menu > .disabled > a:focus {
  color: #999;
}
.dropdown-menu > .disabled > a:hover,
.dropdown-menu > .disabled > a:focus {
  text-decoration: none;
  cursor: not-allowed;
  background-color: transparent;
  background-image: none;
  filter: progid:DXImageTransform.Microsoft.gradient(enabled = false);
}
```

## 按钮
### 按钮组
依赖于bootstrap.js才能工作。使用一个名为“btn-group”的容器，把多个按钮放到这个容器中：

```html
<div class="btn-group">
  <button type="button" class="btn btn-default">
     <span class="glyphicon glyphicon-step-backward"></span>
  </button>
   …
  <button type="button" class="btn btn-default">
     <span class="glyphicon glyphicon-step-forward"></span>
  </button>
</div>
```
除了可以使用`<button>`元素之外，还可以使用其他标签元素，比如`<a>`标签。唯一要保证的是：不管使用什么标签，“.btn-group”容器里的标签元素需要带有类名“.btn”

css源码：

```css.btn-group,
.btn-group-vertical {
  position: relative;
  display: inline-block;
  vertical-align: middle;
}
.btn-group > .btn,
.btn-group-vertical > .btn {
  position: relative;
  float: left;
}
.btn-group > .btn:hover,
.btn-group-vertical > .btn:hover,
.btn-group > .btn:focus,
.btn-group-vertical > .btn:focus,
.btn-group > .btn:active,
.btn-group-vertical > .btn:active,
.btn-group > .btn.active,
.btn-group-vertical > .btn.active {
  z-index: 2;
}
.btn-group > .btn:focus,
.btn-group-vertical > .btn:focus {
  outline: none;
}
.btn-group .btn + .btn,
.btn-group .btn + .btn-group,
.btn-group .btn-group + .btn,
.btn-group .btn-group + .btn-group {
   margin-left: -1px;
}
```
平常制作网页时每个按钮都是带有圆角，而在按钮组中的按钮，除了第一个和最后一个具有边上的圆角之外，其他的按钮没有圆角，它是怎么实现的呢？

1. 默认所有按钮都有圆角
2. 除第一个按钮和最后一个按钮（下拉按钮除外），其他的按钮都取消圆角效果
3. 第一个按钮只留左上角和左下角是圆角
4. 最后一个按钮只留右上角和右下角是圆角

css源码：

```css
.btn-group > .btn:not(:first-child):not(:last-child):not(.dropdown-toggle) {
  border-radius: 0;
}
.btn-group > .btn:first-child {
  margin-left: 0;
}
.btn-group > .btn:first-child:not(:last-child):not(.dropdown-toggle) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
.btn-group > .btn:last-child:not(:first-child),
.btn-group > .dropdown-toggle:not(:first-child) {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
.btn-group > .btn-group {
  float: left;
}
.btn-group > .btn-group:not(:first-child):not(:last-child) > .btn {
  border-radius: 0;
}
.btn-group > .btn-group:first-child> .btn:last-child,
.btn-group > .btn-group:first-child> .dropdown-toggle {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
.btn-group > .btn-group:last-child> .btn:first-child {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
```
### 按钮工具栏
#### 基础用法
在富文本编辑器中，将按钮组分组排列在一起，比如说复制、剪切和粘贴一组；左对齐、中间对齐、右对齐和两端对齐一组，如下图所示：
![](http://img.mukewang.com/53e45edc00019ad308600101.jpg)
Bootstrap框架按钮工具栏也提供了这样的制作方法，你只需要将按钮组“btn-group”按组放在一个大的容器“btn-toolbar”中，如下所示：

```html
<div class="btn-toolbar">
  <div class="btn-group">
    …
  </div>
  <div class="btn-group">
    …
  </div>
  <div class="btn-group">
    …
  </div>
  <div class="btn-group">
    …
  </div>
</div>
```
实现原理主要是让容器的多个分组“btn-group”元素进行浮动，并且组与组之前保持5px的左外距。代码如下：

```css
.btn-toolbar {
  margin-left: -5px;
}
.btn-toolbar .btn-group,
.btn-toolbar .input-group {
  float: left;
}
.btn-toolbar > .btn,
.btn-toolbar > .btn-group,
.btn-toolbar > .input-group {
  margin-left: 5px;
}
```

注意在”btn-toolbar”上清除浮动。

```css
.btn-toolbar:before,
.btn-toolbar:after｛
　display: table;
	content: " ";
｝
.btn-toolbar:after{
  clear: both;
}
```
效果
![](http://img.mukewang.com/53e462020001bd2e08240084.jpg)

#### 按钮组大小设置
按钮是通过btn-lg、btn-sm和btn-xs三个类名来调整padding、font-size、line-height和border-radius属性值来改变按钮大小。那么按钮组的大小，我们也可以通过类似的方法：
☑  .btn-group-lg:大按钮组
  ☑  .btn-group-sm:小按钮组
  ☑  .btn-group-xs:超小按钮组
只需要在“.btn-group”类名上追加对应的类名，就可以得到不同大小的按钮组。如下所示：


```html
<div class="btn-toolbar">
  <div class="btn-group btn-group-lg">
    …
  </div>
  <div class="btn-group">
    …
  </div>
  <div class="btn-group btn-group-sm">
    …
  </div>
  <div class="btn-group btn-group-xs">
   …
  </div>
</div>
```
效果：
![](http://img.mukewang.com/53e4632b0001bb2808230100.jpg)

css源码

```css
.btn-lg,
.btn-group-lg> .btn{
  padding: 10px 16px;
  font-size: 18px;
  line-height: 1.33;
  border-radius: 6px;
}
.btn-sm,
.btn-group-sm> .btn {
  padding: 5px 10px;
  font-size: 12px;
  line-height: 1.5;
  border-radius: 3px;
}
.btn-xs,
.btn-group-xs> .btn{
  padding: 1px 5px;
  font-size: 12px;
  line-height: 1.5;
  border-radius: 3px;
}
```

### 嵌套分组
很多时候，我们常把下拉菜单和普通的按钮组排列在一起，实现类似于导航菜单的效果。如下所示：
![](http://img.mukewang.com/53e466ac0001273008410307.jpg)

使用的时候，只需要把当初制作下拉菜单的“dropdown”的容器换成“btn-group”，并且和普通的按钮放在同一级。如下所示：

```html
<div class="btn-group">
	<button class="btnbtn-default" type="button">首页</button>
	<button class="btnbtn-default" type="button">产品展示</button>
	<button class="btnbtn-default" type="button">案例分析</button>
	<button class="btnbtn-default" type="button">联系我们</button>
	<div class="btn-group">
	   <button class="btnbtn-default dropdown-toggle" data-toggle="dropdown" type="button">关于我们<span class="caret"></span></button>
	   <ul class="dropdown-menu">
	         <li><a href="##">公司简介</a></li>
	         <li><a href="##">企业文化</a></li>
	         <li><a href="##">组织结构</a></li>
	         <li><a href="##">客服服务</a></li>
	    </ul>
	</div>
</div>
```
css源码

```css
.btn-group > .btn-group {
  float: left;
}
.btn-group > .btn-group:not(:first-child):not(:last-child) > .btn {
  border-radius: 0;
}
.btn-group > .btn-group:first-child> .btn:last-child,
.btn-group > .btn-group:first-child> .dropdown-toggle {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
.btn-group > .btn-group:last-child> .btn:first-child {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
.btn-group .dropdown-toggle:active,
.btn-group.open .dropdown-toggle {
  outline: 0;
}
.btn-group > .btn + .dropdown-toggle {
  padding-right: 8px;
  padding-left: 8px;
}
.btn-group > .btn-lg + .dropdown-toggle {
  padding-right: 12px;
  padding-left: 12px;
}
.btn-group.open .dropdown-toggle {
  -webkit-box-shadow: inset 0 3px 5px rgba(0, 0, 0, .125);
  box-shadow: inset 0 3px 5px rgba(0, 0, 0, .125);
}
.btn-group.open .dropdown-toggle.btn-link {
  -webkit-box-shadow: none;
  box-shadow: none;
}
```
### 垂直分组
按钮组都是水平显示的。但在实际运用当中，总会碰到垂直显示的效果。在Bootstrap框架中也提供了这样的风格。我们**只需要把水平分组的“btn-group”类名换成“btn-group-vertical”即可**。如下所示：

```html
<div class="btn-group-vertical">
	<button class="btnbtn-default" type="button">首页</button>
	<button class="btnbtn-default" type="button">产品展示</button>
	<button class="btnbtn-default" type="button">案例分析</button>
	<button class="btnbtn-default" type="button">联系我们</button>
	<div class="btn-group">
	   <button class="btn btn-default dropdown-toggle" data-toggle="dropdown" type="button">关于我们<span class="caret"></span></button>
	   <ul class="dropdown-menu">
	      <li><a href="##">公司简介</a></li>
	      <li><a href="##">企业文化</a></li>
	      <li><a href="##">组织结构</a></li>
	      <li><a href="##">客服服务</a></li>
	</ul>
	</div>
</div>
```
效果
![](http://img.mukewang.com/53e85b8f0001cfd001870309.jpg)

css源码

```css
.btn-group-vertical > .btn,
.btn-group-vertical > .btn-group,
.btn-group-vertical > .btn-group > .btn {
  display: block;
  float: none;
  width: 100%;
  max-width: 100%;
}
.btn-group-vertical > .btn-group > .btn {
  float: none;
}
.btn-group-vertical > .btn + .btn,
.btn-group-vertical > .btn + .btn-group,
.btn-group-vertical > .btn-group + .btn,
.btn-group-vertical > .btn-group + .btn-group {
  margin-top: -1px;
  margin-left: 0;
}
.btn-group-vertical > .btn:not(:first-child):not(:last-child) {
  border-radius: 0;
}
.btn-group-vertical > .btn:first-child:not(:last-child) {
  border-top-right-radius: 4px;
  border-bottom-right-radius: 0;
  border-bottom-left-radius: 0;
}
.btn-group-vertical > .btn:last-child:not(:first-child) {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  border-bottom-left-radius: 4px;
}
.btn-group-vertical > .btn-group:not(:first-child):not(:last-child) > .btn {
  border-radius: 0;
}
.btn-group-vertical > .btn-group:first-child:not(:last-child) > .btn:last-child,
.btn-group-vertical > .btn-group:first-child:not(:last-child) > .dropdown-toggle {
  border-bottom-right-radius: 0;
  border-bottom-left-radius: 0;
}
.btn-group-vertical > .btn-group:last-child:not(:first-child) > .btn:first-child {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
```

和水平分组按钮不一样的是：

1. 水平分组按钮第一个按钮左上角和左下角具有圆角以及最后一个按钮右上角和右下角具有圆角
2. 垂直分组按钮第一个按钮左上角和右上角具有圆角以及最后一个按钮左下角和右下角具有圆角

### 等分按钮
**等分按钮的效果在移动端上特别的实用**。整个按钮组宽度是容器的100%，而按钮组里面的每个按钮平分整个容器宽度。其实现方法也非常的简单，**只需要在按钮组“btn-group”上追加一个“btn-group-justified”类名**，如下所示：


```html
<div class="btn-wrap">
	<div class="btn-group btn-group-justified">
	  <a class="btnbtn-default" href="#">首页</a>
	  <a class="btnbtn-default" href="#">产品展示</a>
	  <a class="btnbtn-default" href="#">案例分析</a>
	  <a class="btnbtn-default" href="#">联系我们</a>
	</div>
</div>
```
效果
![](http://img.mukewang.com/53e46af60001ab0306850099.jpg)

原理非常简单，把“btn-group-justified”模拟成表格（display:table），而且把里面的按钮模拟成表格单元格（display:table-cell）。css源码

```css
/*-------------*/
.btn-group-justified {
  display: table;
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
}
.btn-group-justified > .btn,
.btn-group-justified > .btn-group {
  display: table-cell;
  float: none;
  width: 1%;
}
.btn-group-justified > .btn-group .btn {
  width: 100%;
}
```
**特别声明**：在制作等分按钮组时，请尽量使用`<a>`标签元素来制作按钮，因为使用`<button>`标签元素时，使用display:table在部分浏览器下支持并不友好。

### 按钮下拉菜单
按钮下拉菜单仅从外观上和下拉菜单效果基本上是一样的。不同的是在普通的下拉菜单的基础上封装了按钮（.btn）样式效果。简单点说就是点击一个按钮，会显示隐藏的下拉菜单。

按钮下拉菜单其实就是普通的下拉菜单，只不过把`<a>`标签元素换成了`<button>`标签元素。唯一不同的是外部容器“div.dropdown”换成了“div.btn-group”。如下所示：


```html
<div class="btn-group">
      <button class="btn btn-default dropdown-toggle" data-toggle="dropdown" type="button">按钮下拉菜单<span class="caret"></span></button>
      <ul class="dropdown-menu">
          <li><a href="##">按钮下拉菜单项</a></li>
          <li><a href="##">按钮下拉菜单项</a></li>
          <li><a href="##">按钮下拉菜单项</a></li>
          <li><a href="##">按钮下拉菜单项</a></li>
      </ul>
</div>
```
css源码

```css
.btn-group .dropdown-toggle:active,
.btn-group.open .dropdown-toggle {
  outline: 0;
}
.btn-group > .btn + .dropdown-toggle {
  padding-right: 8px;
  padding-left: 8px;
}
.btn-group > .btn-lg + .dropdown-toggle {
  padding-right: 12px;
  padding-left: 12px;
}
.btn-group.open .dropdown-toggle {
  -webkit-box-shadow: inset 0 3px 5px rgba(0, 0, 0, .125);
          box-shadow: inset 0 3px 5px rgba(0, 0, 0, .125);
}
.btn-group.open .dropdown-toggle.btn-link {
  -webkit-box-shadow: none;
          box-shadow: none;
}
```
效果
![](http://img.mukewang.com/53e9be8300019b2a02020189.jpg)

### 按钮的向下向上三角形
#### 向下三角
按钮的向下三角形，我们是通过在`<button>`标签中添加一个`<span>`标签元素，并且命名为“caret”:


```html
<button class="btn btn-default dropdown-toggle" data-toggle="dropdown" type="button">按钮下拉菜单<span class="caret"></span></button>
```
css源码

```css
.caret {
  display: inline-block;
  width: 0;
  height: 0;
  margin-left: 2px;
  vertical-align: middle;
  border-top: 4px solid;
  border-right: 4px solid transparent;
  border-left: 4px solid transparent;
}
```
另外在按钮中的三角形“caret”做了一定的样式处理：

```css
.btn .caret {
  margin-left: 0;
}
.btn-lg .caret {
  border-width: 5px 5px 0;
  border-bottom-width: 0;
}
.dropup .btn-lg .caret {
  border-width: 0 5px 5px;
}
```
#### 向上三角
有的时候我们的下拉菜单会向上弹起，这个时候我们的三角方向需要朝上显示，实现方法：需要在“.btn-group”类上追加“dropup”类名（这也是做向上弹起下拉菜单要用的类名）。源码：

```css
/*向上三角与向下三角的区别：其实就是改变了一个border-bottom的值*/
.dropup .caret,
.navbar-fixed-bottom .dropdown .caret {
  content: "";
  border-top: 0;
  border-bottom: 4px solid;
}
```
向上弹起菜单的例子：

```html
<div class="btn-group dropup">
  <button class="btn btn-default dropdown-toggle" data-toggle="dropdown" type="button">按钮下拉菜单<span class="caret"></span></button>
  <ul class="dropdown-menu">
        <li><a href="##">按钮下拉菜单项</a></li>
        <li><a href="##">按钮下拉菜单项</a></li>
        <li><a href="##">按钮下拉菜单项</a></li>
        <li><a href="##">按钮下拉菜单项</a></li>
  </ul>
</div>
```
效果
![](http://img.mukewang.com/53e8651e0001c0a102900141.jpg)

### 向上弹起的下拉菜单
有些菜单是需要向上弹出的，比如说你的菜单在页面最底部，而这个菜单正好有一个下拉菜单，为了让用户有更好的体验，不得不让下拉菜单向上弹出。**在Bootstrap框架中专门为这种效果提代了一个类名“dropup”**。使用方法正如前面所示，只需要在“btn-group”上添加这个类名（当然，如果是普通向上弹出下拉菜单，你只需要在“dropdown”类名基础上追加“dropup”类名即可）。

示范：

```html
<div class="btn-group dropup">
    <button class="btn btn-default dropdown-toggle" data-toggle="dropdown" type="button">按钮下拉菜单<span class="caret"></span></button>
    <ul class="dropdown-menu">
         <li><a href="##">按钮下拉菜单项</a></li>
         <li><a href="##">按钮下拉菜单项</a></li>
         <li><a href="##">按钮下拉菜单项</a></li>
         <li><a href="##">按钮下拉菜单项</a></li>
    </ul>
</div>
```
效果
![](http://img.mukewang.com/53e868aa0001399d01890186.jpg)

css源码

```css
.dropup .dropdown-menu,
.navbar-fixed-bottom .dropdown .dropdown-menu {
  top: auto;
  bottom: 100%;
  margin-bottom: 1px;
}
```
## 导航
### 基础样式
Bootstrap框架中制作导航条主要通过“.nav”样式。默认的“.nav”样式不提供默认的导航样式，必须附加另外一个样式才会有效，比如“nav-tabs”、“nav-pills”之类。源码：

```css
.nav {
  padding-left: 0;
  margin-bottom: 0;
  list-style: none;
}
.nav> li {
  position: relative;
  display: block;
}
.nav> li > a {
  position: relative;
  display: block;
  padding: 10px 15px;
}
.nav> li >a:hover,
.nav> li >a:focus {
  text-decoration: none;
  background-color: #eee;
}
.nav>li.disabled> a {
  color: #999;
}
.nav>li.disabled>a:hover,
.nav>li.disabled>a:focus {
  color: #999;
  text-decoration: none;
  cursor: not-allowed;
  background-color: transparent;
}
.nav .open > a,
.nav .open >a:hover,
.nav .open >a:focus {
  background-color: #eee;
  border-color: #428bca;
}
.nav .nav-divider {
  height: 1px;
  margin: 9px 0;
  overflow: hidden;
  background-color: #e5e5e5;
}
.nav> li > a >img {
  max-width: none;
}
```
### 标签形tab导航
#### 基础用法
标签形导航，也称为选项卡导航。特别是在很多内容分块显示的时，使用这种选项卡来分组十分适合。
标签形导航是通过“nav-tabs”样式来实现。在制作标签形导航时需要在原导航“nav”上追加此类名，如：

```html
<ul class="nav nav-tabs">
     <li><a href="##">Home</a></li>
     <li><a href="##">CSS3</a></li>
     <li><a href="##">Sass</a></li>
     <li><a href="##">jQuery</a></li>
     <li><a href="##">Responsive</a></li>
</ul>
```
效果
![](http://img.mukewang.com/53e86aa60001805308940091.jpg)

实现原理非常的简单，将菜单项（li）按块显示，并且让他们在同一水平上排列，然后定义非高亮菜单的样式和鼠标悬浮效果。源码如下：


```css
.nav-tabs {
border-bottom: 1px solid #ddd;
}
.nav-tabs > li {
float: left;
margin-bottom: -1px;
}
.nav-tabs > li > a {
margin-right: 2px;
line-height: 1.42857143;
border: 1px solid transparent;
border-radius: 4px 4px 0 0;
}
.nav-tabs > li >a:hover {
border-color: #eee #eee #ddd;
}
```
#### 选中效果
一般情况之下，选项卡教会有一个当前选中项。其实在Bootstrap框架也相应提供了。假设我们想让某个项为当前选中项，只需要在其标签上添加类名“class="active"”即可：

```html
<ul class="nav nav-tabs">
    <li class="active"><a href="##">Home</a></li>
    …
</ul>
```
效果：
![](http://img.mukewang.com/53e86b7700019e0308540121.jpg)

css源码

```css
.nav-tabs >li.active> a,
.nav-tabs >li.active>a:hover,
.nav-tabs >li.active>a:focus {
  color: #555;
  cursor: default;
  background-color: #fff;
  border: 1px solid #ddd;
  border-bottom-color: transparent;
}
```
#### 禁用状态
除了当前项之外，有的选项卡还带有禁用状态，实现这样的效果，只需要在标签项上添加“class="disabled"”即可：

```html
<ul class="nav nav-tabs">
     <li class="active"><a href="##">Home</a></li>
     …
     <li class="disabled"><a href="##">Responsive</a></li>
</ul>
```
效果
![](http://img.mukewang.com/53e86c8b00015ca208550155.jpg)
实现这个效果的样式，在默认样式“.nav”中就带有：

```css
.nav>li.disabled> a {
  color: #999;
}
.nav>li.disabled>a:hover,
.nav>li.disabled>a:focus {
  color: #999;
  text-decoration: none;
  cursor: not-allowed;
  background-color: transparent;
}
```
### 胶囊形(pills)导航
胶囊形（pills）导航听起来有点别扭，因为其**外形看起来有点像胶囊形状**。但其更像我们平时看到的大众形导航。**当前项高亮显示，并带有圆角效果**。其实现方法和“nav-tabs”类似，同样的结构，只需要把类名“nav-tabs”换成“nav-pills”即可：

```html
<ul class="nav nav-pills">
      <li class="active"><a href="##">Home</a></li>
      <li><a href="##">CSS3</a></li>
      <li><a href="##">Sass</a></li>
      <li><a href="##">jQuery</a></li>
      <li class="disabled"><a href="##">Responsive</a></li>
</ul>
```
![](http://img.mukewang.com/53e86ee60001711e08160307.jpg)

源码：

```css
.nav-pills > li {
  float: left;
}
.nav-pills > li > a {
  border-radius: 4px;
}
.nav-pills > li + li {
  margin-left: 2px;
}
.nav-pills >li.active> a,
.nav-pills >li.active>a:hover,
.nav-pills >li.active>a:focus {
	color: #fff;
  background-color: #428bca;
}
```
### 垂直堆叠的导航
类似垂直排列按钮一样。制作垂直堆叠导航只需要在“nav-pills”的基础上添加一个“nav-stacked”类名即可：

```html
<ul class="nav nav-pills nav-stacked">
     <li class="active"><a href="##">Home</a></li>
     <li><a href="##">CSS3</a></li>
     <li><a href="##">Sass</a></li>
     <li><a href="##">jQuery</a></li>
     <li class="disabled"><a href="##">Responsive</a></li>
</ul>
```
效果
![](http://img.mukewang.com/53e871a2000102b707240444.jpg)

垂直堆叠导航与胶囊形导航相比，主要是让导航项不浮动，让其垂直排列，然后给相邻导航项留有一定的间距。源码：

```css
.nav-stacked > li {
  float: none;
}
.nav-stacked > li + li {
  margin-top: 2px;
  margin-left: 0;
}
```
在下拉菜单一节中，下拉菜单组与组之间有一个分隔线。其实在垂直堆叠导航也具有这样的效果，只需要添加在导航项之间添加`<li class=”nav-divider”></li>`即可：

```html
<ul class="nav nav-pills nav-stacked">
    <li class="active"><a href="##">Home</a></li>
    <li><a href="##">CSS3</a></li>
    <li><a href="##">Sass</a></li>
    <li><a href="##">jQuery</a></li>
   <li class="nav-divider"></li>
    <li class="disabled"><a href="##">Responsive</a></li>
</ul>
```
css源码：

```css
.nav .nav-divider {
	height: 1px;
	margin: 9px 0;
	overflow: hidden;
	background-color: #e5e5e5;
}
```

### 自适应导航
自适应导航指的是导航占据容器全部宽度，而且菜单项可以像表格的单元格一样自适应宽度。
#### 使用
自适应导航和前面使用“btn-group-justified”制作的自适应按钮组是一样的。只不过在制作自适应导航时更换了另一个类名“nav-justified”。当然他需要和“nav-tabs”或者“nav-pills”配合在一起使用。如：


```html
<ul class="nav nav-tabs nav-justified">
     <li class="active"><a href="##">Home</a></li>
     <li><a href="##">CSS3</a></li>
     <li><a href="##">Sass</a></li>
     <li><a href="##">jQuery</a></li>
     <li><a href="##">Responsive</a></li>
</ul>
```
效果
![](http://img.mukewang.com/53ed99aa00016bcb08630061.jpg)

#### 实现原理
列表`<ul>`上设置宽度为“100%”，然后每个菜单项`<li>`设置了“display:table-cell”，让列表项以模拟表格单元格的形式显示：


```css
.nav-justified {
  width: 100%;
}
.nav-justified > li {
  float: none;
}
.nav-justified > li > a {
  margin-bottom: 5px;
  text-align: center;
}
.nav-justified > .dropdown .dropdown-menu {
  top: auto;
  left: auto;
}
@media (min-width: 768px) {
  .nav-justified > li {
  display: table-cell;
  width: 1%;
  }
  .nav-justified > li > a {
  margin-bottom: 0;
  }
}
```
这里有一个媒体查询条件：“@media (min-width:768px){…}”表示自适应导航仅在浏览器视窗宽度大于768px才能按上图风格显示。当你的浏览器视窗宽度小于768px的时候，将会按下图的风格展示:
![](http://img.mukewang.com/53e874f70001bacb06150786.jpg)
浏览器视窗宽度小于768px时，在样式上做了另外的处理:

```css
.nav-tabs.nav-justified {
	 width: 100%;
	 border-bottom: 0;
}
.nav-tabs.nav-justified > li {
	 float: none;
}
.nav-tabs.nav-justified > li > a {
	 margin-bottom: 5px;
	 text-align: center;
}
.nav-tabs.nav-justified > .dropdown .dropdown-menu {
 	top: auto;
 	left: auto;
}
@media (min-width: 768px) {
	 .nav-tabs.nav-justified > li {
		 display: table-cell;
		 width: 1%;
	  }
	.nav-tabs.nav-justified > li > a {
		 margin-bottom: 0;
	  }
}
.nav-tabs.nav-justified > li > a {
	 margin-right: 0;
 	border-radius: 4px;
}
.nav-tabs.nav-justified > .active > a,
.nav-tabs.nav-justified > .active >a:hover,
.nav-tabs.nav-justified > .active >a:focus {
	 border: 1px solid #ddd;
}
@media (min-width: 768px) {
 .nav-tabs.nav-justified > li > a {
 	border-bottom: 1px solid #ddd;
 	border-radius: 4px 4px 0 0;
  }
.nav-tabs.nav-justified > .active > a,
.nav-tabs.nav-justified > .active >a:hover,
.nav-tabs.nav-justified > .active >a:focus {
	 border-bottom-color: #fff;
  }
}
```
### 导航加下拉菜单（二级导航）
那么在Bootstrap框架中制作二级导航就更容易了。只需要将li当作父容器，使用类名“dropdown”，同时在li中嵌套另一个列表ul，使用前面介绍下拉菜单的方法就可以：


```html
<ul class="nav nav-pills">
     <li class="active"><a href="##">首页</a></li>
     <li class="dropdown">
        <a href="##" class="dropdown-toggle" data-toggle="dropdown">教程<span class="caret"></span></a>
        <ul class="dropdown-menu">
            <li><a href="##">CSS3</a></li>
            …
       </ul>
     </li>
     <li><a href="##">关于我们</a></li>
</ul>
```
![](http://img.mukewang.com/53e877e700014b0104150304.jpg)
点击有二级导航的菜单项，会自动添加“open”类名，再次点击就会删除添加的“open”类名.就是依靠这个类名来控制二级导航显示与否，并且设置了背景色和边框：

```css
.nav .open > a,
.nav .open >a:hover,
.nav .open >a:focus {
	background-color: #eee;
	border-color: #428bca;
}
```
在二级导航中使用分割线，只需要添加`<li class=”nav-divider”></li>`这样的一个空标签就可以了

效果：
![](http://img.mukewang.com/53e878b600013f7d04750337.jpg)

源码：

```css
.nav .nav-divider {
  height: 1px;
  margin: 9px 0;
  overflow: hidden;
  background-color: #e5e5e5;
}
```

### 面包屑式导航
使用方式就很简单，为ol加入breadcrumb类，例如

```html
<ol class="breadcrumb">
  <li><a href="#">首页</a></li>
  <li><a href="#">我的书</a></li>
  <li class="active">《图解CSS3》</li>
</ol>
```
css原理是使用li+li:before实现li与li之间的分隔符：

```css
.breadcrumb {
	padding: 8px 15px;
	margin-bottom: 20px;
	list-style: none;
	background-color: #f5f5f5;
	border-radius: 4px;
}

.breadcrumb> li {
	display: inline-block;
}

.breadcrumb> li + li:before {
	padding: 0 5px;
	color: #ccc;
	content: "/\00a0";
}

.breadcrumb> .active {
	color: #999;
}
```
# 导航条、分页导航
## 导航条基础
在导航条(navbar)中有一个背景色、而且导航条可以是纯链接（类似导航），也可以是表单，还有就是表单和导航一起结合等多种形式。

## 基础导航条
在制作一个基础导航条时，主要分以下几步：

1. 首先在制作导航的列表`<ul class=”nav”>`基础上添加类名“navbar-nav”
2. 在列表外部添加一个容器（div），并且使用类名“navbar”和“navbar-default”


```html
<div class="navbar navbar-default" role="navigation">
     <ul class="nav navbar-nav">
	 	<li class="active"><a href="##">网站首页</a></li>
        <li><a href="##">系列教程</a></li>
        <li><a href="##">名师介绍</a></li>
        <li><a href="##">成功案例</a></li>
        <li><a href="##">关于我们</a></li>
	 </ul>
</div>
```
“.navbar”样式的主要功能就是设置左右padding和圆角等效果，但他和颜色相关的样式没有进行任何的设置。其主要源码如下：

```css
.navbar {
  position: relative;
  min-height: 50px;
  margin-bottom: 20px;
  border: 1px solid transparent;
}
```
而导航条的颜色都是通过“.navbar-default”来进行控制：

```css
.navbar-default {
  background-color: #f8f8f8;
  border-color: #e7e7e7;
}
```
navbar-nav样式是在导航.nav的基础上重新调整了菜单项的浮动与内外边距。同时也不包括颜色等样式设置.而颜色和其他样式是通过配合父容器“navbar-default”来一起实现：

```css
.navbar-default .navbar-nav> li > a {
  color: #777;
}
.navbar-default .navbar-nav> li >a:hover,
.navbar-default .navbar-nav> li >a:focus {
  color: #333;
  background-color: transparent;
}
.navbar-default .navbar-nav> .active > a,
.navbar-default .navbar-nav> .active >a:hover,
.navbar-default .navbar-nav> .active >a:focus {
  color: #555;
  background-color: #e7e7e7;
}
.navbar-default .navbar-nav> .disabled > a,
.navbar-default .navbar-nav> .disabled >a:hover,
.navbar-default .navbar-nav> .disabled >a:focus {
  color: #ccc;
  background-color: transparent;
}
```
## 为导航条添加标题、二级菜单及状态
### 加入导航条标题
常常在菜单前面都会有一个标题（文字字号比其它文字稍大一些），其实在Bootstrap框架也为大家做了这方面考虑，其通过“navbar-header”和“navbar-brand”来实现. 例如

```html
<div class="navbar navbar-default" role="navigation">
  　<div class="navbar-header">
  　    <a href="##" class="navbar-brand">慕课网</a>
  　</div>
    <ul class="nav navbar-nav">
	   。。。
	 </ul>
</div>
```
css源码中其样式主要是加大了字体设置，并且设置了最大宽度：


```css
.navbar-brand {
	float: left;
	height: 50px;
	padding: 15px 15px;
	font-size: 18px;
	line-height: 20px;
}
.navbar-brand:hover,
.navbar-brand:focus {
	text-decoration: none;
}
@media (min-width: 768px) {
	.navbar> .container .navbar-brand,
	.navbar> .container-fluid .navbar-brand {
		margin-left: -15px;
	}
}
```
同样在默认导航条（navbar-default）下，对navbar-brand也做了颜色处理：

```css
.navbar-default .navbar-brand {
	color: #777;
}
.navbar-default .navbar-brand:hover,
.navbar-default .navbar-brand:focus {
	color: #5e5e5e;
	background-color: transparent;
}
```

### 导航条状态、二级菜单
同样的，在基础导航条中对菜单提供了当前状态，禁用状态，悬浮状态等效果，而且也可以带有二级菜单的导航条.例如：

```css
<div class="navbar navbar-default" role="navigation">
  　<div class="navbar-header">
  　    <a href="##" class="navbar-brand">慕课网</a>
  　</div>
	<ul class="nav navbar-nav">
	 	<li class="active"><a href="##">网站首页</a></li>
      <li class="dropdown">
          <a href="##" data-toggle="dropdown" class="dropdown-toggle">系列教程<span class="caret"></span></a>
          <ul class="dropdown-menu">
		        	<li><a href="##">CSS3</a></li>
		        	<li><a href="##">JavaScript</a></li>
		        	<li class="disabled"><a href="##">PHP</a></li>
          </ul>
       </li>
       <li><a href="##">名师介绍</a></li>
       <li><a href="##">成功案例</a></li>
       <li><a href="##">关于我们</a></li>
	</ul>
</div>
```
效果:
![](http://img.mukewang.com/53f55cad00018e8008660190.jpg)

### 带表单的导航条
在Bootstrap框架中提供了一个“navbar-form”，使用方法很简单，在navbar容器中放置一个带有navbar-form类名的表单。例如：

```html
	<div class="navbar navbar-default" role="navigation">
  　<div class="navbar-header">
  　    <a href="##" class="navbar-brand">慕课网</a>
  　</div>
    <ul class="nav navbar-nav">
       。。。。
	 </ul>
     <form action="##" class="navbar-form navbar-left" rol="search">
   	    <div class="form-group">
   		   <input type="text" class="form-control" placeholder="请输入关键词" />
   	    </div>
        <button type="submit" class="btn btn-default">搜索</button>
     </form>
</div>
```
“navbar-left”让表单左浮动，更好实现对齐。在Bootstrap框架中，还提供了“navbar-right”样式，让元素在导航条靠右对齐。

```css
@media (min-width: 768px) {
 .navbar-left {
 	float: left !important;
 }
.navbar-right {
 	float: right !important;
 }
}
```

### 导航条中的按钮、文本和链接
Bootstrap框架的导航条中除了使用navbar-brand中的a元素和navbar-nav的ul和navbar-form之外，还可以使用其他元素。框架提供了三种其他样式：

1. 导航条中的按钮navbar-btn
2. 导航条中的文本navbar-text
3. 导航条中的普通链接navbar-link

但这三种样式在框架中使用时受到一定的限制，需要和navbar-brand、navbar-nav配合起来使用。**而且对数量也有一定的限制，一般情况在使用一到两个不会有问题，超过两个就会有问题**。

### 固定导航条
希望导航条固定在浏览器顶部或底部，这种固定式导航条的应用在移动端开发中更为常见。Bootstrap框架提供了两种固定导航条的方式：
 ☑  .navbar-fixed-top：导航条固定在浏览器窗口顶部
   ☑  .navbar-fixed-bottom：导航条固定在浏览器窗口底部

使用方法很简单，只需要在制作导航条最外部容器navbar上追加对应的类名即可：

```css
<div class="navbar navbar-default navbar-fixed-top" role="navigation">
　…
</div>
<div class="content">我是内容</div>
<div class="navbar navbar-default navbar-fixed-bottom" role="navigation">
　…
</div>
```

实现原理很简单，就是在navbar-fixed-top和navbar-fixed-bottom使用了position：fixed属性，并且设置navbar-fixed-top的top值为0,而navbar-fixed-bottom的bottom值为0。具体的源码如下：

```css
.navbar-fixed-top,
.navbar-fixed-bottom {
  position: fixed;
  right: 0;
  left: 0;
  z-index: 1030;
}
@media (min-width: 768px) {
.navbar-fixed-top,
.navbar-fixed-bottom {
  border-radius: 0;
  }
}
.navbar-fixed-top {
  top: 0;
  border-width: 0 0 1px;
}
.navbar-fixed-bottom {
  bottom: 0;
  margin-bottom: 0;
  border-width: 1px 0 0;
}
```

### 响应式导航条

先来看HTML结构:

```html
<div class="navbar navbar-default" role="navigation">
  <div class="navbar-header">
     　<!-- .navbar-toggle样式用于toggle收缩的内容，即nav-collapse collapse样式所在元素 -->
       <button class="navbar-toggle" type="button" data-toggle="collapse" data-target=".navbar-responsive-collapse">
         <span class="sr-only">Toggle Navigation</span>
         <span class="icon-bar"></span>
         <span class="icon-bar"></span>
         <span class="icon-bar"></span>
       </button>
       <!-- 确保无论是宽屏还是窄屏，navbar-brand都显示 -->
       <a href="##" class="navbar-brand">慕课网</a>
  </div>
  <!-- 屏幕宽度小于768px时，div.navbar-responsive-collapse容器里的内容都会隐藏，显示icon-bar图标，当点击icon-bar图标时，再展开。屏幕大于768px时，默认显示。 -->
  <div class="collapse navbar-collapse navbar-responsive-collapse">
    	<ul class="nav navbar-nav">
      		<li class="active"><a href="##">网站首页</a></li>
      		<li><a href="##">系列教程</a></li>
      		<li><a href="##">名师介绍</a></li>
      		<li><a href="##">成功案例</a></li>
      		<li><a href="##">关于我们</a></li>
	 	</ul>
  </div>
</div>
```
使用方法：

1. 保证在窄屏时需要折叠的内容必须包裹在带一个div内，并且为这个div加入collapse、navbar-collapse两个类名。最后为这个div添加一个class类名或者id名。
2. 保证在窄屏时要显示的图标样式（固定写法）：

		```html
		<button class="navbar-toggle" type="button" data-toggle="collapse">
		  <span class="sr-only">Toggle Navigation</span>
		  <span class="icon-bar"></span>
		  <span class="icon-bar"></span>
		  <span class="icon-bar"></span>
		</button>
		```

3. 并为button添加data-target=".类名/#id名"，究竞是类名还是id名呢？**由需要折叠的div来决定**。如：

需要折叠的div代码段：

```html
<div class="collapse navbar-collapse" id="example">
      <ul class="nav navbar-nav">
      …
      </ul>
</div>
```
窄屏时显示的图标代码段：

```html
<button class="navbar-toggle" type="button" data-toggle="collapse" data-target="#example">
  ...
</button>
```
也可以这么写，需要折叠的div代码段：

```html
<div class="collapse navbar-collapse example" >
      <ul class="nav navbar-nav">
      …
      </ul>
</div>
```
窄屏时要显示的图标：

```html
<button class="navbar-toggle" type="button" data-toggle="collapse" data-target=".example">
  ...
</button>
```

### 反色导航条
反色导航条其实是Bootstrap框架为大家提供的第二种风格的导航条，与默认的导航条相比，使用方法并无区别，**只是将navbar-deafult类名换成navbar-inverse**。其变化只是导航条的背景色和文本做了修改。

```html
<div class="navbar  navbar-inverse" role="navigation">
	<div class="nav bar-header">
	      <a href="##" class="navbar-brand">慕课网</a>
	</div>
	<ul class="nav navbar-nav">
	      <li class="active"><a href="">首页</a></li>
	      <li><a href="">教程</a></li>
	      <li><a href="">关于我们</a></li>
	</ul>
</div>
```

## 分页导航
### 带页码的分页导航
#### 使用方法
在Bootstrap框架中使用的是ul>li>a这样的结构，在ul标签上加入pagination方法：

```html
<ul class="pagination">
   <li><a href="#">&laquo;</a></li>
   <li><a href="#">1</a></li>
   <li><a href="#">2</a></li>
   <li><a href="#">3</a></li>
   <li><a href="#">4</a></li>
   <li><a href="#">5</a></li>
   <li><a href="#">&raquo;</a></li>
</ul>
```
效果:
![](http://img.mukewang.com/53f5972900018aa605480162.jpg)

#### 实现原理
从效果中可以看出，当前状态页码会高亮显示，而且不能点击。而最后一页是禁用状态，也不能点击。css源码

```css
.pagination> .active > a,
.pagination> .active > span,
.pagination> .active >a:hover,
.pagination> .active >span:hover,
.pagination> .active >a:focus,
.pagination> .active >span:focus {
	z-index: 2;
	color: #fff;
	cursor: default;
	background-color: #428bca;
	border-color: #428bca;
}
.pagination> .disabled > span,
.pagination> .disabled >span:hover,
.pagination> .disabled >span:focus,
.pagination> .disabled > a,
.pagination> .disabled >a:hover,
.pagination> .disabled >a:focus {
	color: #999;
	cursor: not-allowed;
	background-color: #fff;
	border-color: #ddd;
}
```
注意：要禁用当前状态和禁用状态不能点击，我们还要依靠js来实现，或者将这两状态下的a标签换成span标签。

#### 大小设置
在Bootstrap框架中，也可以通过几个不同的情况来设置其大小。类似于按钮一样：

1. 通过“pagination-lg”让分页导航变大；
2. 通过“pagination-sm”让分页导航变小：


```html
<ul class="pagination pagination-lg">
 …
</ul>
<ul class="pagination">
 …
</ul>
<ul class="pagination pagination-sm">
 …
</ul>
```

### 翻页分页导航
这种分页导航是看不到具体的页码，只会提供一个“上一页”和“下一页”的按钮。
#### 使用方法
在实际使用中，翻页分页导航和带页码的分页导航类似，为ul标签加入pager类：

```html
<ul class="pager">
   <li><a href="#">&laquo;上一页</a></li>
   <li><a href="#">下一页&raquo;</a></li>
</ul>
```
css源码：

```css
.pager {
	padding-left: 0;
	margin: 20px 0;
	text-align: center;
	list-style: none;
}
.pager li {
	display: inline;
}
.pager li > a,
.pager li > span {
	display: inline-block;
	padding: 5px 14px;
	background-color: #fff;
	border: 1px solid #ddd;
	border-radius: 15px;
}
.pager li >a:hover,
.pager li >a:focus {
	text-decoration: none;
	background-color: #eee;
}
```
#### 对齐样式设置
默认情况之下，翻页分页导航是居中显示，但有的时候我们需要一个居左，一个居右。Bootstrap框架提供了两个样式：
   ☑   previous：让“上一步”按钮居左
   ☑   next：让“下一步”按钮居右
具体使用的时候，只需要在li标签上添加对应类名即可：

```html
<ul class="pager">
   <li class="previous"><a href="#">&laquo;上一页</a></li>
   <li class="next"><a href="#">下一页&raquo;</a></li>
</ul>
```
实现原理很简单，就是一个进行了左浮动，一个进行了右浮动：

```css
.pager .next > a,
.pager .next > span {
	float: right;
}
.pager .previous > a,
.pager .previous > span {
	float: left;
}
```

### 状态样式设置
和带页码分页导航一样，如果在li标签上添加了disabled类名的时候，分页按钮处于禁用状态，但同样不能禁止其点击功能。你可以通过js来处理，或将a标签换成span标签。


```html
<ul class="pager">
  <li class="disabled"><span>&laquo;上一页</span></li>
  <li><a href="#">下一页&raquo;</a></li>
</ul>
```
css源码

```css
.pager .disabled > a,
.pager .disabled >a:hover,
.pager .disabled >a:focus,
.pager .disabled > span {
  color: #999;
  cursor: not-allowed;
  background-color: #fff;
}
```
## 标签
在一些Web页面中常常会添加一个标签用来告诉用户一些额外的信息，比如说在导航上添加了一个新导航项，可能就会加一个“new”标签，来告诉用户。这是新添加的导航项。如下图所示：
![](http://img.mukewang.com/53f5a3810001256d05550068.jpg)

那么在Bootstrap框架中特意将这样的效果提取出来成为一个标签组件，并且以**.label**样式来实现高亮显示。

### 使用方法
示范：

```html
<h3>Example heading <span class="label label-default">New</span></h3>
```

css源码：

```css
.label {
	display: inline;
	padding: .2em .6em .3em;
	font-size: 75%;
	font-weight: bold;
	line-height: 1;
	color: #fff;
	text-align: center;
	white-space: nowrap;
	vertical-align: baseline;
	border-radius: .25em;
}
```
如果使用的是a标签元素来制作的话，为了让其更美观，在hover状态去掉下划线之类。源码：

```css
.label[href]:hover,
.label[href]:focus {
	color: #fff;
	text-decoration: none;
	cursor: pointer;
}
```
有的时候标签内没有内容的时候，可以借助CSS3的:empty伪元素将其隐藏：

```css
.label:empty {
	display: none;
}
```
### 颜色样式设置
和按钮元素button类似，label样式也提供了多种颜色：
  ☑   label-deafult:默认标签，深灰色
  ☑   label-primary：主要标签，深蓝色
  ☑   label-success：成功标签，绿色
  ☑   label-info：信息标签，浅蓝色
  ☑   label-warning：警告标签，橙色
  ☑   label-danger：错误标签，红色
主要是通过这几个类名来修改背景颜色和文本颜色：

```html
<span class="label label-default">默认标签</span>
<span class="label label-primary">主要标签</span>
<span class="label label-success">成功标签</span>
<span class="label label-info">信息标签</span>
<span class="label label-warning">警告标签</span>
<span class="label label-danger">错误标签</span>
```
css源码

```css
.label-default {
	background-color: #999;
}
.label-default[href]:hover,
.label-default[href]:focus {
	background-color: #808080;
}
/* 其他颜色的都类似 */
```

## 徽章
![](http://img.mukewang.com/53f5aac500010a7f04370079.jpg)
在Bootstrap框架中，把这种效果称作为徽章效果，使用**badge**样式来实现。

### 使用方法

```html
<a href="#">Inbox <span class="badge">42</span></a>
```
css源码，主要将其设置为椭圆形，并且加了一个背景色：

```css
.badge {
	display: inline-block;
	min-width: 10px;
	padding: 3px 7px;
	font-size: 12px;
	font-weight: bold;
	line-height: 1;
	color: #fff;
	text-align: center;
	white-space: nowrap;
	vertical-align: baseline;
	background-color: #999;
	border-radius: 10px;
}
```
同样也使用:empty伪元素，当没有内容的时候隐藏：

```css
.badge:empty {
	display: none;
}
```
可以将徽章与按钮或者导航之类配合使用：

```html
<div class="navbar navbar-default" role="navigation">
　<div class="navbar-header">
　       <a href="##" class="navbar-brand">慕课网</a>
　</div>
  <ul class="nav navbar-nav">
         <li class="active"><a href="##">网站首页</a></li>
         <li><a href="##">系列教程</a></li>
         <li><a href="##">名师介绍</a></li>
         <li><a href="##">成功案例<span class="badge">23</span></a></li>
         <li><a href="##">关于我们</a></li>
  </ul>
</div>
```
### 按钮和胶囊形导航设置徽章
徽章在按钮元素button和胶囊形导航nav-pills也可以有类似的样式，只不过是颜色不同而已。

```html
<ul class="nav nav-pills">
  <li class="active"><a href="#">Home <span class="badge">42</span></a></li>
   …
  <li><a href="#">Messages<span class="badge">3</span></a></li>
</ul>
<ul class="navnav-pills nav-stacked" style="max-width: 260px;">
	<li class="active">
		<a href="#">
		  <span class="badge pull-right">42</span>
		          Home
		</a>
	</li>
	…
	<li>
		<a href="#">
		    <span class="badge pull-right">3</span>
		          Messages
		</a>
	</li>
</ul>
<button class="btnbtn-primary" type="button">
      Messages <span class="badge">4</span>
</button>
```
效果
![](/Users/liubin/Desktop/屏幕快照 2017-07-30 10.30.04.png)

注意：不过和标签组件不一样的是：在徽章组件中没有提供多种颜色风格的效果，不过你也可以通过badges.less或者_badges.scss快速自定义。

# 其他内置组件
## 缩略图
### 一
缩略图在网站中最常用的地方就是产品列表页面，一行显示几张图片，有的在图片底下（左侧或右侧）带有标题、描述等信息。Bootstrap框架将这一部独立成一个模块组件。并通过“thumbnail”样式配合bootstrap的网格系统来实现。可以将产品列表页变得更好看。

在使用上通过“thumbnail”样式配合bootstrap的网格系统来实现。

假设我们一个产品列表，如下图所示：
![](http://img.mukewang.com/5418e97a00014d6806620159.jpg)

html结构
```html
<div class="container">
    <div class="row">
        <div class="col-xs-6 col-md-3">
            <a href="#" class="thumbnail">
                <img src="http://img.mukewang.com/5434eba100014fe906000338.png" style="height: 180px; width: 100%; display: block;" alt="">
            </a>
        </div>
    …
    </div>
</div>
```
上面的结构表示的是在宽屏幕（可视区域大于768px）的时候，一行显示四个缩略图：
![](http://img.mukewang.com/5418ea8a00016d7c06500135.jpg)

在窄屏（可视区域小于768px）的时候，一行只显示两个缩略图：
![](http://img.mukewang.com/5418eac00001bf4a06550366.jpg)

css源码，布局实现的主要是依靠于Bootstrap框架的网格系统，而缩略图对应的样式代码：

```css
.thumbnail {
  display: block;
  padding: 4px;
  margin-bottom: 20px;
  line-height: 1.42857143;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  -webkit-transition: all .2s ease-in-out;
          transition: all .2s ease-in-out;
}
.thumbnail > img,
.thumbnail a > img {
  margin-right: auto;
  margin-left: auto;
}
a.thumbnail:hover,
a.thumbnail:focus,
a.thumbnail.active {
  border-color: #428bca;
}
.thumbnail .caption {
  padding: 9px;
  color: #333;
}
```
### 二
可以让缩略图配合标题、描述内容，按钮等：
![](http://img.mukewang.com/5418f3a20001103f06620230.jpg)

在仅有缩略图的基础上，添加了一个div名为“caption“的容器，在这个容器中放置其他内容，比如说标题，文本描述，按钮等：

```html
<div class="container">
    <div class="row">
        <div class="col-xs-6 col-md-3">
            <a href="#" class="thumbnail">
                <img src="http://a.hiphotos.baidu.com/image/w%3D400/sign=c56d7638b0b7d0a27bc9059dfbee760d/3b292df5e0fe9925d46873da36a85edf8cb171d7.jpg" style="height: 180px; width: 100%; display: block;" alt="">
            </a>
            <div class="caption">
                <h3>Bootstrap框架系列教程</h3>
                <p>Bootstrap框架是一个优秀的前端框，就算您是一位后端程序员或者你是一位不懂设计的前端人员，你也能依赖于Bootstrap制作做优美的网站...</p>
                <p>
                    <a href="##" class="btn btn-primary">开始学习</a>
                    <a href="##" class="btn btn-info">正在学习</a>
                </p>
            </div>
        </div>
    …
    </div>
</div>
```

## 警示框
在网站中，网页总是需要和用户一起做沟通与交流。特别是当用户操作上下文为用户提供一些有效的警示框，比如说告诉用户操作成功、操作错误、提示或者警告等。如下图所示：
![](http://img.mukewang.com/5418f5120001a99e06760090.jpg)

### 默认警示框
Bootstrap框架通过**alert**样式来实现警示框效果。在默认情况之下，提供了四种不同的警示框效果：

1. 成功警示框：告诉用用户操作成功，在“alert”样式基础上追加“alert-success”样式，具体呈现的是背景、边框和文本都是绿色；
2. 信息警示框：给用户提供提示信息，在“alert”样式基础上追加“alert-info”样式，具体呈现的是背景、边框和文本都是浅蓝色；
3. 警告警示框：提示用户小心操作（提供警告信息），在“alert”样式基础上追加“alert-warning”样式，具体呈现的是背景、边框、文本都是浅黄色；
4. 错误警示框：提示用户操作错误，在“alert”样式基础上追加“alert-danger”样式，具体呈现的是背景、边框和文本都是浅红色。
如下图示：
![](http://img.mukewang.com/5418f5c400016e3006660225.jpg)

具体使用的时候，可以在类名为“alert”的div容器里放置提示信息。实现不同类型警示框，只需要在“alert”基础上追加对应的类名，如下：

```html
<div class="alert alert-success" role="alert">恭喜您操作成功！</div>
<div class="alert alert-info" role="alert">请输入正确的密码</div>
<div class="alert alert-warning" role="alert">您已操作失败两次，还有最后一次机会</div>
<div class="alert alert-danger" role="alert">对不起，您输入的密码有误</div>
```

其中“alert”样式的源码主要是设置了警示框的背景色、边框、圆角和文字颜色。另外对其内部几个元素h4、p、ul和“.alert-link”做了样式上的特殊处理：

```css
.alert {
  padding: 15px;
  margin-bottom: 20px;
  border: 1px solid transparent;
  border-radius: 4px;
}
.alert h4 {
  margin-top: 0;
  color: inherit;
}
.alert .alert-link {
  font-weight: bold;
}
.alert > p,
.alert > ul {
  margin-bottom: 0;
}
.alert > p + p {
  margin-top: 5px;
}
```
不同类型的警示框，主要是通过“alert-success”、“alert-info”、“alert-warning”和“alert-danger”样式来实现：

```css
.alert-success {
  color: #3c763d;
  background-color: #dff0d8;
  border-color: #d6e9c6;
}
.alert-success hr {
  border-top-color: #c9e2b3;
}
.alert-success .alert-link {
  color: #2b542c;
}
/*其余类似*/
```

### 可关闭的警示框
只需要在默认的警示框里面添加一个关闭按钮。然后进行三个步骤：

1. 需要在基本警示框“alert”的基础上添加“alert-dismissable”样式。
2. 在button标签中加入class="close"类，实现警示框关闭按钮的样式。
3. 要确保关闭按钮元素上设置了自定义属性：“data-dismiss="alert"”（因为可关闭警示框需要借助于Javascript来检测该属性，从而控制警示框的关闭）。
具体使用如下：

```html
<div class="alert alert-success alert-dismissable" role="alert">
    <button class="close" type="button" data-dismiss="alert">&times;</button>
    恭喜您操作成功！
</div>
```
效果：
![](http://img.mukewang.com/5418f90a0001127e06660238.jpg)

在样式上，需要在基本警示框“alert”的基础上添加“alert-dismissable”样式，这样就可以实现带关闭功能的警示框。


```css
.alert-dismissable {
  padding-right: 35px;
}
.alert-dismissable .close {
  position: relative;
  top: -2px;
  right: -21px;
  color: inherit;
}
```

### 警示框的链接
在Bootstrap框架中对警示框里的链接样式做了一个**高亮显示**处理。为不同类型的警示框内的链接进行了**加粗**处理，并且**颜色相应加深**。

Bootstrap框架是通过给警示框加的链接添加一个名为**alert-link**的类名，通过“alert-link”样式给链接提供高亮显示。

```html
<div class="alert alert-success" role="alert">
    <strong>Well done!</strong>
    You successfully read
    <a href="#" class="alert-link">this important alert message</a>
    .
</div>
<div class="alert alert-info" role="alert">
    <strong>Heads up!</strong>
     This
     <a href="#" class="alert-link">alert needs your attention</a>
     , but it's not super important.
</div>
<div class="alert alert-warning" role="alert">
    <strong>Warning!</strong>
     Better check yourself, you're
     <a href="#" class="alert-link">not looking too good</a>
     .
</div>
<div class="alert alert-danger" role="alert">
    <strong>Oh snap!</strong>
    <a href="#" class="alert-link">Change a few things up</a>
     and try submitting again.
</div>
```
效果
![](http://img.mukewang.com/5418fc470001ee6306570227.jpg)
css源码

```css
.alert .alert-link {
  font-weight: bold;
}

/*不同类型警示框中链接的文本颜色*/
.alert-success .alert-link {
  color: #2b542c;
}
.alert-info .alert-link {
  color: #245269;
}
.alert-warning .alert-link {
  color: #66512c;
}
.alert-danger .alert-link {
  color: #843534;
}
```
## 进度条

### 基本样式
Bootstrap框架中对于进度条提供了一个基本样式，一个100%宽度的背景色，然后个高亮的色表示完成进度。其实制作这样的进度条非常容易，一般是使用两个容器，外容器具有一定的宽度，并且设置一个背景颜色，他的子元素设置一个宽度，比如完成度是30%（也就是父容器的宽度比例值），同时给其设置一个高亮的背景色。
#### 使用方法
Bootstrap框架中也是按这样的方式实现的，他提供了两个容器，**外容器使用“progress”样式，子容器使用“progress-bar”样式**。其中progress用来设置进度条的容器样式，而progress-bar用于限制进度条的进度。使用方法非常的简单：

```html
<div class="progress">
       <div class="progress-bar" style="width:40%"></div>
</div>
```

效果
![](http://img.mukewang.com/5418ff230001f9e106680072.jpg)

#### 实现原理
progress样式主要设置进度条容器的背景色，容器高度、间距等：

```css
.progress {
  height: 20px;
  margin-bottom: 20px;
  overflow: hidden;
  background-color: #f5f5f5;
  border-radius: 4px;
  -webkit-box-shadow: inset 0 1px 2px rgba(0, 0, 0, .1);
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, .1);
}
```
而progress-bar样式在设置进度方向，重要的是设置了进度条的背景颜色和过渡效果：

```css
.progress-bar {
  float: left;
  width: 0;
  height: 100%;
  font-size: 12px;
  line-height: 20px;
  color: #fff;
  text-align: center;
  background-color: #428bca;
  -webkit-box-shadow: inset 0 -1px 0 rgba(0, 0, 0, .15);
          box-shadow: inset 0 -1px 0 rgba(0, 0, 0, .15);
  -webkit-transition: width .6s ease;
          transition: width .6s ease;
}
```
#### 结构优化
虽然这样实现了基本进度条效果，但对于残障人员浏览网页有点困难，所以我们可以将结构做得更好些（语义化更友好些）：

```html
<div class="progress">
    <div class="progress-bar" style="width:40%;" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100">
        <span class="sr-only">40% Complete</span>
    </div>
</div>
```

1. role属性作用：告诉搜索引擎这个div的作用是进度条。
2. aria-valuenow="40"属性作用：当前进度条的进度为40%。
3. aria-valuemin="0"属性作用：进度条的最小值为0%。
4. aria-valuemax="100"属性作用：进度条的最大值为100%。

### 彩色进度条
在此称为彩色进度条，其主要包括以下四种：
  ☑ progress-bar-info：表示信息进度条，进度条颜色为蓝色
  ☑ progress-bar-success：表示成功进度条，进度条颜色为绿色
  ☑ progress-bar-warning：表示警告进度条，进度条颜色为黄色
  ☑ progress-bar-danger：表示错误进度条，进度条颜色为红色
#### 使用方法：
具体使用就非常简单了，只需要在基础的进度上增加对应的类名。如：

```html
<div class="progress">
    <div class="progress-bar progress-bar-success" style="width:40%"></div>
</div>
<div class="progress">
    <div class="progress-bar progress-bar-info" style="width:60%"></div>
</div>
<div class="progress">
    <div class="progress-bar progress-bar-warning" style="width:80%"></div>
</div>
<div class="progress">
    <div class="progress-bar progress-bar-danger" style="width:50%"></div>
</div>
```
![](http://img.mukewang.com/5419029300010f1806460117.jpg)

#### 实现原理
彩色进度条与基本进度条相比，就是进度条颜色做了一定的变化，其对应的样式代码如下：

```css
.progress-bar-success {
  background-color: #5cb85c;
}
/*其余类似*/
```

### 条纹进度条
#### 使用方法
条纹进度条采用CSS3的线性渐变来实现，并未借助任何图片。使用Bootstrap框架中的条纹进度条只需要在进度条的容器“progress”基础上增加类名**progress-striped**

示范：

```html
<div class="progress progress-striped">
    <div class="progress-bar progress-bar-success" style="width:40%"></div>
</div>
<div class="progress progress-striped">
    <div class="progress-bar progress-bar-info" style="width:60%"></div>
</div>
<div class="progress progress-striped">
    <div class="progress-bar progress-bar-warning" style="width:80%"></div>
</div>
<div class="progress progress-striped">
    <div class="progress-bar progress-bar-danger" style="width:50%"></div>
</div>
```
效果：
![](http://img.mukewang.com/541904a600011ac906590147.jpg)
#### 原理实现
主要使用的是CSS3的线性渐变，其具体代码如下：

```css
.progress-striped .progress-bar {
  background-image: -webkit-linear-gradient(45deg, rgba(255, 255, 255, .15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, .15) 50%, rgba(255, 255, 255, .15) 75%, transparent 75%, transparent);
  background-image:linear-gradient(45deg, rgba(255, 255, 255, .15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, .15) 50%, rgba(255, 255, 255, .15) 75%, transparent 75%, transparent);
  background-size: 40px 40px;
}
```
同样的，条纹进度条对应的每种状态也有不同的颜色，使用方法与彩色进度条一样。只是样式上做了一定的调整：

```css
.progress-striped .progress-bar-success {
  background-image: -webkit-linear-gradient(45deg, rgba(255, 255, 255, .15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, .15) 50%, rgba(255, 255, 255, .15) 75%, transparent 75%, transparent);
  background-image:linear-gradient(45deg, rgba(255, 255, 255, .15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, .15) 50%, rgba(255, 255, 255, .15) 75%, transparent 75%, transparent);
}
/*其余类似*/
```
### 动态条纹进度条
#### 使用方法
在进度条“progress progress-striped”两个类的基础上再加入**active**类名。如下代码：

```html
<div class="progress progress-striped active">
    <div class="progress-bar progress-bar-success" style="width:40%"></div>
</div>
```
#### 实现原理
其实现原理**主要通过CSS3的animation来完成**。首先通过@keyframes创建了一个progress-bar-stripes的动画，这个动画主要做了一件事，就是改变背景图像的位置，也就是background-position的值。因为条纹进度条是通过CSS3的线性渐变来制作的，而linear-gradient实现的正是对应背景中的背景图片。


```css
@-webkit-keyframes progress-bar-stripes {
  from {
    background-position: 40px 0;
  }
  to {
    background-position: 0 0;
  }
}
@keyframes progress-bar-stripes {
  from {
    background-position: 40px 0;
  }
  to {
    background-position: 0 0;
  }
}
```
@keyframes仅仅是创建了一个动画效果，如果要让进度条真正的动起来，我们需要通过一定的方式调用@keyframes创建的动画“progress-bar-stripes”，并且通过一个事件触发动画生效。在Bootstrap框架中，通过给进度条容器“progress”添加一个类名“active”，并让文档加载完成就触“progress-bar-stripes”动画生效。

调用动画对应的样式代码如下：

```css
.progress.active .progress-bar {
  -webkit-animation: progress-bar-stripes 2s linear infinite;
          animation: progress-bar-stripes 2s linear infinite;
}
```
**特别注意**：要让条纹进度条动起来，就需要让“progress-striped”和“active”同时运用，不然条纹进度条是不具备动效效果。

### 层叠进度条
层叠进度条，可以将不同状态的进度条放置在一起，按水平方式排列。具体使用如下：


```html
<div class="progress">
    <div class="progress-bar progress-bar-success" style="width:20%"></div>
    <div class="progress-bar progress-bar-info" style="width:10%"></div>
    <div class="progress-bar progress-bar-warning" style="width:30%"></div>
    <div class="progress-bar progress-bar-danger" style="width:15%"></div>
</div>
```
效果
![](http://img.mukewang.com/5419242a0001b6cc06660074.jpg)
**层叠进度条宽度之和不能大于100%，大于100%就会造成下面的不良效果**

除了层叠彩色进度条之外，还可以层叠条纹进度条，或者说条纹进度条和彩色进度条混合层叠，仅需要在“progress”容器中添加对应的进度条，同样要注意，层叠的进度条之和不能大于100%。来简单的看一个示例：

```html
<div class="progress">
    <div class="progress-bar progress-bar-success" style="width:20%"></div>
    <div class="progress-bar progress-bar-info" style="width:20%"></div>
    <div class="progress-bar progress-bar-warning" style="width:30%"></div>
    <div class="progress-bar progress-bar-danger" style="width:15%"></div>
</div>
<div class="progress">
    <div class="progress-bar progress-bar-success progress-bar-striped" style="width:20%"></div>
    <div class="progress-bar progress-bar-info progress-bar-striped" style="width:20%"></div>
    <div class="progress-bar progress-bar-striped progress-bar-warning" style="width:30%"></div>
    <div class="progress-bar progress-bar-danger progress-bar-striped" style="width:15%"></div>
</div>
<div class="progress">
    <div class="progress-bar progress-bar-success" style="width:20%"></div>
    <div class="progress-bar progress-bar-info progress-bar-striped" style="width:20%"></div>
    <div class="progress-bar progress-bar-warning" style="width:30%"></div>
    <div class="progress-bar progress-bar-danger progress-bar-striped" style="width:15%"></div>
</div>
```
注意添加的新类：**progress-bar-striped**
效果
![](http://img.mukewang.com/541924ce0001a3b606780144.jpg)

### 带Label的进度条
有很多时候是需要在进度条中直接用相关的数值向用户传递完成的进度值。
#### 使用方法
只需要在进度条中添加你需要的值，如：

```html
<div class="progress">
    <div class="progress-bar progress-bar-success"  role="progressbar" aria-valuenow="20" aria-valuemin="0" aria-valuemax="100" style="width:20%">20%</div>
</div>
```
效果
![](http://img.mukewang.com/541928420001baea06610148.jpg)

还有一种特殊情形，当进度条处于开始位置，也就是进度条的值为0%时，内容是否会撑开一定的宽度，让进度条具有颜色呢？如果是，这不是我们需要的效果，如果不是，又是怎么实现的呢？我们先来看一个这样的示例：

```html
<div class="progress">
    <div class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
</div>
```
效果
![](http://img.mukewang.com/541928ab0001b41506650064.jpg)

#### 原理分析
效果告诉我们，当进度为0%，进度条颜色并没有显示出来，那是因为Bootstrap在样式上做了一定的处理。

```css
.progress-bar[aria-valuenow="1"],
.progress-bar[aria-valuenow="2"] {
  min-width: 30px;
}
.progress-bar[aria-valuenow="0"] {
  min-width: 30px;
  color: #777;
  background-color: transparent;
  background-image: none;
  -webkit-box-shadow: none;
          box-shadow: none;
}
```

## 媒体对象
在Web页面或者说移动页面制作中，常常看到这样的效果，图片居左（或居右），内容居右（或居左）排列，如下图所示：
![](http://img.mukewang.com/54192a4d00014b6a06590154.jpg)
我们常常把这样的效果称为媒体对象。

### 默认媒体对象
#### 使用方法
媒体对象一般是成组出现，而一组媒体对象常常包括以下几个部分：
  ☑   媒体对像的容器：常使用“media”类名表示，用来容纳媒体对象的所有内容
  ☑  媒体对像的对象：常使用“media-object”表示，就是媒体对象中的对象，常常是图片
  ☑  媒体对象的主体：常使用“media-body”表示，就是媒体对像中的主体内容，可以是任何元素，常常是图片侧边内容
  ☑  媒体对象的标题：常使用“media-heading”表示，就是用来描述对象的一个标题，此部分可选
如下图所示：
![](http://img.mukewang.com/54192bd200016f6306660264.jpg)

除了上面四个部分之外，在Bootstrap框架中还常常使用“pull-left”或者“pull-right”来控制媒体对象中的对象浮动方式。
在具体使用中如下所示：

```html
<div class="media">
    <a class="pull-left" href="#">
        <img class="media-object" src="http://img.mukewang.com/52e1d29d000161fe06000338-300-170.jpg" alt="...">
    </a>
    <div class="media-body">
        <h4 class="media-heading">系列：十天精通CSS3</h4>
        <div>全方位深刻详解CSS3模块知识，代码同步调试，让网页穿上绚丽装备！</div>
    </div>
</div>
```
运行效果如下：
![](http://img.mukewang.com/54192c430001e72b06540183.jpg)

#### 原理分析
媒体对象样式相对来说比较简单，只是设置他们之间的间距，如下所示：

```css
.media,
.media-body {
  overflow: hidden;
  zoom: 1;
}
.media,
.media .media {
  margin-top: 15px;
}
.media:first-child {
  margin-top: 0;
}
.media-object {
  display: block;
}
.media-heading {
  margin: 0 0 5px;
}
.media > .pull-left {
  margin-right: 10px;
}
.media > .pull-right {
  margin-left: 10px;
}
```
### 媒体对象的嵌套
在评论系统中，常常能看到下图的效果：
![](http://img.mukewang.com/54192d740001e45706570246.jpg)

从外往里看，这里有三个媒体对象，只不过是一个嵌套在另一个的里面。那么在Bootstrap框架中的媒体对象也具备这样的功能，**只需要将另一个媒体对象结构放置在媒体对象的主体内“media-body”**，如下所示：


```html
<div class="media">
    <a class="pull-left" href="#">
        <img class="media-object" src="…" alt="...">
    </a>
    <div class="media-body">
        <h4 class="media-heading">Media Heading</h4>
        <div>…</div>
        <div class="media">
            <a class="pull-left" href="#">
                <img class="media-object" src="…" alt="...">
            </a>
            <div class="media-body">
                <h4 class="media-heading">Media Heading</h4>
                <div>…</div>
                <div class="media">
                    <a class="pull-left" href="#">
                        <img class="media-object" src="…" alt="...">
                    </a>
                    <div class="media-body">
                        <h4 class="media-heading">Media Heading</h4>
                        <div>...</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
```

### 媒体对象列表
媒体对象的嵌套仅是媒体对象中一个简单应用效果之一，在很多时候，我们还会碰到一个列表，每个列表项都和媒体对象长得差不多，同样用评论系统来说事：
![](http://img.mukewang.com/541930820001e33e06580376.jpg)
#### 使用方法
针对上图的媒体对象列表效果，Bootstrap框架提供了一个列表展示的效果，在写结构的时候可以使用ul，并且在ul上添加类名“media-list”，而在li上使用“media”，示例代码如下：

```html
<ul class="media-list">
    <li class="media">
        <a class="pull-left" href="#">
            <img class="media-object" src=" " alt="...">
        </a>
        <div class="media-body">
            <h4 class="media-heading">Media Header</h4>
            <div>…</div>
        </div>
    </li>
    <li class="media">…</li>
    <li class="media">…</li>
</ul>
```
#### 原理分析
媒体对象列表，在样式上也并没有做过多的特殊处理，只是把列表的左间距置０以及去掉了项目列表符号：

```css
media-list {
  padding-left: 0;
  list-style: none;
}
```

## 列表组
### 基础列表组
#### 使用方法
基础列表组，看上去就是去掉了列表符号的列表项，并且配上一些特定的样式。在Bootstrap框架中的基础列表组主要包括两个部分：
  ☑  list-group：列表组容器，常用的是ul元素，当然也可以是ol或者div元素
  ☑  list-group-item：列表项，常用的是li元素，当然也可以是div元素
来看一个简单的示例：

```html
<ul class="list-group">
    <li class="list-group-item">揭开CSS3的面纱</li>
    <li class="list-group-item">CSS3选择器</li>
    <li class="list-group-item">CSS3边框</li>
    <li class="list-group-item">CSS3背景</li>
    <li class="list-group-item">CSS3文本</li>
</ul>
```
效果
![](http://img.mukewang.com/541938050001335e06550202.jpg)
#### 原理分析
对于基础列表组并没有做过多的样式设置，主要设置了其间距，边框和圆角等：

```css
.list-group {
  padding-left: 0;
  margin-bottom: 20px;
}
.list-group-item {
  position: relative;
  display: block;
  padding: 10px 15px;
  margin-bottom: -1px;
  background-color: #fff;
  border: 1px solid #ddd;
}
.list-group-item:first-child {
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}
.list-group-item:last-child {
  margin-bottom: 0;
  border-bottom-right-radius: 4px;
  border-bottom-left-radius: 4px;
}
```
### 带徽章的列表组
#### 使用方法
带徽章的列表组**其实就是将Bootstrap框架中的徽章组件和基础列表组结合在一起的一个效果**。具体做法很简单，只需要在“list-group-item”中添加徽章组件“badge”：

```html
<ul class="list-group">
    <li class="list-group-item">
        <span class="badge">13</span>揭开CSS3的面
    </li>
    <li class="list-group-item">
        <span class="badge">456</span>CSS3选择器
    </li>
    <li class="list-group-item">
        <span class="badge">892</span>CSS3边框
    </li>
    <li class="list-group-item">
        <span class="badge">90</span>CSS3背景
    </li>
    <li class="list-group-item">
        <span class="badge">1290</span>CSS3文本
    </li>
</ul>
```
效果：
![](http://img.mukewang.com/541939cb000111e006550205.jpg)

#### 实现原理
实现效果非常简单，就是给徽章设置了一个右浮动，当然如果有两个徽章同时在一个列表项中出现时，还设置了他们之间的距离：

```css
.list-group-item > .badge {
  float: right;
}
.list-group-item > .badge + .badge {
  margin-right: 5px;
}
```
### 带链接的列表组
#### 使用方法
带链接的列表组，其实就是每个列表项都具有链接效果。大家可能最初想到的就是在基础列表组的基础上，给列表项的文本添加链接：

```html
<ul class="list-group">
    <li class="list-group-item">
        <a href="##">揭开CSS3的面</a>
    </li>
    <li class="list-group-item">
        <a href="##">CSS3选择器</a>
    </li>
    ...
</ul>
```
这样做有一个不足之处，就是链接的点击区域只在文本上有效。但很多时候，都希望在列表项的任何区域都具备可点击。这个时候就需要在链接标签上增加额外的样式：“display:block”；
虽然这样能解决问题，达到需求。但在Bootstrap框架中，还是采用了另一种实现方式。就是**将ul.list-group使用div.list-group来替换，而li.list-group-item直接用a.list-group-item来替换**。这样就可以达到需要的效果：

```html
<div class="list-group">
    <a href="##" class="list-group-item">图解CSS3</a>
    <a href="##" class="list-group-item"><span class="badge">220</span>Sass教程</a>
    <a href="##" class="list-group-item">玩转Bootstrap</a>
</div>
```
效果：
![](http://img.mukewang.com/54193f4d0001e76b06570137.jpg)
#### 实现原理
如果使用a.list-group-item时，在样式需要做一定的处理，比如说去文本下划线，增加悬浮效果等：

```css
a.list-group-item {
  color: #555;
}
a.list-group-item .list-group-item-heading {
  color: #333;
}
a.list-group-item:hover,
a.list-group-item:focus {
  color: #555;
  text-decoration: none;
  background-color: #f5f5f5;
}
```

### 自定义列表组
#### 使用方法
Bootstrap框加在链接列表组的基础上新增了两个样式：
  ☑  list-group-item-heading：用来定义列表项头部样式
  ☑  list-group-item-text：用来定义列表项主要内容
这两个样式最大的作用就是用来帮助开发者可以自定义列表项里的内容，如下面的示例：

```html
<div class="list-group">
    <a href="##" class="list-group-item">
        <h4 class="list-group-item-heading">图解CSS3</h4>
        <p class="list-group-item-text">...</p>
    </a>
    <a href="##" class="list-group-item">
        <h4 class="list-group-item-heading">Sass中国</h4>
        <p class="list-group-item-text">...</p>
    </a>
</div>
```
效果
![](http://img.mukewang.com/541941c700010e7a06490147.jpg)
#### 实现原理
这两个样式主要控制不同状态下的文本颜色：

```css
a.list-group-item .list-group-item-heading {
  color: #333;
}
/*bootstrap文件第4865行～第4874行*/
.list-group-item.disabled .list-group-item-heading,
.list-group-item.disabled:hover .list-group-item-heading,
.list-group-item.disabled:focus .list-group-item-heading {
  color: inherit;
}
.list-group-item.disabled .list-group-item-text,
.list-group-item.disabled:hover .list-group-item-text,
.list-group-item.disabled:focus .list-group-item-text {
  color: #777;
}
/*bootstrap.css文件第4883行～第4898行*/
.list-group-item.active .list-group-item-heading,
.list-group-item.active:hover .list-group-item-heading,
.list-group-item.active:focus .list-group-item-heading,
.list-group-item.active .list-group-item-heading > small,
.list-group-item.active:hover .list-group-item-heading > small,
.list-group-item.active:focus .list-group-item-heading > small,
.list-group-item.active .list-group-item-heading > .small,
.list-group-item.active:hover .list-group-item-heading > .small,
.list-group-item.active:focus .list-group-item-heading > .small {
  color: inherit;
}
.list-group-item.active .list-group-item-text,
.list-group-item.active:hover .list-group-item-text,
.list-group-item.active:focus .list-group-item-text {
  color: #e1edf7;
}
/*bootstrap.css文件第4987行～第4994行*/
.list-group-item-heading {
  margin-top: 0;
  margin-bottom: 5px;
}
.list-group-item-text {
  margin-bottom: 0;
  line-height: 1.3;
}
```
### 列表项的状态设置
#### 使用方法
Bootstrap框架也给组合列表项提供了状态效果，特别是链接列表组。比如常见状态和禁用状态等。实现方法和前面介绍的组件类似，在列表组中只需要在对应的列表项中添加类名：
  ☑  active：表示当前状态
  ☑  disabled：表示禁用状态
来看个示例：

```html
<div class="list-group">
    <a href="##" class="list-group-item active"><span class="badge">5902</span>图解CSS3</a>
    <a href="##" class="list-group-item"><span class="badge">15902</span>W3cplus</a>
    <a href="##" class="list-group-item"><span class="badge">59020</span>慕课网</a>
    <a href="##" class="list-group-item disabled"><span class="badge">0</span>Sass中国</a>
</div>
```
效果
![](http://img.mukewang.com/5419437d0001b70006400218.jpg)
#### 实现原理
在样式上主要对列表项的背景色和文本做了样式设置：

```css
.list-group-item.disabled,
.list-group-item.disabled:hover,
.list-group-item.disabled:focus {
  color: #777;
  background-color: #eee;
}
/*bootstrap.css文件第4875行～第4882行*/
.list-group-item.active,
.list-group-item.active:hover,
.list-group-item.active:focus {
  z-index: 2;
  color: #fff;
  background-color: #428bca;
  border-color: #428bca;
}
```
### 多彩列表组
#### 使用方法
列表组组件和警告组件一样，Bootstrap为不同的状态提供了不同的背景颜色和文本色，可以使用这几个类名定义不同背景色的列表项。
  ☑  list-group-item-success：成功，背景色绿色
  ☑  list-group-item-info：信息，背景色蓝色
  ☑  list-group-item-warning：警告，背景色为黄色
  ☑  list-group-item-danger：错误，背景色为红色
如果你想给列表项添加什么背景色，只需要在“list-group-item”基础上增加对应的类名：

```html
<div class="list-group">
    <a href="##" class="list-group-item active"><span class="badge">5902</span>图解CSS3</a>
    <a href="##" class="list-group-item list-group-item-success"><span class="badge">15902</span>W3cplus</a>
    <a href="##" class="list-group-item list-group-item-info"><span class="badge">59020</span>慕课网</a>
    <a href="##" class="list-group-item list-group-item-warning"><span class="badge">0</span>Sass中国</a>
    <a href="##" class="list-group-item list-group-item-danger"><span class="badge">10</span>Mobile教程</a>
</div>
```
效果
![](http://img.mukewang.com/5419452b0001826206350276.jpg)
#### 实现原理
同样的，这几个类名仅修改了背景色和文本色：

```css
.list-group-item-success {
  color: #3c763d;
  background-color: #dff0d8;
}
a.list-group-item-success {
  color: #3c763d;
}
a.list-group-item-success .list-group-item-heading {
  color: inherit;
}
a.list-group-item-success:hover,
a.list-group-item-success:focus {
  color: #3c763d;
  background-color: #d0e9c6;
}
a.list-group-item-success.active,
a.list-group-item-success.active:hover,
a.list-group-item-success.active:focus {
  color: #fff;
  background-color: #3c763d;
  border-color: #3c763d;
}
```

## 面板
### 基础面板
基础面板非常简单，就是一个div容器运用了“panel”样式，产生一个具有边框的文本显示块。由于“panel”不控制主题颜色，所以在“panel”的基础上增加一个控制颜色的主题“panel-default”，另外在里面添加了一个“div.panel-body”来放置面板主体内容：

```html
<div class="panel panel-default">
    <div class="panel-body">我是一个基础面板，带有默认主题样式风格</div>
</div>
```
原理，“panel“主要对边框，间距和圆角做了一定的设置：


```css
.panel {
  margin-bottom: 20px;
  background-color: #fff;
  border: 1px solid transparent;
  border-radius: 4px;
  -webkit-box-shadow: 0 1px 1px rgba(0, 0, 0, .05);
          box-shadow: 0 1px 1px rgba(0, 0, 0, .05);
}
.panel-body {
  padding: 15px;
}
```
### 带有头和尾的面板
基础面板看上去太简单了，Bootstrap为了丰富面板的功能，特意为面板增加“面板头部”和“页面尾部”的效果：
   ☑  panel-heading：用来设置面板头部样式
   ☑ panel-footer：用来设置面板尾部样式

```html
<div class="panel panel-default">
    <div class="panel-heading">图解CSS3</div>
    <div class="panel-body">…</div>
    <div class="panel-footer">作者：大漠</div>
</div>
```
效果
![](http://img.mukewang.com/5419500b00017cc706440219.jpg)

原理分析：
panel-heading和panel-footer也仅仅间距和圆角等样式进行了设置：

```css
.panel-heading {
  padding: 10px 15px;
  border-bottom: 1px solid transparent;
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
}
.panel-heading > .dropdown .dropdown-toggle {
  color: inherit;
}
.panel-title {
  margin-top: 0;
  margin-bottom: 0;
  font-size: 16px;
  color: inherit;
}
.panel-title > a {
  color: inherit;
}
.panel-footer {
  padding: 10px 15px;
  background-color: #f5f5f5;
  border-top: 1px solid #ddd;
  border-bottom-right-radius: 3px;
  border-bottom-left-radius: 3px;
}
```
### 彩色面板
在Bootstrap框架中面板组件除了默认的主题样式之外，还包括以下几种主题样式，构成了一个彩色面板：
  ☑  panel-primary：重点蓝
  ☑  panel-success：成功绿
  ☑ panel-info:信息蓝
  ☑ panel-warning：警告黄
  ☑ panel-danger：危险红
使用方法就很简单了，只需要在panel的类名基础上增加自己需要的类名：

```html
<div class="panel panel-default">
    <div class="panel-heading">图解CSS3</div>
    <div class="panel-body">…</div>
    <div class="panel-footer">作者：大漠</div>
</div>
<div class="panel panel-primary">…</div>
<div class="panel panel-success">…</div>
<div class="panel panel-info">…</div>
<div class="panel panel-warning">…</div>
<div class="panel panel-danger">…</div>
```
效果
![](http://img.mukewang.com/541951700001139606510546.jpg)

### 面板中嵌套表格
一般情况下可以把面板理解为一个区域，在使用面板的时候，都会**在panel-body放置需要的内容，可能是图片、表格或者列表等**。来看看面板中嵌套表格和列表组的一个效果。首先来看嵌套表格的效果：


```html
<div class="panel panel-default">
    <div class="panel-heading">图解CSS3</div>
    <div class="panel-body">
    <p>详细讲解了选择器、边框、背景、文本、颜色、盒模型、伸缩布局盒模型、多列布局、渐变、过渡、动画、媒体、响应Web设计、Web字体等主题下涵盖的所有CSS3新特性
    </p>
    <table class="table table-bordered">
        <thead>
            <tr>
                <th>＃</th>
                <th>我的书</th>
                <th>发布时间</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>1</td>
                <td>《图解CSS3》</td>
                <td>2014-07-10</td>
            </tr>
        </tbody>
    </table>
    </div>
    <div class="panel-footer">作者：大漠</div>
</div>
```
效果
![](http://img.mukewang.com/541954b90001781f06520370.jpg)

在实际应用运中，你或许希望表格和面板边缘不需要有任何的间距。但由于panel-body设置了一个padding：15px的值，为了实现这样的效果。我们在实际使用的时候需要把table提取到panel-body外面：

```html
<div class="panel panel-default">
    <div class="panel-heading">图解CSS3</div>
    <div class="panel-body">…</div>
    <table class="table table-bordered">…</table>
    <div class="panel-footer">作者：大漠</div>
</div>
```
效果
![](http://img.mukewang.com/541955440001d27206510331.jpg)

### 面板中嵌套列表组
示范：

```html
<div class="panel panel-default">
    <div class="panel-heading">图解CSS3</div>
    <div class="panel-body">
        <p>详细讲解了选择器、边框、背景、文本、颜色、盒模型、伸缩布局盒模型、多列布局、渐变、过渡、动画、媒体、响应Web设计、Web字体等主题下涵盖的所有CSS3新特性
        </p>
        <ul class="list-group">
            <li class="list-group-item">我是列表项</li>
            <li class="list-group-item">我是列表项</li>
            <li class="list-group-item">我是列表项</li>
        </ul>
    </div>
    <div class="panel-footer">作者：大漠</div>
</div>
```
效果
![](http://img.mukewang.com/541957920001280d06600435.jpg)
和嵌套表格一样，如果你觉得这样有间距不好看，你完全可以把列表组提取出来：

```html
<div class="panel panel-default">
    <div class="panel-heading">图解CSS3</div>
    <div class="panel-body">…</div>
    <ul class="list-group">
        <li class="list-group-item">我是列表项</li>
        <li class="list-group-item">我是列表项</li>
        <li class="list-group-item">我是列表项</li>
    </ul>
    <div class="panel-footer">作者：大漠</div>
</div>
```
![](http://img.mukewang.com/541957ed000127f106440360.jpg)

# Bootstrap支持的JavaScript插件
## 导入JavaScript插件
Bootstrap的JavaScript插件可以单独导入到页面中，也可以一次性导入到页面中。因为在Bootstrap中的JavaScript插件都是依赖于jQuery库，所以不论是单独导入还一次性导入之前必须先导入jQuery库。

1. 一次性导入：Bootstrap提供了一个单一的文件，这个文件包含了Bootstrap的所有JavaScript插件，即bootstrap.js（压缩版本：bootstrap.min.js）。
2. 单独导入。为方便单独导入特效文件，Bootstrap V3.2中提供了12种JavaScript插件，他们分别是：
	1. 动画过渡（Transitions）:对应的插件文件“transition.js”
	2. 模态弹窗（Modal）:对应的插件文件“modal.js”
	3. 下拉菜单（Dropdown）：对应的插件文件“dropdown.js”
	4. 滚动侦测（Scrollspy）：对应的插件文件“scrollspy.js”
	5. 选项卡（Tab）：对应的插件文件“tab.js”
	6. 提示框（Tooltips）：对应的插件文件“tooltop.js”
	7. 弹出框（Popover）：对应的插件文件“popover.js”
	8. 警告框（Alert）：对应的插件文件“alert.js”
	9. 按钮（Buttons）：对应的插件文件“button.js”
	10. 折叠/手风琴（Collapse）：对应的插件文件“collapse.js”
	11. 图片轮播Carousel：对应的插件文件“carousel.js”
	12. 自动定位浮标Affix：对应的插件文件“affix.js”

上述单独插件的下载可到github的[bootstrap仓库](https://github.com/twbs/bootstrap)去下载。


