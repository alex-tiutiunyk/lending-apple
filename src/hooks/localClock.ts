/**
 * The visitor's own time and date for the phone screens (plan 7 §10). A 24-hour clock without a
 * leading zero on the hour ("19:42", "7:05"), so it reads like the fallback `lockScreenCopy.time`;
 * `Intl` alone prints "07:05" in `en-US` with `h23`, so the hour is taken from the parts. The date
 * is short English ("Thu, Oct 15"), like the rest of the page.
 */
export type LocalClock = { time: string; date: string }

type Formatters = { time: Intl.DateTimeFormat; date: Intl.DateTimeFormat }

// Cached per zone and made on first use: a formatter keeps the zone it was created in
const formatters = new Map<string, Formatters>()

function formattersFor(timeZone: string | undefined) {
  const key = timeZone ?? ''
  let cached = formatters.get(key)
  if (!cached) {
    const zone = timeZone === undefined ? {} : { timeZone }
    cached = {
      time: new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hourCycle: 'h23',
        ...zone,
      }),
      date: new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        ...zone,
      }),
    }
    formatters.set(key, cached)
  }
  return cached
}

/** `timeZone` is left out on the page (the browser's zone); tests pass one. */
export function formatLocalClock(instant: number, timeZone?: string): LocalClock {
  const { time, date } = formattersFor(timeZone)
  const parts = time.formatToParts(instant)
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0)
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00'
  return { time: `${hour % 24}:${minute}`, date: date.format(instant) }
}
