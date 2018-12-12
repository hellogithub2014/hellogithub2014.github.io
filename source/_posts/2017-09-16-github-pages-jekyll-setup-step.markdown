---
title: 'MAC 搭建GITHUB PAGES + Jekyll 步骤'
img: malaysia.jpg # Add image post (optional)
date: 2017-09-16 12:55:00
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [TOOL, Jekyll]
---

# 前提要求

首先需要有一系列的前提工具要求

#### 1. GIT

用来在本地创建仓库，并与远程仓库连接。具体步骤参见 [github pages 官网入门教程](https://pages.github.com/)

#### 2. Ruby

需要**2.1**以上版本，在 mac 上一般会预装`ruby`,但是可能版本不够高，此时推荐使用`RVM`来更新`ruby`的版本。具体步骤也可以参见简书上的一个 [教程](http://www.jianshu.com/p/d99b5662d8a0).

**提醒**: 使用`RVM`安装`ruby`时还需要提前安装好`xcode`，这个直接在 App Store 上傻瓜安装就好。

#### 3. Bundle

> Using Bundler to install and run Jekyll. Bundler manages Ruby gem dependencies, reduces Jekyll build errors, and prevents environment-related bugs.

运行以下代码

```ruby
gem install bundler
```

#### 4. Jekyll

这个可以不用提前安装，在接下来的步骤中会说明如何安装。

# 搭建博客站点的远程仓库

仍然是按照 github pages 的[官网](https://pages.github.com/)教程来就行。

# 搭建本地 Jekyll 站点仓库

#### 1. Clone 远程 github 博客仓库到本地

在此不赘述，使用`git clone`命令即可

#### 2. 安装 Jekyll

按照 github pages 的[帮助文档](https://help.github.com/articles/setting-up-your-github-pages-site-locally-with-jekyll/)里面的**Step 2**,一切顺利，就可以安装好 Jekyll.

#### 3. 寻找模板

我们最终的博客站点肯定是希望很漂亮，如果按照帮助文档的建议一步步往下，是没有那么漂亮的。所以推荐直接到`Jekyll`的一个[主题汇集站点](http://jekyllthemes.org/)，寻找自己喜欢的自己，然后`fork`到自己的 github 中。最后再将文件都拷贝到自己本地的 Jekyll 站点仓库里。

#### 4. 本地预览博客

如果一切顺利，在本地 Jekyll 仓库根目录运行

```
bundle exec jekyll serve
```

它会启动一个本地的服务器，部署我们的博客站点，在我们修改了仓库中的文件时它还会自动重新构建，可以说是比较方便的了。
然后在浏览器中打开`localhost:4000`，就可以预览我们的站点长什么样了~~~

# 上传本地修改到远程仓库

没什么好说的，就是常用的`git push`。不过有一些要注意的：

有些你`fork`下来的模板，在本地跑的时候，所有的资源都可能会有一个**`baseUrl`**,这个在项目根目录的`_config.yml`中可以发现相应配置：

```
baseurl： 'xxx' # the subpath of your site, e.g. /blog
```

如果不修改 baseurl，你会发现 push 上去后，真正打开你的线上博客站点时，所有的样式全部丢失，功能也不正常了。
这是因为所有的资源都是相对于 baseurl 的，而线上找不到那些资源。解决办法就是在`_config.yml`中将`baseurl`设置为空字符串即可。

```
baseurl： ''
```
