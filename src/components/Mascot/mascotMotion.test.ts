import { describe, expect, it } from 'vitest'
import { stepWalker, type Walker } from './mascotMotion'

function walker(overrides: Partial<Walker>): Walker {
  return { act: 'walk', facing: 'right', x: 100, isEntering: false, hurryTo: 0, ...overrides }
}

describe('stepWalker', () => {
  it('walks forward and turns at the edge', () => {
    const pip = walker({ x: 498 })
    expect(stepWalker(pip, 4, 16, 500)).toBe('turned')
    expect(pip).toMatchObject({ x: 500, facing: 'left' })
  })

  it('moonwalks backwards without turning and stays put at the edge', () => {
    const pip = walker({ act: 'moonwalk', x: 18 })
    expect(stepWalker(pip, 4, 16, 500)).toBe('moved')
    expect(pip).toMatchObject({ x: 16, facing: 'right' })
    expect(stepWalker(pip, 4, 16, 500)).toBe('still')
    expect(pip.x).toBe(16)
  })

  it('walks in from off stage before the edges count', () => {
    const pip = walker({ x: -64, isEntering: true })
    expect(stepWalker(pip, 4, 16, 500)).toBe('entering')
    expect(pip.x).toBe(-60)
  })

  it('hurries three times as fast and arrives exactly', () => {
    const pip = walker({ act: 'hurry', x: 100, hurryTo: 110 })
    expect(stepWalker(pip, 2, 16, 500)).toBe('moved')
    expect(pip.x).toBe(106)
    expect(stepWalker(pip, 2, 16, 500)).toBe('arrived')
    expect(pip.x).toBe(110)
  })

  it('stands still during other acts', () => {
    expect(stepWalker(walker({ act: 'nap' }), 4, 16, 500)).toBe('still')
  })
})
