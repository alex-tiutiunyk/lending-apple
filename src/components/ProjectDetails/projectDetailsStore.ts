import { useSyncExternalStore } from 'react'

/**
 * Between the triggers (the edge tab, the footer link) and the lazy dialog (plan 10 §3):
 * `isWanted` mounts the dialog chunk, a new `openCount` opens it, `trigger` gets focus back.
 */
type DetailsRequest = {
  isWanted: boolean
  openCount: number
  trigger: HTMLElement | null
}

let current: DetailsRequest = { isWanted: false, openCount: 0, trigger: null }
const listeners = new Set<() => void>()

function update(next: Partial<DetailsRequest>) {
  current = { ...current, ...next }
  for (const listener of listeners) listener()
}

/** Hover, focus or a press on a trigger: fetch the dialog chunk, so a click opens it ready. */
export function primeProjectDetails() {
  if (!current.isWanted) update({ isWanted: true })
}

export function openProjectDetails(trigger: HTMLElement) {
  update({ isWanted: true, openCount: current.openCount + 1, trigger })
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const serverRequest: DetailsRequest = { isWanted: false, openCount: 0, trigger: null }

export function useProjectDetailsRequest() {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => serverRequest,
  )
}
