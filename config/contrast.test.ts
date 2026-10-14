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
    .match(/^(\S+) (\S+) (.+)$/)
  if (!parts) throw new Error(`cannot read hsl(${value})`)
  const [, hue = '', saturation = '', lightness = ''] = parts
  const resolvedHue =
    hue === 'var(--ink-h)' ? inkHue : hue === 'var(--accent-h)' ? finish.hue : parseFloat(hue)
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

function luminance([hue, saturation, lightness]: Hsl) {
  const s = saturation / 100
  const l = lightness / 100
  const channel = (n: number) => {
    const k = (n + hue / 30) % 12
    const value = l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(0) + 0.7152 * channel(8) + 0.0722 * channel(4)
}

function ratio(a: Hsl, b: Hsl) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (light + 0.05) / (dark + 0.05)
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

  // The site scrollbar (plan 4 §4): the thumb reads against its track at 3 : 1 in every set
  it.each(cases)('$name, $finish.id: scrollbar thumb on its track', (mode) => {
    const color = (name: string) => resolve(tokenValue(mode.blocks, name), mode.finish)
    const track = color('scrollbar-track')
    expect(ratio(color('scrollbar-thumb'), track)).toBeGreaterThanOrEqual(3)
    expect(ratio(color('scrollbar-thumb-hover'), track)).toBeGreaterThanOrEqual(3)
  })
})
