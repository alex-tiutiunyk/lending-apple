import {
  back,
  circlePath,
  front,
  inset,
  plateauPath,
  roundedRectPath,
  type Box,
} from './phone-geometry'

export type PartPaths = Record<string, string[]>

function linePath(x1: number, y1: number, x2: number, y2: number) {
  return `M${x1} ${y1} L${x2} ${y2}`
}

function bodyParts(side: typeof front | typeof back) {
  return [roundedRectPath(side.body), roundedRectPath(side.band)]
}

/** Today's outline: the parts the line draw and the hero have always drawn. */
export const plainParts = {
  front: {
    body: bodyParts(front),
    screen: [roundedRectPath(front.screen)],
    island: [roundedRectPath(front.island)],
    buttons: front.buttons.map(roundedRectPath),
    details: [roundedRectPath(front.earpiece), ...front.antennaBreaks.map(roundedRectPath)],
  },
  back: {
    body: bodyParts(back),
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
  },
} satisfies Record<string, PartPaths>

// Blueprint extras (plan 4 §8): generated from the same geometry, so they stay aligned

/** Construction lines, drawn first and quietest: axes, a dimension line with ticks, radius marks. */
function guides(body: Box) {
  const { x, y, width, height, radius } = body
  const right = x + width
  const bottom = y + height
  const centerX = x + width / 2
  const centerY = y + height / 2
  const dimensionY = y - 6
  return [
    linePath(centerX, y - 4, centerX, bottom + 4),
    linePath(x - 4, centerY, right + 4, centerY),
    linePath(x, dimensionY, right, dimensionY),
    linePath(x, dimensionY - 2.5, x, dimensionY + 2.5),
    linePath(right, dimensionY - 2.5, right, dimensionY + 2.5),
    circlePath(x + radius, y + radius, radius),
    circlePath(right - radius, y + radius, radius),
  ]
}

/** Port, speaker slots, the top antenna breaks and the SIM tray on the body edge. */
function edgeDetails(side: typeof front | typeof back) {
  return [side.port, ...side.speakerSlots, ...side.topAntennaBreaks, side.simTray].map(
    roundedRectPath,
  )
}

function innerBody(side: typeof front | typeof back) {
  return [roundedRectPath(inset(side.body, 2, 2)), roundedRectPath(inset(side.band, 1.5, 1.5))]
}

function innerButtons(buttons: readonly Box[]) {
  return buttons.map((button) => roundedRectPath(inset(button, 0.8, 0.5)))
}

const { screen, statusBarY } = front

export const blueprintParts = {
  front: {
    guides: guides(front.body),
    body: [...plainParts.front.body, ...innerBody(front)],
    screen: [
      ...plainParts.front.screen,
      roundedRectPath(inset(screen, 2.5)),
      linePath(screen.x + 6, statusBarY, screen.x + screen.width - 6, statusBarY),
      roundedRectPath(front.homeIndicator),
    ],
    island: plainParts.front.island,
    buttons: [...plainParts.front.buttons, ...innerButtons(front.buttons)],
    details: [...plainParts.front.details, ...edgeDetails(front)],
  },
  back: {
    guides: guides(back.body),
    body: [...plainParts.back.body, ...innerBody(back)],
    camera: [
      ...plainParts.back.camera,
      plateauPath(inset(back.plateau, 3, 3), back.plateau.radius - 3, back.plateauBottomRadius - 3),
      ...back.lenses.map(({ cx, cy }) => circlePath(cx, cy, back.lensRadius - 3)),
      ...back.lenses.map(({ cx, cy }) => circlePath(cx, cy, back.lensGlassRadius - 2.5)),
      circlePath(back.flash.cx, back.flash.cy, back.flash.r - 1.6),
      circlePath(back.microphone.cx, back.microphone.cy, back.microphone.r + 1.2),
    ],
    buttons: [...plainParts.back.buttons, ...innerButtons(back.buttons)],
    details: [
      ...plainParts.back.details,
      roundedRectPath(inset(back.glassWindow, 3)),
      ...edgeDetails(back),
    ],
  },
} satisfies Record<string, PartPaths>

/** Paths that get a bright "drawing head" while they draw: the main contour and the lens rings. */
export const blueprintHeads = {
  front: { body: [roundedRectPath(front.body)] },
  back: {
    body: [roundedRectPath(back.body)],
    camera: back.lenses.map(({ cx, cy }) => circlePath(cx, cy, back.lensRadius)),
  },
} satisfies Record<string, PartPaths>
