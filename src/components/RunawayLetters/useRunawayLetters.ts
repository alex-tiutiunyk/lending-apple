import { useEffect, type RefObject } from 'react'
import {
  lastScrollY,
  subscribePointerFrame,
  subscribeScrollFrame,
  subscribeTick,
} from '@/hooks/frameLoop'
import { beginChase, createPipTracker } from './escapeChase'
import { planHeadingEscape, planParagraphEscape, sectionOf, settledBlocks } from './escapePlanner'
import type { Escape, EscapeKind } from './escapeRunner'
import { createEscapeSchedule } from './escapeSchedule'
import { createHeadingScheduler } from './headingScheduler'
import { headingSelector, paragraphSelector } from './letterPicker'
import { canHideGlyphs } from './letterWrap'
import { handleLetterRequests } from './letterRequestsHandler'

/**
 * Now and then a few letters grow legs, run off and come back (plan 4 §1). The real text never
 * changes: each glyph is painted transparent through a highlight range while a copy runs in
 * the overlay. Paragraphs take turns, and every second time, when Pip is idle, one letter runs
 * along Pip's line instead. Headings run on their own, quicker clock (plan 5 §9), one heading
 * at a time (plan 6 §11.1), and the footer on a third (plan 7 §7); the clocks live in
 * `escapeSchedule.ts`. Pip's throw knocks single letters out (`hit`, plan 7 §2). One gag per
 * section at a time. The tick measures nothing but Pip's box, once, in the read phase; the
 * glyphs' places are read again only on a layout change (plan 6 §5).
 */
export function useRunawayLetters(overlay: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const layer = overlay.current
    if (!layer || !canHideGlyphs()) return
    const main = document.querySelector('main') ?? document.body
    const footer = document.querySelector('footer')
    const escapes = new Set<Escape>()
    const pipTracker = createPipTracker()
    const scheduler = createHeadingScheduler<HTMLElement>(Math.random)
    let paragraphEscapes = 0
    let stopTicks: (() => void) | null = null
    let stopLayout: (() => void) | null = null

    const end = (escape: Escape) => {
      escape.end()
      escapes.delete(escape)
      if (escapes.size === 0) {
        stopTicks?.()
        stopLayout?.()
        stopTicks = null
        stopLayout = null
      }
      // Each kind reschedules only its own clock; a hit reschedules none
      if (escape.kind === 'heading') scheduler.ended(escape.block, performance.now())
      else if (escape.kind === 'paragraph') schedule.paragraphEnded()
      else if (escape.kind === 'footer') schedule.footerEnded()
    }
    const onTick = (now: number) => {
      const pip = pipTracker.current()
      const scrollY = lastScrollY()
      Array.from(escapes).forEach((escape) => {
        if (escape.step(now, pip, scrollY)) end(escape)
      })
    }
    const onLayout = () => {
      pipTracker.invalidate()
      const scrollY = window.scrollY
      escapes.forEach((escape) => escape.remeasure(scrollY))
    }
    const start = (escape: Escape | null): escape is Escape => {
      if (!escape) return false
      escapes.add(escape)
      stopTicks ??= subscribeTick(onTick)
      stopLayout ??= subscribeScrollFrame(() => undefined, onLayout)
      return true
    }

    // The sections where an escape of one of `kinds` is out right now, so a heading waits for a
    // paragraph letter there, a paragraph waits for a heading's, and a hit blocks both
    const busySections = (kinds: readonly EscapeKind[]) =>
      new Set(
        Array.from(escapes, (escape) =>
          kinds.includes(escape.kind) ? sectionOf(escape.block) : null,
        ),
      )
    const freeBlocks = (selector: string, root: ParentNode, blockedBy: readonly EscapeKind[]) => {
      const busy = busySections(blockedBy)
      return settledBlocks(selector, root).filter((block) => !busy.has(sectionOf(block)))
    }
    const isHeadingOut = (escape: Escape) => escape.block.matches(headingSelector)
    const pickOne = <T>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)]

    const schedule = createEscapeSchedule(
      {
        paragraph: () => {
          if (document.hidden) return false
          const block = pickOne(freeBlocks(paragraphSelector, main, ['heading', 'hit']))
          const now = performance.now()
          const escape = block ? planParagraphEscape(block, layer, now) : null
          if (!start(escape)) return false
          paragraphEscapes += 1
          const first = escape.letters[0]
          if (paragraphEscapes % 2 === 0 && first) beginChase(first, now)
          return true
        },
        headings: () => {
          const now = performance.now()
          if (!document.hidden) {
            scheduler.sync(settledBlocks(headingSelector, main), now)
            const busy = busySections(['paragraph', 'hit'])
            scheduler
              .due(now, (heading) => busy.has(sectionOf(heading)))
              .forEach((heading) => {
                if (start(planHeadingEscape(scheduler, heading, layer, now)))
                  scheduler.started(heading)
                else scheduler.ended(heading, now)
              })
          }
          return scheduler.nextDueAt()
        },
        footer: () => {
          if (document.hidden || !footer) return false
          const block = pickOne(freeBlocks(paragraphSelector, footer, ['footer', 'hit']))
          return start(
            block ? planParagraphEscape(block, layer, performance.now(), 'footer') : null,
          )
        },
      },
      footer,
    )

    const stopRequests = handleLetterRequests({
      main,
      layer,
      // One gag per section, and one heading at a time (plan 6 §11.1)
      isSectionFree: (block) =>
        !busySections(['paragraph', 'heading', 'hit']).has(sectionOf(block)) &&
        !(block.matches(headingSelector) && Array.from(escapes).some(isHeadingOut)),
      start,
    })
    const onPointer = ({ x, y }: { x: number; y: number }) => {
      const now = performance.now()
      escapes.forEach((escape) => escape.hurryNear(x, y, now))
    }
    const onVisibility = () => {
      if (document.hidden) Array.from(escapes).forEach(end)
    }

    const stopPointer = subscribePointerFrame(onPointer)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stopPointer()
      stopRequests()
      document.removeEventListener('visibilitychange', onVisibility)
      Array.from(escapes).forEach(end)
      schedule.stop()
    }
  }, [overlay])
}
