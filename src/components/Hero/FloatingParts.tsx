import type { ComponentType } from 'react'
import {
  BatteryCellPart,
  ChipPart,
  CrossScrew,
  LensPart,
  PentalobeScrew,
  SimTray,
  TriPointScrew,
} from '@/assets/svg/layers/small-parts'
import styles from './HeroExtras.module.scss'

type PartArt = ComponentType<{ slot: number; x: number; y: number }>

// Order matters: spots and sizes per order live in HeroExtras.module.scss
const floatingParts: { Art: PartArt; box: number }[] = [
  { Art: LensPart, box: 16 },
  { Art: PentalobeScrew, box: 7 },
  { Art: ChipPart, box: 20 },
  { Art: BatteryCellPart, box: 34 },
  { Art: TriPointScrew, box: 7 },
  { Art: SimTray, box: 32 },
  { Art: CrossScrew, box: 7 },
]

export function FloatingParts() {
  return floatingParts.map(({ Art, box }, order) => (
    <span key={order} className={styles.part} data-order={order}>
      <span className={styles.drift}>
        <svg className={styles.partArt} viewBox={`0 0 ${box} ${box}`} focusable="false">
          <Art slot={0} x={box / 2} y={box / 2} />
        </svg>
      </span>
    </span>
  ))
}
