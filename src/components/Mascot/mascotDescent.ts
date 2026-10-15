export const rigs = [
  'parachute',
  'propeller',
  'umbrella',
  'balloons',
  'glider',
  'leaf',
  'bubble',
] as const

export type Rig = (typeof rigs)[number]
/** `open` while the rig deploys, `flip` the umbrella inside out, `pop` a balloon, `landed` on the line. */
type DescentPhase = 'open' | 'fall' | 'flip' | 'pop' | 'landed'

export type DescentFrame = {
  x: number
  y: number
  tilt: number
  phase: DescentPhase
  isDone: boolean
}
export type DescentSetup = {
  rig: Rig
  x: number
  /** Pixels above the line, so 0 or negative. */
  y: number
  /** Horizontal release velocity in px/s: a flick throws Pip. */
  vx: number
  minX: number
  maxX: number
}

const openMs = 220
const releaseDampingMs = 320
const longestFrameMs = 100
const umbrellaFlipPx = 120
const balloonRiseMs = 400
const leafTumble = { fromMs: 800, lengthMs: 900 }

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function shuffle<Item>(items: readonly Item[], random: () => number) {
  const bag = [...items]
  for (let slot = bag.length - 1; slot > 0; slot -= 1) {
    const other = Math.floor(random() * (slot + 1)) % (slot + 1)
    const item = bag[slot] as Item
    bag[slot] = bag[other] as Item
    bag[other] = item
  }
  return bag
}

/** Seven rigs, drawn without replacement: no repeat until all seven have played (plan 5 §6). */
export function createRigBag(random: () => number) {
  let bag: Rig[] = []
  return {
    next(): Rig {
      if (bag.length === 0) bag = shuffle(rigs, random)
      return bag.pop() ?? 'parachute'
    },
  }
}

/**
 * The way down on one rig: a fall speed, a sideways drift and a lean per frame, plus the
 * release velocity damped away. Pure apart from `random`, which fixes the glide direction and
 * the balloon that pops.
 */
export function createDescent({ rig, x, y, vx, minX, maxX }: DescentSetup, random: () => number) {
  let elapsed = 0
  let posX = x
  let posY = Math.min(0, y)
  let thrown = vx
  let phase: DescentPhase = 'open'
  const popY = posY * (0.35 + random() * 0.35)
  const glideDirection = random() < 0.5 ? -1 : 1

  const profile = (seconds: number) => {
    switch (rig) {
      case 'parachute':
        return {
          fall: elapsed < openMs ? 420 : 160,
          drift: Math.cos(seconds * 2.2) * 60,
          tilt: Math.sin(seconds * 2.2) * 8,
        }
      case 'propeller':
        return { fall: 260, drift: Math.sin(seconds * 9) * 20, tilt: Math.sin(seconds * 9) * 4 }
      case 'umbrella': {
        const isFlipped = posY > -umbrellaFlipPx
        if (isFlipped) phase = 'flip'
        return {
          fall: isFlipped ? 520 : 180,
          drift: isFlipped ? 0 : Math.cos(seconds * 1.8) * 50,
          tilt: isFlipped ? 10 : Math.sin(seconds * 1.8) * 6,
        }
      }
      case 'balloons': {
        const hasPopped = posY >= popY && elapsed > balloonRiseMs
        if (hasPopped) phase = 'pop'
        return {
          fall: elapsed < balloonRiseMs ? -50 : hasPopped ? 320 : 140,
          drift: Math.sin(seconds * 1.4) * 25,
          tilt: 0,
        }
      }
      case 'glider': {
        const drift = glideDirection * Math.cos(seconds * 1.5) * 300
        return { fall: 240, drift, tilt: (drift / 300) * 20 }
      }
      case 'leaf': {
        const turn = clamp((elapsed - leafTumble.fromMs) / leafTumble.lengthMs, 0, 1)
        return {
          fall: 150,
          drift: Math.cos(seconds * 2.6) * 160,
          tilt: Math.sin(seconds * 2.6) * 25 + turn * 360,
        }
      }
      case 'bubble':
        return { fall: 120, drift: Math.sin(seconds * 0.9) * 40, tilt: Math.sin(seconds * 0.9) * 8 }
    }
  }

  return {
    step(frameMs: number): DescentFrame {
      const dtMs = Math.min(longestFrameMs, Math.max(0, frameMs))
      elapsed += dtMs
      const dt = dtMs / 1000
      thrown *= Math.exp(-dtMs / releaseDampingMs)
      const { fall, drift, tilt } = profile(elapsed / 1000)
      if (phase === 'open' && elapsed >= openMs) phase = 'fall'
      posY = Math.min(0, posY + fall * dt)
      posX = clamp(posX + (drift + thrown) * dt, minX, maxX)
      const isDone = posY >= 0
      if (isDone) phase = 'landed'
      return { x: posX, y: posY, tilt, phase, isDone }
    },
  }
}
