import { useEffect, type RefObject } from 'react'
import { documentTop, subscribeScrollFrame, type ScrollFrame } from './frameLoop'
import { useReducedMotion } from './useReducedMotion'

type PinnedGeometry = {
  top: number
  scrollLength: number
}

export function pinnedProgress(scrollY: number, { top, scrollLength }: PinnedGeometry) {
  if (scrollLength <= 0) return scrollY >= top ? 1 : 0
  return Math.min(1, Math.max(0, (scrollY - top) / scrollLength))
}

const progressPrecision = 1000

export function useScrollProgress(section: RefObject<HTMLElement | null>) {
  const isReducedMotion = useReducedMotion()

  useEffect(() => {
    const element = section.current
    if (!element) return

    if (isReducedMotion) {
      element.style.setProperty('--p', '1')
      element.removeAttribute('data-near')
      return
    }

    const stage = element.querySelector<HTMLElement>('[data-stage]')
    const geometry: PinnedGeometry = { top: 0, scrollLength: 0 }
    let height = 0
    let writtenProgress = -1
    let isNear = false

    const measure = () => {
      geometry.top = documentTop(element)
      height = element.offsetHeight
      geometry.scrollLength = height - (stage?.offsetHeight ?? window.innerHeight)
    }

    const update = ({ scrollY, viewportHeight }: ScrollFrame) => {
      const progress =
        Math.round(pinnedProgress(scrollY, geometry) * progressPrecision) / progressPrecision
      if (progress !== writtenProgress) {
        writtenProgress = progress
        element.style.setProperty('--p', String(progress))
      }

      const nearNow =
        scrollY + viewportHeight * 2 > geometry.top &&
        scrollY - viewportHeight < geometry.top + height
      if (nearNow !== isNear) {
        isNear = nearNow
        element.toggleAttribute('data-near', nearNow)
      }
    }

    const unsubscribe = subscribeScrollFrame(update, measure)
    return () => {
      unsubscribe()
      element.removeAttribute('data-near')
    }
  }, [section, isReducedMotion])
}
