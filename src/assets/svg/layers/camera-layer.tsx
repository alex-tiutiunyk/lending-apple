import { useId } from 'react'
import { layerViewBox, plateauPath, roundedRectPath } from '../phone-geometry'
import { layerShapes } from './layer-geometry'
import { CrossScrew } from './small-parts'
import styles from './layers.module.scss'

const { plateau, plateauBottomRadius, lenses, flash, depthSensor } = layerShapes
const housingSize = 30
const flexCables = [
  'M141 96 C141 116 118 112 110 132',
  'M108 76 C104 104 96 108 92 132',
  'M38 88 C40 108 70 110 74 132',
]

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
      {flexCables.map((d) => (
        <path key={d} d={d} className={styles.flex} />
      ))}
      <path
        d={plateauPath(plateau, plateau.radius, plateauBottomRadius)}
        className={styles.plateau}
      />
      {lenses.map(({ name, cx, cy }) => (
        <g key={name}>
          <path
            d={roundedRectPath({
              x: cx - housingSize / 2,
              y: cy - housingSize / 2,
              width: housingSize,
              height: housingSize,
              radius: 5,
            })}
            className={styles.sensorHousing}
          />
          <circle cx={cx} cy={cy} r={13} className={styles.lensRing} />
          <circle cx={cx} cy={cy} r={9.5} fill={`url(#${lensId})`} />
          <circle cx={cx} cy={cy} r={4} className={styles.lensBarrel} />
        </g>
      ))}
      <circle cx={flash.cx} cy={flash.cy} r={flash.r} className={styles.flash} />
      <circle
        cx={depthSensor.cx}
        cy={depthSensor.cy}
        r={depthSensor.r}
        className={styles.depthSensor}
      />
      <CrossScrew slot={0} x={62} y={96} />
      <CrossScrew slot={1} x={158} y={96} />
    </svg>
  )
}
