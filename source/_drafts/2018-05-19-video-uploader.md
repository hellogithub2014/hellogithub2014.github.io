---
title: 'VideoUploader源码阅读笔记'
img: canyon.jpg # Add image post (optional)
# date: 2017-11-15 20:30:00 +0800
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [Javascript]
---

# 背景

在做品牌广告需求时，页面中会上传视频，在做的时候参考了已有的竞价广告中的视频上传。看代码发现里面是用的一个公司级视频上传组件，使用起来还算简单。另外同事说这个是一个异步上传视频的库，于是就很好奇具体是怎么实现的。

此前大概了解上传这种大文件时需要分片上传，后端会把分片合并，但这种公司级的库，前端具体的每一步是怎么做还不清楚。 于是就想着看看源码，并在这里记录下学习笔记。

# 多个并发的任务队列

此组件库在上传每个视频时，都会有一个跟视频文件关联的`key`，可以同时上传多个视频。 可以想像，在代码内部，必然有一个专门的维护视频上传队列的对象,事实确实如此。

## 结构

**`tasks`**： 用于记录多个并发的任务队列，结构如下

```js
{
	key： {
      task : queue实例,
      vid  : xxx
      status : 1 代表正在运行 2 代表取消运行 3 代表暂停运行
      startTime: 任务队列启动时间点
  }

};
```

每个`key`对应的对象中，包含了任务队列和其他相关属性，可以把这个对象理解为视频上传的上下文。

**`taskList`**: 暂存生命周期中的各个 task.

```js
{
  key: queue实例;
}
```

## addFile

1.  使用时间戳+随机数，计算出一个文件的唯一`key`
2.  添加计算 CRC32 校验码的任务`FileCrc32`放到`tasks[key].task`与`taskList[key]`中. **这个任务用于计算每个文件分片的 CRC**
3.  添加上传预处理的任务`PreUpload`到两个任务队列中。**这个任务用于获取真正上传视频时所需的`vid`、`url`、`signature`和`uploadUrl`**
4.  添加`InitUploadID`任务，**这个任务利用`vid`获取上传所需的`uploadID`**
5.  添加`Upload`任务，**这个任务利用`vid`和`uploadID`分片上传视频，并更新进度**
6.  添加`FileMerge`任务, **这个任务利用`vid`和`uploadId`合并分片，并使用 crc 码进行校验,最后获取`oid`**
7.  添加`VideoCover`任务，**这个任务利用`vid`、`oid`、`signature`向`PreUpload`中获得的`url`发请求获取视频封面以及宽高等信息**

最终，每个任务队列如图所示：

![]({{site.url}}/assets/img/BytedVideoUploader/各个任务队列的属性交互.png)

## start(key: string)

启动`key`对应的任务队列`tasks[key].task`。

# 任务管理队列 Queue

每个任务都有一个`index`属性，表示它在整个流程中的次序。各任务的`index`为：

- `FileCrc32` 0
- `PreUpload` 1
- `InitUploadID` 2
- `Upload` 3
- `FileMerge` 4
- `VideoCover` 5

## 启动队列

### 主流程

每次取队首的任务，执行成功后取下一个任务，直到成功后统计结束时间点、任务执行时间，最后通知`VideoUploader`调用方视频成功。

```js
execTask(task) {
   const key = task.key;
   const context = this.context;
   const length = context.taskList[key].length;
   context.tasks[key]['currentTask'] = task.index;

   /* 已经在上传的那些暂时不管 */
   if (context.tasks[key]['status'] !== 1) {
       return;
   }
   // 执行当前任务，并传递成功和失败的回调
   task && task.func.call(task.context, task.arg, (infor) => {
       // 一条任务执行成功，则存下当前信息和下一条任务的id，用于刷新后restart时进行下一个任务
       const nextTask = context.taskList[key][task.index + 1];
       // crc32阶段不存信息，避免刷了localstorage里面的缓存信息
       if (nextTask && task.index !== 0) {
           context._saveTask(key, {
               currentTask: nextTask.index,
               stage: nextTask.stage
           });
       } else if (task.index === length - 1) {
           // 最后一个流程完成则说明上传成功，清除本地存储
           // （不清除的话下一次上传将使用同一个vid，如果上传成功但转码失败则获取不到新vid）
           context._removeTaskCache(key);
       }

       /* 当条任务执行成功。继续执行下一条任务 */
       if (this.tasks.length > 0) {
           this.start();
       } else {
           context._queueSuccess(key);
       }

       /* 通知外部，队列里的所有任务执行完成 */
       this.success(infor);
   }, (err) => {
       // 任务错误时的处理，见下方任务失败流程
   });
}
```

### 任务失败流程

当执行某条任务失败时，会尝试重试一定次数，直到最终失败，此时会通知外部调用方视频上传失败。

```js
if (err.xhr && err.xhr.status >= 400) {
  this.fail(err);
  return;
}
if (!this.taskError[key]) {
  this.taskError[key] = 1;
  this.execTask(task);
} else if (this.taskError[key] < this.retryTaskTime) {
  // 默认每个任务默认重试3次
  this.taskError[key]++;
  this.execTask(task);
} else {
  // 抛出错误，并将错误信息通知给上传调用者
  err['key'] = key;
  this.fail(err);
}
```

以上就是整个`BytedVideoUploader`的主流程了，核心就是这个`Queue`的调度。接下来就是挨个了解每个任务的流程、何时成功、何时失败。可以用下图表示：

![]({{site.url}}/assets/img/BytedVideoUploader/Queue主流程.png)

# FileCrc32

用于计算文件的 CRC 校验码，其核心代码为：

```js
/*
@Des: crc32实际运算
*/
crc32(file, sliceLength) {
   const crc32 = new Crc32(file, sliceLength, (crc32Array) => {
       this.success(crc32Array);
   }, (err) => {
       this.fail(err);
   });

   /* 启动crc32实际运算 */
   crc32.start();
}
```

可以看到它是利用`Crc32`这个类来进行实际的计算，`Crc32`会把文件分片，分别计算每个分片的校验码，最后返回所有分片校验码的数组`crc32Array`。

分片的大小`sliceLength`是根据视频文件大小决定的：

```js
/*
@Des: 获取文件切割策略，切割步长
*/
getFileSliceLength ( file, getSliceFunc ) {
   let size = file.size;
   let byted = 1024 * 1024;
   if (getSliceFunc && typeof getSliceFunc === 'function') {
       return getSliceFunc(size) || size;
   }
   if (size > 200 * byted) {
       return 50 * byted ; // 视频大于200M时，分片大小为50M
   } else if (size <= 200 * byted && size >= 20 * byted) {
       return 20 * byted; // 视频大于20M，小于200M时，分片大小为20M
   } else {
       return file.size; // 小于20M时，不分片
   }
}
```

`Crc32`就会根据分片大小切割视频文件，关键过程如下：

```js
/*
@Des: 启动运算crc32
*/
readFileCrc32 ( file ) {
   let that = this;
   let blobSize = that.sliceLength;
   let slice = file.slice || file.webkitSlice || file.mozSlice;
   let fileReader = new FileReader();
   let start = 0;
   let end = 0;
   let crc32 = 0;

   function read ( ) {
       if ( end < file.size) {
           end = Math.min(start + blobSize, file.size);
       }
       // 利用FileReader切割文件
       fileReader.readAsArrayBuffer( slice.call( file , start , end ));
       fileReader.onload = function ( e ) {
           crc32 = _crc32( e.target.result, 0 ); //返回一个32位无符号整数,0 ~ 2^32 -1
           that.crc32Array.push({
               start : start,
               end   : end,
               crc32 : dec2hex(crc32) // 转为8位的十六进制字符串,如'ffffffff'
           });
           start = end;
           if ( end < file.size ) {
               read ( ); // 继续分片
           } else {
           		 // crc32Array格式： {start: number, end: number, crc32: string}[]
               that.success ( that.crc32Array ); // 调用FileCrc32中传递的回调
           }
       };
   }
   read();
}
```

`crc32(buf: ArrayBuffer , previous: number)`函数就是用于真正计算分片的 CRC 校验码的，使用的算法没看懂...

因为使用的是[FileReader](https://developer.mozilla.org/zh-CN/docs/Web/API/FileReader)来切片，而它[在 IE9 中是不兼容的](https://caniuse.com/#search=FileReader),这也是这个视频上传库目前兼容性的一个原因：

> 目前兼容性：IE10 及以上，IE9 以下上传时直接触发 error 回调，此时 stage 为'browserError'

**从整个过程来看, 库的作者认为 FileCrc32 任务并不会失败，但 MDN 上的很明确的提供了`FileReader`的`error`回调**。

最终任务成功后，会往相应的视频上传上下文中添加 CRC 相关属性：

```js
Object.assign(context.tasks[key], {
  key,
  crc32Array, // 数组，格式为{start: number, end: number, crc32: string}[]
  crc32Key, // 字符串， 长度8位
  sliceLength: this.sliceLength, // 分片大小
  extra: { message: 'get crc32 success' },
  stage: 'crc32',
  type: 'success',
  fileSize: this.file.size, // 视频文件大小
});
```

此时上下文里包含的属性有：

![]({{site.url}}/assets/img/BytedVideoUploader/FileCrc32后容器中属性.png)

整个任务的主流程如下：

![]({{site.url}}/assets/img/BytedVideoUploader/FileCrc32流程.png)

# PreUpload

用于获取真正上传视频时所需的`vid`、`url`和`signature`，这些信息是通过发送`ajax`请求拿到的，整个过程中跟视频文件本身并没有关系。核心代码如下：

```js
startPreUpload(){
   const transport = new Transport();
   transport.on('complete', (xhr) => {
       if (xhr.response) {
           try {
               const result = JSON.parse(xhr.response);
               if (result['code'] == 2000) {
                   // 往上下文中添加属性，稍后揭晓。。
                   this.successProcess && this.successProcess(successData);
               } else {
                   this.fail(xhr);
               }
           } catch (e) {
               this.fail( xhr);
           }
       } else {
           this.fail(xhr);
       }
   });

   transport.on('error', this.fail);
   transport.send({
       method: 'get',
       url: util.urlTemplate( this.config.videoUrl, this.config.replace )
   });
}
```

可以看到，内部使用了一个叫`Transport`的类来发送请求，这个类封装了`xhr`，屏蔽了一些具体细节，逻辑并不复杂，里面用到了[xhr 2 级](https://www.html5rocks.com/zh/tutorials/file/xhr2/)的一些特性，这是不支持低版本 IE 的又一个原因。

发送请求的 url 是拼接而成，一部分是由初始配置决定的。 url 模板：

```
this.config.videoUrl => {vasDomain}/video/v3/upload/get_upload_info/{department}/
```

`vasDomain`是视频服务端地址，在国际化项目中，配置成了`https://vas.isnssdk.com`; `department`是一串表示产品组的唯一码，在项目中配置成了`09e0d728f75d4fa48118f11071889342`。 因此最终的 url 为：

```js
this.config.videoUrl => 'https://vas.isnssdk.com/video/v3/upload/get_upload_info/09e0d728f75d4fa48118f11071889342/'
```

通过控制台的 network 也证实了这一点：

![]({{site.url}}/assets/img/BytedVideoUploader/PreUpload请求的url.png)

在获取成功后，会往视频上传上下文中添加几个相关属性，并最终调用任务成功时的回调函数。

```js
// result['data']中包含signature、url、vid三个属性
Object.assign(this.currFileCtx, result['data'], {
  uploadUrl: result['data']['url'], //
  type: 'success',
  extra: { message: 'prepare upload success' },
  stage: 'preUpload',
  xhr: xhr,
});
```

此时上下文里包含的属性有：

![]({{site.url}}/assets/img/BytedVideoUploader/PreUpload后任务容器中属性.png)

请求失败时会调用任务失败时的回调函数。

整个任务的流程如下：

![]({{site.url}}/assets/img/BytedVideoUploader/PreUpload流程.png)

# InitUploadID

这个任务跟`PreUpload`很类似，相差的只不过是请求的 url 以及成功后往上下文中添加的属性。核心代码：

```js
eventInit ( eventName )  {
   let that = this;
   let context = this.options.context;
   let key = this.options.key;
   /*
   @Des:完成的部分
   */
   that.transport.on('complete', function( xhr ){
       try {
           let res = JSON.parse(xhr.response);
           if (res.success == 0 && res.payload.uploadID) {
               // 往上下文中添加属性，稍后揭晓。。
               that.successProcess(successData);
           } else {
               that.fail(xhr);
           }
       } catch ( e ) {
           that.fail(xhr);
       }

   });

   /*
   @Des: 错误处理
   */
   that.transport.on('error', function( xhr ){
       that.fail(xhr);
   });
}
```

## 请求 url

依旧是模板替换，模板为`'{tosDomain}/{vid}?uploads'`, `vid`为`PreUpload`任务获取到的，`tosDomain`是初始化配置，在国际化中配置成了`"http://put15-tb.isnssdk.com"`，故最终的请求肯可能长这样：

```js
http://put15-tb.isnssdk.com/v04033520000bbu37s6b1u7pca3k5di0?uploads
```

看看通过控制台的 network：

![]({{site.url}}/assets/img/BytedVideoUploader/InitUploadID任务中请求的url.png)

在获取成功后，同样会往视频上传上下文中添加几个相关属性，并最终调用任务成功时的回调函数。

```js
Object.assign(context.tasks[key], {
  uploadID: res.payload.uploadID,
  percent: 0,
  type: 'success',
  extra: { message: 'init upload id success' },
  stage: 'initUploadID',
  xhr: xhr,
});
```

此时上下文里包含的属性有：

![]({{site.url}}/assets/img/BytedVideoUploader/InitUploadID后容器中的属性.png)

请求失败时会调用任务失败时的回调函数。

整个任务的流程图如下：

![]({{site.url}}/assets/img/BytedVideoUploader/InitUploadID任务流程.png)

# Upload

这个可以说是这么多任务里最关键的一个了，大致来说会逐批逐个上传每个分片，上传时还会利用 CRC 进行校验；上传过程中会实时反馈进度，如果发现进度太慢还会重试。我们挨个来看：

## 上传流程

会分批上传，一次上传 N 个：

```js
/*
@Des: 分批并行执行上传，一批groupCount个
*/
threadUpload() {
   // 一批groupCount个,groupCount是初始配置和分片个数的较小者
   // uploading存放所有正在上传的分片索引
   if (this.uploading.length < this.groupCount) {
       const lastIndex = this.lastIndex; // lastIndex表示最近一次的上传分片索引
        // 当前分片信息，包含loaded、finished、start、end、crc32、
       const sliceInfor = this.crc32Array[lastIndex];
       if (sliceInfor) {
       		// 分片未完成
           if (!sliceInfor.finished) {
               sliceInfor.loaded = 0;
               this.uploading.push(lastIndex);
               this.upload(sliceInfor, lastIndex); // 实际上传操作
           } else if (this.finishArr.indexOf(sliceInfor.crc32) === -1) {
               this.finishArr.push(sliceInfor.crc32);
               // 如果所有批次上传成功则结束上传过程
               if (this.finishArr.length >= this.crc32Array.length) {
                   this.stop();
                   this.success();
                   return;
               }
           }
           this.lastIndex++;
           this.threadUpload(); // 上传下一个分片
       }
   }
}
```

`upload`函数会进行实际的文件上传操作：

```js
/*
@Des: 上传文件实际操作
*/
upload(sliceInfor, index) {
   const config = this.config;
   const file = this.file;
   const slice = file.slice || file.webkitSlice || file.mozSlice;
   const sliceItem = slice.call(this.file, sliceInfor.start, sliceInfor.end); // 切割分片
   const crc32 = sliceInfor.crc32;
   const replace = Object.assign({}, config.replace, {
       number: index,
       uploadId: this.currentCtx['uploadID'],
       vid: this.currentCtx['vid']
   });
   const url = util.urlTemplate(this.config.uploadChunkedUrl, replace);
   const taskInfor = this.currentCtx;
   // Uploader实际上就是把Transport封装了下，在实际发请求前简单校验下参数，并附加一些特殊的请求头，具体见network。
   const uploader = new Uploader({ sliceItem, crc32, url, taskInfor, retryTime: this.retryUploadTime });
   uploader.upload();
   uploader.on('complete', (infor) => {
       // status 为1表示当前视频正在上传
       if (this.currentCtx['status'] === 1) {
           this.fileSliceSuccess(infor); // 这个分片上传完了
       }
   });
   uploader.on('error', (infor) => {
       if (this.currentCtx['status'] === 1) {
           this.fail(infor); // 上传报错，终止当前批次的所有上传，并视情况决定整个视频上传是暂停还是取消。
       }
   });
   uploader.on('process', (infor) => {
       if (this.currentCtx['status'] === 1) {
           this.process(infor); // 更新上传百分比进度
       }
   });
   // 上传实例保存起来方便后续取消上传
   this.uploadHandlers[index] = uploader;
}
```

上面`Uploader`中发送请求的 url 模板为`{tosDomain}/{vid}?partNumber={number}&uploadID={uploadId}`，在国际化中`tosDomain`为`http://put15-tb.isnssdk.com`，`number`为分片的索引，`vid`为`PreUpload`任务中获取的。

另外`Uploader`还会把这个分片的`crc`码放到请求头中，这样做都是为了让后端校验这个分片的合法性。

某次请求的看起来可能如下：

![]({{site.url}}/assets/img/BytedVideoUploader/Upload任务中的请求.png)

在某个分片上传完之后，会尝试上传下一个分片，如果发现已经全部上传完了，就会通知外部。看看是怎么做的：

```js
/*
@Des: 文件分片上传成功
*/
fileSliceSuccess(infor) {
   const nowIndex = this.getNowPartNumber(this.crc32Array, infor);// 计算当前分片在分片数组中的位置
   if (this.finishArr.indexOf(infor.crc32) === -1) {
       this.finishArr.push(infor.crc32);
   }
   this.crc32Array[nowIndex]['finished'] = true;
   this.crc32Array[nowIndex]['speed'] = infor.speed;
   const extraInfo = { message: 'slice upload success' };
   if (infor.xhr) {
   	// 往视频上传上下文中添加与请求状态相关的属性
   }

   // 一个分片上传成功，上报成功日志
   // ...

   this.context._saveTask(this.key);
   // 如果所有批次上传成功则结束上传过程
   if (this.finishArr.length >= this.crc32Array.length) {
       this.stop();
       this.success(infor.xhr); // 往视频上传上下文中添加一些属性，并调用任务成功回调
       return;
   }
   // 更新uploading队列
   this.uploading.splice(this.uploading.indexOf(nowIndex), 1);
   this.threadUpload(); // 上传下一个分片
}
```

## 监控功能

监控功能是指如果发现进度太慢会重试这个批次。看看怎么做的：

```js
/*
@Des: 设置进度监控
*/
setProgressMonitor() {
   this.progressMonitorInterval = setInterval(() => {
       const finishSize = this.finishSize; // 当前上传完成的总分片大小
       // 如果上传速度低于1kb/s，则抛弃当前批次未上传成功的分片请求并重试这些请求。
       if (finishSize - this.lastIntervalSize < this.maxProcessPause * 1 * 1024 && this.currentCtx['status'] === 1) {
           // 设置一定的重试次数，如果没有超过则还可以继续重试此批次
           if (this.processRetry < this.retryProcessTime) {
               this.uploadHandlers.forEach((uploader) => {
                   uploader.abort(); // 先终止这些分片上传
               });
               // 找到最小的分片索引，从这个开始全部重新上传
               let lastIndex = this.uploading[0];
               this.uploading.forEach((i) => {
                   if (lastIndex > i) {
                       lastIndex = i;
                   }
               });
               this.processRetry++;
               //  重置相关状态
               this.lastIndex = lastIndex;
               this.uploading = [];
               this.uploadHandlers = [];
               this.threadUpload(); // 重新上传这个批次
               // 记录此时已上传的总分片大小
               this.lastIntervalSize = this.crc32Array.reduce((accu, curr) => accu + (curr.finished ? curr.end - curr.start : 0), 0);
           } else {
           		// 重试次数已超出
               this.fail({
                   extra: { message: `percent are not updated in ${this.maxProcessPause} seconds` },
                   statusCode: 0
               });
           }
       } else {
           this.lastIntervalSize = finishSize;
           this.processRetry = 0;
       }
   }, this.maxProcessPause * 1000); // maxProcessPause默认值为15
}
```

可以看到是每隔一段时间就监控一次，如果总的进度很慢，大概率表示每个分片上传的进度都很慢，库的做法就是把这些分片全部取消再重来一次。

## 总体流程

![]({{site.url}}/assets/img/BytedVideoUploader/Upload及监控主流程.png)

# FileMerge

用于合并文件的任务，同样是发送`ajax`请求。关键代码：

```js
eventInit(eventName) {
   const that = this;
   const context = this.options.context;
   const key = this.options.key;

   /*
   @Des:完成的部分
   */
   that.transport.on('complete', (xhr) => {
       try {
           const res = JSON.parse(xhr.response);
           if (res.success == 0 && res.payload.key) {
               // ，往上下文中添加属性，稍后揭晓
               that.successProcess(context.tasks[key]);
           } else {
               that.fail(xhr);
           }
       } catch (e) {
           that.fail(xhr);
       }
   });

   /*
   @Des: 错误处理
   */
   that.transport.on('error', (xhr) => {
       that.fail(xhr);
   });
}
```

这段代码可以说很熟悉了，没什么可说的。看看发请求时携带的参数：

```js
mergeFile() {
   const context = this.options.context;
   const key = this.options.key;
   const that = this;
   const replace = Object.assign({}, this.config.replace, {
       vid: context.tasks[key]['vid'], // PreUpload任务中获取
       uploadId: context.tasks[key]['uploadID'] // InitUploadID任务中获取
   });
   // FileCrc32任务中获取。格式： {start: number, end: number, crc32: string}[]
   const crc32Array = context.tasks[key]['crc32Array'];
   let content = '';
   // content拼成 '0:xxxxxxxx, 1:xxxxxxxx'的格式
   for (let i = 0; i < crc32Array.length; i++) {
       if (content) {
           content = `${content},${i}:${crc32Array[i]['crc32']}`;
       } else {
           content = `${i}:${crc32Array[i]['crc32']}`;
       }
   }
   const url = util.urlTemplate(this.config.uploadMergeUrl, replace);
   that.transport.send({
       method: 'post',
       url,
       headers: {
           Authorization: context.tasks[key]['signature'] // 自定义请求头
       },
       custom: content // 请求体
   });
}
```

`url`模板为`'{tosDomain}/{vid}?uploadID={uploadId}'`, `tosDomain`在国际化中的配置是`http://put15-tb.isnssdk.com`，于是某次上传时的 url 可能如下：

![]({{site.url}}/assets/img/BytedVideoUploader/FileMerge任务中请求的url.png)

最后成功后往上下文中添加的属性：

```js
Object.assign(context.tasks[key], {
  stage: 'fileMerge',
  type: 'success',
  extra: { message: 'merge file success' },
  oid: res.payload.key,
  xhr,
});
```

此时上下文中拥有的属性有：

![]({{site.url}}/assets/img/BytedVideoUploader/FileMerge任务后上下文中的属性.png)

最后，失败时会直接调用任务失败的回调。

## 主流程

![]({{site.url}}/assets/img/BytedVideoUploader/FileMerge主流程.png)

# VideoCover

这是最后一个任务了，主要是获取视频本身的一些如宽高长度之类『元信息』。同样是利用`Transport`简单的发个请求获取，只不过这次需要的入参多一些。主要代码：

```js
eventInit(eventName) {
   const that = this;
   const context = this.options.context;
   const key = this.options.key;

   /*
   @Des:完成的部分
   */
   that.transport.on('complete', (xhr) => {
       try {
           const res = JSON.parse(xhr.response);
           if (res.code == 2000) {
               const data = res.data;
               // 往上下文中添加属性，稍后揭晓。。
               that.successProcess(context.tasks[key]);
           } else {
               that.fail(xhr);
           }
       } catch (e) {
           that.fail(xhr);
       }
   });

   /*
   @Des: 错误处理
   */
   that.transport.on('error', (xhr) => {
       that.fail(xhr);
   });
}
```

发送请求时的入参：

```js
// 请求参数中的vid、oid、signature都是此前任务中获得，coverTime为初始配置，表示何时去获取封面
videoCover (  ) {
   let context = this.options.context;
   let key = this.options.key;
   let that = this;
   let url = context.tasks[key]['url']; // PreUpload任务中获取的
   let content = 'vid=' + context.tasks[key]['vid'];
       content = content + '&';
       content = content + 'oid=' + context.tasks[key]['oid'];
       content = content + '&';
       content = content + 'cover=' + this.config['coverTime'];
       content = content + '&';
       content = content + 'signature=' + context.tasks[key]['signature'];
   that.transport.send({
       method : 'post',
       url :  url,
       headers : {
           'Content-Type':'application/x-www-form-urlencoded'
       },
       custom : content
   });
}
```

检查一下请求 url 是否正确：

- PreUpload 时获取的 url：

![]({{site.url}}/assets/img/BytedVideoUploader/PreUpload获取的url.png)

- VideoCover 中请求的 url

![]({{site.url}}/assets/img/BytedVideoUploader/VideoCover中请求的url.png)

可以看到正好是对的上的。

成功后会往上下文中添加的属性有：

```js
Object.assign(context.tasks[key], {
  stage: 'complete',
  type: 'success',
  percent: 100,
  extra: { message: 'get cover success' },
  video: {
    // 视频信息
    height: data.height,
    width: data.width,
    duration: data.duration,
    oid: context.tasks[key]['oid'],
    vid: context.tasks[key]['vid'],
  },
  poster: {
    // 封面信息
    url: data.cover_url,
    oid: data.cover_uri,
    height: data.height,
    width: data.width,
  },
  xhr,
});
```

上面的`cover_url`就是我们在视频上传成功后拿到的封面图。

最后，失败时会直接调用任务失败的回调。

## 流程图

![]({{site.url}}/assets/img/BytedVideoUploader/VideoCover流程.png)

# 总结

这篇文章主要讲的是`BytedVideoUploader`这个前端视频上传库的主流程。整个视频上传被分为几个不同的任务，再利用队列来调度这些任务。每个视频文件的上传队列互不相干，做到了并行上传。在真正上传时会分批分片、进度监控。

库的实现还可以有取消、暂停、断点续传等更高级的功能，主要是得益于分片上传的校验以及 XHR2 级提供的新特性。

最后，对于大文件上传，总体思想也应该非常类似，也可以参照`WebUploader`这款开源库：

- [聊聊大文件上传](http://blog.kazaff.me/2014/11/14/%E8%81%8A%E8%81%8A%E5%A4%A7%E6%96%87%E4%BB%B6%E4%B8%8A%E4%BC%A0/index.html)

- [webuploader](http://fex-team.github.io/webuploader/)

## v4 相比 v3

TODO
