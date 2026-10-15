import { describe, expect, it } from 'vitest'
import { blendVelocity, carryPosition, isDrag, tiltFor } from './mascotCarry'
import { createFrameClock } from './mascotPlacement'

const bounds = { minX: 16, maxX: 900, minY: -700 }

describe('mascot carry (plan 5 §6)', () => {
  it('a move of 6 px is still a poke, more is a drag', () => {
    expect(isDrag({ x: 10, y: 10 }, { x: 16, y: 10 })).toBe(false)
    expect(isDrag({ x: 10, y: 10 }, { x: 10, y: 17 })).toBe(true)
    expect(isDrag({ x: 10, y: 10 }, { x: 15, y: 15 })).toBe(true)
  })

  it('keeps the grabbed spot under the pointer and inside the viewport', () => {
    const grip = { x: 20, y: 30 }
    expect(carryPosition({ x: 300, y: 400 }, grip, 700, bounds)).toEqual({ x: 280, y: -330 })
    expect(carryPosition({ x: 2, y: 5 }, grip, 700, bounds)).toEqual({ x: 16, y: -700 })
    expect(carryPosition({ x: 2000, y: 2000 }, grip, 700, bounds)).toEqual({ x: 900, y: 0 })
  })

  it('smooths the pointer velocity', () => {
    const zero = { x: 0, y: 0 }
    const once = blendVelocity(zero, { x: 0, y: 0 }, { x: 10, y: 0 }, 10)
    expect(once.x).toBeCloseTo(350)
    const twice = blendVelocity(once, { x: 10, y: 0 }, { x: 20, y: 0 }, 10)
    expect(twice.x).toBeGreaterThan(once.x)
    expect(twice.x).toBeLessThan(1000)
  })

  it('leans with the pull, at most 15 degrees', () => {
    expect(tiltFor(0)).toBe(0)
    expect(tiltFor(200)).toBe(6)
    expect(tiltFor(2000)).toBe(15)
    expect(tiltFor(-2000)).toBe(-15)
  })

  it('measures frames from the first tick and caps a long gap', () => {
    const clock = createFrameClock()
    expect(clock.elapsed(1000)).toBe(0)
    expect(clock.elapsed(1016)).toBe(16)
    expect(clock.elapsed(9000)).toBe(100)
    clock.reset()
    expect(clock.elapsed(9500)).toBe(0)
  })
})
