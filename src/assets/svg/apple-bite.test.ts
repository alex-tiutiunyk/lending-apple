import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { chomps, leftChomps } from './apple-bite-chomps'
import { appleBodyPath, appleLeafPath, appleWholeBodyPath } from './apple-mark-path'
import { appleMarkGridScale, appleMarkPoints } from './apple-mark-points'

const restBite = chomps.at(-1) ?? { cx: 0, cy: 0, r: 0 }

const numbers = (path: string) => (path.match(/-?\d*\.?\d+/g) ?? []).map(Number)

/** The right-hand curve of the whole body, from (18.9, 14.4) up to (17.5, 7.1). */
function rightCurve(t: number) {
  const u = 1 - t
  const at = (a: number, b: number, c: number, d: number) =>
    u ** 3 * a + 3 * u * u * t * b + 3 * u * t * t * c + t ** 3 * d
  return [at(18.9, 19.8, 19.4, 17.5), at(14.4, 11.6, 8.6, 7.1)] as [number, number]
}

const distanceToCurve = ([x, y]: [number, number]) => {
  let best = Infinity
  for (let step = 0; step <= 2000; step += 1) {
    const [cx, cy] = rightCurve(step / 2000)
    best = Math.min(best, Math.hypot(cx - x, cy - y))
  }
  return best
}

describe('the worm bite (plan 8 §7, plan 9 §2)', () => {
  it('five chomps, each inside the last one, so the bite ends clean and round', () => {
    expect(chomps).toHaveLength(5)
    expect(restBite).toEqual({ cx: 21.6, cy: 10.4, r: 4.2 })
    for (const table of [chomps, leftChomps]) {
      const last = table.at(-1) ?? restBite
      for (const { cx, cy, r } of table) {
        expect(Math.hypot(cx - last.cx, cy - last.cy) + r).toBeLessThanOrEqual(last.r + 1e-9)
      }
    }
  })

  it('the hover bites the left side', () => {
    for (const { cx } of leftChomps) expect(cx).toBeLessThan(12)
  })
})

describe('the mark bitten at rest (plan 9 §1)', () => {
  it('the whole body is symmetric about x = 12', () => {
    const values = numbers(appleWholeBodyPath)
    const xs = values.filter((_, index) => index % 2 === 0)
    const ys = values.filter((_, index) => index % 2 === 1)
    for (const [index, x] of xs.entries()) {
      const partner = xs.findIndex(
        (other, j) => Math.abs(other - (24 - x)) < 1e-9 && ys[j] === ys[index],
      )
      expect(partner, `no mirror for (${x}, ${ys[index]})`).toBeGreaterThanOrEqual(0)
    }
  })

  it('one arc, the rest bite circle, between two points on it and on the whole curve', () => {
    const arcs = appleBodyPath.match(/A[^A-Z]+/g) ?? []
    expect(arcs).toHaveLength(1)
    const [rx, ry, , isLarge, isSweep, endX, endY] = numbers(arcs[0] ?? '')
    expect([rx, ry, isLarge, isSweep]).toEqual([restBite.r, restBite.r, 0, 1])
    // The arc starts where the curve before it ends
    const beforeArc = numbers(appleBodyPath.split('A')[0] ?? '').slice(-2) as [number, number]
    for (const point of [beforeArc, [endX ?? 0, endY ?? 0] as [number, number]]) {
      const [x, y] = point
      expect(Math.abs(Math.hypot(x - restBite.cx, y - restBite.cy) - restBite.r)).toBeLessThan(0.02)
      expect(distanceToCurve(point)).toBeLessThan(0.02)
    }
  })

  it('the rest of the body is the whole one', () => {
    const [head] = appleWholeBodyPath.split(' C19.8')
    expect(appleBodyPath.startsWith(`${head} C`)).toBe(true)
    expect(appleBodyPath.endsWith(' C16 5.9 13.6 6 12 7.2 Z')).toBe(true)
  })

  it('the favicon carries the same body and leaf', () => {
    const favicon = readFileSync(join(process.cwd(), 'public/favicon.svg'), 'utf8')
    expect(favicon).toContain(`${appleBodyPath} ${appleLeafPath}`)
  })

  it('the particle targets keep 400 points and none inside the bite', () => {
    expect(appleMarkPoints).toHaveLength(800)
    for (let index = 0; index < appleMarkPoints.length; index += 2) {
      const x = ((appleMarkPoints[index] ?? 0) / appleMarkGridScale) * 24
      const y = ((appleMarkPoints[index + 1] ?? 0) / appleMarkGridScale) * 24
      expect(Math.hypot(x - restBite.cx, y - restBite.cy)).toBeGreaterThan(restBite.r - 0.1)
    }
  })
})
