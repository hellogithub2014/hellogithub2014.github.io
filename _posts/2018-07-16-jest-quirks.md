---
title: "vue结合jest踩坑记"
img: indonesia.jpg # Add image post (optional)
date: 2018-07-16 08:30:00 +0800
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [vue,jest]
---

# 目的

记录在往 vue+webpack 的项目中添加 jest 单元测试时遇到的坑。

# 安装

很简单，直接按照[jest 官网](https://github.com/facebook/jest)来即可：

```
yarn add --dev jest
```

然后在`package.json`添加一个`script`即可,如：

```
"utest": "jest"
```

之后按照官网上所述编写一个简单的测试文件就能跑起来了。本文剩下的篇幅都是记录在结合 Vue 时遇到的坑。

# 配置

在我们项目中都是使用 vue 的单文件系统，每个组件后缀名是`.vue`,同时也经常`import`各种`js`模块，还会有一些`json`文件。默认情况下`jest`对于一个没有后缀名的`import`语句无法解析的，如：

```js
import pageTitle from 'src/components/container/page-title'; // 导入一个vue组件
import brandMixin from '../../mixins/brandMixin'; // 导入一个ES6模块
```

需要进行一些配置。 同时还有一些其他的配置需要添加，例如配合`webpack alias`。

`jest`中的配置文件很简单，只要在项目根目录添加一个`jest.config.js`即可，目前我们项目中的配置如下：

```js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'vue'], // 解析模块时会尝试的后缀名
  transform: {
    '^.+\\.js$': '<rootDir>/node_modules/babel-jest', // 如何解析一个js文件
    '.*\\.(vue)$': '<rootDir>/node_modules/vue-jest',
  },
  // moduleNameMapper为了解决webpack alias
  moduleNameMapper: {
    '^(mixins|utils|locale|directives|locale)/(.*)$': '<rootDir>/bui/src-latest/$1/$2',
    '^conf$': '<rootDir>/conf',
    '^locale$': '<rootDir>/bui/src-latest/locale',
    '^(src-common|src|conf|tests|bui)/(.*)$': '<rootDir>/$1/$2',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
    '\\.(css|less|scss)$': 'identity-obj-proxy',
  },
  // Coverage相关： 测试覆盖率报告
  collectCoverage: true,
  collectCoverageFrom: ['**/*.{js,vue}', '!**/node_modules/**', '!**/bui/**'],
  coverageReporters: ['html', 'text-summary'],
  rootDir: '.',
  testRegex: './tests/unit/.*.test.js', // 测试文件范围
  testEnvironment: 'jest-environment-jsdom-global',
  testPathIgnorePatterns: ['/node_modules/', '/conf/test.js', '/bui/'], // 忽略文件
  modulePathIgnorePatterns: ['<rootDir>/coverage/'],
  snapshotSerializers: ['<rootDir>/node_modules/jest-serializer-vue'], // 测试快照
};
```

# vscode 调试

有时候测试失败不知道是因为业务代码有 bug 还是因为测试代码本身有 bug，此时调试功能就很有用，在 vscode 下可以通过一段配置即可支持调试,[参考 how-to-debug-jest-tests-with-vscode](https://medium.com/@mattmazzola/how-to-debug-jest-tests-with-vscode-48f003c7cb41)：

将下面代码放到项目`.vscode/launch.json`的`configurations`数组中：

```js
{
      "type": "node",
      "request": "launch",
      "name": "Jest Tests",
      "program": "${workspaceRoot}/node_modules/jest/bin/jest",
      "args": ["-i"],
      // "preLaunchTask": "build",
      "internalConsoleOptions": "openOnSessionStart",
      "outFiles": ["${workspaceRoot}/dist/**/*"]
      // "envFile": "${workspaceRoot}/.env"
}
```

![]({{site.url}}/assets/img/jest-quirks/vscode-debug-config.png)

之后就可以打断点调试了：

![]({{site.url}}/assets/img/jest-quirks/vscode-debug.png)

# jest wacth 问题

默认情况下`npm run utest`跑完测试就会结束，下一次需要重新运行命令再跑，很麻烦。 `jest`提供了`watch`选项，可以每次在改动了测试代码后自动重跑测试：

```
npm run utest -- --watch
```

不过遇到奇怪的问题，总是会卡在`Determining test suites to run…`,除非强行退出：

![]({{site.url}}/assets/img/jest-quirks/jest-wacth-bug.png)

暂时使用了另一个`watchAll`选项规避了，`npm run utest -- --watchAll`, 也可以 之后有空再研究怎么解决吧。。

# element-ui

项目中使用了一些`element-ui`的组件，在带有这些子组件的组件时，会报错子组件找不到，网上的解决方案时使用 localVue 来安装`element-ui`：

```js
localVue = createLocalVue();
localVue.use(elementUI);

const wrapper = shallowMount(compToTest, {
  localVue,
});
```

不过在尝试时发现报了另一个错：

![]({{site.url}}/assets/img/jest-quirks/element-ui-setup-bug.png)

看起来是解析 css 时出错，解决方案是添加[jest 官网给的一段配置](https://github.com/facebook/jest/blob/master/docs/Webpack.md)到`jest.config.js`中：

```js
// for CSS Modules
"moduleNameMapper": {
      "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
        "<rootDir>/__mocks__/fileMock.js",
      "\\.(css|less)$": "identity-obj-proxy"
    }
```

# bui 组件库问题

项目中使用了内部的`bui`组件库，它不是通过`npm`安装的，而是直接外链`script`引入，这会导致在测试使用了`bui`组件的 vue 文件时，提示`bui`组件找不到：

![]({{site.url}}/assets/img/jest-quirks/bui-comp-not-found.png)

一开始的思路是跟`element-ui`一样解决，不过发现`bui`的`install`过程是在引入外链时自动执行了：

**bui/src-latest/index.js**

```js
function install(Vue) {
  components.map(function(component) {
    try {
      component.install(Vue);
    } catch (e) {
      return;
    }
  });
  Vue.prototype.$message = Message;

  window.BUI = require('./utils/utils');
  BUI.lang = locale.use;
}

if (typeof window !== 'undefined' && window.Vue) {
  install(window.Vue);
}
```

解决办法是利用`vue-test-util`的`stub`

## vue-test-util

这是一个帮助我们更快编写测试代码的库，提供了很多便利方法，具体参见[官方文档](https://vue-test-utils.vuejs.org/)。

在实例化组件时，对于组件内部的子组件，如果不想导入它们可以利用`stub`选项。它类似于 mock 一个子组件，可以给它提供一个很简单的实现即可。

例如对于我们的某个 bui 组件`byted-progresss`,可以直接利用一个空的`<div />`:

```js
wrapper = shallowMount(comp, {
  localVue,
  stubs: {
    'byted-progresss': '<div />',
  },
});
```

其他类似，此时再跑单元测试的话应该就没问题了。

如果不想用空的`div`代替，可以手动`import`每个`bui`组件，然后 stub 它们：

```js
import Button from 'bui/src-latest/components/button';

wrapper = shallowMount(comp, {
  localVue,
  stubs: {
    'byted-button': Button,
  },
});
```

不过这种方式仍然对于某些 bui 组件会失败，因为那些组件内部使用了`Vue`对象，默认是在`window`对象上，而在单元测试的 node 环境中没有这个对象。尝试显式使用`gblobal.Vue = localeVue`也没有完全解决。

# snapshot

snapshot 是`jest`一项很有用的功能，用来查看在运行某项测试时的 UI 结构快照，这样可能帮助我们找到测试失败的原因，具体参照[官网教程](https://jestjs.io/docs/en/snapshot-testing)

每个 snapshot 创建完之后，会在`__snapshot__`文件夹中生成一个文件。

例如我写了一个测试：

```js
it('has the expected html structure', () => {
  expect(feedHelperVm.$el).toMatchSnapshot();
});
```

跑完这个生成的文件如下：

![]({{site.url}}/assets/img/jest-quirks/snapshot.png)

# CI

如果直接利用了`bui`组件的定义来 stub，在集成单元测试到`gitlab ci`上时会出问题，因为无法在 ci 机器上安装 bui，bui 没有提供`https`的下载链接：

![]({{site.url}}/assets/img/jest-quirks/ci-fail.png)

目前的解决方案是自己写一个很简单的组件来`stub`。最后贴一下 ci 的配置，在项目根目录的`.gitlab-ci.yml`中：

```yml
 image: node:8.6

cache:
  untracked: true
  key: "$CI_BUILD_REF_NAME"
  paths:
    - node_modules/

# 定义 stages
stages:
  - lint test
  - unit test
# 定义 job

# eslint
lint test:
  stage: lint test
  script:
    - echo "Lint test start"
    - yarn -v || (npm i -g yarn && chmod +x /usr/local/lib/node_modules/yarn/bin/yarn.js)
    - yarn install
    - npm run lint
    - echo "Lint test success"
# 单元测试
unit test:
  stage: unit test
  script:
    - echo "unit test start"
    - npm run utest
    - echo "unit test success"
```

# 其他

对于如何写单元测试，自己也才刚刚开始，不过参考了两个文档：

- [wiki](https://wiki.bytedance.net/pages/viewpage.action?pageId=197056539)
- [https://alexjoverm.github.io/2017/08/21/Write-the-first-Vue-js-Component-Unit-Test-in-Jest/](https://alexjoverm.github.io/2017/08/21/Write-the-first-Vue-js-Component-Unit-Test-in-Jest/)

# 参考文档

- [https://github.com/facebook/jest](https://github.com/facebook/jest)
- [https://github.com/facebook/jest/blob/master/docs/Webpack.md](https://github.com/facebook/jest/blob/master/docs/Webpack.md)
- [wiki](https://wiki.bytedance.net/pages/viewpage.action?pageId=197056539)
- [https://medium.com/@mattmazzola/how-to-debug-jest-tests-with-vscode-48f003c7cb41](https://medium.com/@mattmazzola/how-to-debug-jest-tests-with-vscode-48f003c7cb41)
- [https://vue-test-utils.vuejs.org](https://vue-test-utils.vuejs.org)
- [https://jestjs.io/docs/en/jest-object](https://jestjs.io/docs/en/jest-object#jestfnimplementation)
- [https://alexjoverm.github.io/2017/08/21/Write-the-first-Vue-js-Component-Unit-Test-in-Jest/](https://alexjoverm.github.io/2017/08/21/Write-the-first-Vue-js-Component-Unit-Test-in-Jest/)
