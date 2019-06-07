---
title: 实现gitlab PR自动流程处理机器人
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

![webhook](/images/gitlab-webhook/webhook.png)

其中的`URL`是自定义的，我们可以将它指向我们的一个后端`api`，`gitlab`会往这个`api`发送一个`POST`请求，携带事件的详细信息。`Trigger`我们设置为`Comments`，表示每次有人在`PR`里发表了评论都会触发`api`。

在设置了`webhook`后，点击它的`Edit`按钮，可以看到在什么时候触发了`webhook`:

![webhook-list](/images/gitlab-webhook/webhook-list.png)

![webhook-call-list](/images/gitlab-webhook/webhook-call-list.png)

还可以看到每次触发时传递的参数：

![webhook-call-detail](/images/gitlab-webhook/webhook-call-detail.png)

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

![private_token](/images/gitlab-webhook/private_token.png)

以上，这样我们就拿到了所有有效的`@`目标，接下来就是如何在`IM`群里利用机器人`@`他们。

# 机器人自动@目标

这个基本就是调用各`IM`工具的`open api`了，举一个`飞书`的例子：

```js
const atText = atList.map( at => `<at user_id="${ at.userId }">@${ at.name }</at>` );
const textMsgConfig = {
  open_chat_id, // 群id
  msg_type: 'text',
  content: {
    text: atText,
  }
}
await request.post( '/send/message/', textMsgConfig ); // 在群里发送通知
```

只需提供@目标的`userId`和`name`即可，可以同时@多人。同时需要额外再提供群的id，这样机器人才知道该把消息往哪里发送。

置于怎么申请`IM`机器人，这个也是不同`IM`不一样，这里不赘述。

以上，我们就能做到当在`PR`里@了一些目标同事后，机器人自动在群里@同事了。

# 通知merge PR

接下来要解决的问题是当有足够多的人觉得PR是ok的，实时通知PR作者来`merge` `PR`。这里涉及到2个问题：

1. 怎么判断一个PR是ok的
2. 怎么判断有足够多的人觉得PR是ok的

第一个问题可以约定一个暗号：当在PR中评论了`LGTM（Look Good To Me）`即认为PR是ok的，当然也可以用其他暗号。

第二个问题的核心是： 判断一个PR的所有评论中是否有足够的指定字符串。首先需要获取所有评论，这个依然可以通过`gitlab` `openapi`来获取，然后就依次对每条评论的内容做字符串匹配即可。核心代码示范：

```js
// 此PR所有的评论
const discussions = await getPrDiscussions( {
  pid,
  mrId,
  privateToken
} );

const lgtmList = getLgtmList( discussions, author ) || []; // 回复了LGTM的评论列表
// 如果还没有到阈值则不回复消息
if ( lgtmList.length < lgtmThreshold )
{
  return;
}

// 文本消息
const nameList = lgtmList.map( note => note.author.name );
const lgtmSummary = `${ nameList.slice(0,3).join( '、' ) }${ nameList.length > 3 ? `等${nameList.length}人` : '' }对你的PR回复了LGTM， 你可以Merge此PR了`;
const textMsgConfig = {
  email, // PR作者的邮箱
  msg_type: 'text',
  content: {
    text: lgtmSummary,
  }
}
await request.post( '/send/message/', textMsgConfig ); // 发送私聊通知
```

```js
// 筛选出非PR作者写的note， discussion 与 note是一对多的关系
function getNonAuthorNotes ( discus, authorId ) {
  return ( discus.notes || [] ).filter( note =>
    `${ note.author.id }` !== `${ authorId }` && // 非作者的PR
    !note.system && // 不是系统发的
    !note.resolved // 没有resolve
  );
}

// 获取回复了LGTM的评论列表
function getLgtmList ( discussions, author ) {
  const distinctMap = {}; // 去重，同一个人的多次lgtm只算一次

  // 获取所有非作者的评论
  const noteList = discussions.reduce( ( noteList, discus ) => noteList.concat( getNonAuthorNotes( discus, author.id ) ), [] );

  return noteList
    .filter( note => note.body.trim().toUpperCase() === 'LGTM' ) // 过滤出评论了LGTM的
    .filter( note => { // 去重
      const { id } = note.author;
      if ( !distinctMap[ id ] )
      {
        distinctMap[ id ] = 1;
        return true;
      }
      return false;
    } )
}
```

以上我们就可以及时给PR作者发送merge通知了。

# merge PR

最后一件锦上添花的事情，当收到`merge`通知后，当然可以手动打开PR连接然后点击`merge`按钮，不过这样显得不够极致，能不能让作者直接在`IM`工具内点击某个按钮或链接，然后由机器人自动帮助其合并呢？这样就更方便好用了！

当然这么做的前提是`IM`工具支持富文本类型消息，或者可交互的消息，只要最终可以往指定链接发送`GET`或`POST`请求即可。

`gitlab`提供了[直接`merge PR`的`openapi`](https://docs.gitlab.com/ee/api/merge_requests.html#accept-mr),不过其只支持`PUT`类型请求，同时需要携带`PR`的关键信息。如果`IM`工具不支持在消息内再发送`PUT`类型请求，那么只能做一次中转：先发送一个普通的`get`/`post`请求到我们自己的某个后端`api`，然后在这个`api`内再发送最后的`PUT`请求。核心代码示范如下：

```js
// 发送支持交互的消息
const interacriveMsgConfig = {
  // ... 其他相关配置
  method: "post",
  url: 'xxx', // 中转后端api
  parameter: {
    pid,
    mrId,
    privateToken,
    squash, // 是否squash commit
    removeSource, // 是否删除源分支
  },
}

// 发送交互类型消息
await request.post( '/send/message/', {
  email,
  msg_type: 'interactive',
  content: {
    card: interacriveMsgConfig,
  },
} );
```

然后在后端`api`发送`PUT`请求：

```js
// 合并PR
module.exports = async function ( params, context ) {
  const {
    pid,
    mrId,
    privateToken,
    squash,
    removeSource,
  } = params;

  const gitlabRequest = await getGitlabRequest( privateToken );

  let msg = '';
  let status = 200;
  try
  {
    // 发送PUT请求
    const result = await gitlabRequest.put( `/projects/${ pid }/merge_requests/${ mrId }/merge`, {
      id: pid,
      merge_request_iid: mrId,
      squash,
      should_remove_source_branch: removeSource
    } );
    console.log( 'SUCCESS merge pr, result => ', result );
    msg = `【 SUCCESS 】: PR is merged!`;
  } catch ( error )
  {
    console.error( 'FAIL merge pr, error => ', error.response );
    ( { status, statusText } = error.response );
    msg = `【 FAILED 】: ${ statusText }, ${ errorMap[ status ] }`;
  }

  console.log( 'merge pr ,final function return => ', { status, msg } );
  context.status( status ); // 设置响应状态码
  return { status, msg };
}
```

以上我们就做到了`PR`的全程自动化！ 整个机器人的代码其实就是一个`node`服务，找个服务器部署起来即可。

完整的源码可以参照[`github`](https://github.com/hellogithub2014/gitlab_bot).