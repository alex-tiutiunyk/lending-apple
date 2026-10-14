import { describe, expect, it } from 'vitest'
import { activeSection } from './activeSection'

const band = 400

describe('activeSection', () => {
  it('has nothing active over the hero', () => {
    expect(activeSection([600, 2000, 4000, 6000], 7000, band)).toBe(-1)
  })

  it('activates each target once its top passes the band', () => {
    expect(activeSection([400, 1800, 3800, 5800], 6800, band)).toBe(0)
    expect(activeSection([-1000, 399, 2400, 4400], 5400, band)).toBe(1)
    expect(activeSection([-3000, -1600, 0, 2000], 3000, band)).toBe(2)
    expect(activeSection([-5000, -3600, -2000, 100], 1000, band)).toBe(3)
  })

  it('keeps Numbers active over Features, which has no nav target', () => {
    expect(activeSection([-4000, -2600, -900, 900], 2400, band)).toBe(2)
  })

  it('has nothing active from Reserve down', () => {
    expect(activeSection([-6000, -4600, -3000, -1000], 400, band)).toBe(-1)
    expect(activeSection([-8000, -6600, -5000, -3000], -1500, band)).toBe(-1)
  })
})
