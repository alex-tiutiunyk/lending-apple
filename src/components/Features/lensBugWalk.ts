import { positionAt, type Route } from './lensBugRoute'

export type WalkFrame = {
  x: number
  y: number
  /** Rotation of the art in degrees; the art faces up, so a rightward walk is 90. */
  angle: number
  box: number
  isHop: boolean
  isWalking: boolean
}

export const walkPxPerSecond = 40
export const hurryFactor = 3
const longestFrameMs = 100
const hopLiftPx = 3
const pauseGapMs = { shortest: 2000, longest: 6000 }
const pauseMs = { shortest: 500, longest: 1500 }
const lookDeg = { least: 10, most: 20 }
const turnBackChance = 0.3

function between(
  random: () => number,
  { shortest, longest }: { shortest: number; longest: number },
) {
  return shortest + random() * (longest - shortest)
}

/**
 * The bug's walk along a route (plan 5 §5), pure apart from `random`: 40 px/s, a pause every
 * 2–6 s to look around for 0.5–1.5 s, now and then a turn back after a pause, and a hurry at
 * triple speed from a box until the next one is reached.
 */
export function createLensBugWalk(random: () => number) {
  let route: Route = { segments: [], length: 0 }
  let distance = 0
  let direction: 1 | -1 = 1
  let lastTime: number | null = null
  let pausedUntil = 0
  let nextPauseAt = 0
  let look = 0
  let hurryFrom = -1

  const frameAt = (isWalking: boolean): WalkFrame => {
    const position = positionAt(route, distance)
    const facing = direction === 1 ? position.angle : position.angle + 180
    return {
      x: position.x,
      y: position.y - (position.isHop ? hopLiftPx : 0),
      angle: facing + 90 + (isWalking ? 0 : look),
      box: position.box,
      isHop: position.isHop,
      isWalking,
    }
  }

  return {
    setRoute(next: Route) {
      route = next
    },
    /** The pointer is over the box the bug is on: it hurries to the next one. */
    hurry(box: number) {
      if (hurryFrom === -1) hurryFrom = box
      pausedUntil = 0
    },
    step(time: number): WalkFrame | null {
      const elapsed = Math.min(longestFrameMs, time - (lastTime ?? time))
      lastTime = time
      if (route.length === 0) return null
      if (nextPauseAt === 0) nextPauseAt = time + between(random, pauseGapMs)
      const isHurrying = hurryFrom !== -1
      if (!isHurrying) {
        if (time < pausedUntil) return frameAt(false)
        if (pausedUntil !== 0) {
          pausedUntil = 0
          if (random() < turnBackChance) direction = direction === 1 ? -1 : 1
          nextPauseAt = time + between(random, pauseGapMs)
        }
        if (time >= nextPauseAt) {
          pausedUntil = time + between(random, pauseMs)
          look =
            (random() < 0.5 ? -1 : 1) *
            between(random, { shortest: lookDeg.least, longest: lookDeg.most })
          return frameAt(false)
        }
      }
      const speed = walkPxPerSecond * (isHurrying ? hurryFactor : 1)
      distance += (direction * speed * elapsed) / 1000
      const frame = frameAt(true)
      if (isHurrying && frame.box !== -1 && frame.box !== hurryFrom) hurryFrom = -1
      return frame
    },
  }
}
