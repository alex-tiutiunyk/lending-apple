import type { Finish } from '@/content/specs'

const accentProperties = ['--accent-h', '--accent-s', '--accent-l'] as const

/** Writes a finish's accent onto one element's style: the page on a pick, the render on a preview. */
export function writeAccent(style: CSSStyleDeclaration, { hue, saturation, lightness }: Finish) {
  style.setProperty('--accent-h', String(hue))
  style.setProperty('--accent-s', `${saturation}%`)
  style.setProperty('--accent-l', `${lightness}%`)
}

export function clearAccent(style: CSSStyleDeclaration) {
  accentProperties.forEach((property) => style.removeProperty(property))
}

export function applyFinishToPage(finish: Finish) {
  writeAccent(document.documentElement.style, finish)
}

export function swatchColor({ hue, saturation, lightness }: Finish) {
  return `hsl(${hue} ${saturation}% ${lightness}%)`
}

/** The option's own hue for its hover wash and ripple (plan 5 §10). */
export function optionStyle({ hue, saturation, lightness }: Finish) {
  return { '--option-h': hue, '--option-s': `${saturation}%`, '--option-l': `${lightness}%` }
}
