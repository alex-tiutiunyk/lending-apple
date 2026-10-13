import { act, render, screen } from '@testing-library/react'
import { useRef } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useInView } from './useInView'

type ObserverRecord = {
  callback: IntersectionObserverCallback
  disconnect: ReturnType<typeof vi.fn>
}

let observers: ObserverRecord[] = []

function reportIntersection(isIntersecting: boolean) {
  const latest = observers.at(-1)
  if (!latest) throw new Error('no observer was created')
  act(() => {
    latest.callback([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver)
  })
}

function Probe({ once }: { once: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once })
  return <div ref={ref}>{isInView ? 'visible' : 'hidden'}</div>
}

beforeEach(() => {
  observers = []
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      disconnect = vi.fn()
      observe = vi.fn()
      constructor(callback: IntersectionObserverCallback) {
        observers.push({ callback, disconnect: this.disconnect })
      }
    },
  )
})

describe('useInView', () => {
  it('reports entering and leaving the viewport', () => {
    render(<Probe once={false} />)
    reportIntersection(true)
    expect(screen.getByText('visible')).toBeDefined()
    reportIntersection(false)
    expect(screen.getByText('hidden')).toBeDefined()
  })

  it('stops observing after the first hit when once is set', () => {
    render(<Probe once />)
    reportIntersection(true)
    expect(observers.at(-1)?.disconnect).toHaveBeenCalled()
    expect(screen.getByText('visible')).toBeDefined()
  })

  it('disconnects on unmount', () => {
    const { unmount } = render(<Probe once={false} />)
    const observer = observers.at(-1)
    unmount()
    expect(observer?.disconnect).toHaveBeenCalled()
  })
})
