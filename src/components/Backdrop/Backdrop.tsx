import { lazy, Suspense, useEffect, useRef, useSyncExternalStore } from 'react'
import { prefersSavedData } from '@/hooks/saveData'
import { useAwakeWhileInView } from '@/hooks/useAmbientMotion'
import { useHighContrast } from '@/hooks/useHighContrast'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { readAccent } from './readAccent'
import styles from './Backdrop.module.scss'

const ShapeParticles = lazy(() => import('./ShapeParticles'))
const accentProperties = ['--accent-h', '--accent-s', '--accent-l'] as const
const tintMs = 200

function subscribeToNothing() {
  return () => undefined
}

/**
 * The finish change without a page restyle (plan 6 §6): the root takes the new hue at once,
 * and the sky keeps a copy of the old gradient on a second layer that fades out over the tint
 * duration on the compositor, instead of a conic gradient repainted on every frame.
 */
function useSkyCrossFade(oldSky: React.RefObject<HTMLDivElement | null>, isReducedMotion: boolean) {
  useEffect(() => {
    const layer = oldSky.current
    if (!layer || isReducedMotion) return
    const root = document.documentElement
    const defaults = readAccent().split(' ')
    const resolved = () => {
      const inline = accentProperties.map((name) => root.style.getPropertyValue(name))
      return inline.every((value) => value === '') ? defaults : inline
    }
    let previous = resolved()
    let fade: Animation | null = null
    const observer = new MutationObserver(() => {
      const current = resolved()
      if (current.join() === previous.join()) return
      accentProperties.forEach((name, index) => {
        layer.style.setProperty(name, previous[index] ?? '')
      })
      previous = current
      fade?.cancel()
      fade = layer.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: tintMs,
        easing: 'ease-out',
      })
    })
    observer.observe(root, { attributes: true, attributeFilter: ['style'] })
    return () => {
      observer.disconnect()
      fade?.cancel()
    }
  }, [oldSky, isReducedMotion])
}

export function Backdrop() {
  const backdropRef = useRef<HTMLDivElement>(null)
  const oldSkyRef = useRef<HTMLDivElement>(null)
  const isReducedMotion = useReducedMotion()
  const isHighContrast = useHighContrast()
  useAwakeWhileInView(backdropRef)
  useSkyCrossFade(oldSkyRef, isReducedMotion)
  const isSavingData = useSyncExternalStore(subscribeToNothing, prefersSavedData, () => true)

  return (
    <div ref={backdropRef} className={styles.root} aria-hidden="true">
      <div ref={oldSkyRef} className={styles.skyOld} />
      <div className={`${styles.blob} ${styles.blobHigh}`} data-doc-p />
      <div className={`${styles.blob} ${styles.blobLow}`} data-doc-p />
      <div className={`${styles.tint} ${styles.tintCool}`} data-doc-p />
      <div className={`${styles.tint} ${styles.tintWarm}`} data-doc-p />
      <div className={styles.waves} />
      {!isReducedMotion && !isSavingData && !isHighContrast && (
        <Suspense fallback={null}>
          <ShapeParticles />
        </Suspense>
      )}
    </div>
  )
}
