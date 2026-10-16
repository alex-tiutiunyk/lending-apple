/**
 * How far above the bottom of its box a glyph's ink ends (plan 8 §2): the copy of an escaped
 * letter is as tall as the font's content area, so for a letter without a descender its legs
 * would hang a descent below the ink. Measured once per font and character on one canvas,
 * never per frame. `null` when the engine cannot tell (no font bounding box, or a font string
 * the canvas did not take): the stylesheet's fallback lift applies then.
 */
const cache = new Map<string, number | null>()
let context: CanvasRenderingContext2D | null | undefined

function canvasContext() {
  if (context === undefined) context = document.createElement('canvas').getContext('2d')
  return context
}

/**
 * The font size in px from a font shorthand, to check that the canvas took it. Compared as a
 * number: WebKit stores the size as a float and gives back 45.123455px for 45.123456px.
 */
const sizeOf = (font: string) => Number(/(\d+(?:\.\d+)?)px/.exec(font)?.[1] ?? NaN)
const isSameSize = (a: string, b: string) => Math.abs(sizeOf(a) - sizeOf(b)) < 0.01

export function inkLift(font: string, char: string): number | null {
  const key = `${font}|${char}`
  const cached = cache.get(key)
  if (cached !== undefined) return cached
  const lift = measure(font, char)
  cache.set(key, lift)
  return lift
}

function measure(font: string, char: string) {
  const ctx = canvasContext()
  if (!ctx || !font || !char.trim()) return null
  ctx.font = font
  // A canvas ignores a font string it cannot parse and keeps its previous one
  if (!isSameSize(ctx.font, font)) return null
  const metrics = ctx.measureText(char)
  if (typeof metrics.fontBoundingBoxDescent !== 'number') return null
  return Math.max(0, metrics.fontBoundingBoxDescent - metrics.actualBoundingBoxDescent)
}
