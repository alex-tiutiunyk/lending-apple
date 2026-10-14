// Relative import on purpose: vite.config.ts loads this file to build the head script
import { finishes, type FinishId } from '../../content/specs'

export const finishStorageKey = 'concept-18-finish'

function isFinishId(value: unknown): value is FinishId {
  return finishes.some(({ id }) => id === value)
}

/** The stored finish, or the first finish when storage is empty, broken or blocked. */
export function readStoredFinish(): FinishId {
  try {
    const stored = window.localStorage.getItem(finishStorageKey)
    return isFinishId(stored) ? stored : finishes[0].id
  } catch {
    return finishes[0].id
  }
}

export function storeFinish(id: FinishId) {
  try {
    window.localStorage.setItem(finishStorageKey, id)
    return true
  } catch {
    return false
  }
}

/**
 * Inline script for `<head>`: applies the stored finish before the first paint, so a reload
 * never flashes the default color. Written as plain ES5 with its own copy of the finish table.
 */
export function finishHeadScript() {
  const table = Object.fromEntries(
    finishes.map(({ id, hue, saturation, lightness }) => [id, [hue, saturation, lightness]]),
  )
  return `(function(){try{var t=${JSON.stringify(table)},k=localStorage.getItem(${JSON.stringify(finishStorageKey)});if(!Object.prototype.hasOwnProperty.call(t,k))return;var f=t[k],s=document.documentElement.style;s.setProperty('--accent-h',String(f[0]));s.setProperty('--accent-s',f[1]+'%');s.setProperty('--accent-l',f[2]+'%')}catch(e){}})()`
}
