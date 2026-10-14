import { describe, expect, it } from 'vitest'
import { decodeFrame, decodeMs } from './decodeFrame'

describe('decodeFrame', () => {
  it('keeps the length and the spaces while cycling', () => {
    const frame = decodeFrame('Unofficial design study', 0, () => 0.3)
    expect(frame).toHaveLength('Unofficial design study'.length)
    expect(frame.split(' ').map((word) => word.length)).toEqual([10, 6, 5])
    expect(frame).not.toBe('Unofficial design study')
  })

  it('settles from left to right and ends on the real text', () => {
    const halfway = decodeFrame('ABCDEFGH', decodeMs * 0.6, () => 0.5)
    expect(halfway.startsWith('ABC')).toBe(true)
    expect(halfway.endsWith('H')).toBe(false)
    expect(decodeFrame('ABCDEFGH', decodeMs, () => 0.5)).toBe('ABCDEFGH')
  })
})
