import { layerViewBox, roundedRectPath } from '../phone-geometry'
import { layerShapes } from './layer-geometry'
import styles from './layers.module.scss'

export function FrontGlassLayer() {
  return (
    <svg className={styles.layer} viewBox={layerViewBox} aria-hidden="true" focusable="false">
      <path d={roundedRectPath(layerShapes.body)} className={styles.glass} />
      <path d={roundedRectPath(layerShapes.island)} className={styles.island} />
    </svg>
  )
}
