import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEscape } from './escapeRunner'
import { letterSpots } from './letterPicker'
import { paragraphRun } from './letterRun'

// The test DOM has no canvas; the leg lift has its own test (glyphMetrics.test.ts)
vi.mock('./glyphMetrics', () => ({ inkLift: () => null }))

class FakeHighlight {
  ranges = new Set<Range>()
  add(range: Range) {
    this.ranges.add(range)
  }
  delete(range: Range) {
    this.ranges.delete(range)
  }
  get size() {
    return this.ranges.size
  }
}

const home = { left: 100, top: 50, width: 10, height: 20, right: 110, bottom: 70 }
const rect = () => ({ ...home, x: home.left, y: home.top, toJSON: () => '' }) as DOMRect
const blockBox = { left: 80, top: 40, width: 200, height: 100, right: 280, bottom: 140 }
const blockRect = () =>
  ({ ...blockBox, x: blockBox.left, y: blockBox.top, toJSON: () => '' }) as DOMRect

function setup() {
  document.body.innerHTML = '<main><p>Hello</p></main><div id="layer"></div>'
  const block = document.querySelector('p') as HTMLElement
  const layer = document.querySelector('#layer') as HTMLElement
  const spots = letterSpots(block).slice(0, 1)
  const escape = createEscape({
    kind: 'paragraph',
    block,
    spots,
    layer,
    now: 1000,
    random: () => 0.25,
    range: paragraphRun,
  })
  return { block, layer, escape }
}

describe('createEscape (plan 5 §9, plan 6 §5)', () => {
  beforeEach(() => {
    vi.stubGlobal('Highlight', FakeHighlight)
    vi.stubGlobal('CSS', { highlights: new Map() })
    Range.prototype.getClientRects = () => [rect()] as unknown as DOMRectList
    Range.prototype.getBoundingClientRect = rect
    HTMLElement.prototype.getBoundingClientRect = blockRect
    home.left = 100
    home.top = 50
    window.scrollY = 0
  })
  afterEach(() => vi.unstubAllGlobals())

  it('hides the glyph, runs a copy from the glyph’s cached place each frame and ends at home', () => {
    const { layer, escape } = setup()
    expect(escape).not.toBeNull()
    if (!escape) return
    const copy = layer.firstElementChild as HTMLElement
    expect(copy.textContent).toBe('H')
    const clientRects = vi.spyOn(Range.prototype, 'getClientRects')
    const blockReads = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    expect(escape.step(1000, null, 0)).toBe(false)
    expect(copy.style.translate).toBe('100.0px 50.0px')
    expect(copy.style.rotate).toBe('0.0deg')
    // A scrolled page shifts the cached home without a measurement
    expect(escape.step(1001, null, 30)).toBe(false)
    expect(copy.style.translate.endsWith(' 20.0px')).toBe(true)
    expect(clientRects).not.toHaveBeenCalled()
    expect(blockReads).not.toHaveBeenCalled()
    // A layout change (the word moved): the place is read again, once
    home.left = 130
    home.top = 60
    escape.remeasure(0)
    expect(clientRects).toHaveBeenCalledTimes(1)
    expect(escape.step(1002, null, 0)).toBe(false)
    expect(copy.style.translate.startsWith('130.0px')).toBe(true)
    const tripMs = 200 + 2 * (700 + 0.25 * 400) + 400 + 250
    expect(escape.step(1000 + tripMs + 10, null, 0)).toBe(true)
    expect(copy.style.translate).toBe('130.0px 60.0px')
    escape.end()
    expect(layer.children).toHaveLength(0)
  })

  it('is over as soon as its block leaves the viewport', () => {
    const { escape } = setup()
    expect(escape?.step(1000, null, 0)).toBe(false)
    // The block's box is cached; it leaves the viewport through the scroll alone
    expect(escape?.step(1001, null, 200)).toBe(true)
    HTMLElement.prototype.getBoundingClientRect = () =>
      ({ ...blockRect(), top: -40, bottom: -20 }) as DOMRect
    const { escape: gone } = setup()
    expect(gone?.step(1000, null, 0)).toBe(true)
  })

  it('hurries a letter home from its last written spot, without measuring', () => {
    const { escape } = setup()
    if (!escape) return
    const copyRect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    escape.step(1000, null, 0)
    escape.hurryNear(105, 60, 1000)
    expect(copyRect).not.toHaveBeenCalled()
  })

  it('is null when no glyph could be hidden', () => {
    Range.prototype.getClientRects = () => [] as unknown as DOMRectList
    expect(setup().escape).toBeNull()
  })
})
