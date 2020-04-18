const i18next = require('i18next')
const Backend = require('../../cjs')

i18next.use(Backend).init({
  // initImmediate: false,
  lng: 'en',
  fallbackLng: 'en',
  preload: ['en', 'de'],
  ns: ['translation'],
  defaultNS: 'translation',
  backend: {
    loadPath: 'locales/{{lng}}/{{ns}}.json'
  }
}, (err, t) => {
  if (err) return console.error(err)
  console.log('i18next is ready...')
  console.log(t('welcome'))
  console.log(t('welcome', { lng: 'de' }))
})
// this will only work if initImmediate is set to false, because it's async
console.log(i18next.t('welcome'))
console.log(i18next.t('welcome', { lng: 'de' }))
