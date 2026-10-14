type ChasePhase = 'jump' | 'run' | 'dodge' | 'home' | 'done'
export type ChaseFrame = {
  x: number
  y: number
  phase: ChasePhase
  direction: 1 | -1
  /** The letter just turned: Pip has to be told the new direction. */
  turned: boolean
}

export type ChaseSetup = {
  startX: number
  startY: number
  groundY: number
  direction: 1 | -1
  /** Free ground for the letter: the viewport minus Pip's avoid zones. */
  min: number
  max: number
}

/** Where the line is now: Pip's ground moves with the sticky CTA, the home spot with the block. */
export type ChaseLine = { groundY?: number | undefined; homeY?: number | undefined }

export const jumpMs = 500
export const homeMs = 600
const dodgeMs = 150
const longestRunMs = 3200
const speedPxPerMs = 0.17
const dodgeReachPx = 64
const maxDodges = 2
const arcHeightPx = 40

function arc(share: number) {
  return Math.sin(share * Math.PI) * arcHeightPx
}

/**
 * A letter's run from Pip (plan 4 §1): it jumps down onto Pip's line, runs away, dodges twice
 * when Pip gets close (a stop, a turn, a slip past it), and jumps back up to its place in the
 * line just before Pip could catch it. Pip is never faster than it.
 */
export function createChaseRunner(setup: ChaseSetup, startedAt: number) {
  let phase: ChasePhase = 'jump'
  let phaseStart = startedAt
  let lastNow = startedAt
  let x = setup.startX
  let y = setup.startY
  let direction = setup.direction
  let dodges = 0
  let isClearOfPip = true
  let homeFromX = x

  const goHome = (now: number) => {
    phase = 'home'
    phaseStart = now
    homeFromX = x
  }

  return {
    end(now: number) {
      if (phase === 'run' || phase === 'dodge') goHome(now)
    },
    step(now: number, pipCenterX: number, line: ChaseLine = {}): ChaseFrame {
      const groundY = line.groundY ?? setup.groundY
      const homeY = line.homeY ?? setup.startY
      const elapsed = Math.min(100, now - lastNow)
      lastNow = now
      const sincePhase = now - phaseStart
      let turned = false
      switch (phase) {
        case 'jump': {
          const share = Math.min(1, sincePhase / jumpMs)
          y = homeY + (groundY - homeY) * share - arc(share)
          if (share >= 1) {
            phase = 'run'
            phaseStart = now
          }
          break
        }
        case 'run': {
          y = groundY
          x = Math.max(setup.min, Math.min(setup.max, x + direction * speedPxPerMs * elapsed))
          const isAtEdge = x <= setup.min || x >= setup.max
          const isPipClose = Math.abs(pipCenterX - x) < dodgeReachPx
          // One dodge per approach: after the turn the letter slips past Pip and gets clear first
          const mayDodge = (isPipClose && isClearOfPip) || isAtEdge
          if (!isPipClose) isClearOfPip = true
          if (mayDodge && dodges < maxDodges) {
            dodges += 1
            isClearOfPip = false
            phase = 'dodge'
            phaseStart = now
          } else if (isAtEdge || sincePhase >= longestRunMs) {
            goHome(now)
          }
          break
        }
        case 'dodge':
          y = groundY
          if (sincePhase >= dodgeMs) {
            direction = direction === 1 ? -1 : 1
            turned = true
            phase = 'run'
            phaseStart = now
          }
          break
        case 'home': {
          const share = Math.min(1, sincePhase / homeMs)
          x = homeFromX + (setup.startX - homeFromX) * share
          y = groundY + (homeY - groundY) * share - arc(share)
          if (share >= 1) phase = 'done'
          break
        }
        case 'done':
          x = setup.startX
          y = homeY
      }
      return { x, y, phase, direction, turned }
    },
  }
}
