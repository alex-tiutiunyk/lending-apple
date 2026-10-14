import { useRef } from 'react'
import { useAmbientMotion, useAwakeWhileInView } from '@/hooks/useAmbientMotion'
import styles from './EmailBugs.module.scss'

export type BugState = 'rest' | 'away' | 'return' | 'error'

const bugs = [1, 2, 3, 4, 5, 6]

function Bug() {
  return (
    <svg className={styles.bug} viewBox="0 0 10 10" focusable="false">
      <g className={styles.legs}>
        <path d="M3 3.5 1 2.5 M3 5 0.8 5 M3 6.5 1 7.5" />
      </g>
      <g className={`${styles.legs} ${styles.legsRight}`}>
        <path d="M7 3.5 9 2.5 M7 5 9.2 5 M7 6.5 9 7.5" />
      </g>
      <ellipse cx={5} cy={5.6} rx={2.3} ry={3} className={styles.shell} />
      <circle cx={5} cy={2.2} r={1.2} className={styles.head} />
    </svg>
  )
}

type EmailBugsProps = {
  state: BugState
}

/** Software bugs that live in the empty email field and run off when it gets focus. */
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
            <Bug />
          </span>
        ))}
    </span>
  )
}
