import { lazy, Suspense, useCallback, useId, useState, useSyncExternalStore } from 'react'
import { a11yCopy } from '@/content/copy'
import { A11yHandleIcon } from './A11yHandleIcon'
import { PanelSpinner } from './PanelSpinner'
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
  const [isWaiting, setWaiting] = useState(false)
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
        aria-busy={isWaiting || undefined}
        data-waiting={isWaiting ? '' : undefined}
        inert={!isUsable}
      >
        <h2 id={titleId} className={styles.title}>
          {a11yCopy.title}
        </h2>
        {isWanted && (
          <Suspense fallback={<PanelSpinner onWaiting={setWaiting} />}>
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
        <A11yHandleIcon />
        <span className={styles.label}>{a11yCopy.handle}</span>
      </button>
      <p className={styles.status} role="status">
        {message}
      </p>
    </div>
  )
}
