import { lazy, Suspense, useId, useRef, useSyncExternalStore } from 'react'
import { PhoneOutline } from '@/assets/svg/phone-outline'
import { DecodeText } from '@/components/RevealText/DecodeText'
import { PressableLink } from '@/components/Pressable/PressableLink'
import { SplitWords } from '@/components/RevealTitle/SplitWords'
import { heroCopy } from '@/content/copy'
import { useAwakeWhileInView } from '@/hooks/useAmbientMotion'
import styles from './Hero.module.scss'

const HeroExtras = lazy(() => import('./HeroExtras'))

function subscribeToNothing() {
  return () => undefined
}

export function Hero() {
  const titleId = useId()
  const visualRef = useRef<HTMLDivElement>(null)
  useAwakeWhileInView(visualRef)
  const isMounted = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  )

  return (
    <section id="hero" className={styles.root} aria-labelledby={titleId}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>
          <DecodeText text={heroCopy.eyebrow} />
        </p>
        <h1 id={titleId} className={styles.title}>
          <SplitWords
            text={heroCopy.title}
            wordClassName={styles.word}
            innerClassName={styles.wordInner}
          />
        </h1>
        <p className={styles.lede}>{heroCopy.lede}</p>
        <div className={styles.actions}>
          <PressableLink href="#reserve" label={heroCopy.primaryCta} hasSheen hasNudges hasBeam />
          <a className={styles.secondary} href="#design">
            {/* The ring draws itself on hover (plan 5 §3): a pill outline and a pen point */}
            <svg className={styles.ring} aria-hidden="true" focusable="false">
              <rect
                className={styles.ringLine}
                width="100%"
                height="100%"
                rx="999"
                pathLength={1}
              />
              <rect className={styles.ringPen} width="100%" height="100%" rx="999" pathLength={1} />
            </svg>
            <span className={styles.secondaryLabel}>{heroCopy.secondaryCta}</span>
          </a>
        </div>
      </div>
      <div ref={visualRef} className={styles.visual} data-particles="spark">
        <PhoneOutline view="front" className={styles.outline} />
        {isMounted && (
          <Suspense fallback={null}>
            <HeroExtras />
          </Suspense>
        )}
      </div>
    </section>
  )
}
