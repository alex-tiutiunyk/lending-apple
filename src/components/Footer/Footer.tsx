import { LivingMark } from '@/assets/svg/living-mark'
import { MotionToggle } from '@/components/MotionToggle/MotionToggle'
import { RollingText } from '@/components/RollingText/RollingText'
import { footerCopy, product } from '@/content/copy'
import { BackToTop } from './BackToTop'
import styles from './Footer.module.scss'

export function Footer() {
  return (
    <footer className={styles.root} data-pip-avoid>
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
