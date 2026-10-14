import { useEffect, useRef } from 'react'
import { SplitWords } from '@/components/RevealTitle/SplitWords'
import { useViewProgress } from '@/hooks/useViewProgress'
import styles from './RevealText.module.scss'

type ScrubTextProps = {
  text: string
  className?: string | undefined
}

/** A sentence that lights up word by word with scroll, forwards and backwards. */
export function ScrubText({ text, className }: ScrubTextProps) {
  const textRef = useRef<HTMLParagraphElement>(null)
  useViewProgress(textRef)

  useEffect(() => {
    textRef.current?.style.setProperty('--words', String(text.split(' ').length))
  }, [text])

  return (
    <p ref={textRef} className={className} data-letters="still">
      <SplitWords text={text} wordClassName={styles.scrubWord} />
    </p>
  )
}
