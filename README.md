# Introduction

[![Actions](https://github.com/i18next/i18next-fs-backend/workflows/node/badge.svg)](https://github.com/i18next/i18next-fs-backend/actions?query=workflow%3Anode)
[![Actions deno](https://github.com/i18next/i18next-fs-backend/workflows/deno/badge.svg)](https://github.com/i18next/i18next-fs-backend/actions?query=workflow%3Adeno)
[![Travis](https://img.shields.io/travis/i18next/i18next-fs-backend/master.svg?style=flat-square)](https://travis-ci.org/i18next/i18next-fs-backend)
[![npm version](https://img.shields.io/npm/v/i18next-fs-backend.svg?style=flat-square)](https://www.npmjs.com/package/i18next-fs-backend)

This is an i18next backend to be used in Node.js and Deno. It will load resources from the file system.

It's based on the deprecated [i18next-node-fs-backend](https://github.com/i18next/i18next-node-fs-backend) and can mostly be used as a drop-in replacement.

It will load resources from filesystem. Right now it supports following filetypes:

- .json
- .json5
- .yml/.yaml
- .js/.ts (very limited, checks for `exports` or `export default`)

# Getting started

```bash
# npm package
$ npm install i18next-fs-backend
```

Wiring up:

```js
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';

i18next.use(Backend).init(i18nextOptions);
```

for Deno:

```js
import i18next from 'https://deno.land/x/i18next/index.js'
import Backend from 'https://deno.land/x/i18next_fs_backend/index.js'

i18next.use(Backend).init(i18nextOptions);
```

- As with all modules you can either pass the constructor function (class) to the i18next.use or a concrete instance.

## Backend Options

```js
{
  // path where resources get loaded from, or a function
  // returning a path:
  // function(lngs, namespaces) { return customPath; }
  // the returned path will interpolate lng, ns if provided like giving a static path
  loadPath: '/locales/{{lng}}/{{ns}}.json',

  // path to post missing resources
  addPath: '/locales/{{lng}}/{{ns}}.missing.json',

  // if you use i18next-fs-backend as caching layer in combination with i18next-chained-backend, you can optionally set an expiration time
  // an example on how to use it as cache layer can be found here: https://github.com/i18next/i18next-fs-backend/blob/master/example/caching/app.js
  // expirationTime: 60 * 60 * 1000
}
```

Options can be passed in:

**preferred** - by setting options.backend in i18next.init:

```js
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';

i18next.use(Backend).init({
  backend: options,
});
```

on construction:

```js
import Backend from 'i18next-fs-backend';
const Backend = new Backend(null, options);
```

via calling init:

```js
import Backend from 'i18next-fs-backend';
const Backend = new Backend();
Backend.init(null, options);
```

## TypeScript

To properly type the backend options, you can import the `FsBackendOptions` interface and use it as a generic type parameter to the i18next's `init` method, e.g.:

```ts
import i18n from 'i18next'
import FsBackend, { FsBackendOptions } from 'i18next-fs-backend'

i18n
  .use(FsBackend)
  .init<FsBackendOptions>({
    backend: {
      // fs backend options
    },

    // other i18next options
  })
```

# If set i18next initImmediate option to false it will load the files synchronously

```js
// i18n.js
const { join } = require('path')
const { readdirSync, lstatSync } = require('fs')
const i18next = require('i18next')
const Backend = require('i18next-fs-backend')
i18next
  .use(Backend)
  .init({
    // debug: true,
    initImmediate: false,
    fallbackLng: 'en',
    lng: 'en',
    preload: readdirSync(join(__dirname, '../locales')).filter((fileName) => {
      const joinedPath = join(join(__dirname, '../locales'), fileName)
      const isDirectory = lstatSync(joinedPath).isDirectory()
      return isDirectory
    }),
    ns: 'backend-app',
    defaultNS: 'backend-app',
    backend: {
      loadPath: join(__dirname, '../locales/{{lng}}/{{ns}}.json')
    }
  })
```

---

<h3 align="center">Gold Sponsors</h3>

<p align="center">
  <a href="https://locize.com/" target="_blank">
    <img src="https://raw.githubusercontent.com/i18next/i18next/master/assets/locize_sponsor_240.gif" width="240px">
  </a>
</p>
