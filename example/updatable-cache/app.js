// serve translations
const express = require('express')
const app = express()
app.use('/locales', express.static('locales'))
app.listen(8080)

// i18next in action...
const i18next = require('i18next')
const ChainedBackend = require('i18next-chained-backend')
const FSBackend = require('i18next-fs-backend')
// const FSBackend = require('../../cjs')
const HttpBackend = require('i18next-http-backend')

const config = {
  // debug: true,
  lng: 'en',
  fallbackLng: 'en',
  preload: ['en', 'de'],
  ns: ['translation'],
  defaultNS: 'translation',
  backend: {
    cacheHitMode: 'refreshAndUpdateStore',
    refreshExpirationTime: 30 * 1000, // only after 30 seconds it should trigger a refresh if necessary
    backends: [
      FSBackend,
      HttpBackend
    ],
    backendOptions: [{
      loadPath: './locales_cache/{{lng}}/{{ns}}.json',
      addPath: './locales_cache/{{lng}}/{{ns}}.json'
    }, {
      loadPath: 'http://localhost:8080/locales/{{lng}}/{{ns}}.json'
    }]
  }
}

i18next
  .use(ChainedBackend)
  .init(config, (err, t) => {
    if (err) return console.error(err)
    console.log(t('welcome'))
    console.log(t('welcome', { lng: 'de' }))

    setInterval(() => {
      i18next.reloadResources().then(() => {
        setImmediate(() => {
          console.log(t('welcome'))
          console.log(t('welcome', { lng: 'de' }))
        })
      })
    }, 3000)
  })


