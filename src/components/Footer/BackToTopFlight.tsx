import { useEffect, useRef } from 'react'
import { PhoneOutline } from '@/assets/svg/phone-outline'
import { subscribeTick } from '@/hooks/frameLoop'
import { particleRequests } from '@/hooks/particleRequests'
import { easeInOutCubic, flightDurationMs, focusHomeLink } from './backToTopScroll'
import styles from './BackToTopFlight.module.scss'

const trailLength = 5
const trailGapFrames = 3
const driftPx = 24
const exitAbovePx = 80
const fadeShare = 0.8
const cancelEvents = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const

type BackToTopFlightProps = {
  from: DOMRect
  onDone: () => void
}

/**
 * The phone flies from the button up and off the top while the page scrolls to the top in the
 * same eased time, on the shared frame loop (plan 4 §7.3). Any input from the reader cancels
 * it: the phone is gone at once and the page stays where it is.
 */
export default function BackToTopFlight({ from, onDone }: BackToTopFlightProps) {
  const phoneRef = useRef<HTMLDivElement>(null)
  const trailRefs = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    const phone = phoneRef.current
    if (!phone) return
    const startScrollY = window.scrollY
    const durationMs = flightDurationMs(startScrollY)
    const startX = from.left + from.width / 2
    const startY = from.top
    const pastYs: number[] = []
    let startedAt: number | null = null
    let isCancelled = false
    particleRequests.request({ type: 'launch', shape: 'rocket', durationMs })

    const finish = () => {
      stop()
      cancelEvents.forEach((name) => window.removeEventListener(name, cancel))
      if (!isCancelled) focusHomeLink()
      onDone()
    }
    const cancel = () => {
      isCancelled = true
      particleRequests.request({ type: 'land', shape: 'rocket' })
      finish()
    }
    const stop = subscribeTick((time) => {
      startedAt ??= time
      const share = Math.min(1, (time - startedAt) / durationMs)
      const eased = easeInOutCubic(share)
      window.scrollTo({ top: startScrollY * (1 - eased), behavior: 'instant' })
      const x = startX + Math.sin(share * Math.PI) * driftPx
      const y = startY - (startY + exitAbovePx) * eased
      phone.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`
      phone.style.opacity = share > fadeShare ? ((1 - share) / (1 - fadeShare)).toFixed(2) : '1'
      pastYs.unshift(y)
      pastYs.length = Math.min(pastYs.length, trailLength * trailGapFrames + 1)
      trailRefs.current.forEach((dot, index) => {
        const pastY = pastYs[(index + 1) * trailGapFrames]
        if (!dot || pastY === undefined) return
        dot.style.translate = `${x.toFixed(1)}px ${(pastY + 40).toFixed(1)}px`
        dot.style.opacity = ((1 - index / trailLength) * 0.7).toFixed(2)
      })
      if (share >= 1) finish()
    })
    cancelEvents.forEach((name) => window.addEventListener(name, cancel, { passive: true }))
    return () => {
      stop()
      cancelEvents.forEach((name) => window.removeEventListener(name, cancel))
    }
  }, [from, onDone])

  return (
    <div className={styles.root} aria-hidden="true">
      {Array.from({ length: trailLength }, (_, index) => (
        <span
          key={index}
          ref={(dot) => {
            trailRefs.current[index] = dot
          }}
          className={styles.dot}
        />
      ))}
      <div ref={phoneRef} className={styles.phone}>
        <PhoneOutline view="front" />
      </div>
    </div>
  )
}
