import { useId } from 'react'
import { layerViewBox, roundedRectPath } from '../phone-geometry'
import { layerShapes } from './layer-geometry'
import styles from './layers.module.scss'

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
      <path d={roundedRectPath(layerShapes.band)} className={styles.panelEdge} />
      <path d={roundedRectPath(layerShapes.screen)} fill={`url(#${screenId})`} />
    </svg>
  )
}
