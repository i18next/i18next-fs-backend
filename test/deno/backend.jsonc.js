const { test, writeTextFile } = Deno
import { assertEquals } from 'https://deno.land/std/testing/asserts.ts'
import { fromFileUrl, dirname } from 'https://deno.land/std/path/mod.ts'
const __dirname = dirname(fromFileUrl(import.meta.url))
import i18next from 'https://deno.land/x/i18next/index.js'
import Backend from '../../index.js'
import { writeFile } from '../../lib/writeFile.js'
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

test('BackendConnector with jsonc', async () => {
  // before
  i18next.init()

  const connector = i18next.services.backendConnector
  connector.backend = new Backend(i18next.services, {
    loadPath: `${__dirname}/../locales/{{lng}}/{{ns}}.jsonc`,
    addPath: `${__dirname}/../locales/{{lng}}/{{ns}}.jsonc`
  })
  await wait(200) // I don't know why, probably because of debouncedWrite
  await writeFile(`${__dirname}/../locales/en/test.jsonc`, { key: 'passing' })
  await writeTextFile(`${__dirname}/../locales/en/test-with-comments.jsonc`, `{
    "key": "passing",
    // line comment
    "commented": "value", /* inline block */
    /* block comment
       multiple lines */
    "block": "value"
  }`)

  // test
  await (new Promise((resolve, reject) => {
    connector.load(['en'], ['test'], (err) => err ? reject(err) : resolve())
  }))

  assertEquals(connector.store.getResourceBundle('en', 'test'), {
    key: 'passing'
  })

  await (new Promise((resolve, reject) => {
    connector.load(['en'], ['test-with-comments'], (err) => err ? reject(err) : resolve())
  }))

  assertEquals(connector.store.getResourceBundle('en', 'test-with-comments'), {
    key: 'passing',
    commented: 'value',
    block: 'value'
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
  await writeFile(`${__dirname}/../locales/en/test.jsonc`, { key: 'passing' })
  await writeTextFile(`${__dirname}/../locales/en/test-with-comments.jsonc`, `{
    "key": "passing",
    // line comment
    "commented": "value", /* inline block */
    /* block comment
       multiple lines */
    "block": "value"
  }`)
  await wait(500) // I don't know why, probably because of debouncedWrite
})
