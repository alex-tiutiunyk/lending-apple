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
  const design = page.locator('#design')
  await design.evaluate((section) => {
    const top = section.getBoundingClientRect().top + window.scrollY
    window.scrollTo({
      top: top + (section.getBoundingClientRect().height - window.innerHeight) / 2,
      behavior: 'instant',
    })
  })
  const readProgress = () =>
    design.evaluate((section) => Number(section.style.getPropertyValue('--p')))
  await expect.poll(readProgress).toBeGreaterThan(0.3)
  expect(await readProgress()).toBeLessThan(0.7)
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
  test.slow()
  const form = page.locator('#reserve form')
  await form.scrollIntoViewIfNeeded()
  const email = page.getByLabel('Email address')
  const submit = form.getByRole('button', { name: 'Reserve' })

  await submit.click()
  await expect(page.getByText('Enter your email address to reserve.')).toBeVisible()
  await expect(email).toBeFocused()
  await expect(email).toHaveAccessibleDescription(/Enter your email address to reserve\./)

  await email.fill('not-an-address')
  await submit.click()
  await expect(page.getByText(/does not look like an email address/)).toBeVisible()

  await email.fill('reader@mail.test')
  await submit.click()
  await expect(form.getByRole('button', { name: 'Reserving…' })).toBeDisabled()
  const status = page.locator('#reserve').getByRole('status')
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

test('pressable links keep their plain label as the accessible name', async ({ page }) => {
  const hero = page.locator('#hero')
  await expect(hero.getByRole('link', { name: 'Reserve yours', exact: true })).toHaveCount(1)
  await expect(
    page.locator('header').getByRole('link', { name: 'Reserve', exact: true }),
  ).toHaveCount(1)
})

test('pause motion toggle is pressed state and survives a reload', async ({ page }) => {
  const toggle = page.locator('footer').getByRole('button', { name: 'Pause motion' })
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'calm')
  await page.reload()
  await expect(
    page.locator('footer').getByRole('button', { name: 'Pause motion' }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(
    page.locator('header').getByRole('button', { name: 'Pause motion' }),
  ).toHaveAttribute('aria-pressed', 'true')
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('shows pinned sections in their final state, in normal flow', async ({ page }) => {
    const stagePosition = await page
      .locator('#inside [data-stage]')
      .evaluate((stage) => getComputedStyle(stage).position)
    expect(stagePosition).toBe('static')
    await expect(page.locator('canvas')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Poke Pip' })).toHaveCount(0)
    const progress = await page
      .locator('#design')
      .evaluate((section) => section.style.getPropertyValue('--p'))
    expect(progress).toBe('1')
  })
})

test.describe('mascot', () => {
  test('answers a poke once through the live region', async ({ page }) => {
    const pip = page.getByRole('complementary', { name: 'Pip, the page mascot' })
    const poke = pip.getByRole('button', { name: 'Poke Pip' })
    await poke.focus()
    await expect(pip).toHaveAttribute('data-held', '')
    await poke.press('Enter')
    await expect(pip.locator('[aria-live="polite"]')).not.toHaveText('')
    await expect(pip).toHaveAttribute('data-act', 'poked')
  })

  test('two and three quick pokes trigger their combos', async ({ page }) => {
    test.slow()
    const pip = page.getByRole('complementary', { name: 'Pip, the page mascot' })
    const poke = pip.getByRole('button', { name: 'Poke Pip' })
    const announcer = pip.locator('[aria-live="polite"]')
    const pokeTimes = (times: number) =>
      poke.evaluate((button, count) => {
        for (let poked = 0; poked < count; poked += 1) (button as HTMLButtonElement).click()
      }, times)

    await pokeTimes(2)
    await expect(announcer).toHaveText('Saved to my camera roll.')
    await expect(pip).toHaveAttribute('data-act', 'walk', { timeout: 20_000 })

    await pokeTimes(3)
    await expect(announcer).toHaveText('Everything is spinning.')
  })

  test('leaves when motion is paused', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Poke Pip' })).toHaveCount(1)
    await page.locator('header').getByRole('button', { name: 'Pause motion' }).click()
    await expect(page.getByRole('button', { name: 'Poke Pip' })).toHaveCount(0)
  })

  test('keeps off footer links at the page bottom and stays pokeable', async ({ page }) => {
    test.slow()
    await page.evaluate(() =>
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
    )
    const pip = page.getByRole('complementary', { name: 'Pip, the page mascot' })
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const mascot = document.querySelector('[data-act]')
            if (!mascot) return 'missing'
            const a = mascot.getBoundingClientRect()
            const links = Array.from(document.querySelectorAll('footer a, footer button'))
            const covered = links.some((link) => {
              const b = link.getBoundingClientRect()
              return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
            })
            return covered && !mascot.hasAttribute('data-behind') ? 'covered' : 'clear'
          }),
        { timeout: 8000 },
      )
      .toBe('clear')
    for (const link of await page.locator('footer a, footer button').all()) {
      await link.click({ trial: true })
    }
    await expect(pip).not.toHaveAttribute('data-hiding', '')
    const poke = pip.getByRole('button', { name: 'Poke Pip' })
    const center = { x: 0, y: 0 }
    await expect
      .poll(async () => {
        const box = await poke.boundingBox()
        if (!box) return false
        center.x = box.x + box.width / 2
        center.y = box.y + box.height / 2
        await page.mouse.move(center.x, center.y)
        return pip.evaluate((element) => element.hasAttribute('data-held'))
      })
      .toBe(true)
    await page.mouse.click(center.x, center.y)
    await expect(pip.locator('[aria-live="polite"]')).not.toHaveText('')
  })

  test('never covers the focused email field', async ({ page }) => {
    await page.getByLabel('Email address').focus()
    await expect
      .poll(() =>
        page.evaluate(() => {
          const pip = document.querySelector('[data-act]')
          const field = document.activeElement
          if (!pip || !field) return 'missing'
          if (pip.hasAttribute('data-hiding')) return 'clear'
          const a = pip.getBoundingClientRect()
          const b = field.getBoundingClientRect()
          const overlaps =
            a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
          return overlaps ? 'covered' : 'clear'
        }),
      )
      .toBe('clear')
  })
})

test('class names are readable BEM, without hashes', async ({ page }) => {
  const pattern = /^[a-z][a-z0-9-]*(__[a-z0-9-]+)?(--[a-z0-9-]+)?$/
  const bad = await page.evaluate((source) => {
    const valid = new RegExp(source)
    const names = new Set(
      Array.from(document.querySelectorAll('[class]')).flatMap((element) =>
        Array.from(element.classList),
      ),
    )
    return [...names].filter((name) => !valid.test(name))
  }, pattern.source)
  expect(bad).toEqual([])
})

test('the reserve button is a pressable button and Enter in the field submits', async ({
  page,
}) => {
  test.slow()
  const form = page.locator('#reserve form')
  await form.scrollIntoViewIfNeeded()
  const submit = form.getByRole('button', { name: 'Reserve', exact: true })
  await expect(submit).toHaveAttribute('data-magnetic', '')
  await expect(submit).toHaveAttribute('type', 'submit')
  await page.getByLabel('Email address').fill('reader@mail.test')
  await page.getByLabel('Email address').press('Enter')
  await expect(form.getByRole('button', { name: 'Reserving…' })).toBeDisabled()
  await expect(page.locator('#reserve').getByRole('status')).toContainText('You are on the list.')
})

test('email bugs rest, run off on focus, come back on errors and leave on success', async ({
  page,
}) => {
  test.slow()
  const form = page.locator('#reserve form')
  await form.scrollIntoViewIfNeeded()
  const bugs = form.locator('[data-state]')
  const email = page.getByLabel('Email address')
  await expect(bugs).toHaveAttribute('data-state', 'rest')
  await email.focus()
  await expect(bugs).toHaveAttribute('data-state', 'away')
  await email.blur()
  await expect(bugs).toHaveAttribute('data-state', 'return')
  await email.fill('nope')
  await email.press('Enter')
  await expect(bugs).toHaveAttribute('data-state', 'error')
  await email.fill('reader@mail.test')
  await expect(bugs).toHaveAttribute('data-state', 'away')
  await email.press('Enter')
  await expect(page.locator('#reserve').getByRole('status')).toContainText('You are on the list.')
  await expect(page.locator('#reserve [data-state]')).toHaveCount(0)
})

test('the pause toggle morphs its icon in both directions', async ({ page, browserName }) => {
  const toggle = page.locator('footer').getByRole('button', { name: 'Pause motion' })
  await toggle.scrollIntoViewIfNeeded()
  const icon = toggle.locator('svg')
  const leftBar = toggle.locator('path').first()
  const supportsD = await page.evaluate(() => CSS.supports('d', 'path("M0 0")'))

  for (const [pressed, shape, swap] of [
    ['true', 'M 5 3.5', 'toggle-swap-on'],
    ['false', 'M 4 3.5', 'toggle-swap-off'],
  ]) {
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-pressed', String(pressed))
    if (supportsD) {
      await expect
        .poll(() =>
          leftBar.evaluate((path) =>
            getComputedStyle(path).getPropertyValue('d').replace(/\s/g, ''),
          ),
        )
        .toContain(String(shape).replace(/\s/g, ''))
    } else {
      expect(browserName).toBe('webkit')
      await expect
        .poll(() => icon.evaluate((svg) => getComputedStyle(svg).animationName))
        .toContain(String(swap))
    }
  }
})

test.describe('pause toggle under reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('swaps the icon without a ring', async ({ page }) => {
    const toggle = page.locator('footer').getByRole('button', { name: 'Pause motion' })
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    const ring = await toggle.evaluate(
      (button) => getComputedStyle(button, '::after').animationName,
    )
    expect(ring).toBe('none')
  })
})
