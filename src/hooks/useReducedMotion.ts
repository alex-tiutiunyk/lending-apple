import { effectiveMotion, reducedMotionQuery, staticSceneScale } from './a11ySettings'
import { useA11ySettings } from './a11yStore'
import { useMediaQuery } from './useMediaQuery'

/** The OS setting alone, for the panel note and the override. */
export function useSystemReducedMotion() {
  return useMediaQuery(reducedMotionQuery)
}

/** The level the page runs at: the OS setting wins unless the reader overrode it. */
export function useMotionLevel() {
  return effectiveMotion(useA11ySettings(), useSystemReducedMotion())
}

/** The OS asks for reduced motion (not overridden), or the reader picked "Motion: off". */
export function useReducedMotion() {
  return useMotionLevel() === 'off'
}

/** Ambient motion stops: "calm" or "off". */
export function useMotionPaused() {
  return useMotionLevel() !== 'full'
}

/** Pinned scroll stages show their final state in normal flow (no motion, or large text). */
export function useStaticScenes() {
  const isReducedMotion = useReducedMotion()
  const { textScale } = useA11ySettings()
  return isReducedMotion || textScale >= staticSceneScale
}
