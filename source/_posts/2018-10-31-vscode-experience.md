---
title: 'vscode使用经验'
img: nevada.jpg # Add image post (optional)
date: 2018-10-31 15:20:00

tag: [vscode]
---

看到很多同事都在用 vscode，但一些人没有体会到它的威力，只把它当做普通的编辑器来用，忽略了它最大的特性：插件。 事实上配合一些插件，可以让开发效率得到很大提升。 本文总结个人在使用`vscode`时用的最多的那些插件和快捷键，希望可以帮助到大家 😄。

# 快捷键

[mac 上的快捷键](https://code.visualstudio.com/shortcuts/keyboard-shortcuts-macos.pdf)

每个人习惯的快捷键都不同，这里列举一些个人在平时工作中用的最多的，它们都帮助我提高了开发效率。

1. `Command+\` 编辑器分栏，个人认为这个快捷键可以让工作效率大大提升，适合在宽屏幕上使用
2. `Command+P` 快速跳转到任意文件，有了它完全可以解放侧边栏，让代码编辑器更大，而且查找文件的效率快得多！
3. `Command+Shift+P` 调用命令板，各种插件和 vscode 自带的命令，都会放在这里，例如实用的`Transform To UpperCase`将变量转为全大写
4. `Command+Shift+F` 在所有文件中查找/替换，可以设置`include`和`exclude`
5. `Option+Command+F` 在当前文件中执行查找/替换
6. `Command+,` 打开编辑器配置
7. `Option+Command+←` 打开左侧 tab（chrome 也是这个快捷键打开左侧 tab）
8. `Option+Command+→` 打开右侧 tab
9. `Control+ -` 返回，例如从函数名跳转到定义后，可以使用此快捷键快速返回到函数名
10. `Command+B` 收起侧边栏

# 插件

点击插件名会跳转至插件市场，vscode 中使用快捷键`Command+Shift+X`打开所有已安装插件。

#### [Auto Close Tag](https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-close-tag)

自动添加`html`标签的结束标签,这样只用写一个开始标签就行，省一些打字时间。

![](https://github.com/formulahendry/vscode-auto-close-tag/raw/master/images/usage.gif)

#### [Auto Rename Tag](https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-rename-tag)

自动重命名`html`标签，只用修改起始、闭合标签的其中一个，另一个会自动修改。

![](https://github.com/formulahendry/vscode-auto-rename-tag/raw/master/images/usage.gif)

#### [Beautify css/sass/scss/less](https://marketplace.visualstudio.com/items?itemName=michelemelluso.code-beautifier)

自动格式化`css/sass/scss/less`，默认情况下例如`.scss`文件，vscode 是不能格式化的，此插件可以在保存时自动帮我们格式化。

#### [Complete JSDoc Tags](https://marketplace.visualstudio.com/items?itemName=HookyQR.JSDocTagComplete)

自动生成符合`JS Doc`规范的注释，在函数名上方输入`/** */`即可触发。

若同时安装[Document This](https://marketplace.visualstudio.com/items?itemName=joelday.docthis)这个插件，就可以结合`TypeScript`使用，会将参数类型也自动填充到注释中。之后在使用到函数的地方，鼠标悬浮上去会显示具体注释。支持快捷键： 连续按两次`Ctrl+Alt+D`

![](/images/vscode-experience/complete-jsdoc-tag-1.png)

![](/images/vscode-experience/complete-jsdoc-tag-2.png)

![](https://github.com/joelday/vscode-docthis/raw/master/images/demo.gif)

不过发现只能在`.js`、`.ts`文件中有作用，在`.vue`文件中会报错，暂时没有找到别的插件可以在`.vue`替代。

#### [eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

具体配置见插件官网即可。它可以帮助自动检查 eslint 的错误并标红，同时提供了命令自动修复大部分错误，若项目中使用的是 eslint 来进行代码检查，强力推荐此插件。

默认情况下不会对`.vue`文件进行检查，需要进行一下配置：

```js
"eslint.validate": [
    "javascript",
    {
      "language": "vue",
    }
  ],
```

另外还提供了一个`autoFixOnSave`配置，可以在保存时自动修复 eslint 错误，不过个人使用了一段时间觉得不大好，频繁自动修复会导致`cpu`占用变的很高，然后出现卡顿。替代方案是使用提供的命令：先快捷键`Command+Shift+P`调出命令板，然后选择`Eslint: Fix all auto-fixable problems`，它会尽力帮我们修复所有的错误，不过有时候需要多按几次才能全部修复完。。。

![](/images/vscode-experience/eslint-auto-fix.png)

#### [eslint-disable-snippets](https://marketplace.visualstudio.com/items?itemName=drKnoxy.eslint-disable-snippets)

配合`eslint`使用的，没有这个插件，在需要禁用一些`eslint`规则时就得手动 copy，有了它就可以使用它提供的`snippets`自动填充这些重复的字母了。

![](https://github.com/drKnoxy/eslint-disable-snippets/raw/master/images/disable-block.gif)

#### Git 相关

##### 自带 git 功能

vscode 已经内置 git，可以完成的功能有：

> Review diffs, stage files, and make commits right from the editor. Push and pull from any hosted SCM service.

![](/images/vscode-experience/built-in-git.png)

从个人使用体验来说，确实已经满足了绝大部分需求。**在遇到代码冲突时，也会在左侧面板展示所有存在冲突的文件，不用费力一个个去查找。**

再借助一些强大的插件，完全不需要其他的`GUI`了，至少我的`sourcetree`已经几个月没有打开了 😄~~~

##### [Git History](https://marketplace.visualstudio.com/items?itemName=donjayamanne.githistory)

借助这个插件可以很方便的浏览仓库的提交历史、某个文件的历史以及某一行的提交历史，浏览每一个 commit 的变更。

![](https://raw.githubusercontent.com/DonJayamanne/gitHistoryVSCode/master/images/fileHistoryCommand.gif)

![](https://raw.githubusercontent.com/DonJayamanne/gitHistoryVSCode/master/images/fileHistoryCommandMore.gif)

![](https://raw.githubusercontent.com/DonJayamanne/gitHistoryVSCode/master/images/lineHistoryCommand.gif)

![](https://raw.githubusercontent.com/DonJayamanne/gitHistoryVSCode/master/images/compare.gif)

##### [GitLens — Git supercharged](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens)

这个插件让 vscode 对 git 的支持更强大，一个实用的功能是会在每一行代码旁边提示它的历史变更：

![](https://raw.githubusercontent.com/eamodio/vscode-gitlens/master/images/gitlens-preview.gif)

另外，它会在编辑器侧边栏添加一个图标，点开可以浏览仓库、查看文件变更记录等等一系列功能，具体可以参考插件的官网介绍，个人也只是使用了其中很小一部分功能。

![](/images/vscode-experience/git-lens-icon.png)

![](https://raw.githubusercontent.com/eamodio/vscode-gitlens/master/images/ss-gitlens-explorer-repository.png)

![](https://raw.githubusercontent.com/eamodio/vscode-gitlens/master/images/ss-gitlens-explorer-history.png)

#### [HTML Snippets](https://marketplace.visualstudio.com/items?itemName=abusaidm.html-snippets)

提供了很多常见的`html`代码片段，可以在日常开发中少敲很多代码。另外，`vscode`已经内置了对[Emmet](https://docs.emmet.io/)的支持，所以对这俩熟悉了之后，可以省很多力气。

![](https://i.imgur.com/VOhBvHb.gif)

#### [Import Cost](https://marketplace.visualstudio.com/items?itemName=wix.vscode-import-cost)

一个小插件，可以在`import`一个第三方包时显示这个包的大小。

![](https://file-wkbcnlcvbn.now.sh/import-cost.gif)

![](/images/vscode-experience/import-cost.png)

#### [JavaScript (ES6) code snippets](https://marketplace.visualstudio.com/items?itemName=xabikos.JavaScriptSnippets)

提供了一些常见的 js 代码片段，代码片段`snippets`类似于快捷键的作用，可以让你敲很少的几个字母后再按`tab`键，然后自动变成对应的长段代码。

例如此插件对于`console.log(object)`这段代码的`trigger`是`clg`，那我们就可以在输入`clg`之后按`tab`，`clg`这 3 个字母自动会变成`console.log(object)`。 可以想像，在知道了很多的`snippets`后，我们能少敲很多键盘。

列举这个插件支持的一部分`snippets`：

![](</images/vscode-experience/js(es6)-code-snippets.png>)

#### [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)

类似`CodePen`或`Js Bin`，只不过是开启了一个可以实时更新的本地`server`。

![](https://github.com/ritwickdey/vscode-live-server/raw/master/images/Screenshot/vscode-live-server-animated-demo.gif)

支持快捷图标启动：

![](https://github.com/ritwickdey/vscode-live-server/raw/master/images/Screenshot/vscode-live-server-statusbar-3.jpg)

#### [Path Autocomplete](https://marketplace.visualstudio.com/items?itemName=ionutvmi.path-autocomplete)

自动提示文件路径，可以避免手动敲出来的错误。

![](https://raw.githubusercontent.com/ionutvmi/path-autocomplete/master/demo/path-autocomplete.gif)

#### [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

代码格式化插件，它的优点是可以和`eslint`结合，这样我们在`.vue`文件中也能自动格式化，略爽。

和`eslint`结合需要做一些设置：

```js
"prettier.eslintIntegration": true,
```

另外`prettier`自身也可以配置格式化的一些细节，在项目根目录建一个`.prettierrc`文件，然后在里面加上自定义规则，目前插件提供的规则还不多，下面是我自己配的规则：

```js
{
  "parser": "babylon",
  "useTabs": false,
  "printWidth": 150,
  "tabWidth": 2,
  "trailingComma": "all",
  "singleQuote": true,
  "disableLanguages": [],
  "eslintIntegration": true,
  "arrowParens": "avoid"
}
```

上面的`arrowParens`有点恶心，它只能配置始终有还是始终没有，而`eslint`中关于这一点的规则更灵活，导致有时候可能冲突。

#### [Project Manager](https://marketplace.visualstudio.com/items?itemName=alefragnani.project-manager)

大家平时很可能会在多个项目之间切换，当从 A 切换到 B 时，`vscode`不是很方便，个人想到的最快方式是`Command+O`在文件选择器中找到 B 项目的根文件夹。

这个插件可以让切换变得非常简单，它会在侧边栏添加一个图标，里面有保存的所有项目名，点击文件名即可切换。

![](/images/vscode-experience/project-manage-1.png)

唯一不是很方便的是保存项目需要使用插件提供的命令，而不能自动保存。具体方法是：

1. 调用命令板`Command+Shift+P`
2. 输入`Project Manager: Save Project`, 不要感觉命令太长了，输入前几个字母会自动筛选的

![](/images/vscode-experience/project-manage-2.png)

编辑器底部也提供了图标来快捷切换项目：

![](/images/vscode-experience/project-manage-3.png)

#### [Settings Sync](https://marketplace.visualstudio.com/items?itemName=Shan.code-settings-sync)

如果你有多个电脑都安装 vscode，那么肯定有一个问题困扰着你：怎么让 A 电脑上 vscode 安装的插件自动同步到 B 电脑上呢？

此插件就是解决这个问题的！ 它可以在多设备间同步 vscode 的设置，不仅仅包括安装的插件，还包括个人的编辑器配置。需要利用个人的`github`账户生成一个`token`，然后在每个设备的`vscode`上安装这个插件在遵循文档配置好`token`，就可以自动进行同步了！

具体配置步骤见插件文档即可，这里展示一下在 A 电脑上修改一个配置，然后自动同步上传到服务器的日志：

![](/images/vscode-experience/setting-sync.png)

#### [TODO Highlight](https://marketplace.visualstudio.com/items?itemName=wayou.vscode-todo-highlight)

用于高亮`TODO`, `FIXME`关键词的，有时候代码里有一些`TODO`，但是又不起眼很容易忽略，这个插件可以让这两个词散发耀眼的光芒有如夜空中最亮的星。

![](https://github.com/wayou/vscode-todo-highlight/raw/master/assets/material-night-eighties.png)

看文档介绍应该可以定制高亮的单词，但个人目前还没有试过。

#### [Vetur](https://marketplace.visualstudio.com/items?itemName=octref.vetur)

在插件市场搜`Vue`相关的应该就是这个插件最火了，它提供了茫茫多的配置项并专门有一个官网，各位自行按口味配置就好。可以做的事情有：

1. `Syntax-highlighting`
2. `Snippet`
3. `Emmet`
4. `Linting / Error Checking`
5. `Formatting`
6. `Auto Completion`
7. `Debugging`

#### [vscode-icons](https://marketplace.visualstudio.com/items?itemName=robertohuertasm.vscode-icons)

一个装饰性的插件，可以让文件、文件夹的图标更好看。

![](https://raw.githubusercontent.com/vscode-icons/vscode-icons/master/images/screenshot.gif)

#### [Vue 2 Snippets](https://marketplace.visualstudio.com/items?itemName=hollowtree.vue-snippets)、[Vue VSCode Snippets](https://marketplace.visualstudio.com/items?itemName=sdras.vue-vscode-snippets)、[VueHelper](https://marketplace.visualstudio.com/items?itemName=oysun.vuehelper)

这三个都是提供一些`Vue`相关的`snippets`，个人自行按口味选择即可。`snippets`最大的问题就是需要花时间去记，根据编码习惯可能会选择不同的`snippets`组合。

例如`Vue VSCode Snippets`的示范：

![](https://s3-us-west-2.amazonaws.com/s.cdpn.io/28963/SnippetDemo.gif)

#### [Vue Peek](https://marketplace.visualstudio.com/items?itemName=dariofuzinato.vue-peek)

很实用的小插件，用于跳转定义。默认在`vscode`里的`.vue`文件，无法在`template`中从自定义组件标签跳转到组件的定义文件；也无法从`import xxx from 'xxx.vue'`直接跳转到组件定义。

有了此插件，可以在`template`的组件标签名上直接按`F12`跳转，也可以右键菜单选择`Goto definition`跳转，或者按住`Command`再单击即可。

![](https://github.com/fussinatto/vscode-vue-peek/raw/master/images/vue-peek-demo.gif)

**与`webpack alias` 结合的问题**

`webpack`可以让我们定义路径别名，很遗憾即使是`vscode`+`Vue peek`也无法让我们从带有别名的路径跳转定义。需要进行一组特定配置：

1. 在项目根目录建一个`jsconfig.json`，如果使用的开发语言是`typescript`，则需要建的是`tsconfig.json`
2. 在其中添加对应配置，最关键的是`compilerOptions.baseUrl`，经过一些试探发现如下一组配置可用：

   ```js
   {
     "compilerOptions": {
       "baseUrl": "."
     },
     "exclude": [
       "node_modules",
       "npm-offline-mirror",
       "dist",
       "script",
       "server",
       "statics"
     ]
   }
   ```

关于这个问题的一些参考文档：

1. [autocomplete-es-modules-webpack-vscode](https://blog.andrewray.me/autocomplete-es-modules-webpack-vscode/)
2. [jsconfig](https://code.visualstudio.com/docs/languages/jsconfig)
3. [solve-module-import-aliasing-for-webpack-jest-and-vscode](https://medium.com/@justintulk/solve-module-import-aliasing-for-webpack-jest-and-vscode-74007ce4adc9)
4. [vscode/issues/14907](https://github.com/Microsoft/vscode/issues/14907)

#### markdown 相关

个人用 vscode 写 markdown 不是很多，更多的是用`MWeb Lite`这款专门的 APP，不过安装了 2 个`markdown`相关的热门插件，大家自取~~

1. [Markdown All in One](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one)，支持的功能有

   1. Keyboard shortcuts (toggle bold, italic, code span, strikethrough and heading)
   2. 生成目录
   3. 有序列表、无序列表
   4. Print Markdown to HTML
   5. formatter
   6. Auto completions

2. [markdownlint](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint) 规则检查

# 调试

vscode 也是可以进行代码调试的，官网专门提供了一个[教程](https://code.visualstudio.com/docs/editor/debugging)来演示如何调试，文档非常详细，我就不再搬运了。

说来惭愧，目前用到这个功能最多的地方还是在调试单元测试代码，截个图。。。

![](/images/vscode-experience/vscode-debug.png)
