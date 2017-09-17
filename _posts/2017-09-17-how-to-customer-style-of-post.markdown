---
title: "如何定制Jekyll文章中的样式"
img: himalayan.jpg # Add image post (optional)
date: 2017-09-17 12:55:00 +0800
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [TOOL,Jekyll]
---

前言
===
这两天在搭建`Jekyll`，然后利用`Markdown`来写文章，挑了一个喜欢的模板，本来一切都挺好的。然后发现操蛋的来了，这个模板的代码块样式和链接样式那叫一个丑。我又不舍得换模板，只能想着怎么把这些样式给定制。经过一番折腾，总结了一些小经验，但是感觉我的这种方法太暴力，应该会有更方便的方法，以后慢慢继续琢磨吧。

### 这些样式是在哪定义的
最好的办法就是打开控制台，定位到代码块和链接，然后就可以看到这些规则是在哪个css文件里的。在我这个模板里，是在`assets/css/main.css`这里定义的。

### 修改样式
#### 链接样式
   原模板里的样式有下划线、颜色还是红色的。。 于是直接在`main.css`中修改了这些规则，搞定
#### 代码块样式
如果用的是`Markdown`写文章，那么`Jekyll`中的代码块样式是由`_config.yml`中定义的`Markdown`解析引擎决定的，默认是`kramdown`。
我用的这个模板里定义的代码块语法高亮样式不是我喜欢的，搜索了一下，发现可以在一个[Pygments](http://pygments.org/demo/3666780/?style=native)上找自己喜欢的样式，然后打开控制台可以下载对应的`pygments.css`。

1. 把这个css文件放到项目根目录的`assets/css/`某个目录下
2. 找到`/_includes/head.html`，在`main.css`下面添加这个css文件的链接
3. 运行`jekyll serve` 预览一下，发现没有变化，于是继续使用控制台调查原因，原来是我们的`pygments.css`中的规则优先级没有`main.css`中的高。这就蛋疼了，前者是我们下载的第三方css文件，不大建议修改它，暂时我想到的办法就是修改`main.css`，把跟代码高亮相关的规则全部注释了。之后发现一切都正常了，是我们想要的效果了。

对于第三点，个人感觉应该可以配置某些变量，使得`main.css`和`pygments.css`中关于代码高亮的规则一致，这样就直接能覆盖了，后续继续研究吧。
