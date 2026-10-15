import { viewportSize, write } from '@/hooks/frameLoop'
import { mascotRequests } from '@/hooks/mascotRequests'
import type { createChaseRunner } from './letterChase'
import type { LetterSpot } from './letterPicker'
import { createLetterRunner, planRun, type RunRange } from './letterRun'
import { copyGlyph, hideGlyph, showGlyph } from './letterWrap'

const edgePx = 16
const hurryReachPx = 24

// `footer`: the footer's own clock (plan 7 §7); `hit`: a letter Pip's throw knocked out (§2)
export type EscapeKind = 'paragraph' | 'heading' | 'footer' | 'hit'

/** A box in document space: its viewport position is the box minus the frame's scroll. */
export type DocumentBox = { left: number; top: number; width: number; height: number }

export type Letter = {
  copy: HTMLElement
  range: Range
  /** Where the glyph sits in the document, cached at planning and after a layout change. */
  home: DocumentBox
  /** The copy's last written viewport position, for the pointer's reach test. */
  at: { x: number; y: number }
  runner: ReturnType<typeof createLetterRunner> | null
  chaser: ReturnType<typeof createChaseRunner> | null
  hasEnded: boolean
}

type EscapeOptions = {
  kind: EscapeKind
  block: HTMLElement
  spots: readonly LetterSpot[]
  layer: HTMLElement
  now: number
  random: () => number
  range: RunRange
}

export function isInViewport(rect: { top: number; bottom: number }) {
  return rect.top >= 0 && rect.bottom <= viewportSize().height
}

function toDocument(rect: DOMRect, scrollY: number): DocumentBox {
  return { left: rect.left, top: rect.top + scrollY, width: rect.width, height: rect.height }
}

/**
 * One escape (plan 4 §1, plan 5 §9): the chosen glyphs are hidden in place and their copies run
 * in the overlay until every copy is home again, or the block leaves the viewport. Nothing is
 * measured per frame (plan 6 §5): the home spots and the block's box are cached in document
 * space when the escape is planned, shifted by the scroll on each tick, and read again only on
 * a layout change through `remeasure`. Null when no glyph could be hidden.
 */
export function createEscape({ kind, block, spots, layer, now, random, range }: EscapeOptions) {
  const scrollAtPlan = window.scrollY
  let blockBox = toDocument(block.getBoundingClientRect(), scrollAtPlan)
  // Every glyph is measured before any copy enters the overlay, so the copies' DOM writes never
  // sit between two measurements (plan 6 §5)
  const hiddenGlyphs = spots.flatMap((spot) => hideGlyph(spot) ?? [])
  const letters: Letter[] = hiddenGlyphs.map((hidden) => {
    const { rect } = hidden
    const room = {
      left: rect.left - edgePx,
      right: window.innerWidth - rect.right - edgePx,
      up: rect.top - edgePx,
      down: window.innerHeight - rect.bottom - edgePx,
    }
    return {
      copy: copyGlyph(hidden, layer, block),
      range: hidden.range,
      home: toDocument(rect, scrollAtPlan),
      at: { x: rect.left, y: rect.top },
      runner: createLetterRunner(planRun(random, room, range), now),
      chaser: null,
      hasEnded: false,
    }
  })
  if (letters.length === 0) return null

  const place = (letter: Letter, x: number, y: number, tilt: number, phase: string) => {
    letter.at = { x, y }
    write(() => {
      letter.copy.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`
      letter.copy.style.rotate = `${tilt.toFixed(1)}deg`
      letter.copy.dataset.phase = phase
    })
  }

  return {
    kind,
    block,
    letters,

    /** Reads the glyphs' places and the block's box again (a layout change, read phase). */
    remeasure(scrollY: number) {
      blockBox = toDocument(block.getBoundingClientRect(), scrollY)
      letters.forEach((letter) => {
        const rect = letter.range.getClientRects()[0]
        if (rect) letter.home = toDocument(rect, scrollY)
      })
    },

    /** Advances every letter; true once all are done or the block has left the viewport. */
    step(now: number, pip: DOMRect | null, scrollY: number) {
      const blockTop = blockBox.top - scrollY
      if (!isInViewport({ top: blockTop, bottom: blockTop + blockBox.height })) return true
      const pipCenterX = pip ? pip.left + pip.width / 2 : -Infinity
      let isDone = true
      letters.forEach((letter) => {
        const homeTop = letter.home.top - scrollY
        if (letter.chaser) {
          // Pip's line moves with the sticky CTA, so the ground follows Pip's box each frame
          const groundY = pip ? pip.bottom - letter.home.height : undefined
          const frame = letter.chaser.step(now, pipCenterX, { groundY, homeY: homeTop })
          if (frame.turned) {
            mascotRequests.request({ type: 'chase', letterX: frame.x, direction: frame.direction })
          }
          if (frame.phase === 'home' && !letter.hasEnded) {
            letter.hasEnded = true
            mascotRequests.request({ type: 'chase-end' })
          }
          place(letter, frame.x, frame.y, 0, frame.phase)
          if (frame.phase !== 'done') isDone = false
          return
        }
        const frame = letter.runner?.step(now)
        if (!frame) return
        place(letter, letter.home.left + frame.x, homeTop + frame.y, frame.tilt, frame.phase)
        if (frame.phase !== 'done') isDone = false
      })
      return isDone
    },

    /** A pointer within reach sends a running letter home early (from the last written spot). */
    hurryNear(x: number, y: number, now: number) {
      letters.forEach((letter) => {
        const { width, height } = letter.home
        const gap = Math.hypot(x - (letter.at.x + width / 2), y - (letter.at.y + height / 2))
        if (gap < hurryReachPx) letter.runner?.hurryHome(now)
      })
    },

    /** Shows every glyph again and removes the copies; Pip is told a cut-short chase is over. */
    end() {
      letters.forEach((letter) => {
        if (letter.chaser && !letter.hasEnded) mascotRequests.request({ type: 'chase-end' })
        write(() => {
          letter.copy.remove()
          showGlyph(letter.range)
        })
      })
    },
  }
}

export type Escape = NonNullable<ReturnType<typeof createEscape>>
