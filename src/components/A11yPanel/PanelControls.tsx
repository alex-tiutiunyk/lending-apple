import { useId } from 'react'
import { a11yCopy } from '@/content/copy'
import { BorderPulse } from '@/components/BorderPulse/BorderPulse'
import styles from './A11yPanel.module.scss'

type SegmentedOption<T extends string> = {
  value: T
  label: string
  isDisabled: boolean
}

type SegmentedProps<T extends string> = {
  legend: string
  name: string
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  note: string | null
}

/** Native radios drawn as a segmented control. */
export function Segmented<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  note,
}: SegmentedProps<T>) {
  const noteId = useId()

  return (
    <fieldset className={styles.group} aria-describedby={note ? noteId : undefined}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.segmented}>
        <BorderPulse seed={0.5} />
        {options.map((option) => (
          <label key={option.value} className={styles.segment}>
            <input
              type="radio"
              className={styles.segmentInput}
              name={name}
              value={option.value}
              checked={option.value === value}
              disabled={option.isDisabled}
              onChange={() => onChange(option.value)}
            />
            <span className={styles.segmentLabel} data-calm-fade>
              {option.label}
            </span>
          </label>
        ))}
      </div>
      {note && (
        <p id={noteId} className={styles.note}>
          {note}
        </p>
      )}
    </fieldset>
  )
}

type ChoiceProps = {
  label: string
  isOn: boolean
  onChange: (isOn: boolean) => void
}

/** A native checkbox drawn as a switch. */
export function Choice({ label, isOn, onChange }: ChoiceProps) {
  return (
    <label className={styles.choice}>
      <input
        type="checkbox"
        className={styles.switchInput}
        checked={isOn}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
      <span className={styles.switch} aria-hidden="true" data-calm-fade>
        <BorderPulse seed={0.8} />
      </span>
      <span>{label}</span>
    </label>
  )
}

type TextSizeProps = {
  scale: number
  canShrink: boolean
  canGrow: boolean
  onStep: (direction: -1 | 1) => void
}

/** A− and A+ around the current scale; the visible letters stay part of each button's name. */
export function TextSize({ scale, canShrink, canGrow, onStep }: TextSizeProps) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{a11yCopy.text.legend}</legend>
      <div className={styles.stepper}>
        <button
          type="button"
          className={styles.step}
          disabled={!canShrink}
          onClick={() => onStep(-1)}
        >
          A−<span className={styles.hidden}>, {a11yCopy.text.smaller}</span>
        </button>
        {/* aria-live off: the panel's own live region already announces the change */}
        <output className={styles.scale} aria-live="off">
          {scale} %
        </output>
        <button type="button" className={styles.step} disabled={!canGrow} onClick={() => onStep(1)}>
          A+<span className={styles.hidden}>, {a11yCopy.text.larger}</span>
        </button>
      </div>
    </fieldset>
  )
}
