import { leftChomps } from './apple-bite-chomps'
import styles from './apple-bite.module.scss'

// The worm comes out of the left notch at about (4.6, 10.6) and leans to the left (plan 9 §2,
// the plan 8 worm mirrored about x = 12)
const wormSegments = [
  { cx: 4.6, cy: 10.7 },
  { cx: 2.5, cy: 10.1 },
  { cx: 0.6, cy: 10.5 },
]
const wormEyes = [
  { cx: 0.95, cy: 10.05 },
  { cx: 0.15, cy: 10.05 },
]

/**
 * The mask for the body piece: white keeps the apple, each chomp circle cuts a piece out of the
 * left side. The right bite is in the path itself (plan 9 §1) and needs no circle.
 */
export function AppleBiteMask({ id }: { id: string }) {
  return (
    <mask id={id}>
      <rect x="-2" y="-2" width="28" height="28" fill="white" />
      {leftChomps.map(({ cx, cy, r }) => (
        <circle key={cx + cy} className={styles.chomp} cx={cx} cy={cy} r={r} fill="black" />
      ))}
    </mask>
  )
}

/** Three segments and two eyes in the accent colour; it pushes out of the bite and back in. */
export function AppleWorm() {
  return (
    <g className={styles.worm}>
      {wormSegments.map(({ cx, cy }) => (
        <circle key={cx} cx={cx} cy={cy} r={1.4} />
      ))}
      <g className={styles.wormEyes}>
        {wormEyes.map(({ cx, cy }) => (
          <circle key={cx} cx={cx} cy={cy} r={0.35} />
        ))}
      </g>
    </g>
  )
}
