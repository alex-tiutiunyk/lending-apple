import styles from './LivingSurface.module.scss'

/**
 * The hover lens of a living surface (plan 1 §7, plan 6 §8): a radial glow that follows the
 * pointer through a direct `translate` write (`usePointerHover`) and three rings that scale out
 * once on each enter. CSS only: gradients and composited transforms, no SVG filter.
 */
export function SurfaceLens() {
  return (
    <span className={styles.lens} aria-hidden="true" data-lens>
      <span className={styles.lensRings} />
    </span>
  )
}
