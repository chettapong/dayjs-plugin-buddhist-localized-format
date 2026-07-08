/**
 * @chettapong/dayjs-plugin-buddhist-localized-format
 * ----------------------------------------------------------------------------
 * A single, self-contained Day.js plugin that merges the behavior of the
 * official `buddhistEra` and `localizedFormat` plugins, and adds a feature
 * neither of them supports on their own: a per-call `{ be: boolean }` option
 * that force-enables/disables the Buddhist Era conversion.
 *
 * WHY NOT JUST STACK THE TWO OFFICIAL PLUGINS?
 * `dayjs().format(formatStr)` only accepts one argument in core Day.js, and
 * each official plugin independently wraps `proto.format`. There's no clean
 * seam to thread a second `options` argument through two separately-wrapped
 * functions, and the order in which they'd need to run (expand "L" tokens
 * first, THEN swap the year) has to be guaranteed. So this plugin re-implements
 * both behaviors in one wrapper, in the correct order, while accepting the
 * extra argument. The internal logic mirrors what the official plugins do.
 *
 * FEATURES
 * 1. Locale-aware: if the active locale is Thai (`th`) — or any locale you
 *    register as Buddhist-Era — years are automatically shown as B.E. (+543).
 * 2. Full localizedFormat support: LT, LTS, L, LL, LLL, LLLL all work.
 * 3. Per-call override: dayjs().format("L LT", { be: false | true })
 */

import type { PluginFunc } from 'dayjs'

export interface BuddhistLocalizedFormatOptions {
  /** Locale codes that should default to Buddhist Era. Default: ['th'] */
  buddhistLocales?: string[]
}

export interface FormatOptions {
  /** Force-enable (true) or force-disable (false) B.E. conversion for this call. */
  be?: boolean
}

// Augment Day.js's own typings so `dayjs().format(str, { be: true })` type-checks
// anywhere this package has been imported (even just for its side effects).
declare module 'dayjs' {
  interface Dayjs {
    format(formatStr?: string, options?: FormatOptions): string
  }
}

// Fallback English formats, same defaults dayjs's own localizedFormat plugin uses.
const EN_FORMATS: Record<string, string> = {
  LTS: 'h:mm:ss A',
  LT: 'h:mm A',
  L: 'MM/DD/YYYY',
  LL: 'MMMM D, YYYY',
  LLL: 'MMMM D, YYYY h:mm A',
  LLLL: 'dddd, MMMM D, YYYY h:mm A',
}

// Longest-first so LLLL isn't accidentally matched as LL + LL, LTS before LT, etc.
const LOCALIZED_TOKEN_REGEX = /LLLL|LLL|LL|LTS|LT|L/g

/**
 * Runs `transform` over `str` while temporarily hiding the contents of
 * dayjs literal escapes (`[...]`) so we never rewrite text the user
 * deliberately quoted, e.g. format("[Year:] YYYY").
 */
export function withBracketsProtected(
  str: string,
  transform: (s: string) => string
): string {
  const literals: string[] = []
  const stashed = str.replace(/\[([^\]]*)]/g, (match) => {
    literals.push(match)
    return `\u0000${literals.length - 1}\u0000`
  })

  const transformed = transform(stashed)

  // \u0000 is an intentional, extremely unlikely-to-collide sentinel used to
  // stash bracketed literals; suppress the control-character regex warning.
  return transformed.replace(
    /\u0000(\d+)\u0000/g, // eslint-disable-line no-control-regex
    (_, i: string) => literals[Number(i)]
  )
}

export function expandLocalizedTokens(
  formatStr: string,
  localeFormats: Record<string, string>
): string {
  const formats = { ...EN_FORMATS, ...localeFormats }

  return withBracketsProtected(formatStr, (str) =>
    str.replace(LOCALIZED_TOKEN_REGEX, (token) => formats[token] || token)
  )
}

export function toBuddhistEraYear(formatStr: string, beYear: number): string {
  return withBracketsProtected(formatStr, (str) =>
    str
      .replace(/YYYY/g, String(beYear))
      .replace(/YY/g, String(beYear).slice(-2))
  )
}

const buddhistLocalizedFormat: PluginFunc<BuddhistLocalizedFormatOptions> = (
  options,
  dayjsClass,
  dayjsFactory
) => {
  const buddhistLocales = options?.buddhistLocales ?? ['th']
  const proto = dayjsClass.prototype
  const oldFormat = proto.format

  // Expose the default English format strings the same way the official
  // localizedFormat plugin does, so `formats` always has a safe fallback.
  ;(dayjsFactory as any).en.formats = EN_FORMATS

  proto.format = function (
    this: any,
    formatStr?: string,
    formatOptions?: FormatOptions
  ) {
    const str = formatStr || 'YYYY-MM-DDTHH:mm:ssZ'
    const locale = this.$locale()

    // 1. Expand LT / LTS / L / LL / LLL / LLLL into raw dayjs tokens.
    const expanded = expandLocalizedTokens(str, locale.formats || {})

    // 2. Decide whether Buddhist Era applies: explicit option wins,
    //    otherwise fall back to the active locale's default.
    const useBuddhistEra =
      typeof formatOptions?.be === 'boolean'
        ? formatOptions.be
        : buddhistLocales.includes(this.$L)

    if (!useBuddhistEra) {
      return oldFormat.call(this, expanded)
    }

    // 3. Swap YYYY/YY for the Buddhist Era year (Gregorian year + 543)
    //    before handing off to the original formatter, so the "543 offset"
    //    is baked into a literal number the tokenizer won't reinterpret.
    const beYear = this.$y + 543
    const withBEYear = toBuddhistEraYear(expanded, beYear)

    return oldFormat.call(this, withBEYear)
  }
}

export default buddhistLocalizedFormat
