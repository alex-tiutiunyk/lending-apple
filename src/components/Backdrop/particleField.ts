export type Particle = {
  targetX: number
  targetY: number
  scatterX: number
  scatterY: number
  depth: number
}

function seededRandom(seed: number) {
  let state = seed
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296
    return state / 4_294_967_296
  }
}

export function createParticles(flatPoints: readonly number[], gridScale: number, count: number) {
  const available = flatPoints.length / 2
  const stride = available / count
  const random = seededRandom(count)

  return Array.from({ length: Math.min(count, available) }, (_, slot): Particle => {
    const pointIndex = Math.floor(slot * stride) * 2
    return {
      targetX: (flatPoints[pointIndex] ?? 0) / gridScale,
      targetY: (flatPoints[pointIndex + 1] ?? 0) / gridScale,
      scatterX: random(),
      scatterY: random(),
      depth: 0.25 + random() * 0.75,
    }
  })
}

export function settleAmount(viewportCenter: number, targetCenter: number, viewportHeight: number) {
  const distance = Math.abs(viewportCenter - targetCenter) / (viewportHeight * 0.9)
  const closeness = Math.min(1, Math.max(0, 1 - distance))
  return closeness * closeness * (3 - 2 * closeness)
}
