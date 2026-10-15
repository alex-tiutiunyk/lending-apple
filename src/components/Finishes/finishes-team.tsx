import { useRef, type RefObject } from 'react'
import { appleBodyPath, appleLeafPath, appleMarkViewBox } from '@/assets/svg/apple-mark-path'
import { finishes } from '@/content/specs'
import { useAwakeWhileInView } from '@/hooks/useAmbientMotion'
import { useInView } from '@/hooks/useInView'
import { MiniPip } from './MiniPip'
import { useFootballGame } from './useFootballGame'
import styles from './FinishesTeam.module.scss'

type FinishesTeamProps = { render: RefObject<SVGSVGElement | null> }

/**
 * Four mini Pips play football with the logo on the back of the finishes render (plan 7 §5), a
 * lazy chunk loaded at `full`. An HTML sibling of the render inside its frame, `aria-hidden`:
 * the render keeps its own name, and the ball is the only thing that takes a press.
 */
export default function FinishesTeam({ render }: FinishesTeamProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const ballRef = useRef<HTMLSpanElement>(null)
  useAwakeWhileInView(rootRef)
  const isInView = useInView(rootRef)
  useFootballGame({ root: rootRef, render, ball: ballRef }, isInView)

  return (
    <div ref={rootRef} className={styles.root} aria-hidden="true">
      {finishes.map((finish) => (
        <MiniPip key={finish.id} finish={finish} />
      ))}
      <span ref={ballRef} className={styles.ball} hidden>
        <svg viewBox={appleMarkViewBox} focusable="false">
          <path d={appleBodyPath} />
          <path d={appleLeafPath} />
        </svg>
      </span>
    </div>
  )
}
