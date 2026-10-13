import { expect, test, type Page } from '@playwright/test'

function sectionProgress(page: Page, id: string) {
  return page.locator(`#${id}`).evaluate((section) => Number(section.style.getPropertyValue('--p')))
}

async function scrollToShare(page: Page, id: string, share: number) {
  await page.evaluate(
    ([sectionId, fraction]) => {
      const section = document.getElementById(String(sectionId))
      if (!section) return
      const top = section.getBoundingClientRect().top + window.scrollY
      window.scrollTo(0, top + (section.offsetHeight - window.innerHeight) * Number(fraction))
    },
    [id, share],
  )
  await page.waitForFunction(() => new Promise((resolve) => requestAnimationFrame(resolve)))
  await page.waitForFunction(() => new Promise((resolve) => requestAnimationFrame(resolve)))
}

test('content is readable before JavaScript runs', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.locator('h1')).toBeVisible()
  await expect(page.locator('#numbers').getByText('3,000 nits', { exact: true })).toHaveCount(1)
  await expect(page.locator('#reserve h2')).toHaveText('Reserve yours')
  await context.close()
})

test('reload in the middle of a pinned section restores its progress', async ({ page }) => {
  await page.goto('/')
  await scrollToShare(page, 'inside', 0.5)
  await page.reload()
  await expect.poll(() => sectionProgress(page, 'inside')).toBeGreaterThan(0.35)
  expect(await sectionProgress(page, 'inside')).toBeLessThan(0.65)
})

test('opening a section hash lands below the header at progress 0', async ({ page }) => {
  await page.goto('/#inside')
  await page.waitForLoadState('networkidle')
  const headingTop = await page.locator('#inside h2').evaluate((h) => h.getBoundingClientRect().top)
  const headerBottom = await page
    .locator('header')
    .evaluate((h) => h.getBoundingClientRect().bottom)
  expect(headingTop).toBeGreaterThanOrEqual(headerBottom)
  expect(await sectionProgress(page, 'inside')).toBeLessThan(0.05)
})

test('resizing mid-scroll refreshes the cached geometry', async ({ page }) => {
  await page.goto('/')
  await scrollToShare(page, 'design', 0.5)
  await page.setViewportSize({ width: 820, height: 1180 })
  await scrollToShare(page, 'design', 0.5)
  const progress = await sectionProgress(page, 'design')
  expect(progress).toBeGreaterThan(0.4)
  expect(progress).toBeLessThan(0.6)
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})

test('scroll-driven effects reverse while counters stay rolled', async ({ page }) => {
  await page.goto('/')
  await scrollToShare(page, 'inside', 1)
  expect(await sectionProgress(page, 'inside')).toBe(1)
  await page.locator('#numbers').scrollIntoViewIfNeeded()
  await expect(page.locator('#numbers [class*="strip"]').first()).toHaveAttribute(
    'style',
    /--reel: 2\.000/,
    { timeout: 4000 },
  )
  await scrollToShare(page, 'inside', 0.2)
  const reversed = await sectionProgress(page, 'inside')
  expect(reversed).toBeGreaterThan(0.1)
  expect(reversed).toBeLessThan(0.3)
  await page.locator('#numbers').scrollIntoViewIfNeeded()
  await expect(page.locator('#numbers [class*="strip"]').first()).toHaveAttribute(
    'style',
    /--reel: 2\.000/,
  )
})

test('turning reduced motion on while the page is open settles every section', async ({ page }) => {
  await page.goto('/')
  await scrollToShare(page, 'design', 0.2)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect.poll(() => sectionProgress(page, 'design')).toBe(1)
  const position = await page
    .locator('#design [data-stage]')
    .evaluate((stage) => getComputedStyle(stage).position)
  expect(position).toBe('static')
})

test('rapid finish changes end on the last pick', async ({ page }) => {
  await page.goto('/')
  await page.locator('#finishes').scrollIntoViewIfNeeded()
  const names = ['Ember', 'Moss', 'Basalt', 'Tidewater', 'Ember', 'Basalt', 'Moss', 'Ember']
  for (const name of names) await page.getByRole('radio', { name: new RegExp(name) }).check()
  const hue = await page.evaluate(() =>
    document.documentElement.style.getPropertyValue('--accent-h'),
  )
  expect(hue).toBe('18')
  await expect(page.getByRole('radio', { name: /Ember/ })).toBeChecked()
})

test('keyboard focus moves through the page without getting trapped', async ({
  page,
  browserName,
}) => {
  test.skip(browserName === 'webkit', 'WebKit skips links on Tab unless the user turns it on')
  await page.goto('/')
  const seen = new Set<string>()
  for (let step = 0; step < 30; step += 1) {
    await page.keyboard.press('Tab')
    const label = await page.evaluate(() => {
      const active = document.activeElement
      if (!active || active === document.body) return 'body'
      const rect = active.getBoundingClientRect()
      const isOnScreen = rect.bottom > 0 && rect.top < window.innerHeight
      return `${active.tagName}:${active.textContent?.trim().slice(0, 24)}:${isOnScreen}`
    })
    expect(label.endsWith(':false')).toBe(false)
    seen.add(label)
  }
  expect([...seen].some((label) => label.startsWith('INPUT'))).toBe(true)
})

test('a full scroll has no long tasks over 50 ms after load @perf', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Long Tasks API is Chromium only')
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  const longTasks = await page.evaluate(async () => {
    const durations: number[] = []
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => durations.push(entry.duration))
    })
    observer.observe({ type: 'longtask' })
    const end = document.documentElement.scrollHeight - window.innerHeight
    for (let y = 0; y <= end; y += 120) {
      window.scrollTo(0, y)
      await new Promise((resolve) => requestAnimationFrame(resolve))
    }
    observer.disconnect()
    return durations
  })
  expect(longTasks.filter((duration) => duration > 50)).toEqual([])
})
