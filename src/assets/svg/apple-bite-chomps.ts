/**
 * The worm's bite (plan 8 §7, at the user's request; plan 7 §4 kept it ragged for the trademark
 * risk): five chomps along the right edge that end in one round notch, r 4.2 at (21.6, 10.4).
 * The first three cut a ragged notch top to bottom, the fourth widens it, the fifth rounds it
 * off; every circle lies inside the last one, so the end shape is the clean round bite.
 *
 * Plan 9 §1: the last circle is the bite the mark has at rest, cut into `appleBodyPath`; the
 * unit test checks the path's split points lie on it.
 */
export const chomps = [
  { cx: 20.2, cy: 8.9, r: 1.9 },
  { cx: 19.6, cy: 10.6, r: 2.1 },
  { cx: 20.1, cy: 12.0, r: 2.0 },
  { cx: 20.8, cy: 10.4, r: 3.3 },
  { cx: 21.6, cy: 10.4, r: 4.2 },
]

/** Plan 9 §2: the hover bites the left side, mirrored about x = 12, so the apple ends symmetric. */
export const leftChomps = chomps.map((chomp) => ({ ...chomp, cx: 24 - chomp.cx }))
