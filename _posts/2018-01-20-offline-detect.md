---
title: "前端离线检测"
img: indonesia.jpg # Add image post (optional)
date: 2018-01-20 15:48:00 +0800
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [OFFLINE]
---

# 前言

webapp有时候需要检测应用是否处于离线状态，以此做出一些针对性的展示。这里小结一下如何来检测离线。

# navigator.onLine属性结合online/offline事件

[API 参考](https://developer.mozilla.org/en-US/docs/Web/API/NavigatorOnLine/Online_and_offline_events)

使用起来很简单，我们可以监听这两个事件，在事件回调里做任何想做的事情即可：

```js
window.ononline = function(e) {
    alert(navigator.onLine);
}
window.onoffline = function(e) {
    alert(navigator.onLine);
}
```

# XHR检测

思路是使用XHR请求一个肯定存在的资源，如果失败，很有可能表明用户网络出了故障，然后就可以做出一些提示。

[参考](https://www.html5rocks.com/en/mobile/workingoffthegrid/#toc-xml-http-request)

```js
var xhr = new XMLHttpRequest();
xhr.onreadystatechange = function() {
    if (xhr.readyState !== 4) {
        return;
    }
    if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
        alert("在线")：
    } else {
        alert("离线")：
    }
}
xhr.open("GET", "./favico.png");
xhr.send();
```

# 借助serviceworker的sync事件

参考了2篇文章：
* [前端小吉米](https://www.villainhr.com/page/2017/01/08/Service%20Worker%20%E5%85%A8%E9%9D%A2%E8%BF%9B%E9%98%B6#Sync %E7%A6%BB%E7%BA%BF%E5%A4%84%E7%90%86)
* [google developers](https://developers.google.com/web/updates/2015/12/background-sync)

先注册一个Sync事件，然后在serviceworker中监听这个事件，事件监听器会在用户有网络时被调用。如果用户在断网情况下触发了sync事件，监听函数会在有网络时立即调用。

例如我们想在用户访问我们的网站时给他们发送一个通知：

1. 在页面加载时触发sync事件：

    ```js
    new Promise(function(resolve, reject) {
        Notification.requestPermission(function(result) {
            if (result !== 'granted') {
                return reject(Error("Denied notification permission"));
            }
            resolve();
        })
    }).then(function() {
        return navigator.serviceWorker.ready;
    }).then(function(reg) {
        return reg.sync.register('syncTest'); // 触发sync事件
    }).then(function() {
        console.log('SUCCESS Sync registered');
    }).catch(function(err) {
        console.log('FAILED Sync registe', err);
    });
    ```
2. 在serviceworker中监听事件

    ```js
    self.addEventListener('sync', function(event) {
        self.registration.showNotification("你好啊!");
    });
    ```
