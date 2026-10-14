import { useEffect, type RefObject } from 'react'
import { documentTop, subscribeScrollFrame, type ScrollFrame } from './frameLoop'
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

const progressPrecision = 1000

export function useScrollProgress(section: RefObject<HTMLElement | null>) {
  const isStatic = useStaticScenes()

  useEffect(() => {
    const element = section.current
    if (!element) return

    if (isStatic) {
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
  }, [section, isStatic])
}
