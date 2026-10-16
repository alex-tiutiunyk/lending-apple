import { inkLift } from './glyphMetrics'
import type { LetterSpot } from './letterPicker'
import styles from './RunawayLetters.module.scss'

const highlightName = 'runaway-letters'
const copiedStyles = ['font', 'letterSpacing', 'textTransform', 'color'] as const

export type Hidden = { range: Range; rect: DOMRect }

let highlight: Highlight | null = null

/**
 * The glyph is hidden through the CSS Custom Highlight API: a Range painted transparent, no
 * element around it, so the text node, the kerning and the layout stay exactly as they are.
 * Without the API (older browsers) the letters simply never run.
 */
export function canHideGlyphs() {
  return typeof Highlight === 'function' && 'highlights' in CSS
}

function sharedHighlight() {
  if (!highlight) {
    highlight = new Highlight()
    CSS.highlights.set(highlightName, highlight)
  }
  return highlight
}

/**
 * The block has finished revealing: `useReveal` marks a block `done` once its reveal is over and
 * leaves no attribute on one that never reveals (the hero title, a block visible at load), so
 * this is an attribute read, never a computed style (plan 6 §5).
 */
export function isSettled(block: HTMLElement) {
  const reveal = block.dataset.reveal
  return reveal === undefined || reveal === 'done'
}

/** Hides one glyph and reports where it was drawn. */
export function hideGlyph({ node, offset }: LetterSpot): Hidden | null {
  const range = node.ownerDocument.createRange()
  range.setStart(node, offset)
  range.setEnd(node, offset + 1)
  const rect = range.getClientRects()[0]
  if (!rect || rect.width === 0) return null
  sharedHighlight().add(range)
  return { range, rect }
}

export function showGlyph(range: Range) {
  highlight?.delete(range)
}

const headingBlocks = 'h1, h2, h3'

/**
 * A copy of the glyph in the overlay with the same font, size and color, plus two legs. A letter
 * from a heading gets legs 1.5 times smaller (plan 7 §7.1): by its block, whatever the escape.
 */
export function copyGlyph({ range, rect }: Hidden, layer: HTMLElement, block: HTMLElement) {
  const source = range.startContainer.parentElement
  const copy = layer.ownerDocument.createElement('span')
  copy.className = styles.letter ?? ''
  copy.textContent = range.toString()
  if (block.matches(headingBlocks)) copy.dataset.source = 'heading'
  if (source) {
    const computed = getComputedStyle(source)
    copiedStyles.forEach((property) => {
      copy.style[property] = computed[property]
    })
  }
  copy.style.width = `${rect.width}px`
  copy.style.height = `${rect.height}px`
  copy.style.lineHeight = `${rect.height}px`
  copy.style.translate = `${rect.left}px ${rect.top}px`
  // Once, before it moves: the legs start at the bottom of the ink, not of the box (plan 8 §2)
  const text = copy.textContent
  const shown = copy.style.textTransform === 'uppercase' ? text.toUpperCase() : text
  // Built from the longhands: WebKit serialises no `font` shorthand once a longhand it cannot
  // express (`font-width`, `font-variant-emoji`) is set, so `copy.style.font` is empty there
  const { fontStyle, fontWeight, fontSize, fontFamily } = copy.style
  const lift = inkLift(`${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`.trim(), shown)
  if (lift !== null) copy.style.setProperty('--leg-lift', `${lift.toFixed(2)}px`)
  for (let leg = 0; leg < 2; leg += 1) {
    const span = layer.ownerDocument.createElement('span')
    span.className = styles.leg ?? ''
    copy.append(span)
  }
  layer.append(copy)
  return copy
}
