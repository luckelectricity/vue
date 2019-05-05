/* @flow */
// Object.freeze() 方法可以冻结一个对象。一个被冻结的对象再也不能被修改；冻结了一个对象则不能向这个对象添加新的属性，不能删除已有属性，不能修改该对象已有属性的可枚举性、可配置性、可写性，以及不能修改已有属性的值。此外，冻结一个对象后该对象的原型也不能被修改。freeze() 返回和传入的参数相同的对象。
export const emptyObject = Object.freeze({});

// These helpers produce better VM code in JS engines due to their
// explicitness and function inlining.
// 检查是否为undefined或者null
export function isUndef(v: any): boolean %checks {
  return v === undefined || v === null;
}
// 检查是否不为undefined和不为null
export function isDef(v: any): boolean %checks {
  return v !== undefined && v !== null;
}
// isTrue 不翻译了吧
export function isTrue(v: any): boolean %checks {
  return v === true;
}
// isFalse 不翻译了吧
export function isFalse(v: any): boolean %checks {
  return v === false;
}

/**
 * Check if value is primitive. 检查是否为基本数据类型
 */
export function isPrimitive(value: any): boolean %checks {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    // $flow-disable-line
    typeof value === 'symbol' ||
    typeof value === 'boolean'
  );
}

/**
 * Quick object check - this is primarily used to tell
 * Objects from primitive values when we know the value
 * is a JSON-compliant type.
 * 除了null以外的所有对象,数组 包括new出来的所有的对象都会返回true
 */
export function isObject(obj: mixed): boolean %checks {
  return obj !== null && typeof obj === 'object';
}

/**
 * Get the raw type string of a value, e.g., [object Object].
 * 看注释懂了 这样的就获取到了Object了
 * 可以通过toString() 来获取每个对象的类型。
 * 为了每个对象都能通过 Object.prototype.toString() 来检测，
 * 需要以 Function.prototype.call() 或者 Function.prototype.apply() 的形式来调用，传递要检查的对象作为第一个参数，称为thisArg。
 * var toString = Object.prototype.toString;
 * toString.call(new Date); // [object Date]
 * toString.call(new String); // [object String]
 * toString.call(Math); // [object Math]
 * //Since JavaScript 1.8.5
 * toString.call(undefined); // [object Undefined]
 * toString.call(null); // [object Null]
 */
const _toString = Object.prototype.toString;

export function toRawType(value: any): string {
  return _toString.call(value).slice(8, -1);
}

/**
 * Strict object type check. Only returns true
 * for plain JavaScript objects.
 * 是否为普通对象
 */
export function isPlainObject(obj: any): boolean {
  return _toString.call(obj) === '[object Object]';
}
// 是否为正则对象
export function isRegExp(v: any): boolean {
  return _toString.call(v) === '[object RegExp]';
}

/**
 * Check if val is a valid array index.
 * 检查val是否为有效的数组索引
 */
export function isValidArrayIndex(val: any): boolean {
  const n = parseFloat(String(val));
  return n >= 0 && Math.floor(n) === n && isFinite(val);
}
// isPromise 不说了吧,能then能catch,就是promise
export function isPromise(val: any): boolean {
  return (
    isDef(val) &&
    typeof val.then === 'function' &&
    typeof val.catch === 'function'
  );
}

/**
 * Convert a value to a string that is actually rendered.
 * 将val转换为页面呈现的string
 */
export function toString(val: any): string {
  return val == null
    ? ''
    : Array.isArray(val) || (isPlainObject(val) && val.toString === _toString)
    ? JSON.stringify(val, null, 2)
    : String(val);
}

/**
 * Convert an input value to a number for persistence.
 * If the conversion fails, return original string.
 * 将val转换为number,如果转换失败,返回原始val
 */
export function toNumber(val: string): number | string {
  const n = parseFloat(val);
  return isNaN(n) ? val : n;
}

/**
 * Make a map and return a function for checking if a key
 * is in that map.
 * 创建一个Map,返回函数并且检查这个key是否在这个map
 */
export function makeMap(
  str: string,
  expectsLowerCase?: boolean
): (key: string) => true | void {
  const map = Object.create(null);
  const list: Array<string> = str.split(',');
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true;
  }
  return expectsLowerCase ? val => map[val.toLowerCase()] : val => map[val];
}

/**
 * Check if a tag is a built-in tag.
 * 检查标签是否为内置标签
 */
export const isBuiltInTag = makeMap('slot,component', true);

/**
 * Check if an attribute is a reserved attribute.
 * 检查属性是否为保留属性。
 */
export const isReservedAttribute = makeMap('key,ref,slot,slot-scope,is');

/**
 * Remove an item from an array.
 * 从数组中删除item。
 */
export function remove(arr: Array<any>, item: any): Array<any> | void {
  if (arr.length) {
    const index = arr.indexOf(item);
    if (index > -1) {
      return arr.splice(index, 1);
    }
  }
}

/**
 * Check whether an object has the property.
 * hasOwnProperty() 方法会返回一个布尔值，指示对象自身属性中是否具有指定的属性
 */
const hasOwnProperty = Object.prototype.hasOwnProperty;
export function hasOwn(obj: Object | Array<*>, key: string): boolean {
  return hasOwnProperty.call(obj, key);
}

/**
 * Create a cached version of a pure function.
 * 创建纯函数的缓存
 */
export function cached<F: Function>(fn: F): F {
  const cache = Object.create(null);
  return (function cachedFn(str: string) {
    const hit = cache[str];
    return hit || (cache[str] = fn(str));
  }: any);
}

/**
 * Camelize a hyphen-delimited string.
 * 按照-首字母大写
 * camelize('hhh-aaa-ddd-fff') ===>  "hhhAaaDddFff"
 * 中划线转驼峰
 */
const camelizeRE = /-(\w)/g;
export const camelize = cached(
  (str: string): string => {
    return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''));
  }
);

/**
 * Capitalize a string.
 * 字符串首字母大写
 * capitalize("sdfhsdlfjiufsd") ==> "Sdfhsdlfjiufsd"
 */
export const capitalize = cached(
  (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
);

/**
 * Hyphenate a camelCase string.
 * 驼峰转中划线
 * hyphenate('aBaaCaaDaa') ==> "a-baa-caa-daa"
 */
const hyphenateRE = /\B([A-Z])/g;
export const hyphenate = cached(
  (str: string): string => {
    return str.replace(hyphenateRE, '-$1').toLowerCase();
  }
);

/**
 * Simple bind polyfill for environments that do not support it,
 * e.g., PhantomJS 1.x. Technically, we don't need this anymore
 * since native bind is now performant enough in most browsers.
 * But removing it would mean breaking code that was able to run in
 * PhantomJS 1.x, so this must be kept for backward compatibility.
 * polyfill 为了兼容
 */

/* istanbul ignore next */
// 用call和apply模拟bind
function polyfillBind(fn: Function, ctx: Object): Function {
  function boundFn(a) {
    const l = arguments.length;
    return l
      ? l > 1
        ? fn.apply(ctx, arguments)
        : fn.call(ctx, a)
      : fn.call(ctx);
  }

  boundFn._length = fn.length;
  return boundFn;
}

// 原生bind
function nativeBind(fn: Function, ctx: Object): Function {
  return fn.bind(ctx);
}

export const bind = Function.prototype.bind ? nativeBind : polyfillBind;

/**
 * Convert an Array-like object to a real Array.
 * 将伪数组转换为数组,start为从哪一位开始
 */
export function toArray(list: any, start?: number): Array<any> {
  start = start || 0;
  let i = list.length - start;
  const ret: Array<any> = new Array(i);
  while (i--) {
    ret[i] = list[i + start];
  }
  return ret;
}

/**
 * Mix properties into target object.
 * 合并两个obj
 */
export function extend(to: Object, _from: ?Object): Object {
  for (const key in _from) {
    to[key] = _from[key];
  }
  return to;
}

/**
 * Merge an Array of Objects into a single Object.
 * [{a:1}, {b: 2}]
 * return {a:1,b:2}
 */
export function toObject(arr: Array<any>): Object {
  const res = {};
  for (let i = 0; i < arr.length; i++) {
    if (arr[i]) {
      extend(res, arr[i]);
    }
  }
  return res;
}

/* eslint-disable no-unused-vars */

/**
 * Perform no operation.
 * Stubbing args to make Flow happy without leaving useless transpiled code
 * with ...rest (https://flow.org/blog/2017/05/07/Strict-Function-Call-Arity/).
 * 啥也不做
 */
export function noop(a?: any, b?: any, c?: any) {}

/**
 * Always return false.
 * 总返回false
 */
export const no = (a?: any, b?: any, c?: any) => false;

/* eslint-enable no-unused-vars */

/**
 * Return the same value.
 * 返回相同的值
 */
export const identity = (_: any) => _;

/**
 * Generate a string containing static keys from compiler modules.
 */
// 下面是modules的大概格式
// [
//   {
//     staticKeys: ['staticClass'],
//     transformNode,
//     genData
//   },
//   {
//     staticKeys: ['staticStyle'],
//     transformNode,
//     genData
//   },
//   {
//     preTransformNode
//   }
// ]
export function genStaticKeys(modules: Array<ModuleOptions>): string {
  return modules
    .reduce((keys, m) => {
      return keys.concat(m.staticKeys || []);
    }, [])
    .join(',');
}

/**
 * Check if two values are loosely equal - that is,
 * if they are plain objects, do they have the same shape?
 * 检查两个值是否宽松相等 -也就是说，如果它们是普通对象，它们是否具有相同的格式,
 * 具体可以参考有道云笔记里面vue源码的流程图
 */
export function looseEqual(a: any, b: any): boolean {
  if (a === b) return true;
  const isObjectA = isObject(a);
  const isObjectB = isObject(b);
  if (isObjectA && isObjectB) {
    try {
      const isArrayA = Array.isArray(a);
      const isArrayB = Array.isArray(b);
      if (isArrayA && isArrayB) {
        return (
          a.length === b.length &&
          a.every((e, i) => {
            return looseEqual(e, b[i]);
          })
        );
      } else if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime();
      } else if (!isArrayA && !isArrayB) {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        return (
          keysA.length === keysB.length &&
          keysA.every(key => {
            return looseEqual(a[key], b[key]);
          })
        );
      } else {
        /* istanbul ignore next */
        return false;
      }
    } catch (e) {
      /* istanbul ignore next */
      return false;
    }
  } else if (!isObjectA && !isObjectB) {
    return String(a) === String(b);
  } else {
    return false;
  }
}

/**
 * Return the first index at which a loosely equal value can be
 * found in the array (if value is a plain object, the array must
 * contain an object of the same shape), or -1 if it is not present.
 * 返回第一个索引，在该索引处可以在数组中找到松散相等的值（如果value是普通对象，
 * 则数组必须包含相同形状的对象），如果不存在，则返回-1。
 * 类似于indexOf
 */
export function looseIndexOf(arr: Array<mixed>, val: mixed): number {
  for (let i = 0; i < arr.length; i++) {
    if (looseEqual(arr[i], val)) return i;
  }
  return -1;
}

/**
 * Ensure a function is called only once.
 * 确保只调用一次函数
 */
export function once(fn: Function): Function {
  let called = false;
  return function() {
    if (!called) {
      called = true;
      fn.apply(this, arguments);
    }
  };
}
// 尝试下小绿点
