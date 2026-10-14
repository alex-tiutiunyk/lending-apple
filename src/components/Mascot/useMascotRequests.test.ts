import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mascotRequests } from '@/hooks/mascotRequests'
import type { MascotAct } from './mascotActs'
import { useMascotRequests } from './useMascotRequests'

/** Pip with a fixed current act; the hook unsubscribes when the test's render is cleaned up. */
function mountPip(act: MascotAct = 'walk', random = () => 0.5) {
  const pip = document.createElement('div')
  const startAct = vi.fn()
  const currentAct = vi.fn(() => act)
  const turnTo = vi.fn()
  renderHook(() => useMascotRequests({ current: pip }, random, { startAct, currentAct, turnTo }))
  return { pip, startAct, turnTo }
}

const chase = { type: 'chase', letterX: 10, direction: 1 } as const

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useMascotRequests (plan 4 §1, §2.4)', () => {
  it('chases only while idle, facing the letter', () => {
    const { pip, startAct, turnTo } = mountPip()
    pip.setAttribute('data-held', '')
    expect(mascotRequests.request(chase)).toBe(false)
    expect(startAct).not.toHaveBeenCalled()
    pip.removeAttribute('data-held')
    expect(mascotRequests.request({ ...chase, direction: -1 })).toBe(true)
    expect(turnTo).toHaveBeenCalledWith('left')
    expect(startAct).toHaveBeenCalledWith('chase')
  })

  it('does not chase while hiding or behind the footer', () => {
    const { pip } = mountPip()
    pip.setAttribute('data-hiding', '')
    expect(mascotRequests.request(chase)).toBe(false)
    pip.removeAttribute('data-hiding')
    pip.setAttribute('data-behind', '')
    expect(mascotRequests.request(chase)).toBe(false)
  })

  it('allows one chase a minute', () => {
    const now = vi.spyOn(performance, 'now').mockReturnValue(1000)
    const { startAct } = mountPip()
    expect(mascotRequests.request(chase)).toBe(true)
    expect(mascotRequests.request(chase)).toBe(false)
    now.mockReturnValue(1000 + 60_000)
    expect(mascotRequests.request(chase)).toBe(true)
    expect(startAct).toHaveBeenCalledTimes(2)
  })

  it('only turns while already chasing, and misses when the letter goes home', () => {
    const { startAct, turnTo } = mountPip('chase')
    expect(mascotRequests.request(chase)).toBe(true)
    expect(turnTo).toHaveBeenCalledWith('right')
    expect(startAct).not.toHaveBeenCalled()
    expect(mascotRequests.request({ type: 'chase-end' })).toBe(true)
    expect(startAct).toHaveBeenCalledWith('missed')
  })

  it('ignores the end of a chase it is not running', () => {
    const { startAct } = mountPip()
    expect(mascotRequests.request({ type: 'chase-end' })).toBe(false)
    expect(startAct).not.toHaveBeenCalled()
  })

  it('glances up when the dice say so', () => {
    const { startAct } = mountPip('walk', () => 0.1)
    expect(mascotRequests.request({ type: 'glance' })).toBe(true)
    expect(startAct).toHaveBeenCalledWith('glance')
  })

  it('usually lets a label change pass', () => {
    const { startAct } = mountPip('walk', () => 0.9)
    mascotRequests.request({ type: 'glance' })
    expect(startAct).not.toHaveBeenCalled()
  })

  it('cheers once per visit', () => {
    const { startAct } = mountPip()
    expect(mascotRequests.request({ type: 'cheer' })).toBe(true)
    expect(mascotRequests.request({ type: 'cheer' })).toBe(false)
    expect(startAct).toHaveBeenCalledTimes(1)
  })
})
