export type LinePoint = { x: number; y: number }
export type WordBox = { left: number; right: number; bottom: number }

const underlineGapPx = 6
const loopOutPx = 70

/**
 * The single line that leaves the phone (plan 5 §14): from the outline's start it loops out of
 * the phone, runs under the headline's last word right to left and ends with a small flourish.
 * All points are relative to the hero visual.
 */
export function heroLinePath(start: LinePoint, word: WordBox): string {
  const under = word.bottom + underlineGapPx
  const entry = { x: word.right + 28, y: under }
  // The loop leaves upward when the words are above the phone, sideways when beside it
  const isAbove = word.bottom < start.y - loopOutPx
  const control1 = isAbove
    ? { x: start.x - loopOutPx, y: start.y - loopOutPx }
    : { x: start.x - loopOutPx, y: start.y - loopOutPx * 0.4 }
  const control2 = { x: entry.x + loopOutPx, y: under + loopOutPx * 0.5 }
  const end = { x: word.left + 4, y: under }
  const flourish = [
    `C ${end.x - 14} ${under + 2}, ${end.x - 16} ${under + 14}, ${end.x - 2} ${under + 11}`,
    `C ${end.x + 8} ${under + 9}, ${end.x + 8} ${under + 4}, ${end.x + 2} ${under + 4}`,
  ].join(' ')
  return [
    `M ${start.x} ${start.y}`,
    `C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${entry.x} ${entry.y}`,
    `L ${end.x} ${end.y}`,
    flourish,
  ]
    .join(' ')
    .replace(/(\d)\.(\d)\d+/g, '$1.$2')
}
