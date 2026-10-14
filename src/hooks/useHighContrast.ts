import { useA11ySettings } from './a11yStore'
import { useMediaQuery } from './useMediaQuery'

/** High contrast picked in the panel, or asked for by the OS while the panel says auto. */
export function useHighContrast() {
  const isSystemMore = useMediaQuery('(prefers-contrast: more)')
  const { contrast } = useA11ySettings()
  return contrast === 'high' || (contrast === 'auto' && isSystemMore)
}
