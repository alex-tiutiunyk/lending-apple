import { useId } from 'react'
import { circlePath, layerViewBox, plateauPath, roundedRectPath } from '../phone-geometry'
import { layerShapes } from './layer-geometry'
import styles from './layers.module.scss'

const { body, plateau, plateauBottomRadius, glassWindow, magnetCenter } = layerShapes
const magnetSegments = Array.from({ length: 16 }, (_, index) => (index / 16) * Math.PI * 2)
const coilTurns = [9, 13, 17, 21]

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
      <path d={roundedRectPath(body)} fill={`url(#${shellId})`} />
      <path
        d={plateauPath(plateau, plateau.radius, plateauBottomRadius)}
        className={styles.plateauCutout}
      />
      <path d={roundedRectPath(glassWindow)} className={styles.glassWindow} />
      {magnetSegments.map((angle) => (
        <rect
          key={angle}
          x={magnetCenter.cx - 2.4}
          y={magnetCenter.cy - 36}
          width={4.8}
          height={7}
          rx={1}
          className={styles.magnet}
          transform={`rotate(${(angle * 180) / Math.PI} ${magnetCenter.cx} ${magnetCenter.cy})`}
        />
      ))}
      {coilTurns.map((radius) => (
        <path
          key={radius}
          d={circlePath(magnetCenter.cx, magnetCenter.cy, radius)}
          className={styles.coil}
        />
      ))}
    </svg>
  )
}
