import { useRef } from 'react'
import { useAwakeWhileInView } from '@/hooks/useAmbientMotion'
import { PressableInner } from './PressableInner'
import styles from './Pressable.module.scss'

type PressableButtonProps = {
  label: string
  busyLabel: string
  isBusy?: boolean
  type?: 'submit' | 'button'
  className?: string | undefined
}

export function PressableButton({
  label,
  busyLabel,
  isBusy = false,
  type = 'submit',
  className,
}: PressableButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  useAwakeWhileInView(buttonRef)

  return (
    <button
      ref={buttonRef}
      type={type}
      className={[styles.root, styles.rootButton, className].filter(Boolean).join(' ')}
      disabled={isBusy}
      data-roll-host
      data-magnetic={isBusy ? undefined : ''}
      data-busy={isBusy ? '' : undefined}
    >
      <PressableInner label={isBusy ? busyLabel : label} />
    </button>
  )
}
