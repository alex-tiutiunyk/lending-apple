import { layerViewBox, roundedRectPath } from '../phone-geometry'
import { layerShapes } from './layer-geometry'
import styles from './layers.module.scss'

const { battery } = layerShapes
const cellSeams = [0.34, 0.67].map((share) => battery.y + battery.height * share)

export function BatteryLayer() {
  return (
    <svg className={styles.layer} viewBox={layerViewBox} aria-hidden="true" focusable="false">
      <path d={roundedRectPath(battery)} className={styles.cell} />
      {cellSeams.map((y) => (
        <line
          key={y}
          x1={battery.x + 10}
          x2={battery.x + battery.width - 10}
          y1={y}
          y2={y}
          className={styles.seam}
        />
      ))}
      <rect
        x={battery.x + battery.width / 2 - 14}
        y={battery.y - 6}
        width={28}
        height={8}
        rx={2}
        className={styles.copper}
      />
    </svg>
  )
}
