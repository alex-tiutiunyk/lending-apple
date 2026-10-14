import { staticSceneScale } from './a11ySettings'
import { useA11ySettings } from './a11yStore'
import { useMediaQuery } from './useMediaQuery'

/** The OS setting alone, for the panel note and the disabled motion levels. */
export function useSystemReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

/** The OS asks for reduced motion, or the reader picked "Motion: off". */
export function useReducedMotion() {
  const isSystemReduced = useSystemReducedMotion()
  const { motion } = useA11ySettings()
  return isSystemReduced || motion === 'off'
}

/** Ambient motion stops: "calm" or "off". */
export function useMotionPaused() {
  return useA11ySettings().motion !== 'full'
}

/** Pinned scroll stages show their final state in normal flow (no motion, or large text). */
export function useStaticScenes() {
  const isReducedMotion = useReducedMotion()
  const { textScale } = useA11ySettings()
  return isReducedMotion || textScale >= staticSceneScale
}
