import { layerViewBox, roundedRectPath } from '../phone-geometry'
import { layerShapes } from './layer-geometry'
import styles from './layers.module.scss'

export function FrameLayer() {
  return (
    <svg className={styles.layer} viewBox={layerViewBox} aria-hidden="true" focusable="false">
      <path d={roundedRectPath(layerShapes.band)} className={styles.band} />
      <path d={roundedRectPath(layerShapes.body)} className={styles.bandEdge} />
    </svg>
  )
}
