import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { subscribeScrollFrame, subscribeTick, type ScrollFrame } from '@/hooks/frameLoop'
import { actDurationMs, lineFor, nextRandomAct, walkDuration, type MascotAct } from './mascotActs'

export type Facing = 'left' | 'right'
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
const blownSpeedPxPerMs = 2.6
const turnThresholdPx = 3

function flip(facing: Facing): Facing {
  return facing === 'left' ? 'right' : 'left'
}

export function useMascotBrain(pip: RefObject<HTMLElement | null>, random: () => number) {
  const [view, setView] = useState<MascotView>({
    act: 'walk',
    facing: 'right',
    line: null,
    pokeReply: '',
    bubbleSide: 'right',
  })
  const model = useRef({
    ...view,
    x: startInsetPx,
    remainingMs: 0,
    holds: new Set<HoldReason>(),
  })

  const commit = useCallback(() => {
    const { act, facing, line, pokeReply, x } = model.current
    const bubbleSide: Facing = x < window.innerWidth / 2 ? 'right' : 'left'
    setView({ act, facing, line, pokeReply, bubbleSide })
  }, [])

  const startAct = useCallback(
    (act: MascotAct) => {
      const state = model.current
      state.act = act
      state.line = lineFor(act, random)
      state.remainingMs = act === 'walk' ? walkDuration(random) : actDurationMs[act]
      if (act === 'poked') state.pokeReply = state.line ?? ''
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

    const onTick = (time: number) => {
      const elapsed = Math.min(longestFrameMs, time - (lastTime ?? time))
      lastTime = time
      const state = model.current
      if (state.holds.size > 0) return

      if (state.act === 'walk') {
        const furthest = window.innerWidth - element.offsetWidth - startInsetPx
        const step = (walkSpeedPxPerSecond * elapsed) / 1000
        state.x += state.facing === 'right' ? step : -step
        if (state.x <= startInsetPx || state.x >= furthest) {
          state.x = Math.min(furthest, Math.max(startInsetPx, state.x))
          state.facing = flip(state.facing)
          commit()
        }
        element.style.setProperty('--pip-x', `${state.x.toFixed(1)}px`)
      }

      state.remainingMs -= elapsed
      if (state.remainingMs <= 0) startAct(state.act === 'walk' ? nextRandomAct(random) : 'walk')
    }

    let lastScrollY = window.scrollY
    let lastScrollAt = performance.now()
    let lastDirection = 0
    const onScroll = ({ scrollY }: ScrollFrame) => {
      const now = performance.now()
      const travelled = scrollY - lastScrollY
      const speed = Math.abs(travelled) / Math.max(1, now - lastScrollAt)
      lastScrollY = scrollY
      lastScrollAt = now
      if (Math.abs(travelled) < turnThresholdPx) return

      const state = model.current
      const direction = Math.sign(travelled)
      if (state.act === 'walk' && lastDirection !== 0 && direction !== lastDirection) {
        state.facing = flip(state.facing)
        commit()
      }
      lastDirection = direction
      if (speed > blownSpeedPxPerMs && state.act !== 'blown' && state.act !== 'poked') {
        startAct('blown')
      }
    }

    element.style.setProperty('--pip-x', `${model.current.x}px`)
    const stopTicks = subscribeTick(onTick)
    const stopScroll = subscribeScrollFrame(onScroll)
    return () => {
      stopTicks()
      stopScroll()
    }
  }, [pip, random, commit, startAct])

  const poke = useCallback(() => startAct('poked'), [startAct])
  const hold = useCallback(
    (reason: HoldReason, isHeld: boolean) => {
      const { holds } = model.current
      if (isHeld) holds.add(reason)
      else holds.delete(reason)
      pip.current?.toggleAttribute('data-held', holds.size > 0)
    },
    [pip],
  )

  return { ...view, poke, hold }
}
