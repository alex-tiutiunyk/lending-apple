export const firstDelayMs = { shortest: 2000, longest: 4000 }
export const gapMs = { shortest: 5000, longest: 8000 }
export const mostRunning = 1
export const mostLetters = 2

type Entry = { dueAt: number; bag: number[]; bagSize: number; isRunning: boolean }

function between(
  random: () => number,
  { shortest, longest }: { shortest: number; longest: number },
) {
  return shortest + random() * (longest - shortest)
}

function shuffled(size: number, random: () => number) {
  const items = Array.from({ length: size }, (_, index) => index)
  for (let at = items.length - 1; at > 0; at -= 1) {
    const other = Math.floor(random() * (at + 1)) % (at + 1)
    ;[items[at], items[other]] = [items[other] as number, items[at] as number]
  }
  return items
}

/**
 * Headings run on their own clock (plan 5 §9): a first escape 2–4 s after a heading settles in
 * view, then every 5–8 s, 1–2 letters at a time, and every letter gets its turn through a bag of
 * spot indices drawn without replacement. One heading runs at a time on the whole page (plan 6
 * §11.1): two titles with letters out in one viewport competed for the eye.
 */
export function createHeadingScheduler<Heading>(random: () => number) {
  const entries = new Map<Heading, Entry>()
  const runningCount = () => Array.from(entries.values()).filter((entry) => entry.isRunning).length

  return {
    runningCount,

    /** The headings settled and fully in view now. New ones start their first delay; gone ones drop their timer unless their letters are still out. */
    sync(headings: readonly Heading[], now: number) {
      const present = new Set(headings)
      entries.forEach((entry, heading) => {
        if (!present.has(heading) && !entry.isRunning) entries.delete(heading)
      })
      headings.forEach((heading) => {
        if (entries.has(heading)) return
        const dueAt = now + between(random, firstDelayMs)
        entries.set(heading, { dueAt, bag: [], bagSize: 0, isRunning: false })
      })
    },

    /** Headings whose time has come, up to the free slots. A blocked heading stays due. */
    due(now: number, isBlocked: (heading: Heading) => boolean): Heading[] {
      const free = mostRunning - runningCount()
      const picked: Heading[] = []
      for (const [heading, entry] of entries) {
        if (picked.length >= free) break
        if (entry.isRunning || entry.dueAt > now || isBlocked(heading)) continue
        picked.push(heading)
      }
      return picked
    },

    /** `count` spot indices from the heading's bag (refilled and reshuffled once empty, or when the heading's letter count changed), never two from one word. */
    draw(heading: Heading, count: number, size: number, wordOf: (index: number) => string) {
      const entry = entries.get(heading)
      if (!entry || size === 0) return []
      const picked: number[] = []
      while (picked.length < count) {
        if (entry.bag.length === 0 || entry.bagSize !== size) {
          entry.bag = shuffled(size, random)
          entry.bagSize = size
        }
        const words = new Set(picked.map(wordOf))
        const at = entry.bag.findIndex((index) => !words.has(wordOf(index)))
        if (at < 0) break
        picked.push(...entry.bag.splice(at, 1))
      }
      return picked
    },

    started(heading: Heading) {
      const entry = entries.get(heading)
      if (entry) entry.isRunning = true
    },

    ended(heading: Heading, now: number) {
      const entry = entries.get(heading)
      if (!entry) return
      entry.isRunning = false
      entry.dueAt = now + between(random, gapMs)
    },

    /** The earliest timer among the headings that are not running, or null without any. */
    nextDueAt() {
      let next: number | null = null
      entries.forEach((entry) => {
        if (!entry.isRunning && (next === null || entry.dueAt < next)) next = entry.dueAt
      })
      return next
    },
  }
}

export type HeadingScheduler<Heading> = ReturnType<typeof createHeadingScheduler<Heading>>
