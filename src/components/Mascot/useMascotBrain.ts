import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { subscribeScrollFrame, subscribeTick, viewportSize } from '@/hooks/frameLoop'
import {
  actDurationMs,
  isRandomAct,
  lineFor,
  nextRandomAct,
  randomActs,
  walkDuration,
  type MascotAct,
  type RandomAct,
} from './mascotActs'
import { isComboAct } from './mascotCombos'
import { flip, stepWalker, type Facing } from './mascotMotion'
import { placePip } from './mascotPlacement'
import { createScrollReaction } from './mascotScroll'
import { scheduleTripJoy } from './mascotTripLines'
import { useMascotControls, type HoldReason, type MascotModel } from './useMascotControls'

type MascotView = {
  act: MascotAct
  facing: Facing
  line: string | null
  pokeReply: string
  bubbleSide: Facing
}

const walkSpeedPxPerSecond = 38
const longestFrameMs = 100
const startInsetPx = 16
const offstagePx = 64
const movingActs: readonly MascotAct[] = ['walk', 'hurry', 'chase', 'moonwalk']

/** The frame loop runs for Pip only while Pip moves (plan 6 rule 9): free and in a walking act. */
export function isMoving({ act, holds }: Pick<MascotModel, 'act' | 'holds'>) {
  return holds.size === 0 && movingActs.includes(act)
}

// Stable defaults: a new function per render would restart the brain's effect
const noLine = () => null
const anyAct = () => true

/**
 * `lineForRandomAct` may replace a random act's line, for example with a hint; `isActAllowed`
 * keeps an act out of the draw while it cannot happen (plan 7 §2).
 */
export function useMascotBrain(
  pip: RefObject<HTMLElement | null>,
  random: () => number,
  lineForRandomAct: (act: RandomAct) => string | null = noLine,
  isActAllowed: (act: RandomAct) => boolean = anyAct,
) {
  const [view, setView] = useState<MascotView>({
    act: 'walk',
    facing: 'right',
    line: null,
    pokeReply: '',
    bubbleSide: 'right',
  })
  const model = useRef<MascotModel>({
    ...view,
    x: -offstagePx,
    isEntering: true,
    hurryTo: startInsetPx,
    remainingMs: 0,
    holds: new Set<HoldReason>(),
  })
  const syncTick = useRef<() => void>(() => undefined)
  const cancelTripJoy = useRef<() => void>(() => undefined)

  const commit = useCallback(() => {
    const { act, facing, line, pokeReply, x } = model.current
    const bubbleSide: Facing = x < window.innerWidth / 2 ? 'right' : 'left'
    setView({ act, facing, line, pokeReply, bubbleSide })
  }, [])

  const startAct = useCallback(
    (act: MascotAct, line?: string | null) => {
      const state = model.current
      state.act = act
      state.line = line === undefined ? lineFor(act, random) : line
      cancelTripJoy.current()
      // A trip's falling line turns into a joy line (plan 7 §1), unless a hint took its place
      if (act === 'trip' && line === undefined)
        cancelTripJoy.current = scheduleTripJoy(state, random, commit)
      state.remainingMs =
        act === 'walk' ? walkDuration(random) : act === 'hurry' ? Infinity : actDurationMs[act]
      // Combo replies and the landing line (plan 5 §6) answer the reader's own action out loud
      if (isComboAct(act) || act === 'land') state.pokeReply = state.line ?? ''
      if (act === 'walk') state.pokeReply = ''
      commit()
      syncTick.current()
    },
    [commit, random],
  )

  useEffect(() => {
    const element = pip.current
    if (!element) return
    model.current.remainingMs = walkDuration(random)
    let lastTime: number | null = null
    let width = element.offsetWidth
    let stopTicks: (() => void) | null = null
    let countdownTimer = 0
    let countdownStartedAt = 0
    const place = (x: number) => placePip(element, x)

    const endAct = () => {
      const state = model.current
      if (state.act !== 'walk') return startAct('walk')
      const next = nextRandomAct(random, randomActs.filter(isActAllowed))
      startAct(next, lineForRandomAct(next) ?? undefined)
    }
    const countDown = (elapsed: number) => {
      const state = model.current
      state.remainingMs -= elapsed
      if (state.remainingMs <= 0) endAct()
    }

    // While Pip stands still the act ends on a timer, not on a frame
    const clearCountdown = () => {
      if (countdownTimer === 0) return
      window.clearTimeout(countdownTimer)
      countdownTimer = 0
      model.current.remainingMs -= performance.now() - countdownStartedAt
    }
    const startCountdown = () => {
      const state = model.current
      // A held walk waits for the hold to lift; a hurry has no end; a carry ends on landing
      if (state.act === 'walk' || !Number.isFinite(state.remainingMs)) return
      countdownStartedAt = performance.now()
      countdownTimer = window.setTimeout(
        () => {
          countdownTimer = 0
          model.current.remainingMs = 0
          endAct()
        },
        Math.max(0, state.remainingMs),
      )
    }

    const onTick = (time: number) => {
      const elapsed = Math.min(longestFrameMs, time - (lastTime ?? time))
      lastTime = time
      const state = model.current
      const furthest = viewportSize().width - width - startInsetPx
      const step = (walkSpeedPxPerSecond * elapsed) / 1000
      const result = stepWalker(state, step, startInsetPx, furthest)
      if (result !== 'still') place(state.x)
      if (result === 'turned') commit()
      if (result === 'arrived') startAct(state.act === 'chase' ? 'missed' : 'walk')
      if (result === 'entering' || result === 'arrived' || state.act === 'hurry') return
      countDown(elapsed)
    }

    const sync = () => {
      const moving = isMoving(model.current)
      if (moving && !stopTicks) {
        clearCountdown()
        lastTime = null
        stopTicks = subscribeTick(onTick)
      } else if (!moving) {
        stopTicks?.()
        stopTicks = null
        clearCountdown()
        startCountdown()
      }
    }
    syncTick.current = sync

    const onScroll = createScrollReaction({
      onTurn: () => {
        const state = model.current
        if (state.act !== 'walk' || state.isEntering) return
        state.facing = flip(state.facing)
        commit()
      },
      onBlown: () => {
        if (model.current.act === 'walk' || isRandomAct(model.current.act)) startAct('blown')
      },
    })

    const sizeObserver = new ResizeObserver(([entry]) => {
      if (entry) width = entry.contentRect.width
    })
    sizeObserver.observe(element)
    place(model.current.x)
    sync()
    const stopScroll = subscribeScrollFrame(onScroll)
    return () => {
      syncTick.current = () => undefined
      cancelTripJoy.current()
      stopTicks?.()
      stopTicks = null
      window.clearTimeout(countdownTimer)
      sizeObserver.disconnect()
      stopScroll()
    }
  }, [pip, random, commit, startAct, lineForRandomAct, isActAllowed])

  const sync = useCallback(() => syncTick.current(), [])
  const controls = useMascotControls(pip, model, { startAct, commit, sync })

  return { ...view, startAct, ...controls }
}
