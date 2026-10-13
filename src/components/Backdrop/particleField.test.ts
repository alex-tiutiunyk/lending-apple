import { describe, expect, it } from 'vitest'
import {
  anchorDocumentY,
  blendWeights,
  createParticles,
  pickAnchor,
  settleAmount,
} from './particleField'
import { particleShapes, sampleShape, shapePoints } from './particleShapes'

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
