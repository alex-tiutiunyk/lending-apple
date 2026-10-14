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
})
