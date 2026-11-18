import expect from 'expect.js'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import Backend from '../index.js'
const __dirname = dirname(fileURLToPath(import.meta.url))

describe('a read callback that throws', () => {
  const loadPath = `${__dirname}/locales/{{lng}}/{{ns}}.json`

  it('is called once when reading synchronously', () => {
    const backend = new Backend({}, { loadPath }, { initAsync: false })
    let calls = 0
    expect(() => backend.read('en', 'test', () => {
      calls++
      throw new Error('callback failed')
    })).to.throwError(/callback failed/)
    expect(calls).to.be(1)
  })

  it('is called once when reading asynchronously', async () => {
    const listeners = process.listeners('unhandledRejection')
    process.removeAllListeners('unhandledRejection')
    let calls = 0
    let unhandled
    try {
      const rejection = new Promise((resolve) => process.once('unhandledRejection', resolve))
      const backend = new Backend({}, { loadPath })
      backend.read('en', 'test', () => {
        calls++
        throw new Error('callback failed')
      })
      unhandled = await rejection
    } finally {
      listeners.forEach((l) => process.on('unhandledRejection', l))
    }
    expect(calls).to.be(1)
    expect(unhandled.message).to.be('callback failed')
  })
})
