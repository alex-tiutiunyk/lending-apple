import { lazy, Suspense, useSyncExternalStore } from 'react'
import { useA11ySettings } from '@/hooks/a11yStore'
import { useAmbientMotion } from '@/hooks/useAmbientMotion'

const Mascot = lazy(() => import('./Mascot'))

function subscribeToNothing() {
  return () => undefined
}

export function MascotSlot() {
  const isMounted = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  )
  const isAmbient = useAmbientMotion()
  const { pip } = useA11ySettings()
  if (!isMounted || !isAmbient || !pip) return null

  return (
    <Suspense fallback={null}>
      <Mascot />
    </Suspense>
  )
}
