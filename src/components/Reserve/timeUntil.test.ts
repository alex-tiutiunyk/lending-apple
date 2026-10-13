import { describe, expect, it } from 'vitest'
import { timeUntil } from './timeUntil'

const launch = Date.parse('2026-11-20T17:00:00Z')

describe('timeUntil', () => {
  it('splits the remaining time into days, hours and minutes', () => {
    const now = Date.parse('2026-10-13T09:30:00Z')
    expect(timeUntil(launch, now)).toEqual({ hasArrived: false, days: 38, hours: 7, minutes: 30 })
  })

  it('rounds partial minutes up so it never shows zero too early', () => {
    const now = launch - 20_000
    expect(timeUntil(launch, now)).toEqual({ hasArrived: false, days: 0, hours: 0, minutes: 1 })
  })

  it('reports arrival at and after the launch moment', () => {
    expect(timeUntil(launch, launch).hasArrived).toBe(true)
    expect(timeUntil(launch, launch + 3_600_000)).toEqual({
      hasArrived: true,
      days: 0,
      hours: 0,
      minutes: 0,
    })
  })

  it('does not depend on the visitor time zone', () => {
    const now = Date.parse('2026-11-20T18:59:00+02:00')
    expect(timeUntil(launch, now).minutes).toBe(1)
  })
})
