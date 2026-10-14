import { useId } from 'react'
import { front, phoneViewBoxes, roundedRectPath } from '@/assets/svg/phone-geometry'
import { heroCopy } from '@/content/copy'
import { useMinuteClock } from '@/hooks/useMinuteClock'
import styles from './HeroExtras.module.scss'

const portX = front.body.x + front.body.width / 2
const portY = front.body.y + front.body.height
const notificationTop = 128
const notificationStep = 36
const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** The hero phone's screen wakes up, shows the time and three notifications; a cable plugs in. */
export function HeroBoot() {
  const glowId = useId()
  const minute = useMinuteClock()

  return (
    <svg
      className={styles.boot}
      viewBox={phoneViewBoxes.front}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={glowId} cx="50%" cy="20%" r="90%">
          <stop offset="0" className={styles.glowCenter} />
          <stop offset="1" className={styles.glowEdge} />
        </radialGradient>
      </defs>
      <g className={styles.screen}>
        <path d={roundedRectPath(front.screen)} fill={`url(#${glowId})`} />
        <path d={roundedRectPath(front.island)} className={styles.island} />
        <text x={portX} y={92} className={styles.time}>
          {minute === null ? '' : timeFormat.format(minute)}
        </text>
      </g>
      {heroCopy.notifications.map((message, order) => {
        const y = notificationTop + order * notificationStep
        return (
          <g key={message} className={styles.notification}>
            <rect x={34} y={y} width={132} height={28} rx={9} className={styles.card} />
            <circle cx={47} cy={y + 14} r={5} className={styles.appDot} />
            <text x={58} y={y + 17.2} className={styles.message}>
              {message}
            </text>
          </g>
        )
      })}
      <path
        d={`M${portX} ${portY + 70} C${portX} ${portY + 40} ${portX - 6} ${portY + 22} ${portX} ${portY + 6}`}
        pathLength={1}
        className={styles.cable}
      />
      <rect x={portX - 5} y={portY - 1} width={10} height={8} rx={2} className={styles.plug} />
      <circle cx={portX} cy={portY} r={8} pathLength={1} className={styles.chargeRing} />
    </svg>
  )
}
