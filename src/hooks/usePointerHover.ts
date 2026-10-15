import { useEffect } from 'react'
import { lastScrollY, subscribePointerFrame, write, type PointerFrame } from './frameLoop'

const hoverQuery = '(hover: hover)'
const maxPullPx = 6

function clampUnit(value: number) {
  return Math.min(1, Math.max(-1, value))
}

/** The last box of an element, read in the read phase and kept until the page scrolls. */
function createBoxCache() {
  let element: Element | null = null
  let rect: DOMRect | null = null
  let scrollY = -1
  return (next: Element) => {
    if (next !== element || !rect || scrollY !== lastScrollY()) {
      element = next
      scrollY = lastScrollY()
      rect = next.getBoundingClientRect()
    }
    return rect
  }
}

function enterMagnetic(element: HTMLElement, rect: DOMRect, { x, y }: PointerFrame) {
  const fillX = `${(x - rect.left).toFixed(1)}px`
  const fillY = `${(y - rect.top).toFixed(1)}px`
  write(() => {
    element.style.setProperty('--fill-x', fillX)
    element.style.setProperty('--fill-y', fillY)
  })
}

function pullMagnetic(body: HTMLElement, rect: DOMRect, { x, y }: PointerFrame) {
  const pullX = clampUnit((x - rect.left - rect.width / 2) / (rect.width / 2)) * maxPullPx
  const pullY = clampUnit((y - rect.top - rect.height / 2) / (rect.height / 2)) * maxPullPx
  const translate = `${pullX.toFixed(2)}px ${pullY.toFixed(2)}px`
  write(() => {
    body.style.translate = translate
  })
}

function trackSurface(surface: HTMLElement, lens: HTMLElement, { x, y }: PointerFrame) {
  // The lens is absolutely positioned, so it is offset from the padding box, inside the border
  const rect = surface.getBoundingClientRect()
  const translate = `${(x - rect.left - surface.clientLeft).toFixed(1)}px ${(y - rect.top - surface.clientTop).toFixed(1)}px`
  write(() => {
    lens.style.translate = translate
  })
}

function releaseMagnetic(body: HTMLElement) {
  write(() => body.style.removeProperty('translate'))
}

/**
 * Magnetic buttons and the surface lens (plan 1 §7, plan 6 §5, §11): the pointer listener runs
 * in the read phase, so its measurements are free, and every write is a direct `translate` on
 * the element that moves, queued for the write phase. The fill origin is written once per enter.
 */
export function usePointerHover() {
  useEffect(() => {
    if (!window.matchMedia(hoverQuery).matches) return

    let magnetic: HTMLElement | null = null
    let magneticBody: HTMLElement | null = null
    const magneticBox = createBoxCache()

    const onPointer = (pointer: PointerFrame) => {
      const next = pointer.target?.closest<HTMLElement>('[data-magnetic]') ?? null
      if (next !== magnetic) {
        if (magneticBody) releaseMagnetic(magneticBody)
        magnetic = next
        magneticBody = next?.querySelector<HTMLElement>('[data-magnetic-body]') ?? next
        if (magnetic) enterMagnetic(magnetic, magneticBox(magnetic), pointer)
      }
      if (magnetic && magneticBody) pullMagnetic(magneticBody, magneticBox(magnetic), pointer)

      const surface = pointer.target?.closest<HTMLElement>('[data-surface]')
      const lens = surface?.querySelector<HTMLElement>('[data-lens]')
      if (surface && lens) trackSurface(surface, lens, pointer)
    }

    const unsubscribe = subscribePointerFrame(onPointer)
    return () => {
      unsubscribe()
      if (magneticBody) releaseMagnetic(magneticBody)
    }
  }, [])
}
