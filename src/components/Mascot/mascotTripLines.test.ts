import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mascotCopy } from '@/content/copy'
import { actDurationMs } from './mascotActs'
import { scheduleTripJoy } from './mascotTripLines'

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

const swapAt = actDurationMs.trip * 0.45

describe('trip lines (plan 7 §1)', () => {
  it('swaps the falling line for a joy line at 45 % and gives it to the live region', () => {
    const state = { act: 'trip', line: mascotCopy.falling[0] ?? null, pokeReply: '' }
    const commit = vi.fn()
    scheduleTripJoy(state, () => 0, commit)
    vi.advanceTimersByTime(swapAt - 1)
    expect(commit).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(commit).toHaveBeenCalledTimes(1)
    expect(mascotCopy.joy).toContain(state.line)
    expect(state.pokeReply).toBe(state.line)
  })

  it('does nothing once another act has replaced the trip', () => {
    const state = { act: 'trip', line: null, pokeReply: '' }
    const commit = vi.fn()
    scheduleTripJoy(state, () => 0, commit)
    state.act = 'walk'
    vi.advanceTimersByTime(swapAt)
    expect(commit).not.toHaveBeenCalled()
    expect(state.pokeReply).toBe('')
  })

  it('the cancel stops the swap', () => {
    const state = { act: 'trip', line: null, pokeReply: '' }
    const commit = vi.fn()
    scheduleTripJoy(state, () => 0, commit)()
    vi.advanceTimersByTime(swapAt)
    expect(commit).not.toHaveBeenCalled()
  })
})
