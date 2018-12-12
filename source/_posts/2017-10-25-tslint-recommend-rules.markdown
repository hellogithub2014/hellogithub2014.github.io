---
title: "Tslint官方推荐规则详细解释"
img: malaysia.jpg # Add image post (optional)
date: 2017-10-25 21:00:00 Asia/Shanghai
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [TOOL,TSLINT]
---

# 前言

这两天老大给了一个任务，为部门的前端开发人员整理一份tslint的规则集，把官方推荐的规则集每一条都看了一遍，收获蛮大。在这里把每一条规则的解释记下来，算是一个总结吧。

# Tslint Recommend Rules
下面所列的所有规则源自于[tslint](https://github.com/palantir/tslint)官网提供的一份推荐配置清单，可在这里找到所有的规则[tslint rules](https://palantir.github.io/tslint/rules/)

如果你想更详细的了解一个规则，[可以参考这里](https://github.com/palantir/tslint/tree/master/test/rules),这里面有每一条规则的反面教材，以及你应该怎么样做来避免犯错。

为了方便大家理解，我将每条规则分为了3个部分，格式如下

* 如果这条规则的配置很短：
	 ***规则名称*** - 规则描述 - ***tslint官网推荐的配置***

* 如果这条规则的配置有点长：
	***规则名称*** - 规则描述

	```
	tslint官网推荐的配置
	```
	分割线
	--------------------
	下面进入正题~~~~
	-----------------------
## TypeScript Specific
 这些规则帮助找到ts相关错误

1. ***`adjacent-overload-signatures`*** - 强制函数重载的代码连续，放在一起 - ***`true`***
2. ***`ban-types`*** - 禁止使用特定的js类型，转而去使用那些对应的替代者。
	>Don’t ever use the types Number, String, Boolean, or Object. These types refer to non-primitive boxed objects that are almost never used appropriately in JavaScript code.

	[ts官网解释](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

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
3. ***`member-access`*** - 显示指定类成员中的可访问性，这样可以帮助ts的初学者更好理解代码。 - ***`true`***
4. ***`member-ordering`*** - 固定类成员的顺序，可以让类更容易阅读、编辑和导航。如属性、方法、静态成员、public、private、protected的顺序。
	```
	options: {
            order: "statics-first",
        }

	```
5. ***`no-empty-interface`*** - 禁止使用空接口 - ***`true`***
6. ***`no-internal-module`*** - 不允许内部module - ***`true`***
7. ***`no-namespace`*** - 不允许使用内部modules and namespaces - ***`true`***
8. ***`no-reference`*** - Disallows /// <reference path=> imports (use ES6-style imports instead).前一种写法已经过时。  - ***`true`***
9. ***`no-var-requires`*** - Disallows the use of require statements except in import statements. - ***`true`***

	```js
	var module=require("module"); // ✘
	import foo = require('foo'); // √
	```
10. ***`only-arrow-functions`*** - 不允许传统的非箭头函数表达式，因为他们不绑定词法作用域，在使用`this`时很多时候会遇到错误.
	```
		options: [
            "allow-declarations",//允许单独的函数声明
            "allow-named-functions",//allows the expression function foo() {} but not function() {}
        ]
	```
11. ***`prefer-for-of`*** - 推荐使用`for-of`循环而不是标准`for`循环，if the index is only used to access the array being iterated - ***`true`***
12. ***`typedef`*** - Requires type definitions to exist. 总的来说，就是在给变量标注类型 - ***`false`***
13. ***`typedef-whitespace`*** - Requires or disallows whitespace for type definitions. 就是在给变量标注类型时，是否要加空格。
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
14. ***`unified-signatures`*** - 如果两个函数重载可以通过联合类型或者可选/剩余参数来合并成一个，那么就发出警告。[官网解释](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html) - ***`true`***

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
    utcOffset(b: number|string): Moment;
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
这些规则帮助找到js编码中的常见错误或者是那些容易导致bug的设计。

1. ***`curly`*** - 强制`if/for/do/while`的代码被花括号包围。- ***`true`***
2. ***`forin`*** - Requires a for ... in statement to be filtered with an if statement.因为`for...in`在迭代每个值时，都可能会深入对象的原型链，导致效率低下，考虑在循环内使用`hasOwnProperty`方法进行过滤 - ***`true`***

	```js
	for(let key in someObject){
		if(someObject.hasOwnProperty(key)){
			// code here
		}
	}
	```
3. ***`label-position`*** - Only allows labels in sensible locations. The rule only allows labels to be on `do/for/while/switch` statements - ***`true`***

	```js
	label3:
	for(var i=0;i<5;i++){
		break label3;
	}
	```
4. ***`no-arg`*** - 不允许使用`arguments.callee`，在js的严格模式下是禁止使用`arguments.callee`的，[解释参考](http://www.ruanyifeng.com/blog/2013/01/javascript_strict_mode.html) - ***`true`***
5. ***`no-bitwise`*** - 不允许使用位操作，因为很多人不会用，会让别人看不懂，维护性的角度 - ***`true`***
6. ***`no-conditional-assignment`*** - Disallows any type of assignment in conditionals.不允许使用任何类型的条件赋值（三元操作符）- ***`true`***
7. ***`no-console`*** - 不允许使用特定的`console`方法

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
8. ***`no-construct`*** - 不允许使用`String`、`Number`、`Boolean`的构造函数，（推荐去使用他们的字面量`let s=new String('123') => let s='123'`） - ***`true`***
9. ***`no-debugger`*** - 禁止使用`debugger`语句 - ***`true`***
10. ***`no-duplicate-super`*** -  如果`super()`出现在构造器里两次，发出警告.`super`在类继承中使用。 - ***`true`***
11. ***`no-empty`*** - 禁止空的代码块 - ***`true`***
12. ***`no-eval`*** - 禁止`eval`函数调用 - ***`true`***
13. ***`no-invalid-this`*** - 不允许在类外面使用`this`关键字 - ***`false`***
14. ***`no-misused-new`*** - Warns on apparent attempts to define constructors for interfaces or new for classes. 接口不能被“构造”， 在一个类中显示定义一个名为“new”的方法很有可能本意是想定义构造函数，提示`constructor`进行替代。 [参考这里](https://github.com/palantir/tslint/commit/441b2e58f8e990b8f330f609264c3a22cb998df4) - ***`true`***
15. ***`no-shadowed-variable`*** - Disallows shadowing variable declarations.变量名遮蔽：当在内层作用域定义了一个与外层作用域相同的变量名，会把外层作用域的那个变量名给覆盖。[维基百科解释](https://en.wikipedia.org/wiki/Variable_shadowing) - ***`true`***
	```
	var a = 1;
	function(){
		var a=2;//变量名遮蔽
	}
	```
16. ***`no-string-literal`*** - Disallows object access via string literals.不允许使用字符串字面量来获取对象成员值[stackoverflow上的提问](http://stackoverflow.com/questions/33387090/how-to-rewrite-code-to-avoid-tslint-object-access-via-string-literals) - ***`true`***
	```
	// instead of
	fields['ECStruct1'] = ...
	// do something like
	let key = 'ECStruct1';
	fields[key] = ...
	```
17. ***`no-string-throw`*** - Flags throwing plain strings or concatenations of strings because only Errors produce proper stack traces.在`throw`时，不要只发射一个纯的字符串或者字符串的连接，因为会丢失错误堆栈信息，只有`Errors`才会包含这些信息。参考[Error - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) - ***`true`***
18. ***`no-switch-case-fall-through`*** - Disallows falling through case statements. [stackoverflow 提问](http://stackoverflow.com/questions/188461/switch-statement-fallthrough-should-it-be-allowed)。 一把双刃剑，推荐做法是当确实要这么做时，给出显式的`/* FALLTHROUGH */`注释 - ***`false`***
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
19. ***`no-unsafe-finally`*** - 不允许在`finally`块中使用控制流语句，比如`return`, `continue`, `break` and `throws` - ***`true`***
20. ***`no-unused-expression`*** - 不允许没有用到的表达式语句。 - ***`true`***
21. ***`no-use-before-declare`*** - 禁止在变量被声明前就使用它。 在JavaScript中使用`var`、`function(){}`时会有变量提升，在代码中可以在他们的正式声明之前就使用这些变量。但使用`let`、`const`时就杜绝了这样的现象，尝试这么做会有`temporal dead zone`的错误。[参考ESLint的解释](http://eslint.org/docs/rules/no-use-before-define)。推荐的规则里禁用了它：disable this rule as it is very heavy performance-wise and not that useful - ***`false`***
22. ***`no-var-keyword`*** - 禁止使用`var`关键字 - ***`true`***
23. ***`radix`*** - 在使用`parseInt`方法时要求提供基数（例如10，16等） - ***`true`***
24. ***`triple-equals`*** - 使用`===`和`!==`替代`==`和`!=`
	```
	options: ["allow-null-check"]//allows == and != when comparing to null
	//还有另一项配置： "allow-undefined-check" - allows == and != when comparing to undefined，但recommend中并没有使用它
	```
25. ***`typeof-compare`*** - 确保`typeof`的结果是和`string`类型值进行比较 - ***`true`***
26. ***`use-isnan`*** - 强制使用`isNaN()`函数来检查`NaN`，而不是直接与`NaN`常量比较。 - ***`true`***

## Maintainability
这些规则使得代码更容易维护。

1. ***`cyclomatic-complexity`*** - 循环复杂度，用于度量函数复杂度的一个值。这个值比较高意味着代码可能会出错或者代码难以维护。- ***`false`***
2. ***`eofline`*** - 强制文件以一个新行结束。 - ***`true`***
3. ***`indent`*** - 强制使用tab键或者空格缩进 - ***`options: ["spaces"]`***
4. ***`max-classes-per-file`*** - 规定一个文件中不能有超过特定数目的类定义，遵循文件的单一职责原则. - ***`options: [1]`***
5. ***`max-line-length`*** - 规定一行不能超过特定的长度 - ***`options: [120]`***
6. ***`object-literal-sort-keys`*** - 强制在对象字面量里的所有键以字母排序。 - ***`true`***
7. ***`prefer-const`*** - 如果可以的话，变量声明优先使用`const`而不是`let` - ***`true`***
8. ***`trailing-comma`*** - **禁止**或**要求**在数组、对象字面量、解构赋值、函数、元祖类型、函数参数、命名导入(named imports)中，最后面留有一个逗号
		```
			options: {
	            multiline: "always",//checks multi-line object literals.
	            singleline: "never",//checks single-line object literals.
	        }
		```
	>如果一个数组的闭括号在最后一个元素的下一行，那么这个数组就是`multiline`。这个逻辑同样适用于
	对象字面量、解构赋值、函数、元祖类型、函数参数、命名导入。

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

1. ***`align`*** - 强制垂直对齐

	```
	options: [
  	"parameters",//checks alignment of function parameters.
  	"statements",// checks alignment of statements.
	        ]
	```

2. ***`array-type`*** - 对于数组，要求给他们添加`T[]`或`Array`类型。 [使用示范](https://github.com/palantir/tslint/blob/master/test/rules/array-type/array-simple/test.ts.lint) - ***`options: ["array-simple"/*enforces use of T[] if T is a simple type (primitive or type reference).*/]`***
3. ***`arrow-parens`*** - 要求用括号将箭头函数的参数包围起来。 - ***`true`***
4. ***`arrow-return-shorthand`*** - 建议将`() => { return x; }`用`() => x`代替 - ***`true`***
5. ***`callable-types`*** - An interface or literal type with just a call signature can be written as a function type.如果一个可调用接口中只有一个函数签名，那么可以直接将他重构为一个函数类型。 [可调用接口](https://www.typescriptlang.org/docs/handbook/interfaces.html) - ***`true`***
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
6. ***`class-name`*** - 强制使用帕斯卡命名法(PascalCased,亦即大写驼峰法)给类和接口命名 - ***`true`***
7. ***`comment-format`*** - 强制格式化单行注释 - ***`options: ["check-space"/* 要求所有单行注释必须以一个空格开头， 例如 // commment */]`***
10. ***`import-spacing`*** - 保证在导入语句中留有合适的空格 - ***`true`***
11. ***`interface-name`*** - 要求给接口名前加上I,但与[TypeScript官方指导原则](https://github.com/Microsoft/TypeScript/wiki/Coding-guidelines)相悖 - ***`options: ["always-prefix"]`***

12. ***`interface-over-type-literal`*** - 倾向使用接口声明代替类型字面量 (`type T = { ... }`),`type`关键字参阅 [ts高级类型](https://www.tslang.cn/docs/handbook/advanced-types.html) -  ***`true`***

	```js
	type C = { a: string, b?: number }
	function f({ a, b }: C): void {
	    // ...
	}
	```

13. ***`jsdoc-format`*** - Enforces basic format rules for JSDoc comments. 强制注释的格式满足JSDoc的要求 -  ***`true`***
	[JSDoc](http://usejsdoc.org/about-getting-started.html)
	>JSDoc's purpose is to document the API of your JavaScript application or library. It is assumed that you will want to document things like modules, namespaces, classes, methods, method parameters, and so on.

	JSDoc的注释要求以下几条规则，注释以/**开头:
	* 每行都有一个星号且星号要对齐
	* 除了第一个和最后一个星号，每个星号后面要么是空格要么是新的一行
	* 每一行的星号前面只能是空格
	* 单行注释必须以`/**`开头，以 `*/` 结尾

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
16. ***`new-parens`*** - 要求通过`new`关键字调用构造函数时使用括号。在JavaScript中，如果一个构造函数不需要参数，那么在new时，括号是可选的。  -  ***`true`***

	```js
	function Person(){
		this.name="liubin";
	}
	var p1=new Person();
	var p2=new Person;
	p1.name;// "liubin"
	p2.name;// "liubin"
	```

17. ***`no-angle-bracket-type-assertion`*** - 在进行类型断言时，要求使用`as Type`替换`<Type>`  -  ***`true`***
	[类型断言](https://www.typescriptlang.org/docs/handbook/basic-types.html)
	>The two samples are equivalent. Using one over the other is mostly a choice of preference; however, when using TypeScript with JSX, only as-style assertions are allowed.两种写法都是等价的，但是如果将ts和JSX搭配使用，只有as-style 这种格式的断言是被允许的。
19. ***`no-consecutive-blank-lines`*** - Disallows one or more blank lines in a row.不允许连续的空行  -  ***`true`***
	```
	//for example
	const x = "x";


	const y = "y";
	```
20. ***`no-parameter-properties`*** - Disallows parameter properties in class constructors.不允许在类构造器中定义参数属性  -  ***`false`***
	>Parameter properties can be confusing to those new to TS as they are less explicit than other ways of declaring and initializing class members.参数属性对ts的初学者具有迷惑性，因为这种语法比显示定义一个类成员然后初始化它更隐晦。

	```
	constructor(public x:number){}// 定义参数属性
	```
21. ***`no-trailing-whitespace`*** - Disallows trailing whitespace at the end of a line. 不允许在每行的末尾有空格 -  ***`true`***
	>Sometimes in the course of editing files, you can end up with extra whitespace at the end of lines. These whitespace differences can be picked up by source control systems and flagged as diffs, causing frustration for developers. While this extra whitespace causes no functional issues, many code conventions require that trailing spaces be removed before check-in.在代码管理系统中，每行末尾多余的一些空格会被当做是文件的更新，别人在接收代码时会有疑惑。这种空格完全是多余的，很多代码规范都会禁止它。

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
22. ***`no-unnecessary-initializer`*** - 禁止一个`var/let`语句或者解构初始化语句里面的变量被初始化为`undefined`。[更详细的参考](https://github.com/palantir/tslint/blob/master/test/rules/no-unnecessary-initializer/test.ts.lint)  -  ***`true`***
24. ***`object-literal-key-quotes`*** - 强制在对象字面量的属性上使用一致风格的引号 - ***`options: ["consistent-as-needed"/* 如果有属性的名字需要引号，那么全部的属性也加引号。否则，全都不加 */]`***
25. ***`object-literal-shorthand`*** - Enforces use of ES6 object literal shorthand when possible.如果可能的话，强制使用es6中的对象字面量简写方法  -  ***`true`***

	>EcmaScript 6 provides a concise form for defining object literal methods and properties. This syntax can make defining complex object literals much cleaner.ES6提供了一种定义对象字面量的简写方法，使得阅读和书写更清晰。	[object-literal-shorthand](http://eslint.org/docs/rules/object-shorthand)

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
26. ***`one-line`*** - Requires the specified tokens to be on the same line as the expression preceding them.要求一些特定的标识符位于同一行。
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
27. ***`one-variable-per-declaration`*** - 禁止在同一个声明语句中声明多个变量 - ***`options: ["ignore-for-loop"/*允许在for循环里同时定义多个变量 */]`***

	```
	let a, b = 10; // 不要这么写，有一定歧义。 a= ????

	// 可以这么替代
	let a;
	let b=10;
	```

28. ***`ordered-imports`*** - 要求导入语句以字母序排序,与angular2官网规范一致
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

31. ***`quotemark`*** - 要求字符串字面量使用一致的单引号或者双引号
	```
	options: [
        "double",// 强制使用双引号
        "avoid-escape",// 允许在需要转译的引号的字符串中出现“其他”风格的引号。例如在'Hello "World"'中，就允许出现两种风格的引号。
    ]
	```
32. ***`semicolon`*** - 强制在每条语句之后有一致的分号用法 - ***`options: ["always"/*每条语句都以分号结尾*/]`***
33. ***`space-before-function-paren`*** - Require or disallow a space before function parenthesis.函数的圆括号前是否需要空格。PS：这个规则反正就是各种空格什么的，不需要太关心哪里加哪里不加，警告时一看就会明白。
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

34. ***`variable-name`*** - 变量名拼写检查
	```js
	options: [
       "ban-keywords",//不允许使用特定的ts关键字当做变量或者参数名。	黑名单: any, Number, number, String, string, Boolean, boolean, Undefined, undefined

       "check-format",//只允许小驼峰或者UPPER_CASED形式的变量名
       "allow-pascal-case",//除了小驼峰还允许PascalCase帕斯卡命名（除了类名接口名这些，不知道在哪里还需要PascalCase命名。。。）

       // 还有几个推荐规则中没有加上的：
       "allow-leading-underscore", // 允许开头的下划线，例如 _test
       "allow-trailing-underscore", // 允许结尾的下划线，例如 `test_`
       "allow-snake-case", // 允许蛇形写法， test_1，  TEST_1
    ]
	```

35. ***`whitespace`*** - Enforces whitespace style conventions.
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

## tslint官网推荐的配置
* [tslint:recommend](https://github.com/palantir/tslint/blob/master/src/configs/recommended.ts)
* [tslint:latest](https://github.com/palantir/tslint/blob/master/src/configs/recommended.ts)

## CodeLyzer推荐规则

**安装** - 我们的项目中使用的版本是`3.1.0`，安装命令：

```js
npm i codelyzer@3.1.0 tslint@^5.8.0 typescript@^2.5.3 @angular/core@4.1.3 @angular/compiler@4.1.3 rxjs@5.4.0 zone.js@0.8.12
```

以下基于[Angular风格指南](https://angular.io/styleguide)

1. ***`directive-selector`***: [true, "attribute", ["dir-prefix1", "dir-prefix2"], "camelCase"] - 指令选择器前缀，个人推荐使用 `crm`作为前缀
2. ***`component-selector`***: [true, "element", ["cmp-prefix1", "cmp-prefix2"], "kebab-case"] - 组件名前缀
3. ***`use-input-property-decorator`***: true, - 使用 @Input()
4. ***`use-output-property-decorator`***: true, - 使用@Output()
5. ***`use-host-property-decorator`***: true, - 使用@HostBinding 或 @HostListener
6. ***`no-attribute-parameter-decorator`***: true, - 不使用@Attribute，使用@Input
7. ***`no-input-rename`***: true, - 不允许 @Input('alias') inputName;
8. ***`no-output-rename`***: true, -  不允许 @Output('alias') inputName;
9. ***`no-forward-ref`***: true, - 不允许 forwardRef

	```js
	constructor(@Inject(forwardRef(() => Lock)) lock: Lock) { this.lock = lock; }
	```
10. ***`use-life-cycle-interface`***: true, - 使用生命周期接口，例如

	```js
	class YourComponent implements OnInit{
		ngOnInit(){}
	}
	```
11. ***`use-pipe-transform-interface`***: true, - 管道实现`PipeTransform`接口

	```js
	class YourPipe implements PipeTransform{
		transform(){}
	}
	```
12. ***`component-class-suffix`***: [true, "Component"], - 组件名后缀
13. ***`directive-class-suffix`***: [true, "Directive"], - 指令名后缀
14. ***`templates-use-public`***: true, - 模板中使用的属性和方法需要是组件中的public成员
15. ***`no-access-missing-member`***: true, - 模板中不能使用组件中不存在的成员
16. ***`invoke-injectable`***: true - @Injectable()的括号不能丢

[Codelyzer规则全集](http://codelyzer.com/rules/)

## 推荐一组协助tslint工作的vscode配置

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


