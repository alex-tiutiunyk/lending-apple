import { subscribeTick } from '@/hooks/frameLoop'
import type { MascotAct } from './mascotActs'
import { blendVelocity, carryPosition, isDrag, tiltFor, type Point } from './mascotCarry'
import type { Rig } from './mascotDescent'
import { fallingLine, landingLine } from './mascotLines'
import { clearPipLean, createFrameClock, pipBounds, writePipPosition } from './mascotPlacement'
import type { HoldReason } from './useMascotControls'

type Rigs = typeof import('./mascot-rigs')
type Grip = {
  id: number
  start: Point
  offset: Point
  restTop: number
  width: number
  isDragging: boolean
}

export type DragDeps = {
  random: () => number
  startAct: (act: MascotAct, line?: string | null) => void
  hold: (reason: HoldReason, isHeld: boolean) => void
  placeAt: (x: number) => void
  onRig: (rig: Rig | null) => void
  loadRigs: () => Promise<Rigs>
}

/**
 * The carry and the way down (plan 5 §6), outside React: pointer events come in through `grab`,
 * `move` and `drop`; positions go out on the shared tick as `translate` on the root and a lean
 * on the figure, the rig's phase as `data-rig-phase`. Pip's box is read once at the grab, so a
 * carry frame measures nothing (plan 6 §5). Landing order matters for the avoidance check on
 * the act change: `placeAt`, lift the hold, then the `land` act.
 */
export function createDragController(element: HTMLElement, button: Element, deps: DragDeps) {
  let rigs: Promise<Rigs> | null = null
  let bag: ReturnType<Rigs['createRigBag']> | null = null
  let descent: ReturnType<Rigs['createDescent']> | null = null
  let rig: Rig | null = null
  let grip: Grip | null = null
  let held: Grip | null = null
  let pointer: Point = { x: 0, y: 0 }
  let position: Point = { x: 0, y: 0 }
  let velocity: Point = { x: 0, y: 0 }
  let phase = ''
  let stopTick: () => void = () => undefined
  const clock = createFrameClock()
  const bounds = () => pipBounds(held?.width ?? 0, held?.restTop ?? 0)
  const write = ({ x, y }: Point, tilt: number) => {
    position = { x, y }
    writePipPosition(element, position, tilt)
  }
  const run = (tick: (time: number) => void) => {
    stopTick()
    clock.reset()
    stopTick = subscribeTick(tick)
  }

  const land = (x: number) => {
    stopTick()
    stopTick = () => undefined
    descent = null
    position = { x, y: 0 }
    clearPipLean(element)
    element.dataset.rigPhase = 'landed'
    deps.placeAt(x)
    deps.hold('drag', false)
    deps.hold('pointer', false) // the pointer is elsewhere now, but no pointerleave came
    deps.startAct('land', landingLine(deps.random, rig))
  }

  const carryTick = (time: number) => {
    if (!grip) return
    const elapsed = clock.elapsed(time)
    const next = carryPosition(pointer, grip.offset, grip.restTop, bounds())
    velocity = blendVelocity(velocity, position, next, elapsed)
    write(next, tiltFor(velocity.x))
  }
  const descentTick = (time: number) => {
    if (!descent) return
    const frame = descent.step(clock.elapsed(time))
    write(frame, frame.tilt)
    if (frame.phase !== phase) {
      // Joy on the way down (plan 7 §1), from the first frame that is no longer `open`: the
      // umbrella can go `open → flip` and a short drop straight to `landed`, so not on `fall`
      if (phase === 'open' && frame.phase !== 'landed')
        deps.startAct('fall', fallingLine(deps.random))
      phase = frame.phase
      element.dataset.rigPhase = phase
    }
    if (frame.isDone) land(frame.x)
  }

  const carry = (gripped: Grip) => {
    gripped.isDragging = true
    held = gripped
    descent = null
    rig = null
    deps.onRig(null)
    delete element.dataset.rigPhase
    try {
      button.setPointerCapture(gripped.id)
    } catch {
      /* a synthetic pointer has nothing to capture; the document listeners still follow it */
    }
    // The pointerdown focused the button; a carried Pip is not a keyboard target
    if (button instanceof HTMLElement) button.blur()
    deps.hold('drag', true)
    deps.startAct('carried')
    velocity = { x: 0, y: 0 }
    run(carryTick)
  }
  const release = async () => {
    const module = await rigs?.catch(() => null)
    if (!module) rigs = null // a failed fetch (offline) is forgotten, so the next drag tries again
    if (grip?.isDragging) return
    // Without the rigs chunk (offline) Pip simply drops back onto its line
    if (!module) return land(position.x)
    bag ??= module.createRigBag(deps.random)
    rig = bag.next()
    phase = ''
    deps.onRig(rig)
    const setup = { rig, ...position, vx: velocity.x, ...bounds() }
    descent = module.createDescent(setup, deps.random)
    run(descentTick)
  }

  return {
    grab(id: number, point: Point) {
      rigs ??= deps.loadRigs()
      const rect = element.getBoundingClientRect()
      pointer = point
      grip = {
        id,
        start: point,
        offset: { x: point.x - rect.left, y: point.y - rect.top },
        restTop: rect.top - position.y,
        width: rect.width,
        isDragging: false,
      }
      // Grabbed again in the air: the rig drops at once
      if (descent) carry(grip)
    },
    move(id: number, point: Point) {
      if (!grip || grip.id !== id) return
      pointer = point
      if (!grip.isDragging && isDrag(grip.start, point)) carry(grip)
    },
    // True when the release ends a drag, so the click that follows is not a poke
    drop(id: number) {
      const gripped = grip
      if (!gripped || gripped.id !== id) return false
      grip = null
      if (!gripped.isDragging) return false
      void release()
      return true
    },
    hide() {
      if (descent) land(position.x)
    },
    isFalling: () => descent !== null,
    destroy: () => stopTick(),
  }
}
