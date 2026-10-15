import { useEffect, useRef, useState } from 'react'
import { subscribeTick } from './frameLoop'
import { useReducedMotion } from './useReducedMotion'

type CountUpOptions = {
  isRunning: boolean
  duration?: number
  delay?: number
  /** Each change runs the count again from zero (plan 5 §12: a hovered stat replays). */
  replay?: number
  /** The value on every frame of the count, for a direct DOM write; React sees only the end. */
  onFrame?: (value: number) => void
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3
}

/**
 * Counts from 0 to `target` on the frame loop (plan 6 §5): the frames go to `onFrame`, never
 * through state, and the hook returns 0 until the count ends, then `target`. Under reduced
 * motion it is `target` at once.
 */
export function useCountUp(
  target: number,
  { isRunning, duration = 1200, delay = 0, replay = 0, onFrame }: CountUpOptions,
) {
  const isReducedMotion = useReducedMotion()
  const [hasFinished, setHasFinished] = useState(false)
  const [seenReplay, setSeenReplay] = useState(replay)
  const frameCallback = useRef(onFrame)
  frameCallback.current = onFrame

  // A finished count never subscribes again, so a replay resets it during render
  if (replay !== seenReplay) {
    setSeenReplay(replay)
    setHasFinished(false)
  }

  useEffect(() => {
    if (!isRunning || isReducedMotion || hasFinished) return

    let startTime: number | null = null
    const unsubscribe = subscribeTick((time) => {
      startTime ??= time + delay
      const elapsed = Math.max(0, time - startTime)
      const linear = Math.min(1, elapsed / duration)
      if (linear === 1) {
        unsubscribe()
        setHasFinished(true)
        return
      }
      frameCallback.current?.(target * easeOutCubic(linear))
    })
    return unsubscribe
  }, [isRunning, isReducedMotion, hasFinished, target, duration, delay])

  if (isReducedMotion || hasFinished) return target
  return 0
}
