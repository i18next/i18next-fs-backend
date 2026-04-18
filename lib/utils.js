const arr = []
const each = arr.forEach
const slice = arr.slice

const UNSAFE_KEYS = ['__proto__', 'constructor', 'prototype']

export function defaults (obj) {
  each.call(slice.call(arguments, 1), (source) => {
    if (source) {
      for (const prop of Object.keys(source)) {
        if (UNSAFE_KEYS.indexOf(prop) > -1) continue
        if (obj[prop] === undefined) obj[prop] = source[prop]
      }
    }
  })
  return obj
}

// Returns true if `v` can be safely interpolated into a filesystem path.
// Denylist approach — i18next permits arbitrary language-code shapes
// (https://www.i18next.com/how-to/faq#how-should-the-language-codes-be-formatted)
// so we only block the concrete attack patterns: path traversal, path
// separators (so attacker cannot break out of the locale directory),
// control characters, prototype keys, and oversized inputs.
export function isSafePathSegment (v) {
  if (typeof v !== 'string') return false
  if (v.length === 0 || v.length > 128) return false
  if (UNSAFE_KEYS.indexOf(v) > -1) return false
  if (v.indexOf('..') > -1) return false
  if (v.indexOf('/') > -1 || v.indexOf('\\') > -1) return false
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1F\x7F]/.test(v)) return false
  return true
}

export function debounce (func, wait, immediate) {
  let timeout
  return function () {
    const context = this
    const args = arguments
    const later = function () {
      timeout = null
      if (!immediate) func.apply(context, args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func.apply(context, args)
  }
}

function getLastOfPath (object, path, Empty) {
  function cleanKey (key) {
    return (key && key.indexOf('###') > -1) ? key.replace(/###/g, '.') : key
  }

  const stack = (typeof path !== 'string') ? [].concat(path) : path.split('.')
  while (stack.length > 1) {
    if (!object) return {}

    const key = cleanKey(stack.shift())
    if (!object[key] && Empty) object[key] = new Empty()
    object = object[key]
  }

  if (!object) return {}
  return {
    obj: object,
    k: cleanKey(stack.shift())
  }
}

export function setPath (object, path, newValue) {
  const { obj, k } = getLastOfPath(object, path, Object)
  if (Array.isArray(obj) && isNaN(k)) throw new Error(`Cannot create property "${k}" here since object is an array`)
  obj[k] = newValue
}

export function pushPath (object, path, newValue, concat) {
  const { obj, k } = getLastOfPath(object, path, Object)
  obj[k] = obj[k] || []
  if (concat) obj[k] = obj[k].concat(newValue)
  if (!concat) obj[k].push(newValue)
}

export function getPath (object, path) {
  const { obj, k } = getLastOfPath(object, path)
  if (!obj) return undefined
  return obj[k]
}

const interpolationRegexp = /\{\{(.+?)\}\}/g
export function interpolate (str, data) {
  return str.replace(interpolationRegexp, (match, key) => {
    const k = key.trim()
    if (UNSAFE_KEYS.indexOf(k) > -1) return match
    const value = data[k]
    return value != null ? value : match
  })
}

// Path-specific variant: reject values that fail the path-segment safety
// check. Returns `null` if any substitution is unsafe — callers should bail
// out cleanly rather than issue the filesystem read/write. For multi-value
// joins (`en+de`), validates each `+`-separated segment independently.
export function interpolatePath (str, data) {
  let unsafe = false
  const result = str.replace(interpolationRegexp, (match, key) => {
    const k = key.trim()
    if (UNSAFE_KEYS.indexOf(k) > -1) return match
    const value = data[k]
    if (value == null) return match
    const segments = String(value).split('+')
    for (const seg of segments) {
      if (!isSafePathSegment(seg)) {
        unsafe = true
        return match
      }
    }
    return segments.join('+')
  })
  return unsafe ? null : result
}
