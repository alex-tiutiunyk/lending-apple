import { useId } from 'react'
import { layerViewBox, roundedRectPath } from '../phone-geometry'
import { layerShapes } from './layer-geometry'
import styles from './layers.module.scss'

export function CameraLayer() {
  const lensId = `${useId()}-lens`

  return (
    <svg className={styles.layer} viewBox={layerViewBox} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={lensId} cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" className={styles.lensHighlight} />
          <stop offset="0.55" className={styles.lensDeep} />
        </radialGradient>
      </defs>
      <path d={roundedRectPath(layerShapes.plateau)} className={styles.plateau} />
      {layerShapes.lenses.map(({ name, cx, cy }) => (
        <g key={name}>
          <circle cx={cx} cy={cy} r={13.5} className={styles.lensRing} />
          <circle cx={cx} cy={cy} r={10} fill={`url(#${lensId})`} />
        </g>
      ))}
    </svg>
  )
}
