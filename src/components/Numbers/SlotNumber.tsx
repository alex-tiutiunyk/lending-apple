import { useLayoutEffect, useRef } from 'react'
import { useCountUp } from '@/hooks/useCountUp'
import { reelPositions } from './reelPositions'
import styles from './SlotNumber.module.scss'

const reelDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
const numberFormat = new Intl.NumberFormat('en-US')

type SlotNumberProps = {
  value: number
  unit: string
  isRunning: boolean
  delay: number
}

export function SlotNumber({ value, unit, isRunning, delay }: SlotNumberProps) {
  const formatted = numberFormat.format(value)
  const finalDigits = String(value).split('').map(Number)
  const animatedValue = useCountUp(value, { isRunning, delay })
  const progress = value === 0 ? 1 : animatedValue / value
  const positions = reelPositions(progress, finalDigits)
  const stripRefs = useRef<(HTMLSpanElement | null)[]>([])

  useLayoutEffect(() => {
    positions.forEach((position, column) => {
      stripRefs.current[column]?.style.setProperty('--reel', position.toFixed(3))
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
    <span className={styles.root}>
      <span className={styles.readable}>{`${formatted} ${unit}`}</span>
      <span className={styles.reels} aria-hidden="true">
        {glyphs}
      </span>
      <span className={styles.unit} aria-hidden="true">
        {unit}
      </span>
    </span>
  )
}
