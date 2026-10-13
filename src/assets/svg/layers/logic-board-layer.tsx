import { layerViewBox, roundedRectPath } from '../phone-geometry'
import { layerShapes } from './layer-geometry'
import styles from './layers.module.scss'

const { board, chip } = layerShapes

const passives = [
  { x: 30, y: 38, width: 10, height: 6 },
  { x: 44, y: 38, width: 6, height: 6 },
  { x: 58, y: 38, width: 14, height: 6 },
  { x: 30, y: 100, width: 18, height: 8 },
  { x: 54, y: 100, width: 8, height: 14 },
  { x: 66, y: 104, width: 8, height: 6 },
]

export function LogicBoardLayer() {
  return (
    <svg className={styles.layer} viewBox={layerViewBox} aria-hidden="true" focusable="false">
      <path d={roundedRectPath(board)} className={styles.board} />
      <path d={roundedRectPath(chip)} className={styles.chip} />
      <path
        d={roundedRectPath({ ...chip, x: chip.x + 6, y: chip.y + 6, width: 24, height: 24 })}
        className={styles.chipDie}
      />
      {passives.map((part) => (
        <rect key={`${part.x}:${part.y}`} {...part} rx={1.5} className={styles.copper} />
      ))}
    </svg>
  )
}
