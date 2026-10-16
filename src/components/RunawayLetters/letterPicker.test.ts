import { describe, expect, it } from 'vitest'
import {
  candidateBlocks,
  headingSelector,
  letterSpots,
  paragraphSelector,
  pickSpots,
  wordKeys,
} from './letterPicker'

function page(html: string) {
  const root = document.createElement('main')
  root.innerHTML = html
  return root
}

describe('candidateBlocks', () => {
  it('offers paragraphs and headings separately, not links, forms, the nav, stats or opted-out blocks', () => {
    const root = page(`
      <h2>It starts as one stroke</h2>
      <p>Body copy here.</p>
      <nav><p>Design</p></nav>
      <form><p>Enter your email</p></form>
      <dl><dd><p>31</p></dd></dl>
      <p data-letters="still">Lights up word by word</p>
      <p aria-hidden="true">Decoration</p>
      <a href="#x"><h3>Linked title</h3></a>
      <p data-reveal="hidden">Not yet shown</p>
      <p><span data-decoding="">Design study</span></p>
    `)
    const texts = (selector: string) =>
      candidateBlocks(root, selector).map((block) => block.textContent?.trim())
    expect(texts(headingSelector)).toEqual(['It starts as one stroke'])
    expect(texts(paragraphSelector)).toEqual(['Body copy here.'])
  })
})

describe('wordKeys', () => {
  it('gives every letter of one word the same key and other words and nodes their own', () => {
    const block = page('<h2>Four <em>decisions</em> behind it</h2>')
      .firstElementChild as HTMLElement
    const spots = letterSpots(block)
    const keys = wordKeys(spots)
    const glyphs = spots.map(({ node, offset }) => node.data[offset])
    const keyOf = (glyph: string, nth = 0) =>
      keys[glyphs.flatMap((g, index) => (g === glyph ? [index] : []))[nth] ?? -1]
    expect(keyOf('F')).toBe(keyOf('r'))
    expect(keyOf('d')).not.toBe(keyOf('F'))
    expect(keyOf('b')).not.toBe(keyOf('d'))
    expect(keyOf('i', 3)).toBe(keyOf('t'))
    expect(new Set(keys).size).toBe(4)
  })
})

describe('letterSpots', () => {
  it('skips spaces, digits, punctuation, links, footnote marks and hidden copies', () => {
    const block = page(
      '<p>Up 2x, <a href="#">not me</a><sup>1</sup> ok<span aria-hidden="true">no</span></p>',
    ).firstElementChild as HTMLElement
    const spots = letterSpots(block)
    const glyphs = spots.map(({ node, offset }) => node.data[offset])
    expect(glyphs.join('')).toBe('Upxok')
  })
})

describe('pickSpots', () => {
  it('returns distinct spots, no two from one word, later offsets first', () => {
    const block = page('<p>abcdefgh ijklmnop</p>').firstElementChild as HTMLElement
    const spots = letterSpots(block)
    const values = [0, 0, 0, 0]
    let turn = 0
    const random = () => values[turn++ % values.length] ?? 0
    const picked = pickSpots(spots, 3, random)
    expect(picked.length).toBeGreaterThan(0)
    const offsets = picked.map(({ offset }) => offset)
    expect(new Set(offsets).size).toBe(offsets.length)
    offsets.forEach((offset, index) => {
      offsets
        .slice(index + 1)
        .forEach((other) => expect(Math.abs(offset - other)).toBeGreaterThanOrEqual(4))
    })
    expect([...offsets].sort((a, b) => b - a)).toEqual(offsets)
  })

  it('stops when the pool runs dry', () => {
    const block = page('<p>ab</p>').firstElementChild as HTMLElement
    expect(pickSpots(letterSpots(block), 3, () => 0)).toHaveLength(1)
  })
})
