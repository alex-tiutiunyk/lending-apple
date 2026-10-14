export const comboWindowMs = 450

export type ComboAct = 'poked' | 'screenshot' | 'dizzy' | 'airplane'
export type PokeCounter = { count: number; lastAt: number }

export const idleCounter: PokeCounter = { count: 0, lastAt: -Infinity }

/** Counts a poke: it joins the running series only within the window after the previous one. */
export function addPoke({ count, lastAt }: PokeCounter, now: number): PokeCounter {
  return { count: now - lastAt <= comboWindowMs ? count + 1 : 1, lastAt: now }
}

/** The series resolves once the window after the last poke has passed. */
export function isResolved({ count, lastAt }: PokeCounter, now: number) {
  return count > 0 && now - lastAt >= comboWindowMs
}

export function comboFor(count: number): ComboAct {
  if (count >= 4) return 'airplane'
  if (count === 3) return 'dizzy'
  if (count === 2) return 'screenshot'
  return 'poked'
}

const comboActs: readonly string[] = ['poked', 'screenshot', 'dizzy', 'airplane']

export function isComboAct(act: string): act is ComboAct {
  return comboActs.includes(act)
}
