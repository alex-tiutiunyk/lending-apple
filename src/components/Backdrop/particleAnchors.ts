import { documentTop } from '@/hooks/frameLoop'
import type { AnchorTrack } from './particleField'
import {
  isParticleShape,
  shapePoints,
  shapeTurnDegrees,
  type ParticleShape,
} from './particleShapes'

export type ShapeAnchor = AnchorTrack & {
  shape: ParticleShape
  centerX: number
  size: number
  turnMax: number
  points: Float32Array
}

const pointCache = new Map<string, Float32Array>()

function cachedPoints(shape: ParticleShape, count: number) {
  const key = `${shape}:${count}`
  let points = pointCache.get(key)
  if (!points) {
    points = shapePoints(shape, count)
    pointCache.set(key, points)
  }
  return points
}

function trackOf(element: Element): AnchorTrack {
  const rect = element.getBoundingClientRect()
  const section = element.closest<HTMLElement>('[data-pinned]')
  const stage = section?.querySelector<HTMLElement>('[data-stage]')
  if (!section || !stage || getComputedStyle(stage).position !== 'sticky') {
    const top = documentTop(element) + rect.height / 2
    return { pinFrom: 0, pinTo: 0, offsetY: top }
  }
  const pinFrom = documentTop(section)
  return {
    pinFrom,
    pinTo: pinFrom + section.offsetHeight - stage.offsetHeight,
    offsetY: rect.top - stage.getBoundingClientRect().top + rect.height / 2,
  }
}

function placement(rect: DOMRect, isCompact: boolean) {
  const viewportWidth = window.innerWidth
  if (isCompact) {
    const size = Math.min(rect.width, rect.height, viewportWidth * 0.84)
    return { centerX: rect.left + rect.width / 2, size }
  }
  const size = Math.min(rect.height * 0.75, window.innerHeight * 0.5, viewportWidth * 0.26)
  const isRightSide = rect.left + rect.width / 2 > viewportWidth / 2
  const centerX = isRightSide
    ? Math.min(rect.right + size * 0.2, viewportWidth - size * 0.5)
    : Math.max(rect.left - size * 0.2, size * 0.5)
  return { centerX, size }
}

export function measureAnchors(count: number, isCompact: boolean): ShapeAnchor[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-particles]')).flatMap(
    (element) => {
      const shape = element.dataset.particles
      if (!isParticleShape(shape)) return []
      return {
        shape,
        ...trackOf(element),
        ...placement(element.getBoundingClientRect(), isCompact),
        turnMax: shapeTurnDegrees[shape],
        points: cachedPoints(shape, count),
      }
    },
  )
}

export function anchorPointX(anchor: ShapeAnchor, slot: number) {
  return anchor.centerX + ((anchor.points[slot * 2] ?? 0.5) - 0.5) * anchor.size
}

export function anchorPointY(anchor: ShapeAnchor, slot: number, centerY: number) {
  return centerY + ((anchor.points[slot * 2 + 1] ?? 0.5) - 0.5) * anchor.size
}

export function readAccent() {
  const root = document.documentElement
  const computed = getComputedStyle(root)
  const read = (name: string) =>
    root.style.getPropertyValue(name) || computed.getPropertyValue(name)
  return `${read('--accent-h')} ${read('--accent-s')} ${read('--accent-l')}`
}
