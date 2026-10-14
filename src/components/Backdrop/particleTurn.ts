import type { ScrollFrame } from '@/hooks/frameLoop'
import type { ShapeAnchor } from './particleAnchors'
import { turnAngle } from './particleField'

const degreesToRadians = Math.PI / 180

/**
 * Smoothed turn angle per anchor (plan 4 §5): each frame the angle eases toward its scroll
 * target, so a wheel step does not jerk the shape. `remaining` is how far the slowest shape
 * still has to turn, in px at its rim, so the canvas keeps ticking until the turn has settled.
 */
export function createTurnTracker() {
  let angles = new Float32Array(0)
  const tracker = {
    cosines: new Float32Array(0),
    sines: new Float32Array(0),
    remaining: 0,

    update(anchors: readonly ShapeAnchor[], frame: ScrollFrame, easing: number) {
      if (angles.length !== anchors.length) {
        angles = new Float32Array(anchors.length)
        tracker.cosines = new Float32Array(anchors.length).fill(1)
        tracker.sines = new Float32Array(anchors.length)
      }
      let remaining = 0
      anchors.forEach((anchor, index) => {
        const target = turnAngle(anchor, frame.scrollY, frame.viewportHeight, anchor.turnMax)
        const current = angles[index] ?? 0
        const next = current + (target - current) * easing
        angles[index] = next
        tracker.cosines[index] = Math.cos(next * degreesToRadians)
        tracker.sines[index] = Math.sin(next * degreesToRadians)
        remaining = Math.max(remaining, Math.abs(target - next) * degreesToRadians * anchor.size)
      })
      tracker.remaining = remaining
    },
  }
  return tracker
}
