import { useRef } from 'react'
import { mascotCopy } from '@/content/copy'
import { MascotArt } from './MascotArt'
import { actExpression } from './mascotActs'
import { useMascotAvoidance } from './useMascotAvoidance'
import { useMascotBrain } from './useMascotBrain'
import styles from './Mascot.module.scss'

const sleepyLetters = ['z', 'z', 'Z'].map((letter, order) => ({ letter, order }))

function rollDice() {
  return Math.random()
}

export default function Mascot() {
  const pipRef = useRef<HTMLElement>(null)
  const { act, facing, line, pokeReply, bubbleSide, poke, hold } = useMascotBrain(pipRef, rollDice)
  useMascotAvoidance(pipRef)

  return (
    <aside
      ref={pipRef}
      className={styles.pip}
      aria-label={mascotCopy.label}
      data-act={act}
      data-facing={facing}
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
        onClick={poke}
        onFocus={() => hold('focus', true)}
        onBlur={() => hold('focus', false)}
        onPointerEnter={() => hold('pointer', true)}
        onPointerLeave={() => hold('pointer', false)}
      >
        <MascotArt expression={actExpression[act]} />
      </button>
      <p className={styles.announcer} aria-live="polite">
        {pokeReply}
      </p>
    </aside>
  )
}
