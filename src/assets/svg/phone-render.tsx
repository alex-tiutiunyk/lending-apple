import { useId, type ReactNode, type Ref } from 'react'
import type { ParticleShape } from '@/components/Backdrop/particleShapes'
import { appleBodyPath, appleLeafPath, appleMarkViewBox } from './apple-mark-path'
import { PhoneLockScreen } from './phone-lock-screen'
import {
  back,
  front,
  phoneViewBoxes,
  plateauPath,
  roundedRectPath,
  type PhoneView,
} from './phone-geometry'
import { PhoneRenderDefs } from './phone-render-defs'
import { renderIds } from './phone-render-ids'
import styles from './phone-render.module.scss'

type PhoneRenderProps = {
  view?: PhoneView
  label: string
  className?: string | undefined
  particles?: ParticleShape | undefined
  /** The host may write a finish preview onto the element (plan 5 §10). */
  ref?: Ref<SVGSVGElement>
  /** Overlays in phone coordinates, drawn after the phone (plan 5 §11). */
  children?: ReactNode
}

export function PhoneRender({
  view = 'both',
  label,
  className,
  particles,
  ref,
  children,
}: PhoneRenderProps) {
  const id = useId()
  const ids = renderIds(id)
  const titleId = `${id}-title`

  return (
    <svg
      ref={ref}
      className={className ? `${styles.root} ${className}` : styles.root}
      viewBox={phoneViewBoxes[view]}
      role="img"
      aria-labelledby={titleId}
      data-particles={particles}
    >
      <title id={titleId}>{label}</title>
      <PhoneRenderDefs ids={ids} />

      {view !== 'back' && (
        <g>
          <path d={roundedRectPath(front.body)} fill={`url(#${ids.shell})`} />
          {front.buttons.map((button) => (
            <path key={button.name} d={roundedRectPath(button)} className={styles.button} />
          ))}
          <path d={roundedRectPath(front.band)} className={styles.bezel} />
          <path d={roundedRectPath(front.screen)} fill={`url(#${ids.screen})`} />
          <PhoneLockScreen />
          <path d={roundedRectPath(front.island)} className={styles.island} />
          <path d={roundedRectPath(front.earpiece)} className={styles.island} />
          <path d={roundedRectPath(front.screen)} fill={`url(#${ids.glare})`} />
        </g>
      )}

      {view !== 'front' && (
        <g>
          {back.buttons.map((button) => (
            <path key={button.name} d={roundedRectPath(button)} className={styles.button} />
          ))}
          <path d={roundedRectPath(back.body)} fill={`url(#${ids.shell})`} />
          <path d={roundedRectPath(back.band)} className={styles.backGlass} />
          <path d={roundedRectPath(back.glassWindow)} className={styles.glassWindow} />
          <svg
            x={back.mark.x - back.mark.size / 2}
            y={back.mark.y - back.mark.size / 2}
            width={back.mark.size}
            height={back.mark.size}
            viewBox={appleMarkViewBox}
            className={styles.mark}
          >
            <path d={appleBodyPath} />
            <path d={appleLeafPath} />
          </svg>
          <path
            d={plateauPath(back.plateau, back.plateau.radius, back.plateauBottomRadius)}
            className={styles.plateau}
          />
          {back.lenses.map(({ name, cx, cy }) => (
            <g key={name}>
              <circle cx={cx} cy={cy} r={back.lensRadius} className={styles.lensRing} />
              <circle cx={cx} cy={cy} r={back.lensRadius - 3} fill={`url(#${ids.lens})`} />
            </g>
          ))}
          <circle cx={back.flash.cx} cy={back.flash.cy} r={back.flash.r} className={styles.flash} />
          <circle
            cx={back.microphone.cx}
            cy={back.microphone.cy}
            r={back.microphone.r}
            className={styles.island}
          />
          <circle
            cx={back.depthSensor.cx}
            cy={back.depthSensor.cy}
            r={back.depthSensor.r}
            className={styles.depthSensor}
          />
        </g>
      )}

      {children}
    </svg>
  )
}
