import { useEffect, useState } from 'react'
import { subscribeTick } from './frameLoop'
import { useReducedMotion } from './useReducedMotion'

type CountUpOptions = {
  isRunning: boolean
  duration?: number
  delay?: number
}

export function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3
}

export function useCountUp(
  target: number,
  { isRunning, duration = 1200, delay = 0 }: CountUpOptions,
) {
  const isReducedMotion = useReducedMotion()
  const [animatedValue, setAnimatedValue] = useState(0)
  const [hasFinished, setHasFinished] = useState(false)

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
      setAnimatedValue(target * easeOutCubic(linear))
    })
    return unsubscribe
  }, [isRunning, isReducedMotion, hasFinished, target, duration, delay])

  if (isReducedMotion || hasFinished) return target
  return animatedValue
}
