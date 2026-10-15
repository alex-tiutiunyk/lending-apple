import { useCallback, useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react'
import type { MascotAct } from './mascotActs'
import type { Rig } from './mascotDescent'
import { createDragController, type DragDeps } from './mascotDragController'

type DragControls = Pick<DragDeps, 'startAct' | 'hold' | 'placeAt'>

/**
 * Pip can be picked up (plan 5 §6): a pointer that moves more than 6 px from a pointerdown on
 * the poke button carries it; released, it comes down on one of seven rigs and lands on its
 * line. The rigs and the descent math are a lazy chunk fetched on the first pointerdown. A drag
 * is never a poke: the click after it is swallowed. Keyboard pokes have no pointerdown and pass.
 */
export function useMascotDrag(
  pip: RefObject<HTMLElement | null>,
  random: () => number,
  act: MascotAct,
  { startAct, hold, placeAt }: DragControls,
  onPoke: () => void,
) {
  const [rig, setRig] = useState<Rig | null>(null)
  const controller = useRef<ReturnType<typeof createDragController> | null>(null)
  const swallowClick = useRef(false)

  // The rig stays through the landing (the canopy folds, the bubble pops) and goes with the walk
  useEffect(() => {
    if (act !== 'walk' || controller.current?.isFalling()) return
    setRig(null)
    pip.current?.removeAttribute('data-rig-phase')
  }, [act, pip])

  useEffect(() => {
    const element = pip.current
    const button = element?.querySelector('button')
    if (!element || !button) return
    const drag = createDragController(element, button, {
      random,
      startAct,
      hold,
      placeAt,
      onRig: setRig,
      loadRigs: () => import('./mascot-rigs'),
    })
    controller.current = drag

    const onMove = (event: globalThis.PointerEvent) =>
      drag.move(event.pointerId, { x: event.clientX, y: event.clientY })
    const onUp = (event: globalThis.PointerEvent) => {
      if (drag.drop(event.pointerId)) swallowClick.current = true
    }
    // A cancelled pointer never clicks, so nothing is swallowed for it: the next keyboard poke,
    // which has no pointerdown to clear the flag, must still land
    const onCancel = (event: globalThis.PointerEvent) => {
      drag.drop(event.pointerId)
    }
    const onVisibility = () => {
      if (document.hidden) drag.hide()
    }
    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointercancel', onCancel)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onCancel)
      document.removeEventListener('visibilitychange', onVisibility)
      drag.destroy()
      controller.current = null
    }
  }, [pip, random, startAct, hold, placeAt])

  const onPointerDown = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return
    swallowClick.current = false
    controller.current?.grab(event.pointerId, { x: event.clientX, y: event.clientY })
  }, [])

  const onClick = useCallback(() => {
    if (swallowClick.current) {
      swallowClick.current = false
      return
    }
    onPoke()
  }, [onPoke])

  return { rig, pokeProps: { onPointerDown, onClick } }
}
