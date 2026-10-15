import { viewportSize, write } from '@/hooks/frameLoop'
import type { CarryBounds, Point } from './mascotCarry'

const edgeInsetPx = 16
const tiltedParts = '[data-pip-part="art"], [data-rig-art]'

/** Where a carried Pip may go: along its line with the usual inset, and up to the viewport top. */
export function pipBounds(width: number, restTop: number): CarryBounds {
  return {
    minX: edgeInsetPx,
    maxX: viewportSize().width - width - edgeInsetPx,
    minY: -restTop,
  }
}

/** Pip's x on its line, written as `translate` on the root (plan 6 rule 1: nothing inherits). */
export function placePip(element: HTMLElement, x: number) {
  write(() => {
    element.style.translate = `${x.toFixed(1)}px 0`
  })
}

/**
 * Pip's offset from its line and its lean while carried or coming down: the lean is mirrored
 * when Pip faces left and lands as `rotate` on the figure and on the rig art above it.
 */
export function writePipPosition(element: HTMLElement, { x, y }: Point, tilt: number) {
  const mirror = element.dataset.facing === 'left' ? -1 : 1
  const lean = `${(tilt * mirror).toFixed(1)}deg`
  write(() => {
    element.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`
    element.querySelectorAll<HTMLElement | SVGElement>(tiltedParts).forEach((part) => {
      part.style.rotate = lean
    })
  })
}

/** Back on the line: no offset, no lean. */
export function clearPipLean(element: HTMLElement) {
  write(() => {
    element.querySelectorAll<HTMLElement | SVGElement>(tiltedParts).forEach((part) => {
      part.style.rotate = ''
    })
  })
}

const longestFrameMs = 100

/** Milliseconds since the previous tick, capped so a hidden tab does not teleport Pip. */
export function createFrameClock() {
  let lastTime: number | null = null
  return {
    elapsed(time: number) {
      const frame = Math.min(longestFrameMs, time - (lastTime ?? time))
      lastTime = time
      return frame
    },
    reset() {
      lastTime = null
    },
  }
}
