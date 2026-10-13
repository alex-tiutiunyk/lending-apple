import { BrandMark } from '@/assets/svg/brand-mark'
import { headerCopy, navigation, product } from '@/content/copy'
import { MotionToggle } from '@/components/MotionToggle/MotionToggle'
import styles from './Header.module.scss'

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <a className={styles.home} href="#top">
          <BrandMark className={styles.mark} />
          <span>{product.name}</span>
        </a>
        <nav className={styles.nav} aria-label={headerCopy.navLabel}>
          <ul className={styles.links}>
            {navigation.map(({ href, label }) => (
              <li key={href}>
                <a className={styles.link} href={href}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <MotionToggle isCompact className={styles.motion} />
        <a className={styles.reserve} href="#reserve">
          {headerCopy.reserve}
        </a>
      </div>
    </header>
  )
}
