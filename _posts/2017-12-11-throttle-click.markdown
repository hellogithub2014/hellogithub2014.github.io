---
title: "移动端点击元素重复跳转同一页面BUG解决方案"
img: sweden.jpg # Add image post (optional)
date: 2017-10-08 21:30:00 +0800
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [JavaScript]
---

# 前言

我们的移动端项目上一直有一个BUG：在很多页面里点击某些元素会跳转到另一个页面（如点击列表项进入详情页）。但是如果手机配置较低，有时候如果快速多次点击，可能会重复显示多个目标页面。 即使在微信上也会这种情况，试试快速多次点击“朋友圈”按钮。

解决这个问题需要第一次点击元素总会立即生效，但接下来的一段时间内内如果继续点击这个元素，会直接被忽略掉。

正好一直有在学习RXJS，它是解决这种事件流的利器。

# 尝试debounce

最开始想到的是`debounce`操作符，它的“珠宝图”如下：
![](http://reactivex.io/documentation/operators/images/debounce.png)

仔细想想发现不对，它会延迟第一次的点击，第一次点击后的指定时间内没有第二次点击才会生效。

# throttleTime

我们需要的是一种和debounce正好相反的操作符，也就是我们的`throttleTime`。如果指定时间内发射了两个值，`debounce`会忽略前一个，`throttleTime`会忽略后一个。它的“珠宝图”：

![](http://reactivex.io/rxjs/img/throttleTime.png)

他还有一个相关的操作符`throttle`，不是写死的时间间隔，具体参见[throttle](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-throttle)

# 封装代码

可以肯定，在整个移动应用间都需要解决上述BUG，最好的办法是写一个通用的指令，这样大家在用起来时最方便。

```css
import { Directive, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { Subject } from "rxjs/Subject";
import { Subscription } from "rxjs/Subscription";

@Directive( {
  // tslint:disable-next-line:directive-selector
  selector: "[throttleClick]",
} )
export class ThrottleClickDirective implements OnInit, OnDestroy {
  @Input() public throttleTime = 3000;
  @Output() public throttleClick = new EventEmitter();
  private clicks = new Subject<any>();
  private subscription: Subscription;

  constructor() {
    //
  }

  public ngOnInit() {
    this.subscription = this.clicks
      .throttleTime( this.throttleTime )
      .subscribe(( e ) => this.throttleClick.emit( e ) );
  }

  public ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  @HostListener( "click", [ "$event" ] )
  public clickEvent( event: MouseEvent ) {
    event.preventDefault();
    event.stopPropagation();
    this.clicks.next( event );
  }
}
```

# 如何使用
   
在需要解决上述BUG上元素上，将 click 改为 throttleClick 即可，例如

```html
<div tappable (click)="test()">以前大家是这么写的</div>
```

改为：

```html
<div tappable (throttleClick)="test()">现在把click改成throttleClick就行啦~~~</div>
```
   
如果觉得3秒不合适，也可以改掉

```html
<div tappable (throttleClick)="test()" [throttleTime]="5000">现在时间的阈值改成5秒啦~~~</div>
```

