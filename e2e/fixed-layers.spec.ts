import { expect, test, type Page } from '@playwright/test'

// Plan 11 §2 and §10: WebKit 18 makes every size container the containing block of its
// `position: fixed` descendants. Chromium does not, so the guard adds the layout containment
// that WebKit 18 implies to every container and checks that no fixed layer moves.

type Rects = Record<string, { top: number; height: number } | null>

const layers = {
  // The handle, not the panel root: the root grows when the controls mount on idle
  handle: '.a11y-panel__handle',
  flag: 'a[class~="project-details-tab"]',
  pip: '.mascot',
  cta: '[data-sticky-cta]',
  canvas: '.backdrop canvas',
}

function readRects(page: Page) {
  return page.evaluate((selectors) => {
    const rects: Rects = {}
    for (const [name, selector] of Object.entries(selectors)) {
      const element = document.querySelector(selector)
      const box = element?.getBoundingClientRect()
      rects[name] = box ? { top: Math.round(box.top), height: Math.round(box.height) } : null
    }
    return rects
  }, layers)
}

function containLikeWebKit18(page: Page, isOn: boolean) {
  return page.evaluate((on) => {
    for (const element of Array.from(document.querySelectorAll<HTMLElement>('body, body *'))) {
      if (on && getComputedStyle(element).containerType !== 'normal') {
        element.style.contain = 'layout'
        element.dataset.webkit18 = ''
      } else if (!on && 'webkit18' in element.dataset) {
        element.style.removeProperty('contain')
        delete element.dataset.webkit18
      }
    }
  }, isOn)
}

async function scrollToShare(page: Page, share: number) {
  await page.evaluate(async (part) => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo({ top: Math.round(max * part), behavior: 'instant' })
    for (let frame = 0; frame < 3; frame += 1) {
      await new Promise((resolve) => requestAnimationFrame(resolve))
    }
  }, share)
}

test('fixed layers keep their window position inside a WebKit 18 container', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'the containment is simulated in Chromium')
  await page.setViewportSize({ width: 820, height: 1180 })
  await page.goto('/')
  await page.locator('.backdrop canvas').waitFor({ state: 'attached' })

  for (const share of [0, 0.5, 1]) {
    await scrollToShare(page, share)
    const expected = await readRects(page)
    await containLikeWebKit18(page, true)
    await scrollToShare(page, share)
    const contained = await readRects(page)
    await containLikeWebKit18(page, false)
    for (const [name, rect] of Object.entries(expected)) {
      const moved = contained[name]
      const where = `${name} at ${share * 100} % of the page`
      expect(moved === null, where).toBe(rect === null)
      if (!rect || !moved) continue
      // A pixel of rounding is not a containing block
      expect(Math.abs(moved.top - rect.top), where).toBeLessThanOrEqual(1)
      expect(Math.abs(moved.height - rect.height), where).toBeLessThanOrEqual(1)
    }
  }
})
