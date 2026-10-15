import { useCallback, type RefObject } from 'react'
import type { MascotAct } from './mascotActs'
import { isComboAct } from './mascotCombos'
import type { Facing } from './mascotMotion'
import { placePip } from './mascotPlacement'

/** Who keeps Pip standing still: hover, keyboard focus, or the pointer carrying it (plan 5 §6). */
export type HoldReason = 'focus' | 'pointer' | 'drag'

/** Pip's working state between renders: the brain's tick reads and writes it directly. */
export type MascotModel = {
  act: MascotAct
  facing: Facing
  line: string | null
  pokeReply: string
  x: number
  isEntering: boolean
  hurryTo: number
  remainingMs: number
  holds: Set<HoldReason>
}

type ControlDeps = {
  startAct: (act: MascotAct, line?: string | null) => void
  commit: () => void
  /** The brain's tick follows the holds: it sleeps while Pip is held (plan 6 rule 9). */
  sync: () => void
}

/**
 * The brain's outward controls: read the act, turn, step aside, hold still, and `placeAt`, which
 * puts Pip back on its line at an x after a drag (plan 5 §6) so the walk resumes from there.
 */
export function useMascotControls(
  pip: RefObject<HTMLElement | null>,
  model: RefObject<MascotModel>,
  { startAct, commit, sync }: ControlDeps,
) {
  const currentAct = useCallback(() => model.current.act, [model])

  const turnTo = useCallback(
    (facing: Facing) => {
      model.current.facing = facing
      commit()
    },
    [model, commit],
  )

  const stepAside = useCallback(
    (x: number) => {
      const state = model.current
      if (state.holds.size > 0 || isComboAct(state.act)) return
      state.hurryTo = x
      state.facing = x > state.x ? 'right' : 'left'
      startAct('hurry')
    },
    [model, startAct],
  )

  const hold = useCallback(
    (reason: HoldReason, isHeld: boolean) => {
      const { holds } = model.current
      holds[isHeld ? 'add' : 'delete'](reason)
      pip.current?.toggleAttribute('data-held', holds.size > 0)
      sync()
    },
    [model, pip, sync],
  )

  const placeAt = useCallback(
    (x: number) => {
      const state = model.current
      state.x = x
      state.isEntering = false
      if (pip.current) placePip(pip.current, x)
      sync()
    },
    [model, pip, sync],
  )

  return { currentAct, turnTo, stepAside, hold, placeAt }
}
