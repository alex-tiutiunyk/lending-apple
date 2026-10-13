import { motionCopy } from '@/content/copy'
import { setMotionPaused, useMotionPaused } from '@/hooks/motionPause'
import styles from './MotionToggle.module.scss'

type MotionToggleProps = {
  isCompact?: boolean
  className?: string | undefined
}

export function MotionToggle({ isCompact = false, className }: MotionToggleProps) {
  const isPaused = useMotionPaused()

  return (
    <button
      type="button"
      className={className ? `${styles.toggle} ${className}` : styles.toggle}
      data-compact={isCompact ? '' : undefined}
      aria-pressed={isPaused}
      onClick={() => setMotionPaused(!isPaused)}
    >
      <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        {isPaused ? (
          <path d="M5 3.5v9l7.5-4.5z" />
        ) : (
          <>
            <rect x="4" y="3.5" width="2.6" height="9" rx="0.8" />
            <rect x="9.4" y="3.5" width="2.6" height="9" rx="0.8" />
          </>
        )}
      </svg>
      <span className={styles.label}>{motionCopy.pause}</span>
    </button>
  )
}
