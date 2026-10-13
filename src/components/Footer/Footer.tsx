import { BrandMark } from '@/assets/svg/brand-mark'
import { footerCopy, product } from '@/content/copy'
import { MotionToggle } from '@/components/MotionToggle/MotionToggle'
import styles from './Footer.module.scss'

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.brand}>
          <BrandMark className={styles.mark} />
          {product.name}
        </p>
        <nav aria-label={footerCopy.linksLabel}>
          <ul className={styles.links}>
            {footerCopy.links.map(({ href, label }) => (
              <li key={href}>
                <a className={styles.link} href={href}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <MotionToggle className={styles.motion} />
        <p className={styles.legal}>{footerCopy.legal}</p>
        <p className={styles.credit}>{footerCopy.fontCredit}</p>
      </div>
    </footer>
  )
}
