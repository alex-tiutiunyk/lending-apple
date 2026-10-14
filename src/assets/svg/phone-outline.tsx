import { useId, type CSSProperties } from 'react'
import { phoneViewBoxes, type PhoneView } from './phone-geometry'
import { blueprintHeads, blueprintParts, plainParts, type PartPaths } from './phone-outline-parts'
import styles from './phone-outline.module.scss'

type PartGroupsProps = {
  parts: PartPaths
  heads?: PartPaths
}

function PartGroups({ parts, heads = {} }: PartGroupsProps) {
  return Object.entries(parts).map(([part, paths]) => (
    <g key={part} data-part={part}>
      {paths.map((d) => (
        <path key={d} d={d} pathLength={1} />
      ))}
      {heads[part]?.map((d) => (
        <path key={`head:${d}`} className={styles.head} d={d} pathLength={1} />
      ))}
    </g>
  ))
}

type PhoneOutlineProps = {
  view?: PhoneView
  /** `blueprint` (plan 4 §8): hairlines in two weights, more paths, a gradient and drawing heads. */
  detail?: 'plain' | 'blueprint'
  className?: string | undefined
}

export function PhoneOutline({ view = 'both', detail = 'plain', className }: PhoneOutlineProps) {
  const gradientId = useId()
  const isBlueprint = detail === 'blueprint'
  const parts = isBlueprint ? blueprintParts : plainParts
  const heads = isBlueprint ? blueprintHeads : { front: {}, back: {} }
  const classes = [styles.root, isBlueprint && styles.rootBlueprint, className]

  return (
    <svg
      className={classes.filter(Boolean).join(' ')}
      viewBox={phoneViewBoxes[view]}
      aria-hidden="true"
      focusable="false"
      style={
        isBlueprint ? ({ '--outline-stroke': `url("#${gradientId}")` } as CSSProperties) : undefined
      }
    >
      {isBlueprint && (
        <defs>
          <linearGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1="8"
            y1="8"
            x2="392"
            y2="352"
          >
            <stop offset="0" className={styles.stopAccent} />
            <stop offset="0.5" className={styles.stopMid} />
            <stop offset="1" className={styles.stopCool} />
          </linearGradient>
        </defs>
      )}
      {view !== 'back' && <PartGroups parts={parts.front} heads={heads.front} />}
      {view !== 'front' && <PartGroups parts={parts.back} heads={heads.back} />}
    </svg>
  )
}
