import { afterEach, describe, expect, it } from 'vitest'
import {
  a11yStorageKey,
  defaultSettings,
  effectiveSettings,
  legacyPauseKey,
  parseSettings,
  settingsHeadScript,
  settingsToAttributes,
} from './a11ySettings'

const attributeNames = Object.keys(settingsToAttributes(defaultSettings))

function clearRoot() {
  const root = document.documentElement
  attributeNames.forEach((name) => root.removeAttribute(name))
  root.style.removeProperty('--text-scale')
}

function runHeadScript() {
  clearRoot()
  new Function(settingsHeadScript())()
  const root = document.documentElement
  return {
    attributes: Object.fromEntries(attributeNames.map((name) => [name, root.getAttribute(name)])),
    scale: root.style.getPropertyValue('--text-scale'),
  }
}

afterEach(() => {
  window.localStorage.clear()
  clearRoot()
})

describe('parseSettings', () => {
  it('returns the defaults when nothing is stored', () => {
    expect(parseSettings(null)).toEqual(defaultSettings)
  })

  it('maps the plan 1 pause key to calm', () => {
    expect(parseSettings(null, 'true').motion).toBe('calm')
    expect(parseSettings(null, 'false').motion).toBe('full')
  })

  it('ignores the pause key once the new object exists', () => {
    expect(parseSettings('{"motion":"full"}', 'true').motion).toBe('full')
  })

  it('falls back per field, keeping the valid ones', () => {
    const settings = parseSettings(
      JSON.stringify({
        motion: 'fast',
        contrast: 'high',
        textScale: 300,
        links: 'yes',
        pip: false,
      }),
    )
    expect(settings).toEqual({ ...defaultSettings, contrast: 'high', pip: false })
  })

  it('survives broken JSON and non-objects', () => {
    expect(parseSettings('{oops')).toEqual(defaultSettings)
    expect(parseSettings('42')).toEqual(defaultSettings)
    expect(parseSettings('null')).toEqual(defaultSettings)
  })
})

describe('settingsToAttributes', () => {
  it('writes only motion for the defaults', () => {
    expect(settingsToAttributes(defaultSettings)).toEqual({
      'data-motion': 'full',
      'data-contrast': null,
      'data-theme': null,
      'data-text-scale': null,
      'data-spacing': null,
      'data-font': null,
      'data-links': null,
      'data-pip': null,
    })
  })

  it('writes every changed setting', () => {
    expect(
      settingsToAttributes({
        v: 1,
        motion: 'off',
        contrast: 'standard',
        theme: 'light',
        textScale: 150,
        spacing: true,
        font: true,
        links: true,
        pip: false,
      }),
    ).toEqual({
      'data-motion': 'off',
      'data-contrast': 'standard',
      'data-theme': 'light',
      'data-text-scale': '150',
      'data-spacing': 'wide',
      'data-font': 'plain',
      'data-links': 'underline',
      'data-pip': 'off',
    })
  })
})

describe('effectiveSettings', () => {
  const none = { isReducedMotion: false, isMoreContrast: false }

  it('follows the stored choice without system preferences', () => {
    expect(effectiveSettings({ ...defaultSettings, motion: 'calm' }, none)).toEqual({
      motion: 'calm',
      contrast: 'standard',
    })
  })

  it('forces motion off under the system preference', () => {
    const system = { ...none, isReducedMotion: true }
    expect(effectiveSettings(defaultSettings, system).motion).toBe('off')
    expect(effectiveSettings({ ...defaultSettings, motion: 'calm' }, system).motion).toBe('off')
  })

  it('uses the system contrast only for auto', () => {
    const system = { ...none, isMoreContrast: true }
    expect(effectiveSettings(defaultSettings, system).contrast).toBe('high')
    expect(effectiveSettings({ ...defaultSettings, contrast: 'standard' }, system).contrast).toBe(
      'standard',
    )
  })
})

describe('settingsHeadScript', () => {
  const cases: [string, string | null, string | null][] = [
    ['nothing stored', null, null],
    ['the old pause key', null, 'true'],
    ['broken JSON', '{oops', null],
    ['out-of-range values', '{"textScale":120,"motion":"slow","contrast":1,"theme":"sepia"}', null],
    [
      'every setting changed',
      '{"motion":"off","contrast":"high","theme":"light","textScale":200,"spacing":true,"font":true,"links":true,"pip":false}',
      'true',
    ],
    ['a partial object', '{"textScale":130,"links":true}', null],
  ]

  it.each(cases)('matches parseSettings for %s', (_, stored, legacyPause) => {
    if (stored !== null) window.localStorage.setItem(a11yStorageKey, stored)
    if (legacyPause !== null) window.localStorage.setItem(legacyPauseKey, legacyPause)
    const settings = parseSettings(stored, legacyPause)

    const { attributes, scale } = runHeadScript()
    expect(attributes).toEqual(settingsToAttributes(settings))
    expect(scale).toBe(settings.textScale === 100 ? '' : String(settings.textScale / 100))
  })
})
