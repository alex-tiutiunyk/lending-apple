import { useEffect, type RefObject } from 'react'
import { createAnimationDriver, supportsScrollTimeline } from './animationDriver'
import { documentTop, subscribeScrollFrame, write, type ScrollFrame } from './frameLoop'
import { useReducedMotion } from './useReducedMotion'

const startShare = 0.9
const lengthShare = 0.5

/** Progress 0 → 1 as an element's top travels from 90 % to 40 % of the viewport height. */
export function crossingProgress(viewportTop: number, viewportHeight: number) {
  const travelled = viewportHeight * startShare - viewportTop
  return Math.min(1, Math.max(0, travelled / (viewportHeight * lengthShare)))
}

/**
 * The crossing of an element that is not pinned (plan 6 §3.4): where the browser has view
 * timelines its keyframes run on their own and the hook does nothing; elsewhere it drives the
 * paused keyframes in the element's subtree from `crossingProgress` and marks the element
 * `data-driven`, so the stylesheet knows a driver is there (without JS nothing is dimmed).
 */
export function useViewProgress(target: RefObject<HTMLElement | null>) {
  const isReducedMotion = useReducedMotion()

  useEffect(() => {
    const element = target.current
    if (!element || isReducedMotion || supportsScrollTimeline()) return

    element.setAttribute('data-driven', '')
    const driver = createAnimationDriver(element, true)
    let top = 0
    const measure = () => {
      top = documentTop(element)
      driver.refresh()
    }
    const update = ({ scrollY, viewportHeight }: ScrollFrame) => {
      const progress = crossingProgress(top - scrollY, viewportHeight)
      write(() => driver.drive(progress))
    }
    const unsubscribe = subscribeScrollFrame(update, measure)
    return () => {
      unsubscribe()
      element.removeAttribute('data-driven')
    }
  }, [target, isReducedMotion])
}
