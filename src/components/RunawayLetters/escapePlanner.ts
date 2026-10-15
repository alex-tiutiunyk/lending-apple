import { createEscape, isInViewport } from './escapeRunner'
import { mostLetters as mostHeadingLetters, type HeadingScheduler } from './headingScheduler'
import { candidateBlocks, inDocumentOrder, letterSpots, pickSpots, wordKeys } from './letterPicker'
import { headingRun, paragraphRun } from './letterRun'
import { isSettled } from './letterWrap'

const mostParagraphLetters = 3

/**
 * Candidate blocks of one kind inside `root` (`main`, or the footer since plan 7 §7) that are
 * settled and fully in view right now.
 */
export function settledBlocks(selector: string, root: ParentNode) {
  return candidateBlocks(root, selector).filter(
    (block) => isInViewport(block.getBoundingClientRect()) && isSettled(block),
  )
}

// The footer is a section of its own for the one-gag-per-section rule (plan 7 §7)
export const sectionOf = (block: Element) => block.closest('section, footer')

/**
 * A paragraph escape: 1–3 letters at random, never two neighbours (plan 4 §1). The footer's
 * paragraphs run the same way on their own clock (plan 7 §7).
 */
export function planParagraphEscape(
  block: HTMLElement,
  layer: HTMLElement,
  now: number,
  kind: 'paragraph' | 'footer' = 'paragraph',
) {
  const count = 1 + Math.floor(Math.random() * mostParagraphLetters)
  const spots = pickSpots(letterSpots(block), count, Math.random)
  return createEscape({
    kind,
    block,
    spots,
    layer,
    now,
    random: Math.random,
    range: paragraphRun,
  })
}

/** A heading escape: 1–2 letters from the heading's bag, never two from one word (plan 5 §9). */
export function planHeadingEscape(
  scheduler: HeadingScheduler<HTMLElement>,
  heading: HTMLElement,
  layer: HTMLElement,
  now: number,
) {
  const spots = letterSpots(heading)
  const words = wordKeys(spots)
  const count = 1 + Math.floor(Math.random() * mostHeadingLetters)
  const drawn = scheduler.draw(heading, count, spots.length, (index) => words[index] ?? '')
  return createEscape({
    kind: 'heading',
    block: heading,
    spots: inDocumentOrder(drawn.flatMap((index) => spots[index] ?? [])),
    layer,
    now,
    random: Math.random,
    range: headingRun,
  })
}
