/* @flow */

const fnExpRE = /^([\w$_]+|\([^)]*?\))\s*=>|^function\s*\(/ // 匹配箭头函数，或者普通的函数定义
// 匹配函数的路径，比如name、obj.name、obj["$^%#"]、obj['$^%#']、obj[0]等。
const simplePathRE = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\['[^']*?']|\["[^"]*?"]|\[\d+]|\[[A-Za-z_$][\w$]*])*$/

// KeyboardEvent.keyCode aliases
const keyCodes: { [key: string]: number | Array<number> } = {
  esc: 27,
  tab: 9,
  enter: 13,
  space: 32,
  up: 38,
  left: 37,
  right: 39,
  down: 40,
  delete: [8, 46]
}

// KeyboardEvent.key aliases
const keyNames: { [key: string]: string | Array<string> } = {
  // #7880: IE11 and Edge use `Esc` for Escape key name.
  esc: ['Esc', 'Escape'],
  tab: 'Tab',
  enter: 'Enter',
  space: ' ',
  // #7806: IE11 uses key names without `Arrow` prefix for arrow keys.
  up: ['Up', 'ArrowUp'],
  left: ['Left', 'ArrowLeft'],
  right: ['Right', 'ArrowRight'],
  down: ['Down', 'ArrowDown'],
  delete: ['Backspace', 'Delete']
}

// #4868: modifiers that prevent the execution of the listener
// need to explicitly return null so that we can determine whether to remove
// the listener for .once
const genGuard = condition => `if(${condition})return null;`

const modifierCode: { [key: string]: string } = {
  stop: '$event.stopPropagation();',
  prevent: '$event.preventDefault();',
  self: genGuard(`$event.target !== $event.currentTarget`),
  ctrl: genGuard(`!$event.ctrlKey`),
  shift: genGuard(`!$event.shiftKey`),
  alt: genGuard(`!$event.altKey`),
  meta: genGuard(`!$event.metaKey`),
  left: genGuard(`'button' in $event && $event.button !== 0`),
  middle: genGuard(`'button' in $event && $event.button !== 1`),
  right: genGuard(`'button' in $event && $event.button !== 2`)
}

/**
 * events格式：
 *  {
      [eventName]: handler | handler[],
    }
    handler 格式:
    {
      value: string,
      modifiers: { [name: string]: true }
    }
 *
 * @author liubin.frontend
 * @export
 * @param {ASTElementHandlers} events
 * @param {boolean} isNative
 * @param {Function} warn
 * @returns {string} 示范：
 *
 * 若html为<p @click.foo.bar.left="show">{{text}}</p>，
 * 则返回
 * {
    on: {
      "click": function($event) {
        if ( !( 'button' in $event ) &&
        _k( $event.keyCode, "foo", undefined, $event.key, undefined ) &&
        _k( $event.keyCode, "bar", undefined, $event.key, undefined ) )
          return null;

        return show( $event )
      }
    }
  }
 *
 */
export function genHandlers (events: ASTElementHandlers, isNative: boolean, warn: Function): string {
  let res = isNative ? 'nativeOn:{' : 'on:{'
  for (const name in events) {
    res += `"${name}":${genHandler(name, events[name])},`
  }
  return res.slice(0, -1) + '}'
}

// Generate handler code with binding params on Weex
/* istanbul ignore next */
function genWeexHandler (params: Array<any>, handlerCode: string) {
  let innerHandlerCode = handlerCode
  const exps = params.filter(exp => simplePathRE.test(exp) && exp !== '$event')
  const bindings = exps.map(exp => ({ '@binding': exp }))
  const args = exps.map((exp, i) => {
    const key = `$_${i + 1}`
    innerHandlerCode = innerHandlerCode.replace(exp, key)
    return key
  })
  args.push('$event')
  return '{\n' + `handler:function(${args.join(',')}){${innerHandlerCode}},\n` + `params:${JSON.stringify(bindings)}\n` + '}'
}

function genHandler (name: string, handler: ASTElementHandler | Array<ASTElementHandler>): string {
  if (!handler) {
    return 'function(){}'
  }

  if (Array.isArray(handler)) {
    return `[${handler.map(handler => genHandler(name, handler)).join(',')}]`
  }

  const isMethodPath = simplePathRE.test(handler.value) // 绑定的直接是函数定义，如 @click="()=>test+=1"
  const isFunctionExpression = fnExpRE.test(handler.value) // 绑定的是函数路径，如@click="obj['name']" 或@click="emitData"

  // 没有修饰符
  if (!handler.modifiers) {
    if (isMethodPath || isFunctionExpression) {
      return handler.value
    }
    /* istanbul ignore if */
    if (__WEEX__ && handler.params) {
      return genWeexHandler(handler.params, handler.value)
    }
    // 如果绑定的直接是函数定义，也不是函数路径，那么就是一个内联的表达式了，如@click="test+=1"
    return `function($event){${handler.value}}` // inline statement
  } else {
    let code = ''
    let genModifierCode = ''
    const keys = []
    for (const key in handler.modifiers) {
      if (modifierCode[key]) {
        // key为内置修饰符
        genModifierCode += modifierCode[key]
        // left/right
        if (keyCodes[key]) {
          keys.push(key)
        }
      } else if (key === 'exact') {
        // exact修饰符表示有且仅有指定的按键被按下时触发，而不能伴随这4个辅助按键
        const modifiers: ASTModifiers = (handler.modifiers: any)
        // genGuard = condition => `if(${condition})return null;`
        genModifierCode += genGuard(
          ['ctrl', 'shift', 'alt', 'meta']
            .filter(keyModifier => !modifiers[keyModifier])
            .map(keyModifier => `$event.${keyModifier}Key`)
            .join('||')
        )
      } else {
        keys.push(key)
      }
    }
    if (keys.length) {
      code += genKeyFilter(keys)
    }
    // Make sure modifiers like prevent and stop get executed after key filtering
    if (genModifierCode) {
      code += genModifierCode
    }
    const handlerCode = isMethodPath ? `return ${handler.value}($event)` : isFunctionExpression ? `return (${handler.value})($event)` : handler.value
    /* istanbul ignore if */
    if (__WEEX__ && handler.params) {
      return genWeexHandler(handler.params, code + handlerCode)
    }
    return `function($event){${code}${handlerCode}}`
  }
}

/**
 *
 *
 * @author liubin.frontend
 * @param {Array<string>} keys
 * @returns {string} 返回的是一个判断不符合一定条件就return null的字符串
 */
function genKeyFilter (keys: Array<string>): string {
  return `if(!('button' in $event)&&${keys.map(genFilterCode).join('&&')})return null;`
}

function genFilterCode (key: string): string {
  const keyVal = parseInt(key, 10)
  if (keyVal) {
    return `$event.keyCode!==${keyVal}`
  }
  const keyCode = keyCodes[key]
  const keyName = keyNames[key]
  // _k checkKeyCodes函数
  return `_k($event.keyCode,` + `${JSON.stringify(key)},` + `${JSON.stringify(keyCode)},` + `$event.key,` + `${JSON.stringify(keyName)}` + `)`
}
