import { actDurationMs } from './mascotActs'
import { joyLine } from './mascotLines'

/** The stumble takes the first 45 % of `trip`; then the joy line comes (plan 7 §1). */
const stumbleShare = 0.45

type TripState = { act: string; line: string | null; pokeReply: string }

/**
 * Swaps the trip's falling line for a joy line once the stumble is over, in one commit, and
 * gives the live region the joy line only (the falling line is never announced). Returns the
 * cancel; a new act cancels it.
 */
export function scheduleTripJoy(state: TripState, random: () => number, commit: () => void) {
  const timer = window.setTimeout(() => {
    if (state.act !== 'trip') return
    const line = joyLine(random)
    state.line = line
    state.pokeReply = line
    commit()
  }, actDurationMs.trip * stumbleShare)
  return () => window.clearTimeout(timer)
}
