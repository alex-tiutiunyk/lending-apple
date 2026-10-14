/**
 * Index of the nav target whose top has passed the band line last, or -1 above the first
 * target and once the end marker (the section after the last target) has reached the band.
 */
export function activeSection(targetTops: readonly number[], endTop: number, bandY: number) {
  if (endTop <= bandY) return -1
  let active = -1
  targetTops.forEach((top, index) => {
    if (top <= bandY) active = index
  })
  return active
}
