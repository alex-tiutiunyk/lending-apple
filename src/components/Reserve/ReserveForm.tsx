import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { PressableButton } from '@/components/Pressable/PressableButton'
import { reserveCopy } from '@/content/copy'
import { BorderPulse } from '@/components/BorderPulse/BorderPulse'
import { EmailBugs, type BugState } from './EmailBugs'
import styles from './Reserve.module.scss'

type FormStatus = 'editing' | 'submitting' | 'reserved'

const simulatedLatencyMs = 650

function confirmReservation() {
  return new Promise<void>((resolve) => window.setTimeout(resolve, simulatedLatencyMs))
}

function emailProblem(input: HTMLInputElement) {
  if (input.validity.valueMissing) return reserveCopy.missingEmail
  if (!input.validity.valid) return reserveCopy.invalidEmail
  return null
}

type ReserveFormProps = {
  onReserved: () => void
}

export function ReserveForm({ onReserved }: ReserveFormProps) {
  const [status, setStatus] = useState<FormStatus>('editing')
  const [error, setError] = useState<string | null>(null)
  const [field, setField] = useState({ isFocused: false, isEmpty: true, hasFled: false })
  const emailRef = useRef<HTMLInputElement>(null)
  const successRef = useRef<HTMLDivElement>(null)
  const fieldId = useId()
  const emailId = `${fieldId}-email`
  const errorId = `${fieldId}-error`
  const noteId = `${fieldId}-note`

  useEffect(() => {
    if (status === 'reserved') successRef.current?.focus()
  }, [status])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const input = emailRef.current
    if (!input || status !== 'editing') return

    const problem = emailProblem(input)
    setError(problem)
    if (problem) {
      input.focus()
      return
    }

    setStatus('submitting')
    await confirmReservation()
    setStatus('reserved')
    onReserved()
  }

  if (status === 'reserved') {
    return (
      <div ref={successRef} className={styles.success} tabIndex={-1} role="status">
        <p className={styles.successTitle}>{reserveCopy.successTitle}</p>
        <p>{reserveCopy.successBody}</p>
      </div>
    )
  }

  const isSubmitting = status === 'submitting'
  const bugState: BugState = error
    ? 'error'
    : field.isFocused || !field.isEmpty
      ? 'away'
      : field.hasFled
        ? 'return'
        : 'rest'

  return (
    <form
      className={styles.form}
      data-pip-avoid
      noValidate
      onSubmit={submit}
      aria-busy={isSubmitting}
    >
      <label className={styles.fieldLabel} htmlFor={emailId}>
        {reserveCopy.emailLabel}
      </label>
      <div className={styles.fieldRow}>
        <span className={styles.field}>
          <input
            ref={emailRef}
            id={emailId}
            className={styles.input}
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            required
            readOnly={isSubmitting}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${errorId} ${noteId}` : noteId}
            onInput={(event) => {
              setError(null)
              const isEmpty = event.currentTarget.value === ''
              setField((current) => ({ ...current, isEmpty }))
            }}
            onFocus={() => setField((current) => ({ ...current, isFocused: true, hasFled: true }))}
            onBlur={() => setField((current) => ({ ...current, isFocused: false }))}
          />
          <EmailBugs state={bugState} />
          <BorderPulse seed={0.7} />
        </span>
        <PressableButton
          className={styles.submit}
          label={reserveCopy.submit}
          busyLabel={reserveCopy.submitting}
          isBusy={isSubmitting}
        />
      </div>
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
      <p id={noteId} className={styles.note}>
        {reserveCopy.privacyNote}
      </p>
    </form>
  )
}
