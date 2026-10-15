// Relative imports only: vite.config.ts loads this file to build the head script
export type MotionLevel = 'full' | 'calm' | 'off'
type ContrastChoice = 'auto' | 'standard' | 'high'
export type Theme = 'dark' | 'light'

export const textScales = [100, 115, 130, 150, 175, 200] as const
type TextScale = (typeof textScales)[number]

/** From this scale up, pinned scroll stages show their final state in normal flow. */
export const staticSceneScale = 150

export type A11ySettings = {
  v: 1
  motion: MotionLevel
  contrast: ContrastChoice
  theme: Theme
  textScale: TextScale
  spacing: boolean
  font: boolean
  links: boolean
  pip: boolean
}

export const a11yStorageKey = 'concept-18-a11y'
export const legacyPauseKey = 'concept-18-motion-paused'

export const defaultSettings: A11ySettings = {
  v: 1,
  motion: 'full',
  contrast: 'auto',
  theme: 'dark',
  textScale: 100,
  spacing: false,
  font: false,
  links: false,
  pip: true,
}

const motionLevels: readonly MotionLevel[] = ['full', 'calm', 'off']
const contrastChoices: readonly ContrastChoice[] = ['auto', 'standard', 'high']
const themes: readonly Theme[] = ['dark', 'light']
const flags = ['spacing', 'font', 'links', 'pip'] as const

function pick<T>(allowed: readonly T[], value: unknown, fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

function readJson(raw: string | null): Record<string, unknown> | null {
  if (raw === null) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

/**
 * Stored settings, field by field: a broken or unknown field falls back to its default without
 * dropping the others. Without a stored object, the plan 1 pause key still maps to `calm`, and
 * so does a request for less data (plan 6 §12), until the reader picks a level of their own.
 */
export function parseSettings(
  raw: string | null,
  legacyPause: string | null = null,
  prefersReducedData = false,
): A11ySettings {
  const stored = readJson(raw)
  if (stored === null) {
    return legacyPause === 'true' || prefersReducedData
      ? { ...defaultSettings, motion: 'calm' }
      : { ...defaultSettings }
  }

  const settings: A11ySettings = {
    ...defaultSettings,
    motion: pick(motionLevels, stored.motion, defaultSettings.motion),
    contrast: pick(contrastChoices, stored.contrast, defaultSettings.contrast),
    theme: pick(themes, stored.theme, defaultSettings.theme),
    textScale: pick(textScales, stored.textScale, defaultSettings.textScale),
  }
  flags.forEach((flag) => {
    if (typeof stored[flag] === 'boolean') settings[flag] = stored[flag]
  })
  return settings
}

export type SettingsAttributes = Record<
  | 'data-motion'
  | 'data-contrast'
  | 'data-theme'
  | 'data-text-scale'
  | 'data-spacing'
  | 'data-font'
  | 'data-links'
  | 'data-pip',
  string | null
>

/** The `<html>` attributes for stored settings; `null` removes one. System preferences stay in CSS. */
export function settingsToAttributes(settings: A11ySettings): SettingsAttributes {
  return {
    'data-motion': settings.motion,
    'data-contrast': settings.contrast === 'auto' ? null : settings.contrast,
    'data-theme': settings.theme === 'dark' ? null : settings.theme,
    'data-text-scale': settings.textScale === 100 ? null : String(settings.textScale),
    'data-spacing': settings.spacing ? 'wide' : null,
    'data-font': settings.font ? 'plain' : null,
    'data-links': settings.links ? 'underline' : null,
    'data-pip': settings.pip ? null : 'off',
  }
}

export type SystemPreferences = {
  isReducedMotion: boolean
  isMoreContrast: boolean
}

/** What the page actually does once the OS settings are taken into account. */
export function effectiveSettings(settings: A11ySettings, system: SystemPreferences) {
  return {
    motion: system.isReducedMotion ? 'off' : settings.motion,
    contrast:
      settings.contrast === 'auto'
        ? system.isMoreContrast
          ? 'high'
          : 'standard'
        : settings.contrast,
  } as const
}

/**
 * Inline script for `<head>`: applies the stored settings before the first paint. Plain ES5 with
 * its own copy of the allowed values; a unit test checks it against `parseSettings`.
 */
export function settingsHeadScript() {
  const table = {
    k: a11yStorageKey,
    l: legacyPauseKey,
    m: motionLevels,
    c: contrastChoices,
    h: themes,
    t: textScales,
  }
  return `(function(){var t=${JSON.stringify(table)},r=document.documentElement,s=null,o={},p=null,d=false;try{s=localStorage.getItem(t.k);p=localStorage.getItem(t.l)}catch(e){}try{d=(navigator.connection&&navigator.connection.saveData===true)||(window.matchMedia&&window.matchMedia('(prefers-reduced-data: reduce)').matches)}catch(e){}if(s!==null){try{o=JSON.parse(s)}catch(e){}if(typeof o!=='object'||o===null)o={}}var m=s===null?(p==='true'||d?'calm':'full'):t.m.indexOf(o.motion)>=0?o.motion:'full',c=t.c.indexOf(o.contrast)>=0?o.contrast:'auto',h=t.h.indexOf(o.theme)>=0?o.theme:'dark',x=t.t.indexOf(o.textScale)>=0?o.textScale:100;function f(n,d){return typeof o[n]==='boolean'?o[n]:d}function a(n,v){if(v===null)r.removeAttribute(n);else r.setAttribute(n,v)}a('data-motion',m);a('data-contrast',c==='auto'?null:c);a('data-theme',h==='dark'?null:h);a('data-text-scale',x===100?null:String(x));a('data-spacing',f('spacing',false)?'wide':null);a('data-font',f('font',false)?'plain':null);a('data-links',f('links',false)?'underline':null);a('data-pip',f('pip',true)?null:'off');if(x!==100)r.style.setProperty('--text-scale',String(x/100))})()`
}
