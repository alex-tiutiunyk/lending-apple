import { reserveCopy } from '@/content/copy'
import { launch } from '@/content/specs'
import { useMinuteClock } from '@/hooks/useMinuteClock'
import { timeUntil } from './timeUntil'
import styles from './Reserve.module.scss'

const opensAtMs = Date.parse(launch.opensAtUtc)
const unitOrder = ['days', 'hours', 'minutes'] as const

export function Countdown() {
  const now = useMinuteClock()
  const remaining = now === null ? null : timeUntil(opensAtMs, now)

  if (remaining?.hasArrived) {
    return <p className={styles.countdownDone}>{reserveCopy.countdownDone}</p>
  }

  return (
    <div className={styles.countdown} role="group" aria-labelledby="countdown-label">
      <p id="countdown-label" className={styles.countdownLabel}>
        {reserveCopy.countdownLabel}
      </p>
      <dl className={styles.countdownUnits} aria-live="off">
        {unitOrder.map((unit) => (
          <div key={unit} className={styles.countdownUnit}>
            <dt>{reserveCopy.countdownUnits[unit]}</dt>
            <dd>{remaining ? String(remaining[unit]).padStart(2, '0') : '--'}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
