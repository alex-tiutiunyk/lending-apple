import { useEffect, useRef, type RefObject } from 'react'
import { subscribePointerFrame, subscribeScrollFrame, type PointerFrame } from '@/hooks/frameLoop'
import { freeSpot, isInside, overlapsTarget, shouldStepAside, type Box } from './mascotAvoidance'
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

function visibleTargets(zones: ReadonlySet<Element>): Box[] {
  return [...zones]
    .flatMap((zone) => Array.from(zone.querySelectorAll(interactive)).filter(isLive))
    .map((target) => target.getBoundingClientRect())
}

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
    let decidedAt = -Infinity
    let isFocusCovered = false

    const lineBounds = () => ({
      min: edgeInsetPx,
      max: window.innerWidth - element.offsetWidth - edgeInsetPx,
    })

    const decide = (x: number | null) => {
      decidedAt = performance.now()
      element.toggleAttribute('data-behind', x === null)
      if (x !== null && Math.abs(x - element.getBoundingClientRect().left) > 1) stepAside(x)
    }

    const checkStanding = () => {
      if (performance.now() - decidedAt < decisionHoldMs || element.hasAttribute('data-held')) {
        return
      }
      const pipBox = element.getBoundingClientRect()
      const targets = zonesInView.size > 0 ? visibleTargets(zonesInView) : []
      if (!overlapsTarget(pipBox, targets)) {
        element.removeAttribute('data-behind')
        return
      }
      decide(freeSpot(pipBox, targets, lineBounds()))
    }

    const onPointer = ({ x, y, target }: PointerFrame) => {
      if (zonesInView.size === 0 || performance.now() - decidedAt < decisionHoldMs) return
      const pipBox = element.getBoundingClientRect()
      if (isInside(pipBox, { x, y })) return
      const reached = target?.closest(interactive)
      if (!reached?.closest(avoidZone) || element.contains(reached)) return
      if (!shouldStepAside(pipBox, { x, y }, reached.getBoundingClientRect())) return
      decide(freeSpot(pipBox, visibleTargets(zonesInView), lineBounds()))
    }

    const onFocus = () => {
      const active = document.activeElement
      const isCovered =
        !!active?.closest(avoidZone) &&
        !element.contains(active) &&
        overlapsTarget(element.getBoundingClientRect(), [active.getBoundingClientRect()])
      if (isCovered !== isFocusCovered) {
        isFocusCovered = isCovered
        element.toggleAttribute('data-hiding', isCovered)
      }
    }

    checkSpot.current = checkStanding
    const zoneObserver = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) zonesInView.add(target)
        else zonesInView.delete(target)
      })
      checkStanding()
    })
    document.querySelectorAll(avoidZone).forEach((zone) => zoneObserver.observe(zone))

    const onScroll = () => {
      onFocus()
      if (zonesInView.size > 0) checkStanding()
    }

    const stopPointer = subscribePointerFrame(onPointer)
    const stopScroll = subscribeScrollFrame(onScroll)
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
