import { describe, expect, it } from 'vitest'
import { createChaseRunner, homeMs, jumpMs } from './letterChase'

const setup = { startX: 300, startY: 200, groundY: 700, direction: 1 as const, min: 16, max: 900 }
const farAway = -10_000

/** Steps the runner in 10 ms frames with Pip far away until `until` ms. */
function run(
  runner: ReturnType<typeof createChaseRunner>,
  from: number,
  until: number,
  pip = farAway,
) {
  let frame = runner.step(from, pip)
  for (let now = from + 10; now <= until; now += 10) frame = runner.step(now, pip)
  return frame
}

describe('createChaseRunner', () => {
  it('jumps down to the ground, runs away and jumps home when the run is over', () => {
    const runner = createChaseRunner(setup, 0)
    const landed = run(runner, 0, jumpMs)
    expect(landed.phase).toBe('run')
    expect(landed.y).toBe(setup.groundY)
    const running = run(runner, jumpMs + 16, jumpMs + 1000)
    expect(running.x).toBeGreaterThan(setup.startX + 100)
    const home = run(runner, jumpMs + 1010, jumpMs + 3200 + homeMs + 40)
    expect(home.phase).toBe('done')
    expect(home.x).toBe(setup.startX)
    expect(home.y).toBe(setup.startY)
  })

  it('dodges twice when Pip gets close: a stop, then the opposite direction', () => {
    const runner = createChaseRunner(setup, 0)
    run(runner, 0, jumpMs)
    const close = runner.step(jumpMs + 16, 340)
    expect(close.phase).toBe('dodge')
    const turned = run(runner, jumpMs + 30, jumpMs + 200, 340)
    expect(turned.direction).toBe(-1)
    const later = run(runner, jumpMs + 210, jumpMs + 600)
    expect(later.x).toBeLessThan(close.x)
  })

  it('reports the turn once so Pip can be told', () => {
    const runner = createChaseRunner(setup, 0)
    run(runner, 0, jumpMs)
    runner.step(jumpMs + 16, 340)
    const frames: boolean[] = []
    for (let now = jumpMs + 30; now <= jumpMs + 400; now += 10) {
      frames.push(runner.step(now, 340).turned)
    }
    expect(frames.filter(Boolean)).toHaveLength(1)
  })

  it('goes home early when asked', () => {
    const runner = createChaseRunner(setup, 0)
    run(runner, 0, jumpMs + 300)
    runner.end(jumpMs + 300)
    expect(runner.step(jumpMs + 316, farAway).phase).toBe('home')
    expect(run(runner, jumpMs + 330, jumpMs + 300 + homeMs + 40).phase).toBe('done')
  })
})
