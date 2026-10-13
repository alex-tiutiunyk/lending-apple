import { MascotFace } from './MascotFace'
import type { MascotExpression } from './mascotActs'
import styles from './Mascot.module.scss'

const backLenses = [
  { cx: 14.5, cy: 10.5 },
  { cx: 14.5, cy: 18 },
  { cx: 21.5, cy: 14.25 },
]

type MascotArtProps = {
  expression: MascotExpression
}

export function MascotArt({ expression }: MascotArtProps) {
  return (
    <svg className={styles.art} viewBox="0 0 48 88" aria-hidden="true" focusable="false">
      <g className={styles.legs}>
        <g className={`${styles.leg} ${styles.legLeft}`}>
          <path d="M18 66 V80" className={styles.limb} />
          <ellipse cx={16.5} cy={81} rx={3.4} ry={1.7} className={styles.foot} />
        </g>
        <g className={`${styles.leg} ${styles.legRight}`}>
          <path d="M30 66 V80" className={styles.limb} />
          <ellipse cx={31.5} cy={81} rx={3.4} ry={1.7} className={styles.foot} />
        </g>
      </g>
      <g className={styles.body}>
        <rect x={6} y={2} width={36} height={66} rx={9} className={styles.shell} />
        <g className={styles.front}>
          <rect x={8.5} y={4.5} width={31} height={61} rx={7} className={styles.screen} />
          <MascotFace expression={expression} />
        </g>
        <g className={styles.back}>
          <rect x={8.5} y={4.5} width={31} height={22} rx={6.5} className={styles.plateau} />
          {backLenses.map(({ cx, cy }) => (
            <circle key={`${cx}:${cy}`} cx={cx} cy={cy} r={3} className={styles.lens} />
          ))}
          <circle cx={33} cy={10} r={1.6} className={styles.flash} />
        </g>
        <g className={styles.battery}>
          <rect x={16} y={-12} width={14} height={7} rx={1.6} className={styles.batteryCase} />
          <rect
            x={17.4}
            y={-10.6}
            width={2.6}
            height={4.2}
            rx={0.6}
            className={styles.batteryLevel}
          />
          <rect
            x={30.4}
            y={-9.8}
            width={1.4}
            height={2.6}
            rx={0.5}
            className={styles.batteryCase}
          />
        </g>
      </g>
    </svg>
  )
}
