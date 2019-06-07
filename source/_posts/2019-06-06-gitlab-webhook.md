---
title: 结合serverless实现gitlab PR自动推送机器人
date: 2019-06-06 17:06:09
summary_img: /images/sweden.jpg
tags: [gitlab, webhook, serverless, node]
---

公司团队是使用`gitlab`来管理源代码的，一直以来当提交了一个`PR`后，需要手动在内部`IM`群里贴出`PR`链接和摘要，然后`@`目标同事来帮忙review代码，之后就不时地手动刷新页面查看是否有足够的人`review`完了。这种方式比较原始费时，仔细想想其实大部分流程是可以自动化的。

一些做的好的`IM`可以实现自定义机器人，例如[飞书(lark)](https://itunes.apple.com/cn/app/%E9%A3%9E%E4%B9%A6-%E6%96%B0%E4%B8%80%E4%BB%A3%E4%BC%81%E4%B8%9A%E5%8A%9E%E5%85%AC%E5%A5%97%E4%BB%B6/id1401729613?mt=8)，如果机器人可以知道有人发了`PR`，同时又知道具体有哪些人需要`review PR`，那么就可以自动在`IM`群里把这个`PR`的信息发出来，同时`@`对方。然后当机器人知道`PR`通过了后就可以给`PR`作者私聊发通知，就可以开开心心合并代码了。整理下具体流程：

```sh
提交PR -> 群里发通知+@对方 -> PR通过 -> 私聊发送通知 -> 合并PR
```

全程只有第一步和最后一个需要`PR`作者操作，中间的步骤都可以由机器人完成。

# 如何知道有人发了PR

这里的标题有一点误导，我们真正想知道的不是有没有人提交PR，而是那些需要被人`review`的`PR`。我们可以约定只有在`PR`的评论里@了同事，才认为这个`PR`需要`review`. 恰好`gitlab`提供了一种`webhook`机制,可以在发生了特定的事件时请求指定的`api`。 `webhook`的设置路径是`项目仓库 ->  Settings -> Integrations`,如图：

![webhook](webhook.png)

其中的`URL`是自定义的，我们可以将它指向我们的一个后端`api`，`gitlab`会往这个`api`发送一个`POST`请求，携带事件的详细信息。`Trigger`我们设置为`Comments`，表示每次有人在`PR`里发表了评论都会触发`api`。

在设置了`webhook`后，点击它的`Edit`按钮，可以看到在什么时候触发了`webhook`:

[webhook-list](webhook-list.png)

[webhook-call-list](webhook-call-list.png)

还可以看到每次触发时传递的参数：

[webhook-call-detail](webhook-call-detail.png)

里面的信息非常丰富，每次评论的内容也在其中，还可以根据已有的信息再次调用`gitlab openapi`来获取更多信息。

以上，每次有人在`PR`里发表评论了，我们的后端`api`都会收到一个请求，接下来的问题是如何判断评论里是否含有有效的`@`.

# 提取@对象

首先评论的具体内容是放在了请求参数的`object_attributes.note`属性中，它是一个字符串例如`@xiaoming @zhangsan 来看看我的PR啊~`。什么是有效的@目标呢？ 就是@的对象确实是同事的名字，而不是随便写的，例如`@123`就不是有效的@。 我们把这件事拆分一下，首先无脑提取所有的@对象，可以用以下代码：

```js
const atReg = /@[^\s]+/g

// 获取单条note中@的列表
function getNoteAtList ( note ) {
  return ( note.match( atReg ) || [] )
    .map( at => at.slice( 1 ) ); //去除前面的@符号
}
```

它会返回形如`['xiaoming', 'zhangsan']`的数组，接下来就是判断每个元素是否有效的目标。这里可能不同公司的业务不一样，我的思路是判断目标是否为`gitlab`里的注册用户，可以用`gitlab`的[`users api`](https://docs.gitlab.com/ee/api/users.html),可以查询用户名匹配指定字符串的所有用户。我们利用这个`api`看返回的数组是否为空，不为空取第一个。则整个过滤逻辑如下：

```js
// 过滤@列表，只留下真实存在的gitlab用户, privateToken为gitlab openapi需要的鉴权token
async function filterAtList ( atList = [], privateToken ) {
  const distinctList = [ ...new Set( atList ) ]; // 去重
  const result = await Promise.all( distinctList.map( username => getGitlabUser( username, privateToken ) ) );
  return result.filter( Boolean ); // 去除空值
}

// 根据username在查找User信息
async function getGitlabUser ( userName, privateToken ) {
  const users = await getUser( {
    userName,
    privateToken,
  } )

  if ( !users || !users.length )
  {
    return null;
  }
  const target = users[ 0 ];
  return {
    username: userName,
    name: target.name,
    id: target.id,
  };
};

async function getUser ( params ) {
  const { userName, privateToken } = params;
  const request = await getGitlabRequest( privateToken ); // 基于axios进行的封装，设置了baseURL及鉴权header
  try
  {
    const result = await request.get( `/users`, {
      params: {
        username: userName,
      }
    } );

    return result.data || [];
  } catch ( e )
  {
    console.error( 'get_gitlab_user_info', e );
    return [];
  }
}
```

调用`gitlab openapi`需要鉴权的`private_token`，获取步骤： 进入`gitlab` -> 右上角个人头像 -> `Settings` -> `Access Tokens`，然后就可以增加一个`token`了，注意`token`的`scopes`全选.

![private_token](private_token.png)

以上，这样我们就拿到了所有有效的`@`目标，接下来就是如何在`IM`群里利用机器人`@`他们。