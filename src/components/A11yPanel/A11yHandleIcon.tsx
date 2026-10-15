import { glyph } from './a11yGlyph'
import styles from './A11yPanel.module.scss'

/**
 * The panel handle's icon (plan 7 §3): the accessibility glyph. On hover and focus the ring draws
 * itself and the figure does a star jump and waves; the open panel holds the arms-up pose. The
 * moves are one-shot CSS transforms on the parts, from the handle's states in the stylesheet.
 */
export function A11yHandleIcon() {
  return (
    <svg className={styles.icon} viewBox={glyph.viewBox} aria-hidden="true" focusable="false">
      <circle className={styles.ring} {...glyph.ring} pathLength={1} />
      <g className={styles.figure}>
        <circle className={styles.head} {...glyph.head} />
        <path d={glyph.torso} />
        <path className={styles.armLeft} d={glyph.armLeft} />
        <path className={styles.armRight} d={glyph.armRight} />
        <path className={styles.legLeft} d={glyph.legLeft} />
        <path className={styles.legRight} d={glyph.legRight} />
      </g>
    </svg>
  )
}
