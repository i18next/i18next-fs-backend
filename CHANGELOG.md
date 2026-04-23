### 2.6.5

- fix: allow forward slashes in `ns` values so nested namespace names (mapping to subfolder locale files such as `public/locales/en/a/b.json`) load correctly again. 2.6.4's security fix applied the same strict path-segment check to both `lng` and `ns`, which was correct for `lng` (no BCP-47 shape contains `/`) but over-strict for `ns` — nested namespaces containing `/` were never officially supported, but the behaviour fell out of the implicit string-substitution semantics of `loadPath` and is common enough in the wild to be worth accommodating. `isSafePathSegment` is now split into `isSafeLangSegment` (strict — still rejects `/`) and `isSafeNsSegment` (loose — allows `/` but still rejects `..`, `\`, control chars, prototype keys, and oversized inputs). `isSafePathSegment` is kept as a backwards-compatible alias for the strict check. The 2.6.4 security fix remains in force for every concrete attack pattern from the original advisory. Fixes [#74](https://github.com/i18next/i18next-fs-backend/issues/74).

### 2.6.4

Security release — all issues found via an internal audit. See published advisory [GHSA-8847-338w-5hcj](https://github.com/i18next/i18next-fs-backend/security/advisories/GHSA-8847-338w-5hcj).

- security: refuse to build filesystem paths when `lng` or `ns` values contain `..`, path separators (`/`, `\`), control characters, prototype keys (`__proto__` / `constructor` / `prototype`), or exceed 128 chars. Prevents arbitrary filesystem read / write via attacker-controlled language-code values. Any legitimate i18next language-code shape (BCP-47-like, underscores, hyphens, dots, `+`-joined multi-language requests) is still accepted ([GHSA-8847-338w-5hcj](https://github.com/i18next/i18next-fs-backend/security/advisories/GHSA-8847-338w-5hcj))
- docs: new "Security considerations" README section — documents the filesystem-path sanitiser and clarifies the trust model around `.js`/`.ts` locale files (their content is `eval`-ed, so they must be treated as code). The `eval` behaviour itself is retained: dynamic expressions in `.js`/`.ts` locale files are an intentional feature, and safe replacements like `import()` are async-only and not viable for this sync-capable code path.
- chore: ignore `.env*` and `*.pem`/`*.key` files in `.gitignore`.

### 2.6.3

- use own interpolation function instead of relying on i18next's interpolator

### 2.6.1

- Bump js-yaml from 4.1.0 to 4.1.1 (#64)

### 2.6.0

- support `initImmediate` -> `initAsync` renaming of i18next v24

### 2.5.0

- fix for Deno 2 and removal of unnecessary .cjs file
- for esm build environments not supporting top-level await, you should import the `i18next-fs-backend/cjs` export or stay at v2.4.0
