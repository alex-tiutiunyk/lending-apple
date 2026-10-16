import { expect, test, type Page } from '@playwright/test'

// Plan 9: the bitten mark and the mesh header

const storeSettings = (page: Page, settings: Record<string, unknown>) =>
  page.addInitScript(
    (value) => window.localStorage.setItem('concept-18-a11y', JSON.stringify({ v: 1, ...value })),
    settings,
  )

/** The body path of every mark on the page that is in the DOM now. */
const bodyPaths = (page: Page) =>
  page.$$eval(
    '.living-mark__body .living-mark__fill path, .phone-render__mark path:first-child',
    (paths) => paths.map((path) => path.getAttribute('d') ?? ''),
  )

test.describe('the mark is bitten at rest (plan 9 §1)', () => {
  for (const setting of [{}, { motion: 'off' }]) {
    test(`header, footer and render marks have the bite ${JSON.stringify(setting)}`, async ({
      page,
    }) => {
      await storeSettings(page, setting)
      await page.goto('/')
      await page.locator('footer').scrollIntoViewIfNeeded()
      await expect(page.locator('.living-mark__body')).toHaveCount(2)
      const paths = await bodyPaths(page)
      expect(paths.length).toBeGreaterThanOrEqual(3)
      for (const d of paths) expect(d).toMatch(/ A\d/)
    })
  }

  test('forced colours keep the bite', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await page.goto('/')
    const header = await page.$eval('[data-home-link] .living-mark__fill path', (path) =>
      path.getAttribute('d'),
    )
    expect(header).toMatch(/ A\d/)
  })

  test('the football is the bitten mark', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() =>
      document.getElementById('finishes')?.scrollIntoView({ block: 'center', behavior: 'instant' }),
    )
    const ball = page.locator('.finishes-team__ball path').first()
    await expect(ball).toBeAttached({ timeout: 10_000 })
    expect(await ball.getAttribute('d')).toMatch(/ A\d/)
  })
})

test.describe('the hover bites the left side (plan 9 §2)', () => {
  // A point of the 24-unit grid is apple when the body path fills it and no chomp that has scaled
  // in covers it; the leaf is a separate piece and the breathing and lean are transforms on the
  // roots, so the geometry does not see them
  const asymmetry = (page: Page) =>
    page.evaluate(() => {
      const host = document.querySelector('[data-home-link]') as HTMLElement
      const body = host.querySelector('.living-mark__fill path') as SVGPathElement
      const chomps = Array.from(host.querySelectorAll('.apple-bite__chomp'), (chomp) => ({
        cx: Number(chomp.getAttribute('cx')),
        cy: Number(chomp.getAttribute('cy')),
        r: Number(chomp.getAttribute('r')),
        isIn: new DOMMatrix(getComputedStyle(chomp).transform).a > 0.5,
      }))
      const isApple = (x: number, y: number) =>
        body.isPointInFill(new DOMPoint(x, y)) &&
        !chomps.some((chomp) => chomp.isIn && Math.hypot(x - chomp.cx, y - chomp.cy) < chomp.r)
      let apple = 0
      let mismatches = 0
      for (let x = 0.125; x < 12; x += 0.25) {
        for (let y = 0.125; y < 24; y += 0.25) {
          const left = isApple(x, y)
          if (left) apple += 1
          if (left !== isApple(24 - x, y)) mismatches += 1
        }
      }
      return { apple, mismatches, left: chomps.every((chomp) => chomp.cx < 12) }
    })

  test('at rest only the right is bitten; after the hover both sides are', async ({
    page,
    hasTouch,
  }) => {
    test.skip(hasTouch, 'no hover on touch screens')
    await page.goto('/')
    const before = await asymmetry(page)
    expect(before.left).toBe(true)
    // The right bite alone: about π · 4.2² / 2 of the notch, a few dozen grid points
    expect(before.mismatches).toBeGreaterThan(20)
    await page.hover('[data-home-link]')
    await expect
      .poll(async () => (await asymmetry(page)).mismatches, { timeout: 5000 })
      .toBeLessThanOrEqual(2)
    expect((await asymmetry(page)).apple).toBeGreaterThan(500)
  })

  test('at off the hover snaps to the symmetric apple', async ({ page, hasTouch }) => {
    test.skip(hasTouch, 'no hover on touch screens')
    await storeSettings(page, { motion: 'off' })
    await page.goto('/')
    await page.hover('[data-home-link]')
    await page.waitForTimeout(100)
    expect((await asymmetry(page)).mismatches).toBeLessThanOrEqual(2)
  })
})

test.describe('header mesh (plan 9 §3)', () => {
  const blobAnimations = (page: Page) =>
    page.$$eval('header [class*="header__blob"]', (blobs) =>
      blobs.flatMap((blob) =>
        blob.getAnimations().map((animation) => {
          const effect = animation.effect as KeyframeEffect | null
          const properties = (effect?.getKeyframes() ?? []).flatMap((frame) =>
            Object.keys(frame).filter(
              (key) => !['offset', 'easing', 'composite', 'computedOffset'].includes(key),
            ),
          )
          return { state: animation.playState, properties: [...new Set(properties)] }
        }),
      ),
    )

  test('four blobs drift on transform at full', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('header [class*="header__blob"]')).toHaveCount(4)
    await expect.poll(async () => (await blobAnimations(page)).length).toBe(4)
    for (const { state, properties } of await blobAnimations(page)) {
      expect(state).toBe('running')
      expect(properties).toEqual(['transform'])
    }
  })

  for (const motion of ['calm', 'off']) {
    test(`stands still at ${motion}, and the blobs still show`, async ({ page }) => {
      await storeSettings(page, { motion })
      await page.goto('/')
      await page.waitForTimeout(300)
      expect(await blobAnimations(page)).toEqual([])
      await expect(page.locator('header [class*="header__mesh"]')).toBeVisible()
    })
  }

  test('high contrast shows the flat bar; nothing fetches the old paint', async ({ page }) => {
    const paint: string[] = []
    page.on('request', (request) => {
      if (/paint-[abc].*\.svg/.test(request.url())) paint.push(request.url())
    })
    await storeSettings(page, { contrast: 'high' })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('header [class*="header__mesh"]')).toBeHidden()
    expect(paint).toEqual([])
  })
})
