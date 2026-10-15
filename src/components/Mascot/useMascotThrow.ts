import { useCallback, useEffect, useRef, type RefObject } from 'react'
import { mascotCopy } from '@/content/copy'
import { readInNextFrame, subscribeTick, write } from '@/hooks/frameLoop'
import { letterRequests, type LetterTarget } from '@/hooks/letterRequests'
import type { MascotAct, RandomAct } from './mascotActs'
import type { Facing } from './mascotMotion'

const cooldownMs = 25_000
const replyWaitMs = 300
const pullMs = 400
const missShare = 0.25
const arcPx = 70
const bounceMs = 360

type ThrowControls = {
  startAct: (act: MascotAct, line?: string | null) => void
  currentAct: () => MascotAct
  turnTo: (facing: Facing) => void
}

const pick = (lines: readonly string[], random: () => number) =>
  lines[Math.floor(random() * lines.length)] ?? null

/**
 * Pip shoots a letter (plan 7 §2): the brain draws `throw` only when this hook allows it (the
 * letters chunk listens, 25 s since the last throw, Pip not held or by the footer). On the act,
 * Pip asks the letters to aim, turns, pulls the slingshot for 400 ms and fires a pebble on a
 * parabola (550–800 ms, by distance) moved by `translate` on the shared tick; on arrival it
 * bounces off and fades (360 ms, `transform` and `opacity`), then the hook leaves the tick (plan
 * 6 rule 8). One throw in four misses on purpose. The target is read once, at aim time.
 */
export function useMascotThrow(
  pip: RefObject<HTMLElement | null>,
  projectile: RefObject<HTMLElement | null>,
  act: MascotAct,
  random: () => number,
  { startAct, currentAct, turnTo }: ThrowControls,
) {
  const lastThrowAt = useRef(-Infinity)

  const isThrowAllowed = useCallback(
    (next: RandomAct) => {
      if (next !== 'throw') return true
      const element = pip.current
      return (
        letterRequests.hasListeners &&
        performance.now() - lastThrowAt.current > cooldownMs &&
        !!element &&
        !element.hasAttribute('data-held') &&
        !element.hasAttribute('data-behind')
      )
    },
    [pip],
  )

  useEffect(() => {
    const pebble = projectile.current
    if (act !== 'throw' || !pebble) return
    lastThrowAt.current = performance.now()
    let isOver = false
    let stopTick: (() => void) | null = null
    let isBouncing = false
    let timer = 0
    const finish = (target: LetterTarget | null, missed: boolean) => {
      if (isOver || currentAct() !== 'throw') return
      isOver = true
      if (target) letterRequests.request({ type: 'hit', spotId: target.spotId, missed })
      const isHit = !!target && !missed
      startAct(isHit ? 'cheer' : 'missed', pick(isHit ? mascotCopy.hit : mascotCopy.missed, random))
    }

    const fire = (from: { x: number; y: number }, target: LetterTarget) => {
      const missed = random() < missShare
      const to = missed ? { x: target.x + 26, y: target.y + 14 } : target
      const flightMs = Math.min(800, Math.max(550, Math.hypot(to.x - from.x, to.y - from.y)))
      let startedAt: number | null = null
      write(() => {
        pebble.style.opacity = '1'
        pebble.removeAttribute('hidden')
      })
      const away = to.x < from.x ? -1 : 1
      stopTick = subscribeTick((time) => {
        startedAt ??= time
        const elapsed = time - startedAt
        const share = Math.min(1, elapsed / flightMs)
        const bounce = Math.min(1, Math.max(0, elapsed - flightMs) / bounceMs)
        const x = from.x + (to.x - from.x) * share + away * 22 * bounce
        const arc = Math.sin(share * Math.PI) * arcPx + Math.sin(bounce * Math.PI) * 16
        const y = from.y + (to.y - from.y) * share - arc + 10 * bounce
        write(() => {
          pebble.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
          pebble.style.opacity = String(1 - bounce)
        })
        if (share === 1 && !isBouncing) {
          // The act ends here; the bounce plays out on its own, past the effect's cleanup
          isBouncing = true
          finish(target, missed)
        }
        if (bounce < 1) return
        stopTick?.()
        stopTick = null
        write(() => pebble.setAttribute('hidden', ''))
      })
    }

    readInNextFrame(() => {
      const element = pip.current
      if (!element || isOver) return
      const box = element.getBoundingClientRect()
      const from = { x: box.left + box.width / 2, y: box.top + box.height * 0.2 }
      let hasReply = false
      timer = window.setTimeout(() => {
        if (!hasReply) finish(null, true)
      }, replyWaitMs)
      letterRequests.request({
        type: 'aim',
        fromX: from.x,
        fromY: from.y,
        reply: (target) => {
          hasReply = true
          window.clearTimeout(timer)
          if (!target) return finish(null, true)
          turnTo(target.x < from.x ? 'left' : 'right')
          timer = window.setTimeout(() => fire(from, target), pullMs)
        },
      })
    })

    return () => {
      isOver = true
      window.clearTimeout(timer)
      if (isBouncing) return
      stopTick?.()
      pebble.setAttribute('hidden', '')
    }
  }, [act, pip, projectile, random, startAct, currentAct, turnTo])

  return isThrowAllowed
}
