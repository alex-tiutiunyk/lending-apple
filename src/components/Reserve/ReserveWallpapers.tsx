import { appleBodyPath, appleLeafPath } from '@/assets/svg/apple-mark-path'
import styles from './ReserveScreens.module.scss'

// Every wallpaper is drawn in the screen's own 146 × 316 space (`front.screen`), a few paths
// and gradients each, tinted by the finish through the CSS stop colours (plan 7 §9)
const viewBox = '0 0 146 316'
const stars = [
  [18, 40],
  [52, 22],
  [96, 58],
  [124, 30],
  [30, 110],
  [118, 132],
  [70, 150],
  [12, 190],
] as const
// The titanium macro: brushed hairlines in the spirit of the plan 5 scratches, at screen scale
const brushLines = [36, 62, 90, 118, 150, 178, 210, 236, 262, 290]

type WallProps = { id: string }

function Wall({ children }: { children: React.ReactNode }) {
  return (
    <svg className={styles.wall} viewBox={viewBox} preserveAspectRatio="xMidYMid slice">
      {children}
    </svg>
  )
}

export function AuroraWall({ id }: WallProps) {
  return (
    <Wall>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" className={styles.auroraA} />
          <stop offset="0.55" className={styles.auroraB} />
          <stop offset="1" className={styles.auroraC} />
        </linearGradient>
      </defs>
      <rect width="146" height="316" fill={`url(#${id})`} />
      <path
        d="M0 120 C40 90 90 150 146 110 V200 C90 230 50 170 0 210 Z"
        className={styles.auroraVeil}
      />
    </Wall>
  )
}

export function SunriseWall({ id }: WallProps) {
  return (
    <Wall>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className={styles.dawnHigh} />
          <stop offset="1" className={styles.dawnLow} />
        </linearGradient>
      </defs>
      <rect width="146" height="316" fill={`url(#${id})`} />
      <circle cx="96" cy="210" r="34" className={styles.sun} />
      <path d="M0 220 C40 190 80 200 146 230 V316 H0 Z" className={styles.hillFar} />
      <path d="M0 260 C50 230 100 250 146 240 V316 H0 Z" className={styles.hillNear} />
    </Wall>
  )
}

export function NightWall({ id }: WallProps) {
  return (
    <Wall>
      <defs>
        <mask id={id}>
          <rect width="146" height="316" fill="white" />
          <circle cx="104" cy="74" r="20" fill="black" />
        </mask>
      </defs>
      <rect width="146" height="316" className={styles.night} />
      {stars.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="0.9" className={styles.star} />
      ))}
      <circle cx="94" cy="80" r="22" className={styles.moon} mask={`url(#${id})`} />
    </Wall>
  )
}

export function AppleGlassWall({ id }: WallProps) {
  return (
    <Wall>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className={styles.glassOn} />
          <stop offset="0.5" className={styles.glassOff} />
        </linearGradient>
      </defs>
      <rect width="146" height="316" className={styles.night} />
      <g transform="translate(-13 66) scale(7)">
        <path d={appleBodyPath} className={styles.glassApple} />
        <path d={appleLeafPath} className={styles.glassApple} />
      </g>
      <rect width="146" height="316" fill={`url(#${id})`} />
    </Wall>
  )
}

export function TitaniumWall({ id }: WallProps) {
  return (
    <Wall>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0" className={styles.metalLight} />
          <stop offset="0.5" className={styles.metalMid} />
          <stop offset="1" className={styles.metalDark} />
        </linearGradient>
      </defs>
      <rect width="146" height="316" fill={`url(#${id})`} />
      {brushLines.map((y, index) => (
        <line
          key={y}
          x1={index % 2 ? 6 : 18}
          y1={y}
          x2={index % 2 ? 128 : 140}
          y2={y + (index % 3) - 1}
          className={styles.brush}
        />
      ))}
    </Wall>
  )
}
