import { useRef, type ComponentType } from 'react'
import { BackGlassLayer } from '@/assets/svg/layers/back-glass-layer'
import { BatteryLayer } from '@/assets/svg/layers/battery-layer'
import { CameraLayer } from '@/assets/svg/layers/camera-layer'
import { DisplayLayer } from '@/assets/svg/layers/display-layer'
import { FrameLayer } from '@/assets/svg/layers/frame-layer'
import { FrontGlassLayer } from '@/assets/svg/layers/front-glass-layer'
import { LogicBoardLayer } from '@/assets/svg/layers/logic-board-layer'
import { explodedCopy } from '@/content/copy'
import { layers, type LayerId } from '@/content/specs'
import { useScrollProgress } from '@/hooks/useScrollProgress'
import styles from './ExplodedView.module.scss'

const layerArt: Record<LayerId, ComponentType> = {
  'back-glass': BackGlassLayer,
  frame: FrameLayer,
  battery: BatteryLayer,
  'logic-board': LogicBoardLayer,
  camera: CameraLayer,
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
  const sectionRef = useRef<HTMLElement>(null)
  useScrollProgress(sectionRef)

  return (
    <section
      ref={sectionRef}
      id="inside"
      className={styles.section}
      aria-labelledby="inside-title"
      data-pinned
    >
      <div className={styles.stage} data-stage>
        <div className={styles.copy}>
          <h2 id="inside-title" className={styles.title}>
            {explodedCopy.title}
          </h2>
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
        <div className={styles.scene} aria-hidden="true">
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
