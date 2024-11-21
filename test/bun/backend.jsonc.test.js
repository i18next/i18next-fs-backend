import { expect, test, describe, beforeEach, afterEach } from "bun:test"
import i18next from 'i18next'
import Backend from '../../index.js'
import { writeFile } from '../../lib/writeFile.js'
import fs from 'node:fs'

i18next.init()

describe('BackendConnector with jsonc', () => {
  let connector

  beforeEach((done) => {
    connector = i18next.services.backendConnector
    connector.backend = new Backend(i18next.services, {
      loadPath: `${import.meta.dir}/../locales/{{lng}}/{{ns}}.jsonc`,
      addPath: `${import.meta.dir}/../locales/{{lng}}/{{ns}}.jsonc`
    })
    writeFile(`${import.meta.dir}/locales/en/test.jsonc`, { key: 'passing' })
      .then(() => {
        fs.writeFile(`${import.meta.dir}/locales/en/test-with-comments.jsonc`, `{
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

  afterEach((done) => {
    writeFile(`${import.meta.dir}/../locales/en/test.jsonc`, { key: 'passing' })
      .then(() => {
        fs.writeFile(`${import.meta.dir}/../locales/en/test-with-comments.jsonc`, `{
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
    test('should load data', (done) => {
      connector.load(['en'], ['test'], (err) => {
        expect(err).toBeFalsy()
        expect(connector.store.getResourceBundle('en', 'test')).toEqual({
          key: 'passing'
        })
        done()
      })
    })

    test('should load data with comments', (done) => {
      connector.load(['en'], ['test-with-comments'], (err) => {
        expect(err).not.toBeFalsy()
        expect(connector.store.getResourceBundle('en', 'test-with-comments')).toEqual({
          key: 'passing',
          commented: 'value',
          block: 'value'
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
