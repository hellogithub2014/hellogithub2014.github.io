---
title: '使用StorageEvent在web app间通信'
summary_img: /images/alaska.jpg # Add image post (optional)
date: 2017-12-11 20:10:00

tag: [StorageEvent]
---

最近项目中有一个功能，需要在两个 webview 中运行的同域 web app 间通信。其实老早之前就碰到了这个问题，只不过当时是采用轮询 localstorage 的方式完成的。即一个 webview 中的页面把数据放到 localstorage 里，然后另一个 webview 中的页面使用定时器不断查询想要的数据是否已改变。

后来看到说 localstorage 其实有一个 storage 事件，可以在其中的数据发生改变时触发，事件对象中可以获取是哪个键的值改变了，以及最新的值，这个特性很符合我们的需求。

背景：我们的两个 webview 页面中都会有一个浮动图标，图标的位置需要同步。

# HTML

```html
<ion-icon #feedbackBadge crmMoveable (moveEnd)="storePosition($event)"> </ion-icon>
```

上面是 Angular 的模板语法， `crmMoveable`是一个指令，可以让宿主元素具备拖拽能力，它在停止拖拽时会出发一个`moveEnd`事件，事件对象`$event`包含图标最新的位置

```js
$event: { x: string, y: string }; // x和y都是形如 100px这样的字符串
```

# localstorage 存储

我们需要在停止时把最新位置数据存到 localstorage 去：

```js
/**
* 记录当前图标的位置
*
* @param { { x: string, y: string } } position x和y都是例如 100px这种
* @memberof FeedbackFloatButtonComponent
*/
public storePosition( position: { x: string, y: string } ) {
localStorage.setItem( POSITION_X, position.x );
localStorage.setItem( POSITION_Y, position.y );
}
```

# 注册 storage 事件

这里注意的是**要在 window 对象上注册事件处理**：

```js
public ngAfterViewInit() {
    // 写成document.addEventListener不起作用
    window.addEventListener( "storage", this.storageHandler.bind( this ), false );
  }
```

# 事件处理函数

逻辑同样不难， 就是拿到最新的数据，然后改变图标的位置：

```js
  @ViewChild( "feedbackBadge" ) public badge: any;

	/**
   * 绑定localstorage的storage事件。
   * 在其他页面改变了有话说浮动图标位置时，当前页面随之更改位置
   *
   * @author 80374787 刘斌
   * @param {StorageEvent} e
   * @memberof CrmMoveableDirective
   */
  public storageHandler( e: StorageEvent ) {
    if ( e.key === POSITION_X ) {
      this.badge.nativeElement.style.left = e.newValue;
    } else if ( e.key === POSITION_Y ) {
      this.badge.nativeElement.style.top = e.newValue;
    }
  }
```

# 遇到的坑

写完后测一测，在 pc chrome、安卓 webview 上均没有问题，运行的很好。但是发现在我们 ios 上就死活不行，又偏偏我不知道怎么调试 ios webview 里的 web app~

后来经过我们 ios 的同事提醒，他问我们是在 UI webview 还是 WK webview 测试的，我才知道一直不行的是在 UI webview 上。然后又在 WK 上做了个测试，发现是可以的。🙄🙄🙄

在 google 上搜了下，发现很多人也在问，貌似这是 UI webview 的一个 BUG。 [BUG 地址](https://bugs.webkit.org/show_bug.cgi?id=145565)
