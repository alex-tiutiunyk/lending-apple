export type RunPlan = { dx: number; dy: number; runMs: number; lift?: Lift }
/** A knocked-out letter (plan 7 §2) jumps higher and spins before it runs. */
type Lift = { px: number; ms: number; spinDeg: number }
type RunPhase = 'lift' | 'run' | 'look' | 'back' | 'settle' | 'done'
export type RunFrame = { x: number; y: number; phase: RunPhase; tilt: number }

/** Free room around the letter inside the viewport, in px. */
export type Room = { left: number; right: number; up: number; down: number }

const liftMs = 200
const lookMs = 400
const settleMs = 250
/** How far and how long one leg of the trip is; headings keep their letters close (plan 5 §9). */
export type RunRange = {
  shortestPx: number
  longestPx: number
  shortestMs: number
  longestMs: number
  lift?: { shortestPx: number; longestPx: number; ms: number; spinDeg: number }
}
export const paragraphRun: RunRange = {
  shortestPx: 40,
  longestPx: 160,
  shortestMs: 700,
  longestMs: 1100,
}
export const headingRun: RunRange = {
  shortestPx: 20,
  longestPx: 80,
  shortestMs: 350,
  longestMs: 800,
}
/** Hit by Pip's throw (plan 7 §2): a 24–40 px jump with a turn, then the usual run. */
export const hitRun: RunRange = {
  shortestPx: 40,
  longestPx: 140,
  shortestMs: 500,
  longestMs: 900,
  lift: { shortestPx: 24, longestPx: 40, ms: 320, spinDeg: 360 },
}
const liftPx = 2
const bobPx = 1.5
const bouncePx = 3
const lookTiltDeg = 8

const phaseAfter: Record<RunPhase, RunPhase> = {
  lift: 'run',
  run: 'look',
  look: 'back',
  back: 'settle',
  settle: 'done',
  done: 'done',
}

function easeOut(share: number) {
  return 1 - (1 - share) ** 3
}

/** A direction and distance of its own, kept inside the viewport. */
export function planRun(random: () => number, room: Room, range: RunRange = paragraphRun): RunPlan {
  const angle = random() * Math.PI * 2
  const distance = range.shortestPx + random() * (range.longestPx - range.shortestPx)
  const plan: RunPlan = {
    dx: Math.max(-room.left, Math.min(room.right, Math.cos(angle) * distance)),
    dy: Math.max(-room.up, Math.min(room.down, Math.sin(angle) * distance)),
    runMs: range.shortestMs + random() * (range.longestMs - range.shortestMs),
  }
  const { lift } = range
  if (lift) {
    const px = Math.min(room.up, lift.shortestPx + random() * (lift.longestPx - lift.shortestPx))
    plan.lift = { px, ms: lift.ms, spinDeg: lift.spinDeg }
  }
  return plan
}

/**
 * The escape (plan 4 §1): lift, legs out, run off, look around, run back, settle with a bounce.
 * Positions are offsets from the letter's place in its line. `hurryHome` cuts the trip short.
 */
export function createLetterRunner(plan: RunPlan, startedAt: number) {
  const lift = plan.lift?.px ?? liftPx
  const spin = plan.lift?.spinDeg ?? 0
  const durations: Record<RunPhase, number> = {
    lift: plan.lift?.ms ?? liftMs,
    run: plan.runMs,
    look: lookMs,
    back: plan.runMs,
    settle: settleMs,
    done: Infinity,
  }
  let phase: RunPhase = 'lift'
  let phaseStart = startedAt
  let from = { x: plan.dx, y: plan.dy - lift }
  let x = 0
  let y = 0

  return {
    hurryHome(now: number) {
      if (phase !== 'run' && phase !== 'look') return
      from = { x, y }
      phase = 'back'
      phaseStart = now
    },
    step(now: number): RunFrame {
      let share = (now - phaseStart) / durations[phase]
      while (share >= 1 && phase !== 'done') {
        phaseStart += durations[phase]
        phase = phaseAfter[phase]
        share = (now - phaseStart) / durations[phase]
      }
      const eased = easeOut(Math.min(1, share))
      const bob = Math.sin(share * Math.PI * 6) * bobPx
      let tilt = 0
      switch (phase) {
        case 'lift':
          x = 0
          y = -lift * eased
          tilt = spin * eased
          break
        case 'run':
          x = plan.dx * eased
          y = -lift + plan.dy * eased + bob
          break
        case 'look':
          x = plan.dx
          y = plan.dy - lift
          tilt = Math.sin(share * Math.PI * 2) * lookTiltDeg
          break
        case 'back':
          x = from.x * (1 - eased)
          y = from.y * (1 - eased) + bob
          break
        case 'settle':
          x = 0
          y = -bouncePx * Math.sin(Math.min(1, share) * Math.PI)
          break
        case 'done':
          x = 0
          y = 0
      }
      return { x, y, phase, tilt }
    },
  }
}
