import { useCallback, useLayoutEffect, useRef } from 'react'
import { write } from '@/hooks/frameLoop'
import { useCountUp } from '@/hooks/useCountUp'
import { reelPositions } from './reelPositions'
import styles from './SlotNumber.module.scss'

const reelDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
const numberFormat = new Intl.NumberFormat('en-US')
const rollMs = 1200
const replayMs = 700

type SlotNumberProps = {
  value: number
  unit: string
  isRunning: boolean
  delay: number
  /** Each change spins the reels one more time, faster, and flips the unit (plan 5 §12). */
  replay: number
}

/**
 * The reels roll from a direct `transform` write per frame (plan 6 §5): nothing renders while
 * they spin. At the end `--reel` holds each column's final position, so the ambient tick's
 * keyframes can read it, and the inline transform goes.
 */
export function SlotNumber({ value, unit, isRunning, delay, replay }: SlotNumberProps) {
  const formatted = numberFormat.format(value)
  const finalDigits = String(value).split('').map(Number)
  const isReplay = replay > 0
  const stripRefs = useRef<(HTMLSpanElement | null)[]>([])

  const onFrame = useCallback(
    (animatedValue: number) => {
      const progress = value === 0 ? 1 : animatedValue / value
      const positions = reelPositions(progress, finalDigits)
      write(() => {
        positions.forEach((position, column) => {
          const strip = stripRefs.current[column]
          if (strip) strip.style.transform = `translateY(${(position * -1).toFixed(3)}em)`
        })
      })
    },
    // The digits derive from the value
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value],
  )
  const settledValue = useCountUp(value, {
    isRunning,
    delay: isReplay ? 0 : delay,
    duration: isReplay ? replayMs : rollMs,
    replay,
    onFrame,
  })

  useLayoutEffect(() => {
    const positions = reelPositions(settledValue === value ? 1 : 0, finalDigits)
    positions.forEach((position, column) => {
      const strip = stripRefs.current[column]
      if (!strip) return
      strip.style.removeProperty('transform')
      strip.style.setProperty('--reel', position.toFixed(3))
    })
  })

  let digitColumn = 0
  const glyphs = formatted.split('').map((character, offset) => {
    const placeFromRight = formatted.length - offset
    if (!/\d/.test(character)) {
      return (
        <span key={`separator-${placeFromRight}`} className={styles.separator}>
          {character}
        </span>
      )
    }
    const column = digitColumn
    digitColumn += 1
    return (
      <span key={`place-${placeFromRight}`} className={styles.reel}>
        <span
          className={styles.strip}
          ref={(element) => {
            stripRefs.current[column] = element
          }}
        >
          {reelDigits.map((digit, slot) => (
            <span key={`${digit}-${slot > 9 ? 'wrap' : 'base'}`}>{digit}</span>
          ))}
        </span>
      </span>
    )
  })

  return (
    <span className={styles.root} data-replayed={isReplay ? '' : undefined}>
      <span className={styles.readable}>{`${formatted} ${unit}`}</span>
      <span className={styles.reels} aria-hidden="true">
        {glyphs}
      </span>
      {/* Keyed on the replay count, so each replay restarts the unit's flip */}
      <span key={replay} className={styles.unit} aria-hidden="true">
        {unit}
      </span>
    </span>
  )
}
