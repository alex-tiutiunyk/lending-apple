import styles from './apple-bite.module.scss'

/**
 * The worm's bite (plan 7 §4): three small overlapping circles along the right edge, one per
 * chomp, so the notch reads as chewed and ragged. Not one clean round bite: the page is
 * unofficial, and a mark that reads as Apple's logo would be a trademark problem. Radii 2.3–2.6:
 * the plan's 1.6–1.9 left a one-pixel notch at the header's 1.4 rem.
 */
const chomps = [
  { cx: 19.8, cy: 9.2, r: 2.3 },
  { cx: 20.2, cy: 11.1, r: 2.6 },
  { cx: 19.7, cy: 13.0, r: 2.3 },
]
const wormSegments = [
  { cx: 18.3, cy: 11.2 },
  { cx: 20.5, cy: 10.4 },
  { cx: 22.7, cy: 10.9 },
]
const wormEyes = [
  { cx: 22.35, cy: 10.45 },
  { cx: 23.15, cy: 10.45 },
]

/** The mask for the body piece: white keeps the apple, each chomp circle cuts a piece out. */
export function AppleBiteMask({ id }: { id: string }) {
  return (
    <mask id={id}>
      <rect x="-2" y="-2" width="28" height="28" fill="white" />
      {chomps.map(({ cx, cy, r }) => (
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
