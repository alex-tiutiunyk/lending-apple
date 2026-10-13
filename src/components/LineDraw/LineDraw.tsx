import { useId, useRef } from 'react'
import { PhoneOutline } from '@/assets/svg/phone-outline'
import { PhoneRender } from '@/assets/svg/phone-render'
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
          <h2 id={titleId} className={styles.title}>
            {lineDrawCopy.title}
          </h2>
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
