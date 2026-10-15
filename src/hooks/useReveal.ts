import { useEffect, type RefObject } from 'react'
import { supportsScrollTimeline } from './animationDriver'
import { useReducedMotion } from './useReducedMotion'

type RevealOptions = {
  /** A title: its words rise through transitions, never through a scroll timeline (plan 6 §9). */
  words?: boolean
}

// Past this line the `entry 62 %` range of the reveal mixin is over for any block shorter than
// about 0.6 of the viewport, so the scroll-driven animation can go
const doneMargin = '0px 0px -40% 0px'
const enterMargin = '0px 0px -12% 0px'
const revealBackstopMs = 1200

/**
 * The reveal state on the block, read by the runaway letters' `isSettled`:
 * - scroll timelines: `view` (the mixin's animation runs, the block keeps a layer) → `done`
 *   (past its range, `animation: none`, end state, layer gone);
 * - transitions (no timeline, or a title's words): no attribute while visible at load,
 *   else `hidden` → `shown` (transition running) → `done` (transition ended).
 */
export function useReveal(
  target: RefObject<HTMLElement | null>,
  { words = false }: RevealOptions = {},
) {
  const isReducedMotion = useReducedMotion()

  useEffect(() => {
    const element = target.current
    if (!element || isReducedMotion) return

    if (supportsScrollTimeline() && !words) {
      element.dataset.reveal = 'view'
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting) return
          element.dataset.reveal = 'done'
          observer.disconnect()
        },
        { rootMargin: doneMargin },
      )
      observer.observe(element)
      return () => {
        observer.disconnect()
        delete element.dataset.reveal
      }
    }

    const isAlreadyVisible = element.getBoundingClientRect().top < window.innerHeight
    if (isAlreadyVisible) return

    element.dataset.reveal = 'hidden'
    let backstop = 0
    const done = () => {
      window.clearTimeout(backstop)
      element.removeEventListener('transitionend', done)
      if (element.dataset.reveal === 'shown') element.dataset.reveal = 'done'
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        element.dataset.reveal = 'shown'
        observer.disconnect()
        // A title's words end their transitions one after another; the last one bubbles up
        element.addEventListener('transitionend', done)
        backstop = window.setTimeout(done, revealBackstopMs)
      },
      { rootMargin: enterMargin },
    )
    observer.observe(element)
    return () => {
      observer.disconnect()
      window.clearTimeout(backstop)
      element.removeEventListener('transitionend', done)
      if (element.dataset.reveal === 'hidden') delete element.dataset.reveal
    }
  }, [target, isReducedMotion, words])
}
