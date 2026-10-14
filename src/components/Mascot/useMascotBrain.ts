import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { subscribeScrollFrame, subscribeTick } from '@/hooks/frameLoop'
import {
  actDurationMs,
  isRandomAct,
  lineFor,
  nextRandomAct,
  walkDuration,
  type MascotAct,
  type RandomAct,
} from './mascotActs'
import { isComboAct } from './mascotCombos'
import { flip, stepWalker, type Facing } from './mascotMotion'
import { createScrollReaction } from './mascotScroll'

type HoldReason = 'focus' | 'pointer'

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

/** `lineForRandomAct` may replace a random act's line, for example with a hint. */
export function useMascotBrain(
  pip: RefObject<HTMLElement | null>,
  random: () => number,
  lineForRandomAct: (act: RandomAct) => string | null = () => null,
) {
  const [view, setView] = useState<MascotView>({
    act: 'walk',
    facing: 'right',
    line: null,
    pokeReply: '',
    bubbleSide: 'right',
  })
  const model = useRef({
    ...view,
    x: -offstagePx,
    isEntering: true,
    hurryTo: startInsetPx,
    remainingMs: 0,
    holds: new Set<HoldReason>(),
  })

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
      state.remainingMs =
        act === 'walk' ? walkDuration(random) : act === 'hurry' ? Infinity : actDurationMs[act]
      if (isComboAct(act)) state.pokeReply = state.line ?? ''
      if (act === 'walk') state.pokeReply = ''
      commit()
    },
    [commit, random],
  )

  useEffect(() => {
    const element = pip.current
    if (!element) return
    model.current.remainingMs = walkDuration(random)
    let lastTime: number | null = null
    const place = (x: number) => element.style.setProperty('--pip-x', `${x.toFixed(1)}px`)
    const countDown = (elapsed: number) => {
      const state = model.current
      state.remainingMs -= elapsed
      if (state.remainingMs > 0) return
      if (state.act !== 'walk') return startAct('walk')
      const next = nextRandomAct(random)
      startAct(next, lineForRandomAct(next) ?? undefined)
    }

    const onTick = (time: number) => {
      const elapsed = Math.min(longestFrameMs, time - (lastTime ?? time))
      lastTime = time
      const state = model.current
      if (state.holds.size > 0) {
        // Held Pip stands still, but a running act (a poke combo) still ends
        if (state.act !== 'walk' && state.act !== 'hurry') countDown(elapsed)
        return
      }
      const furthest = window.innerWidth - element.offsetWidth - startInsetPx
      const step = (walkSpeedPxPerSecond * elapsed) / 1000
      const result = stepWalker(state, step, startInsetPx, furthest)
      if (result !== 'still') place(state.x)
      if (result === 'turned') commit()
      if (result === 'arrived') startAct(state.act === 'chase' ? 'missed' : 'walk')
      if (result === 'entering' || result === 'arrived' || state.act === 'hurry') return
      countDown(elapsed)
    }

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

    place(model.current.x)
    const stopTicks = subscribeTick(onTick)
    const stopScroll = subscribeScrollFrame(onScroll)
    return () => {
      stopTicks()
      stopScroll()
    }
  }, [pip, random, commit, startAct, lineForRandomAct])

  const currentAct = useCallback(() => model.current.act, [])
  const turnTo = useCallback(
    (facing: Facing) => {
      model.current.facing = facing
      commit()
    },
    [commit],
  )
  const stepAside = useCallback(
    (x: number) => {
      const state = model.current
      if (state.holds.size > 0 || isComboAct(state.act)) return
      state.hurryTo = x
      state.facing = x > state.x ? 'right' : 'left'
      startAct('hurry')
    },
    [startAct],
  )
  const hold = useCallback(
    (reason: HoldReason, isHeld: boolean) => {
      const { holds } = model.current
      holds[isHeld ? 'add' : 'delete'](reason)
      pip.current?.toggleAttribute('data-held', holds.size > 0)
    },
    [pip],
  )

  return { ...view, startAct, currentAct, turnTo, hold, stepAside }
}
