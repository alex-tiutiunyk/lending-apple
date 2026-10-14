import { useEffect } from 'react'
import { subscribeScrollFrame, subscribeTick, type ScrollFrame } from './frameLoop'
import { mascotRequests } from './mascotRequests'
import { useReducedMotion } from './useReducedMotion'

const velocityCapPxPerMs = 4
const velocityDecayMs = 90
const velocityRestThreshold = 0.02
const endOfPage = 0.99

/**
 * One writer for the page position (plan 4 §2.1): `--doc-p` (0 … 1 through the document) and,
 * with motion on, `--scroll-v` (px per ms, capped at ±4, easing back to 0 after the scroll stops)
 * on `<body>`, where the backdrop, the header line and the living marks read them. The values go
 * on `<body>` rather than `<html>` because the particles watch `<html>`'s style attribute for
 * finish changes. The velocity ticks only while it is settling, so idle frames stay at zero.
 */
export function useDocumentProgress() {
  const isReducedMotion = useReducedMotion()

  useEffect(() => {
    const target = document.body
    let writtenProgress = ''
    let wasAtEnd = false
    let velocity = 0
    let lastScrollY: number | null = null
    let lastScrollAt = 0
    let lastTickAt = 0
    let stopTicks: (() => void) | null = null

    const writeVelocity = () => {
      target.style.setProperty('--scroll-v', velocity.toFixed(3))
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
      const progress = Math.min(1, Math.max(0, scrollY / scrollable)).toFixed(3)
      if (progress !== writtenProgress) {
        writtenProgress = progress
        target.style.setProperty('--doc-p', progress)
      }
      // Reaching the end once asks Pip for its cheer (plan 4 §2.4); Pip keeps it to one per visit
      const isAtEnd = Number(progress) >= endOfPage
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

    const unsubscribe = subscribeScrollFrame(onScroll)
    return () => {
      unsubscribe()
      stopTicks?.()
      target.style.removeProperty('--scroll-v')
    }
  }, [isReducedMotion])
}
