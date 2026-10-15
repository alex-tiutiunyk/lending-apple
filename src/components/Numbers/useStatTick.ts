import { useEffect, type RefObject } from 'react'

const shortestGapMs = 6000
const longestGapMs = 9000
const tickMs = 450

/**
 * The ambient tick of the stats (plan 5 §12): every 6–9 s one random stat gets `data-tick` for
 * the length of its slip, only while the list is awake (in view) at the `full` level. Timers,
 * not frames: nothing runs between ticks.
 */
export function useStatTick(list: RefObject<HTMLElement | null>, isAmbient: boolean) {
  useEffect(() => {
    const element = list.current
    if (!element || !isAmbient) return

    let timer = 0
    let clear = 0
    const schedule = () => {
      timer = window.setTimeout(
        tick,
        shortestGapMs + Math.random() * (longestGapMs - shortestGapMs),
      )
    }
    const tick = () => {
      if (!document.hidden && element.hasAttribute('data-awake')) {
        const stats = element.querySelectorAll('[data-stat]')
        const stat = stats[Math.floor(Math.random() * stats.length)]
        stat?.setAttribute('data-tick', '')
        clear = window.setTimeout(() => stat?.removeAttribute('data-tick'), tickMs)
      }
      schedule()
    }

    schedule()
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(clear)
    }
  }, [list, isAmbient])
}
