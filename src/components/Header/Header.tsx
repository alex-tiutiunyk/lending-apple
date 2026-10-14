import { useEffect } from 'react'
import { LivingMark } from '@/assets/svg/living-mark'
import { MotionToggle } from '@/components/MotionToggle/MotionToggle'
import { PressableLink } from '@/components/Pressable/PressableLink'
import { headerCopy, product } from '@/content/copy'
import { mascotRequests } from '@/hooks/mascotRequests'
import { SectionLabel } from './SectionLabel'
import { SectionNav } from './SectionNav'
import { navTargetIds, useScrollSpy } from './useScrollSpy'
import styles from './Header.module.scss'

export function Header() {
  // One source for the nav indicator and the section label, so they never disagree (plan 4 §2.3)
  const { active, hold } = useScrollSpy(navTargetIds, 'reserve')

  // Pip sometimes glances up when the label changes (plan 4 §2.4)
  useEffect(() => {
    if (active >= 0) mascotRequests.request({ type: 'glance' })
  }, [active])

  return (
    <header className={styles.root}>
      <div className={styles.bar}>
        <a className={styles.home} href="#top" data-mark-host data-home-link>
          <LivingMark className={styles.mark} />
          <span className={styles.name}>{product.name}</span>
        </a>
        <SectionLabel active={active} />
        <SectionNav active={active} hold={hold} />
        <MotionToggle isCompact className={styles.motion} />
        <PressableLink
          href="#reserve"
          label={headerCopy.reserve}
          size="compact"
          className={styles.reserve}
        />
      </div>
      <span className={styles.progress} aria-hidden="true">
        <span className={styles.progressLine} />
        <span className={styles.progressTip} />
      </span>
    </header>
  )
}
