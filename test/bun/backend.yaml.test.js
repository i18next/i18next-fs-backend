import { expect, test, describe, beforeEach, afterEach } from "bun:test"
import i18next from 'i18next'
import Backend from '../../index.js'
import { writeFile } from '../../lib/writeFile.js'

i18next.init()

describe('BackendConnector with yaml', () => {
  let connector

  beforeEach((done) => {
    connector = i18next.services.backendConnector
    connector.backend = new Backend(i18next.services, {
      loadPath: `${import.meta.dir}/../locales/{{lng}}/{{ns}}.yaml`,
      addPath: `${import.meta.dir}/../locales/{{lng}}/{{ns}}.yaml`
    })
    writeFile(`${import.meta.dir}/../locales/en/test.yaml`, { key: 'passing' }).then(done).catch(done)
  })

  afterEach((done) => {
    writeFile(`${import.meta.dir}/../locales/en/test.yaml`, { key: 'passing' }).then(done).catch(done)
  })

  describe('#load', () => {
    test('should load data', (done) => {
      connector.load(['en'], ['test'], (err) => {
        expect(err).toBeFalsy()
        expect(connector.store.getResourceBundle('en', 'test')).toEqual({
          key: 'passing'
        })
        done()
      })
    })
  })

  describe('#saveMissing', () => {
    test('should load data', (done) => {
      connector.backend.create(['en'], 'test', 'newKey', 'fallback', (err) => {
        expect(err).toBeFalsy()
        connector.backend.read(['en'], ['test'], (err, ns) => {
          expect(err).toBeFalsy()
          expect(ns).toEqual({
            key: 'passing',
            newKey: 'fallback'
          })
          done()
        })
      })
    })
  })
})
