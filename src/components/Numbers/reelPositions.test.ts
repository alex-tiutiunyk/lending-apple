import { describe, expect, it } from 'vitest'
import { reelPositions } from './reelPositions'

describe('reelPositions', () => {
  it('starts every reel at zero', () => {
    expect(reelPositions(0, [1, 8, 7])).toEqual([0, 0, 0])
  })

  it('lands on the exact digits at the end', () => {
    expect(reelPositions(1, [3, 0, 0, 0])).toEqual([3, 0, 0, 0])
    expect(reelPositions(1, [2])).toEqual([2])
  })

  it('locks reels from left to right', () => {
    const [first, , last] = reelPositions(0.75, [1, 8, 7])
    expect(first).toBe(1)
    expect(last).not.toBe(7)
  })

  it('clamps progress outside 0..1', () => {
    expect(reelPositions(1.4, [4, 8])).toEqual([4, 8])
    expect(reelPositions(-1, [4, 8])).toEqual([0, 0])
  })
})
