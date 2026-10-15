import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { prefersSavedData } from '@/hooks/saveData'

/** closed: only the handle shows. open: a click or Enter on the handle opened it (plan 4 §0). */
export type PanelState = 'closed' | 'open'

export function useA11yPanel() {
  const [state, setState] = useState<PanelState>('closed')
  const [isWanted, setWanted] = useState(false)
  const [focusRequest, setFocusRequest] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<HTMLButtonElement>(null)

  const close = useCallback(() => {
    setState('closed')
    // Focus must not stay in the panel once it goes inert (Escape, or a tap outside on touch,
    // which does not move focus): it goes back to the handle
    const active = document.activeElement
    const isInside = !!active && !!rootRef.current?.contains(active) && active !== handleRef.current
    if (isInside) handleRef.current?.focus()
  }, [])

  useEffect(() => {
    if (state === 'closed') return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    const onPointerDown = (event: globalThis.PointerEvent) => {
      if (event.target instanceof Node && rootRef.current?.contains(event.target)) return
      close()
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [state, close])

  // The controls mount on idle after load, while the panel is still closed and inert (plan 7
  // §14): fetching the chunk early is not enough, a lazy component suspends on its first render
  // even when its chunk is in. A tap has no hover, so without this the first open showed only the
  // heading. With Save-Data on, only the gestures below fetch it.
  useEffect(() => {
    if (prefersSavedData()) return
    const want = () => setWanted(true)
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(want, { timeout: 2000 })
      return () => window.cancelIdleCallback(id)
    }
    const timer = window.setTimeout(want, 2000)
    return () => window.clearTimeout(timer)
  }, [])

  // Hover, focus and a press on the handle fetch the controls too, so a click opens a ready panel
  const rootProps = {
    onPointerEnter: (event: PointerEvent) => {
      if (event.pointerType === 'mouse') setWanted(true)
    },
  }

  const handleProps = {
    onFocus: () => setWanted(true),
    onPointerDown: () => setWanted(true),
    onClick: () => {
      setWanted(true)
      if (state === 'open') {
        close()
        return
      }
      setState('open')
      setFocusRequest((count) => count + 1)
    },
  }

  return { state, isWanted, focusRequest, rootRef, handleRef, rootProps, handleProps }
}
