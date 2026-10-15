import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RollingText } from './RollingText'

describe('RollingText (plan 4 §7.1)', () => {
  it('keeps the plain label as the accessible name; the rolling letters are hidden copies', () => {
    const { container } = render(
      <a href="#top" data-roll-host>
        <RollingText label="Back to top" />
      </a>,
    )
    expect(screen.getByRole('link', { name: 'Back to top' })).toBeDefined()
    const copies = container.querySelector('[aria-hidden="true"]')
    expect(copies?.textContent).toBe('BBaacckkttoottoopp')
  })

  it('keeps the plain name with the hop effect (plan 5 §2); the letters carry the hop class', () => {
    const { container } = render(
      <a href="#design" data-roll-host>
        <RollingText label="Design" effect="hop" />
      </a>,
    )
    expect(screen.getByRole('link', { name: 'Design' })).toBeDefined()
    const letters = container.querySelector('[aria-hidden="true"]')
    expect(letters?.className).toContain('letters--hop')
    expect(letters?.querySelectorAll('[style]')).toHaveLength(6)
  })
})
