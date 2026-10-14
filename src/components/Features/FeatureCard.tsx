import { useId, useRef, type ReactNode } from 'react'
import type { ParticleShape } from '@/components/Backdrop/particleShapes'
import { SurfaceLens } from '@/components/LivingSurface/SurfaceRipple'
import type { featuresCopy } from '@/content/copy'
import { useAwakeWhileInView } from '@/hooks/useAmbientMotion'
import { useReveal } from '@/hooks/useReveal'
import styles from './Features.module.scss'

type FeatureArea = Exclude<keyof typeof featuresCopy, 'title'>

const areaModifier: Record<FeatureArea, string | undefined> = {
  camera: styles.cardCamera,
  display: styles.cardDisplay,
  chip: styles.cardChip,
  titanium: styles.cardTitanium,
}

type FeatureCardProps = {
  area: FeatureArea
  title: string
  particles: ParticleShape
  children: ReactNode
}

export function FeatureCard({ area, title, particles, children }: FeatureCardProps) {
  const cardRef = useRef<HTMLElement>(null)
  const titleId = useId()
  useReveal(cardRef)
  useAwakeWhileInView(cardRef)

  return (
    <article
      ref={cardRef}
      className={`${styles.card} ${areaModifier[area]}`}
      aria-labelledby={titleId}
      data-particles={particles}
      data-surface
    >
      <SurfaceLens />
      <h3 id={titleId} className={styles.cardTitle}>
        {title}
      </h3>
      {children}
    </article>
  )
}
