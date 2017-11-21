---
title: "mock.js学习笔记"
img: new-zealand.jpg # Add image post (optional)
date: 2017-11-21 11:25:00 +0800
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [MOCK]
---

# 前言

团队中的开发是前后端分离的，经常会步调不一致。之前前端都是将mock数据写死在js中，等后台接口写好了再把这些mock数据删掉，感觉很麻烦。于是研究了一下有没有什么mock的库，找到一个不错的**[Mock](https://github.com/nuysoft/Mock)**. 本文就是一个学习笔记。

# 基本使用

## 安装

直接把官方文档丢出来比较好： [文档](https://github.com/nuysoft/Mock/wiki)

里面写的很详细就不说了。我们的项目里是采用`<script>`标签加载的方式。

```html
<script src="path/to/mock.js"></script>
```

## 基本使用

同样很简单，例如：

```js
var data = Mock.mock({
    'list|1-10': [{
        'id|+1': 1
    }]
});

/* 
{
	"list": [
	    {
	        "id": 1
	    },
	    {
	        "id": 2
	    },
	    {
	        "id": 3
	    }
	]
}
*/
```

在[这里](http://mockjs.com/examples.html)有官方的各种示例，涵盖了所有的mock api。

官网文档里有每个api的解析。

# 项目实践

## 背景

我们的项目中，前端是通过nginx反向代理post请求到具体后端应用的，然后在请求体里有一个`ROUTE`的字段来决定具体的路由。 例如

```
http://localhost:8765/MyTest/test.do
```

请求体示范

```
{
	"ROUTE":"ROUTE_PATH"
}
```

而官网的示范中，大多数都是写死的请求url：

```js
Mock.mock('http://g.cn', {
   // template 
});
```

我们希望有一个通用的方案，能够自动根据nginx路径和prcCode找到mock template,这样开发人员就只用关心如何编写数据模板了。

然后继续翻阅文档查到一个api：

```
Mock.mock( rurl, rtype, function( options ) )
```
>记录用于生成响应数据的函数。当拦截到匹配 rurl 和 rtype 的 Ajax 请求时，函数 function(options) 将被执行，并把执行结果作为响应数据返回。

>options指向本次请求的 Ajax 选项集，含有 url、type 和 body 三个属性.

看来这个函数可以很好的满足我的需求，开搞！

## 具体步骤

闲话不表，贴上代码：

```js
Mock.setup({
    timeout: '200-600' // 模拟延时
});

// 拦截  domain/nginx-path/test.do 的请求
Mock.mock(/\/.*\/test.do/, 'post', function(options) {
    var arry = options.url.split("/");
    var nginxPath;
	  // 获取nginx代理路径
    for (var i = 0; i < arry.length; i++) {
        if (arry[i] === "rmi.do") {
            nginxPath = arry[i - 1];
            break;
        }
    }

    var routePath = JSON.parse(options.body).ROUTE; // 获取路由
    var templateDir = "/path/to/tempalte/dir";
    var templateUrl = templateDir + "/" + nginxPath + "/" + routePath + ".json";
    var bodyTemplate; // 响应body模板
	
	 // 获取mock数据模板
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
                bodyTemplate = JSON.parse(xhr.responseText);
            } else {
                alert('获取mock数据模板失败, 模板路径: ' + templateUrl);
            }
        }
    };
    xhr.open('get', templateUrl, false);
    xhr.send();
		
    var finalData = {  // 最后响应格式
        "ROUTE": routePath,
        "DATA": Mock.mock(bodyTemplate), // 根据模板mock数据
    };

    return finalData;
});
```

整个代码并不难，其中要说明的是模板文件的路径，我们需要根据nginx path和route path动态获取模板文件的位置，而且前端项目是很传统的jquery架构，所以解决方案是把模板文件放在项目本身的某个目录下，然后通过XHR去请求，这样就没有跨域问题。

## 模板文件

其实mock.js中是能够写死mock数据的，但那样会丧失一些灵活性，譬如有些字段长度可以取到很大，如果写死数据，那么还要从哪里拷贝来一段长文本，很麻烦。

更推荐的是使用模板+各种mock api。 例如我们的一个模板文件：

```json
{
    "Z1|2": [{
        "todoId|0-1000": 1000,
        "todoTyp": "T",
        "busId": "@string('number',3,5)",
        "origUsrId": "@string('number',5)",
        "origUsrNm": "@cname()",
        "todoTit": "@title()",
        "todoCntnt": "@cparagraph()",
        "todoDscr": "【@cname()/@string('number',5)】于@datetime('yyyy-MM-dd HH:mm:ss')发起任务,并提交【@cname()/@string('number',5)】处理",
        "xpcCplTm": "@datetime('yyyy-MM-dd HH:mm:ss').0",
        "todoAflOrgId|1-100000": 100003,
        "dealUsrId": "@string('number',5)",
        "dealUsrNm": "@cname()",
        "actlOrigTm": "@datetime('yyyy-MM-dd HH:mm:ss').0",
        "todoSts|1": ["2", "3"],
        "crtUsrId": "@string('number',5)",
        "crtTm": "@now().0",
        "updUsrId": "@string('number',5)",
        "updTm": "@now().0"
    }],
    "Z2": [{ "totalCount": 100 }]
}
```

某次返回的mock数据为：

```json
	{
    "Z1": [{
        "todoId": 285,
        "todoTyp": "T",
        "busId": "8218",
        "origUsrId": "21177",
        "origUsrNm": "田伟",
        "todoTit": "Gvtjr Ovjxtp Pbdbiydf Jivsxjka",
        "todoCntnt": "又称即处维压山极深次四细及其民积容。价三议斗革的际电标共海保张许那前根。研管而任海去确多华报水克制。已什月准位展求确许连严政道个。调关产专力流组于位同反受制成确据。",
        "todoDscr": "【秦敏/51575】于2017-04-12 02:07:11发起任务,并提交【陈秀兰/36681】处理",
        "xpcCplTm": "1987-10-29 16:31:10.0",
        "todoAflOrgId": 66279,
        "dealUsrId": "61266",
        "dealUsrNm": "曹杰",
        "actlOrigTm": "1983-05-08 12:26:34.0",
        "todoSts": "3",
        "crtUsrId": "27321",
        "crtTm": "2017-11-21 10:48:55.0",
        "updUsrId": "15615",
        "updTm": "2017-11-21 10:48:55.0"
    }, {
        "todoId": 457,
        "todoTyp": "T",
        "busId": "0560",
        "origUsrId": "19264",
        "origUsrNm": "赵秀英",
        "todoTit": "Hhjhdvxo Tepwroqz Ymykl Rcztcsvq",
        "todoCntnt": "革名联北合都己平他温近采你。公代适设何清住音究务进两七。取解育干社交快适至积二日石清属。整本地为记回度议高义素派酸水。总气体平完回老周干直道热现如备年。",
        "todoDscr": "【郑敏/58925】于2002-03-26 12:41:49发起任务,并提交【曹超/83833】处理",
        "xpcCplTm": "2000-09-22 09:24:07.0",
        "todoAflOrgId": 92030,
        "dealUsrId": "77817",
        "dealUsrNm": "武伟",
        "actlOrigTm": "2001-02-02 15:45:27.0",
        "todoSts": "2",
        "crtUsrId": "84908",
        "crtTm": "2017-11-21 10:48:55.0",
        "updUsrId": "75655",
        "updTm": "2017-11-21 10:48:55.0"
    }],
    "Z2": [{ "totalCount": 100 }]
}
```



