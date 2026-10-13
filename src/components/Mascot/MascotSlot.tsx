import { lazy, Suspense, useSyncExternalStore } from 'react'
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
  if (!isMounted || !isAmbient) return null

  return (
    <Suspense fallback={null}>
      <Mascot />
    </Suspense>
  )
}
