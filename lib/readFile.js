import JSON5 from './formats/json5.js'
// eslint-disable-next-line no-unused-vars
import jsYaml from './formats/yaml.js'
import * as fsMod from './fs.cjs'
import extname from './extname.js'
const isDeno = typeof Deno !== 'undefined'
const YAML = typeof jsYaml !== 'undefined' && jsYaml.load ? jsYaml : undefined
const fs = fsMod ? (fsMod.default || fsMod) : undefined // because of strange export

const readFileInNodeSync = (filename) => {
  const data = fs.readFileSync(filename, 'utf8')
  let stat
  try {
    stat = fs.statSync(filename)
  } catch (e) {}
  return { data, stat }
}

const readFileInNode = (filename) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, 'utf8', (err, data) => {
      if (err) return reject(err)
      fs.stat(filename, (err, stat) => {
        if (err) return resolve({ data })
        return resolve({ data, stat })
      })
    })
  })
}

const readFileInDenoSync = (filename) => {
  const decoder = new TextDecoder('utf-8')
  // eslint-disable-next-line no-undef
  const d = Deno.readFileSync(filename)
  const data = decoder.decode(d)
  let stat
  try {
    // eslint-disable-next-line no-undef
    stat = Deno.statSync(filename)
  } catch (e) {}
  return { data, stat }
}
const readFileInDeno = (filename) => {
  return new Promise((resolve, reject) => {
    const decoder = new TextDecoder('utf-8')
    // eslint-disable-next-line no-undef
    Deno.readFile(filename).then((d) => {
      const data = decoder.decode(d)
      // eslint-disable-next-line no-undef
      Deno.stat(filename).then((stat) => resolve({ data, stat })).catch(() => resolve({ data }))
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
      result = YAML.load(data)
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
  let data, stat
  if (isDeno) {
    const ret = readFileInDenoSync(filename)
    data = ret.data
    stat = ret.stat
  } else {
    const ret = readFileInNodeSync(filename)
    data = ret.data
    stat = ret.stat
  }
  return { data: parseData(ext, data, options), stat }
}

export function readFile (filename, options = { parse: JSON.parse }) {
  const ext = extname(filename)
  if (['.js', '.ts'].indexOf(ext) > -1 && typeof require !== 'undefined') {
    return new Promise((resolve, reject) => {
      try {
        resolve({ data: require(!filename.startsWith('/') && typeof process !== 'undefined' && process.cwd ? `${process.cwd()}/${filename}` : filename) })
      } catch (err) {
        reject(err)
      }
    })
  }
  const fn = isDeno ? readFileInDeno : readFileInNode
  return new Promise((resolve, reject) => {
    fn(filename).then(({ data, stat }) => {
      try {
        const ret = parseData(ext, data, options)
        resolve({ data: ret, stat })
      } catch (err) {
        err.message = 'error parsing ' + filename + ': ' + err.message
        reject(err)
      }
    }).catch(reject)
  })
}
