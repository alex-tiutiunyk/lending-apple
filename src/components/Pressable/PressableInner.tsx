import { RollingText } from '@/components/RollingText/RollingText'
import styles from './Pressable.module.scss'

type PressableInnerProps = {
  label: string
  hasBeam?: boolean
}

/** Rings, surface, accessible name and rolling letters shared by every primary button. */
export function PressableInner({ label, hasBeam = false }: PressableInnerProps) {
  return (
    <>
      <span className={styles.ring} aria-hidden="true" />
      <span className={styles.hoverRing} aria-hidden="true" />
      {hasBeam && <span className={styles.beam} aria-hidden="true" />}
      <span className={styles.body} data-magnetic-body>
        <span className={styles.surface} aria-hidden="true">
          <span className={styles.fill} />
          <span className={styles.sheen} />
        </span>
        <RollingText label={label} />
      </span>
    </>
  )
}
