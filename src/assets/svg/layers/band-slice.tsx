import { layerViewBox, roundedRectPath } from '../phone-geometry'
import { layerShapes } from './layer-geometry'
import styles from './layers.module.scss'

/** One depth slice of the titanium band; a few of them stacked give the phone its edge. */
export function BandSlice() {
  return (
    <svg className={styles.layer} viewBox={layerViewBox} aria-hidden="true" focusable="false">
      <path d={roundedRectPath(layerShapes.body)} className={styles.bandSlice} />
    </svg>
  )
}
