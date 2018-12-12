---
title: "JavaScript事件循环小结"
img: new-zealand.jpg # Add image post (optional)
date: 2017-11-05 18:00:00 Asia/Shanghai
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [JAVASCRIPT,EVENT-LOOP]
---

# 前言

在学JavaScript时，对事件循环总是一知半解，只知道像setTimeout、Ajax和事件处理器的回调函数会放到任务队列中，等待事件循环来一个个调用，对于更进一步的细节就不知道了。 最近看了两篇讲这方面的文章，觉得非常棒，帮助我对它的理解更深刻了，于是立马用博客记录下来。

本文只记录这方面的理论知识，强烈推荐将参考中文章的例子自己试着解答一遍，然后对照着理论来消化。

# 事件循环

一张图展示JavaScript中的事件循环：

![](http://mmbiz.qpic.cn/mmbiz_png/meG6Vo0Mevia3qqAdZXbGMvOQWvD3AxX5RExFksDUS067icPUUmVweUqmuaR2vHlkOqia7x0XydvVfstK6Lf5l7GQ/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1)

在某个时刻，可能是这样的：

![](http://mmbiz.qpic.cn/mmbiz_png/zPh0erYjkib3g6TGY1YsxUKkCPmA1grtXgKiafNpQ879kPph9tAle98Or8KyMd2kO6HvXUSiaxOkPybbVt8Zy8Djg/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1)

**一次事件循环**：先运行macroTask队列中的一个，然后运行microTask队列中的所有任务队列。接着开始下一次循环（只是针对macroTask和microTask，一次完整的事件循环会比这个复杂的多）。

**注意**： 在初始时，会从script(整体代码)开始第一次循环(即此时的主线程相当于macroTask)，然后执行所有的micro-task。当所有可执行的micro-task执行完毕之后。循环再次从macro-task开始，找到其中一个任务队列执行完毕，然后再执行所有的micro-task，这样一直循环下去。

# 关于MacroTask和MicroTask【1】

JavaScript引擎对这两种队列有不同的处理，简单的说就是引擎会把我们的所有任务分门别类，一部分归为**macroTask**，另外一部分归为**microTack**.

## macroTask

* script(整体代码)
* **setTimeout**
* **setInterval**
* setImmediate
* requestAnimationFrame
* I/O
* UI rendering

## microTask

* **process.nextTick**
* **Promise**
* Object.observe
* MutationObserver

## 任务源[2]

setTimeout/Promise等我们称之为任务源。而进入任务队列的是他们指定的具体执行任务。

来自不同任务源的任务会进入到不同的任务队列。其中**setTimeout与setInterval是同源的**。 
# 自己的心得

## 关于macroTask队列

每次事件循环时，每个任务队列中会存放所有同源的任务。比如说如果代码中有两个setTimeout散落在不同行，中间隔着几个setImmediate：

```js
Promise.resolve().then(() => console.log(`promise1`));

setTimeout(function() {
   console.log('timeout1');
   Promise.resolve().then(() => console.log(`timeout promise`))
})

setImmediate(function() {
   console.log('immediate1');
})

setTimeout(function() {
   console.log('timeout2');
})

setImmediate(function() {
   console.log('immediate2');
})
```

那么，在macroTask队列中只会有两个队列：一个setTimeout的队列 +  一个setImmediate的队列 。

**注意**： 如有有setInterval，那么也会和setTimeout在一个队列中。


setTimeout的队列会有两个任务：timeout1和timeout2； 同理setImmediate的队列会有两个任务：immediate1和immediate2。

**在下一次事件循环时，只会取setTimeout队列中的两个任务执行，而setImmediate队列中的两个任务要等到下下次事件循环才会执行。**

所以上述代码运行结果为

```
promise1
timeout1
timeout2
timeout promise
immediate1
immediate2
```

## 关于microTask队列

与macroTask队列不同的是，**每次事件循环，不管microTask队列中有多少个不同的任务队列，都会一次性将它们全部执行完，但是执行的顺序是前一个队列中的任务全部执行完才会执行后一个队列的任务。**

```js
console.log('global macro task')

process.nextTick(function() {
    console.log('nextTick1');
});

Promise.resolve()
    .then(() => {
        console.log('then1');
        setTimeout(() => console.log("time1"));
    });

process.nextTick(function() {
    console.log('nextTick2');
});

Promise.resolve()
    .then(() => console.log('then2'));
```

代码结果为：

1. 全局 macro task
2. nextTick1
3. nextTick2
4. then1
5. then2
6. time1

可以看到

1. 在第一轮macroTask之后， 第二轮macroTask之前，所有的microTask都执行了
2. microTask队列也是先执行完其中的一队所有任务（nextTick队列），再执行后面队伍的任务（Promise队列）

# 参考
1. [总是一知半解的Event Loop](https://mp.weixin.qq.com/s/3-8kH1L-FZqSgv8zocoY7g)
2. [深入核心，详解事件循环机制](https://mp.weixin.qq.com/s/Of8gGz-EYuOkVSLqV8W2ow)

