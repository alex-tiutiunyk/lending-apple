import { useSyncExternalStore } from 'react'
import { finishes, type FinishId } from '@/content/specs'
import { readStoredFinish, storeFinish } from './finishStorage'

const listeners = new Set<() => void>()
let current: FinishId | null = null

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

function snapshot() {
  current ??= readStoredFinish()
  return current
}

export function chooseFinish(id: FinishId) {
  current = id
  storeFinish(id)
  listeners.forEach((listener) => listener())
}

/** The chosen finish; the prerendered HTML and hydration use the first one. */
export function useStoredFinish() {
  return useSyncExternalStore(subscribe, snapshot, () => finishes[0].id)
}
