import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { setMediaQuery } from '@/test/mediaQuery'
import { setMotionPaused, useMotionPaused } from './motionPause'
import { useAmbientMotion } from './useAmbientMotion'

afterEach(() => setMotionPaused(false))

describe('motion pause', () => {
  it('marks the page and remembers the choice', () => {
    setMotionPaused(true)
    expect(document.documentElement.hasAttribute('data-motion-paused')).toBe(true)
    expect(window.localStorage.getItem('concept-18-motion-paused')).toBe('true')

    setMotionPaused(false)
    expect(document.documentElement.hasAttribute('data-motion-paused')).toBe(false)
  })

  it('updates every subscriber when toggled', () => {
    const { result } = renderHook(() => useMotionPaused())
    expect(result.current).toBe(false)
    act(() => setMotionPaused(true))
    expect(result.current).toBe(true)
  })

  it('allows ambient motion only when neither paused nor reduced', () => {
    const { result } = renderHook(() => useAmbientMotion())
    expect(result.current).toBe(true)
    act(() => setMotionPaused(true))
    expect(result.current).toBe(false)
    act(() => setMotionPaused(false))
    act(() => setMediaQuery('(prefers-reduced-motion: reduce)', true))
    expect(result.current).toBe(false)
  })
})
