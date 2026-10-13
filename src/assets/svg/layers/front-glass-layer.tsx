import { useId } from 'react'
import { layerViewBox, roundedRectPath } from '../phone-geometry'
import { layerShapes } from './layer-geometry'
import styles from './layers.module.scss'

export function FrontGlassLayer() {
  const sheenId = `${useId()}-sheen`

  return (
    <svg className={styles.layer} viewBox={layerViewBox} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={sheenId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0.28" className={styles.sheenOff} />
          <stop offset="0.4" className={styles.sheenOn} />
          <stop offset="0.52" className={styles.sheenOff} />
        </linearGradient>
      </defs>
      <path d={roundedRectPath(layerShapes.body)} className={styles.glass} />
      <path d={roundedRectPath(layerShapes.body)} fill={`url(#${sheenId})`} />
      <path d={roundedRectPath(layerShapes.island)} className={styles.island} />
    </svg>
  )
}
