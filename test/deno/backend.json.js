const { test } = Deno
import { assertEquals } from 'https://deno.land/std/testing/asserts.ts'
import { __ } from 'https://deno.land/x/dirname/mod.ts'
const { __dirname } = __(import.meta)
import i18next from 'https://deno.land/x/i18next/index.js'
import Backend from '../../index.js'
import { writeFile } from '../../lib/writeFile.js'
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

test('BackendConnector with normal json', async () => {
  // before
  i18next.init()

  const connector = i18next.services.backendConnector
  connector.backend = new Backend(i18next.services, {
    loadPath: `${__dirname}/../locales/{{lng}}/{{ns}}.json`,
    addPath: `${__dirname}/../locales/{{lng}}/{{ns}}.json`
  })
  await wait(200) // I don't know why, probably because of debouncedWrite
  await writeFile(`${__dirname}/../locales/en/test.json`, { key: 'passing' })

  // test
  await (new Promise((resolve, reject) => {
    connector.load(['en'], ['test'], (err) => err ? reject(err) : resolve())
  }))

  assertEquals(connector.store.getResourceBundle('en', 'test'), {
    key: 'passing'
  })

  await (new Promise((resolve, reject) => {
    connector.backend.create(['en'], 'test', 'newKey', 'fallback', (err) => err ? reject(err) : resolve())
  }))

  const ns = await (new Promise((resolve, reject) => {
    connector.backend.read(['en'], ['test'], (err, ns) => err ? reject(err) : resolve(ns))
  }))

  assertEquals(ns, {
    key: 'passing',
    newKey: 'fallback'
  })

  // after
  await writeFile(`${__dirname}/../locales/en/test.json`, { key: 'passing' })
  await wait(500) // I don't know why, probably because of debouncedWrite
})
