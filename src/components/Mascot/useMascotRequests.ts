import { useEffect, type RefObject } from 'react'
import { mascotRequests } from '@/hooks/mascotRequests'
import type { MascotAct } from './mascotActs'
import type { Facing } from './mascotMotion'

const chaseCooldownMs = 60_000
const glanceShare = 0.25

type RequestControls = {
  startAct: (act: MascotAct, line?: string | null) => void
  currentAct: () => MascotAct
  turnTo: (facing: Facing) => void
}

/**
 * Pip answers requests from outside (plan 4 §1, §2.4): a chase after a runaway letter, a
 * glance at the header, one cheer at the end of the page. Only while idle (walking, not held,
 * not hiding or stepping behind the footer), with a cooldown on the chase.
 */
export function useMascotRequests(
  pip: RefObject<HTMLElement | null>,
  random: () => number,
  { startAct, currentAct, turnTo }: RequestControls,
) {
  useEffect(() => {
    let lastChaseAt = -Infinity
    let hasCheered = false

    const isIdle = () => {
      const element = pip.current
      return (
        !!element &&
        currentAct() === 'walk' &&
        !element.hasAttribute('data-held') &&
        !element.hasAttribute('data-hiding') &&
        !element.hasAttribute('data-behind')
      )
    }

    return mascotRequests.subscribe((request) => {
      switch (request.type) {
        case 'chase': {
          const facing: Facing = request.direction === 1 ? 'right' : 'left'
          if (currentAct() === 'chase') {
            turnTo(facing)
            return true
          }
          if (!isIdle() || performance.now() - lastChaseAt < chaseCooldownMs) return false
          lastChaseAt = performance.now()
          turnTo(facing)
          startAct('chase')
          return true
        }
        case 'chase-end':
          if (currentAct() !== 'chase') return false
          startAct('missed')
          return true
        case 'glance':
          if (isIdle() && random() < glanceShare) startAct('glance')
          return true
        case 'cheer':
          if (hasCheered || !isIdle()) return false
          hasCheered = true
          startAct('cheer')
          return true
      }
    })
  }, [pip, random, startAct, currentAct, turnTo])
}
