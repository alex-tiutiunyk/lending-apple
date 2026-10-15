import { lazy, Suspense, useCallback, useEffect, useRef } from 'react'
import { mascotCopy } from '@/content/copy'
import { useAwakeWhileInView } from '@/hooks/useAmbientMotion'
import { MascotFigure } from './MascotFigure'
import type { RandomAct } from './mascotActs'
import { useMascotAvoidance } from './useMascotAvoidance'
import { useMascotBrain } from './useMascotBrain'
import { useMascotCombos } from './useMascotCombos'
import { useMascotDrag } from './useMascotDrag'
import { useMascotGaze } from './useMascotGaze'
import { useMascotLift } from './useMascotLift'
import { useMascotRequests } from './useMascotRequests'
import { useMascotThrow } from './useMascotThrow'
import styles from './Mascot.module.scss'

// The rigs Pip comes down on after a drag (plan 5 §6): fetched on the first pointerdown
const MascotRig = lazy(() => import('./mascot-rigs'))

const sleepyLetters = ['z', 'z', 'Z'].map((letter, order) => ({ letter, order }))

function rollDice() {
  return Math.random()
}

export default function Mascot() {
  const pipRef = useRef<HTMLElement>(null)
  const projectileRef = useRef<HTMLSpanElement>(null)
  const hintLine = useRef<(act: RandomAct) => string | null>(() => null)
  const lineForRandomAct = useCallback((act: RandomAct) => hintLine.current(act), [])
  const throwAllowed = useRef<(act: RandomAct) => boolean>(() => false)
  const isActAllowed = useCallback((act: RandomAct) => throwAllowed.current(act), [])
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
    placeAt,
  } = useMascotBrain(pipRef, rollDice, lineForRandomAct, isActAllowed)
  useMascotRequests(pipRef, rollDice, { startAct, currentAct, turnTo })
  const isThrowAllowed = useMascotThrow(pipRef, projectileRef, act, rollDice, {
    startAct,
    currentAct,
    turnTo,
  })
  useEffect(() => {
    throwAllowed.current = isThrowAllowed
  }, [isThrowAllowed])
  const combos = useMascotCombos(pipRef, rollDice, { startAct, currentAct })
  useEffect(() => {
    hintLine.current = combos.lineForRandomAct
  }, [combos.lineForRandomAct])
  useMascotAvoidance(pipRef, act, stepAside)
  useMascotGaze(pipRef)
  // Pip is fixed at the bottom of the window, so it is awake for the whole visit; the attribute
  // is what lets its pieces take a compositor layer (plan 6 §7, rule 6)
  useAwakeWhileInView(pipRef)
  useMascotLift(pipRef)
  const { rig, pokeProps } = useMascotDrag(
    pipRef,
    rollDice,
    act,
    { startAct, hold, placeAt },
    combos.poke,
  )

  return (
    <>
      <aside
        ref={pipRef}
        className={styles.root}
        aria-label={mascotCopy.label}
        data-act={act}
        data-facing={facing}
        data-flight={bubbleSide}
        data-rig={rig ?? undefined}
      >
        <div className={styles.lift}>
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
          {rig && (
            <Suspense fallback={null}>
              <MascotRig rig={rig} />
            </Suspense>
          )}
          <button
            type="button"
            className={styles.poke}
            aria-label={mascotCopy.poke}
            {...pokeProps}
            onFocus={() => hold('focus', true)}
            onBlur={() => hold('focus', false)}
            onPointerEnter={() => hold('pointer', true)}
            onPointerLeave={() => hold('pointer', false)}
          >
            <MascotFigure act={act} />
          </button>
          <p className={styles.announcer} aria-live="polite">
            {pokeReply}
          </p>
        </div>
      </aside>
      {/* The slingshot's pebble (plan 7 §2): fixed to the window, not to Pip */}
      <span ref={projectileRef} className={styles.projectile} aria-hidden="true" hidden />
    </>
  )
}
