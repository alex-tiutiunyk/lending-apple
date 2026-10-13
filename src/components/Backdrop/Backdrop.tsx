import { lazy, Suspense, useEffect, useRef, useSyncExternalStore } from 'react'
import { subscribeScrollFrame, type ScrollFrame } from '@/hooks/frameLoop'
import { prefersSavedData } from '@/hooks/saveData'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import styles from './Backdrop.module.scss'

const AppleParticles = lazy(() => import('./AppleParticles'))

function subscribeToNothing() {
  return () => undefined
}

export function Backdrop() {
  const backdropRef = useRef<HTMLDivElement>(null)
  const isReducedMotion = useReducedMotion()
  const isSavingData = useSyncExternalStore(subscribeToNothing, prefersSavedData, () => true)

  useEffect(() => {
    const backdrop = backdropRef.current
    if (!backdrop || isReducedMotion) return

    let written = ''
    const update = ({ scrollY, viewportHeight, documentHeight }: ScrollFrame) => {
      const scrollable = Math.max(1, documentHeight - viewportHeight)
      const progress = Math.min(1, Math.max(0, scrollY / scrollable)).toFixed(3)
      if (progress === written) return
      written = progress
      backdrop.style.setProperty('--doc-p', progress)
    }
    return subscribeScrollFrame(update)
  }, [isReducedMotion])

  return (
    <div ref={backdropRef} className={styles.backdrop} aria-hidden="true">
      <div className={`${styles.blob} ${styles.blobHigh}`} />
      <div className={`${styles.blob} ${styles.blobLow}`} />
      <div className={`${styles.tint} ${styles.tintCool}`} />
      <div className={`${styles.tint} ${styles.tintWarm}`} />
      <div className={styles.grain} />
      {!isReducedMotion && !isSavingData && (
        <Suspense fallback={null}>
          <AppleParticles />
        </Suspense>
      )}
    </div>
  )
}
