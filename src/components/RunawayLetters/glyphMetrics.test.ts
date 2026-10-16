import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// A canvas stub: "a" has no descender (its ink ends on the baseline), "g" reaches most of the
// descent; the font only takes strings that name a px size, like a real canvas
const descents: Record<string, number> = { a: 0, g: 3.6 }
let hasFontBox = true

function stubCanvas() {
  let font = '10px sans-serif'
  const context = {
    get font() {
      return font
    },
    set font(next: string) {
      if (/\d+px/.test(next)) font = next
    },
    measureText: vi.fn((char: string) => ({
      actualBoundingBoxDescent: descents[char] ?? 0,
      ...(hasFontBox ? { fontBoundingBoxDescent: 4 } : {}),
    })),
  }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    context as unknown as CanvasRenderingContext2D,
  )
  return context
}

describe('glyph ink lift (plan 8 §2)', () => {
  beforeEach(() => {
    vi.resetModules()
    hasFontBox = true
  })
  afterEach(() => vi.restoreAllMocks())

  it('lifts a letter without a descender more than one with', async () => {
    stubCanvas()
    const { inkLift } = await import('./glyphMetrics')
    const a = inkLift('400 16px Inter', 'a') ?? 0
    const g = inkLift('400 16px Inter', 'g') ?? 0
    expect(a).toBe(4)
    expect(g).toBeCloseTo(0.4)
    expect(a).toBeGreaterThan(g)
  })

  it('measures each font and character once', async () => {
    const context = stubCanvas()
    const { inkLift } = await import('./glyphMetrics')
    inkLift('400 16px Inter', 'a')
    inkLift('400 16px Inter', 'a')
    expect(context.measureText).toHaveBeenCalledTimes(1)
    inkLift('400 20px Inter', 'a')
    expect(context.measureText).toHaveBeenCalledTimes(2)
  })

  it('takes a font whose size the canvas gives back a float step off (WebKit)', async () => {
    const context = stubCanvas()
    let stored = ''
    Object.defineProperty(context, 'font', {
      get: () => stored,
      set: (next: string) => (stored = next.replace('45.123456px', '45.123455px')),
    })
    const { inkLift } = await import('./glyphMetrics')
    expect(inkLift('normal 640 45.123456px Bricolage', 'a')).toBe(4)
  })

  it('falls back without a font bounding box or with a font the canvas did not take', async () => {
    hasFontBox = false
    stubCanvas()
    const { inkLift } = await import('./glyphMetrics')
    expect(inkLift('400 16px Inter', 'a')).toBeNull()
    hasFontBox = true
    expect(inkLift('', 'a')).toBeNull()
    expect(inkLift('bold large serif', 'a')).toBeNull()
  })
})
