import { useEffect, type RefObject } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const scratchCount = 6
const settleMs = 1200
const fadeMs = 30_000

/**
 * Scratches as patina (plan 5 §11): every hover over the titanium sample draws one more
 * hairline on the band, counted in `data-scratches`; once all six are there they fade out
 * together over 30 s and the count starts over. Hover motion only: nothing at `off` or on touch.
 */
export function useScratchCounter(sample: RefObject<HTMLElement | null>) {
  const isReducedMotion = useReducedMotion()

  useEffect(() => {
    const element = sample.current
    if (!element || isReducedMotion || !window.matchMedia('(hover: hover)').matches) return

    let count = 0
    let settle = 0
    let fade = 0
    const reset = () => {
      delete element.dataset.scratches
      count = 0
    }
    const onPointerEnter = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || element.dataset.scratches === 'fading') return
      count = Math.min(scratchCount, count + 1)
      element.dataset.scratches = String(count)
      if (count < scratchCount) return
      settle = window.setTimeout(() => {
        element.dataset.scratches = 'fading'
        fade = window.setTimeout(reset, fadeMs)
      }, settleMs)
    }

    element.addEventListener('pointerenter', onPointerEnter)
    return () => {
      element.removeEventListener('pointerenter', onPointerEnter)
      window.clearTimeout(settle)
      window.clearTimeout(fade)
      reset()
    }
  }, [sample, isReducedMotion])
}
