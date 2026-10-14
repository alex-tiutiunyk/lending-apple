import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetA11ySettings, updateA11ySettings } from '@/hooks/a11yStore'
import { installManualFrames } from '@/test/animationFrames'
import { DecodeText } from './DecodeText'

let frames: ReturnType<typeof installManualFrames>
let observers: IntersectionObserverCallback[] = []

function enterView() {
  const latest = observers.at(-1)
  if (!latest) throw new Error('no observer was created')
  act(() => {
    latest([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
  })
}

function advance(...times: number[]) {
  times.forEach((time) => act(() => frames.runFrame(time)))
}

const decoding = () => document.querySelector('[data-decoding]')

beforeEach(() => {
  frames = installManualFrames()
  observers = []
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      disconnect = vi.fn()
      observe = vi.fn()
      constructor(callback: IntersectionObserverCallback) {
        observers.push(callback)
      }
    },
  )
})

afterEach(() => {
  resetA11ySettings()
})

describe('DecodeText (plan 4 §2.3)', () => {
  it('decodes over its own duration once it is in view', () => {
    render(<DecodeText text="/ Design" durationMs={300} level="ambient" />)
    expect(decoding()).toBeNull()
    enterView()
    expect(decoding()).not.toBeNull()
    advance(1000, 1200)
    expect(decoding()).not.toBeNull()
    advance(1400)
    expect(decoding()).toBeNull()
  })

  it('replays for a new text through a remount', () => {
    const { rerender } = render(
      <DecodeText key="design" text="/ Design" durationMs={300} level="ambient" />,
    )
    enterView()
    advance(0, 400)
    expect(decoding()).toBeNull()
    rerender(<DecodeText key="inside" text="/ Inside" durationMs={300} level="ambient" />)
    enterView()
    expect(decoding()).not.toBeNull()
    expect(document.body.textContent).toContain('/ Inside')
  })

  it('is instant at "calm" for the ambient level, while the reveal level still decodes', () => {
    updateA11ySettings({ motion: 'calm' })
    const { unmount } = render(<DecodeText text="/ Design" level="ambient" />)
    enterView()
    expect(decoding()).toBeNull()
    unmount()
    render(<DecodeText text="Eyebrow" level="reveal" />)
    enterView()
    expect(decoding()).not.toBeNull()
  })
})
