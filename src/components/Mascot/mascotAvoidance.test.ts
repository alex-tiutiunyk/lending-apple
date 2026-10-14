import { describe, expect, it } from 'vitest'
import { freeSpot, overlapsTarget, shouldStepAside, type Box } from './mascotAvoidance'

function box(left: number, top: number, width: number, height: number): Box {
  return { left, top, right: left + width, bottom: top + height }
}

const pip = box(100, 500, 48, 88)
const line = { min: 16, max: 900 }

describe('overlapsTarget', () => {
  it('sees a target under Pip or within the standing margin', () => {
    expect(overlapsTarget(pip, [box(120, 560, 80, 44)])).toBe(true)
    expect(overlapsTarget(pip, [box(152, 560, 80, 44)])).toBe(true)
  })

  it('ignores targets clear of the margin', () => {
    expect(overlapsTarget(pip, [box(170, 560, 80, 44)])).toBe(false)
    expect(overlapsTarget(pip, [box(100, 400, 80, 44)])).toBe(false)
  })
})

describe('freeSpot', () => {
  it('keeps the current spot when nothing is in the way', () => {
    expect(freeSpot(pip, [box(400, 560, 80, 44)], line)).toBe(100)
  })

  it('moves to the nearest side of a link Pip stands on', () => {
    const link = box(110, 560, 60, 44)
    const spot = freeSpot(pip, [link], line)
    expect(spot).toBe(110 - 8 - 48)
    expect(overlapsTarget({ ...pip, left: spot ?? 0, right: (spot ?? 0) + 48 }, [link])).toBe(false)
  })

  it('jumps past a row of links to the nearer free end', () => {
    const links = [box(20, 560, 100, 44), box(130, 560, 100, 44)]
    expect(freeSpot(pip, links, line)).toBe(238)
  })

  it('returns null when the whole walk line is covered', () => {
    expect(freeSpot(pip, [box(0, 560, 1000, 44)], line)).toBeNull()
  })

  it('only counts targets on the walk line', () => {
    expect(freeSpot(pip, [box(90, 200, 80, 44)], line)).toBe(100)
  })
})

describe('shouldStepAside', () => {
  const link = box(130, 560, 80, 44)

  it('steps aside for a pointer reaching a link Pip covers', () => {
    expect(shouldStepAside(pip, { x: 200, y: 580 }, link)).toBe(true)
    expect(shouldStepAside(pip, { x: 225, y: 580 }, link)).toBe(true)
  })

  it('never moves away from a pointer inside Pip', () => {
    expect(shouldStepAside(pip, { x: 140, y: 580 }, link)).toBe(false)
    expect(shouldStepAside(pip, { x: 154, y: 580 }, link)).toBe(false)
  })

  it('stays for a pointer that is only near Pip', () => {
    expect(shouldStepAside(pip, { x: 260, y: 580 }, link)).toBe(false)
    expect(shouldStepAside(pip, { x: 200, y: 580 }, box(300, 560, 80, 44))).toBe(false)
  })
})
