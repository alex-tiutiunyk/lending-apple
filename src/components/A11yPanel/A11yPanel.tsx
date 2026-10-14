import { lazy, Suspense, useCallback, useId, useState, useSyncExternalStore } from 'react'
import { a11yCopy } from '@/content/copy'
import { useA11yPanel } from './useA11yPanel'
import styles from './A11yPanel.module.scss'

// The controls are code-split: most visits never open the panel
const A11yPanelBody = lazy(() => import('./A11yPanelBody'))

const a11yPanelId = 'a11y-panel'

function subscribeToNothing() {
  return () => undefined
}

/** Settings need JS, so the panel appears only after hydration (no empty button in the HTML). */
export function A11yPanel() {
  const isMounted = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  )
  return isMounted ? <PanelShell /> : null
}

function PanelShell() {
  const titleId = useId()
  const [message, setMessage] = useState('')
  // The same text twice would not change the live region, so a repeat gets a no-break space
  const announce = useCallback(
    (text: string) => setMessage((current) => (current === text ? `${text}\u00a0` : text)),
    [],
  )
  const { state, isWanted, focusRequest, rootRef, handleRef, rootProps, handleProps } =
    useA11yPanel()
  const isUsable = state === 'open'

  return (
    <div ref={rootRef} className={styles.root} data-state={state} data-pip-avoid {...rootProps}>
      <section
        id={a11yPanelId}
        className={styles.panel}
        aria-labelledby={titleId}
        inert={!isUsable}
      >
        <h2 id={titleId} className={styles.title}>
          {a11yCopy.title}
        </h2>
        {isWanted && (
          <Suspense fallback={null}>
            <A11yPanelBody focusRequest={focusRequest} announce={announce} />
          </Suspense>
        )}
      </section>
      <button
        ref={handleRef}
        type="button"
        className={styles.handle}
        aria-expanded={isUsable}
        aria-controls={a11yPanelId}
        {...handleProps}
      >
        <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="10.5" />
          <circle cx="12" cy="6.6" r="1.6" className={styles.iconFill} />
          <path d="M6.5 9.6 L12 10.6 L17.5 9.6 M12 10.6 V14 L9.4 18.6 M12 14 L14.6 18.6" />
        </svg>
        <span className={styles.label}>{a11yCopy.handle}</span>
      </button>
      <p className={styles.status} role="status">
        {message}
      </p>
    </div>
  )
}
