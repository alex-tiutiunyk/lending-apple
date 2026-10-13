import { useEffect } from 'react'
import { subscribePointerFrame, type PointerFrame } from './frameLoop'

const hoverQuery = '(hover: hover)'
const maxPullPx = 6

function clampUnit(value: number) {
  return Math.min(1, Math.max(-1, value))
}

function enterMagnetic(element: HTMLElement, { x, y }: PointerFrame) {
  const rect = element.getBoundingClientRect()
  element.style.setProperty('--fill-x', `${(x - rect.left).toFixed(1)}px`)
  element.style.setProperty('--fill-y', `${(y - rect.top).toFixed(1)}px`)
}

function pullMagnetic(element: HTMLElement, { x, y }: PointerFrame) {
  const rect = element.getBoundingClientRect()
  const pullX = clampUnit((x - rect.left - rect.width / 2) / (rect.width / 2)) * maxPullPx
  const pullY = clampUnit((y - rect.top - rect.height / 2) / (rect.height / 2)) * maxPullPx
  element.style.setProperty('--pull-x', `${pullX.toFixed(2)}px`)
  element.style.setProperty('--pull-y', `${pullY.toFixed(2)}px`)
}

function trackSurface(element: HTMLElement, { x, y }: PointerFrame) {
  const rect = element.getBoundingClientRect()
  element.style.setProperty('--mx', `${(x - rect.left).toFixed(1)}px`)
  element.style.setProperty('--my', `${(y - rect.top).toFixed(1)}px`)
}

function releaseMagnetic(element: HTMLElement) {
  element.style.removeProperty('--pull-x')
  element.style.removeProperty('--pull-y')
}

export function usePointerHover() {
  useEffect(() => {
    if (!window.matchMedia(hoverQuery).matches) return

    let magnetic: HTMLElement | null = null

    const onPointer = (pointer: PointerFrame) => {
      const next = pointer.target?.closest<HTMLElement>('[data-magnetic]') ?? null
      if (next !== magnetic) {
        if (magnetic) releaseMagnetic(magnetic)
        magnetic = next
        if (magnetic) enterMagnetic(magnetic, pointer)
      }
      if (magnetic) pullMagnetic(magnetic, pointer)

      const surface = pointer.target?.closest<HTMLElement>('[data-surface]')
      if (surface) trackSurface(surface, pointer)
    }

    const unsubscribe = subscribePointerFrame(onPointer)
    return () => {
      unsubscribe()
      if (magnetic) releaseMagnetic(magnetic)
    }
  }, [])
}
