import { useId } from 'react'
import { inset, roundedRectPath, type Box } from '../phone-geometry'
import styles from './layers.module.scss'

type LayerLightProps = {
  box: Box
  strength?: 'soft' | 'strong'
}

/** One light from the top left for every layer: a bright upper edge and a darker lower edge. */
export function LayerLight({ box, strength = 'soft' }: LayerLightProps) {
  const lightId = `${useId()}-light`

  return (
    <>
      <defs>
        <linearGradient id={lightId} x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0" className={styles.lightTop} />
          <stop offset="0.4" className={styles.lightNone} />
          <stop offset="1" className={styles.lightBottom} />
        </linearGradient>
      </defs>
      <path
        d={roundedRectPath(inset(box, 0.6))}
        className={strength === 'strong' ? styles.lightEdgeStrong : styles.lightEdge}
        stroke={`url(#${lightId})`}
      />
    </>
  )
}
