import { useId } from 'react'
import { inset, roundedRectPath } from '@/assets/svg/phone-geometry'
import type { featuresCopy } from '@/content/copy'
import styles from './TitaniumSample.module.scss'

type Callouts = (typeof featuresCopy)['titanium']['callouts']

// The corner of a phone body far larger than the view, so only the top-left corner shows
const body = { x: 18, y: 18, width: 520, height: 420, radius: 96 }
const bandWidth = 14
const glass = inset(body, bandWidth)
const display = inset(body, bandWidth + 6)
const labelX = 150

const leaders = [
  { key: 'band', fromX: body.x + bandWidth / 2, y: 140 },
  { key: 'glass', fromX: glass.x + 2, y: 166 },
  { key: 'display', fromX: display.x + 18, y: 192 },
] as const

type TitaniumSampleProps = { label: string; callouts: Callouts }

export function TitaniumSample({ label, callouts }: TitaniumSampleProps) {
  const id = useId()
  const metalId = `${id}-metal`
  const screenId = `${id}-screen`
  const titleId = `${id}-title`
  const fadeRightId = `${id}-fade-right`
  const fadeDownId = `${id}-fade-down`

  return (
    <svg className={styles.root} viewBox="0 0 320 210" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{label}</title>
      <defs>
        <linearGradient id={metalId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className={styles.metalLight} />
          <stop offset="0.35" className={styles.metalMid} />
          <stop offset="1" className={styles.metalDark} />
        </linearGradient>
        <radialGradient id={screenId} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" className={styles.screenGlow} />
          <stop offset="1" className={styles.screenDark} />
        </radialGradient>
        <linearGradient id={`${fadeRightId}-ramp`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.7" stopColor="white" />
          <stop offset="1" stopColor="black" />
        </linearGradient>
        <linearGradient id={`${fadeDownId}-ramp`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.75" stopColor="white" />
          <stop offset="1" stopColor="black" />
        </linearGradient>
        <mask id={fadeRightId}>
          <rect width="320" height="210" fill={`url(#${fadeRightId}-ramp)`} />
        </mask>
        <mask id={fadeDownId}>
          <rect width="320" height="210" fill={`url(#${fadeDownId}-ramp)`} />
        </mask>
      </defs>
      <g mask={`url(#${fadeRightId})`}>
        <g mask={`url(#${fadeDownId})`}>
          <path
            d={`${roundedRectPath(body)} ${roundedRectPath(glass)}`}
            fillRule="evenodd"
            fill={`url(#${metalId})`}
          />
          <path d={roundedRectPath(inset(body, 1.5))} className={styles.chamfer} />
          <rect x={212} y={body.y} width={3} height={bandWidth} className={styles.antennaBreak} />
          <rect x={body.x - 6} y={150} width={6} height={44} rx={2} fill={`url(#${metalId})`} />
          <path d={roundedRectPath(glass)} className={styles.glassEdge} />
          <path d={roundedRectPath(display)} fill={`url(#${screenId})`} />
        </g>
      </g>
      {leaders.map(({ key, fromX, y }) => (
        <g key={key}>
          <circle cx={fromX} cy={y} r={2.4} className={styles.dot} />
          <line x1={fromX} x2={labelX - 8} y1={y} y2={y} className={styles.leader} />
          <text x={labelX} y={y} className={styles.callout}>
            {callouts[key]}
          </text>
        </g>
      ))}
    </svg>
  )
}
