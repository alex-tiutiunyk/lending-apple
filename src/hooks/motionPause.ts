import { useSyncExternalStore } from 'react'

const storageKey = 'concept-18-motion-paused'
const pausedAttribute = 'data-motion-paused'
const listeners = new Set<() => void>()
let isPaused: boolean | null = null

function readStoredPause() {
  try {
    return window.localStorage.getItem(storageKey) === 'true'
  } catch {
    return false
  }
}

function storePause(paused: boolean) {
  try {
    window.localStorage.setItem(storageKey, String(paused))
    return true
  } catch {
    return false
  }
}

export function isMotionPaused() {
  isPaused ??= readStoredPause()
  return isPaused
}

export function applyStoredMotionPause() {
  document.documentElement.toggleAttribute(pausedAttribute, isMotionPaused())
}

export function setMotionPaused(paused: boolean) {
  isPaused = paused
  storePause(paused)
  document.documentElement.toggleAttribute(pausedAttribute, paused)
  listeners.forEach((listener) => listener())
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

export function useMotionPaused() {
  return useSyncExternalStore(subscribe, isMotionPaused, () => false)
}
