import { useEffect, type RefObject } from 'react'
import { write } from '@/hooks/frameLoop'

/**
 * The blueprint's hairlines (plan 8 §4): `vector-effect: non-scaling-stroke` broke the
 * `pathLength` draw in Chromium, so the stroke widths are user units divided by the drawing's
 * scale instead. Writes `--outline-scale` (the `meet` scale of the viewBox) on the `<svg>` once
 * per layout, from a ResizeObserver, never per frame.
 */
export function useOutlineScale(ref: RefObject<SVGSVGElement | null>, isActive: boolean) {
  useEffect(() => {
    const svg = ref.current
    if (!svg || !isActive) return
    const sizes = new ResizeObserver(([entry]) => {
      const box = svg.viewBox.baseVal
      if (!entry || !box || box.width === 0 || box.height === 0) return
      const { width, height } = entry.contentRect
      const scale = Math.min(width / box.width, height / box.height)
      if (scale <= 0) return
      write(() => svg.style.setProperty('--outline-scale', scale.toFixed(4)))
    })
    sizes.observe(svg)
    return () => sizes.disconnect()
  }, [ref, isActive])
}
