import { mascotRequests } from '@/hooks/mascotRequests'
import type { Letter } from './escapeRunner'
import { createChaseRunner, type ChaseSetup } from './letterChase'

const edgePx = 16
const zoneMarginPx = 24
const pipSelector = '.mascot[data-act="walk"]:not([data-held], [data-hiding], [data-behind])'

/**
 * Pip's box while it is idle on its line and free to chase, else null. Measured directly: for
 * a one-off check outside the frame loop (a chase start).
 */
function pipRect() {
  return document.querySelector(pipSelector)?.getBoundingClientRect() ?? null
}

function translateX(element: HTMLElement) {
  const value = parseFloat(element.style.translate)
  return Number.isFinite(value) ? value : null
}

/**
 * Pip's box for the letters' tick (plan 6 §5) without a measurement per frame: the CSS
 * animations of a frame dirty the style before its callbacks run, so even a read in the read
 * phase would force a style recalc. The box is measured once (and again after `invalidate`, on
 * a layout change) and then follows Pip's own inline `translate`, which reads without styling.
 */
export function createPipTracker() {
  let element: HTMLElement | null = null
  let box: DOMRect | null = null
  let measuredX = 0
  let isLifted = false

  const measure = (pip: HTMLElement) => {
    element = pip
    box = pip.getBoundingClientRect()
    measuredX = translateX(pip) ?? 0
    isLifted = pip.hasAttribute('data-lifted')
  }

  return {
    invalidate() {
      box = null
    },
    current() {
      const pip = document.querySelector<HTMLElement>('.mascot')
      if (!pip?.matches(pipSelector)) return null
      const x = translateX(pip)
      if (pip !== element || !box || x === null || pip.hasAttribute('data-lifted') !== isLifted) {
        measure(pip)
        return box
      }
      return new DOMRect(box.x + x - measuredX, box.y, box.width, box.height)
    },
  }
}

/** Free ground for a chase: the viewport minus the avoid zones that sit on Pip's line. */
function groundBounds(letterX: number, groundY: number, width: number) {
  let min = edgePx
  let max = window.innerWidth - edgePx - width
  document.querySelectorAll('[data-pip-avoid]').forEach((zone) => {
    const rect = zone.getBoundingClientRect()
    if (rect.width === 0 || rect.top > groundY + width || rect.bottom < groundY) return
    if (rect.left > letterX) max = Math.min(max, rect.left - zoneMarginPx - width)
    if (rect.right < letterX) min = Math.max(min, rect.right + zoneMarginPx)
  })
  return { min, max }
}

/**
 * Turns a paragraph letter's trip into a chase along Pip's line (plan 4 §1), when Pip is idle,
 * listening and not too far below. The letter then runs on its chaser instead of its runner.
 * Runs once, from the planning timer, on the cached home box.
 */
export function beginChase(letter: Letter, now: number) {
  const pip = pipRect()
  if (!pip || !mascotRequests.hasListeners) return false
  const { home } = letter
  const homeTop = home.top - window.scrollY
  const groundY = pip.bottom - home.height
  if (groundY - homeTop > window.innerHeight / 2) return false
  const direction: 1 | -1 = home.left >= pip.left + pip.width / 2 ? 1 : -1
  const setup: ChaseSetup = {
    startX: home.left,
    startY: homeTop,
    groundY,
    direction,
    ...groundBounds(home.left, groundY, home.width),
  }
  if (!mascotRequests.request({ type: 'chase', letterX: home.left, direction })) return false
  letter.chaser = createChaseRunner(setup, now)
  letter.runner = null
  return true
}
