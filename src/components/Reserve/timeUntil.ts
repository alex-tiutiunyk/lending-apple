const minuteMs = 60_000
const hourMs = 60 * minuteMs
const dayMs = 24 * hourMs

export function timeUntil(targetMs: number, nowMs: number) {
  const remaining = Math.max(0, targetMs - nowMs)
  const roundedUp = Math.ceil(remaining / minuteMs) * minuteMs
  return {
    hasArrived: remaining === 0,
    days: Math.floor(roundedUp / dayMs),
    hours: Math.floor((roundedUp % dayMs) / hourMs),
    minutes: Math.floor((roundedUp % hourMs) / minuteMs),
  }
}
