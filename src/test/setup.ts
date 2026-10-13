import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { fakeMatchMedia, resetMediaQueries } from './mediaQuery'

window.matchMedia = fakeMatchMedia

afterEach(() => {
  cleanup()
  resetMediaQueries()
})
