import { useId, useRef, type ReactNode } from 'react'
import type { ParticleShape } from '@/components/Backdrop/particleShapes'
import { SurfaceLens } from '@/components/LivingSurface/SurfaceLens'
import type { featuresCopy } from '@/content/copy'
import { useAwakeWhileInView } from '@/hooks/useAmbientMotion'
import { useReveal } from '@/hooks/useReveal'
import { BorderPulse } from '@/components/BorderPulse/BorderPulse'
import styles from './Features.module.scss'

type FeatureArea = Exclude<keyof typeof featuresCopy, 'title'>

// Each card pulses on its own period and phase (plan 7 §11)
const areaSeed: Record<FeatureArea, number> = {
  camera: 0.1,
  display: 0.35,
  chip: 0.6,
  titanium: 0.85,
}

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
      <BorderPulse seed={areaSeed[area]} />
      <h3 id={titleId} className={styles.cardTitle}>
        {title}
      </h3>
      {children}
    </article>
  )
}
