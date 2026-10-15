import { describe, expect, it } from 'vitest'
import { mascotCopy } from '@/content/copy'
import { createLineBag, landingLine } from './mascotLines'

function seeded(values: number[]) {
  let index = 0
  return () => values[index++ % values.length] ?? 0
}

describe('Pip joy lines (plan 7 §1)', () => {
  it('draws every line once before any repeats, never the same twice in a row', () => {
    const lines = ['a', 'b', 'c', 'd']
    const bag = createLineBag(lines, seeded([0.1, 0.7, 0.4, 0.9, 0.2]))
    const drawn = Array.from({ length: 12 }, () => bag.next())
    for (let round = 0; round < 3; round += 1) {
      expect(new Set(drawn.slice(round * 4, round * 4 + 4)).size).toBe(4)
    }
    drawn.slice(1).forEach((line, index) => expect(line).not.toBe(drawn[index]))
  })

  it('lands with joy and the rig joke, or joy alone without a rig', () => {
    const [joy, rigLine] = landingLine(seeded([0.3]), 'parachute').split(' · ')
    expect(mascotCopy.joy).toContain(joy)
    expect(rigLine).toBe(mascotCopy.landed.parachute)
    expect(mascotCopy.joy).toContain(landingLine(seeded([0.3]), null))
  })
})
