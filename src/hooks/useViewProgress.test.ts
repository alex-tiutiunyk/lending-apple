import { describe, expect, it } from 'vitest'
import { crossingProgress } from './useViewProgress'

describe('crossingProgress', () => {
  it('runs from 90 % to 40 % of the viewport height', () => {
    expect(crossingProgress(1000, 1000)).toBe(0)
    expect(crossingProgress(900, 1000)).toBe(0)
    expect(crossingProgress(650, 1000)).toBeCloseTo(0.5)
    expect(crossingProgress(400, 1000)).toBe(1)
    expect(crossingProgress(-200, 1000)).toBe(1)
  })
})
