---
title: '前端离线检测'
summary_img: /images/himalayan.jpg # Add image post (optional)
date: 2018-01-20 15:48:00

tag: [OFFLINE]
---

webapp 有时候需要检测应用是否处于离线状态，以此做出一些针对性的展示。这里小结一下如何来检测离线。

# navigator.onLine 属性结合 online/offline 事件

[API 参考](https://developer.mozilla.org/en-US/docs/Web/API/NavigatorOnLine/Online_and_offline_events)

使用起来很简单，我们可以监听这两个事件，在事件回调里做任何想做的事情即可：

```js
window.ononline = function(e) {
  alert(navigator.onLine);
};
window.onoffline = function(e) {
  alert(navigator.onLine);
};
```

# XHR 检测

思路是使用 XHR 请求一个肯定存在的资源，如果失败，很有可能表明用户网络出了故障，然后就可以做出一些提示。

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

## 判断响应码

`xhr`的`status`属性在初始时为 0，若请求未完成时这个属性仍然是 0，参见[MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest/status) 恰好断网的情况下请求不会完成，其他情况下都会有专门的响应码，所以我们可以根据`status`属性来判断：

```js
var xhr = new XMLHttpRequest();
console.log('UNSENT', xhr.status);

xhr.open('GET', '/server', true); // 随意一个url即可
console.log('OPENED', xhr.status);

xhr.onprogress = function() {
  console.log('LOADING', xhr.status);
};

xhr.onload = function() {
  console.log('DONE', xhr.status);
};

xhr.send(null);

/**
 * 在正常情况下输出如下：
 *
 * UNSENT 0
 * OPENED 0
 * LOADING 404
 * DONE 404
 */

/**
 * 在断网情况下输出如下：
 *
 * UNSENT 0
 * OPENED 0
 * LOADING 0
 */
```

# 利用 fetch api

`fetch`与`ajax`有一个很大的不同：**不会因为普通的后台错误码而导致请求失败，只会把`response.ok`设为 false，fetch 只会因为网络问题或者其他阻塞请求完成的原因而 reject。**

[fecth api](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)

所以如果是利用`fecth`进行的资源请求，那么其失败时就可以提示用户的网络有问题，例如：

```js
fetch('../icons.png')
  .then(function(response) {
    return response.blob();
  })
  .then(function(myBlob) {
    // var objectURL = URL.createObjectURL(myBlob);
    // myImage.src = objectURL;

    var fr = new FileReader();
    fr.onload = function() {
      myImage.src = fr.result;
    };
    fr.readAsDataURL(myBlob);
  })
  .catch(err => {
    console.error(`fetch 失败,网络有问题。`, err);
  });
```

# 借助 serviceworker 的 sync 事件

参考了 2 篇文章：

- [前端小吉米](https://www.villainhr.com/page/2017/01/08/Service%20Worker%20%E5%85%A8%E9%9D%A2%E8%BF%9B%E9%98%B6#Sync %E7%A6%BB%E7%BA%BF%E5%A4%84%E7%90%86)
- [google developers](https://developers.google.com/web/updates/2015/12/background-sync)

先注册一个 Sync 事件，然后在 serviceworker 中监听这个事件，事件监听器会在用户有网络时被调用。如果用户在断网情况下触发了 sync 事件，监听函数会在有网络时立即调用。

例如我们想在用户访问我们的网站时给他们发送一个通知：

1.  在页面加载时触发 sync 事件：

    ```js
    new Promise(function(resolve, reject) {
      Notification.requestPermission(function(result) {
        if (result !== 'granted') {
          return reject(Error('Denied notification permission'));
        }
        resolve();
      });
    })
      .then(function() {
        return navigator.serviceWorker.ready;
      })
      .then(function(reg) {
        return reg.sync.register('syncTest'); // 触发sync事件
      })
      .then(function() {
        console.log('SUCCESS Sync registered');
      })
      .catch(function(err) {
        console.log('FAILED Sync registe', err);
      });
    ```

2.  在 serviceworker 中监听事件

    ```js
    self.addEventListener('sync', function(event) {
      self.registration.showNotification('你好啊!');
    });
    ```
