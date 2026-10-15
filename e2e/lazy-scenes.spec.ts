import { expect, test, type Page } from '@playwright/test'

const storageKey = 'concept-18-a11y'

async function storeSettings(page: Page, settings: Record<string, unknown>) {
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(String(key), String(value)),
    [storageKey, JSON.stringify({ v: 1, ...settings })],
  )
}

const bug = (page: Page) => page.locator('.lens-bug__bug')
const team = (page: Page) => page.locator('[data-mini-pip]')
const line = (page: Page) => page.locator('.hero-extras__line-stroke')

/** An instant scroll: WebKit's smooth `scrollIntoViewIfNeeded` can take longer than the polls. */
async function bringIntoView(page: Page, selector: string) {
  await page.evaluate(
    (target) =>
      document.querySelector(target)?.scrollIntoView({ block: 'center', behavior: 'instant' }),
    selector,
  )
}

test.describe('lens bug (plan 5 §5)', () => {
  test('walks the lens boxes at full while the camera card is in view', async ({ page }) => {
    await page.goto('/')
    await bringIntoView(page, '[data-particles="lens"]')
    await expect(bug(page)).toHaveCount(1)
    await expect(page.locator('[data-particles="lens"]')).toHaveAttribute('data-awake')
    const readTranslate = () => bug(page).evaluate((element) => element.style.translate)
    await expect.poll(readTranslate).not.toBe('')
    const before = await readTranslate()
    // Emulated WebKit paints this page at 2–4 frames a second on a busy machine, and the bug
    // pauses now and then to look around: give it a few seconds to take its next step
    await expect.poll(readTranslate, { timeout: 5000 }).not.toBe(before)
    await expect(page.locator('.features__lens[data-bug]')).toHaveCount(1)
  })

  for (const motion of ['calm', 'off']) {
    test(`is absent at ${motion}`, async ({ page }) => {
      await storeSettings(page, { motion })
      await page.goto('/')
      await bringIntoView(page, '[data-particles="lens"]')
      await page.waitForTimeout(300)
      await expect(bug(page)).toHaveCount(0)
    })
  }

  test('takes the text colour in high contrast', async ({ page }) => {
    await storeSettings(page, { contrast: 'high' })
    await page.goto('/')
    await bringIntoView(page, '[data-particles="lens"]')
    await expect(bug(page)).toHaveCount(1)
    const colours = await bug(page).evaluate((element) => [
      getComputedStyle(element).color,
      getComputedStyle(document.body).color,
    ])
    expect(colours[0]).toBe(colours[1])
  })
})

test.describe('football on the finishes render (plan 7 §5)', () => {
  test('no bird; at full four mini Pips play and the logo leaves the phone', async ({ page }) => {
    await page.goto('/')
    await bringIntoView(page, '#finishes')
    await expect(page.locator('.camera-bird')).toHaveCount(0)
    await expect(team(page)).toHaveCount(4)
    await expect(page.locator('.finishes__render[data-ball-out]')).toHaveCount(1, { timeout: 5000 })
    await expect(page.locator('.finishes-team__ball')).toBeVisible()
  })

  test('is absent at calm and at off', async ({ page }) => {
    for (const motion of ['calm', 'off']) {
      await storeSettings(page, { motion })
      await page.goto('/')
      await bringIntoView(page, '#finishes')
      await page.waitForTimeout(300)
      await expect(team(page)).toHaveCount(0)
      await expect(page.locator('[data-ball-out]')).toHaveCount(0)
    }
  })
})

test.describe('hero single line (plan 5 §14)', () => {
  test('exists after hydration with a measured path', async ({ page }) => {
    await page.goto('/')
    await expect(line(page)).toHaveCount(1)
    await expect
      .poll(() => line(page).evaluate((path) => path.getAttribute('d') ?? ''))
      .toMatch(/^M [\d.-]+ [\d.-]+ C /)
  })

  test('is complete and still at off', async ({ page }) => {
    await storeSettings(page, { motion: 'off' })
    await page.goto('/')
    await expect(line(page)).toHaveCount(1)
    const state = await line(page).evaluate((path) => ({
      // Chromium reports "0px", WebKit "0": compare the number
      offset: parseFloat(getComputedStyle(path).strokeDashoffset),
      running: path.getAnimations().filter((animation) => animation.playState === 'running').length,
    }))
    expect(state.offset).toBe(0)
    expect(state.running).toBe(0)
  })

  test('is absent without JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible()
    await expect(line(page)).toHaveCount(0)
    await context.close()
  })
})
