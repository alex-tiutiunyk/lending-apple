import { createRequestChannel } from './requestChannel'

export type ParticleRequest =
  /** Lift the shape at the given anchor off the page over `durationMs` (plan 4 §7.3). */
  | { type: 'launch'; shape: 'rocket'; durationMs: number }
  /** The flight was cancelled: the shape settles back where it was. */
  | { type: 'land'; shape: 'rocket' }

export const particleRequests = createRequestChannel<ParticleRequest>()
