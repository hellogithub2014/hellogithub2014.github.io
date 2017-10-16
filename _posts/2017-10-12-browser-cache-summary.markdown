---
title: "浏览器缓存机制总结"
img: alaska.jpg # Add image post (optional)
date: 2017-10-13 20:00:00 +0800
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [CACHE,HTTP]
---

# 相关Http头部
## 缓存过期策略
### `Cache-Control`

一个复合规则, 包含多种值, 横跨 存储策略, 过期策略 两种, 同时在请求头和响应头都可设置.

1. max-age
2. s-maxage
3. public
4. private
5. no-cache
6. no-store
### `Expires`
### `Pragma`

## 缓存协商
### `Last-modified` 、`If-Modified-Since`、`If-Unmodified-Since`
### `ETag`、`If-Match`、`If-None-Match`

## 间接的`HTTP`头部
### `Age`
### `Date`
### `Vary`


# `LocalStorage`、`sessionStorage`
【4】

# 缓存机制流程图

# 用户行为与缓存
【3】

# `CDN`缓存

# 禁用缓存
参考【2】

# 参考
1. [浅谈 Web 缓存](http://mp.weixin.qq.com/s/MLmxeIlX6Zy7Uy98SEWbFw)
2. [浏览器缓存机制剖析](http://mp.weixin.qq.com/s/yf0pWRFM7v9Ru3D9_JhGPQ)
3. [浏览器缓存机制浅析](http://mp.weixin.qq.com/s/F5gvzdi6MTwCFXV9LKs9NQ)
4. [localStorage的黑科技-js和css缓存机制](http://mp.weixin.qq.com/s/NplDQkr2JYaEwTVcRd0vwQ)
5. [浏览器缓存机制剖析](http://mp.weixin.qq.com/s/yf0pWRFM7v9Ru3D9_JhGPQ)
6. [掌握 HTTP 缓存——从请求到响应过程的一切（上）](http://mp.weixin.qq.com/s/tluGR6Xc2tCjtaOLWO9q6Q)
7. [掌握 HTTP 缓存——从请求到响应过程的一切（下）](http://mp.weixin.qq.com/s/0ZgM2jW2a0OUziBMYVnsOg)


