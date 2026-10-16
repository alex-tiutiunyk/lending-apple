import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const pathSource = fileURLToPath(new URL('../src/assets/svg/apple-mark-path.ts', import.meta.url))
const pointsTarget = fileURLToPath(
  new URL('../src/assets/svg/apple-mark-points.ts', import.meta.url),
)

const pointCount = 400
const outlineShare = 0.62
const gridScale = 1000
const viewSize = 24

function seededRandom(seed) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state)
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
  }
}

function readPath(name) {
  const match = readFileSync(pathSource, 'utf8').match(new RegExp(`${name}\\s*=\\s*'([^']+)'`))
  if (!match) throw new Error(`${name} not found in ${pathSource}`)
  return match[1]
}

// A circular arc (rx = ry, no rotation; the bite of plan 9 §1) from its endpoints to its centre,
// as in the SVG arc notes (F.6.5), then sampled like a curve
function arcPoints([x0, y0], r, isLarge, isSweep, [x1, y1], steps) {
  const mx = (x0 - x1) / 2
  const my = (y0 - y1) / 2
  const radius = Math.max(r, Math.hypot(mx, my))
  const root = Math.sqrt(Math.max(0, radius ** 2 / (mx ** 2 + my ** 2) - 1))
  const sign = isLarge === isSweep ? -1 : 1
  const cx = (x0 + x1) / 2 + sign * root * my
  const cy = (y0 + y1) / 2 - sign * root * mx
  const start = Math.atan2(y0 - cy, x0 - cx)
  let sweep = Math.atan2(y1 - cy, x1 - cx) - start
  if (isSweep && sweep < 0) sweep += 2 * Math.PI
  if (!isSweep && sweep > 0) sweep -= 2 * Math.PI
  const points = []
  for (let step = 1; step <= steps; step += 1) {
    const angle = start + (sweep * step) / steps
    points.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)])
  }
  return points
}

function toPolyline(d, stepsPerCurve = 24) {
  const tokens = d.match(/[MCAZ]|-?\d*\.?\d+/g)
  const points = []
  let cursor = [0, 0]
  let index = 0
  const next = () => Number(tokens[index++])
  while (index < tokens.length) {
    const command = tokens[index++]
    if (command === 'M') {
      cursor = [next(), next()]
      points.push(cursor)
    } else if (command === 'C') {
      const [x0, y0] = cursor
      const x1 = next(),
        y1 = next(),
        x2 = next(),
        y2 = next(),
        x3 = next(),
        y3 = next()
      for (let step = 1; step <= stepsPerCurve; step += 1) {
        const t = step / stepsPerCurve
        const u = 1 - t
        points.push([
          u ** 3 * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t ** 3 * x3,
          u ** 3 * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t ** 3 * y3,
        ])
      }
      cursor = [x3, y3]
    } else if (command === 'A') {
      const r = next()
      next() // ry, the same as rx
      next() // x-axis rotation, none
      const isLarge = next() === 1
      const isSweep = next() === 1
      const end = [next(), next()]
      points.push(...arcPoints(cursor, r, isLarge, isSweep, end, stepsPerCurve))
      cursor = end
    }
  }
  return points
}

function polylineLength(points) {
  let total = 0
  for (let i = 1; i < points.length; i += 1) {
    total += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1])
  }
  return total
}

function pointAlong(points, distance) {
  let remaining = distance
  for (let i = 1; i < points.length; i += 1) {
    const [ax, ay] = points[i - 1]
    const [bx, by] = points[i]
    const segment = Math.hypot(bx - ax, by - ay)
    if (remaining <= segment) {
      const t = segment === 0 ? 0 : remaining / segment
      return [ax + (bx - ax) * t, ay + (by - ay) * t]
    }
    remaining -= segment
  }
  return points[points.length - 1]
}

function isInside([x, y], polygon) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

const random = seededRandom(1804)
const body = toPolyline(readPath('appleBodyPath'))
const leaf = toPolyline(readPath('appleLeafPath'))
const outlines = [body, leaf]
const lengths = outlines.map(polylineLength)
const totalLength = lengths.reduce((sum, length) => sum + length, 0)
const outlineCount = Math.round(pointCount * outlineShare)
const result = []

outlines.forEach((outline, outlineIndex) => {
  const share = Math.round((outlineCount * lengths[outlineIndex]) / totalLength)
  for (let i = 0; i < share; i += 1) {
    const jitter = (random() - 0.5) * 0.12
    result.push(pointAlong(outline, ((i + 0.5 + jitter) / share) * lengths[outlineIndex]))
  }
})

while (result.length < pointCount) {
  const candidate = [4 + random() * 16, 2 + random() * 19]
  if (isInside(candidate, body) || isInside(candidate, leaf)) result.push(candidate)
}

const flat = result
  .slice(0, pointCount)
  .flatMap(([x, y]) => [
    Math.round((x / viewSize) * gridScale),
    Math.round((y / viewSize) * gridScale),
  ])

const source = `export const appleMarkGridScale = ${gridScale}

export const appleMarkPoints: readonly number[] = [
${flat.join(',').replace(/((?:\d+,){24})/g, '$1\n')}
]
`

writeFileSync(pointsTarget, source.replace(/,\n/g, ',\n  ').replace('[\n', '[\n  '))
process.stdout.write(`${flat.length / 2} points, ${Buffer.byteLength(source)} bytes\n`)
