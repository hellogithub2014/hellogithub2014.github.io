---
title: '一种web app资源预缓存方案'
img: bora-bora.jpg # Add image post (optional)
date: 2017-12-14 17:00:00

tag: [AJAX, CACHE, NODEJS]
---

我们的移动端有多个项目，有一些功能是公共的，每个项目都会用到，现在的方案是将它们拆分成独立应用。随着逐渐有公共功能拆分成独立应用，随之而来就有一个问题：**主应用中进入独立应用，如何更快的显示独立应用的首屏？**其中一个可以做的事情是预缓存独立应用中的关键资源。

假设有**A、B**两个应用，在展示 A 时，需要预先缓存一些 B 下面的静态资源，例如 js、css 文件。需要注意的是对于 js 文件只能加载它，而不能执行它，否则会有很多副作用，例如统计接口请求数会有很大偏差。

以下描述中的 A、B 均指代上面的两个应用。

# 更新

这两天看了一个浏览器的新特性**[preload](https://developer.mozilla.org/en-US/docs/Web/HTML/Preloading_content)**,它可以自定义预加载当前页面的资源。

然后看到另一个相关的**[prefetch](https://developer.mozilla.org/en-US/docs/Web/HTTP/Link_prefetching_FAQ)**,它用于预加载在下一个页面可能会访问的资源，浏览器会在当前页面加载完的空闲时间来加载`prefecth`的资源。示范：

```html
<link rel="prefetch" href="./icons.png" />
```

# 方案 1

## 总体思路

首先把 B 下面的静态资源全部设置成永久缓存，然后在 A 空闲时，通过 GET 请求去获取这些资源即可。这样，浏览器本地就会有这些文件的缓存，真正加载 B 时，会直接从缓存中获取资源。

## A 中要做的事情

获取 B 中所有需预缓存的资源清单，然后逐个发送 GET 请求。

为了更易于使用，考虑到我们项目中加载 A、B 都是通过 nginx 反向代理来做的。 真正在做预加载时，
可以只传入对应应用的 nginx 代理路径，同时每个应用下面都有一个约定好的资源清单文件`pre-cache-manifest.json`，这样拿到这个 json 文件后就能知道 GET 哪些文件了。如下图：

![](/images/pre-cache/预缓存思路.png)

注意点: 这个 json 文件必须设置成不缓存，即每次都从服务器获取，否则每次都是从本地缓存中拿 json。

### 代理路径配置文件 - `pre-cache-config.js`

```js
// 所有想预缓存资源的应用的nginx代理路径
var CRM_PRE_CACHE_PATH_LIST = ['ccrmSocialChatApp'];
```

把这个文件放到`www/pre-cache`文件夹下（没有文件夹请创建一个）。

**注意：** 这个文件中的内容请仔细考虑，只预缓存那些真正需要缓存的应用。

### 真正做预缓存的文件 - `pre-cache.js`

内容较长，参见附件[pre-cache.js](https://github.com/hellogithub2014/hellogithub2014.github.io/tree/save/source/_assets/pre-cache/pre-cache.js)， 使用时直接拷贝到`www/pre-cache`即可，无需修改

### 在 A 的空闲时间加载上述`js`

**`app.component.ts`**

```
ngAfterViewInit() {
	this.utilService.loadScriptAsync( "pre-cache/pre-cache.config.js", () => {
		this.utilService.loadScriptAsync( "pre-cache/pre-cache.js" );
	} );
}
```

**`utils.service.ts`**

```
/**
 * 异步加载脚本
 *
 * @author  刘斌
 * @param {string} path 脚本的路径，以www为根目录
 * @memberof UtilsService
 */
public loadScriptAsync( path: string, callback?: () => void ) {
	const body = document.body;
	const script = document.createElement( "script" );
	script.type = "text/javascript";
	script.src = path;
	if ( callback ) {
		script.onload = callback;
	}
	body.appendChild( script );
}
```

以上就是 A 所需做的全部改变。

## B 中要做的事情

### 禁用`pre-cache-manifest.json`的缓存

```
# 禁用pre-cache-manifest.json缓存
location ~* /(pre-cache-manifest\.json)$ {
		root  <%= ENV["APP_ROOT"] %>/public;
		#expires -1;
		add_header Cache-Control public,no-store,max-age=-1;
 }
```

拷贝到项目的`nginx.conf`中，无需修改

### 分析 B 中哪些资源要预加载

原则上是那些最常访问的页面涉及的关键 js 或 css 文件，通常这些文件都会放在`index.html`中。

一个`pre-cache-manifest.json`的示范如下：

```json
{
  "pathList": [
    "build/polyfills.js",
    "build/1.1f0d863d8b2aa9a6f6c0.js",
    "build/main.737b1601e3e977490c1d.js",
    "build/vendor.868014e1c5a143a0ec7e.js",
    "build/main.css?v=1513166736705",
    "3rdPartyLib.min.js?v=ce15bd2e1bd3a7de076c8d713b57ea48"
  ]
}
```

这个文件会自动生成，无需手动创建

### 动态生成 json 清单

上述清单中很有可能会有一些文件名是动态生成的，我们需要在每次构建中获取这些文件名，然后动态生成最终的 json 文件。

为了便于使用，最好同样是基于配置的

1. 清单中的文件路径配置 - `generate-pre-cache.config.js`

   ```
   /**
     * 用于生成pre-cache-manifest.json的配置
     */
   module.exports = [{
           folder: "build", // www下的文件夹名
           contentIdentifiers: [ // 需要根据内容唯一标志符来查找的文件,此处填写正则表达式
               /\bWanttosayModuleNgFactory\b/, // 懒加载模块生成的js内容标志：Module名+ NgFactory
           ],
           fixedNames: [ // 固定名字的文件
               "polyfills.js"
           ],
           fixedNameRules: [ // 名称为固定格式的文件,此处填写正则表达式
               /^main\.[^.]+\.js$/,
               /^vendor\.[^.]+\.js$/,
           ],
           withVersions: [ // 文件名在index.html中加了版本号
               { fileName: "main.css", algorithm: "random" }, // algorithm:版本号生成算法，"random"、"md5"
           ]
       }, {
           folder: "", // 表示www本身
           withVersions: [
               { fileName: "3rdPartyLib.min.js", algorithm: "md5" },
           ]
       }
   ];
   ```

   将此文件放在项目根目录。

   **注意：** 上述配置因每个项目而异，请仔细考虑自己项目的情况，兼顾用户流量消耗。

2. 根据配置动态生成清单文件 - `generate-pre-cache.js`

   内容较长，参见附件[generate-pre-cache.js](https://github.com/hellogithub2014/hellogithub2014.github.io/tree/save/source/_assets/pre-cache/generate-pre-cache.js)， 使用时直接拷贝到项目根目录即可，无需修改

3. 在 package.json 中生成`script`

   ```
   "generatePreCache": "node generate-pre-cache.js"
   ```

   直接拷贝，无需修改

4. 放到项目根目录用于生产的构建脚本`build.bat`中

   ```
   cmd /c npm run generatePreCache
   ```

直接拷贝，无需修改

## 效果

**加载 A 时预缓存 B 中的资源**：

![](/images/pre-cache/预缓存.PNG)

可以看到在预缓存时没有任何多余的后台接口请求。

**显示 B 时直接从缓存中获取资源**：

![](/images/pre-cache/预缓存效果.PNG)

# 另一种方案

## 思路

PWA 应用中经常会利用`service worker`来缓存资源，这样离线时就可以直接从缓存中拿资源，从而达到更好的用户体验，而不是出现“小恐龙”。

`service worker`是利用`CacheStorage`这个 API 来做资源缓存的。

## 一个简单的示范

**在 localhost:6564/index.html 中：**

```js
var cacheName = 'PWADemo-v1';
var filesToCache = [
  // 所有想缓存的文件清单
  '/index.html',
  './style.css',
  // "http://localhost:6565/bundle.js" // 加载外域js时会被跨域
  './test.js',
];

self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Install');
  e.waitUntil(
    // 利用CacheStorage缓存所有文件清单中的文件
    caches.open(cacheName).then(function(cache) {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(filesToCache);
    }),
  );
});
```

**在 localhost:6564/index2.html 中：**

```html
<script src="./test.js"></script>
```

## 效果

**加载 index.html 时预加载：**

![](/images/pre-cache/CacheStorage缓存.png)

**加载 index2.html 时直接从缓存中拿资源：**

![](/images/pre-cache/CacheStorage缓存效果.png)

## 缺点

由于此 API 中的很多细节还处于草稿阶段，在[MDN](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage)上可以查到它的兼容性还是很差的：

**移动端**

![](/images/pre-cache/CacheStorage-support-in-mobile.png)

注意在安卓 webview 上是完全不受支持的 😶😶😶

**PC 端**

![](/images/pre-cache/CacheStorage-support-in-pc.png)

## CrossWalker 解决兼容性问题

外部 App 使用`CrossWalker`打包，`CrossWalker`会自带高版本浏览器内核。最后让 web app 运行在`CrossWalker`中，就可以省去很多兼容性的 BUG。不过`CrossWalker`比较大，大约 15~20M.

# 小结

采用方案 1🙄😆😊
