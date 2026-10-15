import { useEffect, type RefObject } from 'react'
import { subscribeTick, write } from '@/hooks/frameLoop'
import {
  ballRadius,
  createGame,
  isBallOut,
  kick,
  setPhase,
  stepGame,
  type Game,
  type Goal,
  type Size,
} from './footballGame'

// The logo on the back render, as shares of the frame (back viewBox 210 8 180 344, the mark
// centred at (300, 224), 46 units wide); the frame is exactly the render's box
const goalShare = { x: 0.5, y: 0.628, size: 0.2556 }
const longestFrameMs = 100

type Parts = {
  root: RefObject<HTMLElement | null>
  render: RefObject<SVGSVGElement | null>
  ball: RefObject<HTMLElement | null>
}

const goalFor = ({ width, height }: Size): Goal => ({
  x: width * goalShare.x,
  y: height * goalShare.y,
  size: width * goalShare.size,
})

/**
 * Wires the football game (plan 7 §5) to the frame loop while the frame is in view. One
 * `transform` string per box in the write phase; sizes from a ResizeObserver, never read per
 * frame. Between rallies the tick unsubscribes and `data-running` comes off, so the leg loops
 * stop too (plan 6 rules 4, 8, 9). A press on the ball kicks it away from the pointer.
 */
export function useFootballGame({ root, render, ball }: Parts, isInView: boolean) {
  useEffect(() => {
    const element = root.current
    const ballBox = ball.current
    const renderElement = render.current
    if (!element || !ballBox || !isInView) return
    const random = Math.random
    const pipBoxes = Array.from(element.querySelectorAll<HTMLElement>('[data-mini-pip]'))
    let game: Game | null = null
    let stopTick: (() => void) | null = null
    let restTimer = 0
    let lastTime: number | null = null

    const draw = (state: Game) => {
      const isOut = isBallOut(state)
      write(() => {
        state.pips.forEach((pip, index) => {
          const box = pipBoxes[index]
          if (!box) return
          box.style.transform = `translate(${pip.x.toFixed(1)}px, ${pip.y.toFixed(1)}px) rotate(${pip.angle.toFixed(1)}deg) scaleX(${pip.facing})`
          box.toggleAttribute('data-running', pip.isRunning)
          box.toggleAttribute('data-kick', state.clock - pip.kickAt < 120)
          box.toggleAttribute('data-five', state.clock - pip.fiveAt < 200)
        })
        const { x, y, spin, scale } = state.ball
        ballBox.style.transform = `translate(${(x - ballRadius).toFixed(1)}px, ${(y - ballRadius).toFixed(1)}px) rotate(${spin.toFixed(2)}rad) scale(${scale.toFixed(3)})`
        ballBox.hidden = !isOut
        element.dataset.phase = state.phase
        renderElement?.toggleAttribute('data-ball-out', isOut)
      })
    }

    const sleep = () => {
      stopTick?.()
      stopTick = null
      window.clearTimeout(restTimer)
      if (game) restTimer = window.setTimeout(wake, game.phaseMs)
    }
    const onTick = (time: number) => {
      if (!game) return
      const elapsed = Math.min(longestFrameMs, time - (lastTime ?? time))
      lastTime = time
      const isActive = stepGame(game, elapsed, random)
      draw(game)
      if (!isActive) sleep()
    }
    function wake() {
      if (!game) return
      setPhase(game, 'kickoff', random)
      lastTime = null
      stopTick ??= subscribeTick(onTick)
    }

    const sizes = new ResizeObserver(([entry]) => {
      if (!entry) return
      const size = { width: entry.contentRect.width, height: entry.contentRect.height }
      if (size.width === 0) return
      if (game) {
        game.size = size
        game.goal = goalFor(size)
        return
      }
      game = createGame(size, goalFor(size), random)
      draw(game)
      wake()
    })
    sizes.observe(element)

    const onBallPress = (event: PointerEvent) => {
      if (!game || (game.phase !== 'play' && game.phase !== 'header')) return
      const box = element.getBoundingClientRect()
      const { x, y } = game.ball
      kick(game, x - (event.clientX - box.left), y - (event.clientY - box.top) - 20, 280)
    }
    ballBox.addEventListener('pointerdown', onBallPress)

    return () => {
      sizes.disconnect()
      ballBox.removeEventListener('pointerdown', onBallPress)
      stopTick?.()
      window.clearTimeout(restTimer)
      renderElement?.removeAttribute('data-ball-out')
    }
  }, [root, render, ball, isInView])
}
