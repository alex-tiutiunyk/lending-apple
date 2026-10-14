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

/** The block and its words have finished revealing: nothing in it is still fading or moving. */
export function isSettled(block: HTMLElement) {
  const style = getComputedStyle(block)
  if (style.opacity !== '1') return false
  const firstWord = block.querySelector('span')
  return !firstWord || getComputedStyle(firstWord).opacity === '1'
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

/** A copy of the glyph in the overlay with the same font, size and color, plus two legs. */
export function copyGlyph({ range, rect }: Hidden, layer: HTMLElement) {
  const source = range.startContainer.parentElement
  const copy = layer.ownerDocument.createElement('span')
  copy.className = styles.letter ?? ''
  copy.textContent = range.toString()
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
  for (let leg = 0; leg < 2; leg += 1) {
    const span = layer.ownerDocument.createElement('span')
    span.className = styles.leg ?? ''
    copy.append(span)
  }
  layer.append(copy)
  return copy
}
