import { projectDetailsCopy } from '@/content/copy'
import { ProjectDetailsLink } from './ProjectDetailsLink'
import styles from './ProjectDetailsTab.module.scss'

/**
 * The flag on the right edge of the window (plan 10 §2), the mirror of the accessibility handle:
 * the window edge is its pole, a swallowtail notch faces the page. It stands still; a hover slides
 * it out a little. On phones only the glyph shows.
 */
export function ProjectDetailsTab() {
  return (
    // A landmark of its own, so no page content sits outside one (axe `region`)
    <aside aria-label={projectDetailsCopy.label}>
      <ProjectDetailsLink className={styles.root}>
        <svg
          className={styles.flag}
          viewBox="0 0 40 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M44 0H0L9 50L0 100H44" vectorEffect="non-scaling-stroke" />
        </svg>
        <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v6" />
          <circle className={styles.dot} cx="12" cy="7.6" r="1.1" />
        </svg>
        <span className={styles.label}>{projectDetailsCopy.label}</span>
      </ProjectDetailsLink>
    </aside>
  )
}
