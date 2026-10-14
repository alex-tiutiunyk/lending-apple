const blockSelector = 'h1, h2, h3, p'
const skipBlocksInside =
  'a, button, form, nav, dl, [data-pip-avoid], [role="status"], [data-letters="still"], [aria-hidden="true"]'
const skipTextInside = 'a, button, sup, [aria-hidden="true"], [data-decoding]'
const notSettled = '[data-decoding], [data-reveal="hidden"]'
const letter = /\p{L}/u
const sameWordReach = 4

export type LetterSpot = { node: Text; offset: number }

/**
 * Headings and paragraphs whose letters may run (plan 4 §1): outside links, forms, the nav, the
 * stats and blocks that opt out, and only once nothing in them is still revealing or decoding.
 */
export function candidateBlocks(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(blockSelector)).filter(
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

/**
 * `count` spots at random, never two neighbours, in document order with later offsets first
 * within one text node, so wrapping one spot does not move the offsets of the next.
 */
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
  return picked.sort((a, b) =>
    a.node === b.node
      ? b.offset - a.offset
      : a.node.compareDocumentPosition(b.node) & Node.DOCUMENT_POSITION_FOLLOWING
        ? -1
        : 1,
  )
}
