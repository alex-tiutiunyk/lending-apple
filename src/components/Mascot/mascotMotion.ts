import type { MascotAct } from './mascotActs'

export type Facing = 'left' | 'right'

export type Walker = {
  act: MascotAct
  facing: Facing
  x: number
  isEntering: boolean
  hurryTo: number
}

export type StepResult = 'still' | 'moved' | 'turned' | 'entering' | 'arrived'

const hurrySpeedFactor = 3
const chaseSpeedFactor = 4

export function flip(facing: Facing): Facing {
  return facing === 'left' ? 'right' : 'left'
}

/** Moves Pip one frame along the bottom edge; `step` is the walking distance for the frame. */
export function stepWalker(walker: Walker, step: number, min: number, max: number): StepResult {
  if (walker.act === 'hurry') {
    const gap = walker.hurryTo - walker.x
    const hurryStep = step * hurrySpeedFactor
    walker.x = Math.abs(gap) <= hurryStep ? walker.hurryTo : walker.x + Math.sign(gap) * hurryStep
    return walker.x === walker.hurryTo ? 'arrived' : 'moved'
  }
  if (walker.act === 'chase') {
    // After a runaway letter (plan 4 §1): flat out the way Pip faces, until the edge
    const direction = walker.facing === 'right' ? 1 : -1
    walker.x = Math.min(max, Math.max(min, walker.x + direction * step * chaseSpeedFactor))
    return walker.x === min || walker.x === max ? 'arrived' : 'moved'
  }
  if (walker.act !== 'walk' && walker.act !== 'moonwalk') return 'still'

  const isForward = (walker.facing === 'right') === (walker.act === 'walk')
  walker.x += isForward ? step : -step
  if (walker.isEntering) {
    walker.isEntering = walker.x < min
    return 'entering'
  }
  if (walker.x > min && walker.x < max) return 'moved'
  const before = walker.x - (isForward ? step : -step)
  walker.x = Math.min(max, Math.max(min, walker.x))
  if (walker.act === 'walk') {
    walker.facing = flip(walker.facing)
    return 'turned'
  }
  // A moonwalk does not turn at the edge, it just stops there until the act ends
  return walker.x === before ? 'still' : 'moved'
}
