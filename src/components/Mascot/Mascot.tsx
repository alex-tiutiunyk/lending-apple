import { useCallback, useEffect, useRef } from 'react'
import { mascotCopy } from '@/content/copy'
import { MascotArt } from './MascotArt'
import type { RandomAct } from './mascotActs'
import { useMascotAvoidance } from './useMascotAvoidance'
import { useMascotBrain } from './useMascotBrain'
import { useMascotCombos } from './useMascotCombos'
import { useMascotGaze } from './useMascotGaze'
import { useMascotRequests } from './useMascotRequests'
import styles from './Mascot.module.scss'

const sleepyLetters = ['z', 'z', 'Z'].map((letter, order) => ({ letter, order }))

function rollDice() {
  return Math.random()
}

export default function Mascot() {
  const pipRef = useRef<HTMLElement>(null)
  const hintLine = useRef<(act: RandomAct) => string | null>(() => null)
  const lineForRandomAct = useCallback((act: RandomAct) => hintLine.current(act), [])
  const {
    act,
    facing,
    line,
    pokeReply,
    bubbleSide,
    startAct,
    currentAct,
    turnTo,
    hold,
    stepAside,
  } = useMascotBrain(pipRef, rollDice, lineForRandomAct)
  useMascotRequests(pipRef, rollDice, { startAct, currentAct, turnTo })
  const combos = useMascotCombos(pipRef, rollDice, { startAct, currentAct })
  useEffect(() => {
    hintLine.current = combos.lineForRandomAct
  }, [combos.lineForRandomAct])
  useMascotAvoidance(pipRef, act, stepAside)
  useMascotGaze(pipRef)

  return (
    <aside
      ref={pipRef}
      className={styles.root}
      aria-label={mascotCopy.label}
      data-act={act}
      data-facing={facing}
      data-flight={bubbleSide}
    >
      {line && (
        <p key={line} className={styles.bubble} data-side={bubbleSide} aria-hidden="true">
          {line}
        </p>
      )}
      {act === 'nap' && (
        <span className={styles.sleep} aria-hidden="true">
          {sleepyLetters.map(({ letter, order }) => (
            <span key={order} className={styles.sleepLetter}>
              {letter}
            </span>
          ))}
        </span>
      )}
      <button
        type="button"
        className={styles.poke}
        aria-label={mascotCopy.poke}
        onClick={combos.poke}
        onFocus={() => hold('focus', true)}
        onBlur={() => hold('focus', false)}
        onPointerEnter={() => hold('pointer', true)}
        onPointerLeave={() => hold('pointer', false)}
      >
        <MascotArt act={act} />
      </button>
      <p className={styles.announcer} aria-live="polite">
        {pokeReply}
      </p>
    </aside>
  )
}
