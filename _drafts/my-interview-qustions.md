
# js

### 实现一个`Event`类，继承这个类的都有on、off、trigger、once方法[题目参考](http://marvel.bytedance.net/#/question/detail/?id=455&nocontri=true)
### `Promise`及`FileReader` [题目参考](https://mp.weixin.qq.com/s/UXCOW-LnPvFFu8YIoIRTrw)

#### 第一张图片上传完再上传第二张，
```
let p = Promise.resolve();
[0, 1, 2, 3, 4].forEach((index) => {
  p = p
    .then(_ => loadImg(index + 1))
    .then((_) => {
      console.log(`加载第${index + 1}张图片成功`);
    })
    .catch((_) => {
      console.error(`加载第${index + 1}张图片失败`);
    });
});
```

#### 5张图片都上传完后弹出提示语（Promise或者全局标志位）
		
```
function loadImg(index) {
  const img = new Image();
  img.src = `./avatar${index}.png`;

  return new Promise((resolve, reject) => {
    img.onload = () => {
      resolve();
    };

    img.onerror = () => {
      reject();
    };
  });
}

const tasks = [0, 1, 2, 3, 4].map(i => loadImg(i + 1));

Promise.all(tasks)
  .then(() => {
    console.log('加载5张完成');
  })
  .catch((_) => {
    console.log('加载失败');
  });
```

#### 5张图片都已放入dom中，需要添加事件，点击每张图片时弹出『我是第几张图片』，考察闭包。

```
const list = document.querySelectorAll('img');

// for (let i = 0, len = list.length; i < len; i++) {
//   list[i].onclick = ( (index) =>{
//     return () => {
//       console.log(index);
//     };
//   }(i));
// }

for (let i = 0, len = list.length; i < len; i++) {
  list[i].onclick = () => {
    console.log(i);
  };
}
```


#### 前端预览上传的图片，FileReader/URL
```html
<input type="file" id="upload">
```

```js
const upload = document.getElementById('upload');
upload.onchange = (e) => {
  const file = e.target.files[0];
  const fr = new FileReader();
  fr.onload = (e) => {
    const url = e.target.result;
    const img = new Image();
    img.src = url;
    document.body.appendChild(img);
  };
  fr.readAsDataURL(file);
};
```


### 解析url参数

```js
function parseUrl(url) {
  if (typeof url !== 'string') {
    throw new Error(`参数需要为字符串,${url}`);
  }
  if (!url || !url.trim()) {
    return {};
  }
  const params = url.slice(url.indexOf('?') + 1);
  const obj = {};
  params.split('&').forEach((item) => {
    const firstEqual = item.indexOf('='); // base64编码中可能有尾随的=

    if (firstEqual > -1) {
      obj[item.slice(0, firstEqual)] = decodeURIComponent(item.slice(firstEqual + 1));
    }
  });
  return obj;
}
```


### addClass（找手机里保存的图片）

TODO

### 数组去重
#### 要求保持原顺序

```js
const arr = [3, 3, 4, 2, 1, 3, 4, 2, 5];
const count = {};
const unique1 = [];
arr.forEach((num) => {
  if (!count[num]) {
    count[num] = 0;
    unique1.push(num);
  }
  count[num] += 1;
});
console.log(unique1);

```


#### 不要求保持顺序； set/hashmap原理
```js
console.log([...new Set(arr)]);
```

#### 记录每个数字出现次数
```js
console.log(count);
```

#### 若数组本身已经是有序时去重优化

```js
const arr2=[1,1,1,2,2,3,4,4,5,6];
let before = 0;
let after = 1;
const unique2 = [arr2[0]];
while (after < arr2.length) {
 while (arr2[after] === arr2[before]) {
   after += 1;
 }
 unique2.push(arr2[after]);
 before = after;
 after += 1;
}
console.log(unique2);
```

### DOM结构、getElementByClassName

    树形结构，采用递归

### 模块化规范： commonjs、ES6 module

TODO

### 函数截流 ： debounce、throtle
```
function debounce(fn, delay) {
  let timer;
  return function func() {
    const context = this;
    const args = arguments;
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(context, args);
    }, delay);
  };
}
```


```js

function throtle(fn, delay) {
  const _self = fn;
  let timer;
  let firstTime = true;
  return function func() {
    const args = arguments;
    const _me = this;

    if (firstTime) {
      _self.apply(_me, args);
      firstTime = false;
      return;
    }

    if (timer) {
      return false;
    }

    timer = setTimeout(() => {
      clearTimeout(timer);
      timer = null;
      _self.apply(_me, args);
    }, delay || 500); // 默认500毫秒延迟
  };
}
```

# css

### 两列布局
TODO
### 3列布局
TODO
### flex

1. 容器属性： flex-direction、flex-wrap、justify-content、align-items、align-content（类似justify-content）

2. 子项目属性： order（控制顺序）、flex-grow（空余空间中的放大）、flex-shrink（设置为0时会固定大小）、flex-basis、align-self

### position的几种值

static（默认值）、relative、absolute、fix， z-index和top、left属性只对后三种有效；相对位置不同；

### display属性值 

inline、inline-block、block

# 网络与安全

### http缓存，相关header

TODO

缓存时间：expires、cache-control: max-age、
缓存协商：if-modified-since、if-unmodified-since、if-match/if-unmatch

### tcp握手挥手、为保持传输可靠性做了哪些事情
ACK+校验和+超时+重传+序列号

### 从敲url到页面显示内容经过

TODO

### dns是哪一层的协议、 解析过程、在传输层使用了tcp还是udp

TODO

### 跨域及其解决方法

TODO

### xss、csrf

TODO

# 业务

### 所做的业务在上下游所处的位置是怎样的，下游分别是在做什么工作

# 其他

### 平时的空余时间分配是怎样的；

### 学习的方式；

### 最近看的技术书是什么


