import { defaults, debounce, getPath, setPath, pushPath, interpolatePath } from './utils.js'
import { readFile, readFileSync } from './readFile.js'
import { writeFile, removeFile } from './writeFile.js'

const getDefaults = () => {
  return {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
    addPath: '/locales/{{lng}}/{{ns}}.missing.json',
    ident: 2,
    parse: JSON.parse,
    stringify: JSON.stringify
    // expirationTime: 60 * 60 * 1000
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
    // kept apart from queuedWrites so no language code (e.g. `locks`) can collide with it
    this.locks = {}
    this.debouncedWrite = debounce(this.write, 250)
  }

  read (language, namespace, callback) {
    let loadPath = this.options.loadPath
    if (typeof this.options.loadPath === 'function') {
      loadPath = this.options.loadPath(language, namespace)
    }
    const filename = interpolatePath(loadPath, { lng: language, ns: namespace })
    if (filename == null) {
      return callback(new Error('i18next-fs-backend: unsafe lng/ns value — refusing to build filesystem path'), false)
    }
    // the callback is called outside the try and not with .catch(): an error it throws must not call it a second time
    const loaded = ({ data, stat }) => {
      const timestamp = stat && stat.mtime && stat.mtime.getTime()
      if (this.options.expirationTime && timestamp && timestamp + this.options.expirationTime < Date.now()) {
        try {
          this.removeFile(language, namespace)
        } catch (err) {
          return callback(err, false) // an addPath function that throws, no retry
        }
        return callback(new Error('File expired!'), false) // no retry
      }
      callback(null, data, timestamp)
    }
    if (this.allOptions.initAsync === false || this.allOptions.initImmediate === false) {
      let result
      try {
        result = readFileSync(filename, this.options)
      } catch (err) {
        return callback(err, false) // no retry
      }
      return loaded(result)
    }
    readFile(filename, this.options)
      .then(loaded, (err) => callback(err, false)) // no retry
  }

  create (languages, namespace, key, fallbackValue, callback) {
    if (typeof callback !== 'function') callback = () => {}
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

  // this way i18next-fs-backend can be used as cache layer in combination with i18next-chained-backend
  save (language, namespace, data, callback) {
    if (!callback) callback = () => {}

    const keys = Object.keys(data)
    let todo = keys.length
    const done = () => {
      if (!--todo) callback()
    }

    keys.forEach((key) => {
      // eslint-disable-next-line no-useless-call
      this.queue.call(this, language, namespace, key, data[key], done)
    })
  }

  removeFile (language, namespace) {
    let addPath = this.options.addPath
    if (typeof this.options.addPath === 'function') {
      addPath = this.options.addPath(language, namespace)
    }
    const filename = interpolatePath(addPath, { lng: language, ns: namespace })
    if (filename == null) return
    removeFile(filename, this.options)
      .then(() => {})
      .catch(() => {})
  }

  write () {
    // Own enumerable keys only: `for...in` walks the prototype chain, so an
    // Object.prototype polluted by any other library in the process would be
    // iterated here and turned into writeFile() calls. setPath/pushPath
    // already refuse to create unsafe own keys, and interpolatePath still
    // validates before anything is written, so this closes the amplification
    // rather than a traversal.
    for (const lng of Object.keys(this.queuedWrites)) {
      for (const ns of Object.keys(this.queuedWrites[lng])) {
        this.writeFile(lng, ns)
      }
    }
  }

  writeFile (lng, namespace) {
    const lock = getPath(this.locks, [lng, namespace])
    if (lock) return

    let addPath = this.options.addPath
    if (typeof this.options.addPath === 'function') {
      addPath = this.options.addPath(lng, namespace)
    }

    const filename = interpolatePath(addPath, { lng, ns: namespace })
    if (filename == null) {
      // drop unsafe queued writes silently — attempting to persist them
      // would either fail or (worse) land in an unexpected filesystem location
      setPath(this.queuedWrites, [lng, namespace], [])
      return
    }

    const missings = getPath(this.queuedWrites, [lng, namespace])
    setPath(this.queuedWrites, [lng, namespace], [])

    if (missings.length) {
      // lock
      setPath(this.locks, [lng, namespace], true)

      const proceedWrite = () => {
        // unlock
        setPath(this.locks, [lng, namespace], false)
        missings.forEach((missing) => {
          if (missing.callback) missing.callback()
        })
        // rerun
        this.debouncedWrite()
      }

      const proceed = ({ data }) => {
        missings.forEach((missing) => {
          const path = this.allOptions.keySeparator === false ? [missing.key] : (missing.key.split(this.allOptions.keySeparator || '.'))
          try {
            setPath(data, path, missing.fallbackValue)
          } catch (e) {
            // a parent is a string, number, boolean or array (`a` and `a.b`, `a.length`, `a.0`): keep the
            // key flat. Not matched by message: V8 and JavaScriptCore (Bun) word these errors differently.
            if (path.length < 2) throw e
            setPath(data, [missing.key], missing.fallbackValue)
          }
        })
        return writeFile(filename, data, this.options)
      }
      // only a failed read starts from an empty file: an error in proceed (a key, stringify) used to land in
      // that fallback too and overwrite the file with only the new keys, or throw again from the timer
      readFile(filename, this.options)
        .catch(() => ({ data: {} }))
        .then(proceed)
        .then(proceedWrite, proceedWrite)
    }
  }

  queue (lng, namespace, key, fallbackValue, callback) {
    pushPath(this.queuedWrites, [lng, namespace], { key, fallbackValue: fallbackValue || '', callback })
    this.debouncedWrite()
  }
}

Backend.type = 'backend'
// i18next >= 26.7 calls read and create with a callback (and create with the options too) instead of
// guessing that from the number of parameters
Backend.callbackApi = true

export default Backend
