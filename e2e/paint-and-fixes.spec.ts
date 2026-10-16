import { expect, test, type Page } from '@playwright/test'

// Plan 8: paint and fixes

const nextFrames = async (page: Page) => {
  await page.waitForFunction(() => new Promise((resolve) => requestAnimationFrame(resolve)))
  await page.waitForFunction(() => new Promise((resolve) => requestAnimationFrame(resolve)))
}

test.describe('line draw (plan 8 §4)', () => {
  test('nothing of the outline shows before its scroll range', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      const section = document.getElementById('design')
      if (!section) return
      const top = section.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top: top - 300, behavior: 'instant' })
    })
    // Only the outline is visible: the backdrop, the particles and the colour render move or
    // paint on their own and would differ between the two shots
    await page.addStyleTag({
      content: `body * { visibility: hidden !important }
        #design .phone-outline, #design .phone-outline * { visibility: visible !important }`,
    })
    await nextFrames(page)
    const outline = page.locator('#design .phone-outline')
    const drawn = await outline.screenshot()
    await page.addStyleTag({
      content: '#design .phone-outline * { visibility: hidden !important }',
    })
    await nextFrames(page)
    const empty = await outline.screenshot()
    expect(drawn.equals(empty)).toBe(true)
  })
})

test.describe('mini Pips (plan 8 §5, §6)', () => {
  const team = (page: Page) => page.locator('[data-mini-pip]')

  async function showTeam(page: Page) {
    await page.clock.install()
    await page.goto('/')
    await page.evaluate(() =>
      document.querySelector('#finishes')?.scrollIntoView({ block: 'center', behavior: 'instant' }),
    )
    await expect(team(page)).toHaveCount(4)
    // The section is taller than a phone screen, and the chunks above it settle late: bring the
    // team's own frame into view until its game has started
    await expect
      .poll(async () => {
        await page.evaluate(() =>
          document
            .querySelector('.finishes-team')
            ?.scrollIntoView({ block: 'center', behavior: 'instant' }),
        )
        await page.clock.runFor(100)
        return page.locator('.finishes-team').getAttribute('data-phase')
      })
      .not.toBeNull()
    await page.clock.runFor(1200)
  }

  test('a lap Pip on the top has its feet below its head', async ({ page }) => {
    await showTeam(page)
    const onTop = await page.locator('.finishes-team').evaluate((root) => {
      const frame = root.getBoundingClientRect()
      const centreY = (element: Element | null) => {
        const box = element?.getBoundingClientRect()
        return box ? box.top + box.height / 2 : NaN
      }
      return Array.from(root.querySelectorAll('[data-mini-pip]'))
        .filter((pip) => centreY(pip) < frame.top + frame.height * 0.2)
        .map((pip) => ({
          legs: centreY(pip.querySelector('[class*="leg-left"] path')),
          body: centreY(pip.querySelector('[class*="shell"]')),
        }))
    })
    expect(onTop.length).toBeGreaterThan(0)
    onTop.forEach(({ legs, body }) => expect(legs).toBeGreaterThan(body))
  })

  test('after the header nobody runs and nobody moves', async ({ page }) => {
    test.slow()
    await showTeam(page)
    const phase = () => page.locator('.finishes-team').getAttribute('data-phase')
    for (let step = 0; step < 80 && (await phase()) !== 'flight'; step += 1) {
      await page.clock.runFor(250)
    }
    expect(await phase()).toBe('flight')
    const steps = () =>
      page.evaluate(
        () =>
          document
            .getAnimations()
            .filter(
              (animation) =>
                animation instanceof CSSAnimation && animation.animationName.endsWith('mini-step'),
            ).length,
      )
    const transforms = () =>
      team(page).evaluateAll((pips) => pips.map((pip) => (pip as HTMLElement).style.transform))
    expect(await steps()).toBe(0)
    const before = await transforms()
    await page.clock.runFor(200)
    expect(await transforms()).toEqual(before)
    expect(await steps()).toBe(0)
  })
})

test.describe('runaway letter legs (plan 8 §2)', () => {
  test('the legs start at the bottom of the ink, not of the box', async ({ page }) => {
    test.slow()
    await page.clock.install()
    await page.goto('/')
    await expect(page.locator('.runaway-letters')).toBeAttached()
    await page.evaluate(() => document.fonts.ready)
    await page.clock.runFor(5500)
    await expect(page.locator('.runaway-letters__letter').first()).toBeAttached({ timeout: 2000 })
    // Computed lengths, not rects or offsets: the copy turns while it runs, and offsets round to
    // whole pixels. Read in one go, from a copy still out (a fast one may go home, and a
    // detached one has no style)
    const measure = () =>
      page.evaluate(() => {
        const copy = document.querySelector<HTMLElement>(
          '.runaway-letters__letter:not([data-phase="done"])',
        )
        const leg = copy?.querySelector<HTMLElement>('.runaway-letters__leg')
        if (!copy?.isConnected || !leg) return null
        const style = getComputedStyle(copy)
        const em = parseFloat(style.fontSize)
        const lift = parseFloat(style.getPropertyValue('--leg-lift'))
        const top = parseFloat(getComputedStyle(leg).top)
        const font = `${copy.style.fontStyle} ${copy.style.fontWeight} ${copy.style.fontSize} ${copy.style.fontFamily}`
        return { gap: top - (parseFloat(style.height) - lift), em, lift, font }
      })
    let measured: Awaited<ReturnType<typeof measure>> = null
    await expect.poll(async () => (measured = await measure())).not.toBeNull()
    const { gap, em, lift } = measured ?? { gap: NaN, em: NaN, lift: NaN }
    expect(lift, JSON.stringify(measured)).toBeGreaterThan(0)
    expect(Math.abs(gap)).toBeLessThanOrEqual(0.06 * em)
  })
})

test.describe('accessibility panel handle (plan 8 §3)', () => {
  const handle = (page: Page) => page.getByRole('button', { name: 'Accessibility settings' })
  const box = (page: Page, selector = '') =>
    handle(page).evaluate((button, inner) => {
      const target = inner ? button.querySelector(inner) : button
      const rect = target?.getBoundingClientRect()
      return { width: rect?.width ?? 0, height: rect?.height ?? 0, left: rect?.left ?? 0 }
    }, selector)

  test('is 1.75 times larger and still at the left edge when closed', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    const desktop = await box(page)
    expect(desktop.width).toBeCloseTo(77, 0)
    expect(desktop.height).toBeCloseTo(77, 0)
    expect(desktop.left).toBeLessThanOrEqual(0)
    expect((await box(page, 'svg')).width).toBeCloseTo(42, 0)
    await page.setViewportSize({ width: 390, height: 844 })
    const phone = await box(page)
    expect(phone.width).toBeCloseTo(49, 0)
    expect(phone.height).toBeCloseTo(77, 0)
  })

  test('the open panel fits a 320 px window', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto('/')
    await handle(page).click()
    const panel = page.locator('#a11y-panel')
    await expect(panel).toBeVisible()
    await page.waitForTimeout(400)
    const right = await page.evaluate(() => {
      const root = document.querySelector('#a11y-panel')?.closest('[data-state]')
      return root
        ? Math.max(...Array.from(root.children, (child) => child.getBoundingClientRect().right))
        : 0
    })
    expect(right).toBeLessThanOrEqual(320)
  })
})

test.describe('header pause toggle (plan 8 §8)', () => {
  test('draws 36 px with a 44 px tap area; the footer toggle stays 44 px', async ({ page }) => {
    await page.goto('/')
    const toggle = page.locator('header').getByRole('button', { name: 'Pause motion' })
    const result = await toggle.evaluate((button) => {
      const rect = button.getBoundingClientRect()
      const hit = document.elementFromPoint(rect.left - 3, rect.top + rect.height / 2)
      return {
        width: rect.width,
        height: rect.height,
        hits: hit === button || button.contains(hit),
      }
    })
    expect(result.width).toBeCloseTo(36, 0)
    expect(result.height).toBeCloseTo(36, 0)
    expect(result.hits).toBe(true)
    const footer = page.locator('footer').getByRole('button', { name: 'Pause motion' })
    await footer.scrollIntoViewIfNeeded()
    const footerHeight = await footer.evaluate((button) => button.getBoundingClientRect().height)
    expect(footerHeight).toBeCloseTo(44, 0)
  })
})

test.describe('brand mark bite (plan 8 §7)', () => {
  const chompScales = (page: Page) =>
    page.$$eval('[data-home-link] .apple-bite__chomp', (chomps) =>
      chomps.map((chomp) => Math.round(new DOMMatrix(getComputedStyle(chomp).transform).a)),
    )

  test('the five chomps are in after about 1.9 s, not before 1 s', async ({ page, hasTouch }) => {
    test.skip(hasTouch, 'no hover on touch screens')
    await page.goto('/')
    await page.hover('[data-home-link]')
    await page.waitForTimeout(400)
    expect(await chompScales(page)).toEqual([0, 0, 0, 0, 0])
    await page.waitForTimeout(1600)
    expect(await chompScales(page)).toEqual([1, 1, 1, 1, 1])
  })

  test('at off a hover snaps to the bitten mark', async ({ page, hasTouch }) => {
    test.skip(hasTouch, 'no hover on touch screens')
    await page.addInitScript(() =>
      window.localStorage.setItem('concept-18-a11y', JSON.stringify({ v: 1, motion: 'off' })),
    )
    await page.goto('/')
    await page.hover('[data-home-link]')
    await page.waitForTimeout(100)
    expect(await chompScales(page)).toEqual([1, 1, 1, 1, 1])
  })
})

// The plan 8 §1 paint became the plan 9 §3 mesh; its tests are in bitten-mark-and-mesh
