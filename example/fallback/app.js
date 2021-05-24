// serve translations
const express = require('express')
const app = express()
app.use('/locales', express.static('locales'))
const server = app.listen(8080)

// i18next in action...
const i18next = require('i18next')
const ChainedBackend = require('i18next-chained-backend')
const FSBackend = require('i18next-fs-backend')
// const FSBackend = require('../../cjs')
const HttpBackend = require('i18next-http-backend')

const initI18next = (cb) => {
  const i18n = i18next.createInstance()
  i18n.use(ChainedBackend).init({
    // debug: true,
    lng: 'en',
    fallbackLng: 'en',
    preload: ['en', 'de'],
    ns: ['translation'],
    defaultNS: 'translation',
    backend: {
      backends: [
        HttpBackend,
        FSBackend
      ],
      backendOptions: [{
        loadPath: 'http://localhost:8080/locales/{{lng}}/{{ns}}.json'
      },{
        loadPath: './locales_fallback/{{lng}}/{{ns}}.json'
      }]
    }
  }, cb)
}

initI18next((err, t) => {
  if (err) return console.error(err)
  console.log(t('welcome'))
  console.log(t('welcome', { lng: 'de' }))
  console.log('stopping http server...')
  server.close(() => {
    console.log('http server stopped')
    initI18next((err, t) => {
      if (err) return console.error(err)
      console.log(t('welcome'))
      console.log(t('welcome', { lng: 'de' }))
    })
  })
})
