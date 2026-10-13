import { useId } from 'react'
import { PhoneOutline } from '@/assets/svg/phone-outline'
import { PressableLink } from '@/components/PressableLink/PressableLink'
import { heroCopy } from '@/content/copy'
import styles from './Hero.module.scss'

export function Hero() {
  const titleId = useId()

  return (
    <section id="hero" className={styles.hero} aria-labelledby={titleId}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>{heroCopy.eyebrow}</p>
        <h1 id={titleId} className={styles.title}>
          {heroCopy.title}
        </h1>
        <p className={styles.lede}>{heroCopy.lede}</p>
        <div className={styles.actions}>
          <PressableLink href="#reserve" label={heroCopy.primaryCta} hasSheen />
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
