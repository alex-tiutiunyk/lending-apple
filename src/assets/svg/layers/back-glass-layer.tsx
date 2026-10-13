import { useId } from 'react'
import { layerViewBox, roundedRectPath } from '../phone-geometry'
import { layerShapes } from './layer-geometry'
import styles from './layers.module.scss'

export function BackGlassLayer() {
  const shellId = `${useId()}-shell`

  return (
    <svg className={styles.layer} viewBox={layerViewBox} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={shellId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className={styles.shellLight} />
          <stop offset="0.6" className={styles.shellMid} />
          <stop offset="1" className={styles.shellDark} />
        </linearGradient>
      </defs>
      <path d={roundedRectPath(layerShapes.body)} fill={`url(#${shellId})`} />
      <path d={roundedRectPath(layerShapes.plateau)} className={styles.plateauCutout} />
    </svg>
  )
}
