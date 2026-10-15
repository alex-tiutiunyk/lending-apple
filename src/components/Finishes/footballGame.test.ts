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
