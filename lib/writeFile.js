import JSON5 from './formats/json5.js'
// eslint-disable-next-line no-unused-vars
import * as YAMLDummy from './formats/yaml.js'
import * as fsMod from './fs.cjs'
import extname from './extname.js'
const isDeno = typeof Deno !== 'undefined'
const YAML = typeof global !== 'undefined' ? global.jsyaml : (typeof window !== 'undefined' ? window.jsyaml : undefined)
const fs = fsMod ? (fsMod.default || fsMod) : undefined // because of strange export

const writeFileInNodeSync = (filename, payload) => {
  return fs.writeFileSync(filename, payload, 'utf8')
}

const writeFileInNode = (filename, payload) => {
  return new Promise((resolve, reject) => fs.writeFile(filename, payload, 'utf8', (err, data) => err ? reject(err) : resolve(data)))
}

const writeFileInDenoSync = (filename, payload) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(payload)
  // eslint-disable-next-line no-undef
  Deno.writeFileSync(filename, data)
}

const writeFileInDeno = (filename, payload) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(payload)
  // eslint-disable-next-line no-undef
  return Deno.writeFile(filename, data)
}

const stringifyData = (extension, data, options) => {
  let result = ''
  switch (extension) {
    case '.js':
    case '.ts':
      if (typeof module === 'undefined') {
        result = `export default ${options.stringify(data, null, options.ident)}`
      } else {
        result = `module.exports = ${options.stringify(data, null, options.ident)}`
      }
      break
    case '.json5':
      result = JSON5.stringify(data, null, options.ident)
      break
    case '.yml':
    case '.yaml':
      result = YAML.safeDump(data, { ident: options.indent })
      break
    default:
      result = options.stringify(data, null, options.ident)
  }
  return result
}

export function writeFileSync (filename, payload, options) {
  const ext = extname(filename)
  let data
  try {
    data = stringifyData(ext, payload, options)
  } catch (err) {
    err.message = 'error stringifying ' + filename + ': ' + err.message
    throw err
  }
  if (isDeno) {
    return writeFileInDenoSync(filename, data)
  } else {
    return writeFileInNodeSync(filename, data)
  }
}

export function writeFile (filename, payload, options = { stringify: JSON.stringify, ident: 2 }) {
  const ext = extname(filename)
  let data
  try {
    data = stringifyData(ext, payload, options)
  } catch (err) {
    err.message = 'error stringifying ' + filename + ': ' + err.message
    throw err
  }
  const fn = isDeno ? writeFileInDeno : writeFileInNode
  return fn(filename, data)
}
