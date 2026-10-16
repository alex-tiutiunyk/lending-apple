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
  /** Half turns: 0 on the floor, ±1 on the walls and the top, feet to the phone (plan 8 §5). */
  flip: number
  /** Drawn only: the mirror, so the Pip looks where it runs on screen. */
  facing: 1 | -1
  /** The way round the border, set once: travel never reads `facing` (plan 8 §5). */
  lapDirection: 1 | -1
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
  /** A Pip box's height in frame px, for the box centre of a turned-over lap Pip. */
  pipHeight: number
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
const smoothstep = (share: number) => share * share * (3 - 2 * share)
const toRadians = (degrees: number) => (degrees * Math.PI) / 180

/**
 * A point on the rounded border at distance `s`, the box's base on the edge and turned inward,
 * and `flip`: 0 on the floor, 1 on the walls and the top, where the Pip is turned over about
 * its centre so its feet point to the phone (plan 8 §5), in half turns. It rises 0 → 1 over the
 * bottom-right arc and runs -1 → 0 over the bottom-left one, a half cartwheel each, turning
 * opposite ways so the box keeps inside the border; over a lap the turns add up to zero.
 */
export function lapPoint(s: number, { width: w, height: h }: Size, r = lapCorner) {
  const a = w - 2 * r
  const b = h - 2 * r
  const arc = (Math.PI * r) / 2
  const parts = [a, arc, b, arc, a, arc, b, arc]
  const total = parts.reduce((sum, part) => sum + part, 0)
  let t = ((s % total) + total) % total
  let index = 0
  while (t > (parts[index] ?? 0) && index < 7) t -= parts[index++] ?? 0
  const turn = Math.min(1, Math.max(0, t / arc))
  const corner = (cx: number, cy: number, from: number, flip: number) => {
    const theta = from - (t / r) * (180 / Math.PI)
    const rad = toRadians(theta)
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad), angle: theta - 90, flip }
  }
  switch (index) {
    case 0:
      return { x: r + t, y: h, angle: 0, flip: 0 }
    case 1:
      return corner(w - r, h - r, 90, smoothstep(turn))
    case 2:
      return { x: w, y: h - r - t, angle: -90, flip: 1 }
    case 3:
      return corner(w - r, r, 0, 1)
    case 4:
      return { x: w - r - t, y: 0, angle: -180, flip: 1 }
    case 5:
      return corner(r, r, -90, 1)
    case 6:
      return { x: 0, y: r + t, angle: -270, flip: 1 }
    default:
      // Back the other way (-1 is the same pose as 1), so this corner mirrors the right one
      return corner(r, h - r, -180, smoothstep(turn) - 1)
  }
}

/** The Pip's own x axis on screen, after the border turn and the flip. */
function ownAxis({ angle, flip }: Pick<MiniPip, 'angle' | 'flip'>) {
  const rad = toRadians(angle + 180 * flip)
  return { x: Math.cos(rad), y: Math.sin(rad) }
}

/** The mirror that makes a Pip look along (dx, dy) on screen; unchanged when it is across. */
function facingAlong(pip: MiniPip, dx: number, dy: number): 1 | -1 {
  const axis = ownAxis(pip)
  const dot = axis.x * dx + axis.y * dy
  if (Math.abs(dot) < 1e-6) return pip.facing
  return dot > 0 ? 1 : -1
}

/** The box centre: half a box inward from the base on the border, whatever the flip. */
function boxCentre({ x, y, angle }: Pick<MiniPip, 'x' | 'y' | 'angle'>, height: number) {
  const rad = toRadians(angle)
  return { x: x + (height / 2) * Math.sin(rad), y: y - (height / 2) * Math.cos(rad) }
}

/** The screen direction of a lap Pip's next step. */
function stepAlong(pip: MiniPip, size: Size): [number, number] {
  const next = lapPoint((pip.lap ?? 0) + pip.lapDirection, size)
  return [next.x - pip.x, next.y - pip.y]
}

function lapLength({ width, height }: Size) {
  return 2 * (width + height) - 8 * lapCorner + 2 * Math.PI * lapCorner
}

export function createGame(size: Size, goal: Goal, random: () => number): Game {
  const pip = (x: number, lap: number | null, lapDirection: 1 | -1 = 1): MiniPip => ({
    x,
    y: size.height,
    angle: 0,
    flip: 0,
    facing: lapDirection,
    lapDirection,
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
      pip(0, length * 0.1, 1),
      pip(0, length * 0.6, -1),
    ],
    size,
    goal,
    from: { x: 0, y: 0 },
    pipHeight: 17.6,
  }
  game.pips.forEach((each) => {
    if (each.lap === null) return
    Object.assign(each, lapPoint(each.lap, size))
    each.facing = facingAlong(each, ...stepAlong(each, size))
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
  // Stopped on the way in, so not even the frame that changes the phase draws a running leg
  // (plan 8 §6): the lap Pips from the header on, everybody from the flight on
  game.pips.forEach((pip) => {
    if (phase !== 'play' && (pip.lap !== null || phase !== 'header')) pip.isRunning = false
  })
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

/**
 * The lap Pips: along the border in play; from the header on they stop where they are and turn
 * to watch the ball (plan 8 §6). Only `facing` turns, so the next rally runs the same way.
 */
function runLaps(game: Game, dt: number, chaseOnly: boolean) {
  const { ball, size, pips, clock } = game
  pips.forEach((pip) => {
    if (pip.lap === null) return
    if (chaseOnly) {
      pip.isRunning = false
      pip.facing = facingAlong(pip, ball.x - pip.x, ball.y - pip.y)
      return
    }
    pip.lap += pip.lapDirection * pip.speed * dt
    Object.assign(pip, lapPoint(pip.lap, size))
    pip.facing = facingAlong(pip, ...stepAlong(pip, size))
    pip.isRunning = true
    const centre = boxCentre(pip, game.pipHeight)
    const isNear = Math.hypot(centre.x - ball.x, centre.y - ball.y) < ballRadius + 10
    if (isNear && clock - pip.kickAt > 800) {
      kick(game, size.width / 2 - ball.x, size.height / 2 - ball.y, 200)
      pip.kickAt = clock
    }
  })
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
  runLaps(game, dt, chaseOnly)
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
