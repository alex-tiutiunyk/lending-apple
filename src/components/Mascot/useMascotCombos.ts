import { useCallback, useEffect, useRef, type RefObject } from 'react'
import { mascotCopy } from '@/content/copy'
import { lineFor, type MascotAct, type PokedSection, type RandomAct } from './mascotActs'
import { addPoke, comboFor, comboWindowMs, idleCounter, type ComboAct } from './mascotCombos'
import {
  countAct,
  findCombo,
  freshHints,
  giveHint,
  hintToGive,
  type HintState,
} from './mascotHints'

const storageKey = 'concept-18-pip-hints'
const hintShare = 0.5
const pokedSections = Object.keys(mascotCopy.sectionComplaints) as PokedSection[]
const busyCombos: readonly MascotAct[] = ['screenshot', 'dizzy', 'airplane', 'carried', 'land']

function readStoredHints(): HintState {
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(storageKey) ?? 'null') as Pick<
      HintState,
      'found' | 'hintsGiven'
    > | null
    if (!stored || !Array.isArray(stored.found) || typeof stored.hintsGiven !== 'number') {
      return freshHints
    }
    return { ...freshHints, found: stored.found, hintsGiven: stored.hintsGiven }
  } catch {
    return freshHints
  }
}

function storeHints({ found, hintsGiven }: HintState) {
  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify({ found, hintsGiven }))
  } catch {
    // Without storage the hints simply start over on the next visit
  }
}

function sectionUnder(pip: HTMLElement): PokedSection | null {
  const { left, top, width, height } = pip.getBoundingClientRect()
  const stack = document.elementsFromPoint(left + width / 2, top + height / 2)
  const id = stack.map((element) => element.closest('section[id]')?.id).find(Boolean)
  return pokedSections.find((section) => section === id) ?? null
}

type ComboControls = {
  startAct: (act: MascotAct, line?: string | null) => void
  currentAct: () => MascotAct
}

/** Counts quick pokes into combos and decides when a quip turns into a hint. */
export function useMascotCombos(
  pip: RefObject<HTMLElement | null>,
  random: () => number,
  { startAct, currentAct }: ComboControls,
) {
  const counter = useRef(idleCounter)
  const timer = useRef(0)
  const hints = useRef<HintState>(freshHints)

  useEffect(() => {
    hints.current = readStoredHints()
    return () => window.clearTimeout(timer.current)
  }, [])

  const resolve = useCallback(() => {
    const combo: ComboAct = comboFor(counter.current.count)
    counter.current = idleCounter
    hints.current = findCombo(hints.current, combo)
    storeHints(hints.current)
    const section = pip.current ? sectionUnder(pip.current) : null
    startAct(combo, lineFor(combo, random, section))
  }, [pip, random, startAct])

  const poke = useCallback(() => {
    if (busyCombos.includes(currentAct())) return
    counter.current = addPoke(counter.current, performance.now())
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(resolve, comboWindowMs)
  }, [currentAct, resolve])

  const lineForRandomAct = useCallback(
    (act: RandomAct) => {
      hints.current = countAct(hints.current)
      const hint = act === 'quip' ? hintToGive(hints.current) : null
      if (!hint || random() >= hintShare) return null
      hints.current = giveHint(hints.current)
      storeHints(hints.current)
      return mascotCopy.hints[hint]
    },
    [random],
  )

  return { poke, lineForRandomAct }
}
