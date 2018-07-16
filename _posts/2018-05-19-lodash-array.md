---
title: "lodash源码学习之Array篇"
img: sweden.jpg # Add image post (optional)
date: 2018-05-19 10:30:00 +0800
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
tag: [lodash]
---

# 源码阅读经验

`lodash`的代码分为两大块： 一个是`.internal`目录里的文件，这些是`lodash`内部使用的『基础函数』，不会暴露在全局的`lodash`对象上；其他的文件都在根目录下，每个函数对应一个文件，这些都会挂在`lodash/_`下，我习惯称为『外部函数』。

『外部函数』通常会依赖一些『基础函数』，而『基础函数』很少有依赖，自成一统。`lodash`通过这种方式最大化使代码复用。

[TOC]

# Array

整理了一下`Array`类别下『外部函数』与『基础函数』的对应关系，画个图：

**`lodash-array-part1`**

![]({{site.url}}/assets/img/Lodash-Array/lodash-array-part1.png)

**`lodash-array-part2`**

![]({{site.url}}/assets/img/Lodash-Array/lodash-array-part2.png)

## concat

```js
_.concat([1], [2], [3, 4]);
// => [1,2,3,4]

_.concat([1], 2, [3], [[4]]);
// => [1,2,3,[4]]
```

**源码**

```js
/**
 * Creates a new array concatenating `array` with any additional arrays
 * and/or values.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Array
 * @param {Array} array The array to concatenate.
 * @param {...*} [values] The values to concatenate.
 * @returns {Array} Returns the new concatenated array.
 * @example
 *
 * var array = [1];
 * var other = _.concat(array, 2, [3], [[4]]);
 *
 * console.log(other);
 * // => [1, 2, 3, [4]]
 *
 * console.log(array);
 * // => [1]
 */
function concat() {
  var length = arguments.length;
  if (!length) {
    return [];
  }
  var args = Array(length - 1),
    array = arguments[0],
    index = length;

  while (index--) {
    args[index - 1] = arguments[index];
  }
  // 使用Array.isArray来判断是否为数组，避免多个Frame问题
  // baseFlatten(args,1)功能大体上类似把args中所有元素全部串联起来(concat)
  return arrayPush(isArray(array) ? copyArray(array) : [array], baseFlatten(args, 1));
}
```

## difference

**示范：**

```js
_.difference([2, 1], [2, 3]); // [1]
_.difference([2, 1], [2, 2], [2, 3]); // [1]
```

**源码**

```js
function difference(array, ...values) {
  // 先用baseFlatten把values数组打平，然后比较两个打平后的数组
  return isArrayLikeObject(array) ? baseDifference(array, baseFlatten(values, 1, isArrayLikeObject, true)) : [];
}
```

**baseFlatten**

```js
/**
 * The base implementation of `flatten` with support for restricting flattening.
 *
 * @private
 * @param {Array} array The array to flatten.
 * @param {number} depth The maximum recursion depth.
 * @param {boolean} [predicate=isFlattenable] The function invoked per iteration.
 * @param {boolean} [isStrict] Restrict to values that pass `predicate` checks.
 * @param {Array} [result=[]] The initial result value.
 * @returns {Array} Returns the new flattened array.
 */
function baseFlatten(array, depth, predicate, isStrict, result) {
  predicate || (predicate = isFlattenable); //isFlattenable 判断是否为可平摊的对象，如数组和arguments
  result || (result = []);

  if (array == null) {
    return result;
  }

  for (const value of array) {
    if (depth > 0 && predicate(value)) {
      if (depth > 1) {
        // Recursively flatten arrays (susceptible to call stack limits).
        baseFlatten(value, depth - 1, predicate, isStrict, result);
      } else {
        // depth === 1,将可平摊对象打平然后放到result中
        result.push(...value);
      }
    } else if (!isStrict) {
      // 如果不要求严格通过predicate，那么不管是predicate条件不满足还是depth =0, 都直接放到result末尾，无需打平。
      result[result.length] = value;
    }
  }
  return result;
}
```

**baseDifference**

```js
/**
 * The base implementation of methods like `difference` without support
 * for excluding multiple arrays.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Array} values The values to exclude.
 * @param {Function} [iteratee] The iteratee invoked per element.
 * @param {Function} [comparator] The comparator invoked per element.
 * @returns {Array} Returns the new array of filtered values.
 */
function baseDifference(array, values, iteratee, comparator) {
  let includes = arrayIncludes;
  let isCommon = true;
  const result = [];
  const valuesLength = values.length;

  if (!array.length) {
    return result;
  }
  if (iteratee) {
    values = map(values, value => iteratee(value));
  }
  if (comparator) {
    includes = arrayIncludesWith;
    isCommon = false;
  } else if (values.length >= LARGE_ARRAY_SIZE) {
    // 数组较大时使用Set进行查找
    includes = cacheHas;
    isCommon = false;
    values = new SetCache(values);
  }
  // 找到array中所有不在values中的元素
  outer: for (let value of array) {
    const computed = iteratee == null ? value : iteratee(value);

    value = comparator || value !== 0 ? value : 0;
    // computed === computed 只有在NaN时才不成立
    if (isCommon && computed === computed) {
      // 在values中查找是否存在computed
      let valuesIndex = valuesLength;
      while (valuesIndex--) {
        if (values[valuesIndex] === computed) {
          continue outer;
        }
      }
      result.push(value); // 最终放到result的是原始的value，而不是可能被转化过的computed
    } else if (!includes(values, computed, comparator)) {
      // 利用comparator来进行查找
      result.push(value);
    }
  }
  return result;
}
```

## dropRightWhile、dropWhile

**示范**

```js
var users = [{ user: 'barney', active: true }, { user: 'fred', active: false }, { user: 'pebbles', active: false }];
_.dropRightWhile(users, function(o) {
  return !o.active;
});
// => objects for ['barney']
// The `_.matches` iteratee shorthand.
_.dropRightWhile(users, { user: 'pebbles', active: false });
// => objects for ['barney', 'fred']
// The `_.matchesProperty` iteratee shorthand.
_.dropRightWhile(users, ['active', false]);
// => objects for ['barney']
// The `_.property` iteratee shorthand.
_.dropRightWhile(users, 'active');
// => objects for ['barney', 'fred', 'pebbles']
```

```js
var users = [{ user: 'barney', active: false }, { user: 'fred', active: false }, { user: 'pebbles', active: true }];
_.dropWhile(users, function(o) {
  return !o.active;
});
// => objects for ['pebbles']
// The `_.matches` iteratee shorthand.
_.dropWhile(users, { user: 'barney', active: false });
// => objects for ['fred', 'pebbles']
// The `_.matchesProperty` iteratee shorthand.
_.dropWhile(users, ['active', false]);
// => objects for ['pebbles']
// The `_.property` iteratee shorthand.
_.dropWhile(users, 'active');
// => objects for ['barney', 'fred', 'pebbles']
```

**源码**

```js
function dropRightWhile(array, predicate) {
  return array != null && array.length ? baseWhile(array, predicate, true, true) : [];
}

function dropWhile(array, predicate) {
  return array != null && array.length ? baseWhile(array, predicate, true) : [];
}
```

底层都是用的同一个`baseWhile`函数：

```js
/**
 * The base implementation of methods like `dropWhile` and `takeWhile`.
 *
 * @private
 * @param {Array} array The array to query.
 * @param {Function} predicate The function invoked per iteration.
 * @param {boolean} [isDrop] Specify dropping elements instead of taking them.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Array} Returns the slice of `array`.
 */
function baseWhile(array, predicate, isDrop, fromRight) {
  const { length } = array;
  let index = fromRight ? length : -1;

  // 先遍历到第一个不满足predicte的地方，或者直接遍历完数组
  while ((fromRight ? index-- : ++index < length) && predicate(array[index], index, array)) {}

  // 根据isDrop、fromRight的取值来决定接下来往取array中的哪些范围数据
  return isDrop
    ? slice(array, fromRight ? 0 : index, fromRight ? index + 1 : length)
    : slice(array, fromRight ? index + 1 : 0, fromRight ? length : index);
}
```

## `flattern`、`flatternDeep`

底层也是用的`baseFlattern`函数，见`difference`

## `indexOf`

```js
_.indexOf([1, 2, 1, 2], 2);
// => 1
// Search from the `fromIndex`.
_.indexOf([1, 2, 1, 2], 2, 2);
// => 3
```

**源码**

```js
function indexOf(array, value, fromIndex) {
  const length = array == null ? 0 : array.length;
  if (!length) {
    return -1;
  }
  let index = fromIndex == null ? 0 : +fromIndex;
  if (index < 0) {
    index = Math.max(length + index, 0);
  }
  return baseIndexOf(array, value, index);
}
```

主要是要考虑 NaN 的情况.

```js
/**
 * The base implementation of `indexOf` without `fromIndex` bounds checks.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseIndexOf(array, value, fromIndex) {
  // value === value 在NaN的情况下不成立
  //baseFindIndex(array, baseIsNaN, fromIndex)  用于在数组中查找第一个NaN
  return value === value ? strictIndexOf(array, value, fromIndex) : baseFindIndex(array, baseIsNaN, fromIndex);
}
```

## `intersection`、`intersectionBy`、`intersectionWith`

```js
_.intersection([2, 1], [2, 3]);
// => [2]

_.intersectionBy([2.1, 1.2], [2.3, 3.4], Math.floor);
// => [2.1]

var objects = [{ x: 1, y: 2 }, { x: 2, y: 1 }];
var others = [{ x: 1, y: 1 }, { x: 1, y: 2 }];
_.intersectionWith(objects, others, _.isEqual);
// => [{ 'x': 1, 'y': 2 }]
```

**源码**

大致思路： 迭代第一个参数数组，看看每一个元素在其他参数数组中是否存在，如果都存在就放在交集中。在判断是否存在时，会根据情况使用 Set/Map 或者数组进行查找。同时第一个数组中的元素也要去重。

```js
/**
 * The base implementation of methods like `intersection` that accepts an
 * array of arrays to inspect.
 *
 * @private
 * @param {Array} arrays The arrays to inspect.
 * @param {Function} [iteratee] The iteratee invoked per element.
 * @param {Function} [comparator] The comparator invoked per element.
 * @returns {Array} Returns the new array of shared values.
 */
function baseIntersection(arrays, iteratee, comparator) {
  const includes = comparator ? arrayIncludesWith : arrayIncludes;
  const length = arrays[0].length;
  const othLength = arrays.length;
  const caches = new Array(othLength);
  const result = [];

  let array;
  let maxLength = Infinity;
  let othIndex = othLength;

  // 尝试转换arrays,并视情况是否是否Set缓存
  while (othIndex--) {
    array = arrays[othIndex];
    if (othIndex && iteratee) {
      array = map(array, value => iteratee(value));
    }
    maxLength = Math.min(array.length, maxLength);
    // 120作为分界线，小于120使用数组的includes进行查找，大于120使用SetCache
    // 在迭代到arrays[0]时，caches[0]始终是一个空的SetCache
    caches[othIndex] = !comparator && (iteratee || (length >= 120 && array.length >= 120)) ? new SetCache(othIndex && array) : undefined;
  }
  array = arrays[0];

  let index = -1;
  // 只取arrays[0]中的元素当做Set缓存。 seen的作用是给arrays[0]中的元素去重
  // _.intersection([2,2],[2]) => [2]
  const seen = caches[0];

  // 此处循环的大概思路是： 迭代arrays[0]中的每一个元素，先看看这个元素是不是一个在arrays[0]中本身就重复；
  // 如果不是，那么再依次查看arrays中其他数组，看看是否在其他每一个数组中都存在；
  // 如果在arrays每个子数组中都存在，那么就是一个放到交集中去
  // 在判断是否存在时，会依情况使用数组或者set
  outer: while (++index < length && result.length < maxLength) {
    let value = array[index];
    const computed = iteratee ? iteratee(value) : value;

    value = comparator || value !== 0 ? value : 0;
    // 如果computed在result结果集中不存在，或者在当前set缓存中不存在
    // 注意： 这里判断的是经iteratee转换的computed，而不是原始的value
    if (!(seen ? cacheHas(seen, computed) : includes(result, computed, comparator))) {
      // 那么看看参数arrays中其他数组里有没有computed
      othIndex = othLength;
      while (--othIndex) {
        const cache = caches[othIndex];
        // 只要其中一个不包含computed，直接退出此轮查找
        if (!(cache ? cacheHas(cache, computed) : includes(arrays[othIndex], computed, comparator))) {
          continue outer;
        }
      }
      if (seen) {
        seen.push(computed); // 更新cache，如果后面有相同的元素出现，直接跳过
      }
      result.push(value);
    }
  }
  return result;
}
```

## pull、pullAll、pullAllBy、pullAllWith

```js
var array = ['a', 'b', 'c', 'a', 'b', 'c'];
_.pull(array, 'a', 'c');
console.log(array);
// => ['b', 'b']

var array = ['a', 'b', 'c', 'a', 'b', 'c'];
_.pullAll(array, ['a', 'c']);
console.log(array);
// => ['b', 'b']

var array = [{ x: 1 }, { x: 2 }, { x: 3 }, { x: 1 }];
_.pullAllBy(array, [{ x: 1 }, { x: 3 }], 'x');
console.log(array);
// => [{ 'x': 2 }]

var array = [{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }];
_.pullAllWith(array, [{ x: 3, y: 4 }], _.isEqual);
console.log(array);
// => [{ 'x': 1, 'y': 2 }, { 'x': 5, 'y': 6 }]
```

**源码**

底层用到了一个共同的函数`basePullAll`：

```js
/**
 * The base implementation of `pullAllBy`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to remove.
 * @param {Function} [iteratee] The iteratee invoked per element.
 * @param {Function} [comparator] The comparator invoked per element.
 * @returns {Array} Returns `array`.
 */
function basePullAll(array, values, iteratee, comparator) {
  const indexOf = comparator ? baseIndexOfWith : baseIndexOf;
  const length = values.length;

  let index = -1;
  let seen = array;

  if (array === values) {
    values = copyArray(values);
  }
  // seen数组的目的是为了保护array不被iteratee改变
  if (iteratee) {
    seen = map(array, value => iteratee(value));
  }
  while (++index < length) {
    let fromIndex = 0;
    const value = values[index];
    const computed = iteratee ? iteratee(value) : value;

    // 从array、seen中删除所有computed，因为这里是先根据内容找到匹配的元素再进行删除，而不是直接删除指定索引处的元素，所以对查找删除的方向并不敏感
    while ((fromIndex = indexOf(seen, computed, fromIndex, comparator)) > -1) {
      // 在有iteratee时，if分支成立。没有iteratee时，seen和array指向同一个地方
      if (seen !== array) {
        seen.splice(fromIndex, 1);
      }
      array.splice(fromIndex, 1);
    }
  }
  return array;
}
```

## pullAt

```js
var array = ['a', 'b', 'c', 'd'];
var pulled = _.pullAt(array, [1, 3]);
console.log(array);
// => ['a', 'c']
console.log(pulled);
// => ['b', 'd']
```

对应的核心文件是`basePullAt`:

```js
/**
 * The base implementation of `pullAt` without support for individual
 * indexes or capturing the removed elements.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {number[]} indexes The indexes of elements to remove.
 * @returns {Array} Returns `array`.
 */
function basePullAt(array, indexes) {
  let length = array ? indexes.length : 0;
  const lastIndex = length - 1;

  while (length--) {
    let previous;
    const index = indexes[length];
    // 如果是最后一个，或者和前一个不相等，那么表示array中有一个新元素需要被删除
    // previous的作用是为了不重复删除某个位置的数据，如indexes = [1,3,3]时，array[3]处的元素只会
    // 被删除一次。
    if (length == lastIndex || index !== previous) {
      previous = index;
      if (isIndex(index)) {
        // 这里在删除时，有一个技巧，就是从后往前删的，即indexes是一个递增序列。
        // 例如array=[0,1,2,3], indexes=[1,2]，那么先删array[2]再删array[1]是没问题的，即删掉了数字1和2
        // 但是如果indexes = [2,1]，那么先删array[1]之后，array[2]所指的元素不再是2了，就会出问题。
        array.splice(index, 1);
      } else {
        baseUnset(array, index);
      }
    }
  }
  return array;
}
```

## sortedIndex、sortedIndexBy、sortedIndexOf、sortedLastIndex、sortedLastIndexBy、sortedLastIndexOf

- [ ] TODO

## sortedUniq、sortedUniqBy

```js
_.sortedUniq([1, 1, 2]);
// => [1, 2]

_.sortedUniqBy([1.1, 1.2, 2.3, 2.4], Math.floor);
// => [1.1, 2.3]
```

**源码**
二者都是用到一个工具函数`baseSortedUniq`:

```js
/**
 * The base implementation of `sortedUniq` and `sortedUniqBy`.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} [iteratee] The iteratee invoked per element.
 * @returns {Array} Returns the new duplicate free array.
 */
function baseSortedUniq(array, iteratee) {
  let seen;
  let index = -1;
  let resIndex = 0;

  const { length } = array;
  const result = [];

  while (++index < length) {
    const value = array[index],
      computed = iteratee ? iteratee(value) : value;
    // eq函数可以处理NaN的判等
    if (!index || !eq(computed, seen)) {
      // seen是一个游标，记录着遍历array过程中，当前最后一个与它之前元素不相等的元素。
      // 如array=[1,2,3,3,3,4,4,5],在index = 5时，seen就是3（array[2]），因为array[2]=3，array[1] =2。
      seen = computed;
      result[resIndex++] = value === 0 ? 0 : value;
    }
  }
  return result;
}
```

其中的`eq`函数值得注意，它考虑了`NaN`的情况：

```js
/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * const object = { 'a': 1 }
 * const other = { 'a': 1 }
 *
 * eq(object, object)
 * // => true
 *
 * eq(object, other)
 * // => false
 *
 * eq('a', 'a')
 * // => true
 *
 * eq('a', Object('a'))
 * // => false
 *
 * eq(NaN, NaN)
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}
```

## union、unionBy、unionWith、uniq、uniqBy、uniqWith

union 取并集、uniq 去重

```js
_.union([2], [1, 2]);
// => [2, 1]

_.uniqBy([2.1, 1.2, 2.3], Math.floor);
// => [2.1, 1.2]
var objects = [{ x: 1, y: 2 }, { x: 2, y: 1 }];
var others = [{ x: 1, y: 1 }, { x: 1, y: 2 }];
_.unionWith(objects, others, _.isEqual);
// => [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }, { 'x': 1, 'y': 1 }]
```

**源码**
union 操作符的思路都是先将所有参数数组打平合并到一个大数组里，然后对这个大数组去重。
uniq 的参数直接就是一个大数组

```js
function union(...arrays) {
  return baseUniq(baseFlatten(arrays, 1, isArrayLikeObject, true));
}
```

```js
/** Used as the size to enable large array optimizations. */
const LARGE_ARRAY_SIZE = 200;

/**
 * The base implementation of `uniqBy`.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} [iteratee] The iteratee invoked per element.
 * @param {Function} [comparator] The comparator invoked per element.
 * @returns {Array} Returns the new duplicate free array.
 */
function baseUniq(array, iteratee, comparator) {
  let index = -1;
  let includes = arrayIncludes;
  let isCommon = true;

  const { length } = array;
  const result = [];
  // 一个缓存，用于判断array当前迭代的元素在此前是否出现
  let seen = result;

  if (comparator) {
    isCommon = false;
    includes = arrayIncludesWith;
  } else if (length >= LARGE_ARRAY_SIZE) {
    const set = iteratee ? null : createSet(array);
    if (set) {
      return setToArray(set); // 如果Set可用，直接利用Set转数组来去重
    }
    isCommon = false;
    includes = cacheHas;
    seen = new SetCache();
  } else {
    // 如果有iteratee，那么seen中存放的是iteratee转换过的数据，而result中存放的是最终的原始数据
    seen = iteratee ? [] : result;
  }
  outer: while (++index < length) {
    let value = array[index];
    const computed = iteratee ? iteratee(value) : value;

    value = comparator || value !== 0 ? value : 0;
    if (isCommon && computed === computed) {
      // 查看computed是否已经在它之前出现过
      let seenIndex = seen.length;
      while (seenIndex--) {
        if (seen[seenIndex] === computed) {
          continue outer;
        }
      }
      if (iteratee) {
        seen.push(computed); // 存放转换后数据
      }
      result.push(value); // 存放原始数据
    } else if (!includes(seen, computed, comparator)) {
      if (seen !== result) {
        seen.push(computed);
      }
      result.push(value);
    }
  }
  return result;
}
```

## zip、unzip

```js
var zipped = _.zip(['a', 'b'], [1, 2], [true, false]);
// => [['a', 1, true], ['b', 2, false]]
_.unzip(zipped);
// => [['a', 'b'], [1, 2], [true, false]]

// 注意这里，
// _.unzip([['a', 'b'], [1, 2], [true, false]])
// => [['a', 1, true], ['b', 2, false]]
// 这个结果直接与_.zip(['a', 'b'], [1, 2], [true, false])相同~
// 即 zip(arr1,arr2,arr3) === unzip([arr1,arr2,arr3])
```

**源码**

```js
/**
 * This method is like `zip` except that it accepts an array of grouped
 * elements and creates an array regrouping the elements to their pre-zip
 * configuration.
 *
 * @since 1.2.0
 * @category Array
 * @param {Array} array The array of grouped elements to process.
 * @returns {Array} Returns the new array of regrouped elements.
 * @see unzipWith, zip, zipObject, zipObjectDeep, zipWith
 * @example
 *
 * const zipped = zip(['a', 'b'], [1, 2], [true, false])
 * // => [['a', 1, true], ['b', 2, false]]
 *
 * unzip(zipped)
 * // => [['a', 'b'], [1, 2], [true, false]]
 */
function unzip(array) {
  if (!(array != null && array.length)) {
    return [];
  }
  let length = 0; // 所有子数组中最大的长度
  // 过滤所有非数组
  array = filter(array, group => {
    if (isArrayLikeObject(group)) {
      length = Math.max(group.length, length);
      return true;
    }
  });
  let index = -1;
  const result = new Array(length);
  // result数组中每一个元素均为一个数组，这个子数组是由array中每个元素对应位置的元素组成的
  // 联想rxjs中的zip、unzip操作符
  //     ----a1----------a2-----------a3---
  //     ----b1----------b2-----------b3---
  //     ----c1----------c2-----------c3---
  //            |               ^
  //           zip              |
  //            |             unzip
  //            v               |
  //     ---[a1,b1,c1]---[a2,b2,c2]---[a3,b3,c3]---
  while (++index < length) {
    result[index] = map(array, baseProperty(index));
  }
  return result;
}
```

```js
function zip(...arrays) {
  return unzip(arrays);
}
```

**unzipWith、zipWith**

**源码**

```js
// 先将array进行unzip，然后针对结果集数组的每个子元素应用iteratee即可。
function unzipWith(array, iteratee) {
  if (!(array != null && array.length)) {
    return [];
  }
  const result = unzip(array);
  return map(result, group => iteratee.apply(undefined, group));
}

function zipWith(...arrays) {
  // 参数校验及预处理
  const length = arrays.length;
  let iteratee = length > 1 ? arrays[length - 1] : undefined;
  iteratee = typeof iteratee == 'function' ? (arrays.pop(), iteratee) : undefined;
  return unzipWith(arrays, iteratee);
}
```

## zipObjectDeep

- [ ] TODO

## xor、xorBy、xorWith

```js
_.xor([2, 1], [2, 3]);
// => [1, 3]

_.xor([2, 1], [2, 3]，[3,4]);
// => [1,4]

_.xorBy([2.1, 1.2], [2.3, 3.4], Math.floor);
// => [1.2, 3.4]

var objects = [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }];
var others = [{ 'x': 1, 'y': 1 }, { 'x': 1, 'y': 2 }];

_.xorWith(objects, others, _.isEqual);
// => [{ 'x': 2, 'y': 1 }, { 'x': 1, 'y': 1 }]
```

**源码**

底层都是用的同一个`baseXor`函数

```js
/**
 * The base implementation of methods like `xor` which accepts an array of
 * arrays to inspect.
 *
 * @private
 * @param {Array} arrays The arrays to inspect.
 * @param {Function} [iteratee] The iteratee invoked per element.
 * @param {Function} [comparator] The comparator invoked per element.
 * @returns {Array} Returns the new array of values.
 */
function baseXor(arrays, iteratee, comparator) {
  const length = arrays.length;
  if (length < 2) {
    return length ? baseUniq(arrays[0]) : [];
  }
  let index = -1;
  const result = new Array(length);

  /**
   * result[index]记录arrays[index]与其他所有数组的差异
   * 例如arrays=[[2,1],[2,3],[3,4]]，result[0]的计算步骤，
   * 先比较  [2,1]和[2,3]的差异，得到[1]
   * 再比较  [1]和[3]的差异， 结果还是[1]. 那么result[0] = [1];
   *
   * 同理可得result[1] = []; result[2] = [4];
   * 最终函数的结果就是[1,4].
   */
  while (++index < length) {
    const array = arrays[index];
    let othIndex = -1;

    while (++othIndex < length) {
      if (othIndex != index) {
        result[index] = baseDifference(result[index] || array, arrays[othIndex], iteratee, comparator);
      }
    }
  }
  // result打平去重
  return baseUniq(baseFlatten(result, 1), iteratee, comparator);
}
```
