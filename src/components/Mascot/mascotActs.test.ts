import { describe, expect, it } from 'vitest'
import { mascotCopy } from '@/content/copy'
import { lineFor, nextRandomAct, randomActs, walkDuration, walkDurationMs } from './mascotActs'

function seeded(values: number[]) {
  let index = 0
  return () => {
    const value = values[index % values.length] ?? 0
    index += 1
    return value
  }
}

describe('mascot acts', () => {
  it('picks every random act for some seed and nothing else', () => {
    const picked = new Set(
      Array.from({ length: randomActs.length }, (_, slot) =>
        nextRandomAct(seeded([(slot + 0.5) / randomActs.length])),
      ),
    )
    expect([...picked].sort()).toEqual([...randomActs].sort())
    expect(nextRandomAct(seeded([0.999999]))).toBe(randomActs.at(-1))
  })

  it('walks for a bounded time between acts', () => {
    expect(walkDuration(seeded([0]))).toBe(walkDurationMs.shortest)
    expect(walkDuration(seeded([0.999]))).toBeLessThan(walkDurationMs.longest)
  })

  it('says a line from the copy for talking acts and nothing while walking', () => {
    expect(mascotCopy.quips).toContain(lineFor('quip', seeded([0.4])))
    expect(mascotCopy.complaints).toContain(lineFor('poked', seeded([0.9])))
    expect(mascotCopy.blown).toContain(lineFor('blown', seeded([0])))
    expect(lineFor('walk', seeded([0]))).toBeNull()
  })

  it('has a pool of lines for every talking random act', () => {
    expect(mascotCopy.quips.length).toBeGreaterThanOrEqual(8)
    expect(mascotCopy.complaints.length).toBeGreaterThanOrEqual(8)
    for (const act of randomActs.filter((act) => act !== 'quip' && act !== 'dance')) {
      expect(mascotCopy[act].length).toBeGreaterThanOrEqual(3)
      expect(mascotCopy[act]).toContain(lineFor(act, seeded([0.5])))
    }
  })

  it('complains about the section under Pip some of the time', () => {
    expect(mascotCopy.sectionComplaints.finishes).toContain(
      lineFor('poked', seeded([0.1, 0.4]), 'finishes'),
    )
    expect(mascotCopy.complaints).toContain(lineFor('poked', seeded([0.9, 0.4]), 'finishes'))
    expect(lineFor('airplane', seeded([0]))).toBe(mascotCopy.combos.airplane)
  })
})
