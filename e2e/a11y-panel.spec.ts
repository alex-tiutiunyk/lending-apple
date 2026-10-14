import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const storageKey = 'concept-18-a11y'
const finishNames = ['Tidewater', 'Ember', 'Moss', 'Basalt']

const handle = (page: Page) => page.getByRole('button', { name: 'Accessibility settings' })
const panelRoot = (page: Page) => page.locator('[data-state]:has(#a11y-panel)')
const liveRegion = (page: Page) => panelRoot(page).locator('p[role="status"]')

async function storeSettings(page: Page, settings: Record<string, unknown>) {
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(String(key), String(value)),
    [storageKey, JSON.stringify({ v: 1, ...settings })],
  )
}

async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight / 2) {
      window.scrollTo({ top: y, behavior: 'instant' })
      await new Promise((resolve) => requestAnimationFrame(resolve))
    }
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })
    await new Promise((resolve) => setTimeout(resolve, 200))
  })
}

/** Text that sticks out of the box that clips it, plus horizontal page overflow. */
function readOverflow(page: Page) {
  return page.evaluate(() => {
    const clipper = (element: Element) => {
      for (let parent = element.parentElement; parent && parent !== document.body;) {
        const style = getComputedStyle(parent)
        if (/hidden|clip/.test(style.overflowX + style.overflowY)) return parent
        parent = parent.parentElement
      }
      return null
    }
    const clipped: string[] = []
    for (const element of Array.from(
      document.querySelectorAll('header *, main *, footer *, #a11y-panel *'),
    )) {
      if (element.closest('svg, [aria-hidden="true"]')) continue
      const hasText = Array.from(element.childNodes).some(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
      )
      const box = element.getBoundingClientRect()
      if (!hasText || box.width <= 1 || box.height <= 1) continue
      const parent = clipper(element)
      const bounds = parent?.getBoundingClientRect()
      if (!bounds || bounds.width <= 1) continue
      const isOutside =
        box.left < bounds.left - 1 ||
        box.right > bounds.right + 1 ||
        box.top < bounds.top - 1 ||
        box.bottom > bounds.bottom + 1
      if (isOutside) clipped.push(`${element.className || element.tagName}: ${element.textContent}`)
    }
    const root = document.documentElement
    return { horizontal: root.scrollWidth - root.clientWidth, clipped }
  })
}

/** requestAnimationFrame callbacks over half a second of doing nothing. */
async function framesWhileIdle(page: Page) {
  await page.waitForTimeout(600)
  return page.evaluate(async () => {
    let count = 0
    const original = window.requestAnimationFrame.bind(window)
    window.requestAnimationFrame = (callback) => {
      count += 1
      return original(callback)
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
    window.requestAnimationFrame = original
    return count
  })
}

test.describe('panel', () => {
  test('closed, only the handle shows', async ({ page }) => {
    await page.goto('/')
    await expect(handle(page)).toBeVisible()
    await expect(panelRoot(page)).toHaveAttribute('data-state', 'closed')
    await expect(page.locator('#a11y-panel')).toBeHidden()
    const handleLeft = await handle(page).evaluate((button) => button.getBoundingClientRect().left)
    expect(handleLeft).toBeLessThanOrEqual(0)
  })

  test('hover only loads the controls; a click opens, a second click closes', async ({
    page,
    hasTouch,
  }) => {
    test.skip(hasTouch, 'no hover on touch screens')
    await page.goto('/')
    await handle(page).hover()
    await page.waitForTimeout(300)
    await expect(panelRoot(page)).toHaveAttribute('data-state', 'closed')
    await expect(page.locator('#a11y-panel input[type="radio"]').first()).toBeAttached()
    await handle(page).click()
    await expect(panelRoot(page)).toHaveAttribute('data-state', 'open')
    await expect(page.getByRole('radio', { name: 'Calm' })).toBeVisible()
    await handle(page).click()
    await expect(panelRoot(page)).toHaveAttribute('data-state', 'closed')
  })

  test('a click outside closes it', async ({ page, hasTouch }) => {
    test.skip(hasTouch, 'touch has its own test')
    await page.goto('/')
    await handle(page).click()
    await expect(panelRoot(page)).toHaveAttribute('data-state', 'open')
    await page.mouse.click(900, 400)
    await expect(panelRoot(page)).toHaveAttribute('data-state', 'closed')
  })

  test('keyboard: focus on the handle keeps it closed, Enter opens, Escape returns', async ({
    page,
    browserName,
    hasTouch,
  }) => {
    test.skip(browserName === 'webkit' || hasTouch, 'Tab order differs on WebKit and touch')
    await page.goto('/')
    await expect(handle(page)).toBeAttached()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await expect(handle(page)).toBeFocused()
    await expect(panelRoot(page)).toHaveAttribute('data-state', 'closed')
    await expect(page.locator('#a11y-panel')).toHaveAttribute('inert', '')

    await page.keyboard.press('Tab')
    await expect(handle(page)).not.toBeFocused()
    expect(await page.evaluate(() => !!document.activeElement?.closest('#a11y-panel'))).toBe(false)

    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Enter')
    await expect(handle(page)).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByRole('radio', { name: 'Full' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(handle(page)).toBeFocused()
    await expect(panelRoot(page)).toHaveAttribute('data-state', 'closed')
  })

  test('a tap opens it on touch screens, a tap outside closes it', async ({ page, hasTouch }) => {
    test.skip(!hasTouch, 'touch only')
    await page.goto('/')
    await handle(page).tap()
    await expect(panelRoot(page)).toHaveAttribute('data-state', 'open')
    // Phones are narrow enough for the open panel to cover the headline: tap the right edge
    const viewport = page.viewportSize() ?? { width: 390, height: 800 }
    await page.touchscreen.tap(viewport.width - 8, viewport.height / 2)
    await expect(panelRoot(page)).toHaveAttribute('data-state', 'closed')
  })

  test('announces each change and resets everything', async ({ page, browserName }) => {
    await page.goto('/')
    await handle(page).click()
    await page.getByRole('button', { name: /A\+/ }).click()
    await expect(liveRegion(page)).toHaveText('Text size 115 %')
    await expect(page.locator('html')).toHaveAttribute('data-text-scale', '115')
    await page.getByRole('radio', { name: 'High' }).check()
    await expect(liveRegion(page)).toHaveText('Contrast high')
    await page.getByRole('checkbox', { name: 'Underline links' }).check()
    await expect(liveRegion(page)).toHaveText('Underline links on')
    await page.getByRole('button', { name: 'Reset all' }).click()
    await expect(liveRegion(page)).toHaveText('Settings reset')
    await expect(page.locator('html')).not.toHaveAttribute('data-text-scale', /.*/)
    await expect(page.locator('html')).not.toHaveAttribute('data-contrast', /.*/)
    // WebKit does not focus a button on click, so there is no focus to keep there
    if (browserName !== 'webkit') {
      await expect(page.getByRole('button', { name: 'Reset all' })).toBeFocused()
    }
  })

  test('has no axe violations while open', async ({ page }) => {
    await page.goto('/')
    await handle(page).click()
    await expect(page.getByRole('button', { name: 'Reset all' })).toBeVisible()
    const results = await new AxeBuilder({ page })
      .include('[data-state]:has(#a11y-panel)')
      .analyze()
    expect(results.violations.map(({ id, nodes }) => `${id} (${nodes.length})`)).toEqual([])
  })
})

test.describe('motion levels', () => {
  const checkMotionOff = async (page: Page) => {
    await page.goto('/')
    await scrollThrough(page)
    const running = await page.evaluate(
      () =>
        document.getAnimations().filter((animation) => animation.playState === 'running').length,
    )
    expect(running).toBe(0)
    expect(await framesWhileIdle(page)).toBe(0)
    await expect(page.getByRole('button', { name: 'Poke Pip' })).toHaveCount(0)
    const stage = page.locator('#inside [data-stage]')
    expect(await stage.evaluate((element) => getComputedStyle(element).position)).toBe('static')
    expect(
      await page.locator('#inside').evaluate((section) => section.style.getPropertyValue('--p')),
    ).toBe('1')
    expect(
      await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior),
    ).toBe('auto')
  }

  test('off stops every animation, scroll effect and frame', async ({ page }) => {
    await storeSettings(page, { motion: 'off' })
    await checkMotionOff(page)
  })

  test.describe('the system preference gives the same page', () => {
    test.use({ reducedMotion: 'reduce' })

    test('with motion left at full', async ({ page }) => {
      await checkMotionOff(page)
      await handle(page).click()
      await expect(page.getByRole('radio', { name: 'Off' })).toBeChecked()
      await expect(page.getByRole('radio', { name: 'Full' })).toBeDisabled()
      await expect(page.getByText('Your system asks for reduced motion')).toBeVisible()
    })
  })

  test('calm stops ambient motion but keeps scroll effects', async ({ page }) => {
    await storeSettings(page, { motion: 'calm' })
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Poke Pip' })).toHaveCount(0)
    await expect(
      page.locator('header').getByRole('button', { name: 'Pause motion' }),
    ).toHaveAttribute('aria-pressed', 'true')
    const design = page.locator('#design')
    await design.evaluate((section) => {
      const top = section.getBoundingClientRect().top + window.scrollY
      window.scrollTo({
        top: top + ((section as HTMLElement).offsetHeight - window.innerHeight) / 2,
        behavior: 'instant',
      })
    })
    await expect
      .poll(() => design.evaluate((section) => Number(section.style.getPropertyValue('--p'))))
      .toBeGreaterThan(0.2)
    expect(
      await design.evaluate((section) => Number(section.style.getPropertyValue('--p'))),
    ).toBeLessThan(1)
  })

  test('the plan 1 pause key becomes calm', async ({ page }) => {
    await page.addInitScript(() => {
      if (!window.localStorage.getItem('concept-18-a11y')) {
        window.localStorage.setItem('concept-18-motion-paused', 'true')
      }
    })
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'calm')
    expect(
      await page.evaluate(() => window.localStorage.getItem('concept-18-motion-paused')),
    ).toBeNull()
  })
})

test.describe('text size', () => {
  test.beforeEach(({ hasTouch }) => {
    test.skip(hasTouch, 'viewport sizes are set by hand on desktop projects')
  })

  for (const width of [320, 1280]) {
    test(`200 % at ${width} px: no horizontal scroll, no clipped text`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await storeSettings(page, { textScale: 200 })
      await page.goto('/')
      await scrollThrough(page)
      const overflow = await readOverflow(page)
      expect(overflow.horizontal).toBeLessThanOrEqual(0)
      expect(overflow.clipped).toEqual([])
    })
  }

  test('200 % at 1280 px gets the 640 px layout', async ({ page }) => {
    const navDisplay = () =>
      page.locator('nav[aria-label="Sections"]').evaluate((nav) => getComputedStyle(nav).display)
    await page.setViewportSize({ width: 640, height: 800 })
    await page.goto('/')
    const narrow = await navDisplay()
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.reload()
    const wide = await navDisplay()
    expect(narrow).not.toBe(wide)

    await storeSettings(page, { textScale: 200 })
    await page.reload()
    expect(await navDisplay()).toBe(narrow)
    expect(
      await page
        .locator('#inside [data-stage]')
        .evaluate((stage) => getComputedStyle(stage).position),
    ).toBe('static')
  })

  test('wider spacing clips nothing', async ({ page }) => {
    await storeSettings(page, { spacing: true })
    await page.goto('/')
    await scrollThrough(page)
    const overflow = await readOverflow(page)
    expect(overflow.horizontal).toBeLessThanOrEqual(0)
    expect(overflow.clipped).toEqual([])
  })
})

test.describe('light theme', () => {
  test('the panel switches it and a reload keeps it', async ({ page }) => {
    await page.goto('/')
    await handle(page).click()
    await page.getByRole('radio', { name: 'Light', exact: true }).check()
    await expect(liveRegion(page)).toHaveText('Light theme')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute('content', 'light')
    const background = () =>
      page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)
    const light = await background()
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    expect(await background()).toBe(light)
    await handle(page).click()
    await page.getByRole('radio', { name: 'Dark', exact: true }).check()
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.*/)
    expect(await background()).not.toBe(light)
  })

  for (const [contrast, rule] of [
    ['standard', 'color-contrast'],
    ['high', 'color-contrast-enhanced'],
  ] as const) {
    for (const finish of finishNames) {
      test(`${contrast} contrast passes ${rule} with ${finish}`, async ({ page, browserName }) => {
        test.skip(browserName !== 'chromium', 'one engine is enough for color math')
        await storeSettings(page, { theme: 'light', contrast, motion: 'off' })
        await page.goto('/')
        await page.locator('#finishes').scrollIntoViewIfNeeded()
        await page.getByRole('radio', { name: new RegExp(finish) }).check()
        await scrollThrough(page)
        const results = await new AxeBuilder({ page }).withRules([rule]).analyze()
        expect(
          results.violations.flatMap(({ id, nodes }) =>
            nodes.map((node) => `${id}: ${node.target.join(' ')}`),
          ),
        ).toEqual([])
      })
    }
  }
})

test.describe('high contrast', () => {
  for (const finish of finishNames) {
    test(`meets AAA contrast with ${finish}`, async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'one engine is enough for color math')
      await storeSettings(page, { contrast: 'high', motion: 'off' })
      await page.goto('/')
      await page.locator('#finishes').scrollIntoViewIfNeeded()
      await page.getByRole('radio', { name: new RegExp(finish) }).check()
      await scrollThrough(page)
      const results = await new AxeBuilder({ page })
        .withRules(['color-contrast', 'color-contrast-enhanced'])
        .analyze()
      expect(
        results.violations.flatMap(({ id, nodes }) =>
          nodes.map((node) => `${id}: ${node.target.join(' ')}`),
        ),
      ).toEqual([])
    })
  }

  test.describe('follows the system', () => {
    test.use({ contrast: 'more' })

    test('unless the reader picked Standard', async ({ page }) => {
      await page.goto('/')
      const background = () =>
        page
          .locator('body')
          .evaluate(() =>
            getComputedStyle(document.documentElement).getPropertyValue('--color-text-muted'),
          )
      const systemValue = await background()
      await handle(page).click()
      await expect(page.getByRole('radio', { name: 'High' })).toBeChecked()
      await page.getByRole('radio', { name: 'Standard' }).check()
      expect(await background()).not.toBe(systemValue)
    })
  })
})

test('stored settings are on <html> before the first paint', async ({ page }) => {
  await storeSettings(page, {
    textScale: 175,
    contrast: 'high',
    theme: 'light',
    motion: 'calm',
    links: true,
  })
  await page.addInitScript(() => {
    document.addEventListener('readystatechange', () => {
      if (document.readyState !== 'interactive') return
      const root = document.documentElement
      root.dataset.firstSettings = [
        root.getAttribute('data-text-scale'),
        root.getAttribute('data-contrast'),
        root.getAttribute('data-theme'),
        root.getAttribute('data-motion'),
        root.getAttribute('data-links'),
      ].join(',')
    })
  })
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute(
    'data-first-settings',
    '175,high,light,calm,underline',
  )
})

test.describe('forced colors', () => {
  test.use({ forcedColors: 'active', viewport: { width: 1440, height: 900 } })

  test('key controls stay visible', async ({ page, hasTouch }, testInfo) => {
    test.skip(hasTouch, 'desktop screenshot')
    await page.goto('/')
    await expect(handle(page)).toBeVisible()
    await expect(page.locator('#hero').getByRole('link', { name: 'Reserve yours' })).toBeVisible()
    const border = await page
      .locator('#hero a[data-magnetic] > span:last-child')
      .evaluate((body) => getComputedStyle(body).borderTopStyle)
    expect(border).toBe('solid')
    await testInfo.attach('forced-colors', {
      body: await page.screenshot(),
      contentType: 'image/png',
    })
  })
})
