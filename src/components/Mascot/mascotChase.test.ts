import { describe, expect, it } from 'vitest'
import { mascotCopy } from '@/content/copy'
import { actDurationMs, actExpression, lineFor } from './mascotActs'
import { stepWalker, type Walker } from './mascotMotion'

function walker(act: Walker['act'], facing: Walker['facing'], x = 100): Walker {
  return { act, facing, x, isEntering: false, hurryTo: 0 }
}

describe('chase (plan 4 §1)', () => {
  it('runs flat out the way Pip faces, four times the walking step', () => {
    const pip = walker('chase', 'right')
    expect(stepWalker(pip, 2, 16, 800)).toBe('moved')
    expect(pip.x).toBe(108)
    const back = walker('chase', 'left')
    stepWalker(back, 2, 16, 800)
    expect(back.x).toBe(92)
  })

  it('arrives at the edge instead of turning, so the brain can start the miss', () => {
    const pip = walker('chase', 'right', 796)
    expect(stepWalker(pip, 2, 16, 800)).toBe('arrived')
    expect(pip.x).toBe(800)
    expect(pip.facing).toBe('right')
  })

  it('has a capped duration, wide eyes and a line from the copy', () => {
    expect(actDurationMs.chase).toBeLessThanOrEqual(6000)
    expect(actExpression.chase).toBe('wide')
    expect(mascotCopy.chase).toContain(lineFor('chase', () => 0.5))
    expect(mascotCopy.missed).toContain(lineFor('missed', () => 0.5))
    expect(mascotCopy.cheer).toContain(lineFor('cheer', () => 0.5))
    expect(lineFor('glance', () => 0.5)).toBeNull()
  })
})
