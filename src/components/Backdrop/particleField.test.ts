import { describe, expect, it } from 'vitest'
import { createParticles, settleAmount } from './particleField'

describe('createParticles', () => {
  const points = Array.from({ length: 800 }, (_, index) => index % 1000)

  it('samples the requested number of silhouette points', () => {
    expect(createParticles(points, 1000, 120)).toHaveLength(120)
    expect(createParticles(points, 1000, 400)).toHaveLength(400)
  })

  it('never asks for more points than the silhouette has', () => {
    expect(createParticles(points, 1000, 900)).toHaveLength(400)
  })

  it('is deterministic between layouts', () => {
    expect(createParticles(points, 1000, 120)).toEqual(createParticles(points, 1000, 120))
  })
})

describe('settleAmount', () => {
  it('is fully settled when the target is centred and zero far away', () => {
    expect(settleAmount(5000, 5000, 900)).toBe(1)
    expect(settleAmount(1000, 5000, 900)).toBe(0)
  })
})
