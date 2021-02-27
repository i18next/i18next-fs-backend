const { test } = Deno
import { assertEquals } from 'https://deno.land/std/testing/asserts.ts'
import { fromFileUrl, dirname } from 'https://deno.land/std/path/mod.ts'
const __dirname = dirname(fromFileUrl(import.meta.url))
import i18next from 'https://deno.land/x/i18next/index.js'
import Backend from '../../index.js'
import { removeFile } from '../../lib/writeFile.js'
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

test('BackendConnector as caching layer', async () => {
  // before
  i18next.init()

  const connector = i18next.services.backendConnector
  connector.backend = new Backend(i18next.services, {
    loadPath: `${__dirname}/../locales/{{lng}}/{{ns}}.json`,
    addPath: `${__dirname}/../locales/{{lng}}/{{ns}}.json`,
    expirationTime: 250
  })
  await wait(200) // I don't know why, probably because of debouncedWrite
  try {
    await removeFile(`${__dirname}/../locales/en/test_caching.json`)
  } catch (e) {}

  // test
  await (new Promise((resolve, reject) => {
    connector.backend.read(['en'], ['test_caching'], (err) => {
      if (!err) return reject(new Error('An error is expected here!'))
      resolve()
    })
  }))

  await (new Promise((resolve, reject) => {
    connector.backend.save('en', 'test_caching', { key: 'save in cache' }, (err) => {
      if (err) return reject(err)
      resolve()
    })
  }))

  const ns = await (new Promise((resolve, reject) => {
    connector.backend.read(['en'], ['test_caching'], (err, ns) => err ? reject(err) : resolve(ns))
  }))

  assertEquals(ns, {
    key: 'save in cache'
  })

  await wait(300)

  await (new Promise((resolve, reject) => {
    connector.backend.read(['en'], ['test_caching'], (err) => {
      if (!err) return reject(new Error('An error is expected here!'))
      resolve()
    })
  }))

  // after
  try {
    await removeFile(`${__dirname}/../locales/en/test_caching.json`)
  } catch (e) {}
  await wait(500) // I don't know why, probably because of debouncedWrite
})
