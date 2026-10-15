import styles from './bug.module.scss'

type BugProps = {
  className?: string | undefined
  /** The leg walk cycle runs while set (plan 5 §5); without it the legs only twitch when awake. */
  isWalking?: boolean
}

const viewBox = '0 0 10 10'

/**
 * One bug for the whole page (plan 5 §5): six legs in two groups, a shell and a head. The email
 * field's bugs and the lens-list bug share it; the host colours it through `currentColor`. A rig
 * (plan 6 §7): a box with three `<svg>` roots in the same viewBox, so the leg loops run on the
 * compositor.
 */
export function Bug({ className, isWalking = false }: BugProps) {
  return (
    <span
      className={className ? `${styles.root} ${className}` : styles.root}
      data-walking={isWalking ? '' : undefined}
    >
      <svg className={styles.legs} viewBox={viewBox} focusable="false" data-bug-part="legs">
        <path d="M3 3.5 1 2.5 M3 5 0.8 5 M3 6.5 1 7.5" />
      </svg>
      <svg
        className={`${styles.legs} ${styles.legsRight}`}
        viewBox={viewBox}
        focusable="false"
        data-bug-part="legs"
      >
        <path d="M7 3.5 9 2.5 M7 5 9.2 5 M7 6.5 9 7.5" />
      </svg>
      <svg className={styles.body} viewBox={viewBox} focusable="false">
        <ellipse cx={5} cy={5.6} rx={2.3} ry={3} className={styles.shell} />
        <circle cx={5} cy={2.2} r={1.2} className={styles.head} />
      </svg>
    </span>
  )
}
