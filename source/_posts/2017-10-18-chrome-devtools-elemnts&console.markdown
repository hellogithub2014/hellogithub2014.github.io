---
title: "Chrome开发者工具之elements&console面板使用总结"
summary_img: /images/malaysia.jpg # Add image post (optional)
date: 2017-10-18 22:00:00

tag: [CACHE,HTTP]
---


作为前端开发者，谷歌浏览器的开发者工具是每天都要用的。以前在公众号上也会偶尔看到相关的文章，不过都是别人消化过的知识了，倒不如自己去官网系统的学习一遍，这样以后碰到类似的文章就心中有数了😆

# 设备模式
## 切换 Device Mode

切换 Device Mode 按钮可以打开或关闭 Device Mode。
![](/images/chrome-devtools/10-18/device-mode-initial-view.png)

当 Device Mode 打开时，该图标呈蓝色
<img src="images/chrome-devtools/10-18/device-mode-on.png" style="height:70px;width:70px;">。当 Device Mode 关闭时，该图标呈灰色<img src="images/chrome-devtools/10-18/device-mode-off.png" style="height:70px;width:70px;">。
## 使用视口控件

![](/images/chrome-devtools/10-18/device-mode.png)
包括以下两个模式：

1. 自适应。使视口可以通过任意一侧的大手柄随意调整大小。

2. 特定设备。将视口锁定为特定设备确切的视口大小，并模拟特定设备特性。

### 自适应

可以用来调整视口大小以**创建完全自适应设计**，这种设计可以适应未知和未来的设备类型。在视口上拖动调整大小的大手柄，或者点击菜单栏中的值进行精确调整。

### 特定设备
#### 内置设备预设

![](/images/chrome-devtools/10-18/select-device.png)

#### 添加自定义设备预设

1.	转至 DevTools 的 Settings 面板。

2.	点击 Devices 标签。

3.	点击 Add custom device。

4.	输入设备名称、宽度、高度、设备像素比和 User Agent 字符串。

5.	点击 save。

![](/images/chrome-devtools/屏幕快照 2017-08-19 20.40.59.png)

#### 设备状态和方向

主要用于在横向和纵向屏幕方向之间切换
![](/images/chrome-devtools/10-18/change-orientation.png)

####  缩放到合适大小

![](/images/chrome-devtools/10-18/zoom-to-fit.png)

#### 可选控件
点击设备工具栏右侧上的三个小圆点，可以更改或启用可选控件。当前选项包括：

*	User Agent 类型（模拟 UA 和触摸事件）

*	设备像素比

*	媒体查询

*	标尺

*	配置网络（UA、网络节流）

![](/images/chrome-devtools/10-18/device-mode-dotmenu.png)

这些工具的具体使用方法参见[测试自适应和设备特定的视口](https://developers.google.com/web/tools/chrome-devtools/device-mode/emulate-mobile-viewports)

# 元素面板

Chrome DevTools 的 Elements 面板中的 DOM 树视图可以显示当前网页的 DOM 结构。通过 DOM 更新实时修改页面的内容和结构。还可以检查和实时编辑页面的 HTML 与 CSS。

## 编辑样式

### 实时编辑样式

在 Styles 窗格中实时编辑样式属性名称和值。所有样式均可修改，除了灰色部分（与 User Agent 样式表一样）。
要编辑名称或值，请点击它，进行更改，然后按 Tab 或 Enter 保存更改。
![](/images/chrome-devtools/10-18/edit-property-name.png)

styles窗格更详细使用请阅读[编辑样式](https://developers.google.com/web/tools/chrome-devtools/inspect-styles/edit-styles)

### 检查和编辑框模型参数

使用 Computed 窗格检查和编辑当前元素的框模型参数。 框模型中的所有值均可修改，只需点击它们即可。
![](/images/chrome-devtools/10-18/computed-pane.png)

## 编辑DOM
### 检查元素

1. 右键点击页面上的任何元素并选择 Inspect。
    ![](/images/chrome-devtools/10-18/right-click-inspect.png)

2. 打开控制台，然后按 `Ctrl + Shift + C (Windows)` 或 `Cmd + Shift + C (Mac)`，然后将鼠标悬停到某个元素上。 DevTools 会在 Elements 面板中自动突出显示您悬停的元素。点击元素可以退出检查模式，同时保持元素在 Elements 面板中处于突出显示状态。
    ![](/images/chrome-devtools/屏幕快照 2017-08-19 19.29.56.png)

3. 点击 Inspect Element 按钮<img src="images/chrome-devtools/10-18/inspect-icon.png" style="height:70px;width:70px;"> 转到 Inspect Element 模式，然后点击元素。

4. 在控制台中使用 inspect 方法，例如 inspect(document.body)。

### 实时编辑 DOM 节点

要实时编辑 DOM 节点，只需双击选定元素，然后进行更改。
![](/images/chrome-devtools/实时编辑dom结构.png)

### 以 HTML 形式编辑 DOM 节点及其子级

1. 在DOM节点上右键，或者点击最左边的`more actions` 菜单（3个小点）,然后选择 Edit as HTML。

2. 随意编辑

3. 按 Ctrl+Enter (Windows / Linux) 或 Cmd+Enter (Mac) 保存更改。

4. 按 Esc 可以退出编辑器而不保存。

![](/images/chrome-devtools/10-18/edit-as-html.png)

### 移动 DOM 节点

点击、按住并拖动节点可将其移动。

### 设置 DOM 断点

设置 DOM 断点以调试复杂的 JavaScript 应用。例如，如果 JavaScript 正在更改 DOM 元素的样式，将 DOM 断点设置为在元素属性修改时触发。在发生以下一种 DOM 更改时触发断点：子树更改、属性更改、节点移除。
![](/images/chrome-devtools/屏幕快照 2017-08-19 19.44.20.png)

#### 子树修改

**添加、移除或移动子元素**时将触发子树修改断点。例如，如果在 main-content 元素上设置子树修改，以下代码将触发断点：

```js
var element = document.getElementById('main-content');
//modify the element's subtree.
var mySpan = document.createElement('span');
element.appendChild( mySpan );
```

![](/images/chrome-devtools/屏幕快照 2017-08-19 19.49.04.png)

#### 属性修改

**动态更改元素的属性** (class, id, name) 时将发生属性修改：

```js
var element = document.getElementById('main-content');
// class attribute of element has been modified.
element.className = 'active';
```

![](/images/chrome-devtools/屏幕快照 2017-08-19 19.50.40.png)

#### 节点移除

从 DOM 中**移除节点**时将触发节点移除修改：

```js
document.getElementById('main-content').remove();
```

![](/images/chrome-devtools/屏幕快照 2017-08-19 19.52.04.png)

### 与 DOM 断点交互

Elements 和 Sources 面板均包含一个用于管理 DOM 断点的窗格。每个断点都会列出元素标识符和断点类型。

![](/images/chrome-devtools/屏幕快照 2017-08-19 19.56.14.png)

![](/images/chrome-devtools/屏幕快照 2017-08-19 19.56.34.png)

可通过以下方式之一与列出的每一个断点交互：

* 悬停在元素标识符上可以显示元素在页面上的相应位置（类似于在 Elements 面板中悬停在节点上）。

* 点击元素可以将其在 Elements 面板中选中。

* 切换复选框可以启用或停用断点。

### 查看元素事件侦听器

在 Event Listeners 窗格中查看与 DOM 节点关联的 JavaScript 事件侦听器。

![](/images/chrome-devtools/屏幕快照 2017-08-19 20.04.23.png)

右键点击`handler`，并选择 `Show Function Definition` 可以查看函数的定义位置。另外：如果启用 `Ancestors` 复选框，除了当前选定节点的事件侦听器外，还会显示其祖先实体的事件侦听器。如果停用复选框，将仅显示当前选定节点的事件侦听器。

# 控制台面板
## 打开console面板

1. 直接点击console面板。。。

2. 任何其他面板旁的抽屉式导航栏的形式

    ![](/images/chrome-devtools/屏幕快照 2017-08-19 20.14.19.png)

3. 任何其他面板中，按ESC键

## 消息堆叠

如果一条消息连续重复，而不是在新行上输出每一个消息实例，控制台将“堆叠”消息并在左侧外边距显示一个数字。此数字表示该消息已重复的次数。

![](/images/chrome-devtools/10-18/message-stacking.png)

如果倾向于为每一个日志使用一个独特的行条目，在 DevTools 设置中启用 Show timestamps。

![](/images/chrome-devtools/屏幕快照 2017-08-19 20.17.56.png)

由于每一条消息的时间戳均不同，因此，每一条消息都将显示在各自的行上。

![](/images/chrome-devtools/10-18/timestamped-console.png)

## 处理控制台历史记录
### 清除历史记录

可以通过以下方式清除控制台历史记录：

* 在控制台中点击右键，然后按 Clear console。

* 在控制台中键入 clear()。

* 从的 JavaScript 代码内调用 console.clear()。

* 按 Ctrl+L （Mac、Windows、Linux）。

* 点击面板左上角的按钮![](/images/chrome-devtools/屏幕快照 2017-08-19 20.21.36.png)

### 保留历史记录

启用控制台顶部的 `Preserve log` 复选框可以在页面刷新或更改之间保留控制台历史记录。 消息将一直存储，直至清除控制台或者关闭标签。

### 保存历史记录

在控制台中点击右键，然后选择 `Save as`，将控制台的输出保存到日志文件中。

![](/images/chrome-devtools/屏幕快照 2017-08-19 20.24.19.png)

## 过滤控制台输出

可以按严重性等级过滤控制台输出。

![](/images/chrome-devtools/屏幕快照 2017-08-19 20.31.21.png)

## console api
### 诊断并记录到控制台中

*	使用 console.log() 进行基本记录

*	使用 console.error() 和 console.warn() 显示引入注目的消息

*	使用 console.group() 和 console.groupEnd() 对相关消息进行分组，避免混乱

*	使用 console.assert() 显示条件性错误消息

#### 写入控制台

使用`console.log()` 方法可以向控制台进行任何基本记录。此方法采用一个或多个表达式作为参数，并将其当前值写入控制台，从而将多个参数级联到一个由空格分隔的行中。

```js
console.log("Node count:", 3, "and the current time is:", Date.now());
// output
Node count: 3 and the current time is: 1503235350740
```

#### 组织控制台输出

1. 将消息组织到一起
您可以使用组命令将相关输出组织到一起。`console.group()` 命令采用一个字符串参数设置组名称。在您的 JavaScript 中调用此命令后，控制台会开始将所有后续输出都组织到一起。要结束分组，您只需要在完成后调用 `console.groupEnd()`。

    ```js
    var user = "jsmith", authenticated = false;
    console.group("Authentication phase");
    console.log("Authenticating user '%s'", user);
    // authentication code here...
    if (!authenticated) {
        console.log("User '%s' not authenticated.", user)
    }
    console.groupEnd();
    ```

    ![](/images/chrome-devtools/屏幕快照 2017-08-20 21.26.23.png)

2. 嵌套组
日志组也可以彼此嵌套。同时以小片段查看较大的组时，嵌套组非常有用。

    ```js
    var user = "jsmith", authenticated = true, authorized = true;
    // Top-level group
    console.group("Authenticating user '%s'", user);
    if (authenticated) {
        console.log("User '%s' was authenticated", user);
        // Start nested group
        console.group("Authorizing user '%s'", user);
        if (authorized) {
            console.log("User '%s' was authorized.", user);
        }
        // End nested group
        console.groupEnd();
    }
    // End top-level group
    console.groupEnd();
    console.log("A group-less log trace.");
    ```

    ![](/images/chrome-devtools/屏幕快照 2017-08-20 21.27.35.png)

3. 自动折叠组:
大量使用组时，即时查看所有信息可能不是非常有用。这些情况下，您可以通过调用 `console.groupCollapsed()` 而不是 `console.group()` 的方式自动折叠组：

    ```js
    var user = "jsmith", authenticated = false;
    console.groupCollapsed("Authentication phase");
    console.log("Authenticating user '%s'", user);
    // authentication code here...
    if (!authenticated) {
        console.log("User '%s' not authenticated.", user)
    }
    console.groupEnd();
    console.log('other info.....')
    ```

    ![](/images/chrome-devtools/屏幕快照 2017-08-20 21.31.15.png)

#### 错误和警告

错误和警告的作用与正常日志的作用相同。唯一的区别是 `error()` 和 `warn()` 的样式引人注目。

1. `console.error()`方法会显示红色图标和红色消息文本：

    ```js
    function connectToServer() {
        console.error("Error: %s (%i)", "Server is  not responding",500);
    }
    connectToServer();
    ```

    ![](/images/chrome-devtools/屏幕快照 2017-08-20 21.34.09.png)

2. `console.warn()` 方法会显示一个黄色警告图标和相应的消息文本：

    ```js
    var a={};
    a.childNodes=[1,2];
    if(a.childNodes.length < 3 ) {
        console.warn('Warning! Too few nodes (%d)', a.childNodes.length);
    }
    ```

    ![](/images/chrome-devtools/屏幕快照 2017-08-20 21.35.39.png)

#### 断言

`console.assert()` 方法可以仅在其第一个参数为 false 时有条件地显示错误字符串（其第二个参数）。

![](/images/chrome-devtools/屏幕快照 2017-08-20 21.37.38.png)

#### 字符串替代和格式设置

传递到任何记录方法的第一个参数可能包含一个或多个格式说明符。格式说明符由一个 `%` 符号与后面紧跟的一个字母组成，字母指示应用到值的格式。字符串后面的参数会按顺序应用到占位符。

![](/images/chrome-devtools/屏幕快照 2017-08-20 21.39.22.png)

![](/images/chrome-devtools/屏幕快照 2017-08-20 21.43.40.png)

完整的格式说明符参见[诊断病假记录到控制台中](https://developers.google.com/web/tools/chrome-devtools/console/console-write)

### 比较类似的数据对象

使用 `table()` 方法，您可以轻松地查看包含类似数据的对象和数组。调用时，此方法将提取对象的属性并创建一个标头。行数据则来自每个索引的属性值。

#### 记录对象数组

在最基本的形式中，只需要一个由具有相同属性的多个对象组成的数组，`table()` 命令将执行剩余操作：

```js
console.table([{a:1, b:2, c:3}, {a:"foo", b:false, c:undefined}]);
console.table([[1,2,3], [2,3,4]]);
```

![](/images/chrome-devtools/屏幕快照 2017-08-20 21.47.42.png)

#### 记录特定的属性

可以使用 table() 的第二个参数记录更多高级对象。定义一个包含您希望显示的属性字符串的数组

```js
function Person(firstName, lastName, age) {
  this.firstName = firstName;
  this.lastName = lastName;
  this.age = age;
}

var family = {};
family.mother = new Person("Susan", "Doyle", 32);
family.father = new Person("John", "Doyle", 33);
family.daughter = new Person("Lily", "Doyle", 5);
family.son = new Person("Mike", "Doyle", 8);

console.table(family, ["firstName", "lastName", "age"]);
```

![](/images/chrome-devtools/屏幕快照 2017-08-20 21.50.22.png)

### 测量执行时间和对执行进行计数

*	使用 console.time() 和 console.timeEnd() 跟踪代码执行点之间经过的时间。

*	使用 console.count() 对相同字符串传递到函数的次数进行计数。

#### 测量执行时间

`time()` 方法可以启动一个新计时器，并且对测量某个事项花费的时间非常有用。将一个字符串传递到方法，以便为标记命名。
如果您想要停止计时器，请调用 `timeEnd()` 并向其传递已传递到初始值设定项的相同字符串。
控制台随后会在 `timeEnd()` 方法触发时记录标签和经过的时间。

```js
//测量 100 万个新 Array 的初始化：
console.time("Array initialize");
var array= new Array(1000000);
for (var i = array.length - 1; i >= 0; i--) {
    array[i] = new Object();
};
console.timeEnd("Array initialize");
```

![](/images/chrome-devtools/屏幕快照 2017-08-20 21.55.22.png)

#### 对语句执行进行计数

使用 `count()` 方法记录提供的字符串，以及相同字符串已被提供的次数。当完全相同的语句被提供给同一行上的 `count()` 时，此数字将增大。

```js
function login(user) {
    console.count("Login called for user " + user);
}

users = [ // by last name since we have too many Pauls.
    'Irish',
    'Bakaus',
    'Kinlan'
];

users.forEach(function(element, index, array) {
    login(element);
});

login(users[0]);
```

![](/images/chrome-devtools/屏幕快照 2017-08-20 21.59.15.png)

### 表达式求值

*	只需键入表达式即可对其进行求值。

*	使用一个快捷键选择元素。

*	使用 inspect() 检查 DOM 元素和 JavaScript 堆对象。

*	使用 $0 - 4 访问最近选择的元素和对象。

####  查看表达式

如果有多个匹配项，`↑` 和 `↓` 在它们之间循环切换。 按 `→` 键可选择当前建议。如果有一个建议，按 `Tab`键选中它。

####  选择元素

| 快捷键 | 说明                                                                                |
| ------ | ----------------------------------------------------------------------------------- |
| `$()`  | 返回与指定 CSS 选择器匹配的第一个元素。 `document.querySelector()` 的快捷键。       |
| `$$()` | 返回一个与指定 CSS 选择器匹配的所有元素数组。等同于 `document.querySelectorAll()`。 |
| `$x()` | 返回一个与指定 `XPath` 匹配的元素数组。                                             |

![](/images/chrome-devtools/屏幕快照 2017-08-20 22.08.47.png)

###  其他console api

1. `console.dir(object)`
输出以 JavaScript 形式表示的指定对象。如果正在记录的对象是 HTML 元素，将输出其以 DOM 形式表示的属性，如下所示：

    ![](/images/chrome-devtools/屏幕快照 2017-08-20 22.22.17.png)

2. `console.clear()` 清理控制台

3. `console.debug(object [, object, ...])` 与 console.log() 作用相同。

4. `console.info(object [, object, ...])` 与 console.log() 作用相同。

5. 完整api reference参考[Console API 参考](https://developers.google.com/web/tools/chrome-devtools/console/console-reference#clear)  以及 [Command API 参考](https://developers.google.com/web/tools/chrome-devtools/console/command-line-reference)
