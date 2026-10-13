import { inset, layerBody } from '../phone-geometry'

export const layerShapes = {
  body: layerBody,
  band: inset(layerBody, 4),
  screen: inset(layerBody, 7, 6),
  plateau: { x: 15, y: 20, width: 150, height: 84, radius: 23 },
  plateauBottomRadius: 10,
  glassWindow: { x: 19, y: 112, width: 142, height: 224, radius: 20 },
  lenses: [
    { name: 'ultra-wide', cx: 141, cy: 43 },
    { name: 'main', cx: 141, cy: 81 },
    { name: 'periscope', cx: 108, cy: 62 },
  ],
  flash: { cx: 38, cy: 40, r: 4.2 },
  depthSensor: { cx: 38, cy: 82, r: 5 },
  island: { x: 69, y: 28, width: 42, height: 12, radius: 6 },
  earpiece: { x: 78, y: 19.6, width: 24, height: 1.6, radius: 0.8 },
  magnetCenter: { cx: 90, cy: 222 },
  vaporChamber: { x: 40, y: 118, width: 100, height: 132, radius: 10 },
  battery: { x: 26, y: 120, width: 104, height: 186, radius: 12 },
  hapticMotor: { x: 136, y: 150, width: 24, height: 60, radius: 4 },
  speaker: { x: 26, y: 314, width: 60, height: 20, radius: 5 },
  chip: { x: 26, y: 38, width: 32, height: 32, radius: 4 },
} as const

export const boardOutline =
  'M24 26 H96 Q100 26 100 30 V108 Q100 112 96 112 H62 V236 Q62 240 58 240 H24 Q20 240 20 236 V30 Q20 26 24 26 Z'
