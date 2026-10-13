import { useRef } from 'react'
import { numbersCopy } from '@/content/copy'
import { statFootnotes, stats } from '@/content/specs'
import { useInView } from '@/hooks/useInView'
import { SlotNumber } from './SlotNumber'
import styles from './Numbers.module.scss'

const reelDelaysMs = [0, 80, 140, 220, 360] as const

function footnoteId(footnote: number) {
  return `numbers-footnote-${footnote}`
}

export function Numbers() {
  const listRef = useRef<HTMLDListElement>(null)
  const isListInView = useInView(listRef, { once: true, rootMargin: '0px 0px -20% 0px' })

  return (
    <section id="numbers" className={styles.section} aria-labelledby="numbers-title">
      <h2 id="numbers-title" className={styles.title}>
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
      <p className={styles.cta}>
        <span>{numbersCopy.ctaText}</span>
        <a className={styles.ctaLink} href="#reserve">
          {numbersCopy.cta}
        </a>
      </p>
    </section>
  )
}
