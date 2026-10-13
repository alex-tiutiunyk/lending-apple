import { layerViewBox, roundedRectPath } from '../phone-geometry'
import { boardOutline, layerShapes } from './layer-geometry'
import { TriPointScrew } from './small-parts'
import styles from './layers.module.scss'

const { chip } = layerShapes

const packages = [
  { name: 'memory', x: 64, y: 40, width: 26, height: 20 },
  { name: 'modem', x: 26, y: 128, width: 30, height: 26 },
  { name: 'power', x: 66, y: 78, width: 22, height: 18 },
]

const shields = [
  { x: 23, y: 34, width: 71, height: 66, radius: 5 },
  { x: 23, y: 122, width: 36, height: 38, radius: 4 },
]

const connectors = [
  { x: 28, y: 176, width: 26, height: 8 },
  { x: 28, y: 196, width: 18, height: 8 },
  { x: 72, y: 102, width: 20, height: 6 },
]

const passives = [
  { x: 30, y: 74, width: 6, height: 4 },
  { x: 40, y: 76, width: 4, height: 4 },
  { x: 48, y: 74, width: 8, height: 4 },
  { x: 30, y: 216, width: 10, height: 5 },
  { x: 44, y: 214, width: 5, height: 9 },
  { x: 30, y: 164, width: 6, height: 4 },
]

export function LogicBoardLayer() {
  return (
    <svg className={styles.layer} viewBox={layerViewBox} aria-hidden="true" focusable="false">
      <path d={boardOutline} className={styles.board} />
      {shields.map((shield) => (
        <path
          key={`${shield.x}:${shield.y}`}
          d={roundedRectPath(shield)}
          className={styles.shield}
        />
      ))}
      <path d={roundedRectPath(chip)} className={styles.chip} />
      <path
        d={roundedRectPath({ ...chip, x: chip.x + 5, y: chip.y + 5, width: 22, height: 22 })}
        className={styles.chipDie}
      />
      {packages.map(({ name, ...box }) => (
        <path key={name} d={roundedRectPath({ ...box, radius: 2 })} className={styles.chip} />
      ))}
      {connectors.map((part) => (
        <rect key={`${part.x}:${part.y}`} {...part} rx={1} className={styles.connector} />
      ))}
      {passives.map((part) => (
        <rect key={`${part.x}:${part.y}`} {...part} rx={1} className={styles.copper} />
      ))}
      <TriPointScrew slot={0} x={92} y={30} />
      <TriPointScrew slot={1} x={41} y={232} />
    </svg>
  )
}
