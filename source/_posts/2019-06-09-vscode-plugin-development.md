---
title: vscode插件开发
date: 2019-06-09 22:04:31
summary_img: /images/alaska.jpg
tags: [vscode, plugin]
---

本文的目的是总结`vscode`的插件开发入门，之前一直以为开发插件是一件很难的事情，后来工作上需要搞一个效率小工具，就试着找了些资料来入门，发现其实就入门和开发一些简单功能拆件来说难度还是很低的。因为`vscode`本身是基于`electron`开发的，所以总体来说开发插件就是在写`node`代码，额外再加一些编辑器`api`，插件发布的过程和`npm`包的发布很类似。`vscode`官方提供的脚手架还帮忙加上了调试配置，调试非常方便。下面就来说下具体步骤，在学习的过程中参考了一些博客，放在了最后面。

# 环境准备

这个很简单，我就直接拷贝过来了。

* `nodejs`: 建议使用 `LTS` 版本
* `npm`: 建议最新版本
* `yeoman` : `npm install -g yo`
* `generator-code` : `npm install -g generator-code`

另外小`TIPS`，我们平时直接安装的插件所在目录是`~/.vscode/extensions`，有兴趣的可以看看这些插件是怎么实现的。

# 脚手架

安装的`yo`可以直接生成一个`Hello World`版本的插件目录。执行

```sh
yo code
```

即会提示一些问题，按照个人喜好填写即可，最后会生成样板代码:

```sh

```

其中的`quickstart.md`是新手引导，里面包含了对文件的作用解析、如何运行插件、测试插等等，推荐去看一看，我们在下面也会介绍一些。

# 启动、调试插件

脚手架生成的其实就是一个`node`应用，并且贴心的帮我们加了调试配置，直接按`F5`即可运行。对配置感兴趣的也可以查看根目录下的`.vscode/launch.json`。

# 参考文章

1. [VSCode插件开发急速入门](https://juejin.im/entry/5b50509d5188251967307780)
2. [VSCode插件开发全攻略系列](https://www.cnblogs.com/liuxianan/p/vscode-plugin-overview.html)
