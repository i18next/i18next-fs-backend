import { expect, test, describe, beforeEach, afterEach } from "bun:test"
import i18next from 'i18next'
import Backend from '../../index.js'
import { removeFile } from '../../lib/writeFile.js'

i18next.init({ fallbackLng: 'en', ns: 'test' })

describe('BackendConnector as caching layer', () => {
  let connector

  beforeEach((done) => {
    connector = i18next.services.backendConnector
    connector.backend = new Backend(i18next.services, {
      loadPath: `${__dirname}/locales/{{lng}}/{{ns}}.json`,
      addPath: `${__dirname}/locales/{{lng}}/{{ns}}.json`,
      expirationTime: 250
    })
    removeFile(`${__dirname}/locales/de/test_caching.json`).then(done).catch(() => done())
  })

  afterEach((done) => {
    removeFile(`${__dirname}/locales/de/test_caching.json`).then(done).catch(() => done())
  })

  describe('caching szenario', () => {
    test('should work as expected', (done) => {
      connector.backend.read(['de'], ['test_caching'], (err, ns) => {
        expect(err).toBeTruthy()

        connector.backend.save('de', 'test_caching', { key: 'save in cache' }, (err) => {
          expect(err).toBeFalsy()

          connector.backend.read(['de'], ['test_caching'], (err, ns) => {
            expect(err).toBeFalsy()
            expect(ns).toEqual({
              key: 'save in cache'
            })

            setTimeout(() => {
              connector.backend.read(['de'], ['test_caching'], (err, ns) => {
                try {
                  expect(err).toBeTruthy()
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
