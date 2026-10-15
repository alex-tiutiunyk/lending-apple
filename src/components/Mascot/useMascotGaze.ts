import { useEffect, type RefObject } from 'react'
import { subscribePointerFrame, write } from '@/hooks/frameLoop'

const maxShiftPx = 1.5
// Eye line in the 48 × 88 art, as a share of Pip's box
const eyeShare = { x: 0.5, y: 0.12 }
const eyes = '[data-pip-eye]'

/**
 * While Pip is held by hover or focus, its eyes follow the pointer by at most 1.5 px. The box
 * is read in the pointer listener (read phase) and the offset is written as `translate` on
 * the eye elements themselves (plan 6 §5): nothing inherits per frame.
 */
export function useMascotGaze(pip: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = pip.current
    if (!element) return

    let isLooking = false
    const look = (value: string) => {
      write(() => {
        element.querySelectorAll<SVGElement>(eyes).forEach((eye) => {
          eye.style.translate = value
        })
      })
    }
    const stop = subscribePointerFrame(({ x, y }) => {
      if (!element.hasAttribute('data-held')) {
        if (isLooking) {
          look('')
          isLooking = false
        }
        return
      }
      const box = element.getBoundingClientRect()
      const dx = x - (box.left + box.width * eyeShare.x)
      const dy = y - (box.top + box.height * eyeShare.y)
      const length = Math.max(1, Math.hypot(dx, dy))
      const mirror = element.dataset.facing === 'left' ? -1 : 1
      const lookX = ((dx / length) * maxShiftPx * mirror).toFixed(2)
      const lookY = ((dy / length) * maxShiftPx).toFixed(2)
      look(`${lookX}px ${lookY}px`)
      isLooking = true
    })
    return stop
  }, [pip])
}
