import { describe, expect, it } from 'vitest'
import { addPoke, comboFor, comboWindowMs, idleCounter, isResolved } from './mascotCombos'

function pokeAt(times: number[]) {
  return times.reduce(addPoke, idleCounter)
}

describe('poke combos', () => {
  it('maps 1, 2, 3 and 4 or more quick pokes to the combos', () => {
    expect(comboFor(pokeAt([0]).count)).toBe('poked')
    expect(comboFor(pokeAt([0, 200]).count)).toBe('screenshot')
    expect(comboFor(pokeAt([0, 200, 400]).count)).toBe('dizzy')
    expect(comboFor(pokeAt([0, 200, 400, 600]).count)).toBe('airplane')
    expect(comboFor(pokeAt([0, 200, 400, 600, 800, 1000]).count)).toBe('airplane')
  })

  it('starts a new series when the next poke comes too late', () => {
    expect(pokeAt([0, comboWindowMs + 1]).count).toBe(1)
    expect(pokeAt([0, comboWindowMs]).count).toBe(2)
  })

  it('resolves only after the window behind the last poke', () => {
    const counter = pokeAt([0, 300])
    expect(isResolved(counter, 300 + comboWindowMs - 1)).toBe(false)
    expect(isResolved(counter, 300 + comboWindowMs)).toBe(true)
    expect(isResolved(idleCounter, 10_000)).toBe(false)
  })
})
