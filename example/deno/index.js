import i18next from 'https://deno.land/x/i18next/index.js'
import Backend from 'https://deno.land/x/i18next_fs_backend/index.js'
// import Backend from 'https://cdn.jsdelivr.net/gh/i18next/i18next-fs-backend/index.js'
// import Backend from 'https://raw.githubusercontent.com/i18next/i18next-fs-backend/master/index.js'
// import Backend from '../../lib/index.js'

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
