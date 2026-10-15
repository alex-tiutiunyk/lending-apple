import { useEffect, useRef, type RefObject } from 'react'
import {
  subscribePointerFrame,
  subscribeScrollFrame,
  write,
  type PointerFrame,
  lastScrollY,
  viewportSize,
} from '@/hooks/frameLoop'
import {
  freeSpot,
  isInside,
  overlapsTarget,
  shouldStepAside,
  toDocumentBox,
  toViewportBoxes,
  type Box,
} from './mascotAvoidance'
import type { MascotAct } from './mascotActs'

const avoidZone = '[data-pip-avoid]'
const interactive = 'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
const decisionHoldMs = 600
const edgeInsetPx = 16

function isLive(element: Element) {
  if (element.closest('[inert]')) return false
  const rect = element.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}

/** The interactive boxes in the zones in view, in document space (plan 6 §5). */
function targetBoxes(zones: ReadonlySet<Element>, scrollY: number): Box[] {
  return [...zones]
    .flatMap((zone) => Array.from(zone.querySelectorAll(interactive)).filter(isLive))
    .map((target) => toDocumentBox(target.getBoundingClientRect(), scrollY))
}

/**
 * Pip keeps off the links and fields in the avoid zones. The zones' boxes are measured once per
 * layout and when a zone enters or leaves the view; a scroll frame compares Pip's box (one read
 * in the read phase) against the cached boxes shifted by the scroll, and writes go through the
 * write phase, so no frame forces a layout.
 */
export function useMascotAvoidance(
  pip: RefObject<HTMLElement | null>,
  act: MascotAct,
  stepAside: (x: number) => void,
) {
  const checkSpot = useRef<() => void>(() => undefined)

  useEffect(() => {
    const element = pip.current
    if (!element) return

    const zonesInView = new Set<Element>()
    let targets: Box[] = []
    let activeBox: Box | null = null
    let decidedAt = -Infinity
    let isFocusCovered = false

    const measureTargets = () => {
      targets = targetBoxes(zonesInView, window.scrollY)
    }
    const targetsNow = (scrollY: number) => toViewportBoxes(targets, scrollY)
    const lineBounds = (pipBox: Box) => ({
      min: edgeInsetPx,
      max: viewportSize().width - (pipBox.right - pipBox.left) - edgeInsetPx,
    })

    const decide = (x: number | null, pipLeft: number) => {
      decidedAt = performance.now()
      write(() => {
        element.toggleAttribute('data-behind', x === null)
        if (x !== null && Math.abs(x - pipLeft) > 1) stepAside(x)
      })
    }

    const checkStanding = (scrollY = window.scrollY) => {
      if (performance.now() - decidedAt < decisionHoldMs || element.hasAttribute('data-held')) {
        return
      }
      const pipBox = element.getBoundingClientRect()
      const boxes = zonesInView.size > 0 ? targetsNow(scrollY) : []
      if (!overlapsTarget(pipBox, boxes)) {
        write(() => element.removeAttribute('data-behind'))
        return
      }
      decide(freeSpot(pipBox, boxes, lineBounds(pipBox)), pipBox.left)
    }

    const onPointer = ({ x, y, target }: PointerFrame) => {
      if (zonesInView.size === 0 || performance.now() - decidedAt < decisionHoldMs) return
      const pipBox = element.getBoundingClientRect()
      if (isInside(pipBox, { x, y })) return
      const reached = target?.closest(interactive)
      if (!reached?.closest(avoidZone) || element.contains(reached)) return
      if (!shouldStepAside(pipBox, { x, y }, reached.getBoundingClientRect())) return
      decide(freeSpot(pipBox, targetsNow(lastScrollY()), lineBounds(pipBox)), pipBox.left)
    }

    const syncFocusCover = (scrollY: number) => {
      const isCovered =
        activeBox !== null &&
        overlapsTarget(element.getBoundingClientRect(), toViewportBoxes([activeBox], scrollY))
      if (isCovered === isFocusCovered) return
      isFocusCovered = isCovered
      write(() => element.toggleAttribute('data-hiding', isCovered))
    }
    // Focus events measure the focused element once; scroll frames shift that box
    const onFocus = () => {
      const active = document.activeElement
      const isInZone = !!active?.closest(avoidZone) && !element.contains(active)
      activeBox =
        isInZone && active ? toDocumentBox(active.getBoundingClientRect(), window.scrollY) : null
      syncFocusCover(window.scrollY)
    }

    checkSpot.current = () => checkStanding()
    const zoneObserver = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) zonesInView.add(target)
        else zonesInView.delete(target)
      })
      measureTargets()
      checkStanding()
    })
    document.querySelectorAll(avoidZone).forEach((zone) => zoneObserver.observe(zone))

    const onScroll = ({ scrollY }: { scrollY: number }) => {
      syncFocusCover(scrollY)
      if (zonesInView.size > 0) checkStanding(scrollY)
    }

    const stopPointer = subscribePointerFrame(onPointer)
    const stopScroll = subscribeScrollFrame(onScroll, measureTargets)
    document.addEventListener('focusin', onFocus)
    document.addEventListener('focusout', onFocus)
    return () => {
      zoneObserver.disconnect()
      stopPointer()
      stopScroll()
      document.removeEventListener('focusin', onFocus)
      document.removeEventListener('focusout', onFocus)
      element.removeAttribute('data-hiding')
      element.removeAttribute('data-behind')
      checkSpot.current = () => undefined
    }
  }, [pip, stepAside])

  useEffect(() => {
    if (act !== 'walk' && act !== 'hurry') checkSpot.current()
  }, [act])
}
