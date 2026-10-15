/**
 * Animations that may run on the main thread (plan 6 §13, rule 4). The trace names the target
 * element and the failure reasons, not the animation, so the allowlist speaks the same terms:
 *
 * - properties that never composite and are fine as one-shots or tints: stroke draws, colour
 *   transitions on a finish pick, the visibility step of the exploded parts;
 * - elements whose animations are bounded acts by design (Pip's face and acts, the mini Pips'
 *   kicks and high-fives on the finishes render, plan 7 §5);
 * - the transient "target not composited yet" reason on an HTML element or a root `<svg>`,
 *   which Chromium reports when an awake loop restarts and then composites a frame later.
 *
 * A transform or opacity loop on an SVG child shows "not composited" on a path, g, rect,
 * ellipse or circle and is never excused: that is the regression this list exists to catch.
 */
export const allowedMainThreadProperties = [
  'stroke-dashoffset',
  'color',
  'background-color',
  'border-color',
  'stop-color',
  'visibility',
  'd',
]

export const allowedTargets = ['mascot__', 'finishes-team__arm', 'hero-extras__line-light']

export const svgChildren = ['path', 'g', 'rect', 'ellipse', 'circle', 'line', 'polygon', 'text']

/** The reasons Chromium reports while a loop starts (target not composited yet, no visible change); seen on HTML spans as well as root svgs. */
export const transientReasons = (1 << 5) | (1 << 15) | (1 << 17) | (1 << 19)
