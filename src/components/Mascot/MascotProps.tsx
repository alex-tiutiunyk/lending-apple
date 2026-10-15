import { armActs, type MascotAct } from './mascotActs'
import styles from './MascotActs.module.scss'

const juggledScrews = [0, 1, 2]

/** Act-only art inside Pip's SVG: arms, juggled screws, cable, buzz lines, wings, polaroid. */
export function MascotProps({ act }: { act: MascotAct }) {
  return (
    <>
      {armActs.includes(act) && (
        <g className={styles.arms}>
          <path d="M7 36 q-7 4 -9 16" className={`${styles.arm} ${styles.armLeft}`} />
          <path d="M41 36 q7 4 9 16" className={`${styles.arm} ${styles.armRight}`} />
        </g>
      )}
      {act === 'throw' && (
        <g className={styles.slingshot}>
          <path d="M41 36 q6 2 8 -4" className={`${styles.arm} ${styles.armRight}`} />
          <path d="M49 34 V22 M49 26 L45 18 M49 26 L53 18" className={styles.slingFrame} />
          <path d="M45 18 Q49 28 53 18" className={styles.slingBand} />
        </g>
      )}
      {act === 'juggle' && (
        <g className={styles.juggle}>
          {juggledScrews.map((screw) => (
            <circle key={screw} cx={24} cy={-4} r={2.4} className={styles.screw} />
          ))}
        </g>
      )}
      {act === 'ring' && (
        <g className={styles.buzz}>
          <path d="M1 22 q-3 6 0 12 M-3 19 q-4 9 0 18" />
          <path d="M47 22 q3 6 0 12 M51 19 q4 9 0 18" />
        </g>
      )}
      {act === 'charge' && (
        <path d="M24 68 V84 q0 6 8 6 h40" pathLength={1} className={styles.cable} />
      )}
      {act === 'airplane' && (
        <g className={styles.wings}>
          <path d="M6 34 L-18 44 L6 46 Z" />
          <path d="M42 34 L66 44 L42 46 Z" />
        </g>
      )}
      {act === 'screenshot' && (
        <>
          <rect x={8.5} y={4.5} width={31} height={61} rx={7} className={styles.flash} />
          <g className={styles.polaroid}>
            <rect x={14} y={20} width={20} height={24} rx={1} className={styles.polaroidFrame} />
            <rect x={16} y={22} width={16} height={15} className={styles.polaroidPhoto} />
          </g>
        </>
      )}
    </>
  )
}
