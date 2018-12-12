---
title: 'Tslint官方推荐规则详细解释'
summary_img: /images/malaysia.jpg # Add image post (optional)
date: 2017-10-25 21:00:00

tag: [TOOL, TSLINT]
---

这两天老大给了一个任务，为部门的前端开发人员整理一份 tslint 的规则集，把官方推荐的规则集每一条都看了一遍，收获蛮大。在这里把每一条规则的解释记下来，算是一个总结吧。

# Tslint Recommend Rules

下面所列的所有规则源自于[tslint](https://github.com/palantir/tslint)官网提供的一份推荐配置清单，可在这里找到所有的规则[tslint rules](https://palantir.github.io/tslint/rules/)

如果你想更详细的了解一个规则，[可以参考这里](https://github.com/palantir/tslint/tree/master/test/rules),这里面有每一条规则的反面教材，以及你应该怎么样做来避免犯错。

为了方便大家理解，我将每条规则分为了 3 个部分，格式如下

- 如果这条规则的配置很短：
  **_规则名称_** - 规则描述 - **_tslint 官网推荐的配置_**

- 如果这条规则的配置有点长：
  **_规则名称_** - 规则描述

      	```
      	tslint官网推荐的配置
      	```
      	分割线
      	--------------------
      	下面进入正题~~~~
      	-----------------------

## TypeScript Specific

这些规则帮助找到 ts 相关错误

1. **_`adjacent-overload-signatures`_** - 强制函数重载的代码连续，放在一起 - **_`true`_**
2. **_`ban-types`_** - 禁止使用特定的 js 类型，转而去使用那些对应的替代者。

   > Don’t ever use the types Number, String, Boolean, or Object. These types refer to non-primitive boxed objects that are almost never used appropriately in JavaScript code.

   [ts 官网解释](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

   ```
   options: [
           ["Object", "Avoid using the `Object` type. Did you mean `object`?"],
           ["Function", "Avoid using the `Function` type. Prefer a specific function type, like `() => void`."],
           ["Boolean", "Avoid using the `Boolean` type. Did you mean `boolean`?"],
           ["Number", "Avoid using the `Number` type. Did you mean `number`?"],
           ["String", "Avoid using the `String` type. Did you mean `string`?"],
           ["Symbol", "Avoid using the `Symbol` type. Did you mean `symbol`?"],
       ]
   ```

3. **_`member-access`_** - 显示指定类成员中的可访问性，这样可以帮助 ts 的初学者更好理解代码。 - **_`true`_**
4. **_`member-ordering`_** - 固定类成员的顺序，可以让类更容易阅读、编辑和导航。如属性、方法、静态成员、public、private、protected 的顺序。

   ```
   options: {
           order: "statics-first",
       }

   ```

5. **_`no-empty-interface`_** - 禁止使用空接口 - **_`true`_**
6. **_`no-internal-module`_** - 不允许内部 module - **_`true`_**
7. **_`no-namespace`_** - 不允许使用内部 modules and namespaces - **_`true`_**
8. **_`no-reference`_** - Disallows /// <reference path=> imports (use ES6-style imports instead).前一种写法已经过时。 - **_`true`_**
9. **_`no-var-requires`_** - Disallows the use of require statements except in import statements. - **_`true`_**

   ```js
   var module=require("module"); // ✘
   import foo = require('foo'); // √
   ```

10. **_`only-arrow-functions`_** - 不允许传统的非箭头函数表达式，因为他们不绑定词法作用域，在使用`this`时很多时候会遇到错误.
    ```
    	options: [
            "allow-declarations",//允许单独的函数声明
            "allow-named-functions",//allows the expression function foo() {} but not function() {}
        ]
    ```
11. **_`prefer-for-of`_** - 推荐使用`for-of`循环而不是标准`for`循环，if the index is only used to access the array being iterated - **_`true`_**
12. **_`typedef`_** - Requires type definitions to exist. 总的来说，就是在给变量标注类型 - **_`false`_**
13. **_`typedef-whitespace`_** - Requires or disallows whitespace for type definitions. 就是在给变量标注类型时，是否要加空格。
    ```
    	options: [{
            "call-signature": "nospace",
            "index-signature": "nospace",
            "parameter": "nospace",
            "property-declaration": "nospace",
            "variable-declaration": "nospace",
        }, {
            "call-signature": "onespace",
            "index-signature": "onespace",
            "parameter": "onespace",
            "property-declaration": "onespace",
            "variable-declaration": "onespace",
        }]
    ```
14. **_`unified-signatures`_** - 如果两个函数重载可以通过联合类型或者可选/剩余参数来合并成一个，那么就发出警告。[官网解释](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html) - **_`true`_**

```js
//示范1：

/* WRONG */
interface Moment {
  utcOffset(): number;
  utcOffset(b: number): Moment;
  utcOffset(b: string): Moment;
}

/* OK */
interface Moment {
  utcOffset(): number;
  utcOffset(b: number | string): Moment;
}

/**
	注意这里没有写为
	interface Moment {
	    utcOffset(b?: number|string): Moment;
	}
	没有把b作为一个可选参数,是因为无参的那个函数的返回值不同
*/
```

```js
//函数重载的示范：
function func(arg:number):number; // 第一个
function func(arg:string):number; // 第二个
function func(arg:number|string){
	if(typeof arg ==='number'){
		console.log('number');
		return arg;
	}
	else if(typeof arg ==='string'){
		console.log('number');
		return +arg;
	}
	return 1;
}

func(1); // 在vcode中，将鼠标放在上面可以看到提示的是调用第一个函数
func('1');// 调用第二个函数
```

## Functionality

这些规则帮助找到 js 编码中的常见错误或者是那些容易导致 bug 的设计。

1. **_`curly`_** - 强制`if/for/do/while`的代码被花括号包围。- **_`true`_**
2. **_`forin`_** - Requires a for ... in statement to be filtered with an if statement.因为`for...in`在迭代每个值时，都可能会深入对象的原型链，导致效率低下，考虑在循环内使用`hasOwnProperty`方法进行过滤 - **_`true`_**

   ```js
   for (let key in someObject) {
     if (someObject.hasOwnProperty(key)) {
       // code here
     }
   }
   ```

3. **_`label-position`_** - Only allows labels in sensible locations. The rule only allows labels to be on `do/for/while/switch` statements - **_`true`_**

   ```js
   label3: for (var i = 0; i < 5; i++) {
     break label3;
   }
   ```

4. **_`no-arg`_** - 不允许使用`arguments.callee`，在 js 的严格模式下是禁止使用`arguments.callee`的，[解释参考](http://www.ruanyifeng.com/blog/2013/01/javascript_strict_mode.html) - **_`true`_**
5. **_`no-bitwise`_** - 不允许使用位操作，因为很多人不会用，会让别人看不懂，维护性的角度 - **_`true`_**
6. **_`no-conditional-assignment`_** - Disallows any type of assignment in conditionals.不允许使用任何类型的条件赋值（三元操作符）- **_`true`_**
7. **_`no-console`_** - 不允许使用特定的`console`方法

   ```
   	options: [
           "debug",
           "info",
           "log",
           "time",
           "timeEnd",
           "trace",
       ]
   ```

8. **_`no-construct`_** - 不允许使用`String`、`Number`、`Boolean`的构造函数，（推荐去使用他们的字面量`let s=new String('123') => let s='123'`） - **_`true`_**
9. **_`no-debugger`_** - 禁止使用`debugger`语句 - **_`true`_**
10. **_`no-duplicate-super`_** - 如果`super()`出现在构造器里两次，发出警告.`super`在类继承中使用。 - **_`true`_**
11. **_`no-empty`_** - 禁止空的代码块 - **_`true`_**
12. **_`no-eval`_** - 禁止`eval`函数调用 - **_`true`_**
13. **_`no-invalid-this`_** - 不允许在类外面使用`this`关键字 - **_`false`_**
14. **_`no-misused-new`_** - Warns on apparent attempts to define constructors for interfaces or new for classes. 接口不能被“构造”， 在一个类中显示定义一个名为“new”的方法很有可能本意是想定义构造函数，提示`constructor`进行替代。 [参考这里](https://github.com/palantir/tslint/commit/441b2e58f8e990b8f330f609264c3a22cb998df4) - **_`true`_**
15. **_`no-shadowed-variable`_** - Disallows shadowing variable declarations.变量名遮蔽：当在内层作用域定义了一个与外层作用域相同的变量名，会把外层作用域的那个变量名给覆盖。[维基百科解释](https://en.wikipedia.org/wiki/Variable_shadowing) - **_`true`_**
    ```
    var a = 1;
    function(){
    	var a=2;//变量名遮蔽
    }
    ```
16. **_`no-string-literal`_** - Disallows object access via string literals.不允许使用字符串字面量来获取对象成员值[stackoverflow 上的提问](http://stackoverflow.com/questions/33387090/how-to-rewrite-code-to-avoid-tslint-object-access-via-string-literals) - **_`true`_**
    ```
    // instead of
    fields['ECStruct1'] = ...
    // do something like
    let key = 'ECStruct1';
    fields[key] = ...
    ```
17. **_`no-string-throw`_** - Flags throwing plain strings or concatenations of strings because only Errors produce proper stack traces.在`throw`时，不要只发射一个纯的字符串或者字符串的连接，因为会丢失错误堆栈信息，只有`Errors`才会包含这些信息。参考[Error - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) - **_`true`_**
18. **_`no-switch-case-fall-through`_** - Disallows falling through case statements. [stackoverflow 提问](http://stackoverflow.com/questions/188461/switch-statement-fallthrough-should-it-be-allowed)。 一把双刃剑，推荐做法是当确实要这么做时，给出显式的`/* FALLTHROUGH */`注释 - **_`false`_**
    ```
    	switch (c) {
    	  case 1:
    	  case 2:
    	            ... do some of the work ...
    	            /* FALLTHROUGH */
    	  case 17:
    	            ... do something ...
    	            break;
    	  case 5:
    	  case 43:
            ... do something else ...
            break;
    	}
    ```
19. **_`no-unsafe-finally`_** - 不允许在`finally`块中使用控制流语句，比如`return`, `continue`, `break` and `throws` - **_`true`_**
20. **_`no-unused-expression`_** - 不允许没有用到的表达式语句。 - **_`true`_**
21. **_`no-use-before-declare`_** - 禁止在变量被声明前就使用它。 在 JavaScript 中使用`var`、`function(){}`时会有变量提升，在代码中可以在他们的正式声明之前就使用这些变量。但使用`let`、`const`时就杜绝了这样的现象，尝试这么做会有`temporal dead zone`的错误。[参考 ESLint 的解释](http://eslint.org/docs/rules/no-use-before-define)。推荐的规则里禁用了它：disable this rule as it is very heavy performance-wise and not that useful - **_`false`_**
22. **_`no-var-keyword`_** - 禁止使用`var`关键字 - **_`true`_**
23. **_`radix`_** - 在使用`parseInt`方法时要求提供基数（例如 10，16 等） - **_`true`_**
24. **_`triple-equals`_** - 使用`===`和`!==`替代`==`和`!=`
    ```
    options: ["allow-null-check"]//allows == and != when comparing to null
    //还有另一项配置： "allow-undefined-check" - allows == and != when comparing to undefined，但recommend中并没有使用它
    ```
25. **_`typeof-compare`_** - 确保`typeof`的结果是和`string`类型值进行比较 - **_`true`_**
26. **_`use-isnan`_** - 强制使用`isNaN()`函数来检查`NaN`，而不是直接与`NaN`常量比较。 - **_`true`_**

## Maintainability

这些规则使得代码更容易维护。

1.  **_`cyclomatic-complexity`_** - 循环复杂度，用于度量函数复杂度的一个值。这个值比较高意味着代码可能会出错或者代码难以维护。- **_`false`_**
2.  **_`eofline`_** - 强制文件以一个新行结束。 - **_`true`_**
3.  **_`indent`_** - 强制使用 tab 键或者空格缩进 - **_`options: ["spaces"]`_**
4.  **_`max-classes-per-file`_** - 规定一个文件中不能有超过特定数目的类定义，遵循文件的单一职责原则. - **_`options: [1]`_**
5.  **_`max-line-length`_** - 规定一行不能超过特定的长度 - **_`options: [120]`_**
6.  **_`object-literal-sort-keys`_** - 强制在对象字面量里的所有键以字母排序。 - **_`true`_**
7.  **_`prefer-const`_** - 如果可以的话，变量声明优先使用`const`而不是`let` - **_`true`_**
8.  **_`trailing-comma`_** - **禁止**或**要求**在数组、对象字面量、解构赋值、函数、元祖类型、函数参数、命名导入(named imports)中，最后面留有一个逗号
    `options: { multiline: "always",//checks multi-line object literals. singleline: "never",//checks single-line object literals. }`

    > 如果一个数组的闭括号在最后一个元素的下一行，那么这个数组就是`multiline`。这个逻辑同样适用于
    > 对象字面量、解构赋值、函数、元祖类型、函数参数、命名导入。

        ```
        let arr1=[1,2,3,4];//singleline
        let arr2=[
        		1,
        		2,
        		3,
        		4,
        	];//multiline
        ```

## Style

这些规则强制在代码中保持一致的风格

1. **_`align`_** - 强制垂直对齐

   ```
   options: [
   "parameters",//checks alignment of function parameters.
   "statements",// checks alignment of statements.
           ]
   ```

2. **_`array-type`_** - 对于数组，要求给他们添加`T[]`或`Array`类型。 [使用示范](https://github.com/palantir/tslint/blob/master/test/rules/array-type/array-simple/test.ts.lint) - ***`options: ["array-simple"/*enforces use of T[] if T is a simple type (primitive or type reference)._/]`_**
3. **_`arrow-parens`_** - 要求用括号将箭头函数的参数包围起来。 - **_`true`_**
4. **_`arrow-return-shorthand`_** - 建议将`() => { return x; }`用`() => x`代替 - **_`true`_**
5. **_`callable-types`_** - An interface or literal type with just a call signature can be written as a function type.如果一个可调用接口中只有一个函数签名，那么可以直接将他重构为一个函数类型。 [可调用接口](https://www.typescriptlang.org/docs/handbook/interfaces.html) - **_`true`_**

   ```
   // 可调用接口的使用示范

   // a function type with an interface
   interface SearchFunc {
       (source: string, subString: string): boolean;
   }

   //usage
   let mySearch: SearchFunc;
   mySearch = function(source: string, subString: string) {
       let result = source.search(subString);
       return result > -1;
   }
   ```

6. **_`class-name`_** - 强制使用帕斯卡命名法(PascalCased,亦即大写驼峰法)给类和接口命名 - **_`true`_**
7. **_`comment-format`_** - 强制格式化单行注释 - **_`options: ["check-space"/_ 要求所有单行注释必须以一个空格开头， 例如 // commment _/]`_**
8. **_`import-spacing`_** - 保证在导入语句中留有合适的空格 - **_`true`_**
9. **_`interface-name`_** - 要求给接口名前加上 I,但与[TypeScript 官方指导原则](https://github.com/Microsoft/TypeScript/wiki/Coding-guidelines)相悖 - **_`options: ["always-prefix"]`_**

10. **_`interface-over-type-literal`_** - 倾向使用接口声明代替类型字面量 (`type T = { ... }`),`type`关键字参阅 [ts 高级类型](https://www.tslang.cn/docs/handbook/advanced-types.html) - **_`true`_**

    ```js
    type C = { a: string, b?: number };
    function f({ a, b }: C): void {
      // ...
    }
    ```

11. **_`jsdoc-format`_** - Enforces basic format rules for JSDoc comments. 强制注释的格式满足 JSDoc 的要求 - **_`true`_**
    [JSDoc](http://usejsdoc.org/about-getting-started.html)

    > JSDoc's purpose is to document the API of your JavaScript application or library. It is assumed that you will want to document things like modules, namespaces, classes, methods, method parameters, and so on.

    JSDoc 的注释要求以下几条规则，注释以/\*\*开头:

    - 每行都有一个星号且星号要对齐
    - 除了第一个和最后一个星号，每个星号后面要么是空格要么是新的一行
    - 每一行的星号前面只能是空格
    - 单行注释必须以`/**`开头，以 `*/` 结尾

    eg:

    ```
    /** This is a description of the foo function. */
    function foo() {
    }
    ```

    ```
    /**
     * Represents a book.
     * @constructor
     */
    function Book(title, author) {
    }
    ```

    ```
    /**
     * Represents a book.
     * @constructor
     * @param {string} title - The title of the book.
     * @param {string} author - The author of the book.
     */
    function Book(title, author) {
    }
    ```

12. **_`new-parens`_** - 要求通过`new`关键字调用构造函数时使用括号。在 JavaScript 中，如果一个构造函数不需要参数，那么在 new 时，括号是可选的。 - **_`true`_**

    ```js
    function Person() {
      this.name = 'liubin';
    }
    var p1 = new Person();
    var p2 = new Person();
    p1.name; // "liubin"
    p2.name; // "liubin"
    ```

13. **_`no-angle-bracket-type-assertion`_** - 在进行类型断言时，要求使用`as Type`替换`<Type>` - **_`true`_**
    [类型断言](https://www.typescriptlang.org/docs/handbook/basic-types.html)
    > The two samples are equivalent. Using one over the other is mostly a choice of preference; however, when using TypeScript with JSX, only as-style assertions are allowed.两种写法都是等价的，但是如果将 ts 和 JSX 搭配使用，只有 as-style 这种格式的断言是被允许的。
14. **_`no-consecutive-blank-lines`_** - Disallows one or more blank lines in a row.不允许连续的空行 - **_`true`_**
    ```
    //for example
    const x = "x";
    ```


    const y = "y";
    ```

20. **_`no-parameter-properties`_** - Disallows parameter properties in class constructors.不允许在类构造器中定义参数属性 - **_`false`_**

    > Parameter properties can be confusing to those new to TS as they are less explicit than other ways of declaring and initializing class members.参数属性对 ts 的初学者具有迷惑性，因为这种语法比显示定义一个类成员然后初始化它更隐晦。

    ```
    constructor(public x:number){}// 定义参数属性
    ```

21. **_`no-trailing-whitespace`_** - Disallows trailing whitespace at the end of a line. 不允许在每行的末尾有空格 - **_`true`_**

    > Sometimes in the course of editing files, you can end up with extra whitespace at the end of lines. These whitespace differences can be picked up by source control systems and flagged as diffs, causing frustration for developers. While this extra whitespace causes no functional issues, many code conventions require that trailing spaces be removed before check-in.在代码管理系统中，每行末尾多余的一些空格会被当做是文件的更新，别人在接收代码时会有疑惑。这种空格完全是多余的，很多代码规范都会禁止它。

    ```
    //Examples of **incorrect** code for this rule:
    /*eslint no-trailing-spaces: "error"*/

    var foo = 0;//•••••
    var baz = 5;//••
    //•••••
    ```

    ```
    //Examples of **correct** code for this rule:
    /*eslint no-trailing-spaces: "error"*/

    var foo = 0;
    var baz = 5;
    ```

22. **_`no-unnecessary-initializer`_** - 禁止一个`var/let`语句或者解构初始化语句里面的变量被初始化为`undefined`。[更详细的参考](https://github.com/palantir/tslint/blob/master/test/rules/no-unnecessary-initializer/test.ts.lint) - **_`true`_**
23. **_`object-literal-key-quotes`_** - 强制在对象字面量的属性上使用一致风格的引号 - **_`options: ["consistent-as-needed"/_ 如果有属性的名字需要引号，那么全部的属性也加引号。否则，全都不加 _/]`_**
24. **_`object-literal-shorthand`_** - Enforces use of ES6 object literal shorthand when possible.如果可能的话，强制使用 es6 中的对象字面量简写方法 - **_`true`_**

    > EcmaScript 6 provides a concise form for defining object literal methods and properties. This syntax can make defining complex object literals much cleaner.ES6 提供了一种定义对象字面量的简写方法，使得阅读和书写更清晰。 [object-literal-shorthand](http://eslint.org/docs/rules/object-shorthand)

    ```
    //es5语法
    // properties
    var foo = {
        x: x,
        y: y,
        z: z,
    };

    // methods
    var foo = {
        a: function() {},
        b: function() {}
    };
    ```

    ```
    //es6中的等价写法
    /*eslint-env es6*/

    // properties
    var foo = {x, y, z};

    // methods
    var foo = {
        a() {},
        b() {}
    };
    ```

25. **_`one-line`_** - Requires the specified tokens to be on the same line as the expression preceding them.要求一些特定的标识符位于同一行。
    ```json
    options: [
        "check-catch",//checks that catch is on the same line as the closing brace for try。 catch和try的闭括号位于同一行
        "check-else",//checks that else is on the same line as the closing brace for if. else和if 的闭括号位于同一行
        "check-finally",//checks that finally is on the same line as the closing brace for catch. finally和catch 的闭括号位于同一行
        "check-open-brace",//checks that an open brace falls on the same line as its preceding expression。 特定表达式的开括号必须和它位于同一行
        "check-whitespace",//checks preceding whitespace for the specified tokens。 看不懂，应该是在哪里要加一些空格什么的，先无视它~~
    ]
    ```


    ```js
    //规则示范
    try {// 如果这个开括号和try不是同一行，会报警告check-open-brace
    	//code
    } catch(e) { // catch和try的闭括号位于同一行

    }
    ```

27. **_`one-variable-per-declaration`_** - 禁止在同一个声明语句中声明多个变量 - ***`options: ["ignore-for-loop"/*允许在 for 循环里同时定义多个变量 _/]`_**

    ```
    let a, b = 10; // 不要这么写，有一定歧义。 a= ????

    // 可以这么替代
    let a;
    let b=10;
    ```

28. **_`ordered-imports`_** - 要求导入语句以字母序排序,与 angular2 官网规范一致

    ```
    options: {
    	//import-sources-order用于设置导入的源文件的顺序(the "foo" in import {A, B, C} from "foo")
        "import-sources-order": "case-insensitive",//忽略大小写：Correct order is "Bar", "baz", "Foo". (This is the default.)

      // 基于全路径的import顺序
         "module-source-path": "full", // "./a/Foo","./b/baz","./c/Bar"

    	//named-imports-order用于设置导入的模块名的顺序，(the {A, B, C} in import {A, B, C} from "foo").
        "named-imports-order": "case-insensitive",
    }
    ```


    ```js
    // 一些示范
    // Named imports should be alphabetized.
    import {A, B} from 'foo';
    import {B, A} from 'foo'; // failure

    // Case is irrelevant for named import ordering.
    import {A, b, C} from 'zfoo';
    import {bz, A, C} from 'foo'; // failure

    // Case is irrelevant for source import ordering.
    import {A, B} from 'Bar';
    import {A, B} from 'baz';
    import {A, B} from 'Foo'; // should not fail
    ```
    [更多示范](https://github.com/palantir/tslint/blob/master/test/rules/ordered-imports/case-insensitive/test.ts.lint)

31. **_`quotemark`_** - 要求字符串字面量使用一致的单引号或者双引号
    ```
    options: [
        "double",// 强制使用双引号
        "avoid-escape",// 允许在需要转译的引号的字符串中出现“其他”风格的引号。例如在'Hello "World"'中，就允许出现两种风格的引号。
    ]
    ```
32. **_`semicolon`_** - 强制在每条语句之后有一致的分号用法 - ***`options: ["always"/*每条语句都以分号结尾*/]`***
33. **_`space-before-function-paren`_** - Require or disallow a space before function parenthesis.函数的圆括号前是否需要空格。PS：这个规则反正就是各种空格什么的，不需要太关心哪里加哪里不加，警告时一看就会明白。

    ```
    	options: {
            anonymous: "never",
            asyncArrow: "always",
            constructor: "never",
            method: "never",
            named: "never",
        }
    ```

    在[这里](https://github.com/palantir/tslint/tree/master/test/rules/space-before-function-paren)查看具体示例，了解哪里加哪里不加

34. **_`variable-name`_** - 变量名拼写检查

    ```js
    options: [
      'ban-keywords', //不允许使用特定的ts关键字当做变量或者参数名。	黑名单: any, Number, number, String, string, Boolean, boolean, Undefined, undefined

      'check-format', //只允许小驼峰或者UPPER_CASED形式的变量名
      'allow-pascal-case', //除了小驼峰还允许PascalCase帕斯卡命名（除了类名接口名这些，不知道在哪里还需要PascalCase命名。。。）

      // 还有几个推荐规则中没有加上的：
      'allow-leading-underscore', // 允许开头的下划线，例如 _test
      'allow-trailing-underscore', // 允许结尾的下划线，例如 `test_`
      'allow-snake-case', // 允许蛇形写法， test_1，  TEST_1
    ];
    ```

35. **_`whitespace`_** - Enforces whitespace style conventions.
    ```
    options: [
      "check-branch",// (if/else/for/while) 这些分支语句的单词后面要有空格。
      "check-decl",//变量声明的等号两边有空格
      "check-operator",//操作符两边有空格
      "check-separator",//分隔符两边有空格(,/;)
      "check-type",//变量类型的声明前面有空格
      "check-typecast",//checks for whitespace between a typecast and its target. 类型转换时，在变量和它的目标类型之间要有空格。
    ]
    ```

## tslint 官网推荐的配置

- [tslint:recommend](https://github.com/palantir/tslint/blob/master/src/configs/recommended.ts)
- [tslint:latest](https://github.com/palantir/tslint/blob/master/src/configs/recommended.ts)

## CodeLyzer 推荐规则

**安装** - 我们的项目中使用的版本是`3.1.0`，安装命令：

```js
npm i codelyzer@3.1.0 tslint@^5.8.0 typescript@^2.5.3 @angular/core@4.1.3 @angular/compiler@4.1.3 rxjs@5.4.0 zone.js@0.8.12
```

以下基于[Angular 风格指南](https://angular.io/styleguide)

1. **_`directive-selector`_**: [true, "attribute", ["dir-prefix1", "dir-prefix2"], "camelCase"] - 指令选择器前缀，个人推荐使用 `crm`作为前缀
2. **_`component-selector`_**: [true, "element", ["cmp-prefix1", "cmp-prefix2"], "kebab-case"] - 组件名前缀
3. **_`use-input-property-decorator`_**: true, - 使用 @Input()
4. **_`use-output-property-decorator`_**: true, - 使用@Output()
5. **_`use-host-property-decorator`_**: true, - 使用@HostBinding 或 @HostListener
6. **_`no-attribute-parameter-decorator`_**: true, - 不使用@Attribute，使用@Input
7. **_`no-input-rename`_**: true, - 不允许 @Input('alias') inputName;
8. **_`no-output-rename`_**: true, - 不允许 @Output('alias') inputName;
9. **_`no-forward-ref`_**: true, - 不允许 forwardRef

   ```js
   constructor(@Inject(forwardRef(() => Lock)) lock: Lock) { this.lock = lock; }
   ```

10. **_`use-life-cycle-interface`_**: true, - 使用生命周期接口，例如

    ```js
    class YourComponent implements OnInit {
      ngOnInit() {}
    }
    ```

11. **_`use-pipe-transform-interface`_**: true, - 管道实现`PipeTransform`接口

    ```js
    class YourPipe implements PipeTransform {
      transform() {}
    }
    ```

12. **_`component-class-suffix`_**: [true, "Component"], - 组件名后缀
13. **_`directive-class-suffix`_**: [true, "Directive"], - 指令名后缀
14. **_`templates-use-public`_**: true, - 模板中使用的属性和方法需要是组件中的 public 成员
15. **_`no-access-missing-member`_**: true, - 模板中不能使用组件中不存在的成员
16. **_`invoke-injectable`_**: true - @Injectable()的括号不能丢

[Codelyzer 规则全集](http://codelyzer.com/rules/)

## 推荐一组协助 tslint 工作的 vscode 配置

```js
{
	"editor.wordWrap": "wordWrapColumn",
	"editor.wordWrapColumn": 120,
	"html.format.endWithNewline": true,
	"files.trimTrailingWhitespace": true,
	"autoimport.doubleQuotes": true, // 需要安装auto import插件
	"files.insertFinalNewline": true,
	"typescript.format.insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis": true,
	"typescript.format.insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets": true,
	"typescript.format.insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces": true,
	"editor.formatOnSave": true,
	"editor.formatOnPaste": true,
	"tslint.autoFixOnSave": true,
}
```

## 注意事项

1. 如果决定开启严格规则检查，需要在`tsconfig.json`的`compilerOptions`中添加

   ```
   "strict":true
   ```

2. 一个坑： 我们已经在`tsconfig.json`将`node_modules`文件夹屏蔽在外了，可是启动项目时仍然报了其中某个文件检查失败。解决办法是在`compilerOptions`中添加

   ```
   "skipLibCheck":true
   ```
