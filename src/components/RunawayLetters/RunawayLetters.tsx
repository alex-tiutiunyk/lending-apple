import { useRef } from 'react'
import { useRunawayLetters } from './useRunawayLetters'
import styles from './RunawayLetters.module.scss'

/** The overlay the running letters live in; the text itself never moves (plan 4 §1). */
export default function RunawayLetters() {
  const layerRef = useRef<HTMLDivElement>(null)
  useRunawayLetters(layerRef)

  return <div ref={layerRef} className={styles.root} aria-hidden="true" />
}
