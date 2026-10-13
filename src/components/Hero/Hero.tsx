import { useId, useRef } from 'react'
import { PhoneOutline } from '@/assets/svg/phone-outline'
import { PressableLink } from '@/components/PressableLink/PressableLink'
import { SplitWords } from '@/components/RevealTitle/SplitWords'
import { heroCopy } from '@/content/copy'
import { useAwakeWhileInView } from '@/hooks/useAmbientMotion'
import styles from './Hero.module.scss'

export function Hero() {
  const titleId = useId()
  const visualRef = useRef<HTMLDivElement>(null)
  useAwakeWhileInView(visualRef)

  return (
    <section id="hero" className={styles.hero} aria-labelledby={titleId}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>{heroCopy.eyebrow}</p>
        <h1 id={titleId} className={styles.title}>
          <SplitWords text={heroCopy.title} wordClassName={styles.word} />
        </h1>
        <p className={styles.lede}>{heroCopy.lede}</p>
        <div className={styles.actions}>
          <PressableLink href="#reserve" label={heroCopy.primaryCta} hasSheen />
          <a className={styles.secondary} href="#design">
            {heroCopy.secondaryCta}
          </a>
        </div>
      </div>
      <div ref={visualRef} className={styles.visual} data-particles="spark">
        <PhoneOutline view="front" className={styles.outline} />
      </div>
    </section>
  )
}
