import { useEffect, useRef, useState } from 'react'
import { useA11ySettings } from '@/hooks/a11yStore'
import { createAnimationDriver, supportsScrollTimeline } from '@/hooks/animationDriver'
import { subscribePointerFrame, subscribeScrollFrame, viewportSize, write } from '@/hooks/frameLoop'
import { isLayoutAtLeast } from '@/hooks/layoutWidth'
import { useAmbientMotion } from '@/hooks/useAmbientMotion'
import { FloatingParts } from './FloatingParts'
import { partDepths } from './partDepths'
import { HeroBoot } from './HeroBoot'
import { HeroLine } from './HeroLine'
import { heroLinePath } from './heroLinePath'
import styles from './HeroExtras.module.scss'

const hoverQuery = '(hover: hover)'
const outlineDrawMs = 1800
const parallaxPx = 4

/** Writes the single line's path (plan 5 §14) from the outline's start and the last headline word. */
function drawLine(line: SVGSVGElement, origin: DOMRect, hero: HTMLElement) {
  const body = hero.querySelector<SVGPathElement>('[data-part="body"] path')
  const word = Array.from(hero.querySelectorAll('h1 > span')).at(-1)
  const matrix = body?.getScreenCTM()
  if (!body || !word || !matrix) return
  const start = new DOMPoint(
    body.getPointAtLength(0).x,
    body.getPointAtLength(0).y,
  ).matrixTransform(matrix)
  const rect = word.getBoundingClientRect()
  const d = heroLinePath(
    { x: start.x - origin.left, y: start.y - origin.top },
    {
      left: rect.left - origin.left,
      right: rect.right - origin.left,
      bottom: rect.bottom - origin.top,
    },
  )
  write(() => line.querySelectorAll('path').forEach((path) => path.setAttribute('d', d)))
}

/**
 * Decoration added after hydration: screen boot, cable, floating parts and the single line.
 * The fade with the scroll is a scroll timeline on the parts layer (plan 6 §3.3); without
 * timelines the hook drives it. The parallax writes `translate` on each part directly.
 */
export default function HeroExtras() {
  const rootRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<SVGSVGElement>(null)
  const isAmbient = useAmbientMotion()
  const { textScale } = useA11ySettings()
  // After the outline on a fast load, at once on a slow one
  const [lineDelayMs] = useState(() => Math.max(0, outlineDrawMs - performance.now()))

  useEffect(() => {
    const root = rootRef.current
    const hero = root?.closest('section')
    if (!root || !hero) return

    const parts = Array.from(root.querySelectorAll<HTMLElement>('[data-order]'))
    const driver = supportsScrollTimeline() ? null : createAnimationDriver(root)
    let fadeLength = 1
    let isOut = false
    let isWide = false
    // Runs on every layout change (resize, text size), so parallax and the line follow the layout
    const redrawLine = () => {
      if (lineRef.current) drawLine(lineRef.current, root.getBoundingClientRect(), hero)
    }
    const measure = () => {
      fadeLength = Math.max(1, hero.offsetHeight * 0.6)
      isWide = isLayoutAtLeast('md')
      driver?.refresh()
      redrawLine()
      if (isWide) return
      write(() => parts.forEach((part) => part.style.removeProperty('translate')))
    }
    const stopScroll = subscribeScrollFrame(({ scrollY }) => {
      const out = Math.min(1, scrollY / fadeLength)
      isOut = out >= 1
      if (driver) write(() => driver.drive(out))
    }, measure)
    // On a fast load the headline words are still rising when this chunk arrives, and a rising
    // word's box is off by its translate, so the line is measured again once their rise ends
    const title = hero.querySelector('h1')
    title?.addEventListener('animationend', redrawLine)

    // Parallax is ambient: it freezes while motion is paused and skips writes once the hero is gone
    const hasParallax = isAmbient && window.matchMedia(hoverQuery).matches
    const stopPointer = hasParallax
      ? subscribePointerFrame(({ x, y }) => {
          if (!isWide || isOut) return
          const { width, height } = viewportSize()
          const px = (x / width) * 2 - 1
          const py = (y / height) * 2 - 1
          write(() =>
            parts.forEach((part, order) => {
              const depth = partDepths[order] ?? 1
              const shiftX = (px * depth * parallaxPx).toFixed(1)
              const shiftY = (py * depth * parallaxPx).toFixed(1)
              part.style.translate = `${shiftX}px ${shiftY}px`
            }),
          )
        })
      : () => undefined

    return () => {
      title?.removeEventListener('animationend', redrawLine)
      stopScroll()
      stopPointer()
    }
  }, [isAmbient, textScale])

  return (
    <>
      <HeroBoot />
      <div ref={rootRef} className={styles.parts} aria-hidden="true">
        <FloatingParts />
        <HeroLine ref={lineRef} delayMs={lineDelayMs} />
      </div>
    </>
  )
}
