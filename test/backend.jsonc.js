import expect from 'expect.js'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import fs from 'node:fs'
const __dirname = dirname(fileURLToPath(import.meta.url))
import i18next from 'i18next'
import Backend from '../index.js'
import { writeFile } from '../lib/writeFile.js'

i18next.init()

describe('BackendConnector with jsonc', () => {
  let connector

  before((done) => {
    connector = i18next.services.backendConnector
    connector.backend = new Backend(i18next.services, {
      loadPath: `${__dirname}/locales/{{lng}}/{{ns}}.jsonc`,
      addPath: `${__dirname}/locales/{{lng}}/{{ns}}.jsonc`
    })
    writeFile(`${__dirname}/locales/en/test.jsonc`, { key: 'passing' })
      .then(() => {
        fs.writeFile(`${__dirname}/locales/en/test-with-comments.jsonc`, `{
          "key": "passing",
          // line comment
          "commented": "value", /* inline block */
          /* block comment
             multiple lines */
          "block": "value"
        }`, done)
      })
      .catch(done)
  })

  after((done) => {
    writeFile(`${__dirname}/locales/en/test.jsonc`, { key: 'passing' })
      .then(() => {
        fs.writeFile(`${__dirname}/locales/en/test-with-comments.jsonc`, `{
          "key": "passing",
          // line comment
          "commented": "value", /* inline block */
          /* block comment
             multiple lines */
          "block": "value"
        }`, done)
      })
      .catch(done)
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

    it('should load data with comments', (done) => {
      connector.load(['en'], ['test-with-comments'], (err) => {
        expect(err).not.to.be.ok()
        expect(connector.store.getResourceBundle('en', 'test-with-comments')).to.eql({
          key: 'passing',
          commented: 'value',
          block: 'value'
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
