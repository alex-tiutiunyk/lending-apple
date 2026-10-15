import { useEffect, useId, useRef, type ReactNode } from 'react'
import { useAwakeWhileInView } from '@/hooks/useAmbientMotion'
import { useScrollVelocity } from '@/hooks/useDocumentProgress'
import { useInView } from '@/hooks/useInView'
import { AppleBiteMask, AppleWorm } from './apple-bite'
import { appleBodyPath, appleLeafPath, appleMarkViewBox } from './apple-mark-path'
import styles from './living-mark.module.scss'

/** One breath, the same as the `breathe` and `leaf-swing` keyframes in the stylesheet. */
const breathMs = 4000

/**
 * Both marks breathe in step (plan 4 §7.2): whenever a mark wakes up, its loop is pinned to one
 * shared clock through a negative delay, so the header and the footer never breathe out of phase.
 */
function useSharedBreath(mark: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = mark.current
    if (!element) return
    const align = () => {
      if (!element.hasAttribute('data-awake')) return
      element.style.setProperty(
        '--breath-delay',
        `${(-(performance.now() % breathMs)).toFixed(0)}ms`,
      )
    }
    const observer = new MutationObserver(align)
    observer.observe(element, { attributes: true, attributeFilter: ['data-awake'] })
    align()
    return () => observer.disconnect()
  }, [mark])
}

type LivingMarkProps = {
  /** `load`: the outline draws itself at first paint (CSS only). `view`: when it scrolls into view. */
  drawOn?: 'load' | 'view'
  className?: string | undefined
}

type PieceProps = {
  className: string | undefined
  path: string
  /** Wraps the fill and the stroke: the body's bite mask, the leaf's one-shot swing. */
  inner?: { className?: string | undefined; mask?: string }
  children?: ReactNode
}

/** One piece of the mark on its own `<svg>` root, in the mark's full viewBox (plan 6 §7). */
function Piece({ className, path, inner, children }: PieceProps) {
  return (
    <svg className={className} viewBox={appleMarkViewBox} focusable="false">
      <g className={inner?.className} mask={inner?.mask}>
        <g className={styles.fill}>
          <path d={path} fill="currentColor" />
        </g>
        <g className={styles.stroke}>
          <path d={path} pathLength={1} />
        </g>
      </g>
      {children}
    </svg>
  )
}

/**
 * The brand mark with a life of its own (plan 4 §2.2, §7.2): an outline that draws before the
 * fill fades in, slow breathing with a swinging leaf while awake and a turn with the scroll
 * speed. A hover or focus of its host (`data-mark-host`) grows it and a worm chews a bite out of
 * it (plan 7 §4). A rig (plan 6 §7): an HTML box with the body and the leaf as two `<svg>` roots,
 * so the loops run on the compositor; the lean and the hover growth sit on HTML boxes around them.
 */
export function LivingMark({ drawOn = 'load', className }: LivingMarkProps) {
  const markRef = useRef<HTMLSpanElement>(null)
  useAwakeWhileInView(markRef)
  useSharedBreath(markRef)
  useScrollVelocity(markRef)
  const isSeen = useInView(markRef, { once: true, threshold: 0.5 })
  const isDrawing = drawOn === 'load' || isSeen
  // useId, so the header and the footer marks never share a mask id
  const maskId = useId()

  return (
    <span
      ref={markRef}
      className={className ? `${styles.root} ${className}` : styles.root}
      aria-hidden="true"
      data-drawing={isDrawing ? '' : undefined}
    >
      <span className={styles.grow}>
        <Piece className={styles.body} path={appleBodyPath} inner={{ mask: `url(#${maskId})` }}>
          <AppleBiteMask id={maskId} />
          <AppleWorm />
        </Piece>
        <Piece
          className={styles.leaf}
          path={appleLeafPath}
          inner={{ className: styles.leafSwing }}
        />
      </span>
    </span>
  )
}
