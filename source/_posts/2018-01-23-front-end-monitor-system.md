---
title: '前端监控系统的尝试'
img: malaysia.jpg # Add image post (optional)
date: 2018-01-23 09:25:00

tag: [JAVASCRIPT]
---

我们的前端项目一直没有监控体系，导致每次出问题都要下机房翻错误日志，效率奇低。另外，有时客户跟我们反馈 BUG 时，我们并不知道他的手机上究竟是出了什么错，只能尽量在测试机上复现，效率也很低，而且很多时候的错误无法复现。

基于上面的痛点，我尝试了搭建一个简单的监控体系，虽然目前还处于`DEMO`阶段，但顺着这条思路走下去，还是可以在很大程度上解决以上问题。 由于平时项目很忙，不一定每天都有时间跟进，所以将目前的成果和技术细节记录下来。

# 前端错误日志收集

我们有 3 个级别的错误日志上报

- 专门的`logger`服务，提供了`error`方法，业务开发时很多时候使用它来打印日志
- `Angular`框架级别`ErrorHandler`捕捉框架级别全局错误
- 全局的`window.onerror`监听，可以捕捉到框架之外的错误

## logger 服务

我们会在它的 error 方法中上报错误日志：

```js
public error( message?: any, ...optionalParams: any[] ) {
   console.error( message, ...optionalParams );
   this.log2Server( {
       message,
       stack: "",
       other: optionalParams.map(( item ) => JSON.stringify( item ) ).join( `,` ),
   } );
}

public log2Server( { message, stack, other }: { message: string, stack: string, other?: string } ) {
   const param = [
       `message=${ encodeURIComponent(message) }`,
       `stack=${ encodeURIComponent(stack) }`,
       `userInfo=${ encodeURIComponent(this.userInfoStr) }`,
       `other=${ encodeURIComponent(other) }`,
   ].join( `&` );

   // use beacons to send log.
   ( new Image() ).src = `${ this.logServerUrl }?${ param }`;
}

private getLoginUserInfo() {
   return {
       userId: this.loginService.getLoginUserId(),
    	  // ... other user info
   };
}
```

## ErrorHandler

Angular 框架给我们提供了这样一个服务来捕捉全局错误，可以继承框架自带的服务，然后扩展自己的特定逻辑。可以参考这两篇博客：

- [Global Error Handling with Angular2+](https://medium.com/@amcdnl/global-error-handling-with-angular2-6b992bdfb59c)

- [Angular 2 — Custom Exception Handler](https://netbasal.com/angular-2-custom-exception-handler-1bcbc45c3230)

我们可以在捕捉到框架全局错误时，将这个服务上报到服务器。这里直接注入上面的`LoggerService`来复用它的代码：

```js
@Injectable()
export class MyErrorHandler implements ErrorHandler {
    private crmLogger: CrmLogger;

    constructor(
        private injector: Injector,
    ) {
        this.myLogger = injector.get( MyLogger );
    }

    public handleError( error: any ): void {
        console.error( `MyErrorHandler => `, error );
        this.myLogger.log2Server( {
            message: error.message,
            stack: error.stack,
            other: "",
        } );

        throw error;
    }
}
```

## window.onerror

这个没什么好说的了，随便在网上一搜都可以发现他的用法，也可以参见[MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onerror)。 我们同样在捕捉到错误后上报：

```js
window.onerror = function(message, source, lineno, colno, error) {
  var other = {
    source: source,
    lineno: lineno,
    colno: colno,
  };
  var param = [
    'message=' + encodeURIComponent(message),
    'stack=' + encodeURIComponent(error.stack),
    'userInfo=' + encodeURIComponent(userInfoStr),
    'other=' + encodeURIComponent(JSON.stringify(other)),
  ].join('&');

  console.error('window.onerror => ', param);

  new Image().src = logServerUrl + '?' + param;
};
```

# 监控后台错误堆栈解析

在将错误日志传到后端之后，后端就可以利用这些信息了。但在产品模式下，前端传过来的堆栈信息是看不懂的，每一行都是例如

```js
 at e.ngOnInit (http://localhost:1764/build/1.951ade2aa66addddc2b5.js:1:26650)
```

这个 js 文件有可能是多个源文件合并到一块的，我们除了能猜测到是哪个组件的`OnInit`钩子里除了错，其他一概不知。为了让错误更具可读性，有必要将其还原到真正的 ts 源代码中的位置。

这就需要用到`sourcemap`了，简单来说，我们在压缩混淆 js 文件时，可以同时生成一个 map 文件，如上面的那行错误信息，就会有一个`1.951ade2aa66addddc2b5.js.map`文件。 这个文件提供了完整的从压缩后每个位置到源代码每个位置的映射关系。具体介绍可以[看这里](http://www.ruanyifeng.com/blog/2013/01/javascript_source_map.html)

我们要做的，就是做一个小工具，自动的把上面这样的信息，转换成映射后的位置信息。

## html

我们的页面很简单：

```html
<section>
  <form action="">
    <fieldset>
      <legend><h1>原始堆栈</h1></legend>
      <textarea class="origin-stack" style="min-height: 300px;width: 100%;"> </textarea>
    </fieldset>
  </form>
</section>

<section>
  <form action="">
    <fieldset>
      <legend><h1>映射堆栈</h1></legend>
      <button type="button" id="use-sourcemap-btn">开始映射</button>
      <p class="map-error"></p>
      <h3>SourceMap映射后堆栈：</h3>
      <pre class="mapped-stack"></pre>
    </fieldset>
  </form>
</section>

<script src="../javascripts/source-map.min.js"></script>
<script src="../javascripts/map-stack-helper.js"></script>
<script src="../javascripts/map-error-stack.js"></script>
```

上面一块用于给用户粘贴原始的堆栈信息，下面提供一个按钮，用于转成成映射后的堆栈信息。 最下面引入了 3 个`js`文件。 `source-map.min.js`是在[github](https://github.com/mozilla/source-map)上找到的一个利用`sourcemap`的映射库。其他两个是我们的真正来做转换的代码。

## js

**`map-error-stack.js`：**

```
var originStack = document.querySelector('.origin-stack');
var mappedStack = document.querySelector('.mapped-stack');
var useSourcemapBtn = document.querySelector('#use-sourcemap-btn');

useSourcemapBtn.addEventListener("click", function(e) {
    var originStackInfo = originStack.value;
    mapStackHelper(originStackInfo, (error, result) => {
        if (error) {
            mapError.textContent = `尝试映射出错: ${error}`;
            mappedStack.textContent = ``;
            return;
        }
        mappedStack.textContent = result;
    });
});
```

点击按钮时会利用在`map-stack-helper.js`中的帮助函数来自动映射整个错误堆栈。

**`map-stack-helper.js`：**

**第一步，需要解析每一行错误信息，提取出出错的 js 文件路径、行号、列号。利用简单的正则就可以做到：**

```js
var mapStackHelper = function(originStackInfo, cb) {
  /**
   * since there maybe a lot of urls are duplicated, we do not need the fetch them one by one,
   * use a set to get the unique ones
   */
  var urlSet = new Set();

  var errorLocationList = originStackInfo.split('\n').map(info => {
    var errorLocation = info.match(/([^\(]+)\((.+\.js)\:(\d+)\:(\d+)/); // url:row:column
    if (!errorLocation) {
      return { info };
    }

    urlSet.add(errorLocation[2]);

    return {
      info: info,
      errorPrefix: errorLocation[1],
      url: errorLocation[2], // errorLocation[0] is the entire matched string,followed by every captured group
      row: errorLocation[3],
      column: errorLocation[4],
    };
  });
  // ...
};
```

这里如果可以解析，那么就把各部分分开存储。如果无法解析，就直接返回原始的整行信息。其中用到了一个`Set`用于去重，因为很多时候，错误信息对应的`url`是重复的。

**第二步，根据解析到的 url，去获取对用的 map 文件。这里因为是 demo，所以直接假设 map 文件的位置和 js 文件在同一个文件夹。**

```js
/**
 * fetch all sourcemap corresponding the urlSet
 */
var sourceMapContentPromiseList = Array.from(urlSet).map(url => {
  var sourceMapUrl = url + `.map`;
  return fetch(sourceMapUrl)
    .then(response => response.text())
    .then(sourceMapContent => ({ url, sourceMapContent }))
    .catch(error => {
      console.error(`failed to fetch ${sourceMapUrl}`);
      return {
        url,
        sourceMapContent: null,
      };
    });
});
```

**第三步，拿到所有 sourcemap 文件后，我们就可以得到一个 js 文件与 map 文件的映射。然后针对原始错误堆栈的每一行，获取到对应的 sourcemap 文件，最后根据行号列号就可以得到对应的 ts 文件名：**

```js
Promise.all(sourceMapContentPromiseList)
  .then(sourceMapContentList => {
    //  cache  sourcemap into a map
    var urlContentMap = new Map();
    sourceMapContentList.forEach(item => {
      return urlContentMap.set(item.url, item.sourceMapContent);
    });
    return urlContentMap;
  })
  .then(urlContentMap => {
    return errorLocationList.map(errorLocation => {
      if (!errorLocation.url || !urlContentMap.has(errorLocation.url) || !urlContentMap.get(errorLocation.url)) {
        return errorLocation.info;
      }
      var smc = new sourceMap.SourceMapConsumer(urlContentMap.get(errorLocation.url));
      var originPosition = smc.originalPositionFor({
        line: +errorLocation.row, // transform to integer
        column: +errorLocation.column,
      });
      return `${errorLocation.errorPrefix}(${originPosition.source}:${originPosition.line}:${originPosition.column})`; // ignore originPosition.name
    });
  })
  .then(mappedStackList => mappedStackList.join('\n'))
  .then(mappedStackInfo => cb(undefined, mappedStackInfo))
  .catch(error => {
    console.error(`Failed SourceMapConsumer`, error);
    cb(`Failed SourceMapConsumer` + error, mappedStackInfo);
  });
```

上面的

```js
var smc = new sourceMap.SourceMapConsumer(urlContentMap.get(errorLocation.url));
```

生成的对象，就可以利用它的`originalPositionFor`方法获取映射后的位置了。

最后我们把映射后的堆栈信息再拼接起来，就可以得到映射后的堆栈信息了~

## 效果

![原始堆栈](/images/front-end-monitor/origin_error_stack.png)

![映射后堆栈](/images/front-end-monitor/mapperd_error_stack.jpg)

# 后续计划

其实上面的东西我自己虽然早就开始思考了，但直到参加了`D2`大会，正好有一个阿里的讲师详细描述了他们的做法，我做的这些也是受到了他们的启发。这里将相关链接放出来：

- [把前端监控做到极致 - 视频](https://tianchi.aliyun.com/forum/videoStream.html#postsId=3631)
- [把前端监控做到极致 - PPT](https://files.alicdn.com/tpsservice/39299d06993224a40767f1d29c6345e7.pdf)

后续会继续参考他们的做法 😆😆😆😆
