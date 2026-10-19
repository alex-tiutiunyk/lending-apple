/** Breakpoints in rem, the same values as `_breakpoints.scss`. */
const layoutBreakpoints = { sm: 30, md: 48, lg: 64, xl: 90 } as const

/**
 * The JS twin of `bp.up()`: compares `body`, as wide as every page container (plan 11 §2), with a
 * rem breakpoint, so it follows the text size like the CSS container queries do.
 */
export function isLayoutAtLeast(name: keyof typeof layoutBreakpoints) {
  const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  return document.body.clientWidth >= layoutBreakpoints[name] * rootSize
}
