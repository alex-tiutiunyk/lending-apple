/** Every driven animation is declared 1000 ms long in the fallback branch (`driven` mixin). */
const drivenScaleMs = 1000

export function supportsScrollTimeline() {
  return typeof CSS !== 'undefined' && CSS.supports('animation-timeline: scroll()')
}

/**
 * The JS stand-in for `animation-timeline` (plan 6 §3, §4): where the browser has no scroll
 * timelines, the same keyframes are declared as paused 1000 ms animations and a driver sets
 * their `currentTime` from a 0 … 1 progress. Each write restyles one element, never a stage.
 * Only paused CSS animations are driven, so one-shots and transitions inside the subtree are
 * left alone; `refresh` re-reads the list after a layout change or a mount.
 */
export function createAnimationDriver(element: Element, subtree = false) {
  let animations: Animation[] = []
  let written = -1

  return {
    refresh() {
      animations = element
        .getAnimations({ subtree })
        .filter(
          (animation) => animation instanceof CSSAnimation && animation.playState === 'paused',
        )
      written = -1
    },
    drive(progress: number) {
      const time = Math.round(Math.min(1, Math.max(0, progress)) * drivenScaleMs)
      if (time === written) return
      written = time
      animations.forEach((animation) => {
        animation.currentTime = time
      })
    },
    get size() {
      return animations.length
    },
  }
}
