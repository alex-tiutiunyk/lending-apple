import { appleMarkGridScale, appleMarkPoints } from '@/assets/svg/apple-mark-points'

export const particleShapes = [
  'spark',
  'compass',
  'gear',
  'lens',
  'sun',
  'chip',
  'lattice',
  'apple',
  'check',
] as const

export type ParticleShape = (typeof particleShapes)[number]

export function isParticleShape(name: string | undefined): name is ParticleShape {
  return particleShapes.some((shape) => shape === name)
}

type Polyline = number[]

function ring(radius: number, segments = 48, center = 0.5): Polyline {
  return Array.from({ length: segments + 1 }, (_, step) => {
    const angle = (step / segments) * Math.PI * 2
    return [center + Math.cos(angle) * radius, center + Math.sin(angle) * radius]
  }).flat()
}

function radialPolygon(radiusAt: (step: number) => number, points: number): Polyline {
  return Array.from({ length: points + 1 }, (_, step) => {
    const angle = (step / points) * Math.PI * 2 - Math.PI / 2
    const radius = radiusAt(step % points)
    return [0.5 + Math.cos(angle) * radius, 0.5 + Math.sin(angle) * radius]
  }).flat()
}

function spokes(count: number, inner: number, outer: number): Polyline[] {
  return Array.from({ length: count }, (_, step) => {
    const angle = (step / count) * Math.PI * 2
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return [0.5 + cos * inner, 0.5 + sin * inner, 0.5 + cos * outer, 0.5 + sin * outer]
  })
}

function chipPins(): Polyline[] {
  const offsets = [0.33, 0.44, 0.56, 0.67]
  return offsets.flatMap((offset) => [
    [offset, 0.26, offset, 0.12],
    [offset, 0.74, offset, 0.88],
    [0.26, offset, 0.12, offset],
    [0.74, offset, 0.88, offset],
  ])
}

function latticeLines(): Polyline[] {
  const offsets = [-0.2, -0.07, 0.07, 0.2]
  return offsets.flatMap((offset) => [
    [0.5 + offset - 0.3, 0.2, 0.5 + offset + 0.3, 0.8],
    [0.5 + offset + 0.3, 0.2, 0.5 + offset - 0.3, 0.8],
  ])
}

const shapeLines: Record<Exclude<ParticleShape, 'apple'>, Polyline[]> = {
  spark: [radialPolygon((step) => (step % 2 === 0 ? 0.48 : 0.1), 8), ring(0.06, 16)],
  compass: [ring(0.46), [0.5, 0.1, 0.6, 0.5, 0.5, 0.9, 0.4, 0.5, 0.5, 0.1]],
  gear: [radialPolygon((step) => (step % 4 < 2 ? 0.47 : 0.37), 40), ring(0.15, 24)],
  lens: [ring(0.46), ring(0.31, 36), ring(0.12, 20)],
  sun: [ring(0.2, 32), ...spokes(12, 0.29, 0.46)],
  chip: [
    [0.26, 0.26, 0.74, 0.26, 0.74, 0.74, 0.26, 0.74, 0.26, 0.26],
    [0.38, 0.38, 0.62, 0.38, 0.62, 0.62, 0.38, 0.62, 0.38, 0.38],
    ...chipPins(),
  ],
  lattice: [[0.5, 0.06, 0.94, 0.5, 0.5, 0.94, 0.06, 0.5, 0.5, 0.06], ...latticeLines()],
  check: [ring(0.46), [0.28, 0.52, 0.43, 0.67, 0.73, 0.35]],
}

function segmentLength(line: Polyline, index: number) {
  return Math.hypot(
    (line[index + 2] ?? 0) - (line[index] ?? 0),
    (line[index + 3] ?? 0) - (line[index + 1] ?? 0),
  )
}

export function sampleShape(lines: readonly Polyline[], count: number) {
  const segments = lines.flatMap((line) =>
    Array.from({ length: line.length / 2 - 1 }, (_, step) => ({
      line,
      index: step * 2,
      length: segmentLength(line, step * 2),
    })),
  )
  const total = segments.reduce((sum, { length }) => sum + length, 0)
  const spacing = total / count
  const points = new Float32Array(count * 2)
  let segmentIndex = 0
  let walked = 0

  for (let slot = 0; slot < count; slot += 1) {
    const distance = (slot + 0.5) * spacing
    while (
      segmentIndex < segments.length - 1 &&
      walked + (segments[segmentIndex]?.length ?? 0) < distance
    ) {
      walked += segments[segmentIndex]?.length ?? 0
      segmentIndex += 1
    }
    const segment = segments[segmentIndex]
    if (!segment) break
    const share = segment.length === 0 ? 0 : (distance - walked) / segment.length
    const { line, index } = segment
    const startX = line[index] ?? 0
    const startY = line[index + 1] ?? 0
    points[slot * 2] = startX + ((line[index + 2] ?? startX) - startX) * share
    points[slot * 2 + 1] = startY + ((line[index + 3] ?? startY) - startY) * share
  }
  return points
}

function applePoints(count: number) {
  const available = appleMarkPoints.length / 2
  const points = new Float32Array(count * 2)
  for (let slot = 0; slot < count; slot += 1) {
    const source = Math.floor((slot * available) / count) * 2
    points[slot * 2] = (appleMarkPoints[source] ?? 0) / appleMarkGridScale
    points[slot * 2 + 1] = (appleMarkPoints[source + 1] ?? 0) / appleMarkGridScale
  }
  return points
}

export function shapePoints(shape: ParticleShape, count: number) {
  return shape === 'apple' ? applePoints(count) : sampleShape(shapeLines[shape], count)
}
