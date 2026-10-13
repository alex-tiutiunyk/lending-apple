import { inset, layerBody } from '../phone-geometry'

export const layerShapes = {
  body: layerBody,
  band: inset(layerBody, 4),
  screen: inset(layerBody, 9, 8),
  plateau: { x: 84, y: 27, width: 72, height: 76, radius: 19 },
  lenses: [
    { name: 'ultra-wide', cx: 136, cy: 47 },
    { name: 'main', cx: 136, cy: 83 },
    { name: 'periscope', cx: 104, cy: 65 },
  ],
  island: { x: 68, y: 31, width: 44, height: 13, radius: 6.5 },
  battery: { x: 34, y: 132, width: 112, height: 186, radius: 12 },
  board: { x: 24, y: 30, width: 56, height: 96, radius: 9 },
  chip: { x: 34, y: 56, width: 36, height: 36, radius: 4 },
} as const
