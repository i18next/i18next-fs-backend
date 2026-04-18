import expect from 'expect.js'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
import i18next from 'i18next'
import Backend from '../index.js'
import { isSafePathSegment, interpolate, interpolatePath } from '../lib/utils.js'

// Security tests for fixes shipped in the 2.6.x patch release.
// See CHANGELOG for associated GHSA advisory.

describe('security', () => {
  describe('isSafePathSegment', () => {
    it('accepts arbitrary language-code shapes', () => {
      expect(isSafePathSegment('en')).to.be(true)
      expect(isSafePathSegment('de-DE')).to.be(true)
      expect(isSafePathSegment('en_US')).to.be(true)
      expect(isSafePathSegment('zh-Hant-HK')).to.be(true)
      expect(isSafePathSegment('pirate-speak')).to.be(true)
      expect(isSafePathSegment('my-custom.ns')).to.be(true)
    })

    it('rejects path-traversal / separator / control-char payloads', () => {
      expect(isSafePathSegment('../etc/passwd')).to.be(false)
      expect(isSafePathSegment('..')).to.be(false)
      expect(isSafePathSegment('foo/bar')).to.be(false)
      expect(isSafePathSegment('foo\\bar')).to.be(false)
      expect(isSafePathSegment('en\r\n')).to.be(false)
      expect(isSafePathSegment('en\u0000')).to.be(false)
      expect(isSafePathSegment('__proto__')).to.be(false)
      expect(isSafePathSegment('')).to.be(false)
      expect(isSafePathSegment('a'.repeat(200))).to.be(false)
    })
  })

  describe('interpolate', () => {
    it('skips __proto__ key lookups in the data object', () => {
      const out = interpolate('x {{__proto__}} y', { __proto__: { polluted: true } })
      expect(out).to.equal('x {{__proto__}} y')
      expect(({}).polluted).to.be(undefined)
    })
    it('substitutes normal keys', () => {
      expect(interpolate('{{lng}}/{{ns}}.json', { lng: 'en', ns: 'common' }))
        .to.equal('en/common.json')
    })
  })

  describe('interpolatePath', () => {
    it('accepts plain codes', () => {
      expect(interpolatePath('/locales/{{lng}}/{{ns}}.json', { lng: 'en', ns: 'common' }))
        .to.equal('/locales/en/common.json')
    })
    it('accepts + joins (multi-language)', () => {
      expect(interpolatePath('/locales/{{lng}}/{{ns}}.json', { lng: 'en+de', ns: 'a' }))
        .to.equal('/locales/en+de/a.json')
    })
    it('returns null for path traversal', () => {
      expect(interpolatePath('/locales/{{lng}}/{{ns}}.json', { lng: '../etc/passwd', ns: 'x' }))
        .to.equal(null)
      expect(interpolatePath('/locales/{{lng}}/{{ns}}.json', { lng: 'en', ns: '..' }))
        .to.equal(null)
    })
    it('returns null for path separators', () => {
      expect(interpolatePath('/locales/{{lng}}/{{ns}}.json', { lng: 'en/../', ns: 'x' }))
        .to.equal(null)
      expect(interpolatePath('/locales/{{lng}}/{{ns}}.json', { lng: 'en\\x', ns: 'x' }))
        .to.equal(null)
    })
    it('returns null when a segment of a + join is unsafe', () => {
      expect(interpolatePath('/locales/{{lng}}.json', { lng: 'en+../etc/passwd' }))
        .to.equal(null)
    })
  })

  describe('Backend.read refuses unsafe lng/ns', () => {
    let backend
    before(() => {
      i18next.init({ fallbackLng: 'en', ns: 'test' })
      const connector = i18next.services.backendConnector
      backend = new Backend(i18next.services, {
        loadPath: `${__dirname}/locales/{{lng}}/{{ns}}.json`,
        addPath: `${__dirname}/locales/{{lng}}/{{ns}}.json`
      }, connector.allOptions || {})
    })

    it('does not read outside the locale directory on lng=../../etc/passwd', (done) => {
      backend.read('../../etc/passwd', 'test', (err, data) => {
        expect(err).to.be.an(Error)
        expect(err.message).to.contain('unsafe lng/ns')
        expect(data).to.be(false)
        done()
      })
    })

    it('does not read when ns contains a slash', (done) => {
      backend.read('en', '../../etc/passwd', (err, data) => {
        expect(err).to.be.an(Error)
        expect(err.message).to.contain('unsafe lng/ns')
        expect(data).to.be(false)
        done()
      })
    })

    it('still reads legitimate languages (regression guard)', (done) => {
      backend.read('en', 'test', (err, data) => {
        // No assertion on data (file may or may not exist in this suite) —
        // the key point is that the safety guard did NOT reject a legit value.
        if (err && /unsafe lng\/ns/.test(err.message)) {
          done(new Error('safety guard rejected a legitimate input'))
          return
        }
        done()
      })
    })
  })
})
