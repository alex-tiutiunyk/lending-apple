import { describe, expect, it } from 'vitest'
import {
  anchorDocumentY,
  blendWeights,
  createParticles,
  pickAnchor,
  rotatedX,
  rotatedY,
  settleAmount,
  settleAtPageEnd,
  turnAngle,
} from './particleField'
import { particleShapes, sampleShape, shapePoints } from './particleShapes'

describe('settleAtPageEnd (plan 4 §7.3)', () => {
  it('counts the last anchor as formed once the page cannot scroll further', () => {
    expect(settleAtPageEnd([0.2, 0.6], 4100, 900, 5000)).toEqual([0.2, 1])
    expect(settleAtPageEnd([0.2, 0.6], 4099.5, 900, 5000)).toEqual([0.2, 1])
  })

  it('leaves every settle alone before the end, and copes with no anchors', () => {
    expect(settleAtPageEnd([0.2, 0.6], 4000, 900, 5000)).toEqual([0.2, 0.6])
    expect(settleAtPageEnd([], 4100, 900, 5000)).toEqual([])
  })
})

describe('createParticles', () => {
  it('creates the requested number of particles', () => {
    expect(createParticles(120)).toHaveLength(120)
    expect(createParticles(400)).toHaveLength(400)
  })

  it('is deterministic between layouts', () => {
    expect(createParticles(120)).toEqual(createParticles(120))
  })
})

describe('sampleShape', () => {
  it('spaces points evenly along a polyline', () => {
    const points = sampleShape([[0, 0, 1, 0]], 4)
    expect(Array.from(points)).toEqual([0.125, 0, 0.375, 0, 0.625, 0, 0.875, 0])
  })

  it('keeps the spacing across a corner and between separate lines', () => {
    const points = sampleShape(
      [
        [0, 0, 0.5, 0, 0.5, 0.5],
        [0, 1, 0.5, 1],
      ],
      6,
    )
    const xs = Array.from(points.filter((_, index) => index % 2 === 0))
    const ys = Array.from(points.filter((_, index) => index % 2 === 1))
    expect(xs.map((x) => x.toFixed(3))).toEqual([
      '0.125',
      '0.375',
      '0.500',
      '0.500',
      '0.125',
      '0.375',
    ])
    expect(ys.map((y) => y.toFixed(3))).toEqual([
      '0.000',
      '0.000',
      '0.125',
      '0.375',
      '1.000',
      '1.000',
    ])
  })

  it.each(particleShapes)('returns exactly N points inside the unit square for %s', (shape) => {
    for (const count of [120, 400]) {
      const points = shapePoints(shape, count)
      expect(points).toHaveLength(count * 2)
      expect(points.every((value) => value >= 0 && value <= 1)).toBe(true)
    }
  })
})

describe('anchors', () => {
  it('holds a pinned anchor still while its section is pinned', () => {
    const track = { pinFrom: 1000, pinTo: 2000, offsetY: 300 }
    expect(anchorDocumentY(track, 500)).toBe(1300)
    expect(anchorDocumentY(track, 1500) - 1500).toBe(300)
    expect(anchorDocumentY(track, 2600)).toBe(2300)
  })

  it('is fully settled when the target is centered and zero far away', () => {
    expect(settleAmount(5000, 5000, 900)).toBe(1)
    expect(settleAmount(1000, 5000, 900)).toBe(0)
  })

  it('sharpens weights so the nearer shape dominates a crossover', () => {
    const [near, far] = blendWeights([0.9, 0.6])
    expect((near ?? 0) + (far ?? 0)).toBeCloseTo(1)
    expect(near).toBeGreaterThan(0.9)
  })

  it('splits particles between shapes in proportion to their weight', () => {
    const weights = [0.5, 0.5]
    const picks = createParticles(400).map(({ pick }) => pickAnchor(pick, weights))
    const first = picks.filter((index) => index === 0).length
    expect(first).toBeGreaterThan(150)
    expect(first).toBeLessThan(250)
    expect(pickAnchor(0.3, [0, 0])).toBe(-1)
  })
})

describe('turn', () => {
  const pinned = { pinFrom: 1000, pinTo: 2000, offsetY: 300 }
  const free = { pinFrom: 0, pinTo: 0, offsetY: 5000 }

  it('is zero for shapes that do not turn', () => {
    expect(turnAngle(pinned, 1800, 900, 0)).toBe(0)
  })

  it('follows the pin progress for a pinned anchor, zero in the middle, clamped outside', () => {
    expect(turnAngle(pinned, 1500, 900, 30)).toBe(0)
    expect(turnAngle(pinned, 2000, 900, 30)).toBe(30)
    expect(turnAngle(pinned, 1000, 900, 30)).toBe(-30)
    expect(turnAngle(pinned, 9000, 900, 30)).toBe(30)
  })

  it('follows the distance from the viewport center for a free anchor', () => {
    expect(turnAngle(free, 5000 - 450, 900, 12)).toBe(0)
    expect(turnAngle(free, 5000, 900, 12)).toBe(6)
    expect(turnAngle(free, 5000 - 900, 900, 12)).toBe(-6)
    expect(turnAngle(free, 20000, 900, 12)).toBe(12)
  })

  it('rotates a point around a center and leaves it alone at angle zero', () => {
    expect(rotatedX(10, 0, 0, 0, 1, 0)).toBe(10)
    expect(rotatedY(10, 0, 0, 0, 1, 0)).toBe(0)
    const quarter = { cos: Math.cos(Math.PI / 2), sin: Math.sin(Math.PI / 2) }
    expect(rotatedX(10, 5, 0, 5, quarter.cos, quarter.sin)).toBeCloseTo(0)
    expect(rotatedY(10, 5, 0, 5, quarter.cos, quarter.sin)).toBeCloseTo(15)
  })
})
