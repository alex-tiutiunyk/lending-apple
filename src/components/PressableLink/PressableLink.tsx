import { useRef } from 'react'
import { useAwakeWhileInView } from '@/hooks/useAmbientMotion'
import { useInView } from '@/hooks/useInView'
import styles from './PressableLink.module.scss'

type PressableLinkProps = {
  href: string
  label: string
  size?: 'regular' | 'compact'
  hasSheen?: boolean
  className?: string | undefined
}

export function PressableLink({
  href,
  label,
  size = 'regular',
  hasSheen = false,
  className,
}: PressableLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null)
  useAwakeWhileInView(linkRef)
  const isSeen = useInView(linkRef, { once: true, threshold: 1 })
  const letters = Array.from(label, (character, position) => ({
    character: character === ' ' ? ' ' : character,
    position,
  }))

  return (
    <a
      ref={linkRef}
      className={[styles.button, styles[size], className].filter(Boolean).join(' ')}
      href={href}
      data-magnetic
      data-sheen={hasSheen && isSeen ? 'run' : undefined}
    >
      <span className={styles.ring} aria-hidden="true" />
      <span className={styles.hoverRing} aria-hidden="true" />
      <span className={styles.body}>
        <span className={styles.surface} aria-hidden="true">
          <span className={styles.fill} />
          <span className={styles.sheen} />
        </span>
        <span className={styles.name}>{label}</span>
        <span className={styles.letters} aria-hidden="true">
          {letters.map(({ character, position }) => (
            <span key={`${position}:${character}`} className={styles.letter}>
              <span className={styles.strip}>
                <span>{character}</span>
                <span>{character}</span>
              </span>
            </span>
          ))}
        </span>
      </span>
    </a>
  )
}
