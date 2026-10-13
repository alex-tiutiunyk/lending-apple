import { useEffect, useState } from 'react'
import { PressableLink } from '@/components/PressableLink/PressableLink'
import { stickyCtaCopy } from '@/content/copy'
import { documentTop, subscribeScrollFrame, type ScrollFrame } from '@/hooks/frameLoop'
import styles from './StickyCta.module.scss'

type Span = { top: number; bottom: number }

function spanOf(element: Element): Span {
  const top = documentTop(element)
  return { top, bottom: top + element.getBoundingClientRect().height }
}

export function StickyCta() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    let heroBottom = Infinity
    let reserveTop = Infinity
    let pinnedSpans: Span[] = []

    const measure = () => {
      const hero = document.getElementById('hero')
      const reserve = document.getElementById('reserve')
      heroBottom = hero ? spanOf(hero).bottom : 0
      reserveTop = reserve ? spanOf(reserve).top : Infinity
      pinnedSpans = Array.from(document.querySelectorAll('[data-pinned]'), spanOf)
    }

    const update = ({ scrollY, viewportHeight }: ScrollFrame) => {
      const viewportBottom = scrollY + viewportHeight
      const isPastHero = scrollY > heroBottom
      const isPinnedNow = pinnedSpans.some(
        ({ top, bottom }) => viewportBottom > top && scrollY < bottom,
      )
      const isReserveVisible = viewportBottom > reserveTop
      setIsVisible(isPastHero && !isPinnedNow && !isReserveVisible)
    }

    return subscribeScrollFrame(update, measure)
  }, [])

  return (
    <aside
      className={styles.bar}
      aria-label={stickyCtaCopy.label}
      data-sticky-cta
      data-pip-avoid
      data-visible={isVisible ? '' : undefined}
      inert={!isVisible}
    >
      <p className={styles.text}>{stickyCtaCopy.text}</p>
      <PressableLink href="#reserve" label={stickyCtaCopy.cta} />
    </aside>
  )
}
