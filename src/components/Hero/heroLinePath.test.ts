import { describe, expect, it } from 'vitest'
import { heroLinePath } from './heroLinePath'

describe('heroLinePath (plan 5 §14)', () => {
  it('starts at the outline, runs under the last word right to left and ends in a flourish', () => {
    const d = heroLinePath({ x: 640, y: 40 }, { left: 300, right: 420, bottom: 120 })
    expect(d.startsWith('M 640 40 C ')).toBe(true)
    expect(d).toContain('448 126 L 304 126')
    expect(d.match(/C /g)).toHaveLength(3)
    expect(d).not.toMatch(/, C/)
  })

  it('loops upward when the words sit above the phone (stacked layout)', () => {
    const beside = heroLinePath({ x: 640, y: 40 }, { left: 300, right: 420, bottom: 120 })
    const above = heroLinePath({ x: 40, y: 400 }, { left: 0, right: 200, bottom: 100 })
    expect(above).toContain('C -30 330')
    expect(beside).toContain('C 570 12')
  })

  it('keeps one decimal at most', () => {
    const d = heroLinePath({ x: 10.123456, y: 0.5 }, { left: 1.25, right: 2.75, bottom: 3.333 })
    expect(d).not.toMatch(/\d\.\d\d/)
  })
})
