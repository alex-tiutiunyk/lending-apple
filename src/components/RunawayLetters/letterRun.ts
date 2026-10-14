export type RunPlan = { dx: number; dy: number; runMs: number }
type RunPhase = 'lift' | 'run' | 'look' | 'back' | 'settle' | 'done'
export type RunFrame = { x: number; y: number; phase: RunPhase; tilt: number }

/** Free room around the letter inside the viewport, in px. */
export type Room = { left: number; right: number; up: number; down: number }

const liftMs = 200
const lookMs = 400
const settleMs = 250
const shortestRunMs = 700
const longestRunMs = 1100
const shortestDistancePx = 40
const longestDistancePx = 160
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
export function planRun(random: () => number, room: Room): RunPlan {
  const angle = random() * Math.PI * 2
  const distance = shortestDistancePx + random() * (longestDistancePx - shortestDistancePx)
  return {
    dx: Math.max(-room.left, Math.min(room.right, Math.cos(angle) * distance)),
    dy: Math.max(-room.up, Math.min(room.down, Math.sin(angle) * distance)),
    runMs: shortestRunMs + random() * (longestRunMs - shortestRunMs),
  }
}

/**
 * The escape (plan 4 §1): lift, legs out, run off, look around, run back, settle with a bounce.
 * Positions are offsets from the letter's place in its line. `hurryHome` cuts the trip short.
 */
export function createLetterRunner(plan: RunPlan, startedAt: number) {
  const durations: Record<RunPhase, number> = {
    lift: liftMs,
    run: plan.runMs,
    look: lookMs,
    back: plan.runMs,
    settle: settleMs,
    done: Infinity,
  }
  let phase: RunPhase = 'lift'
  let phaseStart = startedAt
  let from = { x: plan.dx, y: plan.dy - liftPx }
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
          y = -liftPx * eased
          break
        case 'run':
          x = plan.dx * eased
          y = -liftPx + plan.dy * eased + bob
          break
        case 'look':
          x = plan.dx
          y = plan.dy - liftPx
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
