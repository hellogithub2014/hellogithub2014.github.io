---
title: hexo搭建笔记
summary_img: /images/bora-bora.jpg
date: 2018-12-13 15:48:46
tags: [hexo]
---

记录在搭建`hexo`博客时一些注意的点，大部分基础的步骤参考了其他博客。

# 前置工具

1. 拥有 github 账户、安装了 git、node、npm
2. 全局安装`hexo`

```shell
npm install -g hexo-cli
```

# 建立 github 仓库

1. 在`github`上建立一个远程仓库，**注意仓库名格式有要求： `用户名.github.io`**, 即如果`github`用户名为`username`，那么你需要建一个名为`username.github.io`的仓库。这个仓库就是以后你的博客站点地址，用户输入`https://username.github.io`就能访问你的网站了~~

2. 在本地任意一个目录初始化我们的`hexo`博客文件夹：

```shell
hexo init 上面的远程仓库名
```

建好后本地会多一个与远程仓库同名的文件夹，例如`username.github.io`，文件夹下面有一些子文件夹，如`node_modules`、`source`等。

3. 将本地博客文件夹与远程仓库关联起来，进入本地博客文件夹目录，运行：

```shell
git init
git remote add origin 远程仓库地址如git@github.com:用户名/用户名.github.io.git
```

# 测试一下

在本地博客文件夹目录下运行以下命令看看博客能不能在本地跑起来：

```shell
hexo new my-first-blog
hexo s
```

如果控制台没报错的话，会提示在浏览器打开`localhost:4000`，一切正常的话我们就可以看到我们刚刚建的博客啦(我截图里是修改过主题配置，后面会说到)：

![first-blog](/images/hexo-blog-note/first-blog.png)

到这里你就可以在本地跑一个自己的博客站点了，恭喜！

# 常用 Hexo 命令

1. 新建文章： `hexo n blog-name`
2. 将文章转化为静态资源： `hexo g`
3. 本地预览博客站点： `hexo s`, 一些其他选项：
   1. 静态模式: `hexo s -s`
   2. 更改端口: `hexo s -p port`
   3. 清除缓存: `hexo clean`
4. 部署博客站点到服务器(需要几条配置，后续会说)： `hexo d`

# 部署博客站点到服务器

部署到远程服务器就可以让别人也能看到你的博客，需要进行一些全局配置，这个文件位于项目根目录的`_config.yml`。

打开这个文件在最底部将`deploy`修改一下：

```yml
# Deployment
## Docs: https://hexo.io/docs/deployment.html
deploy:
  type: git
  repo: https://github.com/username/username.github.io.git # 上面你新建的远程仓库地址，注意结尾要有.git
  branch: master
```

其实就是给`hexo d`这个命令做相应的配置，让`hexo`知道你要把`blog`部署在哪个位置. 然后安装`Git`部署插件：

```shell
npm install hexo-deployer-git --save
```

最后我们依次以下命令：

```shell
hexo clean
hexo g
hexo d
```

正常的话控制台不会有报错，然后在浏览器输入`https://username.github.io`. 噔噔噔，你的第一个博客就诞生啦，应该和你本地预览的是一样的 😄

# 个性化配置

## 更换主题

`hexo`默认的主题比较丑，不过可以很方便的换成别的主题，在[官网](https://hexo.io/themes/)可以浏览各式各样的主题。找到喜欢的主题后，只需几步就可以更换。 以下均以我自己用的[`next`](https://github.com/theme-next/hexo-theme-next)为例：

1. 在博客根目录运行以下命令下载主题文件

```shell
git clone https://github.com/theme-next/hexo-theme-next.git themes/next
```

文件会被下载到`themes/next`中

2. 修改主题配置，打开`themes/next/_config.yml`（**注意不是站点全局配置，那个文件也叫`_config.yml`，只不过是在项目根目录**），找到`Scheme Settings`，选择自己喜欢的样式：

```shell
# ---------------------------------------------------------------
# Scheme Settings
# ---------------------------------------------------------------

# Schemes
# scheme: Muse
# scheme: Mist
scheme: Pisces
# scheme: Gemini
```

可以看到`next`提供了 4 种样式，我选的是`Pisces`。

3. 验证主题配置，重新`hexo s`就可以在本地看到新的主题了，美美的~~赶紧部署到服务器去秀一把吧 😄！

4. 需要注意的是，使用`git clone`的方式下载主题时，主体文件夹默认不会被推送到我们自己的代码仓库中，这就导致你在另一台电脑上如果也想修改博客站点就需要重新再配置一遍主题，很麻烦。解决办法是将主题文件夹变成普通的文件夹，进入**主题文件夹根目录**并执行`rm -rf .git`，你会发现本地变更中多出很多主题相关的文件，这就对了，这样就能将主题文件也放入博客仓库。

## 文章引入本地图片

由于我们的博客通常是用`markdown`写的，对于外链图片就直接按照`markdown`语法来写就行，对于本地图片需要一些额外的配置。图片分为两种：文章封面图和文章内容里的插图。由于个人习惯，封面图会和文章插图分开，以下都是以这个前提来讲述如何配置的：

### 文章插图

在[官网文档](https://hexo.io/zh-cn/docs/asset-folders)已经讲了如何在文章内容中引入本地图片了，我也是用的最简单的方法。

`source/images`其实就是专门给我们放置图片的，在`markdown`中可以很简单的使用`![](/images/path/to/image)`的方式引用。

![post_images](/images/hexo-blog-note/post_images.png)

### 封面图

文章封面的意思就是：在博客首页的时候会显示文章的封面图片，进入这篇文章的详细页面后，将不显示这张图片。

参考的[这篇博客](https://neveryu.github.io/2017/07/15/hexo-next-five/)，

如果想添加文章封面的话，需要添加一个字段属性：`summary_img`，它的值是图片的路径,例如：

```yml
title: xxx
date: xxx
summary_img: /images/test.png # 注意这里开头的 / ，没有它会导致一些图片无法加载
---

```

`hexo`默认是不支持这个字段的，需要增加一些配置，修改 `/themes/next/layout/_macro/post.swig` 文件, 将代码：

```swig
<!--自定义封面摘要图片  start-->
{% if post.summary_img  %}
  <div class="out-img-topic">
    <img src={{ post.summary_img }} class="img-topic">
  </div>
{% endif %}
<!--自定义封面摘要图片  end-->
```

放到如下位置：

![summary_img_config](/images/hexo-blog-note/summary_img_config.png)

## 搜索

使用的`Algolia`来建立搜索索引，具体配置文档参考[官方文档](https://theme-next.iissnan.com/third-party-services.html#algolia-search)，注意文档中有一处有写错，在站点配置文件里有 3 个配置是必选项，文档里只写了 2 个。正确的示范如下：

```yml
algolia:
  applicationID: xxxx
  apiKey: xxxx
  indexName: xxx
  chunkSize: 5000
```

效果：

![search](/images/hexo-blog-note/search.png)

## 站点 UV、PV 统计

使用的[`不蒜子`统计](https://theme-next.iissnan.com/third-party-services.html#analytics-busuanzi)，不过发现`next`主题加载的关键`js`文件 404 了。搜索了下发现域名过期了，作者在[这里](http://ibruce.info/2015/04/04/busuanzi/)提供了新的域名。

修改方法：将`next`主题文件夹中的`layout/_third-party/analytics/busuanzi-counter.swig`最上方的`script`改为：

```html
<script async src="//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js"></script>
```

效果：

![uv_pv](/images/hexo-blog-note/uv_pv.png)

## 分享功能

使用[AddThis](https://www.addthis.com)，[配置文档](https://theme-next.iissnan.com/third-party-services.html#share-addthis)，效果：

![add_this_share](/images/hexo-blog-note/add_this_share.png)

## SEO

两个参考文档

- [Google Webmaster tools](https://theme-next.iissnan.com/third-party-services.html#others)
- [SEO 优化](https://www.jianshu.com/p/4ef35521fee9)

只配置了[`google`的搜索引擎优化](https://search.google.com)，过几天再看效果。

## 评论系统

参考[官网文档](https://theme-next.iissnan.com/third-party-services.html)，我配置的是`DISQUS`这个。在设置`shortname`时需要注意，要到`DISQUS`注册账号，并在[管理员页面](https://disqus.com/admin/create/)设置`shortname`.

![shortname-config](/images/hexo-blog-note/shortname-config.png)

## 百度统计

[参考这里](https://theme-next.iissnan.com/third-party-services.html#analytics-system)，比较简单就不多说了, [统计后台](https://tongji.baidu.com)

## 站点基本信息

这里指的是网站标题、作者、头像等。在项目根目录的`_config.yml`中修改即可：

```yml
# Site
title: 十年一刻
subtitle:
description: 码畜
keywords:
author: Liu Bin
language: zh-Hans
timezone:
avatar: https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1544633647623&di=9344c3068a2e155434bd39899d7cd25d&imgtype=0&src=http%3A%2F%2Fpic65.nipic.com%2Ffile%2F20150428%2F12641788_080744824000_2.jpg
```

在站点中就可以看到这些信息了：

![site_base_config.png](/images/hexo-blog-note/site_base_config.png)

## 网站背景图

将选好的背景图命名为`background.jpg`，放在`themes/next/source/images`里，在`themes/next/source/css/_custom/custom.styl`添加如下`css`代码：

```css
body {
  background: url(/images/background.jpg);
  background-attachment: fixed;
}
```

## 分离博客文章源码与发布文件

细心的同学可能发现一个很难受的地方，在`hexo d`之后，我们的远程仓库里文件发生了变化，所有的`markdown`文章全部不见了，取而代之的是一堆生成的`html`静态文件：

![generated_remote_repo.png](/images/hexo-blog-note/generated_remote_repo.png)

也就是说我们的原始文章全部被转化掉了，这很可能不是个好事情，因为万一哪天换了电脑，本地也没有保存这些原始文章，就再也找不回来了。我们需要将原始文章和发布生成的静态文件分离，利用`git`的分支管理可以很方便的做到这点。

因为`github`和`hexo`都是利用`master`分支来生成站点文件，所以我们可以新建一个专门保存原始文章的分支比如`save`。这样我们写文章时切换到`save`分支，运行`hexo d`时会将转化后文件推送到远程的`master`分支，我们再将`save`分支的原始文章推送到远程`save`分支即可，非常方便。

以上这些步骤有点多，在写完一篇文章需要敲好几个命令才能打扫完战场，我们写一个`npm`命令来帮我们做这些事情。在根目录的`package.json`中添加以下代码：

```json
"scripts": {
  "pub": "git checkout save && hexo clean &&  hexo g && hexo d && git add . && git commit -m 'update' && git push"
},
```

之后我们只需运行`npm run pub`就能自动做完所有该做的事。上述命令大概做的事情有：

1. 切换到`save`分支
2. 生成并发布博客
3. 将所有修改全部推送到远程`save`分支

# 参考文章

- [GitHub+Hexo 搭建个人网站详细教程](https://zhuanlan.zhihu.com/p/26625249)
