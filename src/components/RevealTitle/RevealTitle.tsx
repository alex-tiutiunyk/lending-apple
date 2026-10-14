import { useRef } from 'react'
import { useReveal } from '@/hooks/useReveal'
import { SplitWords } from './SplitWords'
import styles from './RevealTitle.module.scss'

type RevealTitleProps = {
  id: string
  text: string
  className?: string | undefined
}

export function RevealTitle({ id, text, className }: RevealTitleProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  useReveal(titleRef)

  return (
    <h2 ref={titleRef} id={id} className={[styles.root, className].filter(Boolean).join(' ')}>
      <SplitWords text={text} wordClassName={styles.word} />
    </h2>
  )
}
