import { useCallback, useId, useRef, useState } from 'react'
import { detailsDialogCopy, detailsLanguageNames } from '@/content/projectDetailsCopy'
import {
  detailsLanguages,
  detailsReadmeUrl,
  type DetailsLanguage,
} from '@/content/projectDetailsTree'
import { DetailsText } from './DetailsText'
import { useModalDialog } from './useModalDialog'
import { prefetchDetailsText, useDetailsText } from './useDetailsText'
import styles from './ProjectDetailsDialog.module.scss'

type ProjectDetailsDialogProps = {
  openCount: number
  trigger: HTMLElement | null
}

/**
 * The project details lightbox (plan 10 §3, §4): the README's tech stack and what was built,
 * in English on every open, Ukrainian on request. The content carries its own `lang`.
 */
export default function ProjectDetailsDialog({ openCount, trigger }: ProjectDetailsDialogProps) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const [language, setLanguage] = useState<DetailsLanguage>('en')
  const [message, setMessage] = useState('')
  const text = useDetailsText(language)
  const copy = detailsDialogCopy[language]
  const onClosed = useCallback(() => {
    setLanguage('en')
    setMessage('')
  }, [])
  const { dialogRef, titleRef, requestClose } = useModalDialog({ openCount, trigger, onClosed })

  const choose = (next: DetailsLanguage) => {
    if (next === language) return
    setLanguage(next)
    setMessage(detailsDialogCopy[next].switched)
    bodyRef.current?.scrollTo({ top: 0 })
  }

  return (
    <dialog ref={dialogRef} className={styles.root} aria-labelledby={titleId} data-letters="still">
      <div className={styles.panel} lang={language}>
        <div className={styles.head}>
          <h2 id={titleId} ref={titleRef} className={styles.title} tabIndex={-1}>
            {copy.title}
          </h2>
          <div className={styles.languages} role="group" aria-label={copy.languages}>
            {detailsLanguages.map((option) => (
              <button
                key={option}
                type="button"
                className={styles.language}
                lang={option}
                aria-pressed={option === language}
                onClick={() => choose(option)}
                onFocus={() => prefetchDetailsText(option)}
                onPointerEnter={() => prefetchDetailsText(option)}
              >
                {detailsLanguageNames[option]}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={styles.close}
            aria-label={copy.close}
            onClick={requestClose}
          >
            <svg className={styles.closeIcon} viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div
          ref={bodyRef}
          className={styles.body}
          role="region"
          aria-labelledby={titleId}
          aria-busy={text === null || undefined}
          // A scrolling region with few links: the keyboard must reach it to scroll (axe
          // scrollable-region-focusable)
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
        >
          {text === null && <p className={styles.loading}>{copy.loading}</p>}
          {text === 'failed' && (
            <p>
              <a className={styles.link} href={detailsReadmeUrl} target="_blank" rel="noopener">
                README.md
              </a>
            </p>
          )}
          {Array.isArray(text) && <DetailsText blocks={text} />}
        </div>
        <p className={styles.status} role="status">
          {message}
        </p>
      </div>
    </dialog>
  )
}
