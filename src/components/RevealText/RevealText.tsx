import { useRef, type ReactNode } from 'react'
import { useReveal } from '@/hooks/useReveal'
import styles from './RevealText.module.scss'

type RevealTextProps = {
  className?: string | undefined
  isDelayed?: boolean
  children: ReactNode
}

/** A paragraph that rises in on scroll, one stagger step after the title when delayed. */
export function RevealText({ className, isDelayed = false, children }: RevealTextProps) {
  const textRef = useRef<HTMLParagraphElement>(null)
  useReveal(textRef)

  return (
    <p
      ref={textRef}
      className={[styles.root, isDelayed && styles.rootDelayed, className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </p>
  )
}
