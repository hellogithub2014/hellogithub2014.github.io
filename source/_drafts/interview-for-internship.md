# js

- this 指向
  - [ ] 默认绑定
  - [ ] 作为对象方法调用时的**隐式绑定**
  - [ ] call、apply 显式绑定. 二者差别：除了参数的传递方式外无差别
  - [ ] 构造函数`new`调用, **优先级比 bind 高**
- 箭头函数与普通函数差别，能否 new
- 构造函数 new 时做的事情
  - [ ] 新创建一个对象
  - [ ] 新建对象的原型指向函数的原型
  - [ ] 函数执行时的 this 指向新建对象
  - [ ] 如果构造函数最后没有显示的 return 其他对象，那么构造函数最后默认返回这个新建对象。
- 类型判断
  - [ ] typeof 缺点
  - [ ] Object.prototype.toString.call： "[object Undefined]"、"[object Null]" 为什么不能直接 obj.toString
  - [ ] instanceof 判断右操作数是否在左操作数的原型链上
- Object.keys、for-in、for-of、Object.getOwnPropertyNames 差别
  - [ ] Object.getOwnPropertyNames 返回**对象自身**所有的属性，不管是不是可枚举的
  - [ ] Object.keys 返回**对象自身**所有**可枚举**的属性
  - [ ] for-in 遍历**对象及其原型链**上**可枚举**的属性
  - [ ] for-of 用于遍历数组及类数组, 本质上只要实现了 Symbol.iterator 的对象都可以
- 原型链
- 作用域链
- 闭包:
  - [ ] 定义在函数内部的函数，通过执行外部函数将内部函数保存在一个外部变量中，即使外部函数已经执行完毕，依然可以通过闭包访问外部函数中的变量.
  - [ ] 两个条件: 1. 即使创建它的上下文已经销毁，它仍然存在 2. 在代码中引用了它外部作用域的变量.
  - [ ] 作用: bind 绑定 this、偏函数、模块化
  - [ ] 缺点： 内存不释放
- let、var区别
  - [ ] 作用域
  - [ ] 暂时性死区、变量提升
  - [ ] 是否可以重复声明
- async+await 与 promise+generator
- 浏览器时间冒泡机制： 事件捕获、事件处理、事件冒泡
- 同源策略、跨域解决
  - [ ] jsonp(与 CORS 差别)
  - [ ] cors
    - [ ] 简单请求：
      - [ ] HEAD、GET、POST
      - [ ] HTTP header 约束
      - [ ] 直接发请求，添加 Origin 头部 <----> Access-Control-Allow-Origin
    - [ ] 非简单请求： 先发 Options 请求，再发与简单请求一样的真正请求
      - [ ] Origin、Access-Control-Request-Method、Access-Control-Request-Headers
    - [ ] 发送 cookie：
      - [ ] 后端返回 Access-Control-Allow-Credentials 头，并且不能设置为星号`*`
      - [ ] 前端设置 withCredentials
  - [ ] window.postMessage
  - [ ] 反向代理
  - [ ] window.name
  - [ ] document.domain： 两个前端页面拥有共同的主域，但子域不同
- 事件循环
  - [ ] 宏任务：setTimeout 等
  - [ ] 微任务：Promise.then
  - [ ] 打印顺序
  ```js
  console.log('global macro task');

  process.nextTick(function() {
    console.log('nextTick1');
  });

  Promise.resolve().then(() => {
    console.log('then1');
    setTimeout(() => console.log('time1'));
  });

  process.nextTick(function() {
    console.log('nextTick2');
  });

  Promise.resolve().then(() => console.log('then2'));

  // 全局 macro task
  // nextTick1
  // nextTick2
  // then1
  // then2
  // time1
  ```
- RequestAnimationFrame 与 settimeout 差别
  - [ ] settimeout 可能丢帧，若频幕刷新间隔 16.7ms，settimeout 间隔 10ms，那么每第三个 settimeout 所作出的改变是无法看到的；raf 的调用频率和浏览器刷新频率一致
  - [ ] settimeout 执行时间不确定，因为其真正的任务被放到任务队列里
- 为什么 `0.1 + 0.2 !== 0.3`

# css

- flex 布局、具体属性
  - [ ] 容器属性
    1. flex-direction
    2. justify-content
    3. align-items
    4. flex-wrap
    5. align-content
  - [ ] 项目属性
    1. order
    2. flex-grow
    3. flex-shrink
    4. flex-basis
    5. align-self
- position 属性
  - [ ] static、relative、absolute、fixed
  - [ ] 默认是哪个
  - [ ] relative、absolute、fixed 分别相对于谁定位
  - [ ] z-index 对于哪些有效
- 水平居中、垂直居中(仅考察 display: block 元素)
  - [ ] flex
  - [ ] position + transform
  - [ ] margin: 0 auto
- 两列布局，左列定宽、右列自适应
  - [ ] float + margin-left
  - [ ] position + margin-left
  - [ ] flex
- display
  - [ ] none、inline、inline-block、block
  - [ ] inline、inline-block 差别
  - [ ] display: none 与 visibility: hidden 差别
- 清除浮动
  - [ ] 结尾添加空元素标签
  - [ ] 利用 after 伪元素
- box-sizing： content-box、border-box
- 浏览器匹配 CSS 选择器的顺序

# html

- cookies、sessionStorage、localStorage 的区别
  - [ ] cookies
    1. 以域名+路径作为划分，对该路径及其子路径下的所有页面均可见
    2. 如果不设置有效期，默认窗口关闭就会清楚；如果设置了 max-age，那么就会保存在本地硬盘上，直到过期才会删除
    3. 如果设置了 secure，那么只有在 HTTPS 中才会传递
    4. httpOnly - 只有在服务器端才能操作 cookie，浏览器端无法修改
    5. cookies 会发送到服务器端
    6. cookie 数据不能超过 4k

  - [ ] sessionStorage
    1. 以窗口和源作为划分，**不同源文档之间无法共享`sessionStorage`**
    2. 窗口刷新仍会存在
    3. 窗口关闭就会消失
    4. 不同窗口的 sessionStorage 不共享
    5. 有 storage 事件
    6. sessionStorage 虽然也有存储大小的限制，但比 cookie 大得多，可以达到 5M 或更大。
  - [ ] localStorage
    1. 以域名划分
    2. 除非手动或通过 api 清除缓存，会一直存在
    3. 有 storage 事件
    4. localStorage 虽然也有存储大小的限制，但比 cookie 大得多，可以达到 5M 或更大。

# 网络

- 缓存相关 header

  - [ ] Cache-Control: private/public/no-cache/no-store, max-age/s-maxage
  - [ ] Expires, max-age > Expires
  - [ ] Last-modified 、If-Modified-Since、If-Unmodified-Since
  - [ ] ETag、If-Match、If-None-Match
  - [ ] etag > last-modified 优先级
- 知道哪些响应码，301、302 差别
- get、post 差别
- keep alive
- DNS： 哪一层协议、查找过程
- tcp 3 次握手、4 次挥手
- https
  - [ ] 大致原理
  - [ ] 证书
  - [ ] 证书编号

- 前端性能优化
  - [ ] 减少资源请求数，合并多个 css/js 文件
  - [ ] css 文件放置在 head，js 放置在文档尾部；并酌情使用 async、defer、pre-load。
  - [ ] gzip 压缩
  - [ ] 利用 HTTP 缓存 [浏览器缓存博客](https://hellogithub2014.github.io/browser-cache-summary/)
  - [ ] 图片使用雪碧图，或合并到字体文件中
  - [ ] 使用骨架屏优化用户体验（以 pc 端评论为例）
  - [ ] cdn 托管
  - [ ] 静态资源放在多个域名下，规避浏览器的最大同时请求数目

# 代码

- bind 实现、注意new的处理
- 数组去重（无序、有序）
- 树遍历
- [闭包、定时器、ES6、ES7综合](https://mp.weixin.qq.com/s/QdZpzI-8D9NCrkx1GFmLiQ)
- 上传超大文件
  - [ ] 上传图片预览: FileReader + img
  - [ ] 上传进度: xhr progress 事件
  - [ ] 分块上传: ArrayBuffer.slice， 每个分片记录索引、大小、校验值、所属文件 id
  - [ ] 暂停上传： 用户仍然在当前页面，浏览器依然记录着关于上传文件的相关信息
  - [ ] 断点续传： 浏览器丢失了正在上传的文件的所有相关数据：文件路径，正在上传的分片索引，上传进度等信息
  - [ ] 多线程: 并行多个 xhr 上传
  - [ ] 失败重试

# Vue

- 双向绑定
- 模板中的变量如何映射到组件的： render函数执行时被包裹了`with this`，`this`指向的是`vm`，这样render函数内的所有变量都是在vm上查找的
- $emit、$on、涉及子组件的情况（addEventListener、观察者模式）
- [数组继承](https://hellogithub2014.github.io/2018/05/19/vue-trick/)
- [diff算法](https://hellogithub2014.github.io/2018/11/10/vue-sourcecode-12-patch-diff/)
