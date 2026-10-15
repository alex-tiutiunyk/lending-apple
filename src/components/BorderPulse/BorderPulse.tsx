import { useEffect, useRef, type RefObject } from 'react'
import { write } from '@/hooks/frameLoop'
import { useAwakeWhileInView } from '@/hooks/useAmbientMotion'
import styles from './BorderPulse.module.scss'

type PulseProps = {
  /** 0–1, sets the period (7–12 s) and the phase, so neighbours never pulse together. */
  seed: number
}

/**
 * Beats every 7–12 s by the seed: sets `data-pulse` on the light inside an awake element (the
 * awake attribute must sit on an ancestor of the animated element), and the stylesheet plays
 * the light once; its end (or a cancel, when hover hides the ring) clears it. Between
 * beats nothing runs, so the light holds no compositor layer at rest (plan 7 §11, plan 6
 * rule 6). Asleep, off screen or in a hidden tab, a beat is skipped.
 */
function usePulseBeat(target: RefObject<HTMLElement | null>, seed: number) {
  useEffect(() => {
    const element = target.current
    const light = element?.firstElementChild
    if (!element || !light) return
    const periodMs = 7000 + seed * 5000
    const clear = () => light.removeAttribute('data-pulse')
    const beat = () => {
      if (element.hasAttribute('data-awake') && !document.hidden) {
        write(() => light.setAttribute('data-pulse', ''))
      }
      timer = window.setTimeout(beat, periodMs)
    }
    let timer = window.setTimeout(beat, (seed * 9000) % periodMs)
    element.addEventListener('animationend', clear)
    element.addEventListener('animationcancel', clear)
    return () => {
      window.clearTimeout(timer)
      element.removeEventListener('animationend', clear)
      element.removeEventListener('animationcancel', clear)
      clear()
    }
  }, [target, seed])
}

/**
 * A short light that runs once around a box's 1 px border every 7–12 s (plan 7 §11): a ring
 * masked to the border and an oversized conic square turning inside it, a compositor transform.
 * The host needs `position: relative` and its own border radius (`ring-pulse` mixin). The ring
 * keeps its own awake attribute, so it pulses only on screen, at `full`, wherever it sits.
 */
export function BorderPulse({ seed }: PulseProps) {
  const ringRef = useRef<HTMLSpanElement>(null)
  useAwakeWhileInView(ringRef)
  usePulseBeat(ringRef, seed)

  return (
    <span ref={ringRef} className={styles.ring} aria-hidden="true">
      <span className={styles.light} />
    </span>
  )
}

type LinePulseProps = PulseProps & { side: 'top' | 'bottom' }

/** The same light along a single edge, like the footer's edge pulse (plan 5 §7). */
export function LinePulse({ seed, side }: LinePulseProps) {
  const lineRef = useRef<HTMLSpanElement>(null)
  useAwakeWhileInView(lineRef)
  usePulseBeat(lineRef, seed)

  return (
    <span ref={lineRef} className={styles.line} data-side={side} aria-hidden="true">
      <span className={styles.window} />
    </span>
  )
}
