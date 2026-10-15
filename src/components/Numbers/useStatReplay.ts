import { useEffect, type RefObject } from 'react'

/**
 * A pointer over a stat, or focus on its footnote ref, replays that stat's reels (plan 5 §12).
 * Native listeners on the `[data-stat]` boxes, so the markup stays a plain description list.
 * Touch has no hover, so a touch pointer does not count.
 */
export function useStatReplay(
  list: RefObject<HTMLElement | null>,
  replay: (statId: string) => void,
) {
  useEffect(() => {
    const element = list.current
    if (!element) return

    const stats = Array.from(element.querySelectorAll<HTMLElement>('[data-stat]'))
    const cleanups = stats.map((stat) => {
      const id = stat.dataset.stat ?? ''
      const onPointerEnter = (event: PointerEvent) => {
        if (event.pointerType !== 'touch') replay(id)
      }
      const onFocusIn = () => replay(id)
      stat.addEventListener('pointerenter', onPointerEnter)
      stat.addEventListener('focusin', onFocusIn)
      return () => {
        stat.removeEventListener('pointerenter', onPointerEnter)
        stat.removeEventListener('focusin', onFocusIn)
      }
    })
    return () => cleanups.forEach((cleanup) => cleanup())
  }, [list, replay])
}
