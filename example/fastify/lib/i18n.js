import { dirname, join } from 'path'
import { readdirSync, lstatSync } from 'fs'
import { fileURLToPath } from 'url'
import i18next from 'i18next'
import Backend from 'i18next-fs-backend'
import i18nextMiddleware from 'i18next-http-middleware'

const __dirname = dirname(fileURLToPath(import.meta.url))
const localesFolder = join(__dirname, '../locales')

i18next
  .use(i18nextMiddleware.LanguageDetector)
  .use(Backend)
  .init({
    // debug: true,
    initAsync: false, // setting initImediate to false, will load the resources synchronously
    fallbackLng: 'en',
    preload: readdirSync(localesFolder).filter((fileName) => {
      const joinedPath = join(localesFolder, fileName)
      return lstatSync(joinedPath).isDirectory()
    }),
    backend: {
      loadPath: join(localesFolder, '{{lng}}/{{ns}}.json')
    }
  })

export function register (app) {
  app.register(i18nextMiddleware.plugin, { i18next })
}

export { i18next }
