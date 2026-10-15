import { describe, expect, it } from 'vitest'
import { buildRoute, positionAt } from './lensBugRoute'

const boxes = [
  { left: 0, top: 0, width: 100, height: 50 },
  { left: 110, top: 0, width: 100, height: 50 },
  { left: 220, top: 0, width: 100, height: 50 },
]

describe('lensBugRoute (plan 5 §5)', () => {
  it('joins three boxes into one closed clockwise loop with a hop over each gap, twice', () => {
    const route = buildRoute(boxes)
    const { segments } = route
    expect(segments).toHaveLength(12)
    expect(segments.at(-1)?.to).toEqual(segments[0]?.from)
    expect(segments.filter(({ isHop }) => isHop)).toHaveLength(4)
    // Top edges left to right, right side down, bottom edges right to left, left side up
    expect(segments.slice(0, 5).map(({ box }) => box)).toEqual([0, -1, 1, -1, 2])
    expect(segments[5]).toMatchObject({ from: { x: 320, y: 0 }, to: { x: 320, y: 50 }, box: 2 })
    expect(segments.slice(6, 11).map(({ box }) => box)).toEqual([2, -1, 1, -1, 0])
    expect(segments[11]).toMatchObject({ from: { x: 0, y: 50 }, to: { x: 0, y: 0 }, box: 0 })
    expect(route.length).toBe(100 * 6 + 10 * 4 + 50 * 2)
  })

  it('reports position, facing and box along the loop, wrapping in both directions', () => {
    const route = buildRoute(boxes)
    expect(positionAt(route, 50)).toMatchObject({ x: 50, y: 0, angle: 0, box: 0, isHop: false })
    expect(positionAt(route, 105)).toMatchObject({ x: 105, y: 0, box: -1, isHop: true })
    expect(positionAt(route, 320 + 25)).toMatchObject({ x: 320, y: 25, angle: 90, box: 2 })
    expect(positionAt(route, 370 + 50)).toMatchObject({ x: 270, y: 50, angle: 180, box: 2 })
    expect(positionAt(route, route.length - 10)).toMatchObject({ x: 0, y: 10, angle: -90, box: 0 })
    expect(positionAt(route, route.length + 50)).toMatchObject({ x: 50, y: 0 })
    expect(positionAt(route, -10)).toMatchObject({ x: 0, y: 10 })
  })

  it('is empty without boxes', () => {
    const route = buildRoute([])
    expect(route.length).toBe(0)
    expect(positionAt(route, 10)).toMatchObject({ box: -1 })
  })
})
