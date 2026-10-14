import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { setMediaQuery } from '@/test/mediaQuery'
import { a11yStorageKey } from './a11ySettings'
import { resetA11ySettings, updateA11ySettings, useA11ySettings } from './a11yStore'
import { useAmbientMotion } from './useAmbientMotion'
import { useMotionPaused, useReducedMotion, useStaticScenes } from './useReducedMotion'

afterEach(() => resetA11ySettings())

describe('settings store', () => {
  it('marks the page and remembers the choice', () => {
    updateA11ySettings({ motion: 'calm', textScale: 150, links: true })
    const root = document.documentElement
    expect(root.getAttribute('data-motion')).toBe('calm')
    expect(root.getAttribute('data-text-scale')).toBe('150')
    expect(root.style.getPropertyValue('--text-scale')).toBe('1.5')
    expect(root.getAttribute('data-links')).toBe('underline')
    expect(JSON.parse(window.localStorage.getItem(a11yStorageKey) ?? '{}')).toMatchObject({
      motion: 'calm',
      textScale: 150,
    })
  })

  it('reset removes the stored key and every attribute but motion', () => {
    updateA11ySettings({ contrast: 'high', pip: false })
    resetA11ySettings()
    const root = document.documentElement
    expect(window.localStorage.getItem(a11yStorageKey)).toBeNull()
    expect(root.hasAttribute('data-contrast')).toBe(false)
    expect(root.hasAttribute('data-pip')).toBe(false)
    expect(root.getAttribute('data-motion')).toBe('full')
  })

  it('updates every subscriber', () => {
    const { result } = renderHook(() => useA11ySettings())
    act(() => updateA11ySettings({ font: true }))
    expect(result.current.font).toBe(true)
  })

  it('applies changes made in another tab', () => {
    const { result } = renderHook(() => useA11ySettings())
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: a11yStorageKey, newValue: '{"textScale":175}' }),
      )
    })
    expect(result.current.textScale).toBe(175)
    expect(document.documentElement.getAttribute('data-text-scale')).toBe('175')
  })
})

describe('motion hooks', () => {
  it('calm pauses ambient motion but keeps scroll motion', () => {
    const { result } = renderHook(() => ({
      paused: useMotionPaused(),
      reduced: useReducedMotion(),
      ambient: useAmbientMotion(),
    }))
    expect(result.current).toEqual({ paused: false, reduced: false, ambient: true })
    act(() => updateA11ySettings({ motion: 'calm' }))
    expect(result.current).toEqual({ paused: true, reduced: false, ambient: false })
  })

  it('off reduces motion like the system setting', () => {
    const { result } = renderHook(() => useReducedMotion())
    act(() => updateA11ySettings({ motion: 'off' }))
    expect(result.current).toBe(true)
    act(() => updateA11ySettings({ motion: 'full' }))
    act(() => setMediaQuery('(prefers-reduced-motion: reduce)', true))
    expect(result.current).toBe(true)
  })

  it('large text makes the pinned scenes static', () => {
    const { result } = renderHook(() => useStaticScenes())
    act(() => updateA11ySettings({ textScale: 130 }))
    expect(result.current).toBe(false)
    act(() => updateA11ySettings({ textScale: 150 }))
    expect(result.current).toBe(true)
  })
})
