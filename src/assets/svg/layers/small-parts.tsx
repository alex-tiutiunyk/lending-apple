import styles from './layers.module.scss'

type PartProps = {
  slot: number
  x: number
  y: number
}

export function PentalobeScrew({ slot, x, y }: PartProps) {
  return (
    <g className={styles.part} data-part-slot={slot}>
      <circle cx={x} cy={y} r={2.6} className={styles.screwHead} />
      <path
        d={`M${x} ${y - 1.4} L${x + 1.3} ${y - 0.4} L${x + 0.8} ${y + 1.1} L${x - 0.8} ${y + 1.1} L${x - 1.3} ${y - 0.4} Z`}
        className={styles.screwDrive}
      />
    </g>
  )
}

export function TriPointScrew({ slot, x, y }: PartProps) {
  return (
    <g className={styles.part} data-part-slot={slot}>
      <circle cx={x} cy={y} r={2.8} className={styles.screwHead} />
      <path
        d={`M${x} ${y} V${y - 1.6} M${x} ${y} L${x + 1.4} ${y + 0.8} M${x} ${y} L${x - 1.4} ${y + 0.8}`}
        className={styles.screwSlot}
      />
    </g>
  )
}

export function CrossScrew({ slot, x, y }: PartProps) {
  return (
    <g className={styles.part} data-part-slot={slot}>
      <circle cx={x} cy={y} r={2.4} className={styles.screwHead} />
      <path
        d={`M${x - 1.2} ${y} H${x + 1.2} M${x} ${y - 1.2} V${y + 1.2}`}
        className={styles.screwSlot}
      />
    </g>
  )
}

type BracketProps = PartProps & {
  width: number
  height: number
}

export function Bracket({ slot, x, y, width, height }: BracketProps) {
  return (
    <g className={styles.part} data-part-slot={slot}>
      <rect x={x} y={y} width={width} height={height} rx={1.6} className={styles.bracket} />
      <circle cx={x + 3.2} cy={y + height / 2} r={1.2} className={styles.screwDrive} />
      <circle cx={x + width - 3.2} cy={y + height / 2} r={1.2} className={styles.screwDrive} />
    </g>
  )
}

export function AntennaClip({ slot, x, y }: PartProps) {
  return (
    <g className={styles.part} data-part-slot={slot}>
      <path
        d={`M${x - 3} ${y - 5} h6 v10 h-6 Z M${x - 1} ${y - 2} h2 v4 h-2 Z`}
        className={styles.clip}
        fillRule="evenodd"
      />
    </g>
  )
}
