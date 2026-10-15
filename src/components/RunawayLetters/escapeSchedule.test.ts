import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEscapeSchedule } from './escapeSchedule'

vi.mock('@/hooks/frameLoop', () => ({ readInNextFrame: (run: () => void) => run() }))

let onIntersect: (entries: { isIntersecting: boolean }[]) => void = () => undefined

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: typeof onIntersect) {
        onIntersect = callback
      }
      observe() {}
      disconnect() {}
    },
  )
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const runs = () => ({
  paragraph: vi.fn(() => true),
  headings: vi.fn(() => null),
  footer: vi.fn(() => true),
})

describe('escape schedule (plan 7 §2, §7)', () => {
  it('a footer end reschedules only the footer clock, 5–8 s later', () => {
    const run = runs()
    const schedule = createEscapeSchedule(run, document.createElement('footer'), () => 0)
    onIntersect([{ isIntersecting: true }])
    vi.advanceTimersByTime(1500)
    expect(run.footer).toHaveBeenCalledTimes(1)
    schedule.footerEnded()
    vi.advanceTimersByTime(4999)
    expect(run.footer).toHaveBeenCalledTimes(1)
    expect(run.paragraph).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1)
    expect(run.footer).toHaveBeenCalledTimes(2)
    schedule.stop()
  })

  it('the footer stops when it leaves the view', () => {
    const run = runs()
    const schedule = createEscapeSchedule(run, document.createElement('footer'))
    onIntersect([{ isIntersecting: true }])
    onIntersect([{ isIntersecting: false }])
    vi.advanceTimersByTime(20_000)
    expect(run.footer).not.toHaveBeenCalled()
    schedule.stop()
  })

  it('paragraphs keep their 10–15 s rhythm while the footer runs', () => {
    const run = runs()
    const schedule = createEscapeSchedule(run, document.createElement('footer'), () => 0)
    vi.advanceTimersByTime(5000)
    expect(run.paragraph).toHaveBeenCalledTimes(1)
    schedule.paragraphEnded()
    onIntersect([{ isIntersecting: true }])
    vi.advanceTimersByTime(9999)
    expect(run.paragraph).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1)
    expect(run.paragraph).toHaveBeenCalledTimes(2)
    schedule.stop()
  })
})
