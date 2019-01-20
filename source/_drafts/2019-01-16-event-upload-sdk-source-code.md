项目中接入了一个事件埋点库`tea-sdk`，这个库在公司很多其他项目都接入了，本着好奇决定研究内部实现，本文就是对它的源码解析。

# 使用方式

这里只展示`cdn`异步接入方式：

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Title</title>
    <script>
      // 1. 加载异步初始化代码
      (function(win, export_obj) {
        win['TeaAnalyticsObject'] = export_obj;
        if (!win[export_obj]) {
          function _collect() {
            _collect.q.push(arguments);
            return _collect;
          }

          _collect.q = _collect.q || [];
          win[export_obj] = _collect;
        }
        win[export_obj].l = +new Date();
      })(window, 'collectEvent');
    </script>
    <script async src="cdn-url-of-sdk"></script>

    <script>
      // 2. 初始化SDK，必须。
      window.collectEvent('init', {
        app_id: xxxx, //  number类型的appId
        channel: 'cn',
        log: true, // 开启调试日志
      });

      // 3. 按需配置
      window.collectEvent('config', {
        _staging_flag: 1, // 是否发到测试库
        evtParams: {
          // 设置公共属性
          username: 'zhangsan',
          commonParams: 'daily',
          e: 'f',
        },
      });

      // 5. 发送事件。事件会等到Tea.send()调用后，才真正发出。
      window.collectEvent('enter_page', {
        from: 'index',
      });

      // 4. 配置完毕
      window.collectEvent('send');
    </script>
  </head>
  <body></body>
</html>
```

异步接入的意思是：在 sdk 加载完之前，可以先利用约定好的`mock`函数将埋点数据放入内存缓存，等到`sdk`就绪会找到这些缓存开始正常上报流程。

如上，我们约定的关键函数名字有两个：`TeaAnalyticsObject`和`collectEvent`，`sdk`届时会自动找到这两个名字，我们后面会提到。

# 入口

通过打包配置可以找到入口文件是`core/main.js`，其中关键代码如下：

```js
const instanceMap = {};
const instanceCmdMap = {};

const defaultCollectorClient = (...args) => {
  defaultCollectorClient.q.push(args);
  processGlobalCmdQueueCache();
};
defaultCollectorClient.q = [];
defaultCollectorClient.l = +new Date();

transferAsyncCollector(defaultCollectorClient); // 移交已有的CollectorClient数据到defaultCollectorClient
processGlobalCmdQueueCache(); // 更新instanceMap缓存，并在随后对每一个事件触发CollectorAsync

export default defaultCollectorClient;
```

`transferAsyncCollector`是异步接入 sdk 很关键的一环，它就是上面说到的接管`mock`函数的流程，**所以经过这一步，我们就拿到了所有 sdk 加载前上报的埋点。**

```js
// 异步引入，则应该移交并替换SDK的client。
const transferAsyncCollector = newClient => {
  const nameSpace = window.TeaAnalyticsObject; // 通常来说就是字符串'collectEvent'
  // 没有，则认为非异步引入
  if (!nameSpace) {
    return;
  }
  if (!window[nameSpace]) {
    throw new Error('async setup code error!');
  }
  // window['collectEvent']通常是一个函数 _collect
  const oldClient = window[nameSpace];
  newClient.q = oldClient.q || [];
  newClient.l = oldClient.l || +new Date();
  window[nameSpace] = newClient; // 替换 window['collectEvent']
};
```

`processGlobalCmdQueueCache`主要是用来更新内部的`instanceMap`缓存,然后处理所有`event`：

```js
const processGlobalCmdQueueCache = () => {
  /**
   * 处理client.q数组，归一化元素加入instanceCmdMap。 q中元素格式可能有两种:
    1. [eventName: string, args: Object]
    2. [eventName: string, args: Object][]
   */
  defaultCollectorClient.q.forEach(cmdArgumentsObj => {
    const cmdArray = [].slice.call(cmdArgumentsObj);
    // 批处理命令，加入instanceCmdMap
    if (type.isArray(cmdArray[0])) {
      cmdArray.forEach(batchCmdArray => {
        processCmdArray(batchCmdArray);
      });
    } else {
      processCmdArray(cmdArray);
    }
  });

  // 处理所有event
  Object.keys(instanceCmdMap).forEach(name => {
    // instanceCmdMap[name]二位数组: [eventName:string, args:Object ][]
    execInstanceCmds(name, instanceCmdMap[name]);
    instanceCmdMap[name] = [];
  });
  defaultCollectorClient.q = [];
};
```

处理`event`的核心是`execInstanceCmds`函数，它又是利用`CollectorAsync`类来做这件事：

```js
const getInstance = name => {
  if (!instanceMap[name]) {
    instanceMap[name] = new CollectorAsync(name);
  }
  return instanceMap[name];
};

const execInstanceCmds = (instanceName, cmdArray) => {
  cmdArray.forEach(cmd => {
    getInstance(instanceName)(...cmd);
  });
};
```

所以其实到最后就是利用`CollectorAsync`处理埋点数据。

如果在`sdk`加载完之后调用`defaultCollectorClient`，会直接触发`processGlobalCmdQueueCache`，同样最后也是走到了`CollectorAsync`这一步。

综上，`main.js`做了 3 件事：

- `transferAsyncCollector(defaultCollectorClient);`移交已有的`CollectorClient`数据到`defaultCollectorClient`
- `processGlobalCmdQueueCache();`更新`instanceMap`缓存，并在随后对每一个事件触发`CollectorAsync`
- 之后每次在业务代码中调用`defaultCollectorClient`进行埋点，都会触发`CollectorAsync`

接下来我们的重点就是`CollectorAsync`。

# CollectorAsync

总体来说，这个类比较简单，就是封装原始的 Collector 对象，然后做了 3 件事：

- 内部维护一个事件队列
- 如果已经触发了 `init` 事件，那么新事件直接执行；否则将事件压入队列，等待 `init` 事件的到来
- `init` 事件到来后，先执行 `init`，再依次执行队列中其他事件

因为`main.js`中是调用了构造函数的返回值，我们先看一下构造函数：

```js
constructor(name) {
    this.name = name || `Collector${+new Date()}`;
    // cmdQueue二维数组:
    // [
    //     [ eventName:string, args: Object ]
    //   ]
    this.cmdQueue = [];
    this.colloctor = new Collector(this.name);
    this._isQueueProcessed = false;

    this._processCmdQueue();

    // 绑定同步的调用方式，略。。。

    return this._exportCollect;
  }

  /**
   * 实例化后返回的函数。
   * - 作为api调用的载体。
   * argsArray: [eventName: string, args: Object]
   */
  _exportCollect = (...argsArray) => {
    // 如果已经触发了init事件，那么新事件直接执行；否则将事件压入堆栈，等待init事件的到来
    if (this._isQueueProcessed) {
      this._executeCmd(...argsArray);
      return;
    }
    this.cmdQueue.push(argsArray);
    this._processCmdQueue();
  };
```

所以`main.js`中其实是调用的`_exportCollect`，并传入了`eventName`和其他参数。`cmdQueue`就是上面说的命令队列。

`_processCmdQueue`用于处理命令队列，如果队列中有某个命令的`eventName`是`init`，则先执行此命令再依次执行命令；如果没有`init`命令，则安静等待它的到来:

```js
_processCmdQueue = () => {
  if (this.cmdQueue.length === 0) {
    return;
  }
  const findIndex = (array, val, key) => {
    let itemIndex = -1;
    array.forEach((i, index) => {
      const value = typeof key !== 'undefined' ? i[key] : i; // value: eventName
      if (value === val) {
        itemIndex = index;
      }
    });
    return itemIndex;
  };
  const initCmdIndex = findIndex(this.cmdQueue, 'init', '0'); // 找到init事件
  if (initCmdIndex !== -1) {
    this._isQueueProcessed = true;
    // 优先执行init命令
    this._executeCmd(...this.cmdQueue[initCmdIndex]);
    // 执行其他剩余命令
    this.cmdQueue.forEach((cmd, index) => {
      if (index !== initCmdIndex) {
        this._executeCmd(...cmd);
      }
    });
    this.cmdQueue = [];
  }
};
```

执行单条命令是在`_executeCmd`中，它内部又是调用了`Collector`类的方法：

```js
/**
 *  只可能是函数调用，或者是事件上报
 * argsArray: [eventName: string, args: Object]
 */
_executeCmd = (...argsArray) => {
  const cmdOrEvent = argsArray[0]; // eventName
  if (Collector.exportMethods.indexOf(cmdOrEvent) > -1) {
    // 一些内置事件： init、config、start，这些都是在为埋点做准备工作
    this.colloctor[cmdOrEvent](...argsArray.slice(1));
  } else {
    // 真正尝试发送埋点
    this.colloctor.event(...argsArray);
  }
};
```

以上就是整个`CollectorAsync`的逻辑了，其实它就是为`Collector`做了一层缓冲。接下来把话筒交给`Collector`。

# Collector

从`CollectorAsync._executeCmd`能看出来，`Collector`内部的方法分为两类： 内置的`init、config、start`，以及通用的`event`。

由于`CollectorAsync`会控制第一个调用的肯定是`init`方法，我们就从这里着手：

```js
init = conf => {
  // 。。。
  this.channel = new Channel({
    ...conf,
    name: this.name,
  });

  // ...
};
```

就是初始化了一个`Channel`对象，这个对象是整个埋点逻辑的核心，后面会详细说到。

剩余的`config`方法很简单就直接跳过了，它无非是设置一些配置项。

到目前为止，我们没有见到任何地方有和有端打交道，毕竟埋点数据最终要发送给后端的，在哪里触发的呢？

`sdk`的接入文档有特别说到，**我们需要手动触发一个叫`start`或`send`的事件，这个事件会打开一个标志位并向后端上报一次埋点。随后我们触发自定义埋点时，就会无阻碍了。**

`send`方法其实已经废弃了，我们只看`start`方法：

```js
start = () => {
  if (this.channel.isUserTokensReady) {
    if (this._isSendFuncCalled) {
      return;
    }
    this._isSendFuncCalled = true;

    if (this._autoSendPV) {
      this.predefinePageView();
    }
    this.channel.setReady(true);
  } else {
    this.callbackSend = true;
  }
};
```

上面的`isUserTokensReady`值得描述一下，它标明是否获取到了用户`token`，只有获取了 2 个关键的 id 才算有了`token`：`user_unique_id`、`web_id`。在初次启动时会通过本地生成或接口获取这两个`id`，之后会缓存在本地`localStorage`。

如果已有`token`，则会触发`PV`事件、调用`channel.setReady`触发一次上报，这个后面再说。

如果在调用`start`时我们可能还没有拿到`token`，此时就要等待拿到`token`后再调用`start`,这个地方的逻辑在哪里呢？在`init`方法中我省略了一段逻辑：

```js
init = conf => {
  this.channel.callback = () => {
    if (this.callbackSend) {
      this.start();
    }
  };
};
```

这个`callback`就是一个“君子约定”,`channel`对象会在拿到`token`后调用`this.callback`，从而再次触发`start`方法， 举例：

```js
// appChannelEnv.js

requestWebId = () => {
  // ...
  if (this.callback) {
    this.callback();
  }
  // ...
};
```

不管怎么样，最终我们的`start`方法总会顺利走进`if`逻辑块，接下来看看`predefinePageView`方法，它用于触发`PV`事件：

```js
predefinePageView = (params = {}) => {
  const defaultPvParams = {
    title: document.title || location.pathname,
    url: location.href,
    url_path: location.pathname,
  };
  const mergedParams = { ...defaultPvParams, ...params };
  this.event('predefine_pageview', mergedParams, true);
};
```

平淡无奇，最后就是通用的`event`方法了。

```js
/**
 * args: [eventName: string, args: Object, highPriority?: Boolean]
 */
event = (...args) => {
  const isLastParamBoolean = type.isBoolean(args[args.length - 1]);
  const highPriority = isLastParamBoolean ? args[args.length - 1] : false;
  const normalArgs = isLastParamBoolean ? args.slice(0, args.length - 1) : args;

  const [eventOrArray] = normalArgs;
  let eventsArray = [];
  if (!type.isArray(eventOrArray)) {
    eventsArray[0] = normalArgs;
  } else {
    eventsArray = normalArgs;
  }
  // preprocessEvent: 归一化事件名和参数，收拢到一个对象当中{event：String，params: Object, local_time_ms: Number}
  // 之后eventsArray就是一个对象数组
  eventsArray = eventsArray.map(eventArray => preprocessEvent(...eventArray));

  this.channel.event(eventsArray, highPriority);
};
```

最终也是调用`channel`对象的方法，注意`PV`事件是 “高优先级”的。

总结一下`Collector`其实就是`channel`对象的简单封装，真正干活的还是`channel`，接下来重点研究它。

# AppChannel

## 初始化

照旧先看下构造函数：

```js
  constructor(options) {
    super();

    const { log, disable_storage, max_batch_num = 5, batch_time = 30 } = options;
    this.init(options);
    this.maxBatchNum = max_batch_num;
    this.waitForBatchTime = batch_time; // ms
    this.isReady = false;
    this.addListener(); // 注册事件，页面卸载前发送埋点

    this.memoryCacheManager = new StorageClient(true); // 在内存中缓存
    this.eventStorage = new EventsStorageManager({ // 缓存埋点上报基本单元：“包”
      disable_storage,
    });
    this.eventStorage.setStorageKey(this.evtDataCacheKey); // this.init里已经设置。

    this.eventSender = new EventSender({ // 发送埋点请求
      logger: this.logger,
    });
    this.reportErrorCallback = () => {};
  }

  init = (options) => {
    const { app_id, channel, log, channel_domain, name } = options;

    this.initConfigs(options); // 确定一些标志位
    this.initUrls(channel, channel_domain); // 确定reportUrl和userTokensPrefix
    this.setEnv('app_id', app_id);
  };
```

总体就是一些初始化工作，结合注释应该很简单。上面的`addListener`值得把代码贴出来，看起来作者踩了一些坑：

```js
// 注册事件，页面卸载前发送埋点
addListener = () => {
  // 为了确保兼容性，保留unload和beforeunload。
  // Safari Desktop下直接关闭页面，不会触发visiblchange
  window.addEventListener('unload', () => this.report(true), false);
  window.addEventListener('beforeunload', () => this.report(true), false);

  // https://www.igvita.com/2015/11/20/dont-lose-user-and-app-state-use-page-visibility/
  // http://output.jsbin.com/zubiyid/latest/quiet
  // https://www.google-analytics.com/analytics.js
  // 不再使用unload和beforeunload。是因为很多场景下并不会触发这两个事件。
  // beforunload时页面依旧可见，所以也可能有事件持续发生。
  // unload时虽然页面不可见了，但是有些场景（移动端）下不会触发，详见上方链接。
  // visibilitychange基本可以满足需求。页面不可见、触发场景多。ga也是如此。
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.visibilityState === 'hidden') {
        this.report(true);
      }
    },
    false,
  );
};
```

另外需要注意的是`setEnv`方法，它会判断是否`token`已就绪。

```js
setEnv = (key, value) => {
  if (key === 'app_id') {
    this.checkUserToken(value);
  }

  // ...

  this.set(key, value); // 设置配置项
};
```

对于`app_id`的设置会额外检查`token`是否就绪，没有的话会去拉取：

```js
checkUserToken = app_id => {
  const tokensCacheKey = `${TEA_CACHE_PREFIX}tokens_${app_id}`;
  this.tokensCacheKey = tokensCacheKey;
  this.transferFromCookie(); // 兼容老版sdk
  // 如果user_unique_id在黑名单中，清空userTokens;
  // UserTokens = { web_id, ssid, user_unique_id}
  const userTokens = this.purifyBlackUuid(this.getUserTokens());

  // 若已经有web_id和uuid了，则认为非初次登录。
  // ssid 非必须。所以不用检测ssid了。目前，默认为空字符串。
  if (userTokens.user_unique_id && userTokens.web_id) {
    this.envInfo.user.user_unique_id = userTokens.user_unique_id;
    this.envInfo.user.web_id = userTokens.web_id;
    this.envInfo.user.ssid = userTokens.ssid || '';
    this.unlock(); // this.isUserTokensReady = true. 这样Collector.start就能正常进行了
  } else {
    this.requestWebId(app_id); // 设置3个id
  }
};
```

`getUserTokens`会尝试从`LS`中获取此前存放的`token`，如果没有的话就会去拉取。

```js
// 获取并设置userToken相关id
requestWebId = () => {
  const successCallback = data => {
    // 设置id 。。。

    // 存储id
    this.saveTokenToStorage({
      web_id,
      ssid,
      user_unique_id: web_id,
    });

    // 通知Collector，触发它的start方法
    if (this.callback) {
      this.callback();
    }
  };

  const getWebIdFromLocal = () => {
    successCallback({
      web_id: generateWebid(), // 本地生成一个webid
      ssid: '',
    });
  };

  const getWebIdFromServer = () => {
      // 调用接口获取data，其中包行相关id...
      successCallback(data);
    );
  };

  if (this.isWebidDisabled) {
    getWebIdFromLocal(); // 本地生成web_id
  } else {
    getWebIdFromServer(); // 远程拉取web_id
  }
};
```

本地的`web_id`比较`trick`，我没有看懂，借助的是[这个算法](https://gist.github.com/jed/982883)

经过以上步骤，我们的`Channel`初始化就完成啦，并且`token`什么的也都准备好了。接下来就是关注怎么上报埋点了。

## 上报埋点

按照正常的流程，我们业务代码里调用`window.collectEvent`，最后调用的都是`channel.event`，所以这个可以当做真正埋点逻辑的入口，在此之前的一大串逻辑都是准备工作。

```js
/**
 * 用户激活了一个事件，把该事件缓存下来，然后通知上报。
 * @evtData 事件 {event: string,params:Object,local_time_ms:number }[]
 * @highPriority 是否高优先级
 */
event = (evtData = [], highPriority = false) => {
  const cache = this.memoryCacheManager.getItem(this.evtDataCacheKey) || [];
  const newCache = highPriority ? [...evtData, ...cache] : [...cache, ...evtData];
  this.memoryCacheManager.setItem(this.evtDataCacheKey, newCache); // 缓存到内存中

  if (newCache.length >= 5) {
    this.report();
  } else {
    // debounce, 设置定时器一段时间后固定上报
    if (this.eventReportTimer) {
      clearTimeout(this.eventReportTimer);
    }
    this.eventReportTimer = setTimeout(() => {
      this.report();
      this.eventReportTimer = null;
    }, this.waitForBatchTime);
  }
};
```

为了保证性能，不频繁发送埋点请求，`sdk`会先在本地缓存事件，等攒够了足够的事件再批量发送出去。目前的阈值是 5 条，同时当用户从始至终都没有激活超过 5 条，也会固定一段时间后发送，这个默认时间是 `30ms`。

```js
// 整理事件，合并成最终的事件格式，并判断是否发送，以及发送的条数。
report = (isUnload = false) => {
  // 从内存缓存中取出rawEvent： {event: string,params:Object,local_time_ms:number }[]，合并整理为完整事件。
  const rawEventData = this.memoryCacheManager.getItem(this.evtDataCacheKey) || [];
  this.memoryCacheManager.removeItem(this.evtDataCacheKey);
  /*
     * batchCockedEvents格式：
      [
        {
     *    events: { event: string, params: string, local_time_ms: number }[],
     *    header: Object,
     *    user: Object,
     *    verbose: number,
     *    '__disable_storage__': any,
     *  }
     * ]
     */
  const batchCockedEvents = this.mergeEnvToEvents(rawEventData); // 将事件分组

  this.sendData(batchCockedEvents, isUnload);
};

/**
 * 把原始的事件信息，分批次与header、user合并为一个完整的事件结构。
 * 返回格式： [
 *   {
 *     events: { event: string, params: string, local_time_ms: number }[],
 *     header: Object,
 *     user: Object,
 *     verbose: number,
 *     '__disable_storage__': any,
 *   }
 * ]
 */
mergeEnvToEvents = (rawEvents /* 原始事件数据 */) => {
  const channelEnv = this.mergeEnv();

  // 按照__disable_storage__的值分组。
  // [1,1,1,1,1,1,1,0,0,1,0,1]  -->> [[1,1,1,1,1],[1,1],[0,0],[1],[0],[1]]
  const batchRawEvents = this.groupByValue(rawEvents, item => !!item.params.__disable_storage__);

  // 处理成完整的事件结构。
  // batchRawEvents: { event: string, params: Object, local_time_ms: number }[][];
  const batchCockedEvents = batchRawEvents.map(eventArray => ({
    events: eventArray.map(item => {
      const params = {
        ...this.evtParams, // 用户自定义参数
        ...item.params,
      };
      delete params.__disable_storage__; // 删掉非设置的属性
      return {
        ...item,
        params: JSON.stringify(params),
      };
    }),
    user: channelEnv.user,
    header: channelEnv.header,
    verbose: this.debugMode ? 1 : undefined,
    __disable_storage__: eventArray[0].params.__disable_storage__,
  }));

  return batchCockedEvents;
};

// 按照value分组，每组最多threshold个元素
groupByValue = (list = [], valueFn = item => item, threshold = 5) => {
  const result = [];
  let index = 0;
  let prev;
  list.forEach(item => {
    const cur = !!valueFn(item);
    if (typeof prev === 'undefined') {
      prev = cur;
    } else if (cur !== prev || result[index].length >= threshold) {
      index += 1;
      prev = cur;
    }
    result[index] = result[index] || [];
    result[index].push(item);
  });

  return result;
};
```

上面的代码有点长，大概来说是将内存中的事件队列按照`__disable_storage__`属性进行分组，然后将结果传递给`sendData`。

```js
// 将事件分批次，并存储、发送。
sendData = (batchCockedEvents, isUnload) => {
  // 按照__disable_storage__的值分组。
  // [1,1,1,1,1,1,1,0,0,1,0,1] -->> [[1,1,1,1,1,1],[1,1],[0,0],[1],[0],[1]]
  const batchEvents = this.groupByValue(batchCockedEvents, item => !!item.__disable_storage__);

  batchEvents.forEach(event => {
    const ajaxId = uuid(); // 生成发送id，每个id对应一个发送的数据，用于成功后删除对应id的缓存数据。
    if (!event[0].__disable_storage__) {
      this.eventStorage.add(ajaxId, event); // event存入LS/memory
    }
    this._sendData(ajaxId, event, isUnload); // event是一个数组
  });
};
```

这里又进行了一次分组。。。。 `batchEvents`中的每个子数组我们称为一个`包`，在调用`_sendData`发送这个`包`之前，会  将其塞入到`eventStorage`，等到发送成功了再删除掉，**这是为了防止在发送过程中出错导致包丢失。**

最后终于要向后端发送埋点数据啦~~~

```js
// 调用接口发送事件。
_sendData = (ajaxId, data, isUnload) => {
  // 开始上报数据，设置标识位，当前上报动作结束之前，不允许上报！
  this.isReporting = true;
  const resetReportStatus = () => {
    this.isReporting = false;
  };

  this.eventSender.send({
    url: this.reportUrl,
    data,
    success: () => {
      resetReportStatus();
      this.sendDataSuccess(ajaxId);
    },
    fail: (eventData, errorCode) => {
      // 成功、失败，都必须标明本次的动作完成
      resetReportStatus();
      this.reportErrorCallback(eventData, errorCode);
      // // 失败之后，隔3s 尝试一次
      setTimeout(() => {
        this.report();
      }, 3000);
    },
    eventError: (eventData, errorCode) => {
      this.reportErrorCallback(eventData, errorCode);
    },
    notSure: resetReportStatus,
    isUnload,
  });
};

// 发送成功后的回调：清理上报完成的事件数据。并触发一次事件上报。
sendDataSuccess = ajaxId => {
  this.eventStorage.delete(ajaxId);

  this.report(); // 检查 mCache，如果有数据，立即上报
};
```

**上传成功后会继续取下一个`包`上传，失败了会每 3s 重试一次。** `isUnload`标明是否处于页面卸载期间，此时会采取一些特殊处理。

### 页面卸载前上报埋点

其实`sdk`会根据浏览器在不同时候采取不同上报形式，`beacon`、隐藏`image`上报、`XHR`：

```js
const request = ({ url, data, success, fail, notSure, isUnload }) => {
  const localData = data;
  // ie8/9只能走图片发送
  if (window.XDomainRequest) {
    sendByImg(url, localData, success, fail);
    return;
  }

  if (isUnload) {
    // sendBeacon: https://developer.mozilla.org/zh-CN/docs/Web/API/Navigator/sendBeacon
    if (window.navigator && window.navigator.sendBeacon) {
      notSure();
      // 无法拿到真正成功与否，就不调用回调清除数据了（后端允许重传）
      const status = window.navigator.sendBeacon(url, JSON.stringify(localData));
      if (status) {
        success();
      } else {
        fail(url, data, ERROR_CODE.BEACON_STATUS_FALSE);
      }
      return;
    }

    sendByImg(url, localData, success, fail);
    return;
  }

  const xhr = new XMLHttpRequest();
  xhr.open('POST', `${url}?rdn=${Math.random()}`, true);
  xhr.onload = () => {
    success(url, localData, xhr.responseText);
  };
  xhr.onerror = () => {
    xhr.abort();
    fail(url, localData, ERROR_CODE.XHR_ON_ERROR);
  };
  xhr.send(JSON.stringify(localData));
};

// 图片上传
const sendByImg = (url, data, success, fail) => {
  try {
    const urlPrefix = url.split('v1')[0];
    if (!urlPrefix) {
      fail(url, data, ERROR_CODE.NO_URL_PREFIX);
      return;
    }
    data.forEach(item => {
      const str = encodePayload(item);
      let img = new Image(1, 1);
      img.onload = () => {
        img = null;
        success();
      };
      img.onerror = () => {
        img = null;
        fail(url, data, ERROR_CODE.IMG_ON_ERROR);
      };
      img.src = `${urlPrefix}/v1/gif?${str}`;
    });
  } catch (e) {
    fail(url, data, ERROR_CODE.IMG_CATCH_ERROR, e.message);
  }
};
```

在页面卸载期间，浏览器会忽略此时的`xhr`，较好的方法是使用`Navigator.sendBeacon()`,浏览器不支持时回退到图片上传。具体参考[MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Navigator/sendBeacon)：

> sendBeacon 主要用于满足 统计和诊断代码 的需要，这些代码通常尝试在卸载（unload）文档之前向 web 服务器发送数据。过早的发送数据可能导致错过收集数据的机会。然而， 对于开发者来说保证在文档卸载期间发送数据一直是一个困难。因为用户代理通常会忽略在卸载事件处理器中产生的异步 XMLHttpRequest。

> 为了解决这个问题， 统计和诊断代码 通常要在 unload 或者 beforeunload 事件处理器中发起一个同步 XMLHttpRequest 来发送数据。同步的 XMLHttpRequest 迫使用户代理延迟卸载文档，并使得下一个导航出现的更晚。下一个页面对于这种较差的载入表现无能为力。

> 有一些技术被用来保证数据的发送。其中一种是通过在卸载事件处理器中创建一个图片元素并设置它的 src 属性的方法来延迟卸载以保证数据的发送。因为绝大多数用户代理会延迟卸载以保证图片的载入，所以数据可以在卸载事件中发送。另一种技术是通过创建一个几秒钟的 no-op 循环来延迟卸载并向服务器发送数据。这些技术不仅有较差的编码模式，其中的一些甚至并不可靠而且会导致非常差的页面载入性能。

> 使用 sendBeacon() 方法，将会使用户代理在有机会时异步地向服务器发送数据，同时不会延迟页面的卸载或影响下一导航的载入性能。

## 小结

`Channel`中的逻辑比其他文件多很多，而且也比较绕，这里做一下小结会比较好消化。

### 核心上报逻辑

- 上报时机： 当一条新 `event` 到来时，查看 `memoryCacheManager` 内数据条数
  - 大于 5 条时，直接触发上报
  - 不够 5 条，固定 30ms 后上报
- 上报过程
  1. 从包队列中取出队首的包，加入 `eventStorage`，然后上报
  2. 上报成功后，从 `eventStorage` 删除这个包，继续取出队列下一个包上报
  3. 上报失败，隔 3s 重试一次
  4. 页面卸载前，上报一次

### memoryCacheManager 内存缓存

- 调用 event 时，将数据加入
- 调用 report 时，将数据移除
- event -> report
  - 数据大于 5 条时
  - 定时 30ms
- value 数据的格式： 一个数组，元素是“最小单元”：

```js
  {
    event: string,
    param: Object,
    local_time_ms: number
  }[]
```

### eventStorage LS/memory 缓存

- report 时将 memoryCacheManager 数据导入 eventStorage，导入过程会转换数据格式，见下方描述
- 埋点上报成功后，删除数据
- value 数据的格式： 一个数组，也称作为“包”

```js
  {
    events: {
      event: string,
      param: Object,
      local_time_ms: number
    }[],
    header: Object,
    user: Object,
    verbose: number,
    __disable_storage__: boolean| undefined
  } []
```

- 上报时是以包为单位

### 数据从 memoryCacheManager 到 eventStorage 的转换

1. 数据在 memoryCacheManager 是简单的一维 event 数组
2. 一维数组先按照**disable_storage**分组，变成复合的对象数组：

```js
{
  events: event[] // 最多 5 条
  __disable_storage__: boolean
  //  。。。
} []
```

3. 上述分组后数据再次被分组, 变成二维数组，二维数组(包队列)每个元素就是上面说的包，每个包的最大长度为 5

```js
{
  events: event[] // 最多 5 条
  __disable_storage__: boolean
  // 。。。
} [][]
```


