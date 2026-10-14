import type { MascotExpression } from './mascotActs'
import styles from './Mascot.module.scss'

type MascotFaceProps = {
  expression: MascotExpression
}

export function MascotFace({ expression }: MascotFaceProps) {
  switch (expression) {
    case 'wide':
      return (
        <g>
          <rect x={14} y={6} width={20} height={8.5} rx={4.25} className={styles.cutout} />
          <circle cx={20} cy={10.25} r={1.7} className={styles.eye} />
          <circle cx={28} cy={10.25} r={1.7} className={styles.eye} />
        </g>
      )
    case 'squint':
      return (
        <g>
          <rect x={17} y={7} width={14} height={6} rx={3} className={styles.cutout} />
          <path d="M19.6 10.2 h3 M25.4 10.2 h3" className={styles.eyeLine} />
        </g>
      )
    case 'talk':
      return (
        <g>
          <circle cx={20.5} cy={8} r={1.1} className={styles.eyeOnScreen} />
          <circle cx={27.5} cy={8} r={1.1} className={styles.eyeOnScreen} />
          <path
            d="M18 11 h12 q0 6 -6 6 q-6 0 -6 -6 z"
            className={`${styles.cutout} ${styles.mouth}`}
          />
        </g>
      )
    case 'dizzy':
      return (
        <g>
          <rect x={14} y={6} width={20} height={8.5} rx={4.25} className={styles.cutout} />
          <path
            d="M20 10.25 m-0.4 0 a0.4 0.4 0 1 1 0.8 0 a0.9 0.9 0 1 1 -1.8 0 a1.4 1.4 0 1 1 2.8 0 M28 10.25 m-0.4 0 a0.4 0.4 0 1 1 0.8 0 a0.9 0.9 0 1 1 -1.8 0 a1.4 1.4 0 1 1 2.8 0"
            className={styles.eyeLine}
          />
        </g>
      )
    case 'calm':
      return (
        <g>
          <rect x={17} y={7} width={14} height={6} rx={3} className={styles.cutout} />
          <circle cx={21.5} cy={10} r={1.1} className={styles.eye} />
          <circle cx={26.5} cy={10} r={1.1} className={styles.eye} />
        </g>
      )
  }
}
