import { useId, useRef } from 'react'
import { PhoneOutline } from '@/assets/svg/phone-outline'
import { PhoneRender } from '@/assets/svg/phone-render'
import { RevealText } from '@/components/RevealText/RevealText'
import { RevealTitle } from '@/components/RevealTitle/RevealTitle'
import { lineDrawCopy } from '@/content/copy'
import { useScrollProgress } from '@/hooks/useScrollProgress'
import styles from './LineDraw.module.scss'

export function LineDraw() {
  const titleId = useId()
  const sectionRef = useRef<HTMLElement>(null)
  useScrollProgress(sectionRef)

  return (
    <section
      ref={sectionRef}
      id="design"
      className={styles.root}
      aria-labelledby={titleId}
      data-pinned
    >
      <div className={styles.stage} data-stage>
        <div className={styles.copy}>
          <RevealTitle id={titleId} className={styles.title} text={lineDrawCopy.title} />
          <RevealText className={styles.body} isDelayed>
            {lineDrawCopy.body}
          </RevealText>
        </div>
        <div className={styles.visual} data-particles="compass">
          <PhoneOutline detail="blueprint" className={styles.outline} />
          <PhoneRender className={styles.render} label={lineDrawCopy.renderLabel} />
        </div>
      </div>
    </section>
  )
}
