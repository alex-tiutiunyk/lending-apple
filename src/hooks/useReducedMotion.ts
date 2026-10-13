import { useSyncExternalStore } from 'react'

const reducedMotionQuery = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void) {
  const mediaQuery = window.matchMedia(reducedMotionQuery)
  mediaQuery.addEventListener('change', onChange)
  return () => mediaQuery.removeEventListener('change', onChange)
}

function readReducedMotion() {
  return window.matchMedia(reducedMotionQuery).matches
}

export function useReducedMotion() {
  return useSyncExternalStore(subscribe, readReducedMotion, () => false)
}
