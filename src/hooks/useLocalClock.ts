import { formatLocalClock } from './localClock'
import { useMinuteClock } from './useMinuteClock'

/**
 * The visitor's local time and date, renewed every minute (plan 7 §10). Null in the prerender and
 * before hydration, where the phones show the `lockScreenCopy` strings.
 */
export function useLocalClock() {
  const minute = useMinuteClock()
  return minute === null ? null : formatLocalClock(minute)
}
