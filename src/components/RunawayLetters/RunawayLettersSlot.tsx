import { lazy, Suspense, useSyncExternalStore } from 'react'
import { useA11ySettings } from '@/hooks/a11yStore'
import { useAmbientMotion } from '@/hooks/useAmbientMotion'
import { useHighContrast } from '@/hooks/useHighContrast'

const RunawayLetters = lazy(() => import('./RunawayLetters'))

function subscribeToNothing() {
  return () => undefined
}

/**
 * Loads the letters only where they belong (plan 4 §1): after mount, with motion at `full`,
 * and not in high contrast or with the readable font, where moving letters hurt reading.
 */
export function RunawayLettersSlot() {
  const isMounted = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  )
  const isAmbient = useAmbientMotion()
  const isHighContrast = useHighContrast()
  const { font } = useA11ySettings()
  if (!isMounted || !isAmbient || isHighContrast || font) return null

  return (
    <Suspense fallback={null}>
      <RunawayLetters />
    </Suspense>
  )
}
