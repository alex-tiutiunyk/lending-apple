import { useId } from 'react'
import styles from './TitaniumSample.module.scss'

const brushLines = Array.from({ length: 38 }, (_, line) => ({
  y: 6 + line * 3.1,
  opacity: 0.05 + ((line * 37) % 11) / 90,
}))

export function TitaniumSample({ label }: { label: string }) {
  const id = useId()
  const metalId = `${id}-metal`
  const titleId = `${id}-title`

  return (
    <svg className={styles.sample} viewBox="0 0 320 126" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{label}</title>
      <defs>
        <linearGradient id={metalId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className={styles.metalLight} />
          <stop offset="0.45" className={styles.metalMid} />
          <stop offset="1" className={styles.metalDark} />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="320" height="126" rx="22" fill={`url(#${metalId})`} />
      {brushLines.map(({ y, opacity }) => (
        <line
          key={y}
          x1="10"
          x2="310"
          y1={y}
          y2={y}
          className={styles.brush}
          strokeOpacity={opacity}
        />
      ))}
      <rect x="0.5" y="0.5" width="319" height="125" rx="21.5" className={styles.edge} />
    </svg>
  )
}
