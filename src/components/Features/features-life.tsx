import type { RefObject } from 'react'
import { LensBug } from './LensBug'
import { useScratchCounter } from './useScratchCounter'

type FeaturesLifeProps = {
  lenses: RefObject<HTMLElement | null>
  sample: RefObject<HTMLElement | null>
}

/** The lazy life of the feature cards (plan 5 §5, §11): the lens bug and the scratch counter. */
export default function FeaturesLife({ lenses, sample }: FeaturesLifeProps) {
  useScratchCounter(sample)
  return <LensBug lenses={lenses} />
}
