import {
  back,
  circlePath,
  front,
  phoneViewBoxes,
  plateauPath,
  roundedRectPath,
  type PhoneView,
} from './phone-geometry'
import styles from './phone-outline.module.scss'

const frontParts = {
  body: [roundedRectPath(front.body), roundedRectPath(front.band)],
  screen: [roundedRectPath(front.screen)],
  island: [roundedRectPath(front.island)],
  buttons: front.buttons.map(roundedRectPath),
  details: [roundedRectPath(front.earpiece), ...front.antennaBreaks.map(roundedRectPath)],
}

const backParts = {
  body: [roundedRectPath(back.body), roundedRectPath(back.band)],
  camera: [
    plateauPath(back.plateau, back.plateau.radius, back.plateauBottomRadius),
    ...back.lenses.map(({ cx, cy }) => circlePath(cx, cy, back.lensRadius)),
    ...back.lenses.map(({ cx, cy }) => circlePath(cx, cy, back.lensGlassRadius)),
    circlePath(back.flash.cx, back.flash.cy, back.flash.r),
    circlePath(back.microphone.cx, back.microphone.cy, back.microphone.r),
    circlePath(back.depthSensor.cx, back.depthSensor.cy, back.depthSensor.r),
  ],
  buttons: back.buttons.map(roundedRectPath),
  details: [roundedRectPath(back.glassWindow), ...back.antennaBreaks.map(roundedRectPath)],
}

type PartPaths = Record<string, string[]>

function PartGroups({ parts }: { parts: PartPaths }) {
  return Object.entries(parts).map(([part, paths]) => (
    <g key={part} data-part={part}>
      {paths.map((d) => (
        <path key={d} d={d} pathLength={1} />
      ))}
    </g>
  ))
}

type PhoneOutlineProps = {
  view?: PhoneView
  className?: string | undefined
}

export function PhoneOutline({ view = 'both', className }: PhoneOutlineProps) {
  return (
    <svg
      className={className ? `${styles.outline} ${className}` : styles.outline}
      viewBox={phoneViewBoxes[view]}
      aria-hidden="true"
      focusable="false"
    >
      {view !== 'back' && <PartGroups parts={frontParts} />}
      {view !== 'front' && <PartGroups parts={backParts} />}
    </svg>
  )
}
