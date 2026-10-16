import { useRef, type Ref } from 'react'
import { LivingMark } from '@/assets/svg/living-mark'
import { MotionToggle } from '@/components/MotionToggle/MotionToggle'
import { ProjectDetailsLink } from '@/components/ProjectDetails/ProjectDetailsLink'
import { RollingText } from '@/components/RollingText/RollingText'
import { footerCopy, product, projectDetailsCopy } from '@/content/copy'
import { useAwakeWhileInView } from '@/hooks/useAmbientMotion'
import { useScrollVelocity } from '@/hooks/useDocumentProgress'
import { BackToTop } from './BackToTop'
import styles from './Footer.module.scss'

type FooterEdgeProps = { ref: Ref<HTMLDivElement> }

/**
 * The footer's top edge as a line that moves (plan 5 §7, plan 6 §7): a wave that travels slowly
 * to the right and an accent pulse that runs along it now and then. HTML strips masked by the
 * wave tile, so the loops are composited transforms, only while the footer is awake at `full`;
 * otherwise the static wave. The ruffle with the scroll speed reads `--scroll-v` on the edge.
 */
function FooterEdge({ ref }: FooterEdgeProps) {
  return (
    <div ref={ref} className={styles.edge} aria-hidden="true">
      <div className={styles.edgeWave} />
      <div className={styles.edgePulse}>
        <div className={styles.edgePulseCounter}>
          <div className={styles.edgePulseWave} />
        </div>
      </div>
    </div>
  )
}

export function Footer() {
  const footerRef = useRef<HTMLElement>(null)
  const edgeRef = useRef<HTMLDivElement>(null)
  useAwakeWhileInView(footerRef)
  useScrollVelocity(edgeRef)

  return (
    <footer ref={footerRef} className={styles.root} data-pip-avoid>
      <FooterEdge ref={edgeRef} />
      <div className={styles.inner}>
        <p className={styles.brand} data-mark-host>
          <LivingMark drawOn="view" className={styles.mark} />
          {product.name}
        </p>
        <nav aria-label={footerCopy.linksLabel}>
          <ul className={styles.links}>
            {footerCopy.links.map(({ href, label, isFile }) => (
              <li key={href}>
                <a className={styles.link} href={href} data-roll-host>
                  <RollingText label={label} />
                  <span className={styles.arrow} aria-hidden="true">
                    {isFile ? footerCopy.fileArrow : footerCopy.arrow}
                  </span>
                </a>
              </li>
            ))}
            <li>
              <ProjectDetailsLink className={styles.link} data-roll-host>
                <RollingText label={projectDetailsCopy.label} />
                <span className={styles.arrow} aria-hidden="true">
                  {footerCopy.fileArrow}
                </span>
              </ProjectDetailsLink>
            </li>
          </ul>
        </nav>
        <div className={styles.actions}>
          <MotionToggle />
          <BackToTop />
        </div>
        <p className={styles.legal}>{footerCopy.legal}</p>
        <p className={styles.credit}>{footerCopy.fontCredit}</p>
      </div>
      {/* Where the dots gather into the rocket (plan 4 §7.3): a box, not the footer itself */}
      <div className={styles.rocket} data-particles="rocket" aria-hidden="true" />
    </footer>
  )
}
