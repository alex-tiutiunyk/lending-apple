import type { CSSProperties } from 'react'
import type { Finish } from '@/content/specs'
import { swatchColor } from './finishStyle'
import styles from './FinishesTeam.module.scss'

const viewBox = '0 0 24 36'

/**
 * A mini Pip (plan 7 §5), a small rig because its legs run for a whole rally (plan 6 §7): an
 * HTML box with three `<svg>` roots in one 24 × 36 space, the body with its face and arms and
 * the two legs. The run cycle turns the leg roots; the kick, the high-five and the cheer are
 * one-shots. Coloured by its finish, set once.
 */
export function MiniPip({ finish }: { finish: Finish }) {
  const style = { '--pip-shell': swatchColor(finish) } as CSSProperties

  return (
    <span className={styles.pip} style={style} data-mini-pip data-finish={finish.id}>
      <span className={styles.hop}>
        <svg className={`${styles.piece} ${styles.legLeft}`} viewBox={viewBox} focusable="false">
          <path d="M9 26 V34" className={styles.limb} />
        </svg>
        <svg className={`${styles.piece} ${styles.legRight}`} viewBox={viewBox} focusable="false">
          <path d="M15 26 V34" className={styles.limb} />
        </svg>
        <svg className={`${styles.piece} ${styles.body}`} viewBox={viewBox} focusable="false">
          <path d="M4 14 L1 20" className={`${styles.limb} ${styles.arm}`} />
          <rect x={4} y={2} width={16} height={25} rx={4} className={styles.shell} />
          <rect x={6} y={4} width={12} height={21} rx={3} className={styles.screen} />
          <circle cx={10} cy={11} r={1.1} className={styles.eye} />
          <circle cx={14} cy={11} r={1.1} className={styles.eye} />
        </svg>
      </span>
    </span>
  )
}
