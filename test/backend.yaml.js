import expect from 'expect.js'
import { dirname } from 'path';
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
import i18next from 'i18next'
import Backend from '../index.js'
import { writeFile } from '../lib/writeFile.js'

i18next.init()

describe('BackendConnector with yaml', () => {
  let connector

  before((done) => {
    connector = i18next.services.backendConnector
    connector.backend = new Backend(i18next.services, {
      loadPath: `${__dirname}/locales/{{lng}}/{{ns}}.yaml`,
      addPath: `${__dirname}/locales/{{lng}}/{{ns}}.yaml`
    })
    writeFile(`${__dirname}/locales/en/test.yaml`, { key: 'passing' }).then(done).catch(done)
  })

  after((done) => {
    writeFile(`${__dirname}/locales/en/test.yaml`, { key: 'passing' }).then(done).catch(done)
  })

  describe('#load', () => {
    it('should load data', (done) => {
      connector.load(['en'], ['test'], (err) => {
        expect(err).not.to.be.ok()
        expect(connector.store.getResourceBundle('en', 'test')).to.eql({
          key: 'passing'
        })
        done()
      })
    })
  })

  describe('#saveMissing', () => {
    it('should load data', (done) => {
      connector.backend.create(['en'], 'test', 'newKey', 'fallback', (err) => {
        expect(err).not.to.be.ok()
        connector.backend.read(['en'], ['test'], (err, ns) => {
          expect(err).not.to.be.ok()
          expect(ns).to.eql({
            key: 'passing',
            newKey: 'fallback'
          })
          done()
        })
      })
    })
  })
})
