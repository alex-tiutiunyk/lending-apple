import { useEffect, type RefObject } from 'react'

const stickyCta = '[data-sticky-cta]'
const visible = 'data-visible'

/**
 * Pip lifts over the sticky CTA while that bar shows (plan 1 §9). It watches the bar's own
 * attribute and marks its root, instead of a `body:has()` rule anchored on the whole page
 * (plan 6 §9).
 */
export function useMascotLift(pip: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = pip.current
    const bar = document.querySelector(stickyCta)
    if (!element || !bar) return
    const sync = () => element.toggleAttribute('data-lifted', bar.hasAttribute(visible))
    const observer = new MutationObserver(sync)
    observer.observe(bar, { attributes: true, attributeFilter: [visible] })
    sync()
    return () => {
      observer.disconnect()
      element.removeAttribute('data-lifted')
    }
  }, [pip])
}
