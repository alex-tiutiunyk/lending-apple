import { useEffect, useRef } from 'react'
import { RollingText } from '@/components/RollingText/RollingText'
import { headerCopy, navigation } from '@/content/copy'
import styles from './SectionNav.module.scss'

const capWidthPx = 4
const middleBasePx = 10
const runMs = 520

type TextBox = { x: number; width: number }

function placeRunner(indicator: HTMLElement, { x, width }: TextBox) {
  const middle = Math.max(0, width - capWidthPx * 2)
  indicator.style.setProperty('--runner-x', `${x.toFixed(1)}px`)
  indicator.style.setProperty('--middle-scale', (middle / middleBasePx).toFixed(3))
  indicator.style.setProperty('--end-x', `${(width - capWidthPx).toFixed(1)}px`)
}

type SectionNavProps = {
  active: number
  hold: (index: number) => void
}

/** The active index and the click hold come from the header's useScrollSpy (plan 4 §2.3). */
export function SectionNav({ active, hold }: SectionNavProps) {
  const navRef = useRef<HTMLElement>(null)
  const indicatorRef = useRef<HTMLSpanElement>(null)
  const textBoxes = useRef<TextBox[]>([])
  const placed = useRef<{ index: number; x: number } | null>(null)

  useEffect(() => {
    const nav = navRef.current
    const indicator = indicatorRef.current
    if (!nav || !indicator) return

    const measure = () => {
      textBoxes.current = Array.from(
        nav.querySelectorAll<HTMLElement>('[data-nav-text]'),
        (text) => ({
          x: text.offsetLeft,
          width: text.offsetWidth,
        }),
      )
      const current = placed.current && textBoxes.current[placed.current.index]
      if (current) placeRunner(indicator, current)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(nav)
    measure()
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const indicator = indicatorRef.current
    const target = textBoxes.current[active]
    if (!indicator) return
    if (!target) {
      indicator.removeAttribute('data-shown')
      placed.current = null
      return
    }

    const from = placed.current
    indicator.toggleAttribute('data-instant', from === null)
    if (from) indicator.dataset.facing = target.x >= from.x ? 'right' : 'left'
    placeRunner(indicator, target)
    indicator.setAttribute('data-shown', '')
    placed.current = { index: active, x: target.x }
    if (!from || from.index === active) return

    indicator.removeAttribute('data-settle')
    indicator.setAttribute('data-running', '')
    const arrive = window.setTimeout(() => {
      indicator.removeAttribute('data-running')
      indicator.setAttribute('data-settle', '')
    }, runMs)
    return () => {
      // The next change may hide the indicator or jump it, so the legs must not keep running
      window.clearTimeout(arrive)
      indicator.removeAttribute('data-running')
    }
  }, [active])

  return (
    <nav ref={navRef} className={styles.root} aria-label={headerCopy.navLabel}>
      <ul className={styles.links}>
        {navigation.map(({ href, label }, index) => (
          <li key={href}>
            <a
              className={styles.link}
              href={href}
              aria-current={index === active ? 'location' : undefined}
              onClick={() => hold(index)}
              data-roll-host
            >
              {/* The letters hop on hover (plan 5 §2); the measured box is still this span */}
              <span data-nav-text>
                <RollingText label={label} effect="hop" />
              </span>
            </a>
          </li>
        ))}
      </ul>
      <span ref={indicatorRef} className={styles.indicator} data-facing="right" aria-hidden="true">
        <span className={styles.phone}>
          {(['start', 'end'] as const).map((side) => (
            <span
              key={side}
              className={`${styles.cap} ${side === 'start' ? styles.capStart : styles.capEnd}`}
            >
              <span className={styles.bump} />
              <span className={styles.leg} />
              <span className={styles.leg} />
            </span>
          ))}
          <span className={styles.middle} />
        </span>
      </span>
    </nav>
  )
}
