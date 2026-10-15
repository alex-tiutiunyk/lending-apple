import { describe, expect, it } from 'vitest'
import { buildRoute } from './lensBugRoute'
import { createLensBugWalk, hurryFactor, walkPxPerSecond } from './lensBugWalk'

const route = buildRoute([
  { left: 0, top: 0, width: 100, height: 50 },
  { left: 110, top: 0, width: 100, height: 50 },
  { left: 220, top: 0, width: 100, height: 50 },
])

/** A random that never pauses early (long gaps) and never turns back. */
const steady = () => 0.99

describe('lensBugWalk (plan 5 §5)', () => {
  it('walks at 40 px/s along the route, facing the way it goes', () => {
    const walk = createLensBugWalk(steady)
    walk.setRoute(route)
    expect(walk.step(0)).toMatchObject({ x: 0, y: 0, angle: 90, box: 0, isWalking: true })
    for (let time = 100; time < 1000; time += 100) walk.step(time)
    expect(walk.step(1000)).toMatchObject({ x: walkPxPerSecond, y: 0, box: 0 })
  })

  it('returns nothing without a route and caps a long frame', () => {
    const walk = createLensBugWalk(steady)
    expect(walk.step(0)).toBeNull()
    walk.setRoute(route)
    walk.step(0)
    expect(walk.step(5000)?.x).toBeCloseTo((walkPxPerSecond * 100) / 1000)
  })

  it('pauses to look around and may turn back afterwards', () => {
    const values = [0, 0, 0.6, 0, 0, 0]
    const walk = createLensBugWalk(() => values.shift() ?? 0)
    walk.setRoute(route)
    walk.step(0)
    // First gap drew 0 → 2000 ms; at 2000 the bug stops (pause 0 → 500 ms, look 10°)
    const paused = walk.step(2000)
    expect(paused?.isWalking).toBe(false)
    expect(paused?.angle).toBe(90 + 10)
    expect(walk.step(2400)?.isWalking).toBe(false)
    // After the pause the turn-back roll (0 < 0.3) flips the direction: it backs onto the left
    // side of the first box, now heading down
    const resumed = walk.step(2600)
    expect(resumed?.isWalking).toBe(true)
    expect(resumed?.angle).toBe(180)
  })

  it('hurries at triple speed until the next box, then walks on', () => {
    const walk = createLensBugWalk(steady)
    walk.setRoute(route)
    walk.step(0)
    walk.hurry(0)
    const hurried = walk.step(100)
    expect(hurried?.x).toBeCloseTo((walkPxPerSecond * hurryFactor * 100) / 1000)
    for (let time = 200; time <= 1100; time += 100) walk.step(time)
    // 110 px travelled at 120 px/s: past the gap, on box 1, so the hurry is over
    expect(walk.step(1200)).toMatchObject({ box: 1 })
    const after = walk.step(1300)
    expect(after && after.x - 128).toBeCloseTo(walkPxPerSecond * 0.1)
  })
})
