import { useId, useState } from 'react'
import { PhoneRender } from '@/assets/svg/phone-render'
import { reserveCopy } from '@/content/copy'
import { launch } from '@/content/specs'
import { Countdown } from './Countdown'
import { ReserveForm } from './ReserveForm'
import styles from './Reserve.module.scss'

export function Reserve() {
  const titleId = useId()
  const [isReserved, setIsReserved] = useState(false)

  return (
    <section id="reserve" className={styles.section} aria-labelledby={titleId}>
      <div className={styles.panel}>
        <div className={styles.copy}>
          <h2 id={titleId} className={styles.title}>
            {reserveCopy.title}
          </h2>
          <p className={styles.body}>
            {reserveCopy.bodyBefore} <strong>{launch.opensAtLabel}</strong>. {reserveCopy.bodyAfter}
          </p>
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
