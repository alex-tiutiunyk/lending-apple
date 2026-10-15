import { useEffect, type RefObject } from 'react'
import { createAnimationDriver, supportsScrollTimeline } from './animationDriver'
import { documentTop, subscribeScrollFrame, write, type ScrollFrame } from './frameLoop'
import { useStaticScenes } from './useReducedMotion'

type PinnedGeometry = {
  top: number
  scrollLength: number
}

const subpixelSlack = 1

export function pinnedProgress(scrollY: number, { top, scrollLength }: PinnedGeometry) {
  const travelled = scrollY - top
  if (travelled < 0) return 0
  if (travelled >= scrollLength - subpixelSlack) return 1
  return travelled / scrollLength
}

/**
 * A pinned section's scroll (plan 6 §4): the scene runs on the section's view timeline, so this
 * hook only toggles `data-near` (two viewports around, for `will-change` and the particles).
 * Where the browser has no `animation-timeline` it drives the same keyframes through
 * `currentTime` from the pinned progress. A static scene (reduced motion, large text) has
 * no animations to drive and no promotion.
 */
export function useScrollProgress(section: RefObject<HTMLElement | null>) {
  const isStatic = useStaticScenes()

  useEffect(() => {
    const element = section.current
    if (!element) return

    if (isStatic) {
      element.removeAttribute('data-near')
      return
    }

    const stage = element.querySelector<HTMLElement>('[data-stage]')
    const driver = supportsScrollTimeline() ? null : createAnimationDriver(element, true)
    const geometry: PinnedGeometry = { top: 0, scrollLength: 0 }
    let height = 0
    let isNear = false

    const measure = () => {
      geometry.top = documentTop(element)
      height = element.offsetHeight
      // A skipped section (content-visibility) lays out no stage: the viewport stands in
      geometry.scrollLength = height - (stage?.offsetHeight || window.innerHeight)
      driver?.refresh()
    }

    const update = ({ scrollY, viewportHeight }: ScrollFrame) => {
      if (driver) {
        const progress = pinnedProgress(scrollY, geometry)
        write(() => driver.drive(progress))
      }

      const nearNow =
        scrollY + viewportHeight * 2 > geometry.top &&
        scrollY - viewportHeight < geometry.top + height
      if (nearNow !== isNear) {
        isNear = nearNow
        write(() => element.toggleAttribute('data-near', nearNow))
      }
    }

    const unsubscribe = subscribeScrollFrame(update, measure)
    return () => {
      unsubscribe()
      element.removeAttribute('data-near')
    }
  }, [section, isStatic])
}
