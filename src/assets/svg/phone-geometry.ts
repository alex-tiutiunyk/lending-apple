export type Box = { x: number; y: number; width: number; height: number; radius: number }

export function roundedRectPath({ x, y, width, height, radius }: Box) {
  const right = x + width
  const bottom = y + height
  return [
    `M${x + radius} ${y}`,
    `H${right - radius}`,
    `A${radius} ${radius} 0 0 1 ${right} ${y + radius}`,
    `V${bottom - radius}`,
    `A${radius} ${radius} 0 0 1 ${right - radius} ${bottom}`,
    `H${x + radius}`,
    `A${radius} ${radius} 0 0 1 ${x} ${bottom - radius}`,
    `V${y + radius}`,
    `A${radius} ${radius} 0 0 1 ${x + radius} ${y}`,
    'Z',
  ].join(' ')
}

export function plateauPath({ x, y, width, height }: Box, topRadius: number, bottomRadius: number) {
  const right = x + width
  const bottom = y + height
  return [
    `M${x + topRadius} ${y}`,
    `H${right - topRadius}`,
    `A${topRadius} ${topRadius} 0 0 1 ${right} ${y + topRadius}`,
    `V${bottom - bottomRadius}`,
    `A${bottomRadius} ${bottomRadius} 0 0 1 ${right - bottomRadius} ${bottom}`,
    `H${x + bottomRadius}`,
    `A${bottomRadius} ${bottomRadius} 0 0 1 ${x} ${bottom - bottomRadius}`,
    `V${y + topRadius}`,
    `A${topRadius} ${topRadius} 0 0 1 ${x + topRadius} ${y}`,
    'Z',
  ].join(' ')
}

export function circlePath(cx: number, cy: number, r: number) {
  return `M${cx - r} ${cy} A${r} ${r} 0 1 1 ${cx + r} ${cy} A${r} ${r} 0 1 1 ${cx - r} ${cy} Z`
}

export function inset(box: Box, amount: number, radiusAmount = amount): Box {
  return {
    x: box.x + amount,
    y: box.y + amount,
    width: box.width - amount * 2,
    height: box.height - amount * 2,
    radius: box.radius - radiusAmount,
  }
}

const bodyWidth = 160
const bodyHeight = 330
const bodyRadius = 28
const viewTop = 15

function phoneAt(left: number, simTraySide: 'left' | 'right') {
  const body: Box = {
    x: left,
    y: viewTop,
    width: bodyWidth,
    height: bodyHeight,
    radius: bodyRadius,
  }
  const centerX = left + bodyWidth / 2
  const bottom = viewTop + bodyHeight
  const speakerSlot = (x: number): Box => ({ x, y: bottom - 3, width: 2.2, height: 2, radius: 0.8 })
  return {
    body,
    band: inset(body, 4),
    screen: inset(body, 7, 6),
    // Blueprint details (plan 4 §8) live with the geometry, so the render can draw them too
    port: { x: centerX - 9, y: bottom - 3.2, width: 18, height: 2.2, radius: 1.1 } as Box,
    speakerSlots: [0, 1, 2, 3].flatMap((step) => [
      speakerSlot(centerX + 14 + step * 5),
      speakerSlot(centerX - 16.2 - step * 5),
    ]),
    simTray: {
      x: simTraySide === 'left' ? left + 0.8 : left + bodyWidth - 3,
      y: viewTop + 181,
      width: 2.2,
      height: 20,
      radius: 1,
    } as Box,
    topAntennaBreaks: [
      { x: left + 50, y: viewTop, width: 1.6, height: 4, radius: 0.6 },
      { x: left + bodyWidth - 52, y: viewTop, width: 1.6, height: 4, radius: 0.6 },
    ] as Box[],
    antennaBreaks: [
      { x: left, y: viewTop + 46, width: 4, height: 1.6, radius: 0.6 },
      { x: left, y: viewTop + bodyHeight - 48, width: 4, height: 1.6, radius: 0.6 },
      { x: left + bodyWidth - 4, y: viewTop + 46, width: 4, height: 1.6, radius: 0.6 },
      { x: left + bodyWidth - 4, y: viewTop + bodyHeight - 48, width: 4, height: 1.6, radius: 0.6 },
      { x: left + 50, y: viewTop + bodyHeight - 4, width: 1.6, height: 4, radius: 0.6 },
      { x: left + bodyWidth - 52, y: viewTop + bodyHeight - 4, width: 1.6, height: 4, radius: 0.6 },
    ],
  }
}

const frontPhone = phoneAt(20, 'left')

export const front = {
  ...frontPhone,
  statusBarY: frontPhone.screen.y + 16,
  homeIndicator: {
    x: frontPhone.screen.x + frontPhone.screen.width / 2 - 22,
    y: frontPhone.screen.y + frontPhone.screen.height - 10,
    width: 44,
    height: 2.2,
    radius: 1.1,
  } as Box,
  island: { x: 79, y: 28, width: 42, height: 12, radius: 6 },
  earpiece: { x: 88, y: 19.6, width: 24, height: 1.6, radius: 0.8 },
  buttons: [
    { name: 'action', x: 16.5, y: 78, width: 3.5, height: 16, radius: 1.5 },
    { name: 'volume-up', x: 16.5, y: 108, width: 3.5, height: 30, radius: 1.5 },
    { name: 'volume-down', x: 16.5, y: 144, width: 3.5, height: 30, radius: 1.5 },
    { name: 'side', x: 180, y: 120, width: 3.5, height: 46, radius: 1.5 },
    { name: 'camera-control', x: 180, y: 218, width: 3.5, height: 26, radius: 1.5 },
  ],
}

export const back = {
  ...phoneAt(220, 'right'),
  plateau: { x: 225, y: 20, width: 150, height: 84, radius: 23 },
  plateauBottomRadius: 10,
  lenses: [
    { name: 'ultra-wide', cx: 249, cy: 43 },
    { name: 'main', cx: 249, cy: 81 },
    { name: 'periscope', cx: 282, cy: 62 },
  ],
  lensRadius: 13.5,
  lensGlassRadius: 7,
  flash: { cx: 352, cy: 40, r: 4.2 },
  microphone: { cx: 352, cy: 60, r: 1.6 },
  depthSensor: { cx: 352, cy: 82, r: 5 },
  glassWindow: { x: 229, y: 112, width: 142, height: 224, radius: 20 },
  mark: { x: 300, y: 224, size: 46 },
  buttons: [
    { name: 'side', x: 216.5, y: 120, width: 3.5, height: 46, radius: 1.5 },
    { name: 'camera-control', x: 216.5, y: 218, width: 3.5, height: 26, radius: 1.5 },
    { name: 'action', x: 380, y: 78, width: 3.5, height: 16, radius: 1.5 },
    { name: 'volume-up', x: 380, y: 108, width: 3.5, height: 30, radius: 1.5 },
    { name: 'volume-down', x: 380, y: 144, width: 3.5, height: 30, radius: 1.5 },
  ],
}

export const phoneViewBoxes = {
  both: '8 8 384 344',
  front: '10 8 180 344',
  back: '210 8 180 344',
} as const

export type PhoneView = keyof typeof phoneViewBoxes

export const layerViewBox = '0 0 180 360'

export const layerBody: Box = {
  x: 10,
  y: 15,
  width: bodyWidth,
  height: bodyHeight,
  radius: bodyRadius,
}
