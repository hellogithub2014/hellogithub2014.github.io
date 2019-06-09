---
title: vscode插件开发
date: 2019-06-09 22:04:31
summary_img: /images/alaska.jpg
tags: [vscode, plugin]
---

本文的目的是总结`vscode`的插件开发入门，之前一直以为开发插件是一件很难的事情，后来工作上需要搞一个效率小工具，就试着找了些资料来入门，发现其实就入门和开发一些简单功能拆件来说难度还是很低的。因为`vscode`本身是基于`electron`开发的，所以总体来说开发插件就是在写`node`代码，额外再加一些编辑器`api`，插件发布的过程和`npm`包的发布很类似。`vscode`官方提供的脚手架还帮忙加上了调试配置，调试非常方便。下面就来说下具体步骤，在学习的过程中参考了一些博客，放在了最后面。

# 环境准备

这个很简单，我就直接拷贝过来了。

- `nodejs`: 建议使用 `LTS` 版本
- `npm`: 建议最新版本
- `yeoman` : `npm install -g yo`
- `generator-code` : `npm install -g generator-code`

另外小`TIPS`，我们平时直接安装的插件所在目录是`~/.vscode/extensions`，有兴趣的可以看看这些插件是怎么实现的。

# 脚手架

安装的`yo`可以直接生成一个`Hello World`版本的插件目录。执行

```sh
yo code
```

即会提示一些问题，按照个人喜好填写即可，最后会生成样板代码:

```sh
.
├── CHANGELOG.md 插件变更记录
├── README.md
├── extension.js 插件入口文件
├── jsconfig.json 编辑器关于js的配置
├── package.json 全局配置
├── test 测试代码文件夹
│   ├── extension.test.js
│   └── index.js
├── vsc-extension-quickstart.md 新手介绍
└── yarn.lock
```

其中的`quickstart.md`是新手引导，里面包含了对文件的作用解析、如何运行插件、测试插等等，推荐去看一看，我们在下面也会介绍一些。除此之外在`package.json`里也包含了很多非常重要的信息：

```json
{
  "name": "hello-world", // 插件名
  "displayName": "hello-world",
  "description": "hello world", // 插件描述
  "version": "0.0.1",
  "engines": {
    "vscode": "^1.35.0" // 运行插件需要vscode最低版本
  },
  "categories": ["Other"],
  "activationEvents": ["onCommand:extension.helloWorld"], // 如何激活插件:在命令面板(Command+Shift+P吊起)输入helloWorld
  "main": "./extension.js", // 插件入口
  "contributes": {
    "commands": [
      // 此数组表示插件支持的所有命令
      {
        "command": "extension.helloWorld", // 命令对应的Command，需要和代码里保持一致
        "title": "Hello World" // 命令的显示名称
      }
    ]
  },
  "scripts": {
    // 正常的npm script
    "postinstall": "node ./node_modules/vscode/bin/install",
    "test": "node ./node_modules/vscode/bin/test"
  },
  "devDependencies": {
    // 依赖包
    "typescript": "^3.3.1",
    "vscode": "^1.1.28",
    "eslint": "^5.13.0",
    "@types/node": "^10.12.21",
    "@types/mocha": "^2.2.42"
  }
}
```

# 启动、调试插件

脚手架生成的其实就是一个`node`应用，并且贴心的帮我们加了调试配置，直接按`F5`即可运行。对配置感兴趣的也可以查看根目录下的`.vscode/launch.json`。

跑起来以后默认会新开一个`vscode`窗口，然后会发现什么都没有发生，这是由插件的启动方式决定的，配置于`package.json`里的`activationEvents`项。常用的有：

- `onLanguage` 在打开特定语言类型的文件后激活
- `onCommand` 在执行特定命令后激活

由于我们的插件是配置的`onCommand`启动，并且指定的命令名是`Hello World`，所以我们在**新开**的`vscode`窗口中按下快捷键`Command+Shift+P`后再找到`Hello World`,选中并执行即可。

![helloworld-command](helloworld-command.png)

最后顺利的话，编辑器右下角会弹出`Hello World!`。

![helloworld-message](helloworld-message.png)

如果细心的话，还会在源窗口的控制台的`调试控制台`tab 中看到如下输出：

```sh
Congratulations, your extension "hello-world" is now active!
```

这个就是由插件的真正代码部分输出的了。我们接下来看看`extension.js`的内容：

## extension.js

```js
// vscode编辑器api入口
const vscode = require('vscode');

/**
 * 此生命周期方法在插件激活时执行
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // console的各种方法都是输出在`调试控制台`tab下
  console.log('Congratulations, your extension "hello-world" is now active!');

  // registerCommand用于注册命令并提供具体逻辑，命令名需要和package.json里写的一致。
  // 回调函数在命令被触发时执行。
  let disposable = vscode.commands.registerCommand('extension.helloWorld', function() {
    // 在编辑器右下角展示一个message box
    vscode.window.showInformationMessage('Hello World!');
  });

  // 将registerCommand的返回值放入subscriptions可以自动执行内存回收逻辑。
  context.subscriptions.push(disposable);
}
exports.activate = activate;

// 当插件被设置为无效时执行此生命周期钩子
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
```

以上就是此插件的完整逻辑了，配置注释是很简单的。可以看到主要就是两个生命周期函数，另外搭配一些编辑器`api`就完成了。接下来的部分会介绍一些更多的细节，没有先后顺序依赖，大家可以选择自己感兴趣的。

# Command 配置

## 右键菜单

## 快捷键

# 常见编辑器 api

## messgae

## input box

## quickInput

## staus bar

## file selector

## hover

## selection

# http 请求

# snippets

# 发布

## 本地打包

## 发布到插件市场

## 版本升级

## readme 内图片展示

涉及到`gitlab`代码仓库，因为仓库在内网，所以需要将图片替换为公网`cdn`上的路径。

# 参考文章

1. [VSCode 插件开发急速入门](https://juejin.im/entry/5b50509d5188251967307780)
2. [VSCode 插件开发全攻略系列](https://www.cnblogs.com/liuxianan/p/vscode-plugin-overview.html)
