import { describe, expect, it } from 'vitest'
import { createDescent, createRigBag, rigs, type DescentFrame, type Rig } from './mascotDescent'

function seeded(values: number[]) {
  let index = 0
  return () => {
    const value = values[index % values.length] ?? 0
    index += 1
    return value
  }
}

const bounds = { minX: 16, maxX: 900 }

/** Runs a descent at 60 fps until it lands, keeping every frame; fails if it never does. */
function fallOn(rig: Rig, y = -400, vx = 0, random = seeded([0.5])) {
  const descent = createDescent({ rig, x: 300, y, vx, ...bounds }, random)
  const frames: DescentFrame[] = []
  for (let frame = 0; frame < 60 * 20; frame += 1) {
    const next = descent.step(1000 / 60)
    frames.push(next)
    if (next.isDone) return frames
  }
  throw new Error(`${rig} never landed`)
}

describe('mascot descent (plan 5 §6)', () => {
  it.each(rigs)('%s reaches the line and stays inside the bounds', (rig) => {
    const frames = fallOn(rig, -400, 800)
    const last = frames.at(-1)
    expect(last?.y).toBe(0)
    expect(last?.phase).toBe('landed')
    expect(frames.length).toBeGreaterThan(30)
    for (const frame of frames) {
      expect(frame.x).toBeGreaterThanOrEqual(bounds.minX)
      expect(frame.x).toBeLessThanOrEqual(bounds.maxX)
      expect(frame.y).toBeLessThanOrEqual(0)
    }
  })

  it('a flick carries into the fall, then dies away', () => {
    const still = fallOn('propeller', -200, 0)
    const thrown = fallOn('propeller', -200, 600)
    const stillEnd = still.at(-1)?.x ?? 0
    const thrownEnd = thrown.at(-1)?.x ?? 0
    expect(thrownEnd).toBeGreaterThan(stillEnd + 50)
    // Most of the throw happens in the first half second
    const early = thrown[30]?.x ?? 0
    expect(early - 300).toBeGreaterThan((thrownEnd - 300) * 0.6)
  })

  it('the balloons lift Pip first, and one pops on the way down', () => {
    const frames = fallOn('balloons')
    expect(frames[10]?.y).toBeLessThan(-400)
    expect(frames.some((frame) => frame.phase === 'pop')).toBe(true)
    expect(frames.find((frame) => frame.phase === 'pop')?.y).toBeGreaterThan(-400)
  })

  it('the umbrella turns inside out over the last 120 px and drops faster', () => {
    const frames = fallOn('umbrella')
    const flip = frames.findIndex((frame) => frame.phase === 'flip')
    expect(flip).toBeGreaterThan(0)
    expect(frames[flip - 2]?.y).toBeLessThanOrEqual(-120)
    const before = (frames[flip - 1]?.y ?? 0) - (frames[flip - 2]?.y ?? 0)
    const after = (frames[flip + 2]?.y ?? 0) - (frames[flip + 1]?.y ?? 0)
    expect(after).toBeGreaterThan(before * 2)
  })

  it('opens first, then falls', () => {
    const descent = createDescent(
      { rig: 'parachute', x: 100, y: -300, vx: 0, ...bounds },
      () => 0.5,
    )
    expect(descent.step(16).phase).toBe('open')
    expect(descent.step(100).phase).toBe('open')
    expect(descent.step(100).phase).toBe('open')
    expect(descent.step(100).phase).toBe('fall')
  })

  it('lands at once when released on the line', () => {
    const descent = createDescent({ rig: 'leaf', x: 100, y: 0, vx: 0, ...bounds }, () => 0.5)
    expect(descent.step(16)).toMatchObject({ y: 0, isDone: true, phase: 'landed' })
  })

  it('the leaf tumbles once', () => {
    const tilts = fallOn('leaf', -700).map((frame) => frame.tilt)
    expect(Math.max(...tilts)).toBeGreaterThan(330)
  })

  it('caps a long frame so a hidden tab does not teleport Pip', () => {
    const descent = createDescent({ rig: 'bubble', x: 100, y: -300, vx: 0, ...bounds }, () => 0.5)
    expect(descent.step(5000).y).toBeGreaterThanOrEqual(-300 + 120 * 0.1 - 1)
    expect(descent.step(5000).isDone).toBe(false)
  })
})

describe('rig bag', () => {
  it('plays all seven before any repeats, for any dice', () => {
    for (const dice of [seeded([0]), seeded([0.999]), seeded([0.3, 0.7, 0.1, 0.9])]) {
      const bag = createRigBag(dice)
      const first = Array.from({ length: 7 }, () => bag.next())
      const second = Array.from({ length: 7 }, () => bag.next())
      expect([...first].sort()).toEqual([...rigs].sort())
      expect([...second].sort()).toEqual([...rigs].sort())
    }
  })

  it('shuffles: different dice give a different first rig', () => {
    expect(createRigBag(seeded([0.1])).next()).toBe('parachute')
    expect(createRigBag(seeded([0.9])).next()).toBe('bubble')
  })
})
