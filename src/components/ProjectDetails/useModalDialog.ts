import { useCallback, useEffect, useRef } from 'react'

// The close fade is 160 ms; a hidden tab may never send `animationend`
const closeFallbackMs = 400

type ModalDialogOptions = {
  /** A new count opens the dialog. */
  openCount: number
  /** Gets focus back on close. */
  trigger: HTMLElement | null
  /** Called once the dialog has closed. */
  onClosed: () => void
}

/**
 * Opens and closes a native modal `<dialog>` (plan 10 §3): `showModal()` on a new open count,
 * focus on the title, the page under it held still through `data-details-open` on the root;
 * Escape, the close button and a backdrop click play the fade out where motion is allowed (the
 * stylesheet decides), then close and give focus back to the trigger.
 */
export function useModalDialog({ openCount, trigger, onClosed }: ModalDialogOptions) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const triggerRef = useRef(trigger)
  const onClosedRef = useRef(onClosed)

  useEffect(() => {
    triggerRef.current = trigger
    onClosedRef.current = onClosed
  }, [trigger, onClosed])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || openCount === 0 || dialog.open) return
    dialog.showModal()
    document.documentElement.dataset.detailsOpen = ''
    titleRef.current?.focus()
  }, [openCount])

  const requestClose = useCallback(() => {
    const dialog = dialogRef.current
    if (!dialog?.open || dialog.dataset.closing !== undefined) return
    dialog.dataset.closing = ''
    if (getComputedStyle(dialog).animationName === 'none') {
      dialog.close()
      return
    }
    const timer = window.setTimeout(() => dialog.close(), closeFallbackMs)
    dialog.addEventListener(
      'animationend',
      () => {
        window.clearTimeout(timer)
        dialog.close()
      },
      { once: true },
    )
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const onCancel = (event: Event) => {
      event.preventDefault()
      requestClose()
    }
    // A click on the backdrop reaches the dialog itself; the panel fills the rest of it
    const onClick = (event: MouseEvent) => {
      if (event.target === dialog) requestClose()
    }
    const onClose = () => {
      delete dialog.dataset.closing
      delete document.documentElement.dataset.detailsOpen
      onClosedRef.current()
      triggerRef.current?.focus()
    }
    dialog.addEventListener('cancel', onCancel)
    dialog.addEventListener('click', onClick)
    dialog.addEventListener('close', onClose)
    return () => {
      dialog.removeEventListener('cancel', onCancel)
      dialog.removeEventListener('click', onClick)
      dialog.removeEventListener('close', onClose)
    }
  }, [requestClose])

  return { dialogRef, titleRef, requestClose }
}
