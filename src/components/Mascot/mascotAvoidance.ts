export type Box = { left: number; top: number; right: number; bottom: number }
export type Point = { x: number; y: number }
export type LineBounds = { min: number; max: number }

const standingMarginPx = 8
const approachMarginPx = 24

function grow({ left, top, right, bottom }: Box, by: number): Box {
  return { left: left - by, top: top - by, right: right + by, bottom: bottom + by }
}

function intersects(a: Box, b: Box) {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
}

function gapToPoint(box: Box, { x, y }: Point) {
  const horizontal = Math.max(0, box.left - x, x - box.right)
  const vertical = Math.max(0, box.top - y, y - box.bottom)
  return Math.hypot(horizontal, vertical)
}

/** A viewport box as a document-space box, so it can be cached across scroll frames (plan 6 §5). */
export function toDocumentBox({ left, top, right, bottom }: Box, scrollY: number): Box {
  return { left, right, top: top + scrollY, bottom: bottom + scrollY }
}

/** Cached document-space boxes back in the viewport of the current scroll position. */
export function toViewportBoxes(boxes: readonly Box[], scrollY: number): Box[] {
  return boxes.map(({ left, top, right, bottom }) => ({
    left,
    right,
    top: top - scrollY,
    bottom: bottom - scrollY,
  }))
}

export function isInside(box: Box, point: Point, margin = standingMarginPx) {
  return gapToPoint(grow(box, margin), point) === 0
}

export function overlapsTarget(pip: Box, targets: readonly Box[]) {
  const reach = grow(pip, standingMarginPx)
  return targets.some((target) => intersects(reach, target))
}

/** Nearest left edge for Pip on its walk line where it covers no target, or null if none fits. */
export function freeSpot(pip: Box, targets: readonly Box[], { min, max }: LineBounds) {
  const width = pip.right - pip.left
  const band = grow(pip, standingMarginPx)
  const blocked = targets
    .filter((target) => target.top < band.bottom && band.top < target.bottom)
    .map(({ left, right }) => ({
      from: left - standingMarginPx - width,
      to: right + standingMarginPx,
    }))
  const isFree = (x: number) =>
    x >= min && x <= max && blocked.every(({ from, to }) => x <= from || x >= to)

  const candidates = [pip.left, min, max, ...blocked.flatMap(({ from, to }) => [from, to])]
  let best: number | null = null
  for (const candidate of candidates) {
    if (!isFree(candidate)) continue
    if (best === null || Math.abs(candidate - pip.left) < Math.abs(best - pip.left)) {
      best = candidate
    }
  }
  return best
}

/** A pointer outside Pip that is reaching for a target Pip stands on. */
export function shouldStepAside(pip: Box, pointer: Point, target: Box) {
  if (isInside(pip, pointer)) return false
  if (gapToPoint(target, pointer) > approachMarginPx) return false
  return intersects(grow(pip, approachMarginPx), target)
}
