import { useId } from 'react'
import { layerViewBox, roundedRectPath } from '../phone-geometry'
import { layerShapes } from './layer-geometry'
import { Bracket } from './small-parts'
import styles from './layers.module.scss'

const { band, screen, island, earpiece } = layerShapes
const faceSensors = [
  { cx: island.x + 7, r: 2.6 },
  { cx: island.x + 15, r: 1.4 },
  { cx: island.x + island.width - 14, r: 1.8 },
  { cx: island.x + island.width - 7, r: 2.6 },
]
const flexTail = `M70 ${screen.y + screen.height - 2} V${screen.y + screen.height + 6} H110 V${screen.y + screen.height - 2}`

export function DisplayLayer() {
  const screenId = `${useId()}-screen`

  return (
    <svg className={styles.layer} viewBox={layerViewBox} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={screenId} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" className={styles.screenA} />
          <stop offset="1" className={styles.screenB} />
        </linearGradient>
      </defs>
      <path d={flexTail} className={styles.flexTail} />
      <path d={roundedRectPath(band)} className={styles.panelEdge} />
      <path d={roundedRectPath(screen)} fill={`url(#${screenId})`} />
      <path d={roundedRectPath(island)} className={styles.island} />
      {faceSensors.map(({ cx, r }) => (
        <circle
          key={cx}
          cx={cx}
          cy={island.y + island.height / 2}
          r={r}
          className={styles.sensor}
        />
      ))}
      <path d={roundedRectPath(earpiece)} className={styles.earpiece} />
      <Bracket slot={0} x={72} y={screen.y + screen.height - 14} width={36} height={10} />
    </svg>
  )
}
