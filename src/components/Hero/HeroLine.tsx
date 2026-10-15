import type { CSSProperties, Ref } from 'react'
import styles from './HeroExtras.module.scss'

type HeroLineProps = {
  ref: Ref<SVGSVGElement>
  /** Time left until the outline has finished drawing, so the line starts after it. */
  delayMs: number
}

/**
 * The single line that leaves the phone (plan 5 §14): one path drawn once after the outline,
 * then kept as a faint guide, and a copy that carries a light along it while the hero is awake.
 * The path itself is measured and written by HeroExtras.
 */
export function HeroLine({ ref, delayMs }: HeroLineProps) {
  return (
    <svg
      ref={ref}
      className={styles.line}
      aria-hidden="true"
      focusable="false"
      style={{ '--line-delay': `${delayMs}ms` } as CSSProperties}
    >
      <path className={styles.lineStroke} pathLength={1} />
      <path className={styles.lineLight} pathLength={1} />
    </svg>
  )
}
