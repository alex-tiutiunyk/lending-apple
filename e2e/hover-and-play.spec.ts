import { expect, test, type Page } from '@playwright/test'

const storageKey = 'concept-18-a11y'

async function storeSettings(page: Page, settings: Record<string, unknown>) {
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(String(key), String(value)),
    [storageKey, JSON.stringify({ v: 1, ...settings })],
  )
}

const handle = (page: Page) => page.getByRole('button', { name: 'Accessibility settings' })

/** Running animations and transitions whose target sits inside `selector`. */
function runningInside(page: Page, selector: string) {
  return page.evaluate((within) => {
    const host = document.querySelector(within)
    return document
      .getAnimations()
      .filter((animation) => animation.playState === 'running')
      .filter((animation) => {
        const target = (animation.effect as KeyframeEffect | null)?.target
        return !!host && !!target && host.contains(target)
      }).length
  }, selector)
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

test.describe('panel handle: the accessibility glyph (plan 7 §3)', () => {
  const armTurn = (page: Page) =>
    page
      .locator('.a11y-panel__arm-right')
      .evaluate((arm) =>
        Math.round(
          (Math.atan2(
            new DOMMatrix(getComputedStyle(arm).transform).b,
            new DOMMatrix(getComputedStyle(arm).transform).a,
          ) *
            180) /
            Math.PI,
        ),
      )

  test('keeps its name; the glyph is back, a ring and a figure, at rest', async ({ page }) => {
    await page.goto('/')
    await expect(handle(page)).toBeVisible()
    await expect(handle(page).locator('.a11y-panel__ring')).toHaveCount(1)
    await expect(handle(page).locator('.a11y-panel__figure path')).toHaveCount(5)
    expect(await armTurn(page)).toBe(0)
  })

  test('hover raises the arms, the open panel holds the pose, closing lets go', async ({
    page,
    hasTouch,
  }) => {
    test.skip(hasTouch, 'no hover on touch screens')
    await page.goto('/')
    await handle(page).hover()
    await expect.poll(() => armTurn(page), { timeout: 3000 }).toBe(-35)
    await handle(page).click()
    await page.mouse.move(700, 400)
    await page.waitForTimeout(500)
    expect(await armTurn(page)).toBe(-35)
    await handle(page).click()
    await page.mouse.move(700, 400)
    await expect.poll(() => armTurn(page), { timeout: 3000 }).toBe(0)
  })

  test('off snaps to the pose without running animations', async ({ page, hasTouch }) => {
    test.skip(hasTouch, 'no hover on touch screens')
    await storeSettings(page, { motion: 'off' })
    await page.goto('/')
    await handle(page).hover()
    await page.waitForTimeout(200)
    expect(await runningInside(page, '.a11y-panel__handle')).toBe(0)
    expect(await armTurn(page)).toBe(-35)
  })
})

test.describe('section nav: hopping letters (plan 5 §2)', () => {
  test('the measured text box is the same before and after a hover; names stay plain', async ({
    page,
    hasTouch,
  }) => {
    test.skip(hasTouch, 'the nav is hidden on phones and there is no hover')
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'Sections' })
    await expect(nav.getByRole('link', { name: 'Inside' })).toBeVisible()
    const text = nav.locator('[data-nav-text]').nth(1)
    const measure = () =>
      text.evaluate((span) => {
        const { x, width, height } = span.getBoundingClientRect()
        return [Math.round(x), Math.round(width), Math.round(height)]
      })
    const before = await measure()
    await text.hover()
    await page.waitForTimeout(600)
    expect(await measure()).toEqual(before)
    await page.mouse.move(10, 300)
    await page.waitForTimeout(500)
    expect(await measure()).toEqual(before)
  })
})

test.describe('hero secondary link draws its own outline (plan 5 §3)', () => {
  test('keeps its name and target; at off a hover runs nothing', async ({ page, hasTouch }) => {
    await storeSettings(page, { motion: 'off' })
    await page.goto('/')
    const link = page.getByRole('link', { name: 'See how it is built' })
    await expect(link).toHaveAttribute('href', '#design')
    test.skip(hasTouch, 'no hover on touch screens')
    await link.hover()
    await page.waitForTimeout(250)
    expect(await runningInside(page, '.hero__secondary')).toBe(0)
  })
})

test.describe('numbers footnotes show their numbers (plan 5 §4)', () => {
  test('the list is numbered and the refs still jump to the notes', async ({ page }) => {
    await page.goto('/')
    const list = page.locator('.numbers__footnotes')
    await list.scrollIntoViewIfNeeded()
    const style = await list.evaluate((ol) => ({
      type: getComputedStyle(ol).listStyleType,
      padding: parseFloat(getComputedStyle(ol).paddingLeft),
    }))
    expect(style.type).toBe('decimal')
    expect(style.padding).toBeGreaterThan(16)
    await expect(list.getByRole('listitem')).toHaveCount(2)
    const ref = page.getByRole('link', { name: 'Note 2' }).first()
    const target = await ref.getAttribute('href')
    await ref.click()
    await expect(page).toHaveURL(new RegExp(`${target?.replace(/[:]/g, '\\$&')}$`))
  })
})

test.describe('footer edge: a living line (plan 5 §7)', () => {
  test('moves only while the footer is in view at full, and is still at calm and off', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page.locator('.footer__edge')).toBeAttached()
    expect(await runningInside(page, '.footer__edge')).toBe(0)
    await page.evaluate(() =>
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
    )
    await expect.poll(() => runningInside(page, '.footer__edge')).toBeGreaterThan(0)
  })

  for (const motion of ['calm', 'off']) {
    test(`is the static wave at ${motion}`, async ({ page }) => {
      await storeSettings(page, { motion })
      await page.goto('/')
      await page.evaluate(() =>
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
      )
      await page.waitForTimeout(400)
      await expect(page.locator('.footer__edge')).toBeVisible()
      expect(await runningInside(page, '.footer__edge')).toBe(0)
    })
  }
})

test.describe('finishes: a hover previews on the render only (plan 5 §10)', () => {
  test('the render carries the hovered finish, the page does not, and a leave clears it', async ({
    page,
    hasTouch,
  }) => {
    test.skip(hasTouch, 'no hover on touch screens')
    await page.goto('/')
    const render = page.getByRole('img', { name: /Back of the phone/ })
    await render.scrollIntoViewIfNeeded()
    const shellColor = () =>
      render.evaluate((svg) => {
        const stop = svg.querySelector('.phone-render__shell-mid')
        return stop ? getComputedStyle(stop).stopColor : 'missing'
      })
    const before = await shellColor()
    await page.locator('.finishes__option').nth(1).hover()
    await expect(render).toHaveAttribute('data-preview', '')
    expect(await render.evaluate((svg) => svg.style.getPropertyValue('--accent-h'))).toBe('18')
    await expect.poll(shellColor).not.toBe(before)
    expect(
      await page.evaluate(() => document.documentElement.style.getPropertyValue('--accent-h')),
    ).toBe('')
    await page.mouse.move(10, 10)
    await expect(render).not.toHaveAttribute('data-preview', /.*/)
    expect(await render.evaluate((svg) => svg.style.getPropertyValue('--accent-h'))).toBe('')
  })
})

test.describe('numbers: the stats move (plan 5 §12)', () => {
  test('a hover replay keeps the readable values; at off nothing runs', async ({
    page,
    hasTouch,
  }) => {
    test.skip(hasTouch, 'no hover on touch screens')
    await page.goto('/')
    const numbers = page.locator('#numbers')
    await numbers.scrollIntoViewIfNeeded()
    const stat = page.locator('[data-stat]').first()
    await expect(numbers.getByText('2 nm', { exact: true })).toHaveCount(1)
    await stat.hover()
    await page.waitForTimeout(200)
    await expect(numbers.getByText('2 nm', { exact: true })).toHaveCount(1)
    await expect(stat.locator('.slot-number__strip').first()).toHaveAttribute(
      'style',
      /--reel: 2\.000/,
      { timeout: 4000 },
    )
  })

  test('at off a hover replays nothing', async ({ page, hasTouch }) => {
    test.skip(hasTouch, 'no hover on touch screens')
    await storeSettings(page, { motion: 'off' })
    await page.goto('/')
    const stat = page.locator('[data-stat]').first()
    await stat.scrollIntoViewIfNeeded()
    await stat.hover()
    await page.waitForTimeout(250)
    expect(await runningInside(page, '#numbers')).toBe(0)
  })
})

test.describe('exploded view stays inside its stage (plan 5 §13)', () => {
  const viewports = [
    { width: 1280, height: 620 },
    { width: 1280, height: 800 },
    { width: 390, height: 844 },
  ]

  for (const viewport of viewports) {
    test(`${viewport.width} × ${viewport.height}: nothing leaves the stage box`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport)
      await page.goto('/')
      for (const share of [0, 0.25, 0.5, 0.75, 1]) {
        await scrollToShare(page, 'inside', share)
        const report = await page.evaluate(() => {
          const stage = document.querySelector('#inside [data-stage]')
          const header = document.querySelector('header')
          const title = stage?.querySelector('h2')
          if (!stage || !header || !title)
            return { outside: ['missing'], titleTop: 0, headerBottom: 0 }
          const box = stage.getBoundingClientRect()
          const outside: string[] = []
          for (const element of Array.from(stage.querySelectorAll('h2, p, li, span'))) {
            const rect = element.getBoundingClientRect()
            if (rect.width === 0 && rect.height === 0) continue
            if (
              rect.top < box.top - 1 ||
              rect.bottom > box.bottom + 1 ||
              rect.left < box.left - 1 ||
              rect.right > box.right + 1
            ) {
              outside.push(`${element.tagName}: ${element.textContent?.slice(0, 30)}`)
            }
          }
          return {
            outside,
            titleTop: title.getBoundingClientRect().top,
            headerBottom: header.getBoundingClientRect().bottom,
          }
        })
        expect(report.outside, `at share ${share}`).toEqual([])
        if (share === 0) {
          expect(report.titleTop).toBeGreaterThanOrEqual(report.headerBottom - 1)
        }
      }
    })
  }
})
