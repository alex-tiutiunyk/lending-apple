import { useId } from 'react'
import { layerViewBox, roundedRectPath } from '../phone-geometry'
import { LayerLight } from './layer-light'
import { layerShapes } from './layer-geometry'
import styles from './layers.module.scss'

const { body } = layerShapes

export function FrontGlassLayer() {
  const id = useId()
  const reflectionId = `${id}-reflection`
  const glintId = `${id}-glint`
  const clipId = `${id}-clip`

  return (
    <svg className={styles.layer} viewBox={layerViewBox} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={reflectionId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0.3" className={styles.sheenOff} />
          <stop offset="0.36" className={styles.sheenOn} />
          <stop offset="0.42" className={styles.sheenOff} />
        </linearGradient>
        <linearGradient id={glintId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" className={styles.sheenOff} />
          <stop offset="0.5" className={styles.glintOn} />
          <stop offset="1" className={styles.sheenOff} />
        </linearGradient>
        <clipPath id={clipId}>
          <path d={roundedRectPath(body)} />
        </clipPath>
      </defs>
      <path d={roundedRectPath(body)} className={styles.glass} />
      <path d={roundedRectPath(body)} fill={`url(#${reflectionId})`} />
      <g clipPath={`url(#${clipId})`}>
        <rect
          x={body.x - 60}
          y={body.y - 40}
          width={44}
          height={body.height + 80}
          fill={`url(#${glintId})`}
          className={styles.glint}
        />
      </g>
      <LayerLight box={body} strength="strong" />
    </svg>
  )
}
