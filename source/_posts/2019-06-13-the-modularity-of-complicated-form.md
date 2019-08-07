---
title: 复杂表单的模块化处理
date: 2019-06-13 15:54:37
summary_img: /images/bora-bora.jpg
tags: [js, architecture]
---

工作中或多或少都会遇到一些很复杂的表单，通常的特点是每个表单项自身都有一大坨逻辑，好几百行代码。如果将所有表单项都放到一个文件里，那么没人能看得懂它，维护起来是一个噩梦。为了解决这个问题，小组内之前做过一些封装和拆分：

* 将每个表单项封装成独立组件
* 在业务上将表单项分类，功能内聚的一组表单项放到一个`form group`下，这样整个表单被拆分为多个`form group`，同时每个`form group`也封装成组件：

![simple-modularity](/images/modulaized-form/simple-modularity.jpg)

* `form`汇集下属所有`form group`的互操作和业务逻辑，同时`form group`汇集下属所有`form item`的互操作和业务逻辑。例如收集表单提交时的接口数据，表单项显隐的控制
* 统一数据流管理，放到`vuex`中，但不够彻底，组件内部仍然有维护小部分数据

上面这样做在表单复杂度不是那么高时可以很好应对，但随着业务越来越复杂，遇到了新的问题：

* `form`和`form group`由于需要汇集下属所有组件的互操作和业务逻辑，导致组件变的非常大，代码可以很轻易的增长到上千行
* 每个表单项的逻辑散落在多处，难以整理出其具体是怎么工作的
* 维护困难，虽然可能单独一个表单项的逻辑只有几百行，但是混杂在了父组件上千行的代码中，轻易不敢乱动

# 思路

仔细思考了困境，发现其实`form`和`form group`并不需要维护具体的业务逻辑，它们应当只是做一些简单的汇总工作。如果将业务逻辑全部内聚到单独的表单项，那么维护起来将会非常方便。表单项的核心逻辑有：

* 为了能够工作，需要从完整的`form data`中获取哪些数据
* 当表单提交时，自身需要贡献哪些数据到`form data`
* 是否展示、隐藏的控制逻辑，一个表单项的显隐通常是受到某些其他表单项、上层`form`、`form group`组件的状态影响
* 所有数据完全由`vuex`托管，不再散落多处
* 每个表单项独立的`module`，`form group`也有独立`module`，与组件树一一对应形成`module tree`

表单项完全自治内聚，`form`只用在初始化时将后端拉取的完整`form data`传递给表单项，由表单项自行关心的字段；在表单提交时，由于表单项内部已经准备好需要贡献哪些数据，`form`只用直接拿过来即可。

基于以上思路，势必有很多通用逻辑，提取出来后就可以方便的复用了, `demo`代码放在最后，下面具体说说实现细节。

# 总体架构

![compTree-moduleTree](/images/modulaized-form/compTree-moduleTree.jpg)

如上，组件树与`vuex module`树一一对应，`form`、`form group`、`form item`都有各自的`module`。

`vuex`中涉及多层次`module`时上下层通信不是很方便，必须知道`namespace`才行， 蛋疼的是`vuex`并没有提供很好的机制方便上层`module`了解其下属`module`的情况。

为此参考组件注册的做法做了一个约定，**子`module`在`state`中以`_moduleKey`作为注册时的`namespace`，父`module`将所有子`module`的`namespace`放入自身的`state`属性中**。例如：

```js
// form item module
export default {
  state: {
    _moduleKey: 'form-item-id',
  },
}
```

```js
// form group module
import formItemId from './form-item-id';

export default {
  state () {
    return {
      _moduleKey: 'form-group-1',
      _formItems: [formItemId.state._moduleKey], // 记录所有子module的namespace
    }
  },
  modules: {
    [formItemId.state._moduleKey]: formItemId, // 注册module时的key设置为子module的namespace
  },
}
```

```js
// form module
import formGroup1 from './form-group-1';

export default {
  state () {
    return {
      _moduleKey: 'form-demo',
      _formGroups: [formGroup1.state._moduleKey], // 记录所有子module的namespace
    }
  },
  modules: {
    [formGroup1.state._moduleKey]: formGroup1, // 注册module时的key设置为子module的namespace
  },
}
```

```js
// vuex store
import formDemo from './form-demo';

new Vuex.Store( {
  modules: {
    [formDemo.state._moduleKey]: formDemo, // 注册module时的key设置为子module的namespace
  },
} );
```

通过这种约定，父`module`就能非常方便的与子`module`通信了,例如：

```js
state._formItems.forEach( ( formItemModuleKey ) => {
  commit( `${ formItemModuleKey }/mutation1` );
  dispatch( `${ formItemModuleKey }/action1` );
} );
```

但是受制于`vuex`，子`module`仍然无法与父`module`通信，因为此时`vuex`需要提供完整的`namespace`路径才能定位父`module`具体的`mutaion/action`。

# 上层数据收集

通过上述架构，所有具体的业务数据都分散在每个表单项`module`里，一些“宏观”数据就需要一个收集过程，例如表单提交时传递给后端接口的数据、表单校验时传递给`form`组件的`model`属性。借助上面的架构，这一项工作比较简单。

## `form data`

这是表单提交时传递给后端接口的数据，大体思路是每个表单项都会贡献自己的一小份数据，最后汇总到一起。

![form-data-collect](/images/modulaized-form/form-data-collect.jpg)

每个表单项都有自己的`formItemData`，最后打平汇总到一起。

一个示范：

![form-data-example](/images/modulaized-form/form-data-example.png)

### 表单项、`form group`显隐的影响

在很多时候，如果某个表单项或者`form group`是隐藏的，那么即使其内部状态已经发生变化，也只能贡献初始状态的数据到`form data`。因此**表单项内部的`formItemData`实际上需要区分成两份，一份`formItemData4Show`用于在展示时贡献给`form data`，另一份`formItemData4Hide`用于在隐藏时贡献。**

![affect-of-hide-show--for-form-data](/images/modulaized-form/affect-of-hide-show--for-form-data.jpg)

在上面的例子里，如果贡献`id`属性的表单项在被隐藏时贡献的`id`是空串的话，

```js
formItemData4Hide () {
  return {
    id: ''
  }
},
formItemData4Show ( state ) {
  return {
    id: +state.id
  };
},
```

那么最终的`form data`就是：

![hidden-form-item-afftection-demo](/images/modulaized-form/hidden-form-item-afftection-demo.png)

## `form model`

此数据通常用于表单校验，表单校验情况比较复杂，因为校验时可能不仅仅需要用表单控件自身的值，也可能获取组件内部数据，父组件数据等等，最好的办法是`form model`获取一份非常全的数据。

为此`form model`是收集各个表单项的`state`，同时避免为`state`内同名属性的影响，最终不打平数据而是以子`module`的`namespace`作为`key`：

![form-model-collect](/images/modulaized-form/form-model-collect.jpg)

一个示范：

![form-model-example](/images/modulaized-form/form-model-example.png)

那么表单项校验时如何获取数据呢？ 通常需要两步

1. `form`组件声明`model`属性为`formModel`

  ```html
  <el-form :model="formModel">
    xxx
  </el-form>
  ```

2. 表单项组件声明`prop`为对应的`namespace`，也就是上面定义的`_moduleKey`

  ```html
  <el-form-item prop="form-item-id" label="id">
    xxx
  </el-form-item>
  ```

这样在校验函数里，拿到的就是`formModel`中对应`namespace`的数据

![form-validate-example](/images/modulaized-form/form-validate-example.png)

# 数据初始化与同步

## `module`数据初始化

上面也有提到所有具体的业务数据都分散在每个表单项`module`里，那么当在编辑已有表单时势必有一个拉取后端数据并回填页面的过程。数据获取是由顶层表单组件来做的，需要在`vuex`中与所有下层表单项`module`通信传递数据。借助上面的`namespace`，这一步简单了很多：

```js
// form module

fillForm ( { dispatch, getters }, backendData ) {
  // 利用后端数据回填表单，分发到每个form group来做
  getters.formGroups.forEach( ( formGroupModuleKey ) =>
    dispatch( `${ formGroupModuleKey }/fillFormGroup`, backendData
  ) )
},
```

```js
// form group module

fillFormGroup ( { dispatch, getters }, formData ) {
  // 每个form item自身决定取哪些数据
  getters.formItems.forEach( ( formItemModuleKey ) => {
    dispatch( `${ formItemModuleKey }/data2State`, formData );
  } );
},
```

```js
// 某个form item module
{
  mutations: {
    update ( state, newState ) {
      Object.keys( newState ).forEach( key => {
        state[ key ] = newState[ key ];
      } )
    },
  },
  actions: {
    data2State ( { commit }, formData ) {
      commit( 'update', { // 只取自己关心的数据字段
        id: formData.id,
        name: formData.name,
      } )
    }
  }
}
```

如上，每个表单项组件只需取自己关心的数据字段，对于可维护性有大大提高，因为**只要看`data2State`函数就能明白此表单项的数据依赖**。

最后只需在顶层表单组件中触发`fillForm`即可,如：

```js
{
  mounted() {
    // 模拟数据拉取
    setTimeout(() => {
      this.fillForm({
        id: 1,
        name: 2,
        desc: 3,
        text: 4
      });
    }, 2000);
  },
  methods: {
    ...mapActions("demo", ["fillForm"]),
  }
}
```

## `module`数据同步

因为各个表单项的`module state`是在初始化时通过`data2State`一次性值拷贝过来的，所以当全局性的`formData`有变更时，表单项的`module state`不能响应式同步。这会带来一些问题，比如表单项`A`改变了`formData`中表单项`B`关心的某个属性，表单项`B`是不知道的。

**需要有一种机制在数据改变时将最新数据同步到各个`module`**，借助`vuex`提供的`plugin`机制可以做到这点：

```js
// 同步表单项module。 namespace是form module的_moduleKey
export default function createSyncPlugin ( namespace ) {
  return store => {
    store.watch((state, getters) => getters[`${namespace}/formData4View`], (newVal, oldVal) => {
      if (!_.isEqual(newVal, oldVal)) {
        store.dispatch(`${namespace}/fillForm`, newVal);
      }
    }, {
      deep: true,
    });
  };
}

new Vuex.Store( {
  modules,
  plugins: [ createSyncPlugin( 'demo' ) ],
} );
```

上面的逻辑可以用下图表示：

![form-item-module-sync](/images/modulaized-form/form-item-module-sync.jpg)

注意传给`data2State`的是`formData4View`而不是`formData`，二者很类似，只不过前者是所有表单项的`formItemData4Show`合集。

# 组件渲染

由于`vuex`掌控着数据，组件显隐的判断最好也放在`vuex`中，如:

```js
// form item module
{
  getters: {
    isVisible ( state ) {
      return state.id !== 10;
    },
  }
}
```

那么上层组件在`template`中渲染时，就需要知道下层组件是否展示，得益于组件树与`module`树的一一对应关系，只需获取下层`module`里的`isVisible`属性即可。如：

```js
// form group module

{
  getters: {
    // 下属某个表单项是否可见
    isFormItemVisible ( state, getters ) {
      return formItemName => getters[ `${ formItemName }/isVisible` ];
    },
  }
}
```

这样我们在`vue template`里只要调用`isFormItemVisible`并传入表单项`module`的`_moduleKey`:

```html
<!-- form group template -->

<form-item-text v-show="isFormItemVisible('form-item-text')"/>
```

**如果约定组件的`name`和`_moduleKey`一致，那么直接用`v-for`就能完成渲染逻辑**：

```html
<!-- form group template -->

<template>
  <!-- formItem是_moduleKey，同时与组件name相同 -->
  <component
    v-for="formItem in formItems"
    v-show="isFormItemVisible(formItem)"
    :key="formItem"
    :is="formItem"
  />
</template>
<script>
export default {
  name: "form-group-2",
  computed: {
    ...mapGetters("demo/form-group-2", ["formItems", "isFormItemVisible"])
  }
};
</script>
```

# module固定属性

以上就是整个表单模块化的思路了，`module`层涉及到很多特有属性，在此做个总结：

![module-fixed-property](/images/modulaized-form/module-fixed-property.jpg)

加粗的部分属性值需要各`module`自行设置，其余部分均可以抽取成公共逻辑，这样每个表单就可以很方便复用了。

最后附上`demo`仓库：[modulize-form](https://github.com/hellogithub2014/modulized-form)
