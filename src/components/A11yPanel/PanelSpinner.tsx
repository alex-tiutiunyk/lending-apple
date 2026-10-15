import { useEffect } from 'react'
import { a11yCopy } from '@/content/copy'
import { glyph } from './a11yGlyph'
import styles from './A11yPanel.module.scss'

type PanelSpinnerProps = {
  /** Called with true while the spinner shows, so the panel can say it is busy. */
  onWaiting: (isWaiting: boolean) => void
}

/**
 * The controls' loading state (plan 7 §14): the handle glyph as a small rig, a turning ring and
 * the figure bobbing in its arms-up pose, each on its own `<svg>` root so both loops composite.
 * It fades in after 150 ms, so a fast load shows nothing.
 */
export function PanelSpinner({ onWaiting }: PanelSpinnerProps) {
  useEffect(() => {
    onWaiting(true)
    return () => onWaiting(false)
  }, [onWaiting])

  return (
    <div className={styles.spinner}>
      <span className={styles.spinnerRig} aria-hidden="true">
        <svg className={styles.spinnerRing} viewBox={glyph.viewBox} focusable="false">
          <circle {...glyph.ring} pathLength={1} />
        </svg>
        <svg className={styles.spinnerFigure} viewBox={glyph.viewBox} focusable="false">
          <circle className={styles.head} {...glyph.head} />
          <path d={glyph.torso} />
          <path d={glyph.armLeft} transform="rotate(35 12 10.6)" />
          <path d={glyph.armRight} transform="rotate(-35 12 10.6)" />
          <path d={glyph.legLeft} transform="rotate(12 12 14)" />
          <path d={glyph.legRight} transform="rotate(-12 12 14)" />
        </svg>
      </span>
      <span className={styles.spinnerLabel}>{a11yCopy.loading}</span>
    </div>
  )
}
