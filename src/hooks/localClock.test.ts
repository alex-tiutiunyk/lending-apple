import { describe, expect, it } from 'vitest'
import { formatLocalClock } from './localClock'

describe('formatLocalClock (plan 7 §10)', () => {
  const instant = Date.UTC(2026, 9, 15, 16, 42)

  it('reads the same instant in the visitor zone', () => {
    expect(formatLocalClock(instant, 'Europe/Kyiv')).toEqual({ time: '19:42', date: 'Thu, Oct 15' })
    expect(formatLocalClock(instant, 'America/New_York').time).toBe('12:42')
  })

  it('has no leading zero on the hour, and midnight is 0', () => {
    expect(formatLocalClock(Date.UTC(2026, 9, 15, 7, 5), 'UTC').time).toBe('7:05')
    expect(formatLocalClock(Date.UTC(2026, 9, 15, 0, 5), 'UTC').time).toBe('0:05')
  })

  it("turns the date at the visitor's midnight, not UTC's", () => {
    const lateInKyiv = Date.UTC(2026, 9, 15, 21, 30)
    expect(formatLocalClock(lateInKyiv, 'UTC').date).toBe('Thu, Oct 15')
    expect(formatLocalClock(lateInKyiv, 'Europe/Kyiv').date).toBe('Fri, Oct 16')
  })
})
