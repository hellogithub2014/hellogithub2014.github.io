---
title: "Angular变更检测学习笔记"
img: canyon.jpg # Add image post (optional)
date: 2017-12-17 11:10:00 +0800
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [ANGULAR]
---


参考
* [ANGULAR CHANGE DETECTION EXPLAINED](https://blog.thoughtram.io/angular/2016/02/22/angular-2-change-detection-explained.html#observables)

* [Change Detection Reinvented Victor Savkin](https://www.youtube.com/watch?v=jvKGQSFQf10)

## 什么时候会触发变更检测？

主要有3类异步操作会触发变更检测

1. **Events** - click, submit, …
2. **XHR** - Fetching data from a remote server
3. **Timers** - setTimeout(), setInterval()

## 谁来触发

Angular使用一个自己的**`NgZone`**来监听上述异步操作，每次当一个异步操作结束后，`NgZone`就会发出一个**`onTurnDone`**事件流。

然后在一个叫**`ApplicationRef`**的类中，会订阅这个事件流，最后运行所有的变更检测器。

```js
// very simplified version of actual source
class ApplicationRef {

  changeDetectorRefs:ChangeDetectorRef[] = [];

  constructor(private zone: NgZone) {
    this.zone.onTurnDone
      .subscribe(() => this.zone.run(() => this.tick());
  }

  tick() {
    this.changeDetectorRefs
      .forEach((ref) => ref.detectChanges());
  }
}
```

## 变更检测

每个组件都有自己的变更检测器，所有的变更检测器会组成一棵树，以根组件的检测器作为根。这棵树其实与组件树一一对应。

![](https://blog.thoughtram.io/images/cd-tree-2.svg)

默认情况下，每次变更检测，都会从根节点开始，**自顶向下的检测所有的变更检测器**。

![](https://blog.thoughtram.io/images/cd-tree-7.svg)

即使是整棵树都要检测，但这个过程还是很快的，主要是因为Angular会生成对引擎友好的代码，可以大大提升执行速度。

>Angular creates change detector classes at runtime for each component, which are monomorphic, because they know exactly what the shape of the component’s model is. VMs can perfectly optimize this code, which makes it very fast to execute. The good thing is that we don’t have to care about that too much, because Angular does it automatically.

## 可变性

考虑以下代码：

```js
@Component({
  template: '<v-card [vData]="vData"></v-card>'
})
class VCardApp {

  constructor() {
    this.vData = {
      name: 'Christoph Burgdorf',
      email: 'christoph@thoughtram.io'
    }
  }

  changeData() {
    this.vData.name = 'Pascal Precht';
  }
}
```

```js
@Component( {
  selector: 'v-card',
  template: `
					<p>name:{{vData?.name}}</p>
					<p>email:{{vData?.email}}</p>
				`
} )
export class VCardComponent implements OnInit {
  @Input() vData: any;
  constructor () { }

  ngOnInit () {
  }

}

```

假设App中使用某个异步操作可以运行`changeData`方法，然后改变了`vData.name`，此时Angular变更检测开始工作。

在检测到`v-card`组件时，会先检测输入属性`vData`是否还是指向之前的引用，发现没有变化。**但是因为它的name属性发生了变化，此组件的变更检测器还是会完整的运行一遍,最终页面上展示的name会变成Pascal Precht。**

**发生上述情况的原因是vData是一个可变对象，所以Angular不得不保守的运行对应的变更检测，因为单单判断引用是否变化不能得知其内部的属性值是否有变化。**

## 不可变对象

例如`immutabale.js`之类的库实现了不可变对象，每次尝试更换不可变对象的属性，都不会改变原有对象，而是返回一个新的对象引用。

在Angular中，结合不可变对象和特定的变更检测策略，可以大大减少变更检测涉及的范围。以`v-card`为例：

```js
@Component({
  template: `
    <h2>{{vData.name}}</h2>
    <span>{{vData.email}}</span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
class VCardCmp {
  @Input() vData;
}
```

注意上面的**`ChangeDetectionStrategy.OnPush`**，此时Angular可以放心大胆的说：如果vData的引用没有变化，那么以`v-card`为根的所有子树，包括`v-card`自身，都可以跳过变更检测。

![](https://blog.thoughtram.io/images/cd-tree-8.svg)

## Observables

因为`Observable`表示一个流，它们自身的引用通常是不会变化的，每次有新值，都会在流上体现。当`Observable`作为某个组件的`@Input`时，同时组件使用了**`OnPush`**检测策略，可以想象通常默认情况下它们是不会触发变更检测的。如：

```js
@Component({
  template: '{{counter}}',
  changeDetection: ChangeDetectionStrategy.OnPush
})
class CartBadgeCmp {

  @Input() addItemStream:Observable<any>;
  counter = 0;

  ngOnInit() {
    this.addItemStream.subscribe(() => {
      this.counter++; // application state changed
    })
  }
}
```

为了解决上述情况，可以注入`ChangeDetectorRef`，然后调用它的`markForCheck`方法，**它会将根组件到当前组件的那条路径标记为在变更检测时需要进行检测。**

```js
constructor(private cd: ChangeDetectorRef) {}

ngOnInit() {
    this.addItemStream.subscribe(() => {
      this.counter++; // application state changed
      this.cd.markForCheck(); // marks path
    })
  }
}
```

在进行变更检测时：

![](https://blog.thoughtram.io/images/cd-tree-13.svg)

## NgZone in Angular

参考[ZONES IN ANGULAR](https://blog.thoughtram.io/angular/2016/02/01/zones-in-angular-2.html)

>NgZone is basically a forked zone that extends its API and adds some additional functionality to its execution context. One of the things it adds to the API is the following set of custom events we can subscribe to, as they are observable streams:

* 	**onTurnStart()** - Notifies subscribers just before Angular’s event turn starts. Emits an event once per browser task that is handled by Angular.

* 	**onTurnDone()** - Notifies subscribers immediately after Angular’s zone is done processing the current turn and any micro tasks scheduled from that turn.

*	**onEventDone()** - Notifies subscribers immediately after the final onTurnDone() callback before ending VM event. Useful for testing to validate application state.

### zone

参考[UNDERSTANDING ZONES](https://blog.thoughtram.io/angular/2016/01/22/understanding-zones.html#table-of-contents)

**zones are are basically an execution context for asynchronous operations。**

Zones can perform an operation - such as starting or stopping a timer, or saving a stack trace - each time that code enters or exits a zone. They can override methods within our code, or even associate data with individual zones.
#### Creating, forking and extending Zones

需要使用`zone.js`，之后我们就能拿到一个全局的`zone`对象，它有一个`run`方法，参数是一个函数，可以让这个函数运行在一个独立的`zone`当中。

```js
function main() {
  foo();
  setTimeout(doSomething, 2000);
  bar();
  baz();
}

zone.run(main);
```

此时`main`方法就在一个独立的上下文中运行了。我们还可以在函数进行或退出`zone`的各个时间点加上钩子来监控运行情况。

安装钩子首先需要`fork`当前已有的`zone`，它会返回一个继承它的子`zone`：

```js
var myZone = zone.fork();
myZone.run(main);
```

所有的钩子都可以放在一个用于`fork`方法参数的`ZoneSpecification`对象中，可选的钩子有：

* **onZoneCreated** - Runs when zone is forked
* **beforeTask** - Runs before a function called with zone.run is executed
* **afterTask** - Runs after a function in the zone runs
* **onError** - Runs when a function passed to zone.run will throw

一个示范：

```js
var myZoneSpec = {
  beforeTask: function () {
    console.log('Before task');
  },
  afterTask: function () {
    console.log('After task');
  }
};

var myZone = zone.fork(myZoneSpec);
myZone.run(main);
```

#### Monkey-patched Hooks

As soon as we embed `zone.js` in our site, pretty much all methods that cause asynchronous operations are monkey-patched to run in a new zone.

For example, when we call `setTimeout()` we actually call `Zone.setTimeout()`, which in turn creates a new zone using `zone.fork()` in which the given handler is executed. And that’s why our hooks are executed as well, because the forked zone in which the handler will be executed, simply inherits from the parent zone.

There are some other methods that `zone.js` overrides by default and provides us as hooks:

* `Zone.setInterval()`
* `Zone.alert()`
* `Zone.prompt()`
* `Zone.requestAnimationFrame()`
* `Zone.addEventListener()`
* `Zone.removeEventListener()`
