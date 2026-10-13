import { useRef, type ReactNode } from 'react'
import { useReveal } from '@/hooks/useReveal'
import styles from './Features.module.scss'

type FeatureCardProps = {
  area: 'camera' | 'display' | 'chip' | 'titanium'
  titleId: string
  title: string
  children: ReactNode
}

export function FeatureCard({ area, titleId, title, children }: FeatureCardProps) {
  const cardRef = useRef<HTMLElement>(null)
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
