import { describe, expect, it } from 'vitest'
import { createLetterRunner, planRun } from './letterRun'

const room = { left: 200, right: 200, up: 200, down: 200 }

describe('planRun', () => {
  it('keeps the trip inside the room', () => {
    const plan = planRun(() => 0.999, { left: 10, right: 20, up: 5, down: 8 })
    expect(plan.dx).toBeLessThanOrEqual(20)
    expect(plan.dx).toBeGreaterThanOrEqual(-10)
    expect(plan.dy).toBeLessThanOrEqual(8)
    expect(plan.dy).toBeGreaterThanOrEqual(-5)
  })

  it('runs between 40 and 160 px for 0.7 to 1.1 s', () => {
    const short = planRun(() => 0, room)
    const long = planRun(() => 0.999, room)
    expect(Math.hypot(short.dx, short.dy)).toBeCloseTo(40)
    expect(Math.hypot(long.dx, long.dy)).toBeCloseTo(160, 0)
    expect(short.runMs).toBe(700)
    expect(long.runMs).toBeLessThan(1100)
  })
})

describe('createLetterRunner', () => {
  const plan = { dx: 100, dy: -50, runMs: 800 }

  it('lifts, runs out, looks, comes back, settles and ends in place', () => {
    const runner = createLetterRunner(plan, 1000)
    expect(runner.step(1000).phase).toBe('lift')
    expect(runner.step(1200 + 400).phase).toBe('run')
    const away = runner.step(1200 + 800)
    expect(away.phase).toBe('look')
    expect(away.x).toBe(100)
    expect(runner.step(1200 + 800 + 400 + 400).phase).toBe('back')
    expect(runner.step(1200 + 800 + 400 + 800 + 100).phase).toBe('settle')
    const end = runner.step(1200 + 800 + 400 + 800 + 250)
    expect(end.phase).toBe('done')
    expect(end.x).toBe(0)
    expect(end.y).toBe(0)
  })

  it('hurries home from wherever it is without a jump', () => {
    const runner = createLetterRunner(plan, 0)
    const midway = runner.step(600)
    expect(midway.phase).toBe('run')
    runner.hurryHome(600)
    const first = runner.step(601)
    expect(first.phase).toBe('back')
    expect(Math.abs(first.x - midway.x)).toBeLessThan(2)
    expect(runner.step(601 + 800 + 250).phase).toBe('done')
  })
})
