import JSON5 from './formats/json5.js'
// eslint-disable-next-line no-unused-vars
import * as YAMLDummy from './formats/yaml.js'
import * as fsMod from './fs.cjs'
import extname from './extname.js'
const isDeno = typeof Deno !== 'undefined'
const YAML = typeof global !== 'undefined' ? global.jsyaml : (typeof window !== 'undefined' ? window.jsyaml : undefined)
const fs = fsMod ? (fsMod.default || fsMod) : undefined // because of strange export

const readFileInNodeSync = (filename) => {
  return fs.readFileSync(filename, 'utf8')
}

const readFileInNode = (filename) => {
  return new Promise((resolve, reject) => fs.readFile(filename, 'utf8', (err, data) => err ? reject(err) : resolve(data)))
}

const readFileInDenoSync = (filename) => {
  const decoder = new TextDecoder('utf-8')
  // eslint-disable-next-line no-undef
  const data = Deno.readFileSync(filename)
  return decoder.decode(data)
}
const readFileInDeno = (filename) => {
  return new Promise((resolve, reject) => {
    const decoder = new TextDecoder('utf-8')
    // eslint-disable-next-line no-undef
    Deno.readFile(filename).then((data) => {
      resolve(decoder.decode(data))
    }).catch(reject)
  })
}

const parseData = (extension, data, options) => {
  data = data.replace(/^\uFEFF/, '')
  let result = {}
  switch (extension) {
    case '.js':
    case '.ts':
      if (typeof module === 'undefined') {
        if (data.indexOf('exports') > -1) { // just to try...
          data = `(${data.substring(data.indexOf('=') + 1).replace(/;/, '')})`
        } else if (data.indexOf('export default ') > -1) { // just to try...
          data = `(${data.substring(data.indexOf('export default ') + 15).replace(/;/, '')})`
        }
      }
      // eslint-disable-next-line no-eval
      result = eval(data)
      break
    case '.json5':
      result = JSON5.parse(data)
      break
    case '.yml':
    case '.yaml':
      result = YAML.safeLoad(data)
      break
    default:
      result = options.parse(data)
  }
  return result
}

export function readFileSync (filename, options) {
  const ext = extname(filename)
  if (['.js', '.ts'].indexOf(ext) > -1 && typeof require !== 'undefined') {
    return require(!filename.startsWith('/') && typeof process !== 'undefined' && process.cwd ? `${process.cwd()}/${filename}` : filename)
  }
  let data
  if (isDeno) {
    data = readFileInDenoSync(filename)
  } else {
    data = readFileInNodeSync(filename)
  }
  return parseData(ext, data, options)
}

export function readFile (filename, options = { parse: JSON.parse }) {
  const ext = extname(filename)
  if (['.js', '.ts'].indexOf(ext) > -1 && typeof require !== 'undefined') {
    return new Promise((resolve, reject) => {
      try {
        resolve(require(!filename.startsWith('/') && typeof process !== 'undefined' && process.cwd ? `${process.cwd()}/${filename}` : filename))
      } catch (err) {
        reject(err)
      }
    })
  }
  const fn = isDeno ? readFileInDeno : readFileInNode
  return new Promise((resolve, reject) => {
    fn(filename).then((data) => {
      try {
        const ret = parseData(ext, data, options)
        resolve(ret)
      } catch (err) {
        err.message = 'error parsing ' + filename + ': ' + err.message
        reject(err)
      }
    }).catch(reject)
  })
}
