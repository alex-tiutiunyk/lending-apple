import { useEffect, type RefObject } from 'react'
import { subscribePointerFrame, subscribeScrollFrame, type PointerFrame } from '@/hooks/frameLoop'

const avoidZone = '[data-pip-avoid]'
const clearancePx = 120

function gapBetween(a: DOMRect, b: DOMRect) {
  const horizontal = Math.max(0, a.left - b.right, b.left - a.right)
  const vertical = Math.max(0, a.top - b.bottom, b.top - a.bottom)
  return Math.hypot(horizontal, vertical)
}

function isNearPip(pip: HTMLElement, target: Element | null, area: DOMRect) {
  if (!target?.closest(avoidZone) || pip.contains(target)) return false
  return gapBetween(pip.getBoundingClientRect(), area) < clearancePx
}

export function useMascotAvoidance(pip: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = pip.current
    if (!element) return

    let isPointerNear = false
    let isFocusNear = false
    const sync = () => element.toggleAttribute('data-hiding', isPointerNear || isFocusNear)

    const onPointer = ({ x, y, target }: PointerFrame) => {
      isPointerNear = isNearPip(element, target, new DOMRect(x, y, 0, 0))
      sync()
    }

    const onFocus = () => {
      const active = document.activeElement
      isFocusNear = active ? isNearPip(element, active, active.getBoundingClientRect()) : false
      sync()
    }

    const stopPointer = subscribePointerFrame(onPointer)
    const stopScroll = subscribeScrollFrame(onFocus)
    document.addEventListener('focusin', onFocus)
    document.addEventListener('focusout', onFocus)
    return () => {
      stopPointer()
      stopScroll()
      document.removeEventListener('focusin', onFocus)
      document.removeEventListener('focusout', onFocus)
      element.removeAttribute('data-hiding')
    }
  }, [pip])
}
