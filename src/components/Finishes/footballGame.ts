/**
 * Football on the finishes render (plan 7 §5), a pure step: positions in the frame's CSS px, y
 * down, the floor at the frame's bottom. Two mini Pips play the ball, two run laps along the
 * frame's rounded border. A rally lasts 8–14 s, then the nearest player heads the ball back
 * onto the phone, where it grows into the logo; everyone cheers and the game rests 6–10 s.
 */
export type Size = { width: number; height: number }
/** The logo on the phone back: centre and size in frame px. */
export type Goal = { x: number; y: number; size: number }
export type Phase = 'kickoff' | 'play' | 'header' | 'flight' | 'scored' | 'celebrate' | 'rest'

type MiniPip = {
  x: number
  y: number
  angle: number
  facing: 1 | -1
  lap: number | null
  isRunning: boolean
  kickAt: number
  fiveAt: number
  speed: number
}
type Ball = { x: number; y: number; vx: number; vy: number; spin: number; scale: number }
export type Game = {
  phase: Phase
  phaseAt: number
  clock: number
  phaseMs: number
  ball: Ball
  pips: MiniPip[]
  size: Size
  goal: Goal
  from: { x: number; y: number }
}

export const ballRadius = 7
const gravity = 900
const restitution = 0.7
const friction = 0.6
const reach = 12
const lapSpeed = 40
const lapCorner = 18
const fixedMs: Partial<Record<Phase, number>> = {
  kickoff: 900,
  header: 1500,
  flight: 900,
  scored: 260,
  celebrate: 900,
}
const between = (random: () => number, low: number, high: number) => low + random() * (high - low)
const lerp = (a: number, b: number, share: number) => a + (b - a) * share

/** A point on the rounded border at distance `s`, feet on the edge, body turned inward. */
export function lapPoint(s: number, { width: w, height: h }: Size, r = lapCorner) {
  const a = w - 2 * r
  const b = h - 2 * r
  const arc = (Math.PI * r) / 2
  const parts = [a, arc, b, arc, a, arc, b, arc]
  const total = parts.reduce((sum, part) => sum + part, 0)
  let t = ((s % total) + total) % total
  let index = 0
  while (t > (parts[index] ?? 0) && index < 7) t -= parts[index++] ?? 0
  const corner = (cx: number, cy: number, from: number) => {
    const theta = from - (t / r) * (180 / Math.PI)
    const rad = (theta * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad), angle: theta - 90 }
  }
  switch (index) {
    case 0:
      return { x: r + t, y: h, angle: 0 }
    case 1:
      return corner(w - r, h - r, 90)
    case 2:
      return { x: w, y: h - r - t, angle: -90 }
    case 3:
      return corner(w - r, r, 0)
    case 4:
      return { x: w - r - t, y: 0, angle: -180 }
    case 5:
      return corner(r, r, -90)
    case 6:
      return { x: 0, y: r + t, angle: -270 }
    default:
      return corner(r, h - r, -180)
  }
}

function lapLength({ width, height }: Size) {
  return 2 * (width + height) - 8 * lapCorner + 2 * Math.PI * lapCorner
}

export function createGame(size: Size, goal: Goal, random: () => number): Game {
  const pip = (x: number, lap: number | null): MiniPip => ({
    x,
    y: size.height,
    angle: 0,
    facing: 1,
    lap,
    isRunning: false,
    kickAt: -Infinity,
    fiveAt: -Infinity,
    speed: lap === null ? between(random, 70, 110) : lapSpeed,
  })
  const length = lapLength(size)
  const game: Game = {
    phase: 'rest',
    phaseAt: 0,
    clock: 0,
    phaseMs: 0,
    ball: { x: goal.x, y: goal.y, vx: 0, vy: 0, spin: 0, scale: 1 },
    pips: [
      pip(size.width * 0.25, null),
      pip(size.width * 0.75, null),
      pip(0, length * 0.1),
      pip(0, length * 0.6),
    ],
    size,
    goal,
    from: { x: 0, y: 0 },
  }
  game.pips.forEach((each, index) => {
    if (each.lap !== null) each.facing = index % 2 ? -1 : 1
  })
  return game
}

export function setPhase(game: Game, phase: Phase, random: () => number) {
  game.phase = phase
  game.phaseAt = game.clock
  game.phaseMs =
    fixedMs[phase] ??
    (phase === 'play' ? between(random, 8000, 14000) : between(random, 6000, 10000))
  if (phase === 'kickoff') game.from = { x: game.goal.x, y: game.goal.y }
  if (phase === 'flight') game.from = { x: game.ball.x, y: game.ball.y }
}

/** The scale that makes the ball the size of the logo it grows back into. */
const logoScale = (game: Game) => game.goal.size / (ballRadius * 2)

/** Kicks the ball at `speed` along (dx, dy), normalised. */
export function kick(game: Game, dx: number, dy: number, speed: number) {
  const length = Math.hypot(dx, dy) || 1
  game.ball.vx = (dx / length) * speed
  game.ball.vy = (dy / length) * speed
}

function moveBall(game: Game, dt: number) {
  const { ball, size } = game
  ball.vy += gravity * dt
  ball.x += ball.vx * dt
  ball.y += ball.vy * dt
  const floor = size.height - ballRadius
  if (ball.y >= floor) {
    ball.y = floor
    ball.vy = Math.abs(ball.vy) < 40 ? 0 : -ball.vy * restitution
    ball.vx *= friction ** dt
  }
  if (ball.y < ballRadius) {
    ball.y = ballRadius
    ball.vy = -ball.vy * restitution
  }
  if (ball.x < ballRadius || ball.x > size.width - ballRadius) {
    ball.x = Math.min(size.width - ballRadius, Math.max(ballRadius, ball.x))
    ball.vx = -ball.vx * restitution
  }
  ball.spin += (ball.vx * dt) / ballRadius
}

function runTo(pip: MiniPip, x: number, dt: number) {
  const gap = x - pip.x
  pip.isRunning = Math.abs(gap) > 2
  if (!pip.isRunning) return
  pip.facing = gap > 0 ? 1 : -1
  pip.x += pip.facing * Math.min(Math.abs(gap), pip.speed * dt)
}

function play(game: Game, dt: number, random: () => number, chaseOnly: boolean) {
  const { ball, size, pips, clock } = game
  const team = pips.filter((pip) => pip.lap === null)
  const [chaser, other] = [...team].sort((a, b) => Math.abs(a.x - ball.x) - Math.abs(b.x - ball.x))
  const onFloor = ball.y > size.height - ballRadius - 20
  if (chaser) {
    runTo(chaser, ball.x, dt)
    if (
      !chaseOnly &&
      onFloor &&
      Math.abs(chaser.x - ball.x) < reach &&
      clock - chaser.kickAt > 500
    ) {
      const toward = ball.x < size.width / 2 ? 1 : -1
      const angle = (random() * 50 * Math.PI) / 180
      kick(
        game,
        Math.cos(angle) * (random() < 0.3 ? -toward : toward),
        -Math.sin(angle),
        between(random, 180, 320),
      )
      chaser.kickAt = clock
    }
  }
  if (other) runTo(other, chaseOnly ? other.x : lerp(ball.x, game.goal.x, 0.5), dt)
  pips.forEach((pip) => {
    if (pip.lap === null) return
    pip.lap += pip.facing * pip.speed * dt
    Object.assign(pip, lapPoint(pip.lap, size))
    pip.isRunning = true
    const isNear = Math.hypot(pip.x - ball.x, pip.y - ball.y) < ballRadius + 10
    if (!chaseOnly && isNear && clock - pip.kickAt > 800) {
      kick(game, size.width / 2 - ball.x, size.height / 2 - ball.y, 200)
      pip.kickAt = clock
    }
  })
  const [first, second] = pips.filter((pip) => pip.lap !== null)
  if (first && second && Math.hypot(first.x - second.x, first.y - second.y) < 10) {
    if (clock - first.fiveAt > 1500) first.fiveAt = second.fiveAt = clock
  }
  moveBall(game, dt)
}

/** Advances the game by `dtMs`; returns true while the frame loop is needed (not resting). */
export function stepGame(game: Game, dtMs: number, random: () => number) {
  game.clock += dtMs
  const dt = dtMs / 1000
  const share = Math.min(1, (game.clock - game.phaseAt) / game.phaseMs)
  const { ball, goal, size } = game
  switch (game.phase) {
    case 'kickoff':
      ball.x = goal.x
      ball.y = lerp(game.from.y, size.height - ballRadius, share * share)
      ball.scale = lerp(logoScale(game), 1, Math.min(1, share * 2.5))
      break
    case 'play':
    case 'header':
      play(game, dt, random, game.phase === 'header')
      if (game.phase === 'header') {
        const nearest = game.pips.some(
          (pip) => pip.lap === null && Math.abs(pip.x - ball.x) < reach && pip.y - ball.y < 30,
        )
        if (nearest || share >= 1) setPhase(game, 'flight', random)
      }
      break
    case 'flight':
      ball.x = lerp(game.from.x, goal.x, share)
      ball.y = lerp(game.from.y, goal.y, share) - Math.sin(share * Math.PI) * 60
      ball.spin += dt * 8
      break
    case 'scored':
      ball.scale = lerp(1, logoScale(game), share)
      break
    default:
      game.pips.forEach((pip) => (pip.isRunning = false))
  }
  const next: Partial<Record<Phase, Phase>> = {
    kickoff: 'play',
    play: 'header',
    flight: 'scored',
    scored: 'celebrate',
    celebrate: 'rest',
  }
  const after = next[game.phase]
  if (after && game.clock - game.phaseAt >= game.phaseMs) setPhase(game, after, random)
  return game.phase !== 'rest'
}

/** The ball is off the phone from the kickoff until it has grown back into the logo. */
export const isBallOut = ({ phase }: Game) => phase !== 'rest' && phase !== 'celebrate'
