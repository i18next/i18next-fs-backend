import expect from 'expect.js'
import { dirname } from 'path';
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
import i18next from 'i18next'
import Backend from '../index.js'
import { removeFile, removeFileSync } from '../lib/writeFile.js'

i18next.init()

describe('BackendConnector as caching layer', () => {
  let connector

  before((done) => {
    connector = i18next.services.backendConnector
    connector.backend = new Backend(i18next.services, {
      loadPath: `${__dirname}/locales/{{lng}}/{{ns}}.json`,
      addPath: `${__dirname}/locales/{{lng}}/{{ns}}.json`,
      expirationTime: 250
    })
    removeFile(`${__dirname}/locales/de/test_caching.json`).then(done).catch(() => done())
  })

  after((done) => {
    removeFile(`${__dirname}/locales/de/test_caching.json`).then(done).catch(() => done())
  })

  describe('caching szenario', () => {
    it('should work as expected', (done) => {
      connector.backend.read(['de'], ['test_caching'], (err, ns) => {
        expect(err).to.be.ok()

        connector.backend.save('de', 'test_caching', { key: 'save in cache' }, (err) => {
          expect(err).not.to.be.ok()

          connector.backend.read(['de'], ['test_caching'], (err, ns) => {
            expect(err).not.to.be.ok()
            expect(ns).to.eql({
              key: 'save in cache'
            })

            setTimeout(() => {
              connector.backend.read(['de'], ['test_caching'], (err, ns) => {
                try {
                  expect(err).to.be.ok()
                  done()
                } catch (e) {
                  done(e)
                }
              })
            }, 300)
          })
        })
      })
    })
  })
})
