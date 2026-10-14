import { useId, useRef, useState } from 'react'
import { PhoneRender } from '@/assets/svg/phone-render'
import { SurfaceLens } from '@/components/LivingSurface/SurfaceRipple'
import { RevealText } from '@/components/RevealText/RevealText'
import { RevealTitle } from '@/components/RevealTitle/RevealTitle'
import { reserveCopy } from '@/content/copy'
import { launch } from '@/content/specs'
import { useAwakeWhileInView } from '@/hooks/useAmbientMotion'
import { Countdown } from './Countdown'
import { ReserveForm } from './ReserveForm'
import styles from './Reserve.module.scss'

export function Reserve() {
  const titleId = useId()
  const [isReserved, setIsReserved] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  useAwakeWhileInView(panelRef)

  return (
    <section id="reserve" className={styles.root} aria-labelledby={titleId}>
      <div ref={panelRef} className={styles.panel} data-surface>
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
          <PhoneRender view="front" className={styles.render} label={reserveCopy.renderLabel} />
        </div>
      </div>
    </section>
  )
}
