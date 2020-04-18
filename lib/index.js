import { defaults, debounce, getPath, setPath, pushPath } from './utils.js'
import { readFile, readFileSync } from './readFile.js'
import { writeFile } from './writeFile.js'

const getDefaults = () => {
  return {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
    addPath: '/locales/{{lng}}/{{ns}}.missing.json',
    ident: 2,
    parse: JSON.parse,
    stringify: JSON.stringify
  }
}

class Backend {
  constructor (services, options = {}, allOptions = {}) {
    this.services = services
    this.options = options
    this.allOptions = allOptions
    this.type = 'backend'
    this.init(services, options, allOptions)
  }

  init (services, options = {}, allOptions = {}) {
    this.services = services
    this.options = defaults(options, this.options || {}, getDefaults())
    this.allOptions = allOptions
    this.queuedWrites = {}
    this.debouncedWrite = debounce(this.write, 250)
  }

  read (language, namespace, callback) {
    var loadPath = this.options.loadPath
    if (typeof this.options.loadPath === 'function') {
      loadPath = this.options.loadPath(language, namespace)
    }
    const filename = this.services.interpolator.interpolate(loadPath, { lng: language, ns: namespace })
    if (this.allOptions.initImmediate === false) {
      try {
        const resources = readFileSync(filename, this.options)
        callback(null, resources)
      } catch (err) {
        callback(err, false) // no retry
      }
      return
    }
    readFile(filename, this.options)
      .then((resources) => callback(null, resources))
      .catch((err) => callback(err, false)) // no retry
  }

  create (languages, namespace, key, fallbackValue, callback) {
    if (!callback) callback = () => {}
    if (typeof languages === 'string') languages = [languages]

    let todo = languages.length
    const done = () => {
      if (!--todo) callback()
    }

    languages.forEach((lng) => {
      // eslint-disable-next-line no-useless-call
      this.queue.call(this, lng, namespace, key, fallbackValue, done)
    })
  }

  write () {
    for (const lng in this.queuedWrites) {
      const namespaces = this.queuedWrites[lng]
      if (lng !== 'locks') {
        for (const ns in namespaces) {
          this.writeFile(lng, ns)
        }
      }
    }
  }

  writeFile (lng, namespace) {
    const lock = getPath(this.queuedWrites, ['locks', lng, namespace])
    if (lock) return

    let addPath = this.options.addPath
    if (typeof this.options.addPath === 'function') {
      addPath = this.options.addPath(lng, namespace)
    }

    const filename = this.services.interpolator.interpolate(addPath, { lng: lng, ns: namespace })

    const missings = getPath(this.queuedWrites, [lng, namespace])
    setPath(this.queuedWrites, [lng, namespace], [])

    if (missings.length) {
      // lock
      setPath(this.queuedWrites, ['locks', lng, namespace], true)

      const proceed = (resources) => {
        missings.forEach((missing) => {
          const path = this.allOptions.keySeparator === false ? [missing.key] : (missing.key.split(this.allOptions.keySeparator || '.'))
          setPath(resources, path, missing.fallbackValue)
        })

        const proceedWrite = () => {
          // unlock
          setPath(this.queuedWrites, ['locks', lng, namespace], false)
          missings.forEach((missing) => {
            if (missing.callback) missing.callback()
          })
          // rerun
          this.debouncedWrite()
        }
        writeFile(filename, resources, this.options)
          .then(proceedWrite)
          .catch(proceedWrite)
      }
      readFile(filename, this.options).then(proceed).catch(() => proceed({}))
    }
  }

  queue (lng, namespace, key, fallbackValue, callback) {
    pushPath(this.queuedWrites, [lng, namespace], { key, fallbackValue: fallbackValue || '', callback })
    this.debouncedWrite()
  }
}

Backend.type = 'backend'

export default Backend
