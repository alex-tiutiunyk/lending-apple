import { useId, useRef } from 'react'
import { PhoneOutline } from '@/assets/svg/phone-outline'
import { PhoneRender } from '@/assets/svg/phone-render'
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
      className={styles.section}
      aria-labelledby={titleId}
      data-pinned
    >
      <div className={styles.stage} data-stage>
        <div className={styles.copy}>
          <RevealTitle id={titleId} className={styles.title} text={lineDrawCopy.title} />
          <p className={styles.body}>{lineDrawCopy.body}</p>
        </div>
        <div className={styles.visual} data-particles="compass">
          <PhoneOutline className={styles.outline} />
          <PhoneRender className={styles.render} label={lineDrawCopy.renderLabel} />
        </div>
      </div>
    </section>
  )
}
