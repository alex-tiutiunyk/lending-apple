import { useId, useRef } from 'react'
import { PhoneOutline } from '@/assets/svg/phone-outline'
import { heroCopy } from '@/content/copy'
import { useInView } from '@/hooks/useInView'
import styles from './Hero.module.scss'

export function Hero() {
  const titleId = useId()
  const primaryCtaRef = useRef<HTMLAnchorElement>(null)
  const isCtaSeen = useInView(primaryCtaRef, { once: true, threshold: 1 })

  return (
    <section id="hero" className={styles.hero} aria-labelledby={titleId}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>{heroCopy.eyebrow}</p>
        <h1 id={titleId} className={styles.title}>
          {heroCopy.title}
        </h1>
        <p className={styles.lede}>{heroCopy.lede}</p>
        <div className={styles.actions}>
          <a
            ref={primaryCtaRef}
            className={styles.primary}
            href="#reserve"
            data-sheen={isCtaSeen ? 'run' : undefined}
          >
            {heroCopy.primaryCta}
          </a>
          <a className={styles.secondary} href="#design">
            {heroCopy.secondaryCta}
          </a>
        </div>
      </div>
      <div className={styles.visual} data-particles="spark">
        <PhoneOutline view="front" className={styles.outline} />
      </div>
    </section>
  )
}
