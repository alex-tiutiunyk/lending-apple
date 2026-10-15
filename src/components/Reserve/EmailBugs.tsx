import { useRef } from 'react'
import { Bug } from '@/assets/svg/bug'
import { useAmbientMotion, useAwakeWhileInView } from '@/hooks/useAmbientMotion'
import styles from './EmailBugs.module.scss'

export type BugState = 'rest' | 'away' | 'return' | 'error'

const bugs = [1, 2, 3, 4, 5, 6, 7, 8, 9]

type EmailBugsProps = {
  state: BugState
}

/**
 * Software bugs that live around the empty email field (plan 7 §8): nine of them wander along its
 * edge and run off when it gets focus. Each is a place (rest, away, return, error), a wander loop
 * inside it and the shared bug rig.
 */
export function EmailBugs({ state }: EmailBugsProps) {
  const rootRef = useRef<HTMLSpanElement>(null)
  useAwakeWhileInView(rootRef)
  const isAmbient = useAmbientMotion()

  return (
    <span ref={rootRef} className={styles.root} data-state={state} aria-hidden="true">
      <span className={styles.scan} />
      {isAmbient &&
        bugs.map((bug) => (
          <span key={bug} className={styles.spot}>
            <span className={styles.walk}>
              <Bug className={styles.bug} />
            </span>
          </span>
        ))}
    </span>
  )
}
