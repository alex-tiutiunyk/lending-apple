import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DescentFrame } from './mascotDescent'
import { createDragController, type DragDeps } from './mascotDragController'

let tick: ((time: number) => void) | null = null

vi.mock('@/hooks/frameLoop', () => ({
  subscribeTick: (onTick: (time: number) => void) => {
    tick = onTick
    return () => {
      if (tick === onTick) tick = null
    }
  },
}))
vi.mock('./mascotPlacement', () => ({
  clearPipLean: () => undefined,
  createFrameClock: () => ({ reset: () => undefined, elapsed: () => 16 }),
  pipBounds: () => ({ minX: 0, maxX: 800, minY: -600, maxY: 0 }),
  writePipPosition: () => undefined,
}))

afterEach(() => {
  tick = null
})

const frame = (phase: DescentFrame['phase'], isDone = false): DescentFrame => ({
  x: 100,
  y: isDone ? 0 : -50,
  tilt: 0,
  phase,
  isDone,
})

/** Drags Pip, releases it and plays the given descent frames; returns the acts started. */
async function dropThrough(frames: DescentFrame[]) {
  const startAct = vi.fn<DragDeps['startAct']>()
  const queue = [...frames]
  const rigs = {
    createRigBag: () => ({ next: () => 'umbrella' }),
    createDescent: () => ({ step: () => queue.shift() ?? frame('landed', true) }),
  }
  const element = document.createElement('div')
  const controller = createDragController(element, document.createElement('button'), {
    random: () => 0,
    startAct,
    hold: () => undefined,
    placeAt: () => undefined,
    onRig: () => undefined,
    loadRigs: () => Promise.resolve(rigs as never),
  })
  controller.grab(1, { x: 0, y: 0 })
  controller.move(1, { x: 0, y: -80 })
  controller.drop(1)
  await vi.waitFor(() => expect(controller.isFalling()).toBe(true))
  while (tick) tick(0)
  return startAct.mock.calls.map(([act]) => act)
}

describe('drag controller: joy on the way down (plan 7 §1)', () => {
  it('starts `fall` once, on the first frame past `open`, and lands with `land`', async () => {
    const acts = await dropThrough([
      frame('open'),
      frame('open'),
      frame('fall'),
      frame('flip'),
      frame('pop'),
      frame('landed', true),
    ])
    expect(acts).toEqual(['carried', 'fall', 'land'])
  })

  it('an umbrella released low goes `open → flip` and still gets the falling line', async () => {
    const acts = await dropThrough([frame('open'), frame('flip'), frame('landed', true)])
    expect(acts).toEqual(['carried', 'fall', 'land'])
  })

  it('a drop straight to `landed` shows no falling line', async () => {
    const acts = await dropThrough([frame('open'), frame('landed', true)])
    expect(acts).toEqual(['carried', 'land'])
  })
})
