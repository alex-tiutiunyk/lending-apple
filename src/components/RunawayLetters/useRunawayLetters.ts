import { useEffect, type RefObject } from 'react'
import { subscribePointerFrame, subscribeTick } from '@/hooks/frameLoop'
import { mascotRequests } from '@/hooks/mascotRequests'
import { createChaseRunner, type ChaseSetup } from './letterChase'
import { candidateBlocks, letterSpots, pickSpots, type LetterSpot } from './letterPicker'
import { createLetterRunner, planRun } from './letterRun'
import { canHideGlyphs, copyGlyph, hideGlyph, isSettled, showGlyph } from './letterWrap'

const firstEscapeMs = 5000
const shortestGapMs = 10_000
const longestGapMs = 15_000
const retryMs = 2000
const mostLetters = 3
const hurryReachPx = 24
const edgePx = 16
const zoneMarginPx = 24
const pipSelector = '.mascot[data-act="walk"]:not([data-held], [data-hiding], [data-behind])'

type Runner = ReturnType<typeof createLetterRunner>
type Chaser = ReturnType<typeof createChaseRunner>
type Letter = {
  copy: HTMLElement
  range: Range
  x: number
  y: number
  runner: Runner | null
  chaser: Chaser | null
  hasEnded: boolean
}

function isInViewport(rect: DOMRect) {
  return rect.top >= 0 && rect.bottom <= window.innerHeight
}

/** Free ground for a chase: the viewport minus the avoid zones that sit on Pip's line. */
function groundBounds(letterX: number, groundY: number, width: number) {
  let min = edgePx
  let max = window.innerWidth - edgePx - width
  document.querySelectorAll('[data-pip-avoid]').forEach((zone) => {
    const rect = zone.getBoundingClientRect()
    if (rect.width === 0 || rect.top > groundY + width || rect.bottom < groundY) return
    if (rect.left > letterX) max = Math.min(max, rect.left - zoneMarginPx - width)
    if (rect.right < letterX) min = Math.max(min, rect.right + zoneMarginPx)
  })
  return { min, max }
}

/**
 * Now and then a few letters grow legs, run off and come back (plan 4 §1). The real text never
 * changes: each glyph is painted transparent through a highlight range while a copy runs in
 * the overlay. Every second escape, when Pip is idle, one letter runs along Pip's line instead.
 */
export function useRunawayLetters(overlay: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const layer = overlay.current
    if (!layer || !canHideGlyphs()) return
    let timer = 0
    let escapes = 0
    let letters: Letter[] = []
    let block: HTMLElement | null = null
    let blockTop = 0
    let stopTicks: (() => void) | null = null

    const finish = () => {
      stopTicks?.()
      stopTicks = null
      letters.forEach((letter) => {
        if (letter.chaser && !letter.hasEnded) mascotRequests.request({ type: 'chase-end' })
        letter.copy.remove()
        showGlyph(letter.range)
      })
      letters = []
      block = null
      schedule(shortestGapMs + Math.random() * (longestGapMs - shortestGapMs))
    }

    const onTick = (now: number) => {
      if (!block) return
      const rect = block.getBoundingClientRect()
      if (!isInViewport(rect)) return finish()
      const shift = rect.top - blockTop
      const pip = document.querySelector(pipSelector)?.getBoundingClientRect()
      const pipCenterX = pip ? pip.left + pip.width / 2 : -Infinity
      let isDone = true
      letters.forEach((letter) => {
        if (letter.chaser) {
          // Pip's line moves with the sticky CTA and the home spot moves with the block, so
          // both are read each frame rather than once at the start
          const groundY = pip ? pip.bottom - letter.copy.offsetHeight : undefined
          const frame = letter.chaser.step(now, pipCenterX, { groundY, homeY: letter.y + shift })
          if (frame.turned) {
            mascotRequests.request({ type: 'chase', letterX: frame.x, direction: frame.direction })
          }
          if (frame.phase === 'home' && !letter.hasEnded) {
            letter.hasEnded = true
            mascotRequests.request({ type: 'chase-end' })
          }
          letter.copy.style.translate = `${frame.x.toFixed(1)}px ${frame.y.toFixed(1)}px`
          letter.copy.dataset.phase = frame.phase
          if (frame.phase !== 'done') isDone = false
          return
        }
        const frame = letter.runner?.step(now)
        if (!frame) return
        const x = letter.x + frame.x
        const y = letter.y + shift + frame.y
        letter.copy.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`
        letter.copy.style.setProperty('--tilt', `${frame.tilt.toFixed(1)}deg`)
        letter.copy.dataset.phase = frame.phase
        if (frame.phase !== 'done') isDone = false
      })
      if (isDone) finish()
    }

    const startChase = (letter: Letter, now: number) => {
      const pip = document.querySelector(pipSelector)
      if (!pip || !mascotRequests.hasListeners) return false
      const pipRect = pip.getBoundingClientRect()
      const height = letter.copy.offsetHeight
      const groundY = pipRect.bottom - height
      if (groundY - letter.y > window.innerHeight / 2) return false
      const direction: 1 | -1 = letter.x >= pipRect.left + pipRect.width / 2 ? 1 : -1
      const setup: ChaseSetup = {
        startX: letter.x,
        startY: letter.y,
        groundY,
        direction,
        ...groundBounds(letter.x, groundY, letter.copy.offsetWidth),
      }
      if (!mascotRequests.request({ type: 'chase', letterX: letter.x, direction })) return false
      letter.chaser = createChaseRunner(setup, now)
      return true
    }

    const escape = () => {
      if (document.hidden) return
      const blocks = candidateBlocks(document.querySelector('main') ?? document.body).filter(
        (candidate) => isInViewport(candidate.getBoundingClientRect()) && isSettled(candidate),
      )
      const chosen = blocks[Math.floor(Math.random() * blocks.length)]
      if (!chosen) return schedule(retryMs)
      const count = 1 + Math.floor(Math.random() * mostLetters)
      const spots: LetterSpot[] = pickSpots(letterSpots(chosen), count, Math.random)
      const now = performance.now()
      block = chosen
      blockTop = chosen.getBoundingClientRect().top
      letters = spots.flatMap((spot) => {
        const hidden = hideGlyph(spot)
        if (!hidden) return []
        const copy = copyGlyph(hidden, layer)
        const { rect } = hidden
        const room = {
          left: rect.left - edgePx,
          right: window.innerWidth - rect.right - edgePx,
          up: rect.top - edgePx,
          down: window.innerHeight - rect.bottom - edgePx,
        }
        const runner = createLetterRunner(planRun(Math.random, room), now)
        return {
          copy,
          range: hidden.range,
          x: rect.left,
          y: rect.top,
          runner,
          chaser: null,
          hasEnded: false,
        }
      })
      if (letters.length === 0) return finish()
      escapes += 1
      const first = letters[0]
      if (escapes % 2 === 0 && first && startChase(first, now)) first.runner = null
      stopTicks = subscribeTick(onTick)
    }

    const schedule = (ms: number) => {
      window.clearTimeout(timer)
      timer = window.setTimeout(escape, ms)
    }

    const onPointer = ({ x, y }: { x: number; y: number }) => {
      letters.forEach((letter) => {
        const rect = letter.copy.getBoundingClientRect()
        const gap = Math.hypot(x - (rect.left + rect.width / 2), y - (rect.top + rect.height / 2))
        if (gap < hurryReachPx) letter.runner?.hurryHome(performance.now())
      })
    }
    const onVisibility = () => {
      if (document.hidden && block) finish()
    }

    schedule(firstEscapeMs)
    const stopPointer = subscribePointerFrame(onPointer)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearTimeout(timer)
      stopPointer()
      document.removeEventListener('visibilitychange', onVisibility)
      if (block) finish()
      window.clearTimeout(timer)
    }
  }, [overlay])
}
