---
title: vscode插件开发
date: 2019-06-09 22:04:31
summary_img: /images/alaska.jpg
tags: [vscode, plugin]
---

本文的目的是总结`vscode`的插件开发入门，之前一直以为开发插件是一件很难的事情，后来工作上需要搞一个效率小工具，就试着找了些资料来入门，发现其实就入门和开发一些简单功能的插件来说难度还是很低的。因为`vscode`本身是基于`electron`开发的，所以总体来说开发插件就是在写`node`代码，额外再加一些编辑器`api`，插件发布的过程和`npm`包的发布很类似。`vscode`官方提供的脚手架还帮忙加上了调试配置，调试非常方便。下面就来说下具体步骤，在学习的过程中参考了一些博客，放在了最后面。

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
  "activationEvents": ["onCommand:extension.helloWorld"], // 如何激活插件:在命令面板(Command+Shift+P吊起)输入helloWorld. 注意command名需要在contributes.commands中有配置
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

## 启动运行

脚手架生成的其实就是一个`node`应用，直接按`F5`即可运行。对配置感兴趣的也可以查看根目录下的`.vscode/launch.json`。

跑起来以后默认会新开一个`vscode`窗口，然后会发现什么都没有发生，这是由插件的启动方式决定的，配置于`package.json`里的`activationEvents`项。常用的有：

- `onLanguage` 在打开特定语言类型的文件后激活
- `onCommand` 在执行特定命令后激活

由于我们的插件是配置的`onCommand`启动，并且指定的命令名是`Hello World`，所以我们在**新开**的`vscode`窗口中按下快捷键`Command+Shift+P`后再找到`Hello World`,选中并执行即可。

![helloworld-command](/images/vscode-plugin/helloworld-command.png)

最后顺利的话，编辑器右下角会弹出`Hello World!`。

![helloworld-message](/images/vscode-plugin/helloworld-message.png)

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

以上就是此插件的完整逻辑了，配置注释是很简单的。可以看到主要就是两个生命周期函数，另外搭配一些编辑器`api`就完成了。

## 调试

脚手架已经贴心的帮我们加了调试配置，我们只用添加断点即可：

![debug](/images/vscode-plugin/debug.png)

# Command 配置

上面提到了生成一个`command`只需要 2 步，先是利用`vscode.commands.registerCommand`注册一个，然后再到`package.json`里的`contributes.commands`中配置即可。围绕`command`还可以做一些其他事情，最常见的就是配置右键菜单和快捷键。

## 右键菜单

表示右键的菜单里出现指定`command`，配置方法：

```js
"contributes":{
  "menus": {
    "editor/context": [
      {
        "when": "editorHasSelection && resourceFilename =~ /.js|.vue|.ts/", // 出现时机，当编辑器中有选中文本同时文件名后缀是js/vue/ts
        "command": "extension.starling_textSearch", // 需要在`contributes.commands`存在此命令
        "group": "6_Starling" // 命令所在的组，右键菜单可以分组，组与组之间存在分隔线
      },
    ]
  }
}
```

![右键菜单](/images/vscode-plugin/menu_cmd.png)

## 快捷键

有了快捷键后，就不用每次在命令面板里查找并运行命令了，同样是在`package.json`中配置：

```js
"contributes": {
  "keybindings": [
    {
      "command": "extension.starling_textSearch",
      "key": "ctrl+f11", // 在Windows上的快捷键
      "mac": "cmd+f11", // 在mac上的快捷键
      "when": "editorTextFocus" // 出现时机， 当编辑器焦点在某个文本中
    }
  ],
}
```

# 发布

主要参考的是[官方文档](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)

首先需要安装`vsce`工具：

```sh
npm install -g vsce
```

## 本地打包

将插件打包成`.vsix`文件。

```sh
vsce package
```

会在项目根目录生成`hello-world-0.0.1.vsix`，然后在编辑器的插件面板选择`从VSIX安装`即可：

![install-from-vsix](/images/vscode-plugin/install-from-vsix.png)

## 发布到插件市场

1. 需要获取一个`token`，参考[官方文档](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)

2. 利用`token`创建一个`publisher`，这是在插件市场的用户

```sh
vsce create-publisher (publisher name)
```

3. 本地登录此用户

```sh
vsce login (publisher name)
```

4. 发布插件

```sh
vsce publish
```

顺利的话在控制台会提示发布成功，然后过几分钟就可以在插件市场搜到自己的插件啦！😄

## 版本升级

当插件内容发生变更时，重新发布时最好更新版本号，`vsce`可以遵循语义化版本指定升级大(`major`)/小(`minor`)/补丁(`patch`)版本，也可以直接指定版本号。例如只升级小版本：

```sh
vsce publish
```

如果插件代码在`gitlab`上，因为仓库在内网，需要事先将`README`里的图片替换为公网`cdn`上的路径。

# snippets

`snippets`是代码片段，可以理解为代码快捷键，在输入很少量触发代码后即可联想出一大坨关联代码，非常方便。对于`js`、`ts`、`vue`都可以在插件市场找到非常多的`snippets`插件。

开发`snippets`只用两步：

1. 编写`snippets`映射文件，它是一个`json`，例如`javascript.json`：

```json
{
  "this$t": {
    "prefix": "tt'", // 触发代码
    "body": [
      // 联想出来的关联代码
      "this.\\$t('${1:key}')" // ${1: key} 是占位符，联想出来后会自动聚焦在这里
    ],
    "description": "this.$t" // snippets描述，当有多个匹配的代码片段时，可以用来识别
  }
}
```

2. 在`package.json`中配置

```js
"contributes": {
  "snippets": [
    {
      "language": "javascript", // 代码片段起作用的语言类型
      "path": "./src/snippets/javascript.json" // 对应的映射文件
    }
  ]
}
```

最后就可以在编辑器看到效果了：

![snippets](/images/vscode-plugin/snippets.gif)

更多细节参考[snippets-syntax](https://code.visualstudio.com/docs/editor/userdefinedsnippets#_snippet-syntax)

# 插件默认配置

很多插件是需要一些额外配置才能工作的，设置默认配置同样在`package.json`里：

```json
"contributes": {
  "configuration": { // 默认配置
    "type": "object",
    "title": "",
    "required": [
      "sid"
    ],
    "properties": {
      "includes": {
        "type": "Array",
        "default": [
          "json"
        ],
        "description": "文件类型过滤器"
      }
    }
  },
}
```

默认配置是`json schema`格式，在覆盖默认配置时如果校验出错会有提示。

插件中使用`getConfiguration`来读取配置：

```js
function getConfig() {
  const config = vscode.workspace.getConfiguration();
  const includes: string[] | undefined = config.get('includes'); // 获取指定配置项

  return {
    includes: includes || [],
  };
}
```

## 监听配置项修改

在用户安装了插件后，可能会修改配置，如何实时监听配置项的修改呢？ `vscode`提供了`onDidChangeConfiguration`事件监听。

```js
vscode.workspace.onDidChangeConfiguration(function(event) {
  const configList = ['includes'];
  // affectsConfiguration: 判断是否变更了指定配置项
  const affected = configList.some(item => event.affectsConfiguration(item));
  if (affected) {
    // do some thing ...
  }
});
```

# 常见编辑器 api

所有`vscode`相关`api`都可以在官网文档查找，`vscode`内部也集成了`.d.ts`文件，直接跳转定义即可。这里只列举一些常见的`api`.

## messgae

用于展示提示性消息，出现在编辑器右下角，而不是顶部或右上角。

和`console`类似，提供了普通消息、警告消息、错误消息。

```js
vscode.window.showInformationMessage('普通消息');
vscode.window.showWarningMessage('警告消息');
vscode.window.showErrorMessage('错误消息');
```

消息也支持交互按钮，当选中按钮时返回的是按钮本身：

```js
vscode.window.showErrorMessage(`与starling的远程交互依赖vscode-starling.sid配置项`, '打开配置项').then(selection => {
  if (selection === '打开配置项') {
    vscode.commands.executeCommand('workbench.action.openSettings');
  }
});
```

![message-interactive](message-interactive.png)

## input box

## quickInput

## staus bar

## file selector

## hover

## selection

## FileSystemWatcher

# 参考文章

1. [VSCode 插件开发急速入门](https://juejin.im/entry/5b50509d5188251967307780)
2. [VSCode 插件开发全攻略系列](https://www.cnblogs.com/liuxianan/p/vscode-plugin-overview.html)
3. [vscode api](https://code.visualstudio.com/api)
4.
