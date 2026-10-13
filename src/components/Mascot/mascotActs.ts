import { mascotCopy } from '@/content/copy'

export const randomActs = ['selfie', 'nap', 'dance', 'trip', 'mirror', 'quip'] as const

export type RandomAct = (typeof randomActs)[number]
export type MascotAct = 'walk' | RandomAct | 'blown' | 'poked'
export type MascotExpression = 'calm' | 'wide' | 'squint' | 'talk'

export const actDurationMs: Record<Exclude<MascotAct, 'walk'>, number> = {
  selfie: 2600,
  nap: 5200,
  dance: 3200,
  trip: 2200,
  mirror: 3000,
  quip: 3600,
  blown: 1400,
  poked: 1600,
}

export const walkDurationMs = { shortest: 4000, longest: 9000 }

export const actExpression: Record<MascotAct, MascotExpression> = {
  walk: 'calm',
  selfie: 'wide',
  nap: 'squint',
  dance: 'calm',
  trip: 'wide',
  mirror: 'squint',
  quip: 'talk',
  blown: 'wide',
  poked: 'wide',
}

function pick<Item>(items: readonly Item[], random: () => number) {
  return items[Math.floor(random() * items.length) % items.length]
}

export function nextRandomAct(random: () => number): RandomAct {
  return pick(randomActs, random) ?? 'quip'
}

export function walkDuration(random: () => number) {
  const { shortest, longest } = walkDurationMs
  return shortest + random() * (longest - shortest)
}

export function lineFor(act: MascotAct, random: () => number): string | null {
  switch (act) {
    case 'quip':
      return pick(mascotCopy.quips, random) ?? null
    case 'poked':
      return pick(mascotCopy.complaints, random) ?? null
    case 'selfie':
    case 'nap':
    case 'mirror':
    case 'trip':
    case 'blown':
      return mascotCopy[act]
    case 'walk':
    case 'dance':
      return null
  }
}
