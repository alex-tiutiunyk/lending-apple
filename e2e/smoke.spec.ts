import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const sectionIds = ['design', 'inside', 'numbers', 'finishes', 'reserve']

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('has one h1, landmarks and no axe violations', async ({ page }) => {
  await expect(page.locator('h1')).toHaveCount(1)
  await expect(page.locator('header')).toHaveCount(1)
  await expect(page.locator('main')).toHaveCount(1)
  await expect(page.locator('footer')).toHaveCount(1)

  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations.map(({ id, nodes }) => `${id} (${nodes.length})`)).toEqual([])
})

test('scrolls through every section without overflow or errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })

  for (const id of sectionIds) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded()
    await expect(page.locator(`#${id} h2`)).toBeVisible()
  }

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
  expect(errors).toEqual([])
})

test('pinned sections expose scroll progress', async ({ page }) => {
  const progress = await page.evaluate(async () => {
    const section = document.getElementById('design')
    if (!section) return null
    window.scrollTo(0, section.offsetTop + (section.offsetHeight - window.innerHeight) / 2)
    await new Promise((resolve) => setTimeout(resolve, 300))
    return Number(section.style.getPropertyValue('--p'))
  })
  expect(progress).toBeGreaterThan(0.3)
  expect(progress).toBeLessThan(0.7)
})

test('reads final stat values to assistive tech', async ({ page }) => {
  const numbers = page.locator('#numbers')
  await numbers.scrollIntoViewIfNeeded()
  await expect(numbers.getByText('3,000 nits', { exact: true })).toHaveCount(1)
  await expect(numbers.getByText('187 g', { exact: true })).toHaveCount(1)
})

test('finish picker retints the page', async ({ page }) => {
  await page.locator('#finishes').scrollIntoViewIfNeeded()
  await page.getByRole('radio', { name: /Ember/ }).check()
  await expect(page.getByRole('img', { name: 'Back of the phone in Ember' })).toBeVisible()
  const hue = await page.evaluate(() =>
    document.documentElement.style.getPropertyValue('--accent-h'),
  )
  expect(hue).toBe('18')
})

test('reserve form validates, blocks double submit and confirms', async ({ page }) => {
  const form = page.locator('#reserve form')
  await form.scrollIntoViewIfNeeded()
  const email = page.getByLabel('Email address')
  const submit = form.getByRole('button', { name: 'Reserve' })

  await submit.click()
  await expect(page.getByText('Enter your email address to reserve.')).toBeVisible()
  await expect(email).toBeFocused()
  await expect(email).toHaveAttribute('aria-describedby', /reserve-error/)

  await email.fill('not-an-address')
  await submit.click()
  await expect(page.getByText(/does not look like an email address/)).toBeVisible()

  await email.fill('reader@mail.test')
  await submit.click()
  await expect(form.getByRole('button', { name: 'Reserving…' })).toBeDisabled()
  const status = page.getByRole('status')
  await expect(status).toContainText('You are on the list.')
  await expect(status).toBeFocused()
})

test('keyboard reaches the form from the skip link', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit skips links on Tab unless the user turns it on')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('main')).toBeFocused()
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('shows pinned sections in their final state, in normal flow', async ({ page }) => {
    const stagePosition = await page
      .locator('#inside [data-stage]')
      .evaluate((stage) => getComputedStyle(stage).position)
    expect(stagePosition).toBe('static')
    await expect(page.locator('canvas')).toHaveCount(0)
    const progress = await page
      .locator('#design')
      .evaluate((section) => section.style.getPropertyValue('--p'))
    expect(progress).toBe('1')
  })
})
