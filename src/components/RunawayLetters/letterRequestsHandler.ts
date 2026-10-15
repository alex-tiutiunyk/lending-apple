import { letterRequests } from '@/hooks/letterRequests'
import { viewportSize } from '@/hooks/frameLoop'
import { settledBlocks } from './escapePlanner'
import { createEscape, isInViewport, type Escape } from './escapeRunner'
import { headingSelector, letterSpots, paragraphSelector, type LetterSpot } from './letterPicker'
import { hitRun } from './letterRun'

const keepMs = 3000
const reachPx = 900
const upperShare = 0.3
const movedPx = 8

type Aimed = { spot: LetterSpot; block: HTMLElement; y: number; at: number }

type HandlerOptions = {
  main: ParentNode
  layer: HTMLElement
  /** No other gag is out in the block's section (and, for a heading, no other heading's). */
  isSectionFree: (block: HTMLElement) => boolean
  start: (escape: Escape | null) => boolean
  random?: () => number
}

function glyphRect({ node, offset }: LetterSpot) {
  const range = node.ownerDocument.createRange()
  range.setStart(node, offset)
  range.setEnd(node, offset + 1)
  return range.getClientRects()[0] ?? null
}

/**
 * The letters' side of Pip's throw (plan 7 §2). `aim` picks a glyph with the usual rules (settled
 * blocks in `main`, never the footer, one gag per section, one heading at a time), preferring
 * blocks in the lower 70 % of the viewport within 900 px of Pip (any free block when none is
 * there), and replies with its centre, or with null when nothing is free. `hit` pops that glyph out
 * as a `hit` escape. Aimed spots are kept 3 s; a hit on a glyph that scrolled away is dropped.
 */
export function handleLetterRequests({
  main,
  layer,
  isSectionFree,
  start,
  random = Math.random,
}: HandlerOptions) {
  const aimed = new Map<number, Aimed>()
  let nextId = 1

  return letterRequests.subscribe((request) => {
    const now = performance.now()
    aimed.forEach((entry, id) => {
      if (now - entry.at > keepMs) aimed.delete(id)
    })

    if (request.type === 'aim') {
      const { height } = viewportSize()
      const free = [
        ...settledBlocks(paragraphSelector, main),
        ...settledBlocks(headingSelector, main),
      ].filter(isSectionFree)
      const near = free.filter((block) => {
        const rect = block.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        return rect.top > height * upperShare && Math.abs(centerX - request.fromX) < reachPx
      })
      const blocks = near.length > 0 ? near : free
      const block = blocks[Math.floor(random() * blocks.length)]
      const spots = block ? letterSpots(block) : []
      const spot = spots[Math.floor(random() * spots.length)]
      const rect = spot ? glyphRect(spot) : null
      if (!block || !spot || !rect) {
        request.reply(null)
        return true
      }
      const spotId = nextId
      nextId += 1
      aimed.set(spotId, { spot, block, y: rect.top, at: now })
      request.reply({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, spotId })
      return true
    }

    const entry = aimed.get(request.spotId)
    aimed.delete(request.spotId)
    if (!entry || request.missed) return true
    const rect = glyphRect(entry.spot)
    const isStale =
      !rect ||
      Math.abs(rect.top - entry.y) > movedPx ||
      !isInViewport(entry.block.getBoundingClientRect()) ||
      !isSectionFree(entry.block)
    if (isStale) return true
    start(
      createEscape({
        kind: 'hit',
        block: entry.block,
        spots: [entry.spot],
        layer,
        now,
        random,
        range: hitRun,
      }),
    )
    return true
  })
}
