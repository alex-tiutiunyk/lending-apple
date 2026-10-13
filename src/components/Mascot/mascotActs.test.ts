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
    expect(lineFor('blown', seeded([0]))).toBe(mascotCopy.blown)
    expect(lineFor('walk', seeded([0]))).toBeNull()
  })
})
