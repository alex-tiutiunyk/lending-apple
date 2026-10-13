import { useEffect, type RefObject } from 'react'
import { useMotionPaused } from './motionPause'
import { useReducedMotion } from './useReducedMotion'

const awakeAttribute = 'data-awake'
let sharedObserver: IntersectionObserver | null = null
let observedCount = 0

function observerForAmbient() {
  sharedObserver ??= new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      target.toggleAttribute(awakeAttribute, isIntersecting)
    })
  })
  return sharedObserver
}

export function useAwakeWhileInView(target: RefObject<Element | null>) {
  useEffect(() => {
    const element = target.current
    if (!element) return

    const observer = observerForAmbient()
    observer.observe(element)
    observedCount += 1
    return () => {
      observer.unobserve(element)
      element.removeAttribute(awakeAttribute)
      observedCount -= 1
      if (observedCount === 0) {
        observer.disconnect()
        sharedObserver = null
      }
    }
  }, [target])
}

export function useAmbientMotion() {
  const isReducedMotion = useReducedMotion()
  const isPaused = useMotionPaused()
  return !isReducedMotion && !isPaused
}
