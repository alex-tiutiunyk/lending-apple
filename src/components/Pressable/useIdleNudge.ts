import { useEffect, useRef, type RefObject } from 'react'
import { useAmbientMotion } from '@/hooks/useAmbientMotion'

// Once three pulses of the (then finite) attention ring; the ring now loops (plan 4 §3)
const firstNudgeDelayMs = 7800
const intervalMs = 7000
const nudgeMs = 900
const maxNudgesPerEntry = 5
const kinds = ['buzz', 'sheen'] as const

/**
 * After the first pulses, nudge the button every 7 s while it is in view: buzz and sheen alternate,
 * at most 5 per entry into view, never again once the reader has hovered or focused it.
 */
export function useIdleNudge(target: RefObject<HTMLElement | null>, isEnabled: boolean) {
  const isAmbient = useAmbientMotion()
  // Outside the effect, so pausing and resuming motion does not bring the nudges back
  const isNoticed = useRef(false)

  useEffect(() => {
    const element = target.current
    if (!element || !isEnabled || !isAmbient) return

    let count = 0
    let isInView = false
    let nextTimer = 0
    let clearTimer = 0

    const fire = () => {
      if (isNoticed.current || !isInView || document.hidden || count >= maxNudgesPerEntry) return
      element.dataset.nudge = kinds[count % kinds.length]
      count += 1
      window.clearTimeout(clearTimer)
      clearTimer = window.setTimeout(() => delete element.dataset.nudge, nudgeMs)
      nextTimer = window.setTimeout(fire, intervalMs)
    }

    const observer = new IntersectionObserver(([entry]) => {
      window.clearTimeout(nextTimer)
      isInView = entry?.isIntersecting ?? false
      if (!isInView) return
      count = 0
      nextTimer = window.setTimeout(fire, firstNudgeDelayMs + intervalMs)
    })
    observer.observe(element)

    const onVisibility = () => {
      window.clearTimeout(nextTimer)
      if (!document.hidden && isInView) nextTimer = window.setTimeout(fire, intervalMs)
    }
    const notice = () => {
      isNoticed.current = true
      window.clearTimeout(nextTimer)
    }
    document.addEventListener('visibilitychange', onVisibility)
    element.addEventListener('pointerenter', notice)
    element.addEventListener('focusin', notice)
    return () => {
      observer.disconnect()
      window.clearTimeout(nextTimer)
      window.clearTimeout(clearTimer)
      delete element.dataset.nudge
      document.removeEventListener('visibilitychange', onVisibility)
      element.removeEventListener('pointerenter', notice)
      element.removeEventListener('focusin', notice)
    }
  }, [target, isEnabled, isAmbient])
}
