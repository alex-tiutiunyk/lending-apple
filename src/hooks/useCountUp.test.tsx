import { act, render, renderHook, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { installManualFrames } from '@/test/animationFrames'
import { setMediaQuery } from '@/test/mediaQuery'
import { useCountUp } from './useCountUp'

let frames: ReturnType<typeof installManualFrames>

beforeEach(() => {
  frames = installManualFrames()
})

function advance(...times: number[]) {
  times.forEach((time) => act(() => frames.runFrame(time)))
}

describe('useCountUp', () => {
  it('stays at zero until it is started', () => {
    const { result } = renderHook(() => useCountUp(187, { isRunning: false }))
    advance(0, 500)
    expect(result.current).toBe(0)
  })

  it('ends exactly at the target', () => {
    const { result } = renderHook(() => useCountUp(187, { isRunning: true, duration: 1200 }))
    advance(1000, 1300, 1700)
    expect(result.current).toBeGreaterThan(0)
    expect(result.current).toBeLessThan(187)
    advance(2300)
    expect(result.current).toBe(187)
    expect(frames.pendingCount()).toBe(0)
  })

  it('jumps straight to the target under reduced motion', () => {
    setMediaQuery('(prefers-reduced-motion: reduce)', true)
    const { result } = renderHook(() => useCountUp(3000, { isRunning: false }))
    expect(result.current).toBe(3000)
  })

  it('rolls once under StrictMode double effects', () => {
    function Counter() {
      const value = useCountUp(48, { isRunning: true, duration: 400 })
      return <output>{Math.round(value)}</output>
    }
    render(
      <StrictMode>
        <Counter />
      </StrictMode>,
    )
    advance(100, 200, 300, 600)
    expect(screen.getByText('48')).toBeDefined()
    expect(frames.pendingCount()).toBe(0)
  })
})
