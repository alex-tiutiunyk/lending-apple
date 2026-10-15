import { join } from 'node:path'
import { compile } from 'sass'
import { describe, expect, it } from 'vitest'

const stylesDirectory = join(process.cwd(), 'src/styles')
const explodedView = join(process.cwd(), 'src/components/ExplodedView/ExplodedView.module.scss')
const css = compile(explodedView, { loadPaths: [stylesDirectory] }).css

// The plan 2 windows the ranges must reproduce: start 0.04 + i × step, over one window
const desktop = { count: 7, step: 0.09, window: 0.27 }
const compact = { count: 5, step: 0.13, window: 0.28 }

/** Every `animation-range: contain a% contain b%` declared for the selector, as fractions. */
function rangesOf(selector: string) {
  const escaped = selector.replace(/[[\]'"]/g, (character) => `\\${character}`)
  const blocks = css.match(new RegExp(`${escaped}\\s*\\{[^}]*\\}`, 'g')) ?? []
  return blocks.flatMap((block) => {
    // A range that ends with the timeline is written calc(100% - 1px): the full end
    const match = block.match(
      /animation-range:\s*contain ([\d.]+)% contain (?:([\d.]+)%|calc\(100% - 1px\))/,
    )
    return match ? [[Number(match[1]) / 100, Number(match[2] ?? 100) / 100]] : []
  })
}

function timelinesOf(selector: string) {
  const escaped = selector.replace(/[[\]'"]/g, (character) => `\\${character}`)
  const blocks = css.match(new RegExp(`${escaped}\\s*\\{[^}]*\\}`, 'g')) ?? []
  return blocks.filter((block) => block.includes('animation-timeline: --inside')).length
}

describe('exploded view scroll ranges (plan 6 §4)', () => {
  it.each([
    ['data-order', desktop],
    ['data-compact-order', compact],
  ])('%s layers keep their plan 2 windows', (attribute, { count, step, window }) => {
    for (let order = 0; order < count; order += 1) {
      const start = 0.04 + order * step
      const [range] = rangesOf(`.layer[${attribute}="${order}"]`)
      expect(range?.[0]).toBeCloseTo(start, 6)
      expect(range?.[1]).toBeCloseTo(start + window, 6)
      expect(timelinesOf(`.layer[${attribute}="${order}"]`)).toBe(1)
    }
  })

  it('lands the labels over 1/30 at 85 % of the layer window, dot included', () => {
    const start = 0.04 + 2 * desktop.step + 0.85 * desktop.window
    expect(rangesOf('.label[data-order="2"]')).toEqual([
      [expect.closeTo(start, 6), expect.closeTo(start + 1 / 30, 6)],
    ])
    expect(rangesOf('.label[data-order="2"]::before')).toHaveLength(1)
  })

  it('flies the parts in at 78 % of the window, 0.025 apart, over 0.07', () => {
    const start = 0.04 + 4 * desktop.step + 0.78 * desktop.window
    const slots = [0, 1, 2].map((slot) =>
      rangesOf(`.layer[data-order="4"] [data-part-slot="${slot}"]`),
    )
    slots.forEach((ranges, slot) => {
      expect(ranges).toEqual([
        [expect.closeTo(start + slot * 0.025, 6), expect.closeTo(start + slot * 0.025 + 0.07, 6)],
      ])
    })
  })

  it('turns the stack over the last fifth and keeps the timeline after the shorthand', () => {
    expect(rangesOf('.stack')).toEqual([[0.8, 1]])
    expect(timelinesOf('.stack')).toBe(1)
    expect(css).toMatch(/\.layer \{[^}]*animation: layer-settle/)
    expect(css).toMatch(/\.root \{[^}]*view-timeline: --inside block/)
  })

  it('declares the same windows as paused 1000 ms animations for the fallback driver', () => {
    const block = css.match(/\.layer\[data-order="3"\]\s*\{[^}]*animation-play-state[^}]*\}/)?.[0]
    expect(block).toContain('animation-duration: 270ms')
    expect(block).toContain('animation-delay: 310ms')
    expect(block).toContain('animation-play-state: paused')
  })
})
