// Paragraphs and headings run on separate schedules (plan 5 §9), so each picker gets its own
// selector and never books a block of the other kind
export const paragraphSelector = 'p'
export const headingSelector = 'h1, h2, h3'
// `[data-pip-avoid]` no longer stops letters (plan 7 §7): the footer runs now, the form is
// skipped as a form, and the panel and the sticky bar are never searched. A new avoid zone
// inside `main` must add `data-letters="still"`.
const skipBlocksInside =
  'a, button, form, nav, dl, [role="status"], [data-letters="still"], [aria-hidden="true"]'
const skipTextInside = 'a, button, sup, [aria-hidden="true"], [data-decoding]'
const notSettled = '[data-decoding], [data-reveal="hidden"]'
const letter = /\p{L}/u
const sameWordReach = 4

export type LetterSpot = { node: Text; offset: number }

/**
 * Blocks whose letters may run (plan 4 §1): outside links, forms, the nav, the stats and blocks
 * that opt out, and only once nothing in them is still revealing or decoding.
 */
export function candidateBlocks(root: ParentNode, selector: string): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
    (block) =>
      !block.closest(skipBlocksInside) &&
      block.dataset.reveal !== 'hidden' &&
      !block.querySelector(notSettled),
  )
}

/** Every letter in the block's text: no spaces, digits or punctuation, nothing in links or copies. */
export function letterSpots(block: HTMLElement): LetterSpot[] {
  const walker = block.ownerDocument.createTreeWalker(block, NodeFilter.SHOW_TEXT)
  const spots: LetterSpot[] = []
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node as Text
    if (text.parentElement?.closest(skipTextInside)) continue
    for (let offset = 0; offset < text.data.length; offset += 1) {
      if (letter.test(text.data[offset] ?? '')) spots.push({ node: text, offset })
    }
  }
  return spots
}

/** One key per word, so a heading escape never takes two letters from the same word (plan 5 §9). */
export function wordKeys(spots: readonly LetterSpot[]): string[] {
  const nodes = new Map<Text, number>()
  return spots.map(({ node, offset }) => {
    if (!nodes.has(node)) nodes.set(node, nodes.size)
    const wordsBefore = node.data.slice(0, offset).split(/\s+/).length
    return `${nodes.get(node)}:${wordsBefore}`
  })
}

/** Document order, later offsets first within one text node. */
export function inDocumentOrder(spots: readonly LetterSpot[]) {
  return [...spots].sort((a, b) =>
    a.node === b.node
      ? b.offset - a.offset
      : a.node.compareDocumentPosition(b.node) & Node.DOCUMENT_POSITION_FOLLOWING
        ? -1
        : 1,
  )
}

/** `count` spots at random, never two neighbours, in document order. */
export function pickSpots(spots: readonly LetterSpot[], count: number, random: () => number) {
  const pool = [...spots]
  const picked: LetterSpot[] = []
  while (picked.length < count && pool.length > 0) {
    const index = Math.floor(random() * pool.length) % pool.length
    const [spot] = pool.splice(index, 1)
    if (!spot) break
    picked.push(spot)
    for (let other = pool.length - 1; other >= 0; other -= 1) {
      const candidate = pool[other]
      if (
        candidate?.node === spot.node &&
        Math.abs(candidate.offset - spot.offset) < sameWordReach
      ) {
        pool.splice(other, 1)
      }
    }
  }
  return inDocumentOrder(picked)
}
