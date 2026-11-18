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

describe('an expired file whose addPath function throws', () => {
  const loadPath = `${__dirname}/locales/{{lng}}/{{ns}}.json`
  const addPath = () => { throw new Error('addPath failed') }

  it('calls back with that error when reading synchronously', () => {
    const backend = new Backend({}, { loadPath, addPath, expirationTime: 1 }, { initAsync: false })
    const errors = []
    backend.read('en', 'test', (err) => errors.push(err))
    expect(errors).to.have.length(1)
    expect(errors[0].message).to.be('addPath failed')
  })

  it('calls back with that error when reading asynchronously', (done) => {
    const backend = new Backend({}, { loadPath, addPath, expirationTime: 1 })
    backend.read('en', 'test', (err) => {
      expect(err.message).to.be('addPath failed')
      done()
    })
  })
})
