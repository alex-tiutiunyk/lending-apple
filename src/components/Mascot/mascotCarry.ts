export type Point = { x: number; y: number }

/** Where Pip may hang: its x on the line, and `minY` (the top of the viewport) up to 0 (the line). */
export type CarryBounds = { minX: number; maxX: number; minY: number }

const dragThresholdPx = 6
const tiltMaxDeg = 15
const tiltPerPxPerS = 0.03
const velocityShare = 0.35

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

/** A pointer that moved further than the threshold is carrying Pip, not poking it (plan 5 §6). */
export function isDrag(start: Point, now: Point) {
  return Math.hypot(now.x - start.x, now.y - start.y) > dragThresholdPx
}

/**
 * Pip's translate under the pointer: the grip offset keeps the grabbed spot under
 * the finger, `restTop` is where Pip's top sits when it stands on its line.
 */
export function carryPosition(
  pointer: Point,
  grip: Point,
  restTop: number,
  { minX, maxX, minY }: CarryBounds,
): Point {
  return {
    x: clamp(pointer.x - grip.x, minX, maxX),
    y: clamp(pointer.y - grip.y - restTop, minY, 0),
  }
}

/** Pointer velocity in px/s, smoothed so one jittery frame does not throw Pip. */
export function blendVelocity(previous: Point, from: Point, to: Point, elapsedMs: number): Point {
  const seconds = Math.max(1, elapsedMs) / 1000
  return {
    x: previous.x + ((to.x - from.x) / seconds - previous.x) * velocityShare,
    y: previous.y + ((to.y - from.y) / seconds - previous.y) * velocityShare,
  }
}

/** The body leans the way it is pulled: ±15° at 500 px/s and beyond. */
export function tiltFor(velocityX: number) {
  return clamp(velocityX * tiltPerPxPerS, -tiltMaxDeg, tiltMaxDeg)
}
