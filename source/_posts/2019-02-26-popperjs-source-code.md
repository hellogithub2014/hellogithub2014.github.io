---
title: popover在快速滚动列表项中的问题及Popper.js源码解析
summary_img: /images/malaysia.jpg
date: 2019-02-26 09:59:36
tags: [javascript]
---

我们前端项目里用的组件库是 vue 的`element-ui`，有个地方用到了[popover](http://element.eleme.io/#/zh-CN/component/popover)组件，一个列表中每个列表项在 hover 时都会在`popover`中展示提示语。这里就出现了一个优化问题：当快速滚动列表项时，即使某个列表项已经隐藏了，可是对应的`popover`需要过一会才能消失，体验不大好，示范如下：

![](/images/popperjs/popover-problem-in-list.gif)

可以看到很多`popover`都是到了视口顶部才消失，使用的示范代码如下：

```html
<div class="hover-wrapper" ref="hoverWrapper">
  <vi-popover
    ref="popover"
    v-for="(item, index) in 100"
    :key="item"
    placement="right-start"
    trigger="hover"
    :content="`这是一段内容, index = ${index}`"
  >
    <vi-button slot="reference" class="hover-ref">hover 激活</vi-button>
  </vi-popover>
</div>
```

```css
.hover-wrapper {
  height: 500px;
  width: 500px;
  overflow: auto;
  border: 1px solid red;
  margin-top: 300px;
}
.hover-ref {
  display: block;
  width: 120px;
  height: 50px;
}
```

这篇文章主要是找到为什么会出现这种现象，以及如何解决它。

# 思路 1： transition

查看`popover`组件的源码发现其出现及消失都是有一段`transition`动画的：

```html
<transition :name="transition">
  <!-- popover主体html略 -->
</transition>
```

默认的`transition`是`fade-in-linear`，它具体的定义位于`packages/theme-chalk/src/common/transition.scss`:

```scss
.fade-in-linear-enter-active,
.fade-in-linear-leave-active {
  transition: $--fade-linear-transition;
}

.fade-in-linear-enter,
.fade-in-linear-leave,
.fade-in-linear-leave-active {
  opacity: 0;
}

$--fade-linear-transition: opacity 200ms linear !default;
```

`popover`的出现消失都会有`200ms`的渐变，那会不会是它的原因呢？ `popover`支持定制`transition`动画，我们可以写一个自己的动画，将消失的时长变为 0，看看问题是否还存在？

我们的自定义动画名姑且就叫`my-fade-in-linear`：

```scss
.my-fade-in-linear-enter-active {
  transition: opacity 200ms linear;
}

.my-fade-in-linear-leave-active {
  transition: opacity 0ms linear;
}

.my-fade-in-linear-enter,
.my-fade-in-linear-leave,
.my-fade-in-linear-leave-active {
  opacity: 0;
}
```

将其传给`popover`：

```html
<vi-popover transition="my-fade-in-linear"> </vi-popover>
```

很难受，问题依然存在，只能看看源码怎么写的。

# 思路 2： `popover`组件层级控制

研究了一会发现`popover`的显隐是由宿主的`mouseenter`、`mouseleave`控制的：

```js
if (this.trigger === 'hover') {
  on(reference, 'mouseenter', this.handleMouseEnter); // 展示popover
  on(popper, 'mouseenter', this.handleMouseEnter);
  on(reference, 'mouseleave', this.handleMouseLeave); // 隐藏popover
  on(popper, 'mouseleave', this.handleMouseLeave);
}
```

奇怪的是`handleMouseLeave`中隐藏`popover`设置了一个`200ms`定时器：

```js
handleMouseLeave() {
  clearTimeout(this._timer);
  this._timer = setTimeout(() => {
    this.showPopper = false; // 隐藏popover
  }, 200);
},
```

暂且不管`_timer`是因为什么而设置的，我们尝试在定时器之外设置`this.showPopper`看看问题是否还在。

```js
handleMouseLeave() {
  clearTimeout(this._timer);
  this._timer = setTimeout(() => {
    // do nothing
  }, 200);
  this.showPopper = false;
},
```

很不幸，还是不行。。。。。

再次仔细观察发现：**在 `hover` 到某个列表项然后快速滚动时，其实并没有立即切换到另一个表单项，而是等到 `hover` 到另一个列表项后，前一个被 `hover` 的列表项才能取消 `hover` 状态,这就导致`handleMouseLeave`其实很久后才真正触发**。慢动作如下：

![](/images/popperjs/popover-problem-in-list-slow.gif)

**这就表明从`popover`组件自身是没有办法解决这个问题的，需要更深入的研究其底层所用的库,也就是[Popper.js](https://popper.js.org/)**

`Popper.js`是一个很有名的管理弹出内容的小巧库，在`github`上有 11000+的 star，并且其体积很小，压缩混淆且 gzip 后只有大约 6kb。

# 思路 3：设置 `boundariesElement`

`Popper.js`在 element 多个组件中都有用到，最常见的就是`popover`和`tooltip`这俩了：

[usage-in-vui](/images/popperjs/usage-in-vui.png)

我们研究`Popper.js`的主要目的是：**尝试找到一个方法，在宿主 reference 元素或者 popper 内容滚动出其父级滚动区时，隐藏 popper。**

在初步翻越其官网文档后，发现有一个`boundariesElement`配置项，看名字是指向`popper`的边界，默认的配置是`viewport`。因为`Popper.js`会小心控制其弹出内容不超出边界，必要时会调整`popper`的位置，示范如下：

![popper-boundaries-behavior](/images/popperjs/popper-boundaries-behavior.gif)

如果我们显式设置`boundariesElement`为我们的滚动父级元素，那么至少`popper`不会飞到视口顶部才消失，也算是用一种蹩脚的方法解决了问题。

我们的测试代码如下：

```js
this.popperOptions = {
  boundariesElement: this.$refs.hoverWrapper,
};
```

```html
<vi-popover :popperOptions="popperOptions"></vi-popover>
```

很遗憾，这次连`popper`内容都出现了问题：

![popper-error-of-boundariesElement](/images/popperjs/popper-error-of-boundariesElement.gif)

看起来是定位出现了很大问题，只能硬着头皮将`Popper.js`源码撸一遍，看看 popper 的具体展示逻辑，所幸没有想象中那么复杂。

## Popper.js 源码解析

还是喜欢从入口着手，先看看构造函数：

### 构造函数

```js
function Popper(reference, popper, options) {
  this._reference = reference.jquery ? reference[0] : reference;
  this.state = {};

  // if the popper variable is a configuration object, parse it to generate an HTMLElement
  // generate a default popper if is not defined
  var isNotDefined = typeof popper === 'undefined' || popper === null;
  var isConfig = popper && Object.prototype.toString.call(popper) === '[object Object]';
  if (isNotDefined || isConfig) {
    this._popper = this.parse(isConfig ? popper : {});
  }
  // otherwise, use the given HTMLElement as popper
  else {
    this._popper = popper.jquery ? popper[0] : popper;
  }

  // with {} we create a new object with the options inside it
  this._options = Object.assign({}, DEFAULTS, options);

  // refactoring modifiers' list
  this._options.modifiers = this._options.modifiers.map(
    function(modifier) {
      // remove ignored modifiers
      if (this._options.modifiersIgnored.indexOf(modifier) !== -1) return;

      // set the x-placement attribute before everything else because it could be used to add margins to the popper
      // margins needs to be calculated to get the correct popper offsets
      if (modifier === 'applyStyle') {
        this._popper.setAttribute('x-placement', this._options.placement);
      }

      // return predefined modifier identified by string or keep the custom one
      return this.modifiers[modifier] || modifier;
    }.bind(this),
  );

  // make sure to apply the popper position before any computation
  this.state.position = this._getPosition(this._popper, this._reference);
  setStyle(this._popper, { position: this.state.position, top: 0 });

  // fire the first update to position the popper in the right place
  this.update();

  // setup event listeners, they will take care of update the position in specific situations
  this._setupEventListeners();
  return this;
}
```

`_getPosition`用于获取`popper`的`position`属性,先看`offsetParent`的定位属性，如果它为`fixed`定位则返回`fixed`,否则返回`absolute`.

[`offsetParent`](https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLElement/offsetParent)是一个只读属性，返回一个指向最近的包含该元素的定位元素. 如果没有定位的元素，则 `offsetParent` 为最近的 `table`、`table cell` 或根元素（标准模式下为 `html`；`quirks` 模式下为 `body`）。注意当元素的 `style.display` 设置为 `"none"` 时，`offsetParent` 返回 `null`。

`setStyle`用于设置元素的内联样式，也就是`style`对象属性。

`_setupEventListeners`用于注册滚动父级元素的`scroll`事件,监听函数为`this.update`。

所以综上**构造函数主要做了以下几件事**：

1. 归一化 `popper` 和 `reference` 元素
2. 获取归一化 `options`
3. 获取 `modifiers` 函数，可以传入自定义的 `modifier` 函数，参数为 `data` 对象(参考 `update` 函数中的 `data` 定义)
4. 获取 `popper` 的 `position` 属性： `fixed` 或 `absolute`
5. 设置初始内联 `style`
6. 注册父级滚动元素的 `scroll` 事件，监听函数为 `update`

### update 函数

**`update`函数最核心的作用是更新 popper 的位置。**

```js
Popper.prototype.update = function() {
  var data = { instance: this, styles: {} };
  // store placement inside the data object, modifiers will be able to edit `placement` if needed
  // and refer to _originalPlacement to know the original value
  data.placement = this._options.placement;
  data._originalPlacement = this._options.placement;

  // compute the popper and reference offsets and put them inside data.offsets
  data.offsets = this._getOffsets(this._popper, this._reference, data.placement);
  // get boundaries
  data.boundaries = this._getBoundaries(data, this._options.boundariesPadding, this._options.boundariesElement);

  data = this.runModifiers(data, this._options.modifiers);
};
```

这里出现的 3 个函数都非常重要，关系到最终`popper`在哪里展示，我们依次来看。

#### `_getOffsets`

用于获取`popper`和`reference`的位置信息，最后放入`data.offsets`属性。这个位置信息可能在之后被`modifiers`进行一些调整，后面会说到。

```js
Popper.prototype._getOffsets = function(popper, reference, placement) {
  placement = placement.split('-')[0];
  var popperOffsets = {};

  popperOffsets.position = this.state.position;
  var isParentFixed = popperOffsets.position === 'fixed';

  //
  // Get reference element position
  //
  var referenceOffsets = getOffsetRectRelativeToCustomParent(reference, getOffsetParent(popper), isParentFixed);

  //
  // Get popper sizes
  //
  var popperRect = getOuterSizes(popper);

  //
  // Compute offsets of popper
  //

  // depending by the popper placement we have to compute its offsets slightly differently
  if (['right', 'left'].indexOf(placement) !== -1) {
    popperOffsets.top = referenceOffsets.top + referenceOffsets.height / 2 - popperRect.height / 2;
    if (placement === 'left') {
      popperOffsets.left = referenceOffsets.left - popperRect.width;
    } else {
      popperOffsets.left = referenceOffsets.right;
    }
  } else {
    popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
    if (placement === 'top') {
      popperOffsets.top = referenceOffsets.top - popperRect.height;
    } else {
      popperOffsets.top = referenceOffsets.bottom;
    }
  }

  // Add width and height to our offsets object
  popperOffsets.width = popperRect.width;
  popperOffsets.height = popperRect.height;

  return {
    popper: popperOffsets,
    reference: referenceOffsets,
  };
};
```

函数的大致逻辑是先计算出`reference`元素的位置及大小、`popper`的大小，然后根据`placement`来计算`popper`的位置。`placement`[可以有多种枚举值](https://popper.js.org/popper-documentation.html#Popper.placements).

`getOuterSizes`它用于计算一个元素带上`margin`的尺寸。**在目标元素`display:none`时运用了一点小技巧，具体是先将目标元素展示出来，然后通过获取某个位置属性强制浏览器重绘，在重绘后再计算尺寸信息**：

```js
function getOuterSizes(element) {
  // NOTE: 1 DOM access here
  var _display = element.style.display,
    _visibility = element.style.visibility;
  element.style.display = 'block';
  element.style.visibility = 'hidden';
  var calcWidthToForceRepaint = element.offsetWidth;

  // original method
  var styles = root.getComputedStyle(element);
  var x = parseFloat(styles.marginTop) + parseFloat(styles.marginBottom);
  var y = parseFloat(styles.marginLeft) + parseFloat(styles.marginRight);
  var result = { width: element.offsetWidth + y, height: element.offsetHeight + x };

  // reset element styles
  element.style.display = _display;
  element.style.visibility = _visibility;
  return result;
}
```

上面可以看出`referenceOffsets`的计算是最核心的步骤，我们仔细看看。

`getOffsetRectRelativeToCustomParent`用于根据一个元素以及它的某个父元素，计算相对于父元素的`offset`位置以及元素自身大小。

```js
function getOffsetRectRelativeToCustomParent(element, parent, fixed) {
  var elementRect = getBoundingClientRect(element);
  var parentRect = getBoundingClientRect(parent);

  if (fixed) {
    var scrollParent = getScrollParent(parent);
    parentRect.top += scrollParent.scrollTop;
    parentRect.bottom += scrollParent.scrollTop;
    parentRect.left += scrollParent.scrollLeft;
    parentRect.right += scrollParent.scrollLeft;
  }

  var rect = {
    top: elementRect.top - parentRect.top,
    left: elementRect.left - parentRect.left,
    bottom: elementRect.top - parentRect.top + elementRect.height,
    right: elementRect.left - parentRect.left + elementRect.width,
    width: elementRect.width,
    height: elementRect.height,
  };
  return rect;
}

function getBoundingClientRect(element) {
  var rect = element.getBoundingClientRect();

  // whether the IE version is lower than 11
  var isIE = navigator.userAgent.indexOf('MSIE') != -1;

  // fix ie document bounding top always 0 bug
  var rectTop = isIE && element.tagName === 'HTML' ? -element.scrollTop : rect.top;

  return {
    left: rect.left,
    top: rectTop,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.right - rect.left,
    height: rect.bottom - rectTop,
  };
}
```

利用[`getBoundingClientRect`](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/getBoundingClientRect)计算出两个元素相对于视口的位置和大小，然后进行简单的加减即可。`getScrollParent`用于找到滚动父级元素，也就是获取最近的`overflow`属性为`auto`或`scroll`的父节点，直到`body`或`document`，具体就不细说了。

可以看出来`getOffsetRectRelativeToCustomParent`计算的是相对位置，不会有什么问题。问题在于传递的`parent`参数，它的值是`getOffsetParent(popper)`，问题在哪里呢？

上面也说到`offsetParent`当元素的 `style.display` 设置为 `"none"` 时会返回 `null`，此时`getOffsetParent`函数的返回值是`document`，而我们的`popper`在未展示前始终是隐藏的。这就意味着：**我们计算的 referenceOffsets 和 popperOffsets 始终是相对于`document`的，而非设置的`boundariesElement`，这给后面 `popper` 的展示埋下了祸根。**

#### `_getBoundaries`

说完了`data.offset`的计算，接下来就是`_getBoundaries`，用于计算`boundariesElement`的位置及大小：

```js
Popper.prototype._getBoundaries = function(data, padding, boundariesElement) {
  // NOTE: 1 DOM access here
  var boundaries = {};
  var width, height;
  if (boundariesElement === 'window') {
    // 较为简单，略。。。
  } else if (boundariesElement === 'viewport') {
    // 略。。。
  } else {
    if (getOffsetParent(this._popper) === boundariesElement) {
      boundaries = {
        top: 0,
        left: 0,
        right: boundariesElement.clientWidth,
        bottom: boundariesElement.clientHeight,
      };
    } else {
      boundaries = getOffsetRect(boundariesElement);
    }
  }
  boundaries.left += padding;
  boundaries.right -= padding;
  boundaries.top = boundaries.top + padding;
  boundaries.bottom = boundaries.bottom - padding;
  return boundaries;
};
```

看得出来，`boundariesElement`可以有 3 种值： `window`、`viewport`和指定的`HTMLElement`，前两种情况我们省略留给大家自己去看。通过前面的描述，在指定`boundariesElement`时`getOffsetParent(this._popper) === boundariesElement`也不会成立，所以最终`boundaries`的值就是由`getOffsetRect`计算得来：

```js
function getOffsetRect(element) {
  var elementRect = {
    width: element.offsetWidth,
    height: element.offsetHeight,
    left: element.offsetLeft,
    top: element.offsetTop,
  };

  elementRect.right = elementRect.left + elementRect.width;
  elementRect.bottom = elementRect.top + elementRect.height;

  // position
  return elementRect;
}
```

`HTMLElement.offsetTop` 为只读属性，它返回当前元素相对于其 `offsetParent` 元素的顶部的距离，我们的`boundariesElement`通常并不是`display:none`的，也通常会有一个非`document`的`offsetParent`，**所以最终`data.boundaries`和`data.offset`的参考坐标是不一样的。**

最后`update`函数会调用`runModifiers`来运行各种`modifiers`函数.

#### `modifiers`

**内置的`modifier`主要作用是对`popper`位置进行微调，具体可以参考[官方文档](https://popper.js.org/popper-documentation.html#modifiers)**。

`options.modifiers`是有先后顺序的，数组前面的`modifier`会先执行，所以如果某个`modifier`有依赖项，依赖项就必须放到前面先执行。`applyStyle`这个特殊的`modifier`通常总是放在最后，因为它是用来绘制`popper`的。 **总体来说`modifiers`机制类似于`pipeline`。**

`runModifiers`很简单就是从前往后依次执行给定的`modifiers`：

```js
Popper.prototype.runModifiers = function(data, modifiers, ends) {
  var modifiersToRun = modifiers.slice();
  if (ends !== undefined) {
    modifiersToRun = this._options.modifiers.slice(0, getArrayKeyIndex(this._options.modifiers, ends));
  }

  modifiersToRun.forEach(
    function(modifier) {
      if (isFunction(modifier)) {
        data = modifier.call(this, data);
      }
    }.bind(this),
  );

  return data;
};
```

有一点需要注意的，我们可以在`options`传入自定的`modifier`函数，内置的`modifier`可以只传枚举字符串，例如

```js
this.popperOptions = {
  modifiers: [
    'keepTogether', // 内置modifier
    'arrow',
    'flip',
    this.myModifier, // 自定义modifier
    'applyStyle',
  ],
};

function myModifier(data) {
  console.log("this is myModifier");
  return data;
},
```

在构造函数中会将其转换为具体的函数：

```js
this._options.modifiers = this._options.modifiers.map(
  function(modifier) {
    // return predefined modifier identified by string or keep the custom one
    return this.modifiers[modifier] || modifier;
  }.bind(this),
);
```

`modifier`函数接收一个`data`对象参数，并在最后将`data`返回，中间可以对这个参数做任意处理,`data`是在`update`函数中进行初始化的。这里对几个内置`modifier`的原理做一个介绍，并解析其中一个的具体实现：

- `shift`： 根据形如`top-start`的`placement`调整`popper`位置与`reference`进行对齐，依赖`referenceOffset`
- `offset`: 根据传入的`options.offset`对`popper`位置`popperOffset`进行微调
- `preventOverflow`: 调整`popper`的位置使得其不超出`data.boundaries`
- `keepTogether`: 调整`popper`的位置使得其始终在`reference`旁边
- `arrow`: 用于显示`popper`的箭头，可能会对`popper`的位置进行调整，箭头元素的选择器是`options.arrowElement`。 最后放到`data`的属性有`data.offsets.arrow`和`data.arrowElement`
- `flip`: 当`popper`和`reference`的展示有重合时，将`popper`在相反反向重新展示，会重新设置`popperOffsets`和`data.placement`
- `applyStyle`: 绘制`popper`和`arrow`到页面上，会尝试使用`transform3d`进行`GPU`加速。 注意这里没有设置`popper`的`display`属性

我们看看`preventOverflow`的原理：

```js
Popper.prototype.modifiers.preventOverflow = function(data) {
  var order = this._options.preventOverflowOrder; // 默认['left', 'right', 'top', 'bottom']
  var popper = getPopperClientRect(data.offsets.popper); // 获取popper的尺寸和位置

  var check = {
    left: function() {
      // 计算popper的左边是否与reference重叠，如果有重叠，向右调整popper使得刚好不重叠
      var left = popper.left;
      if (popper.left < data.boundaries.left) {
        left = Math.max(popper.left, data.boundaries.left);
      }
      return { left: left };
    },
    right: function() {
      // 类似原理，略
    },
    top: function() {
      // 类似原理，略
    },
    bottom: function() {
      // 类似原理，略
    },
  };

  // 挨个方向进行调整
  order.forEach(function(direction) {
    data.offsets.popper = Object.assign(popper, check[direction]());
  });

  return data;
};
```

所有其他`modifier`的作用发挥都基于`reference`、`popper`和`boundariesElement`的位置和大小。

综上，`update`函数做了以下几件事：

- 获取`data`属性，并最终传递给每个`modifier`函数
- 获取`popper`和`reference`的位置信息，放入`data.offsets`属性
- 获取`boundariesElement`位置和尺寸，放入`data.boundaries`
- 依次运行每个`options.modifier`函数

## 为什么设置`boundariesElement`不行？

现在可以回答为什么指定`boundariesElement`不行了，从上面的分析可以看到：**`boundariesElement`和`reference`、`popper`的参考坐标是不一样的，前者是一个非`document`元素，后两个都是基于`document`，除非`boundariesElement`的`offsetParent`恰好就是`document`元素**，我们只能另辟蹊径了。

# 思路 4： `IntersectionObserver`

其实我们是想知道列表项何时隐藏在滚动区，当隐藏时再隐藏对应的`popover`。 当然可以监听滚动区的`scroll`事件然后判断每个列表项是否处于滚动区，`scroll`事件很容易出现性能问题，现在我们有一个更好的选择：[`IntersectionObserver`](https://developer.mozilla.org/zh-CN/docs/Web/API/IntersectionObserver/IntersectionObserver),它提供了一种可以异步监听目标元素与其祖先或视窗(viewport)交叉状态的手段。

> `IntersectionObserver`的实现，应该采用`requestIdleCallback()`，即只有线程空闲下来，才会执行观察器。这意味着，这个观察器的优先级非常低，只在其他任务执行完，浏览器有了空闲才会执行。

基于这个`api`，我们可以很容易的就能达到目标，只需用一种方式记录每个列表项对应的`popover`是哪个，这里我采用的是`data-set`，使用一个叫`data-index`的属性来记录。具体代码如下：

```html
<div class="hover-wrapper" ref="hoverWrapper">
  <vi-popover
    ref="popover"
    v-for="(item, index) in 100"
    :key="item"
    placement="right-start"
    trigger="hover"
    :content="`这是一段内容, index = ${index}`"
  >
    <vi-button :data-index="index" slot="reference" class="hover-ref">hover 激活</vi-button>
  </vi-popover>
</div>
```

```js
watchPopover() {
  const popoverList = this.$refs.popover;
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach((entry, index) => {
        const { isIntersecting, target } = entry;
        // isIntersecting表示是否出现在了root区域内
        if (!isIntersecting) {
          (popoverList[target.dataset.index] || {}).showPopper = false; // 隐藏popover
        }
      });
    },
    {
      root: this.$refs.hoverWrapper
    }
  );

  this.$el
    .querySelectorAll(".hover-ref")
    .forEach(ele => observer.observe(ele)); // 观察每一个列表项
},
```

最终效果如下：

![fix-using-intersectionobserver](/images/popperjs/fix-using-intersectionobserver.gif)

# 总结

本文针对`popover`组件在快速滚动列表项中的问题进行了优化，在解决问题的同时解析了`Popper.js`的源码，并在最后利用`IntersectionObserver`较好的解决了问题。
