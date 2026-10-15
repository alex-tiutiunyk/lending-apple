import { useEffect, type RefObject } from 'react'
import { createAnimationDriver, supportsScrollTimeline } from './animationDriver'
import { subscribeScrollFrame, subscribeTick, write, type ScrollFrame } from './frameLoop'
import { mascotRequests } from './mascotRequests'
import { useReducedMotion } from './useReducedMotion'

const velocityCapPxPerMs = 4
const velocityDecayMs = 90
const velocityRestThreshold = 0.02
const endOfPage = 0.99
const docProgressSelector = '[data-doc-p]'

const velocityTargets = new Set<HTMLElement>()

/**
 * The scroll bus for `--scroll-v` (plan 6 §3.2): a consumer registers the element whose rule
 * reads the value, and `useDocumentProgress` writes the velocity on it, only while it or its
 * closest `[data-awake]` ancestor is awake. The property is registered `inherits: false`, so
 * the write restyles that element alone.
 */
export function useScrollVelocity(target: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = target.current
    if (!element) return
    velocityTargets.add(element)
    return () => {
      velocityTargets.delete(element)
      element.style.removeProperty('--scroll-v')
    }
  }, [target])
}

/**
 * The page position (plan 4 §2.1, plan 6 §3.1): `--doc-p` is a scroll timeline now, so the
 * backdrop and the header line follow it on the compositor. Where the browser has no
 * `animation-timeline` the hook drives the same keyframes through `currentTime` on each
 * `[data-doc-p]` consumer. The velocity (px per ms, capped at ±4, easing back to 0 after the
 * scroll stops) goes to the registered consumers; it ticks only while it is settling.
 */
export function useDocumentProgress() {
  const isReducedMotion = useReducedMotion()

  useEffect(() => {
    const hasTimeline = supportsScrollTimeline()
    let drivers: ReturnType<typeof createAnimationDriver>[] = []
    let wasAtEnd = false
    let velocity = 0
    let lastScrollY: number | null = null
    let lastScrollAt = 0
    let lastTickAt = 0
    let stopTicks: (() => void) | null = null

    const measure = () => {
      if (hasTimeline) return
      drivers = Array.from(document.querySelectorAll(docProgressSelector), (element) =>
        createAnimationDriver(element),
      )
      drivers.forEach((driver) => driver.refresh())
    }

    const writeVelocity = () => {
      const value = velocity.toFixed(3)
      const isAtRest = velocity === 0
      write(() => {
        velocityTargets.forEach((element) => {
          if (isAtRest || element.closest('[data-awake]')) {
            element.style.setProperty('--scroll-v', value)
          }
        })
      })
    }

    const onTick = (time: number) => {
      const elapsed = Math.min(100, time - lastTickAt)
      lastTickAt = time
      velocity *= Math.exp(-elapsed / velocityDecayMs)
      if (Math.abs(velocity) < velocityRestThreshold) {
        velocity = 0
        stopTicks?.()
        stopTicks = null
      }
      writeVelocity()
    }

    const onScroll = ({ scrollY, viewportHeight, documentHeight }: ScrollFrame) => {
      const scrollable = Math.max(1, documentHeight - viewportHeight)
      const progress = Math.min(1, Math.max(0, scrollY / scrollable))
      if (drivers.length > 0) write(() => drivers.forEach((driver) => driver.drive(progress)))
      // Reaching the end once asks Pip for its cheer (plan 4 §2.4); Pip keeps it to one per visit
      const isAtEnd = progress >= endOfPage
      if (isAtEnd && !wasAtEnd) mascotRequests.request({ type: 'cheer' })
      wasAtEnd = isAtEnd
      if (isReducedMotion) return

      const now = performance.now()
      if (lastScrollY !== null) {
        const raw = (scrollY - lastScrollY) / Math.max(1, now - lastScrollAt)
        velocity = Math.max(-velocityCapPxPerMs, Math.min(velocityCapPxPerMs, raw))
        writeVelocity()
        lastTickAt = now
        stopTicks ??= subscribeTick(onTick)
      }
      lastScrollY = scrollY
      lastScrollAt = now
    }

    const unsubscribe = subscribeScrollFrame(onScroll, measure)
    return () => {
      unsubscribe()
      stopTicks?.()
    }
  }, [isReducedMotion])
}
