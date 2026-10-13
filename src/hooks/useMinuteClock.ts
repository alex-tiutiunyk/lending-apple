import { useSyncExternalStore } from 'react'

const minuteMs = 60_000

function subscribeToMinutes(onMinute: () => void) {
  let timer = 0

  const scheduleNext = () => {
    timer = window.setTimeout(
      () => {
        onMinute()
        scheduleNext()
      },
      minuteMs - (Date.now() % minuteMs),
    )
  }

  const resyncOnReturn = () => {
    if (document.hidden) return
    window.clearTimeout(timer)
    onMinute()
    scheduleNext()
  }

  scheduleNext()
  document.addEventListener('visibilitychange', resyncOnReturn)
  return () => {
    window.clearTimeout(timer)
    document.removeEventListener('visibilitychange', resyncOnReturn)
  }
}

function currentMinuteStart() {
  return Math.floor(Date.now() / minuteMs) * minuteMs
}

export function useMinuteClock() {
  return useSyncExternalStore(subscribeToMinutes, currentMinuteStart, () => null)
}
