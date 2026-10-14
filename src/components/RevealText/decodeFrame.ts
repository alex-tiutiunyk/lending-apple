const glyphs = '#%&*+=<>/01'
export const decodeMs = 500
const firstSettleMs = 120

/** Text shown `elapsed` ms into the decode: characters settle left to right, the rest cycle. */
export function decodeFrame(
  text: string,
  elapsed: number,
  random: () => number,
  durationMs = decodeMs,
) {
  const settleStep = (durationMs - firstSettleMs) / Math.max(1, text.length)
  return Array.from(text, (character, index) => {
    if (character === ' ' || elapsed >= firstSettleMs + settleStep * index) return character
    return glyphs[Math.floor(random() * glyphs.length)] ?? character
  }).join('')
}
