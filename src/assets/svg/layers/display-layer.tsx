import { useId } from 'react'
import { front, layerViewBox, roundedRectPath } from '../phone-geometry'
import { PhoneLockScreen } from '../phone-lock-screen'
import { LayerLight } from './layer-light'
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
// The lock screen is drawn for the front view; this shifts it onto the layer's screen
const lockScreenShift = `translate(${screen.x - front.screen.x} ${screen.y - front.screen.y})`
const flexTail = `M70 ${screen.y + screen.height - 2} V${screen.y + screen.height + 6} H110 V${screen.y + screen.height - 2}`

export function DisplayLayer() {
  const id = useId()
  const screenId = `${id}-screen`
  const pixelsId = `${id}-pixels`

  return (
    <svg className={styles.layer} viewBox={layerViewBox} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={screenId} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" className={styles.screenA} />
          <stop offset="1" className={styles.screenB} />
        </linearGradient>
        <pattern id={pixelsId} width={1.6} height={1.6} patternUnits="userSpaceOnUse">
          <rect width={0.7} height={0.7} className={styles.pixel} />
        </pattern>
      </defs>
      <path d={flexTail} className={styles.flexTail} />
      <Bracket slot={0} x={72} y={screen.y + screen.height - 14} width={36} height={10} />
      <path d={roundedRectPath(band)} className={styles.panelEdge} />
      <path d={roundedRectPath(screen)} className={styles.panelOff} />
      <path d={roundedRectPath(screen)} fill={`url(#${pixelsId})`} />
      <g className={styles.screenWake}>
        <path d={roundedRectPath(screen)} fill={`url(#${screenId})`} />
        <g transform={lockScreenShift}>
          <PhoneLockScreen />
        </g>
      </g>
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
      <LayerLight box={band} />
    </svg>
  )
}
