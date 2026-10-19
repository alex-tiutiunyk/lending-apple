import { expect, test } from '@playwright/test'

// Plan 11: the iPad bugs that reproduce outside the iPad (§4, §6, §8). The device keeps the
// final say; these keep them from coming back.

test.describe('header', () => {
  for (const width of [744, 768, 810, 820, 834, 1024]) {
    test(`the brand name stays on one line at ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto('/')
      const sizes = await page.evaluate(() => {
        const home = document.querySelector('[data-home-link]')
        const bar = home?.parentElement
        const tapMin = parseFloat(getComputedStyle(document.documentElement).fontSize) * 2.75
        return {
          homeHeight: home?.getBoundingClientRect().height ?? Infinity,
          tapMin,
          overflow: bar ? bar.scrollWidth - bar.clientWidth : Infinity,
        }
      })
      expect(sizes.homeHeight).toBeLessThanOrEqual(sizes.tapMin + 0.5)
      expect(sizes.overflow).toBe(0)
    })
  }
})

test.describe('the numbers', () => {
  for (const [width, height] of [
    [1079, 490],
    [1180, 820],
    [1194, 834],
    [1440, 900],
  ] as const) {
    test(`figures of one row share a line at ${width} × ${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      await page.goto('/')
      await page.locator('#numbers').scrollIntoViewIfNeeded()
      const rows = await page.evaluate(() => {
        const byRow = new Map<number, number[]>()
        for (const stat of Array.from(document.querySelectorAll('#numbers [data-stat]'))) {
          const value = stat.querySelector('dd')
          if (!value) continue
          const rowTop = Math.round(stat.getBoundingClientRect().top)
          byRow.set(rowTop, [...(byRow.get(rowTop) ?? []), value.getBoundingClientRect().top])
        }
        return Array.from(byRow.values())
      })
      expect(rows.length).toBeGreaterThan(0)
      for (const tops of rows) {
        expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(1)
      }
    })
  }
})

test('the particle canvas draws at the size of its own box', async ({ page }) => {
  await page.goto('/')
  const canvas = page.locator('.backdrop canvas')
  await canvas.waitFor({ state: 'attached' })
  await expect
    .poll(() =>
      canvas.evaluate((element: HTMLCanvasElement) => {
        const box = element.getBoundingClientRect()
        const ratio = element.width / box.width
        return Math.abs(box.height - element.height / ratio)
      }),
    )
    .toBeLessThanOrEqual(1)
})
