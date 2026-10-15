import { act, render, renderHook, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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
    const onFrame = vi.fn()
    const { result } = renderHook(() => useCountUp(187, { isRunning: false, onFrame }))
    advance(0, 500)
    expect(result.current).toBe(0)
    expect(onFrame).not.toHaveBeenCalled()
  })

  it('hands the frames to onFrame, renders nothing until the end and ends exactly at the target', () => {
    const onFrame = vi.fn()
    let renders = 0
    const { result } = renderHook(() => {
      renders += 1
      return useCountUp(187, { isRunning: true, duration: 1200, onFrame })
    })
    const rendersAfterMount = renders
    advance(1000, 1300, 1700)
    expect(result.current).toBe(0)
    expect(renders).toBe(rendersAfterMount)
    const values = onFrame.mock.calls.map(([value]) => value as number)
    expect(values.some((value) => value > 0)).toBe(true)
    values.forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(187)
    })
    advance(2300)
    expect(result.current).toBe(187)
    expect(frames.pendingCount()).toBe(0)
  })

  it('jumps straight to the target under reduced motion', () => {
    setMediaQuery('(prefers-reduced-motion: reduce)', true)
    const { result } = renderHook(() => useCountUp(3000, { isRunning: false }))
    expect(result.current).toBe(3000)
  })

  it('runs again from zero when replay changes and ends on the target (plan 5 §12)', () => {
    const onFrame = vi.fn()
    const { result, rerender } = renderHook(
      ({ replay }) => useCountUp(187, { isRunning: true, duration: 400, replay, onFrame }),
      { initialProps: { replay: 0 } },
    )
    advance(0, 500)
    expect(result.current).toBe(187)
    rerender({ replay: 1 })
    expect(result.current).toBe(0)
    onFrame.mockClear()
    advance(1000, 1200)
    expect(onFrame).toHaveBeenCalled()
    expect(result.current).toBe(0)
    advance(1500)
    expect(result.current).toBe(187)
    expect(frames.pendingCount()).toBe(0)
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
