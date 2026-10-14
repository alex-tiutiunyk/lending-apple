import { DecodeText } from '@/components/RevealText/DecodeText'
import { navigation } from '@/content/copy'
import styles from './SectionLabel.module.scss'

const decodeMs = 300

type SectionLabelProps = {
  active: number
}

/**
 * "/ Design", "/ Inside" … next to the product name for the section in view (plan 4 §2.3).
 * All labels sit stacked in one cell, so the box is as wide as the widest and the nav never
 * moves. Decorative: the nav already tells the section through aria-current.
 */
export function SectionLabel({ active }: SectionLabelProps) {
  return (
    <span className={styles.root} aria-hidden="true" data-calm-fade>
      {navigation.map(({ label }, index) => (
        <span key={label} className={styles.item} data-active={index === active ? '' : undefined}>
          {index === active ? (
            <DecodeText key={label} text={`/ ${label}`} durationMs={decodeMs} level="ambient" />
          ) : (
            `/ ${label}`
          )}
        </span>
      ))}
    </span>
  )
}
