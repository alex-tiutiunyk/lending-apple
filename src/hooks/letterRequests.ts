import { createRequestChannel } from './requestChannel'

/** A glyph Pip may shoot at, by its centre in viewport px; `spotId` names it in the `hit`. */
export type LetterTarget = { x: number; y: number; spotId: number }

export type LetterRequest =
  /**
   * Pip starts a throw from (fromX, fromY): the letters pick a glyph above it and answer through
   * `reply`, or reply null when nothing fits (plan 7 §2). The channel is one-way, so the answer
   * travels in the request.
   */
  | { type: 'aim'; fromX: number; fromY: number; reply: (target: LetterTarget | null) => void }
  /** The projectile arrived: the aimed glyph pops out, unless it was a planned miss. */
  | { type: 'hit'; spotId: number; missed: boolean }

/** The runaway letters subscribe while loaded; Pip checks `hasListeners` before a throw. */
export const letterRequests = createRequestChannel<LetterRequest>()
