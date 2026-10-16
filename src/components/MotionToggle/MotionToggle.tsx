import { useState } from 'react'
import { motionCopy } from '@/content/copy'
import { updateA11ySettings } from '@/hooks/a11yStore'
import { useMotionPaused, useSystemReducedMotion } from '@/hooks/useReducedMotion'
import styles from './MotionToggle.module.scss'

// Both icons as two closed four-point shapes, so CSS can morph one into the other
const bars = {
  pause: ['M4 3.5 L6.6 3.5 L6.6 12.5 L4 12.5 Z', 'M9.4 3.5 L12 3.5 L12 12.5 L9.4 12.5 Z'],
  play: ['M5 3.5 L8.75 5.75 L8.75 10.25 L5 12.5 Z', 'M8.75 5.75 L12.5 8 L12.5 8 L8.75 10.25 Z'],
}

type MotionToggleProps = {
  isCompact?: boolean
  className?: string | undefined
}

export function MotionToggle({ isCompact = false, className }: MotionToggleProps) {
  const isPaused = useMotionPaused()
  const isSystemReduced = useSystemReducedMotion()
  const [hasToggled, setHasToggled] = useState(false)
  const [left, right] = isPaused ? bars.play : bars.pause

  return (
    <button
      type="button"
      className={className ? `${styles.root} ${className}` : styles.root}
      data-compact={isCompact ? '' : undefined}
      data-toggled={hasToggled ? '' : undefined}
      aria-pressed={isPaused}
      data-calm-fade
      onClick={() => {
        setHasToggled(true)
        // Play while the OS asks for reduced motion overrides it, as in the panel
        updateA11ySettings(
          isPaused ? { motion: 'full', motionOverride: isSystemReduced } : { motion: 'calm' },
        )
      }}
    >
      <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path d={left} className={styles.barLeft} />
        <path d={right} className={styles.barRight} />
      </svg>
      <span className={styles.label}>{motionCopy.pause}</span>
    </button>
  )
}
