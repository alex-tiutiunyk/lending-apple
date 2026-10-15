import { lazy, Suspense, useId, useRef, useState, useSyncExternalStore } from 'react'
import { PhoneRender } from '@/assets/svg/phone-render'
import { BorderPulse } from '@/components/BorderPulse/BorderPulse'
import { SurfaceLens } from '@/components/LivingSurface/SurfaceLens'
import { RevealText } from '@/components/RevealText/RevealText'
import { RevealTitle } from '@/components/RevealTitle/RevealTitle'
import { reserveCopy } from '@/content/copy'
import { launch } from '@/content/specs'
import { useAmbientMotion, useAwakeWhileInView } from '@/hooks/useAmbientMotion'
import { Countdown } from './Countdown'
import { ReserveForm } from './ReserveForm'
import styles from './Reserve.module.scss'

// The changing screen (plan 7 §9): six drawings, too much for the main bundle
const ReserveScreens = lazy(() => import('./reserve-screens'))

function subscribeToNothing() {
  return () => undefined
}

export function Reserve() {
  const titleId = useId()
  const [isReserved, setIsReserved] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  useAwakeWhileInView(panelRef)
  const isMounted = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  )
  const isAmbient = useAmbientMotion()

  return (
    <section id="reserve" className={styles.root} aria-labelledby={titleId}>
      <div ref={panelRef} className={styles.panel} data-surface>
        <BorderPulse seed={0.45} />
        <SurfaceLens />
        <div className={styles.copy}>
          <RevealTitle id={titleId} className={styles.title} text={reserveCopy.title} />
          <RevealText className={styles.body} isDelayed>
            {reserveCopy.bodyBefore} <strong>{launch.opensAtLabel}</strong>. {reserveCopy.bodyAfter}
          </RevealText>
          <Countdown />
          <ReserveForm onReserved={() => setIsReserved(true)} />
        </div>
        <div
          className={styles.renderFrame}
          data-particles="check"
          data-reserved={isReserved ? '' : undefined}
        >
          <div className={styles.renderBox}>
            <PhoneRender view="front" className={styles.render} label={reserveCopy.renderLabel} />
            {isMounted && isAmbient && (
              <Suspense fallback={null}>
                <ReserveScreens />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
