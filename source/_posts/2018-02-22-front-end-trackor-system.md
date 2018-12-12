---
title: "前端埋点系统研究小结"
img: nevada.jpg # Add image post (optional)
date: 2018-02-22 19:00:00
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [JAVASCRIPT]
---


# 前言

埋点具有很重要的意义，可以获取用户在使用app时的各种行为或数据指标。这篇文章主要用来记录我们的项目中对于埋点的一些预研，包括页面点击埋点、页面路由埋点、应用启动时的性能数据埋点三个方面。

# 点击埋点

## 思路

顾名思义，就是在用户点击每一个类似按钮这样的可点击元素时，进行记录，然后发送给后端。如果在传统的如jquery下做的话，可能需要在每个点击事件里都加上一段统一的逻辑，这样显得很麻烦。 好在我们使用的`Angular`，可以写一个自定义的指令，指令会监控宿主元素上的点击事件，然后进行埋点记录。对的，思路就是这么简单。

## 指令

这个指令的代码如下：

```js
@Directive( {
  selector: "[crmTrackor]",
} )
export class CrmTrackorDirective implements AfterViewInit {
  @Input( "crmTrackor" ) public trackorName: string; // 宿主元素的标识，由指令的使用者设定，应该具有良好的描述性

  private page: string;
  private id: string;

  constructor(
    private crmTrackor: CrmTrackor,
    private elementRef: ElementRef,
    private crmNavService: CrmNavService,
    private navCtrl: NavController,
  ) {
    this.id = this.elementRef.nativeElement.id; // 尝试获取宿主元素的id
  }

  public ngAfterViewInit() {
    this.page = this.crmNavService.getTopNav( this.navCtrl ); // 获取宿主元素所在的页面
  }

  @HostListener( "click" )
  public clickEvent() {
    this.crmTrackor.trackorClick( { page: this.page, name: this.trackorName, id: this.id } ); // 借用专门的服务来记录埋点
  }
}
```

这里的`trackorClick`是一个专门用于埋点的服务中的一个方法，关键代码如下：

## 服务

```js
  private userInfo: any; // 登录用户信息的对象
  private userInfoStr: any; // 信息字符串
  private trackorServerUrl: string; // 埋点服务url

  constructor(
    private loginService: LoginUtilsService,
    private logger: CrmLogger,
  ) {
    this.userInfo = this.loginService.getLoginUserInfo();
    this.userInfoStr = JSON.stringify( this.userInfo );
    this.trackorServerUrl = `/${ PATHS.TRACKOR }/trackor`;
  }

  /**
   * 记录元素点击，与 @crm-trackor.directive 配合使用
   *
   * @param { { page: any, name: string, id?: string } } elementSite
   * @param {object} [options={}]
   * @memberof CrmTrackor
   */
  public trackorClick( elementSite: { page: any, name: string, id?: string }, options: object = {} ) {
    this.logger.log( `CrmTrackor.trackorClick.`, `elementSite:`, elementSite, `options`, options );
    const trackorInfoArr = [
      `elePage=${ elementSite.page }`,
      `eleName=${ elementSite.name }`,
      `eleId=${ elementSite.id || "" }`,
    ];

    Object.getOwnPropertyNames( options ).forEach( ( name ) => {
      trackorInfoArr.push( `${ name }=${ options[ name ] }` );
    } );

    this.track2Server( trackorInfoArr.join( "&" ) ); // 发送到后端埋点服务
  }
```

这里的`track2Server`实际上使用了`( new Image() ).src = xxx `信标的方式来向后端发送记录，就不贴具体代码了。

## 使用方法

有了这个指令后，就可以很简单的在模板文件中使用了，只用传递一个描述信息给指令就行，示范如下：

```html
<div>
    单纯指令:
    <button type="button" id="test-trackor1" crmTrackor="crmTrackortest1">测试1</button>
</div>
<div>
    指令与事件同在：
    <button type="button" id="test-trackor2" crmTrackor="这是第二个按钮 随便写什么都行" tappable (click)="testClick()">测试2</button>
</div>
<div>
    没有id：
    <button type="button" crmTrackor="crmTrackortest3">测试点击3</button>
</div>
<div>
    动态绑定指令入参：
    <button type="button" id="test-trackor4" [crmTrackor]="dynamicTrackorInput">测试点击4</button>
    <button type="button" id="test-trackor5" [crmTrackor]="dynamicTrackorInput+'555555555555'">测试点击5</button>
</div>
```

# 页面路由埋点

## 思路

我们的项目中使用了`ionic`框架，其有两个生命钩子`ionViewDidEnter`和`ionViewDidLeave`，前者在用户进入了当前页面后触发，后者在离开了当前页面后触发。我们只需在这两个钩子中插入埋点代码即可。关键在于我们的项目是多人合作开发的，如何让其他人花费最少的时间呢？ 我们面临两个现状：

1. 有很多页面其实并没有实现这两个钩子
2. 即使实现了这个钩子，把埋点代码硬编码到其中总让人觉得不爽，侵入性太强

于是想到了ts中的[装饰器](https://www.tslang.cn/docs/handbook/decorators.html)，具体语法请直接参考官网。它可以修改某个类或者方法的元数据，有点类似java中的注解。 如果我们利用一个装饰器自动在这两个钩子中插入我们的埋点代码，那岂不是用起来很爽，就像spring中的切面编程一样。

## 类装饰器

先来试试类装饰器：

```js
/**
   * 类装饰器，拦截ionViewDidEnter和ionViewDidLeave钩子
   *
   * @export
   * @param {Function} constructor
   */
  public static ViewTrackor( constructor: Function ) {
    const viewDidEnterClone= constructor.prototype.ionViewDidEnter;
    constructor.prototype.ionViewDidEnter = function() {
      CrmTrackor.logTrace( constructor.name, TraceType.ENTER );
      viewDidEnterClone.call( this );
    };
  }
```

使用方法

```js
@CrmTrackor.ViewTrackor
@Component( {
  templateUrl: "app.component.html",
} )
export class MyApp{
    // code ...
}
```


这里只拦截了`ionViewDidEnter`，但是测试发现方法是被替换掉了，但最终这个方法根本就没有执行，囧，暂时还没有找到原因，待日后再研究。

## 方法装饰器

再来试试方法装饰器吧

```js
  /**
   * ionViewDidEnter方法装饰器
   *
   * @static
   * @param {*} target
   * @param {string} propertyKey
   * @param {PropertyDescriptor} descriptor
   * @memberof CrmTrackor
   */
  public static ViewDidEnterTrackor( target: any, propertyKey: string, descriptor: PropertyDescriptor ) {
    const valueClone = descriptor.value;
    descriptor.value = function() {
      CrmTrackor.logTrace( CrmTrackor.getTrace( this, target.constructor ), TraceType.ENTER );
      valueClone.call( this );
    };
  }
```

其中，`TraceType`是一个自定义枚举，用来表示是进入还是退出页面：

```js
/**
 * 页面浏览的类型
 *
 * @enum {number}
 */
enum TraceType {
  ENTER, // 进入页面
  LEAVE, // 离开页面
}
```

`getTrace`方法用于获取待记录的页面标识，这个标识有点麻烦，还是看代码吧：

```js
private static getTrace( comp: any, constructor: Function ) {
    if ( !comp.navCtrl ) {
      return constructor.name;
    }

    const navCtrl = comp.navCtrl;
    let views = navCtrl.getViews();

    if ( !views || !views.length ) { // 如果是tab页的根页面，navCtrl为Tab实例，没有views
      views = [ ( navCtrl as any ).root || navCtrl.id ];
    } else {
      views = views.map( ( view ) => view.id );
    }

    const viewTop = views.slice( -1 )[ 0 ];
    const tmp = CrmTrackor.pageTraces.slice( -1 )[ 0 ]; // 进入第一个页面时，pageTraces还是空的
    const traceTop = ( tmp && tmp.page ) || "";
    /**
     * 当从A进入B时,先触发B的Enter，再触发A的Leave
     *   A的Leave中,views=[...,A,B]， traces=[...,A,B],需要记录A，
     *   B的Enter中,views=[...,A,B]， traces=[...,A],需要记录B
     * 当从B回到A时，先触发A的Enter，再触发B的Leave
     *   A的Enter中,views=[...,A,B]， traces=[...,A,B].需要记录A，
     *   B的Leave中,views=[...,A,B]， traces=[...,A,B,A].需要记录B
     *
     * 综上，Enter钩子中的记录和Leave钩子遵循相同的规律：
     *   viewTop === traceTop， 记录views倒数第二个元素
     *   viewTop !== traceTop， 记录views栈顶元素；
     */
    return ( viewTop === traceTop ) ? views.slice( -2 )[ 0 ] : viewTop;
  }
```

大致思路是获取`views`路由栈和已记录的`pageTraces`栈，然后针对各种情况测试这两个栈的变化情况，最后总结出规律。`pageTraces`栈会在`CrmTrackor.logTrace`方法中进行记录：

```js
  public static pageTraces: Trace[] = [];

  /**
   * 记录路径
   *
   * @private
   * @static
   * @param {string} page
   * @param {TraceType} traceType
   * @memberof CrmTrackor
   */
  private static logTrace( page: string, traceType: TraceType ) {
    console.log( `%c${ TraceType[ traceType ] } => ${ page }`, "color:green;font-size:large" );

    if ( traceType === TraceType.ENTER ) { // 进入页面
      CrmTrackor.pageTraces.push( new Trace( page ) );
    } else { // 离开页面
      const lastPage = CrmTrackor.pageTraces.slice( -2 )[ 0 ]; // 倒数第二个
      if ( lastPage ) {
        lastPage.leaveTm = new Date();
        lastPage.duration = lastPage.leaveTm.getTime() - lastPage.enterTm.getTime();
      }
    }
  }
```

`Trace`是一个自定义的类，记录页面浏览的关键数据：

```js
class Trace {
  constructor(
    public page: string,
    public enterTm: Date = new Date(),
    public leaveTm: Date = null,
    public duration: number = -1,
  ) { /**/ }

  public toString() {
    return `[page:${ this.page } , enterTm:${ this.enterTm } ,` +
      `leaveTm:${ this.leaveTm } ,duration:${ this.duration }]`;
  }
}
```

### 使用方法

前提条件：因为`getTrace`中使用了`NavController`，故需要页面中注入`NavController`，并将实例名固定为`navCtrl`。 示范：`constructor(public navCtrl: NavController){}`

在每个页面中：

```js
  @CrmTrackor.ViewDidEnterTrackor
  public ionViewDidEnter() {
     // 页面特定逻辑
  }

  @CrmTrackor.ViewDidLeaveTrackor
  public ionViewDidLeave() {/* empty method */ }
```

### 效果

初始化时进入列表页面：

![]({{site.url}}/assets/img/fe-trackor-system/初始化进入列表页面.png)

列表进入详情：

![]({{site.url}}/assets/img/fe-trackor-system/列表进入详情.png)

详情返回列表：

![]({{site.url}}/assets/img/fe-trackor-system/详情返回列表.png)

### 记录到后端

最后，在页面卸载前将路由记录发送到后端：

```js
public ngOnInit() {
    window.addEventListener( "unload", () => {
      this.crmTrackor.track2Server( CrmTrackor.pageTraces.join( `->` ) );
    } );
  }
```

### 相关代码

[crm-trackor.service.ts]({{site.url}}/assets/js/fe-trackor-system/crm-trackor.service.ts)

# 启动性能埋点

主要利用了`performance.timing API`，一些相关的资料：

1. [初探 performance – 监控网页与程序性能](http://www.alloyteam.com/2015/09/explore-performance/)
2. [记录使用Performance API遇到的问题](https://segmentfault.com/a/1190000011850869)
3. [前端性能优化 —— 前端性能分析](https://mp.weixin.qq.com/s/v1Tn1WQqXlQV-hEtZCqppA)

这里直接贴出代码：

```js

  /**
   * 记录页面加载性能数据
   *
   * @author 80374787 刘斌
   * @memberof CrmTrackor
   */
  public trackorPerformance() {
    // 参考performance api，此处计算的这些时间也许不能满足业务需求，后续看需求调整。
    const timing = performance.timing;
    const readyStart = timing.fetchStart - timing.navigationStart;
    const redirectTime = timing.redirectEnd - timing.redirectStart;
    const appcacheTime = timing.domainLookupStart - timing.fetchStart;
    const unloadEventTime = timing.unloadEventEnd - timing.unloadEventStart;
    const lookupDomainTime = timing.domainLookupEnd - timing.domainLookupStart;
    const connectTime = timing.connectEnd - timing.connectStart;
    const requestTime = timing.responseEnd - timing.requestStart;
    const initDomTreeTime = timing.domInteractive - timing.responseEnd;
    const domReadyTime = timing.domComplete - timing.domInteractive;
    const loadEventTime = timing.loadEventEnd - timing.loadEventStart;
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    this.logger.log( "准备新页面时间耗时: " + readyStart );
    this.logger.log( "redirect 重定向耗时: " + redirectTime );
    this.logger.log( "Appcache 耗时: " + appcacheTime );
    this.logger.log( "unload 前文档耗时: " + unloadEventTime );
    this.logger.log( "DNS 查询耗时: " + lookupDomainTime );
    this.logger.log( "TCP连接耗时: " + connectTime );
    this.logger.log( "request请求耗时: " + requestTime );
    this.logger.log( "请求完毕至DOM加载: " + initDomTreeTime );
    this.logger.log( "解析DOM树耗时: " + domReadyTime );
    this.logger.log( "load事件耗时: " + loadEventTime );
    this.logger.log( "加载时间耗时: " + loadTime );

    this.track2Server( JSON.stringify( timing ) );
  }
```

然后在页面加载之后将这些数据发送到后端：

```js
export class MyApp  implements OnInit{
    public ngOnInit() {
        // 测试发现，若执行的时机不对，timing中的一些时间点为0. 具体也可以阅读上述链接中的文档。
        window.addEventListener("load",()=>{
            serTimeout(()=>{
                this.crmTrackor.trackorPerformance();
            },3000);
        });
      }
}
```

