import type { ComboAct } from './mascotCombos'

export type HintCombo = Exclude<ComboAct, 'poked'>
export type HintState = {
  actsSeen: number
  actsSinceHint: number
  hintsGiven: number
  found: readonly HintCombo[]
}

const firstHintAfterActs = 2
const actsBetweenHints = 4
export const maxHintsPerSession = 3
const hintOrder: readonly HintCombo[] = ['screenshot', 'dizzy', 'airplane']

export const freshHints: HintState = {
  actsSeen: 0,
  actsSinceHint: actsBetweenHints,
  hintsGiven: 0,
  found: [],
}

export function countAct(state: HintState): HintState {
  return { ...state, actsSeen: state.actsSeen + 1, actsSinceHint: state.actsSinceHint + 1 }
}

/** The combo to hint at now, or null: never early, never often, never one already found. */
export function hintToGive(state: HintState): HintCombo | null {
  if (state.actsSeen < firstHintAfterActs) return null
  if (state.actsSinceHint < actsBetweenHints) return null
  if (state.hintsGiven >= maxHintsPerSession) return null
  return hintOrder.find((combo) => !state.found.includes(combo)) ?? null
}

export function giveHint(state: HintState): HintState {
  return { ...state, actsSinceHint: 0, hintsGiven: state.hintsGiven + 1 }
}

export function findCombo(state: HintState, combo: ComboAct): HintState {
  if (combo === 'poked' || state.found.includes(combo)) return state
  return { ...state, found: [...state.found, combo] }
}
