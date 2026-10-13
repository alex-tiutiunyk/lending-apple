import { useId, useRef, type ReactNode } from 'react'
import type { featuresCopy } from '@/content/copy'
import { useReveal } from '@/hooks/useReveal'
import styles from './Features.module.scss'

type FeatureArea = Exclude<keyof typeof featuresCopy, 'title'>

type FeatureCardProps = {
  area: FeatureArea
  title: string
  children: ReactNode
}

export function FeatureCard({ area, title, children }: FeatureCardProps) {
  const cardRef = useRef<HTMLElement>(null)
  const titleId = useId()
  useReveal(cardRef)

  return (
    <article ref={cardRef} className={`${styles.card} ${styles[area]}`} aria-labelledby={titleId}>
      <h3 id={titleId} className={styles.cardTitle}>
        {title}
      </h3>
      {children}
    </article>
  )
}
