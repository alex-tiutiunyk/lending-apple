import { useEffect, useRef } from 'react'
import { useA11ySettings } from '@/hooks/a11yStore'
import { subscribePointerFrame, subscribeScrollFrame } from '@/hooks/frameLoop'
import { isLayoutAtLeast } from '@/hooks/layoutWidth'
import { useAmbientMotion } from '@/hooks/useAmbientMotion'
import { FloatingParts } from './FloatingParts'
import { HeroBoot } from './HeroBoot'
import styles from './HeroExtras.module.scss'

const hoverQuery = '(hover: hover)'

/** Decoration added after hydration: screen boot, cable and floating parts around the hero phone. */
export default function HeroExtras() {
  const rootRef = useRef<HTMLDivElement>(null)
  const isAmbient = useAmbientMotion()
  const { textScale } = useA11ySettings()

  useEffect(() => {
    const root = rootRef.current
    const hero = root?.closest('section')
    if (!root || !hero) return

    let fadeLength = 1
    let writtenOut = -1
    let isWide = false
    // Runs on every layout change (resize, text size), so parallax follows the layout width
    const measure = () => {
      fadeLength = Math.max(1, hero.offsetHeight * 0.6)
      isWide = isLayoutAtLeast('md')
      if (isWide) return
      root.style.removeProperty('--px')
      root.style.removeProperty('--py')
    }
    const stopScroll = subscribeScrollFrame(({ scrollY }) => {
      const out = Math.round(Math.min(1, scrollY / fadeLength) * 100) / 100
      if (out === writtenOut) return
      writtenOut = out
      root.style.setProperty('--hero-out', String(out))
    }, measure)

    // Parallax is ambient: it freezes while motion is paused and skips writes once the hero is gone
    const hasParallax = isAmbient && window.matchMedia(hoverQuery).matches
    const stopPointer = hasParallax
      ? subscribePointerFrame(({ x, y }) => {
          if (!isWide || writtenOut >= 1) return
          root.style.setProperty('--px', ((x / window.innerWidth) * 2 - 1).toFixed(3))
          root.style.setProperty('--py', ((y / window.innerHeight) * 2 - 1).toFixed(3))
        })
      : () => undefined

    return () => {
      stopScroll()
      stopPointer()
    }
  }, [isAmbient, textScale])

  return (
    <>
      <HeroBoot />
      <div ref={rootRef} className={styles.parts} aria-hidden="true">
        <FloatingParts />
      </div>
    </>
  )
}
