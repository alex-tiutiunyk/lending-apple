import { describe, expect, it } from 'vitest'
import {
  ballRadius,
  createGame,
  kick,
  lapPoint,
  setPhase,
  stepGame,
  type Game,
} from './footballGame'

const size = { width: 208, height: 397 }
const goal = { x: 104, y: 249, size: 53 }

function seeded(seed = 1) {
  let state = seed
  return () => {
    state = (state * 16807) % 2147483647
    return (state - 1) / 2147483646
  }
}

function run(game: Game, ms: number, random: () => number, onStep?: (game: Game) => void) {
  for (let elapsed = 0; elapsed < ms; elapsed += 16) {
    if (!stepGame(game, 16, random)) return elapsed
    onStep?.(game)
  }
  return ms
}

describe('football on the finishes render (plan 7 §5)', () => {
  it('keeps the ball inside the frame, slows it with friction and bounces it', () => {
    const random = seeded(3)
    const game = createGame(size, goal, random)
    setPhase(game, 'play', random)
    game.phaseMs = 60_000
    game.pips.forEach((pip) => (pip.speed = 0))
    kick(game, 1, -0.2, 320)
    run(game, 6000, random, ({ ball }) => {
      expect(ball.x).toBeGreaterThanOrEqual(ballRadius)
      expect(ball.x).toBeLessThanOrEqual(size.width - ballRadius)
      expect(ball.y).toBeGreaterThanOrEqual(ballRadius)
      expect(ball.y).toBeLessThanOrEqual(size.height - ballRadius)
    })
    expect(Math.abs(game.ball.vx)).toBeLessThan(320)
  })

  it('a kick changes the ball velocity', () => {
    const random = seeded(5)
    const game = createGame(size, goal, random)
    kick(game, -1, 0, 200)
    expect(game.ball.vx).toBeCloseTo(-200)
    expect(game.ball.vy).toBeCloseTo(0)
  })

  it('the lap stays on the border', () => {
    for (let s = 0; s < 1200; s += 7) {
      const { x, y } = lapPoint(s, size)
      const onEdge =
        Math.min(x, size.width - x, y, size.height - y) < 0.01 ||
        // corners: within the corner radius of an edge
        (Math.min(x, size.width - x) <= 18.01 && Math.min(y, size.height - y) <= 18.01)
      expect(onEdge).toBe(true)
    }
  })

  it('play stops within 14 s and the goal lands within 16 s, then the game rests', () => {
    const random = seeded(7)
    const game = createGame(size, goal, random)
    setPhase(game, 'kickoff', random)
    let playEndedAt = Infinity
    const restedAt = run(game, 30_000, random, (state) => {
      if (state.phase !== 'kickoff' && state.phase !== 'play' && playEndedAt === Infinity)
        playEndedAt = state.clock
    })
    expect(playEndedAt).toBeLessThanOrEqual(900 + 14_000 + 16)
    expect(restedAt).toBeLessThanOrEqual(16_000 + 900 + 900)
    expect(game.phase).toBe('rest')
    expect(game.ball.x).toBeCloseTo(goal.x)
  })

  it('is deterministic with a seeded random', () => {
    const play = () => {
      const random = seeded(11)
      const game = createGame(size, goal, random)
      setPhase(game, 'kickoff', random)
      run(game, 5000, random)
      return game.ball
    }
    expect(play()).toEqual(play())
  })
})

describe('mini Pips: feet to the phone, everyone stops at the goal (plan 8 §5, §6)', () => {
  const lap = 2 * (size.width + size.height) - 8 * 18 + 2 * Math.PI * 18
  const pipHeight = 17.6
  const pipWidth = (pipHeight * 24) / 36

  it('flip is 0 on the floor, 1 on the walls and the top, monotonic over a bottom corner', () => {
    expect(lapPoint(50, size).flip).toBe(0)
    expect(lapPoint(lap * 0.3, size).flip).toBe(1)
    expect(lapPoint(lap * 0.5, size).flip).toBe(1)
    expect(lapPoint(lap * 0.8, size).flip).toBe(1)
    // The bottom-right arc starts after the floor run
    const start = size.width - 36
    const arc = (Math.PI * 18) / 2
    let previous = -1
    for (let step = 0; step <= 20; step += 1) {
      const { flip } = lapPoint(start + (arc * step) / 20, size)
      expect(flip).toBeGreaterThanOrEqual(previous)
      previous = flip
    }
    expect(previous).toBeCloseTo(1)
  })

  // The base of the box is a tangent on the corner arcs, so its ends reach under a pixel past
  // the rounded border there, as before plan 8; anything more would be the flip pushing out
  it('the drawn box never leaves the frame', () => {
    for (let point = 0; point < 400; point += 1) {
      const { x, y, angle, flip } = lapPoint((lap * point) / 400, size)
      // The box in its own frame, base centre at the origin, then the draw transform
      const corners = [
        [-pipWidth / 2, 0],
        [pipWidth / 2, 0],
        [-pipWidth / 2, -pipHeight],
        [pipWidth / 2, -pipHeight],
      ].map(([cx = 0, cy = 0]) => {
        const turn = (flip * Math.PI) as number
        const fx = cx * Math.cos(turn) - (cy + pipHeight / 2) * Math.sin(turn)
        const fy = cx * Math.sin(turn) + (cy + pipHeight / 2) * Math.cos(turn) - pipHeight / 2
        const rad = (angle * Math.PI) / 180
        return [
          x + fx * Math.cos(rad) - fy * Math.sin(rad),
          y + fx * Math.sin(rad) + fy * Math.cos(rad),
        ]
      })
      corners.forEach(([cx = 0, cy = 0]) => {
        expect(cx).toBeGreaterThanOrEqual(-1)
        expect(cx).toBeLessThanOrEqual(size.width + 1)
        expect(cy).toBeGreaterThanOrEqual(-1)
        expect(cy).toBeLessThanOrEqual(size.height + 1)
      })
    }
  })

  it('a lap Pip faces where it runs on screen, on every side', () => {
    const random = seeded(13)
    const game = createGame(size, goal, random)
    setPhase(game, 'play', random)
    game.phaseMs = 60_000
    game.pips.forEach((pip) => {
      if (pip.lap === null) pip.speed = 0
    })
    const lapPips = game.pips.filter((pip) => pip.lap !== null)
    let checked = 0
    for (let step = 0; step < 2000; step += 1) {
      const before = lapPips.map(({ x, y }) => ({ x, y }))
      stepGame(game, 16, random)
      lapPips.forEach((pip, index) => {
        const from = before[index]
        if (!from) return
        const dx = pip.x - from.x
        const dy = pip.y - from.y
        const rad = ((pip.angle + 180 * pip.flip) * Math.PI) / 180
        const length = Math.hypot(dx, dy)
        const along = ((Math.cos(rad) * dx + Math.sin(rad) * dy) * pip.facing) / (length || 1)
        // Mid-cartwheel the Pip is side-on to its step; only clear directions count
        if (length > 0.1 && Math.abs(along) > 0.3) {
          expect(along).toBeGreaterThan(0)
          checked += 1
        }
      })
    }
    expect(checked).toBeGreaterThan(1000)
  })

  it('during the header a lap Pip stands still and nobody runs from the flight on', () => {
    const random = seeded(17)
    const game = createGame(size, goal, random)
    setPhase(game, 'kickoff', random)
    const directions = game.pips.map((pip) => pip.lapDirection)
    let header: { x: number; y: number }[] | null = null
    run(game, 30_000, random, (state) => {
      const lapPips = state.pips.filter((pip) => pip.lap !== null)
      if (state.phase === 'header') {
        header ??= lapPips.map(({ x, y }) => ({ x, y }))
        lapPips.forEach((pip, index) => {
          expect(pip.isRunning).toBe(false)
          expect(pip.x).toBe(header?.[index]?.x)
          expect(pip.y).toBe(header?.[index]?.y)
        })
      }
      if (state.phase === 'flight' || state.phase === 'scored' || state.phase === 'celebrate') {
        state.pips.forEach((pip) => expect(pip.isRunning).toBe(false))
      }
    })
    expect(header).not.toBeNull()
    expect(game.pips.map((pip) => pip.lapDirection)).toEqual(directions)
  })
})
