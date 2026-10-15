import { useCallback, useId, useRef, useState } from 'react'
import { SurfaceLens } from '@/components/LivingSurface/SurfaceLens'
import { PressableLink } from '@/components/Pressable/PressableLink'
import { ScrubText } from '@/components/RevealText/ScrubText'
import { RevealTitle } from '@/components/RevealTitle/RevealTitle'
import { numbersCopy } from '@/content/copy'
import { statFootnotes, stats } from '@/content/specs'
import { useAmbientMotion, useAwakeWhileInView } from '@/hooks/useAmbientMotion'
import { useInView } from '@/hooks/useInView'
import { BorderPulse, LinePulse } from '@/components/BorderPulse/BorderPulse'
import { SlotNumber } from './SlotNumber'
import { useStatReplay } from './useStatReplay'
import { useStatTick } from './useStatTick'
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
  useAwakeWhileInView(listRef)
  useStatTick(listRef, useAmbientMotion())

  // A pointer over a stat, or focus on its footnote ref, replays that stat's reels (plan 5 §12)
  const [replays, setReplays] = useState<Record<string, number>>({})
  const replayStat = useCallback(
    (id: string) => setReplays((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 })),
    [],
  )
  useStatReplay(listRef, replayStat)

  return (
    <section id="numbers" className={styles.root} aria-labelledby={titleId}>
      <RevealTitle id={titleId} className={styles.title} text={numbersCopy.title} />
      <ScrubText className={styles.intro} text={numbersCopy.intro} />
      <dl ref={listRef} className={styles.stats}>
        {stats.map((stat, order) => (
          <div key={stat.id} className={styles.stat} data-stat={stat.id}>
            <dt className={styles.label}>
              <LinePulse side="top" seed={0.15 + order * 0.2} />
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
                replay={replays[stat.id] ?? 0}
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
        <BorderPulse seed={0.55} />
        <span>{numbersCopy.ctaText}</span>
        <PressableLink href="#reserve" label={numbersCopy.cta} />
      </p>
    </section>
  )
}
