# dayjs-plugin-buddhist-localized-format

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

A [Day.js](https://day.js.org/) plugin that combines the behavior of the
official `buddhistEra` and `localizedFormat` plugins into one, and adds
something neither of them supports: a **per-call override** to force-enable
or force-disable Buddhist Era (B.E. / พ.ศ.) year conversion.

## Features

- **Locale-aware** — years are shown as B.E. (Gregorian year + 543)
  automatically when the active locale is Thai (`th`), or any locale you
  register.
- **Full `localizedFormat` support** — `LT`, `LTS`, `L`, `LL`, `LLL`, `LLLL`
  all work, expanded using the active locale's own format strings.
- **Dynamic toggle** — pass `{ be: true | false }` as a second argument to
  `format()` to override the locale default for that call only.
- Zero runtime dependencies beyond `dayjs` itself (peer dependency).
- Ships as ESM + CJS + TypeScript declarations.

## Install

```bash
npm install @chettapong/dayjs-plugin-buddhist-localized-format
```

`dayjs` is a peer dependency — make sure it's installed too:

```bash
npm install dayjs
```

## Setup

```ts
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import buddhistLocalizedFormat from '@chettapong/dayjs-plugin-buddhist-localized-format';

// `buddhistLocales` is optional and defaults to ['th']
dayjs.extend(buddhistLocalizedFormat, { buddhistLocales: ['th'] });
```

> **Do not** also `dayjs.extend(require('dayjs/plugin/buddhistEra'))` or
> `dayjs/plugin/localizedFormat`. This plugin replaces both; stacking them
> would double-wrap `format()` and produce incorrect output.

## Usage

### 1. Locale-aware auto conversion

```ts
dayjs.locale('en');
dayjs('2026-07-07').format('LL'); // "July 7, 2026"

dayjs.locale('th');
dayjs('2026-07-07').format('LL'); // "7 กรกฎาคม 2569"
```

### 2. LocalizedFormat tokens

```ts
dayjs.locale('th');
dayjs('2026-07-07T14:30:00').format('LLLL');
// "วันอังคารที่ 7 กรกฎาคม 2569 เวลา 14:30"
```

### 3. Force-disable B.E. on a Thai locale

```ts
dayjs.locale('th');
dayjs('2026-07-07').format('L LT', { be: false });
// "07/07/2026 14:30" — Gregorian year, overriding the locale default
```

### 4. Force-enable B.E. on a non-Thai locale

```ts
dayjs.locale('en');
dayjs('2026-07-07').format('LL', { be: true });
// "July 7, 2569"
```

### 5. Registering additional Buddhist-Era locales

```ts
dayjs.extend(buddhistLocalizedFormat, { buddhistLocales: ['th', 'lo', 'km'] });
```

## TypeScript

`format()`'s extra parameter is type-checked automatically once this
package has been imported anywhere in your program (it augments Day.js's
own `Dayjs` interface):

```ts
dayjs().format('L LT', { be: false }); // ✅ type-checks
```

## API

### `dayjs.extend(buddhistLocalizedFormat, options?)`

| Option              | Type       | Default  | Description                                     |
| ------------------- | ---------- | -------- | ----------------------------------------------- |
| `buddhistLocales`   | `string[]` | `['th']` | Locale codes that default to Buddhist Era.      |

### `dayjs(...).format(formatStr?, options?)`

| Option | Type      | Description                                                |
| ------ | --------- | ---------------------------------------------------------- |
| `be`   | `boolean` | Force-enable/disable B.E. conversion for this call only.   |

## Development

```bash
npm install     # install dependencies
npm test        # run the vitest suite
npm run typecheck
npm run build   # produce dist/ (ESM + CJS + .d.ts) via tsup
```

## How it works

Day.js's core `format(formatStr)` only accepts a single argument, and the
official `buddhistEra`/`localizedFormat` plugins each independently wrap
`proto.format`. There's no seam to thread a second `options` argument
through two separately-wrapped functions, and the order they'd need to run
in (expand `L`-style tokens first, *then* swap the year) has to be
guaranteed. This plugin reimplements both behaviors in a single wrapper, in
the correct order:

1. Expand `LT` / `LTS` / `L` / `LL` / `LLL` / `LLLL` into raw Day.js tokens
   using the active locale's `formats` object (falling back to English
   defaults).
2. Decide whether B.E. applies: the `{ be }` call option wins if provided,
   otherwise fall back to whether the active locale is in
   `buddhistLocales`.
3. If B.E. applies, replace `YYYY`/`YY` with the Buddhist Era year
   (Gregorian year + 543) as literal digits before calling the original
   `format()`.

Text inside literal Day.js escapes (`[...]`) is protected at every step, so
`format('[Year:] YYYY')` never has "Year" mistaken for a token.

## License

[MIT License](./LICENSE)

Copyright (c) 2026 Chettapong Pinsuwan

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/@chettapong/dayjs-plugin-buddhist-localized-format/latest.svg
[npm-version-href]: https://npmjs.com/package/@chettapong/dayjs-plugin-buddhist-localized-format

[npm-downloads-src]: https://img.shields.io/npm/dt/@chettapong/dayjs-plugin-buddhist-localized-format.svg
[npm-downloads-href]: https://npmjs.com/package/@chettapong/dayjs-plugin-buddhist-localized-format

[license-src]: https://img.shields.io/npm/l/@chettapong/dayjs-plugin-buddhist-localized-format.svg
[license-href]: https://npmjs.com/package/@chettapong/dayjs-plugin-buddhist-localized-format
