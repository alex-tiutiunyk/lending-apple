import { useEffect, useRef } from 'react'
import { useAwakeWhileInView } from '@/hooks/useAmbientMotion'
import { useInView } from '@/hooks/useInView'
import { appleBodyPath, appleLeafPath, appleMarkViewBox } from './apple-mark-path'
import styles from './living-mark.module.scss'

/** One breath, the same as the `breathe` and `leaf-swing` keyframes in the stylesheet. */
const breathMs = 4000

/**
 * Both marks breathe in step (plan 4 §7.2): whenever a mark wakes up, its loop is pinned to one
 * shared clock through a negative delay, so the header and the footer never breathe out of phase.
 */
function useSharedBreath(mark: React.RefObject<SVGSVGElement | null>) {
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

/**
 * The brand mark with a life of its own (plan 4 §2.2, §7.2): an outline that draws before the
 * fill fades in, slow breathing with a swinging leaf while awake, a turn with the scroll speed
 * and one spin when its host link is hovered or focused (`data-mark-host` on the host).
 */
export function LivingMark({ drawOn = 'load', className }: LivingMarkProps) {
  const markRef = useRef<SVGSVGElement>(null)
  useAwakeWhileInView(markRef)
  useSharedBreath(markRef)
  const isSeen = useInView(markRef, { once: true, threshold: 0.5 })
  const isDrawing = drawOn === 'load' || isSeen

  return (
    <svg
      ref={markRef}
      className={className ? `${styles.root} ${className}` : styles.root}
      viewBox={appleMarkViewBox}
      aria-hidden="true"
      focusable="false"
      data-drawing={isDrawing ? '' : undefined}
    >
      <g className={styles.spin}>
        <g className={styles.fill}>
          <path d={appleBodyPath} fill="currentColor" />
          <path className={styles.leaf} d={appleLeafPath} fill="currentColor" />
        </g>
        <g className={styles.stroke}>
          <path d={appleBodyPath} pathLength={1} />
          <path d={appleLeafPath} pathLength={1} />
        </g>
      </g>
    </svg>
  )
}
