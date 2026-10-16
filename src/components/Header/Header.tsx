import { useEffect, useRef } from 'react'
import { LivingMark } from '@/assets/svg/living-mark'
import { MotionToggle } from '@/components/MotionToggle/MotionToggle'
import { PressableLink } from '@/components/Pressable/PressableLink'
import { headerCopy, product } from '@/content/copy'
import { mascotRequests } from '@/hooks/mascotRequests'
import { useAwakeWhileInView } from '@/hooks/useAmbientMotion'
import { useScrollVelocity } from '@/hooks/useDocumentProgress'
import { LinePulse } from '@/components/BorderPulse/BorderPulse'
import { SectionLabel } from './SectionLabel'
import { SectionNav } from './SectionNav'
import { navTargetIds, useScrollSpy } from './useScrollSpy'
import styles from './Header.module.scss'

export function Header() {
  // One source for the nav indicator and the section label, so they never disagree (plan 4 §2.3)
  const { active, hold } = useScrollSpy(navTargetIds, 'reserve')
  // The header is always in view, so its awake attribute is set once and stays: the mesh, the
  // edge pulse (plan 7 §6, §11) and the tip's glow, which follows the scroll speed through the
  // scroll bus (plan 6 §3.2), all run under it
  const rootRef = useRef<HTMLElement>(null)
  const tipRef = useRef<HTMLSpanElement>(null)
  useAwakeWhileInView(rootRef)
  useScrollVelocity(tipRef)

  // Pip sometimes glances up when the label changes (plan 4 §2.4)
  useEffect(() => {
    if (active >= 0) mascotRequests.request({ type: 'glance' })
  }, [active])

  return (
    <header ref={rootRef} className={styles.root}>
      <span className={styles.mesh} aria-hidden="true">
        <span className={styles.blob} />
        <span className={styles.blob} />
        <span className={styles.blob} />
        <span className={styles.blob} />
      </span>
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
      <LinePulse side="bottom" seed={0.4} />
      <span className={styles.progress} aria-hidden="true">
        <span className={styles.progressLine} data-doc-p />
        <span ref={tipRef} className={styles.progressTip} data-doc-p />
      </span>
    </header>
  )
}
