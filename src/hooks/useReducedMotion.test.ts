import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { setMediaQuery } from '@/test/mediaQuery'
import { useReducedMotion } from './useReducedMotion'

const query = '(prefers-reduced-motion: reduce)'

describe('useReducedMotion', () => {
  it('is false when the OS setting is off', () => {
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
  })

  it('is true when the OS setting is on', () => {
    setMediaQuery(query, true)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(true)
  })

  it('follows the setting live while the page is open', () => {
    const { result } = renderHook(() => useReducedMotion())
    act(() => setMediaQuery(query, true))
    expect(result.current).toBe(true)
    act(() => setMediaQuery(query, false))
    expect(result.current).toBe(false)
  })
})
