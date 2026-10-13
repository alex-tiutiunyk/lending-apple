import { useId } from 'react'
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
import styles from './phone-render.module.scss'

type PhoneRenderProps = {
  view?: PhoneView
  label: string
  className?: string | undefined
  particles?: ParticleShape | undefined
}

export function PhoneRender({ view = 'both', label, className, particles }: PhoneRenderProps) {
  const id = useId()
  const shellId = `${id}-shell`
  const screenId = `${id}-screen`
  const glareId = `${id}-glare`
  const lensId = `${id}-lens`
  const titleId = `${id}-title`

  return (
    <svg
      className={className ? `${styles.render} ${className}` : styles.render}
      viewBox={phoneViewBoxes[view]}
      role="img"
      aria-labelledby={titleId}
      data-particles={particles}
    >
      <title id={titleId}>{label}</title>
      <defs>
        <linearGradient id={shellId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className={styles.shellLight} />
          <stop offset="0.55" className={styles.shellMid} />
          <stop offset="1" className={styles.shellDark} />
        </linearGradient>
        <linearGradient id={screenId} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" className={styles.screenA} />
          <stop offset="1" className={styles.screenB} />
        </linearGradient>
        <linearGradient id={glareId} x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0" className={styles.glareOn} />
          <stop offset="0.4" className={styles.glareOff} />
        </linearGradient>
        <radialGradient id={lensId} cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" className={styles.lensHighlight} />
          <stop offset="0.5" className={styles.lensDeep} />
        </radialGradient>
      </defs>

      {view !== 'back' && (
        <g>
          <path d={roundedRectPath(front.body)} fill={`url(#${shellId})`} />
          {front.buttons.map((button) => (
            <path key={button.name} d={roundedRectPath(button)} className={styles.button} />
          ))}
          <path d={roundedRectPath(front.band)} className={styles.bezel} />
          <path d={roundedRectPath(front.screen)} fill={`url(#${screenId})`} />
          <PhoneLockScreen />
          <path d={roundedRectPath(front.island)} className={styles.island} />
          <path d={roundedRectPath(front.earpiece)} className={styles.island} />
          <path d={roundedRectPath(front.screen)} fill={`url(#${glareId})`} />
        </g>
      )}

      {view !== 'front' && (
        <g>
          {back.buttons.map((button) => (
            <path key={button.name} d={roundedRectPath(button)} className={styles.button} />
          ))}
          <path d={roundedRectPath(back.body)} fill={`url(#${shellId})`} />
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
              <circle cx={cx} cy={cy} r={back.lensRadius - 3} fill={`url(#${lensId})`} />
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
    </svg>
  )
}
