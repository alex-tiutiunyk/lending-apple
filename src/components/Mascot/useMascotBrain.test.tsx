import { act, render } from '@testing-library/react'
import { useRef } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { installManualFrames } from '@/test/animationFrames'
import { isMoving, useMascotBrain } from './useMascotBrain'

type Controls = ReturnType<typeof useMascotBrain>

const noHint = () => null
const half = () => 0.5

function Pip({ onReady }: { onReady: (controls: Controls) => void }) {
  const ref = useRef<HTMLElement>(null)
  const controls = useMascotBrain(ref, half, noHint)
  onReady(controls)
  return (
    <aside ref={ref} data-testid="pip" data-act={controls.act}>
      <button type="button" />
    </aside>
  )
}

describe('isMoving', () => {
  const free = new Set<never>()
  const held = new Set(['pointer' as const])

  it('is true for the walking acts of a free Pip only', () => {
    expect(isMoving({ act: 'walk', holds: free })).toBe(true)
    expect(isMoving({ act: 'chase', holds: free })).toBe(true)
    expect(isMoving({ act: 'nap', holds: free })).toBe(false)
    expect(isMoving({ act: 'walk', holds: held })).toBe(false)
  })
})

describe('useMascotBrain (plan 6 rule 9: the tick sleeps)', () => {
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
  })

  it('schedules frames while Pip walks and none while it is held', () => {
    let controls: Controls | null = null
    const { getByTestId } = render(<Pip onReady={(next) => (controls = next)} />)
    const pip = getByTestId('pip')
    expect(pip.style.translate).toBe('-64.0px 0')
    expect(frames.pendingCount()).toBe(1)

    act(() => frames.runFrame(16))
    act(() => frames.runFrame(32))
    expect(frames.pendingCount()).toBe(1)
    expect(parseFloat(pip.style.translate)).toBeGreaterThan(-64)

    act(() => controls?.hold('pointer', true))
    act(() => frames.runFrame(48))
    expect(frames.pendingCount()).toBe(0)
    expect(pip.hasAttribute('data-held')).toBe(true)

    act(() => controls?.hold('pointer', false))
    expect(frames.pendingCount()).toBe(1)
  })

  it('ends a still act on a timer, without frames', () => {
    const timers: { run: () => void; delay: number }[] = []
    vi.spyOn(window, 'setTimeout').mockImplementation(((run: () => void, delay: number) => {
      timers.push({ run, delay })
      return timers.length
    }) as typeof window.setTimeout)
    let controls: Controls | null = null
    const { getByTestId } = render(<Pip onReady={(next) => (controls = next)} />)
    act(() => frames.runFrame(16))
    act(() => controls?.startAct('nap'))
    act(() => frames.runFrame(32))
    expect(frames.pendingCount()).toBe(0)
    expect(getByTestId('pip').getAttribute('data-act')).toBe('nap')
    expect(timers.at(-1)?.delay).toBe(5200)

    act(() => timers.at(-1)?.run())
    expect(getByTestId('pip').getAttribute('data-act')).toBe('walk')
    expect(frames.pendingCount()).toBe(1)
  })
})
