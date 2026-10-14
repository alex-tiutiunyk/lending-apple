import type { ScrollFrame } from '@/hooks/frameLoop'

const blownSpeedPxPerMs = 2.6
const turnThresholdPx = 3

type ScrollReactions = {
  onTurn: () => void
  onBlown: () => void
}

/** Turns Pip around when the reader reverses direction and blows it back on fast scrolls. */
export function createScrollReaction({ onTurn, onBlown }: ScrollReactions) {
  let lastScrollY = window.scrollY
  let lastScrollAt = performance.now()
  let lastDirection = 0

  return ({ scrollY }: ScrollFrame) => {
    const now = performance.now()
    const travelled = scrollY - lastScrollY
    const speed = Math.abs(travelled) / Math.max(1, now - lastScrollAt)
    lastScrollY = scrollY
    lastScrollAt = now
    if (Math.abs(travelled) < turnThresholdPx) return

    const direction = Math.sign(travelled)
    if (lastDirection !== 0 && direction !== lastDirection) onTurn()
    lastDirection = direction
    if (speed > blownSpeedPxPerMs) onBlown()
  }
}
