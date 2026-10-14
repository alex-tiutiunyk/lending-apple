export type Particle = {
  scatterX: number
  scatterY: number
  depth: number
  phase: number
  pick: number
}

export type AnchorTrack = {
  pinFrom: number
  pinTo: number
  offsetY: number
}

function seededRandom(seed: number) {
  let state = seed
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296
    return state / 4_294_967_296
  }
}

export function createParticles(count: number) {
  const random = seededRandom(count)
  return Array.from({ length: count }, (): Particle => ({
    scatterX: random(),
    scatterY: random(),
    depth: 0.25 + random() * 0.75,
    phase: random() * Math.PI * 2,
    pick: random(),
  }))
}

export function anchorDocumentY({ pinFrom, pinTo, offsetY }: AnchorTrack, scrollY: number) {
  return Math.min(pinTo, Math.max(pinFrom, scrollY)) + offsetY
}

const settlePlateau = 1.6

export function settleAmount(viewportCenter: number, targetCenter: number, viewportHeight: number) {
  const distance = Math.abs(viewportCenter - targetCenter) / (viewportHeight * 0.9)
  const closeness = Math.min(1, Math.max(0, (1 - distance) * settlePlateau))
  return closeness * closeness * (3 - 2 * closeness)
}

/**
 * At the very end of the page the last anchor counts as centred (plan 4 §7.3): the viewport
 * cannot scroll any further to meet it, so the final shape always forms fully, whatever the
 * footer's height on a given phone.
 */
export function settleAtPageEnd(
  settles: number[],
  scrollY: number,
  viewportHeight: number,
  documentHeight: number,
) {
  const last = settles.length - 1
  if (last >= 0 && scrollY >= documentHeight - viewportHeight - 1) settles[last] = 1
  return settles
}

export function blendWeights(settles: readonly number[]) {
  const sharpened = settles.map((settle) => settle ** 6)
  const total = sharpened.reduce((sum, weight) => sum + weight, 0)
  return total === 0 ? sharpened : sharpened.map((weight) => weight / total)
}

export function pickAnchor(pick: number, weights: readonly number[]) {
  let reached = 0
  for (let index = 0; index < weights.length; index += 1) {
    reached += weights[index] ?? 0
    if (pick < reached) return index
  }
  return -1
}

// Assembled shapes turn with scroll (plan 4 §5). A pinned anchor stays centered through its
// whole pin, so its angle follows the pin progress; a free anchor follows its distance from the
// viewport center. Both are 0 in the middle, positive scrolling down, negative back up.
export function turnAngle(
  { pinFrom, pinTo, offsetY }: AnchorTrack,
  scrollY: number,
  viewportHeight: number,
  maxDegrees: number,
) {
  if (maxDegrees === 0) return 0
  if (pinTo > pinFrom) {
    const share = Math.min(1, Math.max(0, (scrollY - pinFrom) / (pinTo - pinFrom)))
    return (share - 0.5) * 2 * maxDegrees
  }
  const offCenter = (scrollY + viewportHeight / 2 - offsetY) / viewportHeight
  return Math.min(1, Math.max(-1, offCenter)) * maxDegrees
}

export function rotatedX(
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  cos: number,
  sin: number,
) {
  return centerX + (x - centerX) * cos - (y - centerY) * sin
}

export function rotatedY(
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  cos: number,
  sin: number,
) {
  return centerY + (x - centerX) * sin + (y - centerY) * cos
}
