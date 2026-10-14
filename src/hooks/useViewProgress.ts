import { useEffect, type RefObject } from 'react'
import { documentTop, subscribeScrollFrame, type ScrollFrame } from './frameLoop'
import { useReducedMotion } from './useReducedMotion'

const startShare = 0.9
const lengthShare = 0.5
const progressPrecision = 1000

/** Progress 0 → 1 as an element's top travels from 90 % to 40 % of the viewport height. */
export function crossingProgress(viewportTop: number, viewportHeight: number) {
  const travelled = viewportHeight * startShare - viewportTop
  return Math.min(1, Math.max(0, travelled / (viewportHeight * lengthShare)))
}

/** Writes `--p` for an element crossing the viewport (not pinned, unlike useScrollProgress). */
export function useViewProgress(target: RefObject<HTMLElement | null>) {
  const isReducedMotion = useReducedMotion()

  useEffect(() => {
    const element = target.current
    if (!element) return
    if (isReducedMotion) {
      element.style.setProperty('--p', '1')
      return
    }

    let top = 0
    let written = -1
    const measure = () => {
      top = documentTop(element)
    }
    const update = ({ scrollY, viewportHeight }: ScrollFrame) => {
      const progress =
        Math.round(crossingProgress(top - scrollY, viewportHeight) * progressPrecision) /
        progressPrecision
      if (progress === written) return
      written = progress
      element.style.setProperty('--p', String(progress))
    }
    return subscribeScrollFrame(update, measure)
  }, [target, isReducedMotion])
}
