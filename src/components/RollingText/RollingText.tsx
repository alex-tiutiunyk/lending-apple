import type { CSSProperties } from 'react'
import styles from './RollingText.module.scss'

type RollingTextProps = {
  label: string
}

/** Letters grouped by word, so a long label can wrap between words at large text sizes. */
function wordsOf(label: string) {
  let position = 0
  return label.split(' ').map((word) =>
    Array.from(word, (character) => {
      position += 1
      return { character, position: position - 1 }
    }),
  )
}

/**
 * A label whose letters roll once when its host is hovered, focused or busy; the host marks
 * itself with `data-roll-host`. The accessible name stays the plain label (plan 4 §7.1).
 */
export function RollingText({ label }: RollingTextProps) {
  return (
    <>
      <span className={styles.name}>{label}</span>
      <span key={label} className={styles.letters} aria-hidden="true">
        {wordsOf(label).map((word, wordIndex) => (
          <span key={wordIndex} className={styles.word}>
            {word.map(({ character, position }) => (
              <span
                key={`${position}:${character}`}
                className={styles.letter}
                style={{ '--i': position } as CSSProperties}
              >
                <span className={styles.strip}>
                  <span>{character}</span>
                  <span>{character}</span>
                </span>
              </span>
            ))}
          </span>
        ))}
      </span>
    </>
  )
}
