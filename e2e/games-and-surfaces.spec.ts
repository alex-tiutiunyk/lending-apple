import { expect, test, type Page } from '@playwright/test'

const storageKey = 'concept-18-a11y'

async function storeSettings(page: Page, settings: Record<string, unknown>) {
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(String(key), String(value)),
    [storageKey, JSON.stringify({ v: 1, ...settings })],
  )
}

/** Running animations whose target matches `selector` or sits inside a match. */
function running(page: Page, selector: string) {
  return page.evaluate((within) => {
    return document.getAnimations().filter((animation) => {
      if (animation.playState !== 'running') return false
      const target = (animation.effect as KeyframeEffect | null)?.target
      return !!target && !!target.closest(within)
    }).length
  }, selector)
}

async function bringIntoView(page: Page, selector: string) {
  await page.evaluate(
    (target) =>
      document.querySelector(target)?.scrollIntoView({ block: 'center', behavior: 'instant' }),
    selector,
  )
}

test.describe('brand mark: grow and bite (plan 7 §4)', () => {
  test('a hover grows the header mark and leaves the chewed bite; ids are unique', async ({
    page,
    hasTouch,
  }) => {
    test.skip(hasTouch, 'no hover on touch screens')
    await page.goto('/')
    const ids = await page.$$eval('[data-mark-host] mask', (masks) => masks.map((mask) => mask.id))
    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(2)
    await page.hover('[data-home-link]')
    const state = () =>
      page.evaluate(() => {
        const host = document.querySelector('[data-home-link]') as HTMLElement
        const scale = (selector: string) =>
          new DOMMatrix(getComputedStyle(host.querySelector(selector) as Element).transform).a
        const chomps = Array.from(host.querySelectorAll('.apple-bite__chomp'), (chomp) =>
          Math.round(new DOMMatrix(getComputedStyle(chomp).transform).a),
        )
        return { grow: Math.round(scale('.living-mark__grow') * 100), chomps }
      })
    await expect.poll(state, { timeout: 3000 }).toEqual({ grow: 135, chomps: [1, 1, 1] })
  })

  test('at off a hover runs no animation', async ({ page, hasTouch }) => {
    test.skip(hasTouch, 'no hover on touch screens')
    await storeSettings(page, { motion: 'off' })
    await page.goto('/')
    await page.hover('[data-home-link]')
    await page.waitForTimeout(300)
    expect(await running(page, '[data-home-link]')).toBe(0)
  })
})

test.describe('accessibility panel: the first open (plan 7 §14)', () => {
  test('after an idle moment the controls are mounted before the first open', async ({ page }) => {
    await page.goto('/')
    const panel = page.locator('#a11y-panel')
    // Closed, the panel is hidden and inert, so the controls are found as elements, not roles
    await expect(panel.locator('input[type="radio"]').first()).toBeAttached({ timeout: 5000 })
    await page.getByRole('button', { name: 'Accessibility settings' }).click()
    await expect(panel.getByRole('radio', { name: 'Full' })).toBeVisible()
  })

  test('a slow chunk shows the spinner and a busy panel, then the controls', async ({ page }) => {
    let release: () => void = () => undefined
    const gate = new Promise<void>((resolve) => (release = resolve))
    await page.route(/A11yPanelBody-.*\.js$/, async (route) => {
      await gate
      await route.continue()
    })
    await page.goto('/')
    const panel = page.locator('#a11y-panel')
    await expect(panel).toHaveAttribute('aria-busy', 'true', { timeout: 5000 })
    await page.getByRole('button', { name: 'Accessibility settings' }).click()
    await expect(panel.locator('.a11y-panel__spinner')).toBeVisible()
    release()
    await expect(panel.getByRole('radio', { name: 'Full' })).toBeVisible()
    await expect(panel).not.toHaveAttribute('aria-busy', 'true')
  })
})

test.describe('header aurora (plan 7 §6)', () => {
  test('three crests run at full and stand still at calm', async ({ page }) => {
    await page.goto('/')
    await expect.poll(() => running(page, '.header__waves')).toBe(3)
    await storeSettings(page, { motion: 'calm' })
    await page.goto('/')
    await page.waitForTimeout(300)
    expect(await running(page, '.header__waves')).toBe(0)
  })

  test('none run at off, and high contrast shows the flat bar', async ({ page }) => {
    await storeSettings(page, { motion: 'off' })
    await page.goto('/')
    await page.waitForTimeout(300)
    expect(await running(page, '.header__waves')).toBe(0)
    await storeSettings(page, { contrast: 'high' })
    await page.goto('/')
    await expect(page.locator('.header__waves')).toBeHidden()
  })

  test('the progress line stays above the edge pulse', async ({ page }) => {
    await page.goto('/')
    const order = await page.evaluate(() => {
      const progress = document.querySelector('.header__progress') as Element
      return getComputedStyle(progress).zIndex
    })
    expect(order).toBe('1')
  })
})

test.describe('border pulses (plan 7 §11)', () => {
  test('a card pulses at full, none at calm, and a focused field shows none', async ({ page }) => {
    await page.goto('/')
    await bringIntoView(page, '[data-particles="sun"]')
    // Each ring beats every 7–12 s, first after up to 9 s
    await expect
      .poll(() => running(page, '.features__card .border-pulse__ring'), { timeout: 13_000 })
      .toBeGreaterThan(0)
    await bringIntoView(page, '#reserve form')
    await page.getByLabel('Email address').focus()
    const ring = page.locator('#reserve form .border-pulse__ring')
    await expect(ring).toBeHidden()
    await storeSettings(page, { motion: 'calm' })
    await page.goto('/')
    await bringIntoView(page, '[data-particles="sun"]')
    await page.waitForTimeout(300)
    expect(await running(page, '.border-pulse__ring, .border-pulse__line')).toBe(0)
  })

  test('the header line pulses, and between beats nothing runs (no layer at rest)', async ({
    page,
  }) => {
    await page.goto('/')
    await expect
      .poll(() => running(page, '.header .border-pulse__line'), { timeout: 13_000 })
      .toBe(1)
    // One beat lasts 2.6 s; the next is 7 s or more away
    await expect.poll(() => running(page, '.header .border-pulse__line'), { timeout: 4000 }).toBe(0)
  })

  test('high contrast and off show plain borders', async ({ page }) => {
    for (const settings of [{ contrast: 'high' }, { motion: 'off' }]) {
      await storeSettings(page, settings)
      await page.goto('/')
      await bringIntoView(page, '[data-particles="sun"]')
      await page.waitForTimeout(10_000)
      expect(await running(page, '.border-pulse__ring, .border-pulse__line')).toBe(0)
    }
  })
})

test.describe('brightness bar (plan 7 §12)', () => {
  test('the sun runs at full; at calm it sits at the end; no colour animation', async ({
    page,
  }) => {
    await page.goto('/')
    await bringIntoView(page, '[data-particles="sun"]')
    await expect.poll(() => running(page, '.features__brightness')).toBeGreaterThan(2)
    const animatesColour = await page.evaluate(() =>
      document.getAnimations().some((animation) => {
        const effect = animation.effect as KeyframeEffect
        const isBar = !!(effect.target as Element | null)?.closest('.features__brightness')
        return isBar && effect.getKeyframes().some((frame) => 'color' in frame)
      }),
    )
    expect(animatesColour).toBe(false)
    await expect(page.locator('.features__brightness')).toContainText('3,000 nits')
    await storeSettings(page, { motion: 'calm' })
    await page.goto('/')
    await bringIntoView(page, '[data-particles="sun"]')
    await page.waitForTimeout(300)
    expect(await running(page, '.features__brightness')).toBe(0)
    const track = await page
      .locator('.features__brightness-track')
      .evaluate((element) => getComputedStyle(element).transform)
    expect(track).toBe('none')
  })
})

test.describe('reserve: walking bugs and the changing screen (plan 7 §8, §9)', () => {
  test('nine bugs wander at full, flee on focus; the screen cycles and stops on success', async ({
    page,
  }) => {
    test.slow()
    await page.goto('/')
    await bringIntoView(page, '#reserve form')
    const bugs = page.locator('#reserve .email-bugs__walk')
    await expect(bugs).toHaveCount(9)
    await expect.poll(() => running(page, '#reserve .email-bugs__walk')).toBeGreaterThan(0)
    await expect.poll(() => running(page, '.reserve-screens__walls')).toBeGreaterThan(0)
    const email = page.getByLabel('Email address')
    await email.fill('reader@mail.test')
    await email.press('Enter')
    await expect(page.locator('#reserve').getByRole('status')).toContainText('You are on the list.')
    await expect(page.locator('.reserve-screens__reserved')).toHaveCSS('opacity', '1')
    expect(await running(page, '.reserve-screens__walls .reserve-screens__wall')).toBe(0)
  })

  test('no bugs and no wallpapers at calm', async ({ page }) => {
    await storeSettings(page, { motion: 'calm' })
    await page.goto('/')
    await bringIntoView(page, '#reserve form')
    await page.waitForTimeout(300)
    await expect(page.locator('#reserve .email-bugs__walk')).toHaveCount(0)
    await expect(page.locator('.reserve-screens__root')).toHaveCount(0)
  })
})

test.describe('numbers labels (plan 7 §13)', () => {
  test('have no width limit', async ({ page }) => {
    await page.goto('/')
    const maxWidth = await page
      .locator('.numbers__label')
      .first()
      .evaluate((label) => getComputedStyle(label).maxWidth)
    expect(maxWidth).toBe('none')
  })
})

test.describe('footer letters (plan 7 §7)', () => {
  test('a footer paragraph escape happens soon after the footer comes into view', async ({
    page,
    hasTouch,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium' || hasTouch, 'Highlight API and timing: desktop Chromium')
    await page.goto('/')
    await page.waitForTimeout(500)
    await page.evaluate(() =>
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }),
    )
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const highlight = (CSS.highlights as unknown as Map<string, Set<Range>>).get(
              'runaway-letters',
            )
            if (!highlight) return false
            return Array.from(highlight).some(
              (range) => !!(range as Range).startContainer.parentElement?.closest('footer p'),
            )
          }),
        { timeout: 8000, intervals: [100] },
      )
      .toBe(true)
  })
})

for (const [zone, time] of [
  ['Europe/Kyiv', '19:42'],
  ['America/New_York', '12:42'],
] as const) {
  test.describe(`the visitor's time on every phone, ${zone} (plan 7 §10)`, () => {
    test.use({ timezoneId: zone })

    test('every lock screen shows the local time and date', async ({ page }) => {
      await page.clock.setFixedTime(new Date(Date.UTC(2026, 9, 15, 16, 42)))
      await page.goto('/')
      const times = page.locator('.phone-render__lock-time')
      await expect(times.first()).toHaveText(time)
      const all = await times.allTextContents()
      expect(all.length).toBeGreaterThanOrEqual(3)
      expect(new Set(all)).toEqual(new Set([time]))
      await expect(page.locator('.phone-render__lock-date').first()).toHaveText('Thu, Oct 15')
      await expect(page.locator('.hero-extras__time')).toHaveText(time)
    })
  })
}
