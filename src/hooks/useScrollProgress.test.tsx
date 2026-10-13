import { act, render } from '@testing-library/react'
import { useRef } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { installManualFrames } from '@/test/animationFrames'
import { pinnedProgress, useScrollProgress } from './useScrollProgress'

describe('pinnedProgress', () => {
  const geometry = { top: 1000, scrollLength: 2000 }

  it('is 0 before the section and 1 after it', () => {
    expect(pinnedProgress(0, geometry)).toBe(0)
    expect(pinnedProgress(5000, geometry)).toBe(1)
  })

  it('is linear while the section is pinned', () => {
    expect(pinnedProgress(1500, geometry)).toBe(0.25)
    expect(pinnedProgress(2000, geometry)).toBe(0.5)
  })

  it('snaps to 1 when fractional scrolling stops a pixel short of the end', () => {
    expect(pinnedProgress(2999.4, geometry)).toBe(1)
  })

  it('does not divide by zero for a section no taller than the viewport', () => {
    expect(pinnedProgress(999, { top: 1000, scrollLength: 0 })).toBe(0)
    expect(pinnedProgress(1000, { top: 1000, scrollLength: 0 })).toBe(1)
  })
})

describe('useScrollProgress', () => {
  let frames: ReturnType<typeof installManualFrames>

  beforeEach(() => {
    frames = installManualFrames()
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn()
        disconnect = vi.fn()
      },
    )
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.hasAttribute('data-stage') ? 800 : 2800
    })
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      return DOMRect.fromRect({ x: 0, y: 1000 - window.scrollY, width: 100, height: 2800 })
    })
  })

  it('writes progress into --p without re-rendering', () => {
    let renders = 0
    function Pinned() {
      renders += 1
      const ref = useRef<HTMLElement>(null)
      useScrollProgress(ref)
      return (
        <section ref={ref} data-testid="pinned">
          <div data-stage />
        </section>
      )
    }

    const { getByTestId } = render(<Pinned />)
    const section = getByTestId('pinned')
    const rendersAfterMount = renders

    act(() => {
      window.scrollY = 2000
      window.dispatchEvent(new Event('scroll'))
      frames.runFrame(16)
    })

    expect(section.style.getPropertyValue('--p')).toBe('0.5')
    expect(renders).toBe(rendersAfterMount)
  })
})
