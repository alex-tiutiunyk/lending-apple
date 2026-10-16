import { useSyncExternalStore } from 'react'
import { prefersSavedData } from './saveData'
import {
  a11yStorageKey,
  type A11ySettings,
  defaultSettings,
  legacyPauseKey,
  parseSettings,
  reducedMotionQuery,
  settingsToAttributes,
} from './a11ySettings'

// Browser chrome (address bar, scrollbars, form controls) follows the theme too
const themeColors = { dark: '#07090d', light: '#f5f6f9' } as const

const listeners = new Set<() => void>()
let current: A11ySettings | null = null
let isStorageWritable = true

function readStoredSettings() {
  try {
    const raw = window.localStorage.getItem(a11yStorageKey)
    const legacyPause = raw === null ? window.localStorage.getItem(legacyPauseKey) : null
    const settings = parseSettings(raw, legacyPause, prefersReducedData())
    if (legacyPause !== null) {
      window.localStorage.removeItem(legacyPauseKey)
      if (settings.motion !== defaultSettings.motion) {
        window.localStorage.setItem(a11yStorageKey, JSON.stringify(settings))
      }
    }
    return settings
  } catch {
    isStorageWritable = false
    return { ...defaultSettings }
  }
}

/** A first visit that asks for less data starts at `calm` (plan 6 §12), without storing it. */
function prefersReducedData() {
  return prefersSavedData() || window.matchMedia('(prefers-reduced-data: reduce)').matches
}

function storeSettings(settings: A11ySettings | null) {
  try {
    if (settings) window.localStorage.setItem(a11yStorageKey, JSON.stringify(settings))
    else window.localStorage.removeItem(a11yStorageKey)
    isStorageWritable = true
  } catch {
    isStorageWritable = false
  }
}

export function getA11ySettings() {
  current ??= readStoredSettings()
  return current
}

/** The only place that writes the settings onto `<html>`. */
export function applySettings(settings: A11ySettings) {
  const root = document.documentElement
  const isSystemReduced = window.matchMedia(reducedMotionQuery).matches
  Object.entries(settingsToAttributes(settings, isSystemReduced)).forEach(([name, value]) => {
    if (value === null) root.removeAttribute(name)
    else root.setAttribute(name, value)
  })
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', themeColors[settings.theme])
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', settings.theme)
  if (settings.textScale === 100) root.style.removeProperty('--text-scale')
  else root.style.setProperty('--text-scale', String(settings.textScale / 100))
}

function commit(settings: A11ySettings) {
  current = settings
  applySettings(settings)
  listeners.forEach((listener) => listener())
}

export function updateA11ySettings(patch: Partial<Omit<A11ySettings, 'v'>>) {
  const next = { ...getA11ySettings(), ...patch }
  storeSettings(next)
  commit(next)
}

export function resetA11ySettings() {
  storeSettings(null)
  commit({ ...defaultSettings })
}

function syncFromOtherTab(event: StorageEvent) {
  if (event.key !== a11yStorageKey && event.key !== null) return
  commit(parseSettings(event.key === null ? null : event.newValue))
}

// `data-motion` carries the OS setting too, so a change of it is written again
const reapplySettings = () => applySettings(getA11ySettings())

function subscribe(onChange: () => void) {
  if (listeners.size === 0) {
    window.addEventListener('storage', syncFromOtherTab)
    window.matchMedia(reducedMotionQuery).addEventListener('change', reapplySettings)
  }
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
    if (listeners.size === 0) {
      window.removeEventListener('storage', syncFromOtherTab)
      window.matchMedia(reducedMotionQuery).removeEventListener('change', reapplySettings)
    }
  }
}

export function useA11ySettings() {
  return useSyncExternalStore(subscribe, getA11ySettings, () => defaultSettings)
}

function readStorageWritable() {
  getA11ySettings()
  return isStorageWritable
}

/** False when the browser blocks storage: settings then last only for this page. */
export function useSettingsRemembered() {
  return useSyncExternalStore(subscribe, readStorageWritable, () => true)
}
