---
title: '如何写一个pc端通用的分页组件'
summary_img: /images/canyon.jpg # Add image post (optional)
date: 2017-10-15 23:30:00

tag: [JQUERY, PAGINATOR, JAVASCRIPT]
---

最近在做部门的项目时，有几个页面都是展示分页列表，页面中有专门的一块搜索区域。在写这些页面时，发现有很多通用的逻辑，这些通用逻辑的代码量大概 100~200 行，细节之处还是挺多的，容易出错。

如果能把他们抽象出来，做一个通用列表组件，那么之后再有相关页面要开发，就能节省很多代码同时大大提升开发效率。本文就是记录我在写这个组件时的思路以及详细技术细节。

组件的源码我已经放在了`github`上：[jquery-common-paginator.js](https://github.com/hellogithub2014/jquery-common-paginator.js)。 可以参见其中的`test.html`来学习如何使用。

# 抽象

一般来说一个带搜索的分页列表页面布局类似如下：

![Image text](https://github.com/hellogithub2014/jquery-common-paginator.js/raw/master/common-paginator-images/paginator-for-present.png)

其中：

搜索条件区域是每个页面所独有的；

列表展示区域虽然也不一样，但是稍加思考，就会发现真正不一样的是每一个列表项的展示逻辑。整个列表区域只不过是迭代这个逻辑，最后将所有结果拼接起来渲染，**这个迭代并拼接的过程就是通用的逻辑**；

**分页处理区域的逻辑是通用的**：

- 在点击页码时，利用当前搜索条件加上每页大小，来搜索对应页的数据。同时页码的展示样式也应当比较固定。
- 分页的提示信息基本也是相同的，在同个项目组，这些信息应当是比较固定的
- 在更改每页显示条数时，需要利用当前搜索条件及新的每页大小来搜索第一页的数据

**其他通用逻辑**

- 删除当前页的某条数据时，若当前页只剩一条数据，此时需要获取上一页的数据，同时页面选中的页码减 1；如果当前页还有多条数据，直接刷新当前列表
- 删除当前页所有数据时，需要获取上一页的数据
- 更新当前页数据时，若列表是以更新时间倒序排列的，那么更新后，页面需要跳转到第一页；若列表是以其他非时间敏感字段排序的，那么只需重新渲染当前页即可

**我们的通用列表组件要做的就是封装这些通用逻辑**，这样用户只用专注于：

1. 如何生成后台请求的搜索条件参数
2. 如何渲染每一个列表项

如果想要列表保持灵活性，还需要让用户可以自定义如下配置：

1. 如何使用搜索条件参数+分页参数生成真正的后台接口请求参数
2. 如何发送请求
3. 如何从响应中提取列表数据
4. 如何从响应中提取数据总条数
5. 如何处理失败
6. 每页大小的数组
7. 分页区域的渲染逻辑

# 第一步

我设想中的组件是需要使用构造函数进行实例化，构造函数名就叫`JqueryCommonPaginator`，那么用户就会使用如下的代码进行初始化：

```js
var paginator = new JqueryCommonPaginator();
```

我们希望用户进行选项配置时更简单，那么就提供一组默认配置，同时在初始化时给用户一个覆盖所有配置的机会：

```js
function JqueryCommonPaginator(options) {
  // 作用域安全的构造函数，防止用户手滑使用了
  // var paginator = JqueryCommonPaginator();  来初始化，那样就会报错
  if (this instanceof JqueryCommonPaginator) {
    this.options = Object.assign({}, defaultOptions, options);
  } else {
    return new JqueryCommonPaginator(options);
  }
}
```

接下来我们就的重点关注如何编写默认逻辑`defaultOptions`

# 默认配置`defaultOptions`

此处的默认配置是基础我们项目的前后台请求规范编写的。

### 基本配置

```js
/**
 * 用户自定义，用户的个性化搜索参数，Z21框架中的需要有path、prcCode两个属性.
 * 此对象有两个属性：
 * asistParam 可选的辅助参数，不会放在和mainParam、分页参数一起。
 *              主要目的是扮演对整个请求格式的辅助类信息,例如请求的url
 * mainParam  必选主要的参数，推荐在其中放置你的用户搜索条件参数
 *
 * 分页参数是一个拥有startIndex和pageSize属性的对象，用户不能更改格式
 */
defaultOptions.userParam = {};

// 用户自定义，默认的每页显示条数数组
defaultOptions.PAGE_SIZE_LIST = [5, 10, 20];
```

### 生成真正后台请求入参

我们项目中的接口入参格式均是如下这样：

```js
{
 		"TARSVR": "",
		"PRCCOD": "", // 用于控制后台路由的编码
 		"WEBCOD": "",
		"ISUDAT": "",
	   "ISUTIM": "",
		"DALCOD": "",
 		"RTNLVL": "",
 		"RTNCOD": "",
 		"ERRMSG": "",
 		"INFBDY": "", // 所有搜索条件X1和分页参数X2均放在这里
}
```

```js
/**
 * 默认后台接口请求入参生成函数。用户可自定义
 */
defaultOptions.backendParamGenerator = function(userParam, paginatorParam) {
  var backendInterfaceParam = {};
  var infoBodyData = {};
  if (userParam.asistParam && userParam.asistParam.prcCode && typeof userParam.asistParam.prcCode === 'string') {
    var prcCodeSuffix = userParam.asistParam.prcCode.substring(4); //去掉前4位
    infoBodyData[prcCodeSuffix + 'X1'] = [].concat(userParam.mainParam);
    infoBodyData[prcCodeSuffix + 'X2'] = [].concat(paginatorParam);
    backendInterfaceParam = {
      TARSVR: '',
      PRCCOD: userParam.asistParam.prcCode,
      WEBCOD: '',
      ISUDAT: '',
      ISUTIM: '',
      DALCOD: '',
      RTNLVL: '',
      RTNCOD: '',
      ERRMSG: '',
      INFBDY: infoBodyData,
    };
  } else {
    console.error('请在userParam.asistParam对象中放置 PRCCode和path两个属性', userParam);
  }
  return JSON.stringify(backendInterfaceParam);
};
```

### 获取后台数据接口

请求的 url 是一个由`userParam.asistParam.path`决定的反向代理路径。

```js
/**
 * 获取后台数据接口
 *
 * 注意：若想自定义此函数，要求是
 * 1. 在成功拿到想要的响应数据后，显式的调用this.getSuccessFunc(response)
 * 2. 失败时，显式的调用this.getFailedFunc(error)
 */
defaultOptions.fetchData = function(backendInterfaceParam) {
  var _this = this;
  var userParam = this.options.userParam;

  // 校验

  $.ajax({
    type: 'POST',
    url: '/' + _this.options.userParam.asistParam.path + '/rmi.do',
    cache: false,
    data: backendInterfaceParam,
    dataType: 'json',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    success: function(response) {
      if (response.ERRMSG === '' || response.ERRMSG === null) {
        _this.getSuccessFunc().call(_this, response);
      } else {
        _this.getFailedFunc().call(_this, response.ERRMSG);
      }
    },
    error: function(XMLHttpRequest, textStatus, errorThrown) {
      if (errorThrown) {
        _this.getFailedFunc().call(_this, errorThrown);
      }
    },
  });
};
```

### 从响应中获取列表数据

我们项目的接口响应格式是：

```js
TODO: 添加响应格式;
```

```js
defaultOptions.getListFromResponse = function(response) {
  var dataList = [];
  //去掉前4位
  var prcCodeSuffix = this.options.userParam.asistParam.prcCode.slice(4);
  dataList = response.INFBDY[prcCodeSuffix + 'Z1'];

  return dataList;
};
```

### 从响应数据中获取总数据条数

```js
defaultOptions.getTotalCountFromResponse = function(response) {
  //去掉前4位
  var prcCodeSuffix = this.options.userParam.asistParam.prcCode.slice(4);
  var totalCount = response.INFBDY[prcCodeSuffix + 'Z2'][0].totalCount;
  return totalCount;
};
```

### 根据每个列表项数据生成对应的模板 HTML

此函数在不同页面必然是不同的，所以这里仅仅做一个示范。 函数的要求是返回一个字符串：

```js
defaultOptions.itemRenderFunc = function(itemModel, renderOptionFunc) {
  return "<div style='border:1px solid red;margin:20px 0;'>Hello World</div>";
};
```

注意到这个函数有一个`renderOptionFunc`参数，执行此函数会得到一个额外对象，此对象的作用是提供`itemModel`不能提供的额外数据，譬如页面的`URL`等等。当然如果不需要额外参数，直接忽略此参数即可。

### 提供给@itemRenderFunc 的参数

作用如上所述。此函数如果需要返回值，那么基本是不同页面不一样。

```js
defaultOptions.itemRenderOptionFunc = function(itemModel) {
  return {};
};
```

### 当请求成功，但列表为空时，渲染空白的列表区域

```js
defaultOptions.renderEmptyList = function() {
  var html = '<div style="height: 300 px;">无数据</div>';
  $(this.options.DOM_SELECTORS.LIST_SELECTOR).html(html);
};
```

### 渲染分页区域

```js
/**
 * 渲染分页区域，并绑定点击事件
 */
defaultOptions.renderPaginatorArea = function(dataListLength, totalCount) {
  var _this = this;

  // 利用jquery-page渲染页码条，同时绑定页码点击函数
  $(this.options.DOM_SELECTORS.PAGE_NUMBER_SELECTOR).createPage({
    pageCount: Math.ceil(totalCount / _this.curPaginatorParam.pageSize), // 总页码
    current: _this.curPageIndex, // 初始页码
    backFn: function(page) {
      // 页码条点击事件处理函数
      if (page !== _this.curPageIndex) {
        // 只有点击的是不同的页码，才执行后续请求
        _this.curPageIndex = page;
        // 更新当前分页参数
        _this.curPaginatorParam = Object.assign(_this.curPaginatorParam, {
          startIndex: _this.curPaginatorParam.pageSize * (page - 1),
        });

        _refresh.call(_this);
      }
    },
  });

  // 渲染分页提示区域、每页大小下拉框
  var curStartIndex = this.curPaginatorParam.startIndex;
  var paginatorHintHtml = '当前<a>' + (curStartIndex + 1) + '-' + (curStartIndex + dataListLength) + '</a>,共<b>' + totalCount + '</b>条信息';
  // 分页提示
  $(this.options.DOM_SELECTORS.PAGE_HINT_SELECTOR).html(paginatorHintHtml);

  // 渲染每页大小下拉框
  var pageSizeSelectorHtml = '每页显示<select>';
  this.options.PAGE_SIZE_LIST.forEach(function(pageSize) {
    pageSizeSelectorHtml += '<option value="' + pageSize + '">' + pageSize + '</option>';
  });
  pageSizeSelectorHtml += '</select>';

  $(this.options.DOM_SELECTORS.PAGE_SIZE_SELECTOR).html(pageSizeSelectorHtml);
  $(this.options.DOM_SELECTORS.PAGE_SIZE_SELECTOR + '  select').val(this.curPaginatorParam.pageSize); // 当前每页的大小
};
```

注意这里的`$("").createPage`方法，这是部门另一位同事写的一个`jquery`插件。它可以帮助我们渲染页码条，同时提供一个选项来让我们注册页码点击事件。具体源码可以参见`github`源码中的`jquery.page.js`。

# 覆盖默认配置

可以看到`defaultOptions`中的默认配置还是挺多的，如果需要覆盖每一个配置，那么比较好的做法就是提供一一对应的`set`方法，例如：

```js
JqueryCommonPaginator.prototype.setPageSizeList = function(newPageSizeList) {
  // .....
};
JqueryCommonPaginator.prototype.setItemRenderFunc = function(newItemRenderFunc) {
  // .....
};
// 其他set方法。。。。
```

它们的逻辑基本是相同的，即使用函数中提供的参数来替换`defaultOptions`的对应属性成员，同时校验参数类型。为此我们可以提供一个帮助函数，所有`set`方法均调用此函数：

```js
/**
 * 选项属性设置帮助函数.
 *
 * @param {any} tagetOptionName  选项的目标属性名称
 * @param {any} newOptionValue 想要设置的新值
 * @param {any} typeToCheck 校验类型字符串 如 Array、Function、Object等
 * @returns this
 */
function _setterHelper(tagetOptionName, newOptionValue, typeToCheck) {
  if (!newOptionValue || Object.prototype.toString.call(newOptionValue).slice(8, -1) !== typeToCheck) {
    console.error('tagetOptionName 需要是一个' + typeToCheck, '你设置的值是: ', newOptionValue);
    return this;
  }
  var temp = {};
  temp[tagetOptionName] = newOptionValue;
  this.options = Object.assign(this.options, temp);
  return this;
}
```

注意这里的`Object.prototype.toString.call(newOptionValue)`，它的返回值是一个字符串，格式诸如`"[object Object]"`,这是`JavaScript`的一个比较完善的类型检测技巧。其他检测类型的方式还有`typeof`和`instanceof`，但`typeof`只能检测基本值类型，`instanceof`缺乏通用性只能确定是否为某个特定的类型，而且涉及到继承时还有出现一些意料之外的情况。

有了这个帮助函数之后，其他`set`方法只用简单调用它：

```js
JqueryCommonPaginator.prototype.setPageSizeList = function(newPageSizeList) {
  this.curPaginatorParam.pageSize = newPageSizeList[0];

  return _setterHelper.call(this, 'PAGE_SIZE_LIST', newPageSizeList, 'Array');
};

JqueryCommonPaginator.prototype.setDomSelectors = function(newSelectors) {
  return _setterHelper.call(this, 'DOM_SELECTORS', newSelectors, 'Object');
};

JqueryCommonPaginator.prototype.setBackendParamGenerator = function(newGenerator) {
  return _setterHelper.call(this, 'backendParamGenerator', newGenerator, 'Function');
};
```

稍微细心点可以发现这些`set`都是返回`this`，这是为了方便链式调用，例如：

```js
paginator.setPageSizeList(mockPageSizeList).setDomSelectors(mockDomSelectors);
```

# 通用逻辑

好了，上面介绍那么多，终于可以介绍通用逻辑的处理了。

### 成功拿到想要的 response 后的操作

这里只需拿到列表数据后，只需渲染列表和分页区域。

```js
function _successFunc(response) {
  var dataList = this.options.getListFromResponse.call(this, response);
  var totalCount = this.options.getTotalCountFromResponse.call(this, response);
  this.currentList = dataList; // 缓存当前页的列表数据
  if (dataList.length > 0) {
    // 有数据时
    // 渲染分页区域
    this.options.renderPaginatorArea.call(this, dataList.length, totalCount);
    _renderList.call(this, dataList); // 渲染列表区域
    _bindPageSizeChangeHandler.call(this); // 绑定每页大小变更事件
  } else {
    // 无数据时
    this.options.renderEmptyList.call(this);
  }
}
```

使用`call`是为了显示指定`this`的值，否则默认的`this`就是`this.options`了。

### 渲染列表区域

上面说了，单条数据项的渲染是使用`itemRenderFunc`决定的，我们只需迭代这个过程即可，返回最终拼接的 HTML，并最终渲染：

```js
function _renderList(dataList) {
  var _this = this;
  var toatlListHtml = dataList.reduce(function(curListHtml, data) {
    return (curListHtml += _this.options.itemRenderFunc.call(_this, data, _this.options.itemRenderOptionFunc.bind(_this)));
  }, '');

  $(this.options.DOM_SELECTORS.LIST_SELECTOR).html(toatlListHtml);
}
```

`this.options.DOM_SELECTORS.LIST_SELECTOR`是页面中渲染列表区域的`DOM`选择器，还有其他几种选择器：

```js
// 相关的页面dom选型器。用户可自定义
defaultOptions.DOM_SELECTORS = {
  LIST_SELECTOR: '#data-list', // 列表渲染区域
  PAGE_NUMBER_SELECTOR: '#page-number-area', // 页码条区域
  PAGE_HINT_SELECTOR: '#page-hinter-area', // 提示用户当前数据范围，总共有多少数据
  PAGE_SIZE_SELECTOR: '#page-size-area', // 每页条数区域
};
```

### 绑定每页大小变更事件

只需在改变每页大小后，使用新的页面大小重新获取第一页数据即可。

```js
function _bindPageSizeChangeHandler() {
  var _this = this;
  $(this.options.DOM_SELECTORS.PAGE_SIZE_SELECTOR + '  select').change(function(e) {
    _this.curPaginatorParam = {
      startIndex: 0,
      pageSize: parseInt($(this).val()),
    };
    _this.curPageIndex = 1; // 重置选中的页码

    _refresh.call(_this); // 刷新
  });
}
```

此方法会在`_successFunc`渲染完分页区域后被调用。

`_refresh`也是一个帮助方法，用于根据当前的参数获取数据并刷新列表。

```js
function _refresh() {
  // 生成真正的后台接口入参
  var backendInterfaceParam = this.options.backendParamGenerator.call(this, this.options.userParam, this.curPaginatorParam);
  this.options.fetchData.call(this, backendInterfaceParam);
}
```

# 列表项变更操作

通常渲染完列表后，可能会对列表项进行各种操作，可以归纳为删除和更新操作。 这两种操作的逻辑其实也是通用的。

**删除**：

- 若当前页只剩一条数据，此时需要获取上一页的数据，同时页面选中的页码减 1；
- 若当前页还有多条数据，直接刷新列表。或者可以优化一下，不是刷新整个页面，而是只删掉第 index 条，同时将下一页的第一条放到当前页末尾，同时提供可选的动画效果。

**更新**：

- 若列表是以更新时间倒序排列的，那么更新此条时，页面需要跳转到第一页
- 若列表是以其他非时间敏感字段排序的，那么只需重新渲染当前页即可

除了单条变更，有时还会有批量的变更操作，例如批量删除、批量更新，他们的原理和单条操作大同小异。

### 单条删除

```js
/**
 * 删除当前页第index条数据，以0开始
 */
JqueryCommonPaginator.prototype.deleteItem = function(index) {
  if (this.currentList.length > 1) {
    //当前页还有多条数据
    _refresh.call(this); // 直接刷新当前页
    // 体验优化：不是刷新整个页面，而是只删掉第index条，
    // 同时将下一页的第一条放到当前页末尾，可选的动画
    return;
  }

  // 只剩一条数据时
  this.curPageIndex = this.curPageIndex > 1 ? this.curPageIndex - 1 : 1;
  // 更新当前分页参数
  this.curPaginatorParam = Object.assign(this.curPaginatorParam, {
    startIndex: this.curPaginatorParam.pageSize * (this.curPageIndex - 1),
  });

  _refresh.call(this); // 刷新
};
```

### 删除整页

```js
/**
 * 删除当前页所有数据
 */
JqueryCommonPaginator.prototype.deletePage = function() {
  // 不要让页码变为0或负数
  this.curPageIndex = this.curPageIndex > 1 ? this.curPageIndex - 1 : 1;
  // 更新当前分页参数
  this.curPaginatorParam = Object.assign(this.curPaginatorParam, {
    startIndex: this.curPaginatorParam.pageSize * (this.curPageIndex - 1),
  });

  _refresh.call(this);
};
```

### 更新单条

```js
/**
 * 更新当前页第index条数据, index从0开始计算
 *
 * 注意点：
 * 1. 若列表是以更新时间倒序排列的，那么更新此条时，页面需要跳转到第一页
 * 2. 若列表是以其他非时间敏感字段排序的，那么只需重新渲染当前页即可
 *
 * 为此提供goFirstPageAfterUpdate参数，让用户来决定
 */
JqueryCommonPaginator.prototype.updateItem = function(index, newItemModel, goFirstPageAfterUpdate) {
  var goFirst = goFirstPageAfterUpdate || false; // 默认为false

  if (!goFirst) {
    // 如果留在当前页
    this.currentList.splice(index, 1, newItemModel); // 更新第index条数据
    _renderList.call(this, this.currentList); // 重新渲染列表区域
  } else {
    // 如果去第一页
    this.setUserParam(this.options.userParam); // 直接刷新数据即可
  }
};
```

### 更新整页

```js
/**
 * 更新当前页所有数据
 *
 * 注意点：
 * 1. 若列表是以更新时间倒序排列的，那么更新时，页面需要跳转到第一页
 * 2. 若列表是以其他非时间敏感字段排序的，那么只需重新渲染当前页即可
 *
 * 为此提供goFirstPageAfterUpdate参数，让用户来决定
 */
JqueryCommonPaginator.prototype.updatePage = function(newDataList, goFirstPageAfterUpdate) {
  var goFirst = goFirstPageAfterUpdate || false; // 默认为false

  if (!goFirst) {
    // 如果留在当前页
    this.currentList = newDataList; // 更新列表数据
    _renderList.call(this, this.currentList); // 重新渲染列表区域
  } else {
    // 如果去第一页
    this.setUserParam(this.options.userParam); // 直接刷新数据即可
  }
};
```

除此之外，如果想批量操作指定的多条数据，原理大同小异，在此就不赘述了。

# 总结

本文详细阐述了如何写一个 pc 端的分页列表，给出了总体思路和详细技术方法，并提供具体代码供读者参考。
