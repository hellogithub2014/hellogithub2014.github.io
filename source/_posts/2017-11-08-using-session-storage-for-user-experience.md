---
title: '使用sessionStorage构建更好的用户体验'
img: malaysia.jpg # Add image post (optional)
date: 2017-11-08 20:25:00

tag: [CACHE, SESSION_STORAGE]
---

我们项目中有很多带搜索条件的列表页，点击每个列表项可以跳转到对应的详情页，跳转方式是直接更新`location.href`. 这样会带来一些用户体验方面的问题： 用户设置了一些搜索参数，然后跳到详情在返回，发现搜索参数全部不见了，只能从头再来。

如果能将这些参数缓存，等用户回来时自动“还原”，那么用户体验就有很大的提升。

# 缓存选择

前端缓存数据的地方有`cookie`、`localStorage`、`sessionStorage`，具体差别参见[我的另一篇博客](https://hellogithub2014.github.io/compare-localstorage-sessionstorage-cookie/)。

我们的需求是用户只要还留在窗口内，就应当受到缓存的保护，关闭窗口后缓存自动清除。这样`localStorage`就不合适了，另外我们不想污染`cookie`，所以最终选择`sessionStorage`.

# 具体做法

## API

主要用到了`sessionStorage`的几个存取 API：

```js
interface Storage {
  clear(): void;
  getItem(key: string): string | null;
  removeItem(key: string): void;
  setItem(key: string, data: string): void;
}
```

在从缓存中恢复参数后，为了避免对后续的操作有影响，我们会将对应的值删掉。 用户可能在同一个窗口内先后浏览
多个列表页，每个列表页都有自己独立的搜索参数。删除时，我们需要小心不能把其他页面的缓存参数也删了。

所以需要给每个页面设置独特的缓存键值，推荐使用一个专门的常量对象来放这些键值，如下

```js
var SESSION_STORAGE_KEYS = {};

/**
 * 设置缓存的key，这里以文件名作为前缀
 */
function setSessionStorageKeys(fileName) {
  SESSION_STORAGE_KEYS[fileName + '_KEY1'] = fileName + '_KEY1';
  SESSION_STORAGE_KEYS[fileName + '_KEY2'] = fileName + '_KEY2';
  SESSION_STORAGE_KEYS[fileName + '_KEY3'] = fileName + '_KEY3';
}
```

## 存储

在用户跳转到详情页之前将其设置的各种参数存入：

```js
/**
 * 存储页面的各种参数： 搜索条件、点击的页码、每页大小
 *
 * searchParam: 用户界面的搜索参数对象
 */
function storePageParam(searchParam, fileName) {
  sessionStorage.setItem(fileName + '_KEY1', searchParam.key1);
  sessionStorage.setItem(fileName + '_KEY2', searchParam.key2);
  sessionStorage.setItem(fileName + '_KEY3', searchParam.key3);
}
```

## 获取缓存

在用户回到列表页后的初始化操作中，从缓存中拿到参数，然后设置到 DOM 上：

```js
/**
 * 初始化
 */
window.onload = function() {
  setSessionStorageKeys(); // 设置缓存key
  restorePageParam(); // 先尝试从缓存中恢复参数

  // 其他初始化操作
};

/**
 * 恢复页面的各种参数： 搜索条件、点击的页码、每页大小
 */
function restorePageParam(fileName) {
  var key1 = sessionStorage.getItem(fileName + '_KEY1') || 1; // 如果缓存中没有值，设为默认值
  var key2 = sessionStorage.getItem(fileName + '_KEY2') || '';
  var key3 = sessionStorage.getItem(fileName + '_KEY3') || 0;

  $('#searchKeyWord').val(key1); // 将搜索关键字设为key1

  // 其他恢复操作完成后，调用搜索方法

  clearCache(); // 清除缓存数据
}
```

## 清除缓存

虽然`sessionStorage`提供了一个`clear`方法，但它会清除所有数据，这样会把其他页面设置的缓存也清除。我们需要通过前面说的`SESSION_STORAGE_KEYS`对象来逐个删除指定的键值对。

```js
/**
 * 清除缓存
 */
function clearCache() {
  for (var key in SESSION_STORAGE_KEYS) {
    sessionStorage.removeItem(SESSION_STORAGE_KEYS[key]);
  }
}
```
