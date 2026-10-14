import { useRef, type MouseEventHandler } from 'react'
import { useAwakeWhileInView } from '@/hooks/useAmbientMotion'
import { useInView } from '@/hooks/useInView'
import { PressableInner } from './PressableInner'
import { useIdleNudge } from './useIdleNudge'
import styles from './Pressable.module.scss'

type PressableLinkProps = {
  href: string
  label: string
  size?: 'regular' | 'compact'
  hasSheen?: boolean
  hasNudges?: boolean
  hasBeam?: boolean
  className?: string | undefined
  onClick?: MouseEventHandler<HTMLAnchorElement> | undefined
  /** The reader is about to press: hover, focus or a touch. Used to fetch a lazy chunk early. */
  onIntent?: (() => void) | undefined
}

export function PressableLink({
  href,
  label,
  size = 'regular',
  hasSheen = false,
  hasNudges = false,
  hasBeam = false,
  className,
  onClick,
  onIntent,
}: PressableLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null)
  useAwakeWhileInView(linkRef)
  const isSeen = useInView(linkRef, { once: true, threshold: 1 })
  useIdleNudge(linkRef, hasNudges)

  return (
    <a
      ref={linkRef}
      className={[styles.root, size === 'compact' && styles.rootCompact, className]
        .filter(Boolean)
        .join(' ')}
      href={href}
      data-roll-host
      data-magnetic
      data-sheen={hasSheen && isSeen ? 'run' : undefined}
      onClick={onClick}
      onPointerEnter={onIntent}
      onFocus={onIntent}
      onTouchStart={onIntent}
    >
      <PressableInner label={label} hasBeam={hasBeam} />
    </a>
  )
}
