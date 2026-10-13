import { useEffect, type RefObject } from 'react'
import { useReducedMotion } from './useReducedMotion'

function supportsScrollTimeline() {
  return typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()')
}

export function useReveal(target: RefObject<HTMLElement | null>) {
  const isReducedMotion = useReducedMotion()

  useEffect(() => {
    const element = target.current
    if (!element || isReducedMotion || supportsScrollTimeline()) return

    const isAlreadyVisible = element.getBoundingClientRect().top < window.innerHeight
    if (isAlreadyVisible) return

    element.dataset.reveal = 'hidden'
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        element.dataset.reveal = 'shown'
        observer.disconnect()
      },
      { rootMargin: '0px 0px -12% 0px' },
    )
    observer.observe(element)
    return () => {
      observer.disconnect()
      if (element.dataset.reveal === 'hidden') delete element.dataset.reveal
    }
  }, [target, isReducedMotion])
}
