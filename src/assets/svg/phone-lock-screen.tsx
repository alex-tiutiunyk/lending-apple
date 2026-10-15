import { lockScreenCopy } from '@/content/copy'
import { useLocalClock } from '@/hooks/useLocalClock'
import { circlePath, front, roundedRectPath } from './phone-geometry'
import styles from './phone-render.module.scss'

const { screen } = front
const left = screen.x + 12
const right = screen.x + screen.width - 12
const centerX = screen.x + screen.width / 2
const actionY = screen.y + screen.height - 30
const signalBars = [0, 1, 2, 3].map((step) => ({
  x: right - 25 + step * 2.6,
  height: 1.6 + step * 1.1,
}))

/** The lock screen; date and time are the visitor's own once hydrated (plan 7 §10). */
export function PhoneLockScreen() {
  const clock = useLocalClock() ?? lockScreenCopy
  return (
    <g>
      {signalBars.map(({ x, height }) => (
        <rect
          key={x}
          x={x}
          y={screen.y + 12 - height}
          width={1.7}
          height={height}
          rx={0.4}
          className={styles.statusIcon}
        />
      ))}
      <path
        d={roundedRectPath({
          x: right - 12,
          y: screen.y + 7.4,
          width: 10.5,
          height: 4.8,
          radius: 1.4,
        })}
        className={styles.statusOutline}
      />
      <rect
        x={right - 11}
        y={screen.y + 8.4}
        width={6.4}
        height={2.8}
        rx={0.7}
        className={styles.statusIcon}
      />

      <text x={left} y={screen.y + 44} className={styles.lockDate}>
        {clock.date}
      </text>
      <text x={left - 1.5} y={screen.y + 82} className={styles.lockTime}>
        {clock.time}
      </text>

      <circle cx={left + 10} cy={actionY} r={10.5} className={styles.quickAction} />
      <path
        d={`M${left + 7} ${actionY - 5} h6 l-1.4 4 v6 h-3.2 v-6 Z`}
        className={styles.quickGlyph}
      />
      <circle cx={right - 10} cy={actionY} r={10.5} className={styles.quickAction} />
      <path d={circlePath(right - 10, actionY, 4.2)} className={styles.quickGlyphStroke} />
      <path
        d={roundedRectPath({
          x: centerX - 24,
          y: screen.y + screen.height - 8,
          width: 48,
          height: 2.4,
          radius: 1.2,
        })}
        className={styles.homeIndicator}
      />
    </g>
  )
}
