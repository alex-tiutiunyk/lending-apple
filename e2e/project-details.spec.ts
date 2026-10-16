import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// Plan 10: the project details tab, the footer link and the lightbox with the README

const readmeUrl = 'https://github.com/alex-tiutiunyk/lending-apple/blob/main/README.md'
const settingsKey = 'concept-18-a11y'

const tab = (page: Page) => page.locator('a[class~="project-details-tab"]')
const footerLink = (page: Page) =>
  page.locator('footer').getByRole('link', { name: 'About this project' })
const dialog = (page: Page) => page.locator('dialog[class~="project-details-dialog"]')

async function storeSettings(page: Page, settings: Record<string, unknown>) {
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(String(key), String(value)),
    [settingsKey, JSON.stringify({ v: 1, ...settings })],
  )
}

async function openFromTab(page: Page) {
  await page.goto('/')
  await tab(page).click()
  await expect(dialog(page)).toBeVisible()
  await expect(dialog(page).getByRole('heading', { level: 3 }).first()).toBeVisible()
}

test.describe('project details', () => {
  test('the tab and the footer link are links to the README in the prerendered HTML', async ({
    request,
  }) => {
    const html = await (await request.get('/')).text()
    const links = html.match(new RegExp(`href="${readmeUrl}"`, 'g')) ?? []
    expect(links).toHaveLength(2)
  })

  test('the tab opens a modal dialog with the README, without images', async ({ page }) => {
    await openFromTab(page)
    expect(page.url()).not.toContain('github.com')
    expect(await dialog(page).evaluate((element) => element.matches(':modal'))).toBe(true)
    await expect(dialog(page).getByRole('heading', { level: 2 })).toBeFocused()
    await expect(dialog(page).getByRole('heading', { name: 'Tech stack' })).toBeVisible()
    await expect(dialog(page).getByRole('heading', { name: 'Problems solved' })).toBeVisible()
    await expect(dialog(page).getByRole('table')).toBeVisible()
    await expect(dialog(page).locator('img, picture')).toHaveCount(0)
    await expect(page.locator('html')).toHaveAttribute('data-details-open', '')
  })

  test('Escape closes it and focus goes back to the tab', async ({ page, hasTouch }) => {
    test.skip(hasTouch, 'keyboard')
    await openFromTab(page)
    await page.keyboard.press('Escape')
    await expect(dialog(page)).toBeHidden()
    await expect(tab(page)).toBeFocused()
    await expect(page.locator('html')).not.toHaveAttribute('data-details-open')
  })

  test('the close button and the backdrop close it', async ({ page }) => {
    await openFromTab(page)
    await dialog(page).getByRole('button', { name: 'Close' }).click()
    await expect(dialog(page)).toBeHidden()

    await footerLink(page).scrollIntoViewIfNeeded()
    await footerLink(page).click()
    await expect(dialog(page)).toBeVisible()
    const box = await dialog(page).boundingBox()
    const viewport = page.viewportSize()
    test.skip(!box || !viewport || box.y < 8, 'the dialog fills the screen on phones')
    await page.mouse.click(4, 4)
    await expect(dialog(page)).toBeHidden()
  })

  test('switches to Ukrainian and opens in English again', async ({ page, browserName }) => {
    const ukrainianChunks: string[] = []
    page.on('request', (request) => {
      if (/\/uk-[\w-]+\.js$/.test(request.url())) ukrainianChunks.push(request.url())
    })
    await openFromTab(page)
    expect(ukrainianChunks).toEqual([])

    const english = dialog(page).getByRole('button', { name: 'EN' })
    const ukrainian = dialog(page).getByRole('button', { name: 'УКР' })
    await expect(english).toHaveAttribute('aria-pressed', 'true')
    await ukrainian.click()
    await expect(ukrainian).toHaveAttribute('aria-pressed', 'true')
    // WebKit does not focus a clicked button
    if (browserName !== 'webkit') await expect(ukrainian).toBeFocused()
    await expect(dialog(page).getByRole('heading', { name: 'Про проєкт' })).toBeVisible()
    await expect(dialog(page).getByRole('heading', { name: 'Технології' })).toBeVisible()
    await expect(dialog(page).locator('[lang="uk"]').first()).toBeVisible()
    await expect(dialog(page).getByRole('status')).toHaveText('Українська')
    expect(ukrainianChunks).toHaveLength(1)

    await page.keyboard.press('Escape')
    await expect(dialog(page)).toBeHidden()
    await tab(page).click()
    await expect(dialog(page).getByRole('heading', { name: 'Tech stack' })).toBeVisible()
    await expect(english).toHaveAttribute('aria-pressed', 'true')
  })

  test('a modified click is left to the browser', async ({ page }) => {
    await page.goto('/')
    // The page's own handler runs first; this one records its verdict and stops the navigation
    const isPrevented = await tab(page).evaluate((link) => {
      let verdict: boolean | null = null
      const record = (event: Event) => {
        verdict = event.defaultPrevented
        event.preventDefault()
      }
      window.addEventListener('click', record, { once: true })
      link.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }),
      )
      return verdict
    })
    expect(isPrevented).toBe(false)
    await expect(dialog(page)).toHaveCount(0)
  })

  test('at off it opens and closes without animation', async ({ page }) => {
    await storeSettings(page, { motion: 'off' })
    await openFromTab(page)
    expect(await dialog(page).evaluate((element) => element.getAnimations().length)).toBe(0)
    await dialog(page).getByRole('button', { name: 'Close' }).click()
    await expect(dialog(page)).toBeHidden()
  })

  for (const settings of [
    { name: 'dark', values: {} },
    { name: 'light', values: { theme: 'light' } },
    { name: 'high contrast', values: { contrast: 'high' } },
  ]) {
    test(`passes axe in both languages, ${settings.name}`, async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'one engine is enough for axe')
      await storeSettings(page, { motion: 'off', ...settings.values })
      await openFromTab(page)
      const scan = async () => {
        const results = await new AxeBuilder({ page }).include('dialog').analyze()
        return results.violations.flatMap(({ id, nodes }) =>
          nodes.map((node) => `${id}: ${node.target.join(' ')}`),
        )
      }
      expect(await scan()).toEqual([])
      await dialog(page).getByRole('button', { name: 'УКР' }).click()
      await expect(dialog(page).getByRole('heading', { name: 'Технології' })).toBeVisible()
      expect(await scan()).toEqual([])
    })
  }
})
