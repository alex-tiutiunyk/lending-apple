import { useEffect, type RefObject } from 'react'
import { subscribePointerFrame } from '@/hooks/frameLoop'

const maxShiftPx = 1.5
// Eye line in the 48 × 88 art, as a share of Pip's box
const eyeShare = { x: 0.5, y: 0.12 }

/** While Pip is held by hover or focus, its eyes follow the pointer by at most 1.5 px. */
export function useMascotGaze(pip: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = pip.current
    if (!element) return

    let isLooking = false
    const stop = subscribePointerFrame(({ x, y }) => {
      if (!element.hasAttribute('data-held')) {
        if (isLooking) {
          element.style.removeProperty('--look-x')
          element.style.removeProperty('--look-y')
          isLooking = false
        }
        return
      }
      const box = element.getBoundingClientRect()
      const dx = x - (box.left + box.width * eyeShare.x)
      const dy = y - (box.top + box.height * eyeShare.y)
      const length = Math.max(1, Math.hypot(dx, dy))
      const mirror = element.dataset.facing === 'left' ? -1 : 1
      element.style.setProperty('--look-x', `${((dx / length) * maxShiftPx * mirror).toFixed(2)}px`)
      element.style.setProperty('--look-y', `${((dy / length) * maxShiftPx).toFixed(2)}px`)
      isLooking = true
    })
    return stop
  }, [pip])
}
