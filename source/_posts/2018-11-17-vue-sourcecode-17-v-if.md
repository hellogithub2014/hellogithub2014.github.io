---
title: 'Vue源码解析17-v-if的处理'
img: new-york.jpg # Add image post (optional)
date: 2018-11-17 18:20:00

tag: [Vue, javascript]
---

# parse

`processIf`用于处理`v-if`：

```js
function processIf(el) {
  const exp = getAndRemoveAttr(el, 'v-if'); // 获取节点上的v-if属性值
  if (exp) {
    el.if = exp; // 'condition'
    addIfCondition(el, {
      exp: exp,
      block: el,
    });
  } else {
    if (getAndRemoveAttr(el, 'v-else') != null) {
      el.else = true;
    }
    const elseif = getAndRemoveAttr(el, 'v-else-if');
    if (elseif) {
      el.elseif = elseif; // "condition2"
    }
  }
}
```

我们照常用一个示范`html`帮助理解：

```js
<div id="app">
  <div v-if="condition">this is v-if</div>
  <div v-else-if="condition2">this is v-else-if</div>
  <div v-else>this is v-else</div>
</div>
```

上面这段`html`会调用`processIf`3 次，每次的差别在于`attrsMap`里的属性值：

```js
{
  attrsList:[],
  attrsMap: {
    'v-if': 'condition'
    // 或者 'v-else-if': "condition2"
    // 或者 'v-else': ""
  },
  tag: 'div',
}
```

都处理完后，`el`上会多出 3 个属性值：

```js
{
  if: 'condition',
  elseif: 'condition2',
  else: true,

}
```

`addIfCondition`用于给`el.ifConditions`数组塞入新元素：

```js
export function addIfCondition(el: ASTElement, condition: ASTIfCondition) {
  if (!el.ifConditions) {
    el.ifConditions = [];
  }
  el.ifConditions.push(condition);
}
```

细心的人可能发现了只有`if`分支才改变了`el.ifConditions`，另外两个分支应该也会有类似的操作，在什么地方做的呢？

在调用完`processIf`后，还有一个地方调用了`processIfConditions`，它也会操作`el.ifConditions`：

```js
if (currentParent && !element.forbidden) {
  // 在处理到v-else-if and v-else节点时，需要将其和v-if节点结合起来，
  // 通过在v-if节点上的ifConditions数组，来最终决定渲染哪个节点
  if (element.elseif || element.else) {
    processIfConditions(element, currentParent);
  } else if (element.slotScope) {
    // 作用域插槽处理略去。。。
  } else {
    currentParent.children.push(element);
    element.parent = currentParent;
  }
}
```

很明显我们在处理到`v-else-if`和`v-else`时，`processIfConditions`都会被调用。另外注意这种情况下是不会把当前元素计入`currentParent.children`的，只有`v-if`节点才被计入了。看看`processIfConditions`：

```js
function processIfConditions(el, parent) {
  const prev = findPrevElement(parent.children); // 找到v-else-if或v-else前面的v-if节点
  if (prev && prev.if) {
    // 添加prev.ifConditions数组元素
    addIfCondition(prev, {
      exp: el.elseif,
      block: el,
    });
  }
}
```

`findPrevElement`用来在前面找到紧挨着`v-else-if`和`v-else`的那个节点：

```js
// 找到children中第一个element节点
function findPrevElement(children: Array<any>): ASTElement | void {
  let i = children.length;
  while (i--) {
    if (children[i].type === 1) {
      return children[i];
    } else {
      children.pop();
    }
  }
}
```

最终经过`parse`处理，我们的`AST`节点上就有了所有分支的相关属性：

```js
{
  type: 1,
  tag: 'div',
  plain: false,
  children: [{
    type: 1,
    tag: 'p',
    children: [{
      text: 'this is v-if',
      type: 3
    }]
    if: 'condition',
    ifConditions: [{
      exp: "condition",
      block: {
	    type: 1,
	    tag: 'p',
	    children: [{
	      text: 'this is v-if',
	      type: 3
	    }],
	    if: 'condition',
	    ifConditions: [],
	    plain: true
	  }
    }, {
      exp: "condition2",
      block: {
	    type: 1,
	    tag: 'p',
	    children: [{
	      text: 'this is v-else-if',
	      type: 3
	    }],
	    elseif: 'condition2',
	    plain: true
	  }
    }, {
      exp: undefined,
      block: {
	    type: 1,
	    tag: 'p',
	    children: [{
	      text: 'this is v-else',
	      type: 3
	    }],
	    else: true,
	    plain: true
	  }
    }]
  }]
}
```

注意根节点的`children`只有一个元素，这与我们上面讲的一致，只有`v-if`才进入了父元素的`children`中。`Vue template`的一个细节就是有这个处理得出的，后面会说。

# generate

处理`v-if`的是`genIf`函数：

```js
export function genIf(el: any, state: CodegenState, altGen?: Function, altEmpty?: string): string {
  el.ifProcessed = true; // avoid recursion
  return genIfConditions(el.ifConditions.slice(), state, altGen, altEmpty);
}

// 循环处理ifConditions里面的每一个元素，直到找到exp返回true的元素。
function genIfConditions(conditions: ASTIfConditions, state: CodegenState, altGen?: Function, altEmpty?: string): string {
  if (!conditions.length) {
    return altEmpty || '_e()'; // _e: createEmptyVNode
  }

  const condition = conditions.shift();
  if (condition.exp) {
    // exp确实设置了，如"value === 1" 而不是undefined或空串，
    return `(${condition.exp})?${genTernaryExp(condition.block)}:${genIfConditions(conditions, state, altGen, altEmpty)}`;
  } else {
    return `${genTernaryExp(condition.block)}`;
  }

  // v-if with v-once should generate code like (a)?_m(0):_m(1)
  function genTernaryExp(el) {
    // 在genOnce中也有类似的设置：若v-once上同时存在v-if，则优先调用genIf
    return altGen ? altGen(el, state) : el.once ? genOnce(el, state) : genElement(el, state);
  }
}
```

注释很详细，我们直接看最终生成的`render`字符串：

```js
`
with (this) {
  return _c('div', { attrs: { id: 'app' } }, [
    condition ? _c('div', [_v('this is v-if')]) : condition2 ? _c('div', [_v('this is v-else-if')]) : _c('div', [_v('this is v-else')]),
  ]);
}
`;
```

没有涉及新的帮助函数，可以很清楚的看到核心是一个嵌套的三目运算，最终只有条件成立的那个分支才会生成对应的`vnode`
。

# template 小细节

通常情况下，我们的`Vue`组件只能有一个根元素，但是使用`v-if`可以有多个根元素分支：

```js
<div id="app">
    <my-comp></my-comp>
  </div>
  <script type="text/javascript">
    var vm = new Vue( {
      el: '#app',
      components: {
        myComp: {
          data()
          {
            return {
              condition: true,
              condition2: false
            }
          },
          template: `
            <div v-if="condition">this is v-if</div>
            <div v-else-if="condition2">this is v-else-if</div>
            <div v-else>this is v-else</div>
          `,
        }
      }
    } )
  </script>
```

正是因为`parse`阶段处理`v-if`时的特殊代码：

```js
if (!root) {
  root = element;
} else if (!stack.length) {
  if (root.if && (element.elseif || element.else)) {
    addIfCondition(root, {
      exp: element.elseif,
      block: element,
    });
  }
}

if (currentParent && !element.forbidden) {
  if (element.elseif || element.else) {
    processIfConditions(element, currentParent);
  } else {
    currentParent.children.push(element);
    element.parent = currentParent;
  }
}
```

`currentParent`的`children`中只会有`v-if`分支的节点，`v-else-if`、`v-else`节点都会放到`el.ifConditions`中，只在条件成立时才渲染出来。
