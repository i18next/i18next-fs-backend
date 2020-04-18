const arr = []
const each = arr.forEach
const slice = arr.slice

export function defaults (obj) {
  each.call(slice.call(arguments, 1), (source) => {
    if (source) {
      for (var prop in source) {
        if (obj[prop] === undefined) obj[prop] = source[prop]
      }
    }
  })
  return obj
}

export function debounce (func, wait, immediate) {
  var timeout
  return function () {
    var context = this; var args = arguments
    var later = function () {
      timeout = null
      if (!immediate) func.apply(context, args)
    }
    var callNow = immediate && !timeout
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
