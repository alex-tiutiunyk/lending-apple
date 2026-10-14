import { createRequestChannel } from './requestChannel'

export type MascotRequest =
  /** A runaway letter is on Pip's line, running in `direction`; sent again when it turns (plan 4 §1). */
  | { type: 'chase'; letterX: number; direction: 1 | -1 }
  /** The letter jumps home: Pip stops and misses. */
  | { type: 'chase-end' }
  /** The section label changed: a glance up at the header, sometimes (plan 4 §2.4). */
  | { type: 'glance' }
  /** The page progress reached the end: a small celebration, once per visit (plan 4 §2.4). */
  | { type: 'cheer' }

/** Pip subscribes while loaded; `request` returns false when Pip cannot act on it now. */
export const mascotRequests = createRequestChannel<MascotRequest>()
