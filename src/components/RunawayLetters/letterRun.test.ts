import { describe, expect, it } from 'vitest'
import { createLetterRunner, headingRun, hitRun, planRun } from './letterRun'

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

  it('keeps heading letters near their title: 20 to 80 px, 0.35 to 0.8 s each way', () => {
    const short = planRun(() => 0, room, headingRun)
    const long = planRun(() => 0.999, room, headingRun)
    expect(Math.hypot(short.dx, short.dy)).toBeCloseTo(20)
    expect(Math.hypot(long.dx, long.dy)).toBeCloseTo(80, 0)
    expect(short.runMs).toBe(350)
    expect(long.runMs).toBeLessThan(800)
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

describe('hitRun (plan 7 §2)', () => {
  it('jumps 24–40 px with a full turn before it runs', () => {
    const room = { left: 500, right: 500, up: 500, down: 500 }
    const plan = planRun(() => 0.5, room, hitRun)
    expect(plan.lift?.px).toBe(32)
    const runner = createLetterRunner(plan, 0)
    const top = runner.step(320)
    expect(top.phase).toBe('run')
    const lifting = createLetterRunner(plan, 0).step(160)
    expect(lifting.y).toBeLessThan(-20)
    expect(lifting.tilt).toBeGreaterThan(200)
  })

  it('stays inside the room above the letter', () => {
    const plan = planRun(() => 0.5, { left: 500, right: 500, up: 10, down: 500 }, hitRun)
    expect(plan.lift?.px).toBe(10)
  })
})
