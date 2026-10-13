import { useId, useRef, type ComponentType } from 'react'
import { BackGlassLayer } from '@/assets/svg/layers/back-glass-layer'
import { BatteryLayer } from '@/assets/svg/layers/battery-layer'
import { CameraLayer } from '@/assets/svg/layers/camera-layer'
import { DisplayLayer } from '@/assets/svg/layers/display-layer'
import { FrameLayer } from '@/assets/svg/layers/frame-layer'
import { FrontGlassLayer } from '@/assets/svg/layers/front-glass-layer'
import { LogicBoardLayer } from '@/assets/svg/layers/logic-board-layer'
import { RevealTitle } from '@/components/RevealTitle/RevealTitle'
import { explodedCopy } from '@/content/copy'
import { layers, type LayerId } from '@/content/specs'
import { useScrollProgress } from '@/hooks/useScrollProgress'
import styles from './ExplodedView.module.scss'

const layerArt: Record<LayerId, ComponentType> = {
  'back-glass': BackGlassLayer,
  frame: FrameLayer,
  camera: CameraLayer,
  battery: BatteryLayer,
  'logic-board': LogicBoardLayer,
  display: DisplayLayer,
  'front-glass': FrontGlassLayer,
}

const compactLayerIds: LayerId[] = layers.filter((layer) => layer.inCompactView).map(({ id }) => id)

const choreography = layers.map((layer, order) => {
  const compactOrder = compactLayerIds.indexOf(layer.id)
  return {
    ...layer,
    Art: layerArt[layer.id],
    order,
    compactOrder: compactOrder === -1 ? undefined : compactOrder,
  }
})

export function ExplodedView() {
  const titleId = useId()
  const sectionRef = useRef<HTMLElement>(null)
  useScrollProgress(sectionRef)

  return (
    <section
      ref={sectionRef}
      id="inside"
      className={styles.section}
      aria-labelledby={titleId}
      data-pinned
    >
      <div className={styles.stage} data-stage>
        <div className={styles.copy}>
          <RevealTitle id={titleId} className={styles.title} text={explodedCopy.title} />
          <p className={styles.intro}>{explodedCopy.intro}</p>
          <ol className={styles.labels} aria-label={explodedCopy.listLabel}>
            {choreography.map(({ id, name, detail, order, compactOrder }) => (
              <li
                key={id}
                className={styles.label}
                data-order={order}
                data-compact-order={compactOrder}
              >
                <span className={styles.layerName}>{name}</span>
                <span className={styles.layerDetail}>{detail}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className={styles.scene} aria-hidden="true" data-particles="gear">
          <div className={styles.stack}>
            {choreography.map(({ id, Art, order, compactOrder }) => (
              <div
                key={id}
                className={styles.layer}
                data-order={order}
                data-compact-order={compactOrder}
              >
                <Art />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
