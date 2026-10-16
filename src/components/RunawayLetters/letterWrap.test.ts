import { describe, expect, it, vi } from 'vitest'
import { sectionOf } from './escapePlanner'
import { copyGlyph } from './letterWrap'

vi.mock('@/hooks/frameLoop', () => ({ viewportSize: () => ({ width: 1000, height: 800 }) }))
// The test DOM has no canvas; the lift has its own test (glyphMetrics.test.ts)
vi.mock('./glyphMetrics', () => ({ inkLift: () => null }))

function glyphIn(block: HTMLElement) {
  const text = block.firstChild as Text
  const range = document.createRange()
  range.setStart(text, 0)
  range.setEnd(text, 1)
  return { range, rect: new DOMRect(0, 0, 10, 20) }
}

describe('heading letters get the small legs (plan 7 §7.1)', () => {
  it('marks a copy from a heading, not one from a paragraph', () => {
    document.body.innerHTML = '<main><h2>Title</h2><p>Body</p></main><div id="layer"></div>'
    const layer = document.getElementById('layer') as HTMLElement
    const heading = document.querySelector('h2') as HTMLElement
    const paragraph = document.querySelector('p') as HTMLElement
    expect(copyGlyph(glyphIn(heading), layer, heading).dataset.source).toBe('heading')
    expect(copyGlyph(glyphIn(paragraph), layer, paragraph).dataset.source).toBeUndefined()
  })
})

describe('the footer is a section of its own (plan 7 §7)', () => {
  it('finds the footer for a footer block and the section for a main block', () => {
    document.body.innerHTML = '<main><section><p>a</p></section></main><footer><p>b</p></footer>'
    const [inMain, inFooter] = Array.from(document.querySelectorAll('p'))
    expect(sectionOf(inMain as Element)?.tagName).toBe('SECTION')
    expect(sectionOf(inFooter as Element)?.tagName).toBe('FOOTER')
  })
})
