import { mascotCopy } from '@/content/copy'
import type { ComboAct } from './mascotCombos'

export const randomActs = [
  'selfie',
  'nap',
  'dance',
  'trip',
  'mirror',
  'quip',
  'wave',
  'ring',
  'charge',
  'moonwalk',
  'stretch',
  'juggle',
] as const

export type RandomAct = (typeof randomActs)[number]
/** Acts asked for from outside through mascotRequests (plan 4 §1, §2.4). */
type RequestAct = 'chase' | 'missed' | 'glance' | 'cheer'
export type MascotAct = 'walk' | 'hurry' | RandomAct | 'blown' | ComboAct | RequestAct
export type MascotExpression = 'calm' | 'wide' | 'squint' | 'talk' | 'dizzy'
export type PokedSection = keyof typeof mascotCopy.sectionComplaints

export const actDurationMs: Record<Exclude<MascotAct, 'walk' | 'hurry'>, number> = {
  selfie: 2600,
  nap: 5200,
  dance: 3200,
  trip: 2200,
  mirror: 3000,
  quip: 3600,
  wave: 2200,
  ring: 3000,
  charge: 4200,
  moonwalk: 3600,
  stretch: 2600,
  juggle: 3800,
  blown: 1400,
  poked: 1600,
  screenshot: 2400,
  dizzy: 3400,
  airplane: 4600,
  chase: 6000,
  missed: 2200,
  glance: 1400,
  cheer: 2200,
}

export const walkDurationMs = { shortest: 4000, longest: 9000 }

export const actExpression: Record<MascotAct, MascotExpression> = {
  walk: 'calm',
  hurry: 'wide',
  selfie: 'wide',
  nap: 'squint',
  dance: 'calm',
  trip: 'wide',
  mirror: 'squint',
  quip: 'talk',
  wave: 'talk',
  ring: 'wide',
  charge: 'squint',
  moonwalk: 'calm',
  stretch: 'squint',
  juggle: 'wide',
  blown: 'wide',
  poked: 'wide',
  screenshot: 'wide',
  dizzy: 'dizzy',
  airplane: 'talk',
  chase: 'wide',
  missed: 'squint',
  glance: 'wide',
  cheer: 'talk',
}

/** Acts that draw Pip's arms; the art for them is mounted only while they run. */
export const armActs: readonly MascotAct[] = ['wave', 'stretch', 'juggle', 'airplane']

function pick<Item>(items: readonly Item[], random: () => number) {
  return items[Math.floor(random() * items.length) % items.length]
}

export function isRandomAct(act: MascotAct): act is RandomAct {
  return (randomActs as readonly MascotAct[]).includes(act)
}

export function nextRandomAct(random: () => number): RandomAct {
  return pick(randomActs, random) ?? 'quip'
}

export function walkDuration(random: () => number) {
  const { shortest, longest } = walkDurationMs
  return shortest + random() * (longest - shortest)
}

const sectionLineShare = 0.5

export function lineFor(
  act: MascotAct,
  random: () => number,
  section: PokedSection | null = null,
): string | null {
  switch (act) {
    case 'walk':
    case 'dance':
    case 'glance':
      return null
    case 'quip':
      return pick(mascotCopy.quips, random) ?? null
    case 'poked':
      if (section && random() < sectionLineShare) {
        return pick(mascotCopy.sectionComplaints[section], random) ?? null
      }
      return pick(mascotCopy.complaints, random) ?? null
    case 'hurry':
      return pick(mascotCopy.excuses, random) ?? null
    case 'screenshot':
    case 'dizzy':
    case 'airplane':
      return mascotCopy.combos[act]
    default:
      return pick(mascotCopy[act], random) ?? null
  }
}
