# Introduction

[![Travis](https://img.shields.io/travis/i18next/i18next-fs-backend/master.svg?style=flat-square)](https://travis-ci.org/i18next/i18next-fs-backend)
[![npm version](https://img.shields.io/npm/v/i18next-fs-backend.svg?style=flat-square)](https://www.npmjs.com/package/i18next-fs-backend)

This is an i18next backend to be used in Node.js and Deno. It will load resources from the file system.

It will load resources from filesystem. Right now it supports following filetypes:

- .json
- .json5
- .yml/.yaml

# Getting started

```
# npm package
$ npm install i18next-fs-backend
```

Wiring up:

```js
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';

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
  addPath: '/locales/{{lng}}/{{ns}}.missing.json'
}
```

Options can be passed in:

**preferred** - by setting options.backend in i18next.init:

```js
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';

i18next.use(HttpApi).init({
  backend: options,
});
```

on construction:

```js
import HttpApi from 'i18next-fs-backend';
const Backend = new Backend(null, options);
```

via calling init:

```js
import Backend from 'i18next-fs-backend';
const Backend = new Backend();
Backend.init(null, options);
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