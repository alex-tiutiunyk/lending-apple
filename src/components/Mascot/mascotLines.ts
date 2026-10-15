import { mascotCopy } from '@/content/copy'
import type { Rig } from './mascotDescent'

/**
 * Lines drawn without replacement (the `createRigBag` rule, plan 5 §6): every line comes once
 * before any comes again, and a new round never starts with the line that ended the last one.
 */
export function createLineBag(lines: readonly string[], random: () => number) {
  let bag: string[] = []
  let last: string | null = null
  return {
    next(): string {
      if (bag.length === 0) {
        bag = [...lines]
        for (let index = bag.length - 1; index > 0; index -= 1) {
          const swap = Math.floor(random() * (index + 1))
          ;[bag[index], bag[swap]] = [bag[swap] as string, bag[index] as string]
        }
        if (bag.length > 1 && bag[bag.length - 1] === last) bag.reverse()
      }
      last = bag.pop() ?? ''
      return last
    },
  }
}

type LineBag = ReturnType<typeof createLineBag>
let falling: LineBag | null = null
let joy: LineBag | null = null

/** A fall is the best thing that can happen to Pip (plan 7 §1): the exclamation on the way down. */
export function fallingLine(random: () => number) {
  falling ??= createLineBag(mascotCopy.falling, random)
  return falling.next()
}

export function joyLine(random: () => number) {
  joy ??= createLineBag(mascotCopy.joy, random)
  return joy.next()
}

/** The landing line: the joy line, then the rig's own joke when there was a rig (offline: none). */
export function landingLine(random: () => number, rig: Rig | null) {
  const line = joyLine(random)
  return rig ? `${line} · ${mascotCopy.landed[rig]}` : line
}
