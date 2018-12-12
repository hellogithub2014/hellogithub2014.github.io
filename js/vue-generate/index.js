/* @flow */

import { genHandlers } from './events'
import baseDirectives from '../directives/index'
import { camelize, no, extend } from 'shared/util'
import { baseWarn, pluckModuleFunction } from '../helpers'

type TransformFunction = (el: ASTElement, code: string) => string
type DataGenFunction = (el: ASTElement) => string
type DirectiveFunction = (el: ASTElement, dir: ASTDirective, warn: Function) => boolean

export class CodegenState {
  options: CompilerOptions
  warn: Function
  transforms: Array<TransformFunction>
  dataGenFns: Array<DataGenFunction>
  directives: { [key: string]: DirectiveFunction }
  maybeComponent: (el: ASTElement) => boolean
  onceId: number
  staticRenderFns: Array<string>

  constructor (options: CompilerOptions) {
    this.options = options
    this.warn = options.warn || baseWarn
    this.transforms = pluckModuleFunction(options.modules, 'transformCode') // 一个空数组
    // 目前只有class和style中有定义genData,位于src/platforms/web/compiler/modules文件夹
    this.dataGenFns = pluckModuleFunction(options.modules, 'genData')
    // baseDirectives目前包含on、cloak和bind
    // options.directives在web端包含v-html、v-model、v-text3个
    this.directives = extend(extend({}, baseDirectives), options.directives)
    const isReservedTag = options.isReservedTag || no
    this.maybeComponent = (el: ASTElement) => !isReservedTag(el.tag)
    this.onceId = 0
    this.staticRenderFns = []
  }
}

export type CodegenResult = {
  render: string,
  staticRenderFns: Array<string>
}

export function generate (ast: ASTElement | void, options: CompilerOptions): CodegenResult {
  const state = new CodegenState(options)
  const code = ast ? genElement(ast, state) : '_c("div")'
  return {
    render: `with(this){return ${code}}`,
    staticRenderFns: state.staticRenderFns
  }
}
export function genElement (el: ASTElement, state: CodegenState): string {
  if (el.staticRoot && !el.staticProcessed) {
    // staticRoot：自身是static的，且有且只有一个text子节点
    return genStatic(el, state)
  } else if (el.once && !el.onceProcessed) {
    // v-once
    return genOnce(el, state)
  } else if (el.for && !el.forProcessed) {
    // v-for
    return genFor(el, state)
  } else if (el.if && !el.ifProcessed) {
    // v-if
    return genIf(el, state)
  } else if (el.tag === 'template' && !el.slotTarget) {
    // <template></template>
    return genChildren(el, state) || 'void 0'
  } else if (el.tag === 'slot') {
    // <slot></slot>
    return genSlot(el, state)
  } else {
    // component or element
    let code
    // 处理节点的is属性会将对应值设置到component属性上.
    if (el.component) {
      code = genComponent(el.component, el, state)
    } else {
      // 如果el.plain是true，说明该结点没有属性。
      // data格式示范： "{attrs:{"id":"app"}}"
      const data = el.plain ? undefined : genData(el, state)

      const children = el.inlineTemplate ? null : genChildren(el, state, true)
      // _c函数的第二个参数data就是模板解析时添加到节点上的那些属性
      code = `_c('${el.tag}'${
        data ? `,${data}` : '' // data
      }${
        children ? `,${children}` : '' // children
      })`
    }
    // module transforms，目前的vue中transforms还只是空数组，可忽略
    for (let i = 0; i < state.transforms.length; i++) {
      code = state.transforms[i](el, code)
    }
    return code
  }
}

// hoist static sub-trees out
function genStatic (el: ASTElement, state: CodegenState): string {
  el.staticProcessed = true
  state.staticRenderFns.push(`with(this){return ${genElement(el, state)}}`)
  return `_m(${state.staticRenderFns.length - 1}${el.staticInFor ? ',true' : ''})`
}

function genOnce (el: ASTElement, state: CodegenState): string {
  el.onceProcessed = true
  // 若节点上同时还有v-if，那么先调用v-if
  if (el.if && !el.ifProcessed) {
    return genIf(el, state)
  } else if (el.staticInFor) {
    // 若祖先元素有v-for，那么staticInFor会被设置
    let key = ''
    let parent = el.parent
    // 找到v-for祖先元素上设置的key属性
    while (parent) {
      if (parent.for) {
        key = parent.key
        break
      }
      parent = parent.parent
    }
    if (!key) {
      process.env.NODE_ENV !== 'production' && state.warn(`v-once can only be used inside v-for that is keyed. `)
      // 没有key，则此时的v-once会失效
      return genElement(el, state)
    }
    // 有key，v-once发挥作用，_o为markOnce方法
    return `_o(${genElement(el, state)},${state.onceId++},${key})`
  } else {
    return genStatic(el, state)
  }
}

/**
 * 若template为
 * <div id="app">
    <p v-if="value == 1">v-if块的内容</p>
    <p v-else-if="value == 2">v-else-if块的内容</p>
    <p v-else>v-else块的内容</p>
  </div>

  则此时el为：
  {
    type: 1,
    tag: 'div',
    plain: false,
    children: [{ // 注释此时div#app只有一个child，而不是3个
      type: 1,
      tag: 'p',
      children: [{
        text: 'v-if块的内容',
        type: 3
      }]
      if: 'value == 1',
      ifConditions: [{
        exp: "value == 1",
        block: {
        type: 1,
        tag: 'p',
        children: [{
          text: 'v-if块的内容',
          type: 3
        }],
        if: 'value == 1',
        ifConditions: [],
        plain: true
      }
      }, {
        exp: "value == 2",
        block: {
        type: 1,
        tag: 'p',
        children: [{
          text: 'v-else-if块的内容',
          type: 3
        }],
        elseif: 'value == 2',
        plain: true
      }
      }, {
        exp: undefined,
        block: {
        type: 1,
        tag: 'p',
        children: [{
          text: 'v-else块的内容',
          type: 3
        }],
        else: true,
        plain: true
      }
      }]
    }]
  }
 *
 * @author liubin.frontend
 * @export
 * @param {*} el
 * @param {CodegenState} state
 * @param {Function} [altGen]
 * @param {string} [altEmpty]
 * @returns {string} 示范："(value == 1)?_c('p',[_v("v-if块的内容")]):(value == 2)?_c('p',[_v("v-else-if块的内容")]):_c('p',[_v("v-else块的内容")])"
 */
export function genIf (el: any, state: CodegenState, altGen?: Function, altEmpty?: string): string {
  el.ifProcessed = true // avoid recursion
  return genIfConditions(el.ifConditions.slice(), state, altGen, altEmpty)
}

// 循环处理ifConditions里面的每一个元素，直到找到exp返回true的元素。
function genIfConditions (conditions: ASTIfConditions, state: CodegenState, altGen?: Function, altEmpty?: string): string {
  if (!conditions.length) {
    return altEmpty || '_e()' // _e: createEmptyVNode
  }

  const condition = conditions.shift()
  if (condition.exp) {
    // exp确实设置了，如"value === 1" 而不是undefined或空串，
    return `(${condition.exp})?${genTernaryExp(condition.block)}:${genIfConditions(conditions, state, altGen, altEmpty)}`
  } else {
    return `${genTernaryExp(condition.block)}`
  }

  // v-if with v-once should generate code like (a)?_m(0):_m(1)
  function genTernaryExp (el) {
    // 在genOnce中也有类似的设置：若v-once上同时存在v-if，则优先调用genIf
    return altGen ? altGen(el, state) : el.once ? genOnce(el, state) : genElement(el, state)
  }
}

/**
 * 若v-for属性值为‘(value,key,index) in items’,parseFor处理后在ast上添加的属性有：
{
  for: 'items',
  alias: 'value',
  iterator1: 'key'
  iterator2: 'index'
}
 *
 * @author liubin.frontend
 * @export
 * @param {*} el
 * @param {CodegenState} state
 * @param {Function} [altGen]
 * @param {string} [altHelper]
 * @returns {string}
 */
export function genFor (el: any, state: CodegenState, altGen?: Function, altHelper?: string): string {
  const exp = el.for
  const alias = el.alias
  const iterator1 = el.iterator1 ? `,${el.iterator1}` : ''
  const iterator2 = el.iterator2 ? `,${el.iterator2}` : ''

  if (process.env.NODE_ENV !== 'production' && state.maybeComponent(el) && el.tag !== 'slot' && el.tag !== 'template' && !el.key) {
    state.warn(
      `<${el.tag} v-for="${alias} in ${exp}">: component lists rendered with ` +
        `v-for should have explicit keys. ` +
        `See https://vuejs.org/guide/list.html#key for more info.`,
      true /* tip */
    )
  }

  el.forProcessed = true // avoid recursion
  // 示范："_l((items),function(value,key,index){return _c('p',[_v(_s(index)+". "+_s(key)+" : "+_s(value))])})"
  return `${altHelper || '_l'}((${exp}),` + `function(${alias}${iterator1}${iterator2}){` + `return ${(altGen || genElement)(el, state)}` + '})'
}

/**
 *
 *
 * @author liubin.frontend
 * @export
 * @param {ASTElement} el
 * @param {CodegenState} state
 * @returns {string} 示范： "{attrs:{"id":"app"}}"
 */
export function genData (el: ASTElement, state: CodegenState): string {
  let data = '{'

  // directives first. 自定义指令
  // directives may mutate the el's other properties before they are generated.
  const dirs = genDirectives(el, state)
  if (dirs) data += dirs + ','

  // key
  if (el.key) {
    data += `key:${el.key},`
  }
  // ref
  if (el.ref) {
    data += `ref:${el.ref},`
  }
  if (el.refInFor) {
    data += `refInFor:true,`
  }
  // pre
  if (el.pre) {
    data += `pre:true,`
  }
  // record original tag name for components using "is" attribute
  if (el.component) {
    data += `tag:"${el.tag}",`
  }
  // module data generation functions。
  // 目前只有class和style中有定义genData,位于src/platforms/web/compiler/modules文件夹
  /**
   * style的genData将el.staticStyle（静态style）和el.styleBinding（动态绑定的style）放入data中
   * class的genData将el.staticClass和el.classBinding放入data中
   */
  for (let i = 0; i < state.dataGenFns.length; i++) {
    data += state.dataGenFns[i](el)
  }
  // attributes，格式{name: stirng,value:any}[]
  if (el.attrs) {
    data += `attrs:{${genProps(el.attrs)}},`
  }
  // DOM props
  if (el.props) {
    data += `domProps:{${genProps(el.props)}},`
  }
  // event handlers
  /**
   * el.nativeEvents或el.events对象的格式为:
   * {
        [eventName]: handler | handler[],
      }
      handler 格式:
      {
        value: string,
        modifiers: { [name: string]: true }
      }
   */
  if (el.events) {
    data += `${genHandlers(el.events, false, state.warn)},`
  }
  if (el.nativeEvents) {
    data += `${genHandlers(el.nativeEvents, true, state.warn)},`
  }
  // slot target
  // only for non-scoped slots
  if (el.slotTarget && !el.slotScope) {
    data += `slot:${el.slotTarget},`
  }
  // scoped slots，作用域插槽
  if (el.scopedSlots) {
    data += `${genScopedSlots(el.scopedSlots, state)},`
  }
  // component v-model
  if (el.model) {
    data += `model:{value:${el.model.value},callback:${el.model.callback},expression:${el.model.expression}},`
  }
  // inline-template
  if (el.inlineTemplate) {
    const inlineTemplate = genInlineTemplate(el, state)
    if (inlineTemplate) {
      data += `${inlineTemplate},`
    }
  }
  data = data.replace(/,$/, '') + '}'
  // v-bind data wrap
  if (el.wrapData) {
    data = el.wrapData(data)
  }
  // v-on data wrap
  if (el.wrapListeners) {
    data = el.wrapListeners(data)
  }
  return data
}

/**
 * 自定义指令的render字符串生成，若节点的html为<p v-loading.foo.bar="loading">123</p>，
 * 则在parse阶段后，el.directives数组会有一个元素，它的关键属性有：
 * {
 *    name: "loading"
      rawName: "v-loading.foo.bar"
      value: "loading"
      arg: null，
      modifiers: {foo: true, bar: true}
 * }
 *
 * @author liubin.frontend
 * @param {ASTElement} el
 * @param {CodegenState} state
 * @returns {(string | void)} 示范："directives:[{name:"loading",rawName:"v-loading.foo.bar",value:(loading),expression:"loading",modifiers:{"foo":true,"bar":true}}]"
 */
function genDirectives (el: ASTElement, state: CodegenState): string | void {
  const dirs = el.directives // 节点上的普通指令
  if (!dirs) return
  let res = 'directives:['
  let hasRuntime = false
  let i, l, dir, needRuntime
  for (i = 0, l = dirs.length; i < l; i++) {
    dir = dirs[i]
    needRuntime = true
    // state.directives目前包含v-on、v-bind、v-cloak、v-html、v-model、v-text
    const gen: DirectiveFunction = state.directives[dir.name]
    if (gen) {
      // compile-time directive that manipulates AST.
      // returns true if it also needs a runtime counterpart.
      needRuntime = !!gen(el, dir, state.warn)
    }
    if (needRuntime) {
      hasRuntime = true
      res += `{name:"${dir.name}",rawName:"${dir.rawName}"${dir.value ? `,value:(${dir.value}),expression:${JSON.stringify(dir.value)}` : ''}${
        dir.arg ? `,arg:"${dir.arg}"` : ''
      }${dir.modifiers ? `,modifiers:${JSON.stringify(dir.modifiers)}` : ''}},`
    }
  }
  if (hasRuntime) {
    return res.slice(0, -1) + ']'
  }
}

function genInlineTemplate (el: ASTElement, state: CodegenState): ?string {
  const ast = el.children[0]
  if (process.env.NODE_ENV !== 'production' && (el.children.length !== 1 || ast.type !== 1)) {
    state.warn('Inline-template components must have exactly one child element.')
  }
  if (ast.type === 1) {
    const inlineRenderFns = generate(ast, state.options)
    return `inlineTemplate:{render:function(){${inlineRenderFns.render}},staticRenderFns:[${inlineRenderFns.staticRenderFns
      .map(code => `function(){${code}}`)
      .join(',')}]}`
  }
}

/**
 * 生成作用域插槽的render字符串，若html字符串为
 * <app-layout :items="items">
      <template slot="item" scope="aaa">
        <li>{{ aaa.text }}{{ aaa.name }}</li>
      </template>
    </app-layout>
 * 此时的<template slot="item" scope="aaa">就是一个作用域插槽， 此时slots的关键属性有：
  {
    "item"：{
      attrsMap: {slot: "item", scope: "aaa"},
      attrsList: [],
      parent: {type: 1, tag: "app-layout", xxx},
      slotScope: "aaa",
      slotTarget: ""item"",
      children: [{tag: "li", xxx}]
    }
  }
 * @author liubin.frontend
 * @param {{ [key: string]: ASTElement }} slots
 * @param {CodegenState} state
 * @returns {string} 示范： "scopedSlots:_u([{key:"item",fn:function(aaa){return [_c('li',[_v(_s(aaa.text)+_s(aaa.name))])]}}])"
 */
function genScopedSlots (slots: { [key: string]: ASTElement }, state: CodegenState): string {
  // _u对应resolveScopedSlots，参考src/core/instance/render
  return `scopedSlots:_u([${Object.keys(slots)
    .map(key => {
      return genScopedSlot(key, slots[key], state)
    })
    .join(',')}])`
}

/**
 * el的示范：
 * {
      attrsMap: {slot: "item", scope: "aaa"},
      attrsList: [],
      parent: {type: 1, tag: "app-layout", xxx},
      slotScope: "aaa",
      slotTarget: ""item"",
      children: [{tag: "li", xxx}]
    }
 *
 * @author liubin.frontend
 * @param {string} key 例如 "item"
 * @param {ASTElement} el
 * @param {CodegenState} state
 * @returns {string} 示范："{key:"item",fn:function(aaa){return [_c('li',[_v(_s(aaa.text)+_s(aaa.name))])]}}"
 */
function genScopedSlot (key: string, el: ASTElement, state: CodegenState): string {
  if (el.for && !el.forProcessed) {
    return genForScopedSlot(key, el, state)
  }
  const fn =
    `function(${String(el.slotScope)}){` +
    `return ${
      el.tag === 'template'
        ? el.if
          ? `${el.if}?${genChildren(el, state) || 'undefined'}:undefined`
          : genChildren(el, state) || 'undefined'
        : genElement(el, state)
    }}`
  return `{key:${key},fn:${fn}}`
}

function genForScopedSlot (key: string, el: any, state: CodegenState): string {
  const exp = el.for
  const alias = el.alias
  const iterator1 = el.iterator1 ? `,${el.iterator1}` : ''
  const iterator2 = el.iterator2 ? `,${el.iterator2}` : ''
  el.forProcessed = true // avoid recursion
  return `_l((${exp}),` + `function(${alias}${iterator1}${iterator2}){` + `return ${genScopedSlot(key, el, state)}` + '})'
}

export function genChildren (
  el: ASTElement,
  state: CodegenState,
  checkSkip?: boolean,
  altGenElement?: Function,
  altGenNode?: Function
): string | void {
  const children = el.children
  if (children.length) {
    const el: any = children[0]
    // optimize single v-for
    if (children.length === 1 && el.for && el.tag !== 'template' && el.tag !== 'slot') {
      return (altGenElement || genElement)(el, state)
    }
    // normalizationType:归一化级别，可能为0、1、2
    /**
     * “归一化”其实就是把多维的children数组转换成一维，
     * 至于1和2的区别，是两种不同的方式来进行归一化，
     * 为了使归一化消耗最少，所以不同情况使用不同的方式进行归一化，
     * 感兴趣的可以翻开源码src/core/vdom/helpers/normalize-children.js，这里有详细的注释。
     */
    const normalizationType = checkSkip ? getNormalizationType(children, state.maybeComponent) : 0
    const gen = altGenNode || genNode // genElement or genComment or genText
    return `[${children.map(c => gen(c, state)).join(',')}]${normalizationType ? `,${normalizationType}` : ''}`
  }
}

// determine the normalization needed for the children array.
// 0: no normalization needed
// 1: simple normalization needed (possible 1-level deep nested array)
// 2: full normalization needed
function getNormalizationType (children: Array<ASTNode>, maybeComponent: (el: ASTElement) => boolean): number {
  let res = 0
  for (let i = 0; i < children.length; i++) {
    const el: ASTNode = children[i]
    if (el.type !== 1) {
      continue
    }
    // 节点上有v-for 或 template标签 或 slot标签，或el处于v-if且某个分支满足这些条件
    if (needsNormalization(el) || (el.ifConditions && el.ifConditions.some(c => needsNormalization(c.block)))) {
      res = 2
      break
    }
    // maybeComponent：自定义组件，或el处于v-if且某个分支是自定义组件
    if (maybeComponent(el) || (el.ifConditions && el.ifConditions.some(c => maybeComponent(c.block)))) {
      res = 1
    }
  }
  return res
}

// 节点上有v-for 或 template标签 或 slot标签
function needsNormalization (el: ASTElement): boolean {
  return el.for !== undefined || el.tag === 'template' || el.tag === 'slot'
}

function genNode (node: ASTNode, state: CodegenState): string {
  if (node.type === 1) {
    return genElement(node, state)
  }
  if (node.type === 3 && node.isComment) {
    return genComment(node)
  } else {
    return genText(node)
  }
}

export function genText (text: ASTText | ASTExpression): string {
  return `_v(${
    text.type === 2
      ? text.expression // no need for () because already wrapped in _s()
      : transformSpecialNewlines(JSON.stringify(text.text))
  })`
}

export function genComment (comment: ASTText): string {
  return `_e(${JSON.stringify(comment.text)})`
}

/**
 * 若el对应的节点html为：<slot name="header" :test="{a:1}"></slot>
 * 此时el的关键属性有：
 * {
 *   attrsMap: {name: "header", :test: "{a:1}"}，
 *   children: [{type: 3, text: "默认显示", static: true}],
 *   attrs: [{name: "test", value: "{a:1}"}]
 * }
 *
 * @author liubin.frontend
 * @param {ASTElement} el
 * @param {CodegenState} state
 * @returns {string} 示范："_t("header",[_v("默认显示")],{test:{a:1}})"
 */
function genSlot (el: ASTElement, state: CodegenState): string {
  const slotName = el.slotName || '"default"'
  // children是当前slot的子元素数组，作为没有匹配的slot时的降级显示
  const children = genChildren(el, state)
  // _t对应renderSlot方法，参考src/core/instance/render
  let res = `_t(${slotName}${children ? `,${children}` : ''}`
  const attrs = el.attrs && `{${el.attrs.map(a => `${camelize(a.name)}:${a.value}`).join(',')}}` // 属性名从中划线连接变为驼峰式
  const bind = el.attrsMap['v-bind']
  // attrs和bind主要都用于作用域插槽中传值
  if ((attrs || bind) && !children) {
    res += `,null`
  }
  if (attrs) {
    res += `,${attrs}`
  }
  if (bind) {
    res += `${attrs ? '' : ',null'},${bind}`
  }
  return res + ')'
}

// componentName is el.component, take it as argument to shun flow's pessimistic refinement
function genComponent (componentName: string, el: ASTElement, state: CodegenState): string {
  const children = el.inlineTemplate ? null : genChildren(el, state, true)
  return `_c(${componentName},${genData(el, state)}${children ? `,${children}` : ''})`
}

/**
 *
 *
 * @author liubin.frontend
 * @param {Array<{ name: string, value: any }>} props
 * @returns {string} 示范： "id": "app","type": "123"
 */
function genProps (props: Array<{ name: string, value: any }>): string {
  let res = ''
  for (let i = 0; i < props.length; i++) {
    const prop = props[i]
    /* istanbul ignore if */
    if (__WEEX__) {
      res += `"${prop.name}":${generateValue(prop.value)},`
    } else {
      res += `"${prop.name}":${transformSpecialNewlines(prop.value)},`
    }
  }
  return res.slice(0, -1)
}

/* istanbul ignore next */
function generateValue (value) {
  if (typeof value === 'string') {
    return transformSpecialNewlines(value)
  }
  return JSON.stringify(value)
}

// #3895, #4268
function transformSpecialNewlines (text: string): string {
  return text.replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
}
