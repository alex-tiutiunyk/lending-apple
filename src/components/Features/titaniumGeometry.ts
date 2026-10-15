import type { Box } from '@/assets/svg/phone-geometry'

/** The sample's viewBox. */
export const view = { width: 320, height: 210 }

/**
 * A rounded rect in object-bounding-box units (0 … 1 of each axis), for the clip path the HTML
 * band light uses (plan 6 §7): the axes scale differently, so the corners become ellipses.
 */
export function boxPath({ x, y, width, height, radius }: Box) {
  const rx = radius / view.width
  const ry = radius / view.height
  const left = x / view.width
  const top = y / view.height
  const right = (x + width) / view.width
  const bottom = (y + height) / view.height
  const point = (value: number) => value.toFixed(4)
  return [
    `M${point(left + rx)} ${point(top)}`,
    `H${point(right - rx)}`,
    `A${point(rx)} ${point(ry)} 0 0 1 ${point(right)} ${point(top + ry)}`,
    `V${point(bottom - ry)}`,
    `A${point(rx)} ${point(ry)} 0 0 1 ${point(right - rx)} ${point(bottom)}`,
    `H${point(left + rx)}`,
    `A${point(rx)} ${point(ry)} 0 0 1 ${point(left)} ${point(bottom - ry)}`,
    `V${point(top + ry)}`,
    `A${point(rx)} ${point(ry)} 0 0 1 ${point(left + rx)} ${point(top)}`,
    'Z',
  ].join(' ')
}

// Hairline scratches on the top band (plan 5 §11), revealed one per hover by `data-scratches`
export const scratches = [
  [40, 26, 58, 29],
  [70, 24, 96, 22],
  [120, 27, 150, 26],
  [180, 21, 206, 25],
  [230, 28, 262, 27],
  [280, 22, 300, 23],
] as const
