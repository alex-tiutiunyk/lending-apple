import { useId, useRef } from 'react'
import { numbersCopy } from '@/content/copy'
import { statFootnotes, stats } from '@/content/specs'
import { PressableLink } from '@/components/PressableLink/PressableLink'
import { SurfaceLens } from '@/components/LivingSurface/SurfaceRipple'
import { useAwakeWhileInView } from '@/hooks/useAmbientMotion'
import { useInView } from '@/hooks/useInView'
import { SlotNumber } from './SlotNumber'
import styles from './Numbers.module.scss'

const reelDelaysMs = [0, 80, 140, 220, 360] as const

export function Numbers() {
  const titleId = useId()
  const footnotePrefix = useId()
  const footnoteId = (footnote: number) => `${footnotePrefix}-note-${footnote}`
  const listRef = useRef<HTMLDListElement>(null)
  const isListInView = useInView(listRef, { once: true, rootMargin: '0px 0px -20% 0px' })
  const ctaRef = useRef<HTMLParagraphElement>(null)
  useAwakeWhileInView(ctaRef)

  return (
    <section id="numbers" className={styles.section} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
        {numbersCopy.title}
      </h2>
      <dl ref={listRef} className={styles.stats}>
        {stats.map((stat, order) => (
          <div key={stat.id} className={styles.stat}>
            <dt className={styles.label}>
              {stat.label}
              <a
                className={styles.footnoteRef}
                href={`#${footnoteId(stat.footnote)}`}
                aria-label={`Note ${stat.footnote}`}
              >
                <sup>{stat.footnote}</sup>
              </a>
            </dt>
            <dd className={styles.value}>
              <SlotNumber
                value={stat.value}
                unit={stat.unit}
                isRunning={isListInView}
                delay={reelDelaysMs[order] ?? 0}
              />
            </dd>
          </div>
        ))}
      </dl>
      <ol className={styles.footnotes}>
        {statFootnotes.map((note, index) => (
          <li key={note} id={footnoteId(index + 1)}>
            {note}
          </li>
        ))}
      </ol>
      <p ref={ctaRef} className={styles.cta} data-surface>
        <SurfaceLens />
        <span>{numbersCopy.ctaText}</span>
        <PressableLink href="#reserve" label={numbersCopy.cta} />
      </p>
    </section>
  )
}
