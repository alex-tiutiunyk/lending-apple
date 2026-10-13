type Box = { x: number; y: number; width: number; height: number; radius: number }

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

function phoneAt(left: number) {
  const body: Box = {
    x: left,
    y: viewTop,
    width: bodyWidth,
    height: bodyHeight,
    radius: bodyRadius,
  }
  return {
    body,
    band: inset(body, 4),
    screen: inset(body, 9, 8),
  }
}

export const front = {
  ...phoneAt(20),
  island: { x: 78, y: 31, width: 44, height: 13, radius: 6.5 },
  buttons: [
    { name: 'action', x: 16.5, y: 78, width: 3.5, height: 16, radius: 1.5 },
    { name: 'volume-up', x: 16.5, y: 108, width: 3.5, height: 30, radius: 1.5 },
    { name: 'volume-down', x: 16.5, y: 144, width: 3.5, height: 30, radius: 1.5 },
    { name: 'side', x: 180, y: 120, width: 3.5, height: 46, radius: 1.5 },
    { name: 'camera-control', x: 180, y: 218, width: 3.5, height: 26, radius: 1.5 },
  ],
}

export const back = {
  ...phoneAt(220),
  plateau: { x: 232, y: 27, width: 72, height: 76, radius: 19 },
  lenses: [
    { name: 'ultra-wide', cx: 252, cy: 47 },
    { name: 'main', cx: 252, cy: 83 },
    { name: 'periscope', cx: 284, cy: 65 },
  ],
  lensRadius: 13.5,
  lensGlassRadius: 7,
  flash: { cx: 285, cy: 40, r: 4.2 },
  microphone: { cx: 285, cy: 90, r: 1.8 },
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
