const shortestFlightMs = 900
const longestFlightMs = 1400
const pxPerExtraMs = 16

/** Longer pages get a slightly longer flight, between 0.9 and 1.4 s. */
export function flightDurationMs(distancePx: number) {
  return Math.min(longestFlightMs, shortestFlightMs + Math.max(0, distancePx) / pxPerExtraMs)
}

export function easeInOutCubic(share: number) {
  return share < 0.5 ? 4 * share * share * share : 1 - (-2 * share + 2) ** 3 / 2
}

/** After the jump to the top, keyboard and screen reader users continue from the home link. */
export function focusHomeLink() {
  document.querySelector<HTMLElement>('[data-home-link]')?.focus({ preventScroll: true })
}
