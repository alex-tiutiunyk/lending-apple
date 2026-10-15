import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { finishes } from '../src/content/specs'

type Hsl = [hue: number, saturation: number, lightness: number]
type Finish = (typeof finishes)[number]

const tokens = readFileSync(join(process.cwd(), 'src/styles/_tokens.scss'), 'utf8')
const inkHue = Number(/--ink-h: (\d+)/.exec(tokens)?.[1])

/** The body of one `@mixin name { … }` in _tokens.scss (they hold flat declarations only). */
function mixinBlock(name: string) {
  const start = tokens.indexOf(`@mixin ${name} {`)
  if (start < 0) throw new Error(`mixin ${name} not found`)
  return tokens.slice(start, tokens.indexOf('\n}', start))
}

/** Later sets override earlier ones, as in CSS. */
function tokenValue(blocks: string[], name: string) {
  for (const block of [...blocks].reverse()) {
    const value = new RegExp(`--${name}: hsl\\((.*)\\);`).exec(block)?.[1]
    if (value) return value
  }
  throw new Error(`token ${name} not found`)
}

/** Resolves an hsl() body against a finish: ink hue, accent hue and min()/max() on lightness. */
function resolve(value: string, finish: Finish): Hsl {
  const parts = value
    .split('/')[0]
    ?.trim()
    .match(/^(calc\(var\([^)]*\) [+-] \d+\)|\S+) (\S+) (.+)$/)
  if (!parts) throw new Error(`cannot read hsl(${value})`)
  const [, hue = '', saturation = '', lightness = ''] = parts
  const shifted = /^calc\(var\(--accent-h\) ([+-]) (\d+)\)$/.exec(hue)
  const resolvedHue =
    hue === 'var(--ink-h)'
      ? inkHue
      : hue === 'var(--accent-h)'
        ? finish.hue
        : shifted
          ? (finish.hue + (shifted[1] === '-' ? -1 : 1) * Number(shifted[2]) + 360) % 360
          : parseFloat(hue)
  const resolvedSaturation =
    saturation === 'var(--accent-s)' ? finish.saturation : parseFloat(saturation)
  const clamp = /^(min|max)\(var\(--accent-l\), ([\d.]+)%\)$/.exec(lightness)
  const resolvedLightness = clamp
    ? Math[clamp[1] as 'min' | 'max'](finish.lightness, Number(clamp[2]))
    : lightness === 'var(--accent-l)'
      ? finish.lightness
      : parseFloat(lightness)
  return [resolvedHue, resolvedSaturation, resolvedLightness]
}

type Rgb = [red: number, green: number, blue: number]

/** sRGB channels 0–1. */
function toRgb([hue, saturation, lightness]: Hsl): Rgb {
  const s = saturation / 100
  const l = lightness / 100
  const channel = (n: number) => {
    const k = (n + hue / 30) % 12
    return l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1))
  }
  return [channel(0), channel(8), channel(4)]
}

function rgbLuminance(rgb: Rgb) {
  const [r, g, b] = rgb.map((value) =>
    value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  ) as Rgb
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function luminance(color: Hsl) {
  return rgbLuminance(toRgb(color))
}

/** The alpha of an hsl() body ("… / 88%"), 1 when it has none. */
function alphaOf(value: string) {
  const alpha = value.split('/')[1]?.trim()
  return alpha ? parseFloat(alpha) / 100 : 1
}

/** `top` at `alpha` painted over `bottom` (plain source-over in sRGB, as browsers blend). */
function over(top: Rgb, alpha: number, bottom: Rgb): Rgb {
  return top.map((channel, index) => channel * alpha + (bottom[index] ?? 0) * (1 - alpha)) as Rgb
}

function rgbRatio(a: Rgb, b: Rgb) {
  const [light, dark] = [rgbLuminance(a), rgbLuminance(b)].sort((x, y) => y - x) as [number, number]
  return (light + 0.05) / (dark + 0.05)
}

function ratio(a: Hsl, b: Hsl) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (light + 0.05) / (dark + 0.05)
}

/** sRGB (0–1) to OKLab and back, for `color-mix(in oklab, …)`. */
function toOklab(rgb: Rgb): Rgb {
  const [r, g, b] = rgb.map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  ) as Rgb
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

function fromOklab([lightness, a, b]: Rgb): Rgb {
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  return linear.map((value) => {
    const clamped = Math.min(1, Math.max(0, value))
    return clamped <= 0.0031308 ? clamped * 12.92 : 1.055 * clamped ** (1 / 2.4) - 0.055
  }) as Rgb
}

/** `color-mix(in oklab, a weight, b)` with alphas, premultiplied as the spec mixes them. */
function mixOklab(a: Rgb, alphaA: number, weight: number, b: Rgb, alphaB: number) {
  const alpha = alphaA * weight + alphaB * (1 - weight)
  const [labA, labB] = [toOklab(a), toOklab(b)]
  const lab = labA.map(
    (channel, index) =>
      (channel * alphaA * weight + (labB[index] ?? 0) * alphaB * (1 - weight)) / alpha,
  ) as Rgb
  return { rgb: fromOklab(lab), alpha }
}

const modes = [
  { name: 'dark', sets: ['root-tokens'], text: 4.5, muted: 4.5, line: 0 },
  {
    name: 'dark high',
    sets: ['root-tokens', 'high-contrast-tokens'],
    text: 7,
    muted: 7,
    line: 3,
  },
  { name: 'light', sets: ['root-tokens', 'light-tokens'], text: 4.5, muted: 6, line: 3 },
  {
    name: 'light high',
    sets: ['root-tokens', 'light-tokens', 'light-high-contrast-tokens'],
    text: 7,
    muted: 7,
    line: 3,
  },
].map((mode) => ({ ...mode, blocks: mode.sets.map(mixinBlock) }))

const cases = modes.flatMap((mode) => finishes.map((finish) => ({ ...mode, finish })))

describe('contrast', () => {
  it.each(cases)('$name, $finish.id: body, muted and accent text on the page', (mode) => {
    const color = (name: string) => resolve(tokenValue(mode.blocks, name), mode.finish)
    const background = color('color-bg')
    expect(ratio(color('color-text'), background)).toBeGreaterThanOrEqual(mode.text)
    expect(ratio(color('color-text-muted'), background)).toBeGreaterThanOrEqual(mode.muted)
    expect(ratio(color('color-accent'), background)).toBeGreaterThanOrEqual(mode.text)
    expect(ratio(color('color-on-accent'), color('color-accent'))).toBeGreaterThanOrEqual(4.5)
    if (mode.line > 0) {
      for (const line of ['color-line', 'color-line-strong']) {
        // resolve() drops alpha, so a translucent line would pass here without really reaching 3 : 1
        expect(tokenValue(mode.blocks, line)).not.toContain('/')
        expect(ratio(color(line), background)).toBeGreaterThanOrEqual(mode.line)
      }
    }
  })

  // The worm on the panel handle (plan 5 §1) is accent on the panel surface in the standard
  // sets and text in high contrast: a graphic, so 3 : 1 everywhere
  it.each(cases)('$name, $finish.id: the handle worm on the panel surface', (mode) => {
    const color = (name: string) => resolve(tokenValue(mode.blocks, name), mode.finish)
    const worm = mode.name.includes('high') ? color('color-text') : color('color-accent')
    expect(ratio(worm, color('color-bg-panel'))).toBeGreaterThanOrEqual(3)
  })

  // The site scrollbar (plan 4 §4): the thumb reads against its track at 3 : 1 in every set
  it.each(cases)('$name, $finish.id: scrollbar thumb on its track', (mode) => {
    const color = (name: string) => resolve(tokenValue(mode.blocks, name), mode.finish)
    const track = color('scrollbar-track')
    expect(ratio(color('scrollbar-thumb'), track)).toBeGreaterThanOrEqual(3)
    expect(ratio(color('scrollbar-thumb-hover'), track)).toBeGreaterThanOrEqual(3)
  })

  // The header aurora (plan 7 §6): nav text and the section label on each of the three stops
  // (88–90 % over the page), alone and under all three wave crests at once, for every finish
  it.each(cases)('$name, $finish.id: header text on the aurora bar and its crests', (mode) => {
    const raw = (name: string) => tokenValue(mode.blocks, name)
    const rgb = (name: string) => toRgb(resolve(raw(name), mode.finish))
    const page = rgb('color-bg')
    const minimum = mode.name.includes('high') ? 7 : 4.5
    for (const stop of ['bar-stop-a', 'bar-stop-b', 'bar-stop-c']) {
      const bar = over(rgb(stop), alphaOf(raw(stop)), page)
      const crested = ['bar-wave-a', 'bar-wave-b', 'bar-wave-c'].reduce(
        (under, wave) => over(rgb(wave), alphaOf(raw(wave)), under),
        bar,
      )
      for (const surface of [bar, crested]) {
        expect(rgbRatio(rgb('color-text'), surface)).toBeGreaterThanOrEqual(minimum)
        expect(rgbRatio(rgb('color-text-muted'), surface)).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  // The worm that bites the brand mark (plan 7 §4): accent in the standard sets, text in high
  // contrast, a graphic over the page (footer) and over each header bar stop, so 3 : 1
  it.each(cases)('$name, $finish.id: the mark worm on the page and the header bar', (mode) => {
    const raw = (name: string) => tokenValue(mode.blocks, name)
    const rgb = (name: string) => toRgb(resolve(raw(name), mode.finish))
    const page = rgb('color-bg')
    const worm = rgb(mode.name.includes('high') ? 'color-text' : 'color-accent')
    const surfaces = ['bar-stop-a', 'bar-stop-b', 'bar-stop-c'].map((stop) =>
      over(rgb(stop), alphaOf(raw(stop)), page),
    )
    for (const surface of [page, ...surfaces]) {
      expect(rgbRatio(worm, surface)).toBeGreaterThanOrEqual(3)
    }
  })

  // The mini Pips on the finishes render (plan 7 §5) wear their finish's swatch colour. In the
  // dark theme only Basalt may fall under 3 : 1 on the page, and it carries the text-colour
  // outline; in the light theme every Pip carries it. High contrast never loads them.
  it.each(modes.filter((mode) => !mode.name.includes('high')))(
    '$name: each mini Pip reads on the page, or carries the outline',
    (mode) => {
      const page = resolve(tokenValue(mode.blocks, 'color-bg'), finishes[0])
      const text = resolve(tokenValue(mode.blocks, 'color-text'), finishes[0])
      const outlined = (id: string) => mode.name === 'light' || id === 'basalt'
      for (const finish of finishes) {
        const shell: Hsl = [finish.hue, finish.saturation, finish.lightness]
        if (ratio(shell, page) >= 3) continue
        expect(outlined(finish.id)).toBe(true)
        expect(ratio(text, page)).toBeGreaterThanOrEqual(3)
      }
    },
  )

  // The border pulse light (plan 7 §11), mixed in OKLab, stands out from the plain border it
  // runs on and from the page. High contrast shows no pulse.
  it.each(cases.filter((mode) => !mode.name.includes('high')))(
    '$name, $finish.id: the pulse light against the page and the plain border',
    (mode) => {
      const raw = (name: string) => tokenValue(mode.blocks, name)
      const rgb = (name: string) => toRgb(resolve(raw(name), mode.finish))
      const page = rgb('color-bg')
      const line = raw('color-line-strong')
      const border = over(rgb('color-line-strong'), alphaOf(line), page)
      // Dark: line-strong 40 % into the accent, a bright light on a dim line. Light: the accent
      // 60 % into the page, a pale light on a dark line (`BorderPulse.module.scss`)
      const mix =
        mode.name === 'light'
          ? mixOklab(rgb('color-accent'), 1, 0.6, page, 1)
          : mixOklab(rgb('color-line-strong'), alphaOf(line), 0.4, rgb('color-accent'), 1)
      const light = over(mix.rgb, mix.alpha, page)
      expect(rgbRatio(light, border)).toBeGreaterThanOrEqual(1.5)
      expect(rgbRatio(light, page)).toBeGreaterThanOrEqual(mode.name === 'light' ? 2 : 3)
    },
  )
})
