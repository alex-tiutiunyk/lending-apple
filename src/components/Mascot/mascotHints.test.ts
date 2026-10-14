import { describe, expect, it } from 'vitest'
import {
  countAct,
  findCombo,
  freshHints,
  giveHint,
  hintToGive,
  maxHintsPerSession,
  type HintState,
} from './mascotHints'

function afterActs(state: HintState, acts: number) {
  return Array.from({ length: acts }).reduce<HintState>((current) => countAct(current), state)
}

describe('mascot hints', () => {
  it('waits for the second random act', () => {
    expect(hintToGive(afterActs(freshHints, 1))).toBeNull()
    expect(hintToGive(afterActs(freshHints, 2))).toBe('screenshot')
  })

  it('gives at most one hint per four acts', () => {
    const hinted = giveHint(afterActs(freshHints, 2))
    expect(hintToGive(afterActs(hinted, 3))).toBeNull()
    expect(hintToGive(afterActs(hinted, 4))).toBe('screenshot')
  })

  it('never hints at a combo the reader found', () => {
    const found = findCombo(findCombo(afterActs(freshHints, 2), 'screenshot'), 'poked')
    expect(found.found).toEqual(['screenshot'])
    expect(hintToGive(found)).toBe('dizzy')
    const all = ['dizzy', 'airplane'].reduce<HintState>(
      (state, combo) => findCombo(state, combo as 'dizzy' | 'airplane'),
      found,
    )
    expect(hintToGive(all)).toBeNull()
  })

  it('stops after three hints per session', () => {
    let state = afterActs(freshHints, 2)
    for (let hint = 0; hint < maxHintsPerSession; hint += 1) {
      expect(hintToGive(state)).not.toBeNull()
      state = afterActs(giveHint(state), 4)
    }
    expect(hintToGive(state)).toBeNull()
  })
})
