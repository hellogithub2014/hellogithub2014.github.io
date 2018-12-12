---
title: "uglify.js在linux下的填坑经验"
img: malaysia.jpg # Add image post (optional)
date: 2017-12-11 18:00:00
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [UGLIFY.JS]
---

# 前言

最近在我们的项目的构建流程中加了一个小脚本，作用是把多个js文件压缩成一个，这样可以减少启动时的资源请求数目。

主要用到了[uglify.js](https://github.com/mishoo/UglifyJS2)这个库，在本地以及我们window构建服务器上，这个脚本都运行的不错，但是在linux服务上发现出错了。

# 脚本代码

首先会有一个配置文件，用到描述压缩合并哪些文件，压缩合并后的文件放在哪里。

`uglify-3rd-party-lib.config.js`:

```js
var uglify3rdPartyLibConfig = {
  outputFilePath: './www', // 最终压缩成的单一js文件路径
  outputFileName: '3rdPartyLib.min.js', //如无特殊情况请不要修改此项， index.html需要使用此名称
  /**
   * 列在这里的文件会依次出现在outputFilePath中，例如a.js在b.js前面，那么最终a的内容也在b前面.
   * 如果你的js文件之间有依赖顺序，那么就要注意这个!
   *
   * 如果js文件可以使用defer来加载，那么直接在index.html使用单独script标签加载即可。
   * 如果js文件与首屏渲染无关，那么可以使用动态script dom的方式加载
   */
  fileList: [
    './www/startup/loading-prepare.js',
    // "./www/lib/js-emoji/emoji_v2.min.js",
    // "./www/startup/startup_v2.js",
    './www/lib/yst/MobileJS.min.js',
  ]
};

module.exports = uglify3rdPartyLibConfig;
```

`uglify-3rd-party-lib.js` - 用于压缩合并的脚本

```js
var UglifyJS = require("uglify-js");
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var cheerio = require('cheerio');

var uglify3rdPartyLibConfig = require('./uglify-3rd-party-lib.config');

var result = UglifyJS.minify(uglify3rdPartyLibConfig.fileList);

var wholePath = path.join(__dirname, uglify3rdPartyLibConfig.outputFilePath, uglify3rdPartyLibConfig.outputFileName);

// 将结果写入文件
fs.writeFile(wholePath, result.code, 'utf8', function(error) {
    if (error) {
        console.error(error);
        return;
    }
    // 计算合并后的js的md5
    var md5 = crypto.createHash('md5');
    md5.update(result.code); // 基于压缩后的js内容生成hash
    var hash = md5.digest('hex');
    // 更新js文件的版本为md5值
    updateIndexHtml(uglify3rdPartyLibConfig.outputFileName, hash);
});

/**
 * 更新index.html加载的fileName的hash值
 *
 * @param {any} fileName
 * @param {any} fileHash
 */
function updateIndexHtml(fileName, fileHash) {
    var indexHtmlPath = path.join(__dirname, 'www', 'index.html');
    var indexHtmlContent = fs.readFileSync(indexHtmlPath, { encoding: 'utf8' });
    var $ = cheerio.load(indexHtmlContent);

    $(`[src^="./${fileName}"]`).attr('src', `./${fileName}?v=${ fileHash }`); // 更新版本号

    fs.writeFile(indexHtmlPath, $.html(), function(error) {
        if (error) {
            console.error(error);
            return;
        }
        console.log('success');
    });
}
```

上面的脚本还会自动把压缩合并后的文件添加到`index.html`中，并添加md5值作为版本号来防止缓存。

# BUG描述及原因

其中最关键的一句代码

```js
var result = UglifyJS.minify(uglify3rdPartyLibConfig.fileList);
```

`minify`可以传入一个文件路径数组，然后压缩合并这个数组中的所有文件。

在linux上，文件路径都是形如`/var/home/path/to/js`，而偏偏`minify`会把这个路径当做正则表达式来匹配，结果其中的`home`会被当做正则表达式的`flag`，就会报这个正则有非法的flag。

在window上，文件路径都是`D:\path\to\js`，是不会当做正则的。

# 解决方案

linux上的文件路径估计是不能改了，在各种google无果之后的苦恼时，突然灵光一现，在我的项目cli中，也有利用`uglify.js`压缩脚本的流程，而它们没有报错。看了它们的源码之后，发现他们并不是把文件路径传给`minify`，而是把文件内容的字符串直接传给他，即：

```js
var fileContentList = [];
uglify3rdPartyLibConfig.fileList.forEach(function(fileShortPath) {
    // console.log("current file path: ", path.join(__dirname, fileShortPath));
    var curContent = fs.readFileSync(path.join(__dirname, fileShortPath), "utf8");
    fileContentList.push(curContent);
});

var result = UglifyJS.minify(fileContentList);
```

灯登等凳☺️☺️☺️，问题解决啦~~~~~




