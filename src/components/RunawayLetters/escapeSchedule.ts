import { readInNextFrame } from '@/hooks/frameLoop'

const firstParagraphMs = 5000
const shortestParagraphGapMs = 10_000
const longestParagraphGapMs = 15_000
const firstFooterMs = 1500
const shortestFooterGapMs = 5000
const longestFooterGapMs = 8000
const retryMs = 2000
const headingPollMs = 1000

export type EscapeRuns = {
  /** Starts a paragraph escape; false when nothing could run, so it is tried again soon. */
  paragraph: () => boolean
  /** Starts the headings that are due; returns when the next one is due, or null. */
  headings: () => number | null
  /** Starts a footer escape; false when nothing could run. */
  footer: () => boolean
}

/**
 * The clocks of the runaway letters (plan 7 §2, §7), out of `useRunawayLetters` so each kind of
 * escape keeps its own rhythm: paragraphs every 10–15 s, headings on their scheduler's due times,
 * and the footer every 5–8 s while it is in view (it only shows at the end of the page, so it
 * cannot wait for the paragraph turn). Each run happens in the read phase of a frame. An escape's
 * end reschedules only its own clock: a `hit` from Pip's throw touches none.
 */
export function createEscapeSchedule(
  runs: EscapeRuns,
  footer: Element | null,
  random: () => number = Math.random,
) {
  let paragraphTimer = 0
  let headingTimer = 0
  let footerTimer = 0
  let isFooterInView = false
  const between = (shortest: number, longest: number) => shortest + random() * (longest - shortest)

  const scheduleParagraph = (ms: number) => {
    window.clearTimeout(paragraphTimer)
    paragraphTimer = window.setTimeout(
      () => readInNextFrame(() => runs.paragraph() || scheduleParagraph(retryMs)),
      ms,
    )
  }
  const scheduleFooter = (ms: number) => {
    window.clearTimeout(footerTimer)
    if (!isFooterInView) return
    footerTimer = window.setTimeout(
      () => readInNextFrame(() => runs.footer() || scheduleFooter(retryMs)),
      ms,
    )
  }
  const pollHeadings = (ms: number) => {
    headingTimer = window.setTimeout(
      () =>
        readInNextFrame(() => {
          const now = performance.now()
          const next = runs.headings()
          pollHeadings(
            next === null ? headingPollMs : Math.min(headingPollMs, Math.max(50, next - now)),
          )
        }),
      ms,
    )
  }

  const footerObserver = footer
    ? new IntersectionObserver(([entry]) => {
        isFooterInView = !!entry?.isIntersecting
        if (isFooterInView) scheduleFooter(firstFooterMs)
        else window.clearTimeout(footerTimer)
      })
    : null
  if (footer) footerObserver?.observe(footer)
  scheduleParagraph(firstParagraphMs)
  pollHeadings(headingPollMs)

  return {
    paragraphEnded: () => scheduleParagraph(between(shortestParagraphGapMs, longestParagraphGapMs)),
    footerEnded: () => scheduleFooter(between(shortestFooterGapMs, longestFooterGapMs)),
    stop() {
      footerObserver?.disconnect()
      window.clearTimeout(paragraphTimer)
      window.clearTimeout(headingTimer)
      window.clearTimeout(footerTimer)
    },
  }
}
