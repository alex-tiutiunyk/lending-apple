import type { Rig } from './mascotDescent'
import styles from './MascotRig.module.scss'

const parachuteLines = [
  [-14, -34, 9, 4],
  [10, -36, 17, 4],
  [38, -36, 31, 4],
  [62, -34, 39, 4],
] as const
const balloons = [
  { cx: 4, cy: -40, className: styles.balloonA },
  { cx: 24, cy: -54, className: styles.balloonB },
  { cx: 44, cy: -40, className: styles.balloonC },
] as const

function RigArt({ rig }: { rig: Rig }) {
  switch (rig) {
    case 'parachute':
      return (
        <g className={styles.canopy}>
          <path d="M-14 -34 Q24 -80 62 -34 Q24 -22 -14 -34 Z" className={styles.cloth} />
          {parachuteLines.map(([x1, y1, x2, y2]) => (
            <line key={x1} x1={x1} y1={y1} x2={x2} y2={y2} className={styles.line} />
          ))}
        </g>
      )
    case 'propeller':
      return (
        <g>
          <path d="M11 3 Q24 -10 37 3 Z" className={styles.beanie} />
          <line x1={24} y1={-8} x2={24} y2={-3} className={styles.line} />
          <rect x={2} y={-11} width={44} height={2.6} rx={1.3} className={styles.rotor} />
        </g>
      )
    case 'umbrella':
      return (
        <g className={styles.canopy}>
          <path
            d="M-10 -24 Q24 -58 58 -24 Q50 -30 41 -24 Q33 -30 24 -24 Q15 -30 7 -24 Q-1 -30 -10 -24 Z"
            className={styles.cloth}
          />
          <line x1={24} y1={-24} x2={24} y2={2} className={styles.line} />
        </g>
      )
    case 'balloons':
      return (
        <g>
          {balloons.map(({ cx, cy, className }) => (
            <g key={cx} className={`${styles.balloon} ${className}`}>
              <line x1={cx} y1={cy + 10} x2={24} y2={2} className={styles.line} />
              <ellipse cx={cx} cy={cy} rx={9} ry={10.5} />
            </g>
          ))}
        </g>
      )
    case 'glider':
      return (
        <g className={styles.wings}>
          <path d="M6 34 L-18 44 L6 46 Z" />
          <path d="M42 34 L66 44 L42 46 Z" />
        </g>
      )
    case 'leaf':
      return (
        <g className={styles.leaf}>
          <path d="M24 -2 C6 -22 8 -40 24 -46 C40 -40 42 -22 24 -2 Z" className={styles.cloth} />
          <line x1={24} y1={-4} x2={24} y2={-40} className={styles.line} />
        </g>
      )
    case 'bubble':
      return (
        <g className={styles.bubble}>
          <circle cx={24} cy={40} r={54} className={styles.film} />
          <path d="M-14 24 Q-12 2 10 -6" className={styles.shine} />
        </g>
      )
  }
}

/** The thing Pip comes down on (plan 5 §6), drawn in Pip's own 48 × 88 coordinates. */
export function MascotRig({ rig }: { rig: Rig }) {
  return (
    <svg
      className={styles.root}
      viewBox="0 0 48 88"
      aria-hidden="true"
      focusable="false"
      data-rig-art
    >
      <RigArt rig={rig} />
    </svg>
  )
}
