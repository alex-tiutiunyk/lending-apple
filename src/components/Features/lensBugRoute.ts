export type Rect = { left: number; top: number; width: number; height: number }
type Point = { x: number; y: number }
type Segment = {
  from: Point
  to: Point
  length: number
  /** A crossing of the gap between two boxes: the bug lifts and tucks its legs. */
  isHop: boolean
  /** The box whose border this is; hops belong to no box. */
  box: number
}
export type Route = { segments: Segment[]; length: number }
export type RoutePosition = Point & {
  /** Direction of travel in degrees, 0 pointing right, clockwise positive. */
  angle: number
  box: number
  isHop: boolean
}

function segment(from: Point, to: Point, box: number, isHop = false): Segment {
  return { from, to, length: Math.hypot(to.x - from.x, to.y - from.y), isHop, box }
}

/**
 * The bug's loop around a row of boxes (plan 5 §5), clockwise: along the top edges left to
 * right, hopping each gap, down the right side of the last box, back along the bottom edges
 * right to left, up the left side of the first box. Rects are relative to the layer.
 */
export function buildRoute(rects: readonly Rect[]): Route {
  const segments: Segment[] = []
  const corners = rects.map(({ left, top, width, height }) => ({
    topLeft: { x: left, y: top },
    topRight: { x: left + width, y: top },
    bottomRight: { x: left + width, y: top + height },
    bottomLeft: { x: left, y: top + height },
  }))
  corners.forEach((box, index) => {
    segments.push(segment(box.topLeft, box.topRight, index))
    const next = corners[index + 1]
    if (next) segments.push(segment(box.topRight, next.topLeft, -1, true))
  })
  const last = corners.at(-1)
  if (last) segments.push(segment(last.topRight, last.bottomRight, corners.length - 1))
  for (let index = corners.length - 1; index >= 0; index -= 1) {
    const box = corners[index]
    if (!box) continue
    segments.push(segment(box.bottomRight, box.bottomLeft, index))
    const previous = corners[index - 1]
    if (previous) segments.push(segment(box.bottomLeft, previous.bottomRight, -1, true))
  }
  const first = corners[0]
  if (first) segments.push(segment(first.bottomLeft, first.topLeft, 0))
  return { segments, length: segments.reduce((sum, { length }) => sum + length, 0) }
}

/** Where the bug is after `distance` along the loop; any distance wraps, negative ones too. */
export function positionAt(route: Route, distance: number): RoutePosition {
  if (route.length === 0) return { x: 0, y: 0, angle: 0, box: -1, isHop: false }
  const wrapped = ((distance % route.length) + route.length) % route.length
  let remaining = wrapped
  for (const current of route.segments) {
    if (remaining > current.length && current !== route.segments.at(-1)) {
      remaining -= current.length
      continue
    }
    const share = current.length === 0 ? 0 : Math.min(1, remaining / current.length)
    const dx = current.to.x - current.from.x
    const dy = current.to.y - current.from.y
    return {
      x: current.from.x + dx * share,
      y: current.from.y + dy * share,
      angle: (Math.atan2(dy, dx) * 180) / Math.PI,
      box: current.box,
      isHop: current.isHop,
    }
  }
  return { x: 0, y: 0, angle: 0, box: -1, isHop: false }
}
