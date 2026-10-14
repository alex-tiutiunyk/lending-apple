import { expect, test, type Page } from '@playwright/test'

const storageKey = 'concept-18-a11y'

async function storeSettings(page: Page, settings: Record<string, unknown>) {
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(String(key), String(value)),
    [storageKey, JSON.stringify({ v: 1, ...settings })],
  )
}

async function scrollToShare(page: Page, id: string, share: number) {
  await page.evaluate(
    ([sectionId, fraction]) => {
      const section = document.getElementById(String(sectionId))
      if (!section) return
      const top = section.getBoundingClientRect().top + window.scrollY
      window.scrollTo({
        top: top + (section.offsetHeight - window.innerHeight) * Number(fraction),
        behavior: 'instant',
      })
    },
    [id, share],
  )
  await page.waitForFunction(() => new Promise((resolve) => requestAnimationFrame(resolve)))
  await page.waitForFunction(() => new Promise((resolve) => requestAnimationFrame(resolve)))
}

/** The reveal share, read back from the outline's opacity (1 − reveal × 0.9). */
function reveal(page: Page) {
  return page
    .locator('#design .phone-outline')
    .evaluate(
      (outline) => Math.round(((1 - Number(getComputedStyle(outline).opacity)) / 0.9) * 100) / 100,
    )
}

test.describe('line draw reveal (plan 4 §6)', () => {
  test('stays closed through the drawing, opens over the last third, holds at the end', async ({
    page,
  }) => {
    await page.goto('/')
    await scrollToShare(page, 'design', 0.55)
    expect(await reveal(page)).toBe(0)
    await scrollToShare(page, 'design', 0.8)
    const midway = await reveal(page)
    expect(midway).toBeGreaterThan(0.3)
    expect(midway).toBeLessThan(0.9)
    await scrollToShare(page, 'design', 0.97)
    expect(await reveal(page)).toBe(1)
    const outlinePaths = await page.locator('#design .phone-outline path').count()
    expect(outlinePaths).toBeGreaterThan(80)
  })
})

test.describe('header (plan 4 §2)', () => {
  test('the progress line follows the page position', async ({ page }) => {
    await page.goto('/')
    await expect
      .poll(() => page.evaluate(() => document.body.style.getPropertyValue('--doc-p')))
      .toBe('0.000')
    await page.evaluate(() => window.scrollTo({ top: 1500, behavior: 'instant' }))
    await expect
      .poll(() =>
        page.evaluate(() => {
          const expected = 1500 / (document.documentElement.scrollHeight - window.innerHeight)
          const line = document.querySelector('.header__progress-line')
          if (!line) return 'missing'
          const width = line.getBoundingClientRect().width / window.innerWidth
          return Math.abs(width - expected) < 0.02 ? 'match' : `${width} vs ${expected}`
        }),
      )
      .toBe('match')
  })

  test('the section label agrees with the nav and is empty before and after the sections', async ({
    page,
  }) => {
    // Four smooth scrolls through pinned sections: WebKit on a phone needs the longer budget
    test.slow()
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    const activeLabel = () =>
      page.evaluate(
        () => document.querySelector('.section-label__item[data-active]')?.textContent ?? '',
      )
    expect(await activeLabel()).toBe('')
    for (const [id, label] of [
      ['design', 'Design'],
      ['inside', 'Inside'],
      ['numbers', 'Numbers'],
      ['finishes', 'Finishes'],
    ]) {
      await scrollToShare(page, String(id), 0.3)
      await expect(
        page.getByRole('navigation', { name: 'Sections' }).locator('[aria-current]'),
      ).toHaveText(String(label))
      await expect.poll(activeLabel).toBe(`/ ${label}`)
    }
    await page.locator('#reserve').scrollIntoViewIfNeeded()
    await page.evaluate(() => window.scrollBy(0, window.innerHeight / 2))
    await expect.poll(activeLabel).toBe('')
  })

  test('the living mark is filled without motion', async ({ page }) => {
    await storeSettings(page, { motion: 'off' })
    await page.goto('/')
    const fill = page.locator('header .living-mark__fill')
    expect(await fill.evaluate((group) => getComputedStyle(group).opacity)).toBe('1')
    const stroke = page.locator('header .living-mark__stroke path').first()
    expect(await stroke.evaluate((path) => getComputedStyle(path).opacity)).toBe('0')
  })

  test('without JavaScript the mark draws its outline in CSS and ends up filled', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('/')
    const fill = page.locator('header .living-mark__fill')
    await expect.poll(() => fill.evaluate((group) => getComputedStyle(group).opacity)).toBe('1')
    const stroke = page.locator('header .living-mark__stroke path').first()
    await expect.poll(() => stroke.evaluate((path) => getComputedStyle(path).opacity)).toBe('0')
    await context.close()
  })
})

test.describe('footer (plan 4 §7)', () => {
  test('links keep their plain accessible names', async ({ page }) => {
    await page.goto('/')
    const footer = page.locator('footer')
    await expect(footer.getByRole('link', { name: 'Reserve', exact: true })).toHaveCount(1)
    await expect(footer.getByRole('link', { name: 'Font license', exact: true })).toHaveCount(1)
    await expect(footer.getByRole('link', { name: 'Back to top', exact: true })).toHaveCount(1)
  })

  test('Back to top flies the page up and lands focus on the home link', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === 'webkit', 'WebKit does not focus a link on click')
    await page.goto('/')
    const button = page.locator('footer').getByRole('link', { name: 'Back to top', exact: true })
    await button.scrollIntoViewIfNeeded()
    await button.hover()
    await button.click()
    await expect(page.locator('.back-to-top-flight')).toHaveCount(1)
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 4000 }).toBe(0)
    await expect(page.locator('header [data-home-link]')).toBeFocused()
    await expect(page.locator('.back-to-top-flight')).toHaveCount(0)
  })

  test('a wheel turn cancels the flight where it is', async ({ page, hasTouch }) => {
    test.skip(hasTouch, 'wheel only')
    await page.goto('/')
    const button = page.locator('footer').getByRole('link', { name: 'Back to top', exact: true })
    await button.scrollIntoViewIfNeeded()
    await button.hover()
    await button.click()
    await expect(page.locator('.back-to-top-flight')).toHaveCount(1)
    await page.mouse.wheel(0, 10)
    await expect(page.locator('.back-to-top-flight')).toHaveCount(0)
    const scrollY = await page.evaluate(() => window.scrollY)
    expect(scrollY).toBeGreaterThan(200)
  })

  test('the rocket anchor is centred enough to form at the end of the page', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() =>
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
    )
    // The natural settle of settleAmount (plateau 1.6 over 0.9 viewport heights, smoothstep),
    // without the end-of-page rule that tops the last anchor up to 1 in the canvas
    await expect
      .poll(() =>
        page.evaluate(() => {
          const rect = document.querySelector('[data-particles="rocket"]')?.getBoundingClientRect()
          if (!rect) return 0
          const offset = Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2)
          const distance = offset / (window.innerHeight * 0.9)
          const closeness = Math.min(1, Math.max(0, (1 - distance) * 1.6))
          return closeness * closeness * (3 - 2 * closeness)
        }),
      )
      .toBeGreaterThanOrEqual(0.95)
  })

  test('without JavaScript Back to top is a plain jump to the top', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('/')
    const button = page.locator('footer').getByRole('link', { name: 'Back to top', exact: true })
    await button.scrollIntoViewIfNeeded()
    await button.click()
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
    await context.close()
  })
})

test.describe('runaway letters (plan 4 §1)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'timer driven, one engine is enough')

  test('an escape leaves every block’s text and box unchanged', async ({ page }) => {
    test.slow()
    await page.clock.install()
    await page.goto('/')
    // Layout boxes (offset*), not client rects: the reveal transforms on cards below the fold
    // move their client rects without touching the layout
    const snapshot = () =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLElement>('main h1, main h2, main p'), (block) =>
          [
            block.textContent,
            block.offsetTop,
            block.offsetLeft,
            block.offsetWidth,
            block.offsetHeight,
          ].join('|'),
        ),
      )
    // The letters are a lazy chunk: let it mount before the fake clock moves
    await expect(page.locator('.runaway-letters')).toBeAttached()
    await page.evaluate(() => document.fonts.ready)
    // The eyebrow's decode overlay doubles its text while it runs: snapshot after it is done
    await page.clock.runFor(1000)
    await expect(page.locator('[data-decoding]')).toHaveCount(0)
    const before = await snapshot()
    await page.clock.runFor(4500)
    await expect(page.locator('.runaway-letters__letter').first()).toBeAttached({ timeout: 2000 })
    expect(
      await page.evaluate(
        () =>
          (CSS.highlights as unknown as Map<string, { size: number }>).get('runaway-letters')
            ?.size ?? 0,
      ),
    ).toBeGreaterThan(0)
    expect(await snapshot()).toEqual(before)
    await page.clock.runFor(5000)
    await expect(page.locator('.runaway-letters__letter')).toHaveCount(0)
    expect(
      await page.evaluate(
        () =>
          (CSS.highlights as unknown as Map<string, { size: number }>).get('runaway-letters')
            ?.size ?? 0,
      ),
    ).toBe(0)
    expect(await snapshot()).toEqual(before)
  })

  test('never load at calm, in high contrast or with the readable font', async ({ page }) => {
    for (const settings of [{ motion: 'calm' }, { contrast: 'high' }, { font: true }]) {
      await storeSettings(page, settings)
      await page.goto('/')
      await page.waitForTimeout(300)
      await expect(page.locator('.runaway-letters')).toHaveCount(0)
    }
  })
})
