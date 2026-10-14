import { lazy, Suspense, useRef, useSyncExternalStore } from 'react'
import { prefersSavedData } from '@/hooks/saveData'
import { useAwakeWhileInView } from '@/hooks/useAmbientMotion'
import { useHighContrast } from '@/hooks/useHighContrast'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import styles from './Backdrop.module.scss'

const ShapeParticles = lazy(() => import('./ShapeParticles'))

function subscribeToNothing() {
  return () => undefined
}

export function Backdrop() {
  const backdropRef = useRef<HTMLDivElement>(null)
  const isReducedMotion = useReducedMotion()
  const isHighContrast = useHighContrast()
  useAwakeWhileInView(backdropRef)
  const isSavingData = useSyncExternalStore(subscribeToNothing, prefersSavedData, () => true)

  return (
    <div ref={backdropRef} className={styles.root} aria-hidden="true">
      <div className={`${styles.blob} ${styles.blobHigh}`} />
      <div className={`${styles.blob} ${styles.blobLow}`} />
      <div className={`${styles.tint} ${styles.tintCool}`} />
      <div className={`${styles.tint} ${styles.tintWarm}`} />
      <div className={styles.waves} />
      <div className={styles.grain} />
      {!isReducedMotion && !isSavingData && !isHighContrast && (
        <Suspense fallback={null}>
          <ShapeParticles />
        </Suspense>
      )}
    </div>
  )
}
