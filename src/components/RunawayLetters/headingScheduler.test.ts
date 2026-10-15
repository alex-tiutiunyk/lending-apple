import { describe, expect, it } from 'vitest'
import { createHeadingScheduler, firstDelayMs, gapMs, mostRunning } from './headingScheduler'

const never = () => false
const sequence = (...values: number[]) => {
  let turn = 0
  return () => values[turn++ % values.length] ?? 0
}

describe('createHeadingScheduler (plan 5 §9)', () => {
  it('runs a heading 2–4 s after it settles in view, then every 5–8 s after its escape ends', () => {
    const scheduler = createHeadingScheduler<string>(() => 0.5)
    scheduler.sync(['title'], 1000)
    const firstDue = 1000 + (firstDelayMs.shortest + firstDelayMs.longest) / 2
    expect(scheduler.nextDueAt()).toBe(firstDue)
    expect(scheduler.due(firstDue - 1, never)).toEqual([])
    expect(scheduler.due(firstDue, never)).toEqual(['title'])
    scheduler.started('title')
    expect(scheduler.due(firstDue + 100, never)).toEqual([])
    scheduler.ended('title', 9000)
    expect(scheduler.nextDueAt()).toBe(9000 + (gapMs.shortest + gapMs.longest) / 2)
  })

  it('forgets a heading that left the view unless its letters are still out', () => {
    const scheduler = createHeadingScheduler<string>(() => 0)
    scheduler.sync(['a', 'b'], 0)
    scheduler.started('a')
    scheduler.sync([], 10)
    expect(scheduler.runningCount()).toBe(1)
    scheduler.ended('a', 10)
    expect(scheduler.due(100_000, never)).toEqual(['a'])
    scheduler.sync(['b'], 20)
    // a is gone now; b is back with a fresh first delay, not an overdue one
    expect(scheduler.due(20 + firstDelayMs.shortest - 1, never)).toEqual([])
    expect(scheduler.due(20 + firstDelayMs.shortest, never)).toEqual(['b'])
  })

  it('lets one heading run on the whole page (plan 6 §11.1) and keeps a blocked one due', () => {
    const scheduler = createHeadingScheduler<string>(() => 0)
    scheduler.sync(['a', 'b', 'c'], 0)
    const later = firstDelayMs.shortest + 1
    expect(mostRunning).toBe(1)
    expect(scheduler.due(later, (heading) => heading === 'a')).toEqual(['b'])
    scheduler.started('b')
    expect(scheduler.runningCount()).toBe(mostRunning)
    expect(scheduler.due(later, never)).toEqual([])
    scheduler.ended('b', later)
    // The waiting headings kept their timers, so the next one is due at once
    expect(scheduler.due(later, never)).toEqual(['a'])
  })

  it('draws every letter once before any repeats, never two from one word', () => {
    const scheduler = createHeadingScheduler<string>(sequence(0.9, 0.1, 0.5, 0.3, 0.7))
    scheduler.sync(['title'], 0)
    // Six letters in two words of three
    const wordOf = (index: number) => (index < 3 ? 'first' : 'second')
    const drawn: number[] = []
    for (let turn = 0; turn < 3; turn += 1) {
      const picked = scheduler.draw('title', 2, 6, wordOf)
      expect(picked).toHaveLength(2)
      expect(new Set(picked.map(wordOf)).size).toBe(2)
      drawn.push(...picked)
    }
    expect([...drawn].sort()).toEqual([0, 1, 2, 3, 4, 5])
    expect(scheduler.draw('title', 1, 6, wordOf)).toHaveLength(1)
  })

  it('settles for one letter when only one word is left in the bag, and refills on a size change', () => {
    const scheduler = createHeadingScheduler<string>(() => 0)
    scheduler.sync(['title'], 0)
    expect(scheduler.draw('title', 2, 2, () => 'same')).toHaveLength(1)
    expect(scheduler.draw('title', 2, 5, String)).toHaveLength(2)
    expect(scheduler.draw('title', 2, 0, String)).toEqual([])
    expect(scheduler.draw('unknown', 2, 5, String)).toEqual([])
  })
})
