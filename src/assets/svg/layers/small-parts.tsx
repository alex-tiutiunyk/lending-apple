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

export function LensPart({ slot, x, y }: PartProps) {
  return (
    <g className={styles.part} data-part-slot={slot}>
      <circle cx={x} cy={y} r={7} className={styles.lensRing} />
      <circle cx={x} cy={y} r={4.2} className={styles.lensGlass} />
      <circle cx={x - 1.4} cy={y - 1.4} r={1.1} className={styles.lensGlint} />
    </g>
  )
}

export function ChipPart({ slot, x, y }: PartProps) {
  const pins = [-4, -1.3, 1.3, 4]
  return (
    <g className={styles.part} data-part-slot={slot}>
      {pins.map((offset) => (
        <path
          key={offset}
          d={`M${x - 9} ${y + offset} H${x + 9} M${x + offset} ${y - 9} V${y + 9}`}
          className={styles.pin}
        />
      ))}
      <rect x={x - 7} y={y - 7} width={14} height={14} rx={1.4} className={styles.chip} />
      <rect x={x - 4} y={y - 4} width={8} height={8} rx={0.8} className={styles.chipDie} />
    </g>
  )
}

export function BatteryCellPart({ slot, x, y }: PartProps) {
  return (
    <g className={styles.part} data-part-slot={slot}>
      <rect x={x - 8} y={y - 13} width={16} height={26} rx={2.4} className={styles.cell} />
      <rect x={x - 5} y={y - 6} width={10} height={7} rx={0.8} className={styles.cellLabel} />
      <rect x={x - 3} y={y + 13} width={6} height={3} rx={0.8} className={styles.clip} />
    </g>
  )
}

export function SimTray({ slot, x, y }: PartProps) {
  return (
    <g className={styles.part} data-part-slot={slot}>
      <path
        d={`M${x - 14} ${y - 4} h26 a2 2 0 0 1 2 2 v4 a2 2 0 0 1 -2 2 h-26 Z M${x - 9} ${y - 2.4} h12 l2 2 v1.4 a1 1 0 0 1 -1 1 h-13 Z`}
        className={styles.bracket}
        fillRule="evenodd"
      />
      <circle cx={x + 10.5} cy={y} r={0.9} className={styles.screwDrive} />
    </g>
  )
}
