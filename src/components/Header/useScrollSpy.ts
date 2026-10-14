import { useCallback, useEffect, useRef, useState } from 'react'
import { navigation } from '@/content/copy'
import { activeSection } from './activeSection'

export const navTargetIds = navigation.map(({ href }) => href.slice(1))

const bandMargin = '-50% 0px -49% 0px'
const bandBottomShare = 0.51
const scrollIdleMs = 160

function topOf(element: Element | null) {
  return element ? element.getBoundingClientRect().top : Infinity
}

/** Active nav target while scrolling; a nav click holds its target until the scroll settles. */
export function useScrollSpy(targetIds: readonly string[], endId: string) {
  const [active, setActive] = useState(-1)
  const heldIndex = useRef<number | null>(null)
  const releaseTimer = useRef(0)
  const recompute = useRef<() => void>(() => undefined)

  useEffect(() => {
    const targets = targetIds.map((id) => document.getElementById(id))
    const end = document.getElementById(endId)

    const compute = () => {
      if (heldIndex.current !== null) return
      const bandY = window.innerHeight * bandBottomShare
      setActive(activeSection(targets.map(topOf), topOf(end), bandY))
    }
    recompute.current = compute

    const observer = new IntersectionObserver(compute, { rootMargin: bandMargin })
    ;[...targets, end].forEach((element) => element && observer.observe(element))

    const onScroll = () => {
      if (heldIndex.current === null) return
      window.clearTimeout(releaseTimer.current)
      releaseTimer.current = window.setTimeout(() => {
        heldIndex.current = null
        compute()
      }, scrollIdleMs)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', compute, { passive: true })
    return () => {
      observer.disconnect()
      window.clearTimeout(releaseTimer.current)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', compute)
    }
  }, [targetIds, endId])

  const hold = useCallback((index: number) => {
    heldIndex.current = index
    setActive(index)
    window.clearTimeout(releaseTimer.current)
    releaseTimer.current = window.setTimeout(() => {
      heldIndex.current = null
      recompute.current()
    }, scrollIdleMs * 4)
  }, [])

  return { active, hold }
}
