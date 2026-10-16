# Plan 9: the bitten mark and the mesh header

Builds on `0-plan-landing.md` … `8-plan-paint-and-fixes.md`. Where this plan conflicts with an earlier one, this plan wins (plan-order note in plan 0). Everything not mentioned here keeps the earlier rules: no animation library, one rAF loop (`frameLoop.ts`) that reads before it writes and sleeps when nothing moves, visible without JS, all copy in `content/`, components under 150 lines, BEM class names, motion levels `full` / `calm` / `off` through the plan 3 mixins and hooks, and **the plan 6 rulebook (§2) for every animation**: loops only on `transform` / `opacity` of HTML elements or root `<svg>`s, no filters on moving things, `will-change` only through `promote-while-awake`, ambient loops only under `when-awake`.

Goal: the apple mark is bitten on the right at rest everywhere, like the real logo; a hover on the header or footer mark sends the worm to bite the left side, so the apple ends up bitten symmetrically on both sides; the header bar becomes a soft, drifting gradient mesh like the reference (codefronts, "CSS animated gradient mesh background") instead of the marbled paint. Nothing here is built yet.

**Starts from the plan 8 numbers.** Plan 8 §13 "After" is the baseline (main JS 103.91 KB gz, main CSS 26.50 KB, paint masks 3.5 KB in three files, hero drawing layers 54 idle / 54–55 under the pointer, overdraw 11.1×). Measure again with `npm run build && npm run perf` before P1 and copy the numbers into §8; every limit in §5 is counted from them. **`npm run test:perf` is already red at the start** (plan 8 §13: Pixel 7 hero layers 42 against the budget 40, desktop hero overdraw 12.52 against 12.5). Plan 9 does not set out to fix that; it must not make either number worse, and P4 writes the result into Known gaps if they stay over.

## 0. Overrides of plans 0 to 8

| Earlier rule                                                                                       | Plan 9 change                                                                                                        | Why                                                                     |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Plan 0 / plan 4: the mark is a whole apple; plan 7 §4 and plan 8 §7: the bite only exists on hover | The body path has the round bite on the right built in (§1); every user of `appleBodyPath` shows it                  | asked for: "by default with a bitten side, like the real Apple logo"    |
| Plan 8 §7: on hover the worm chews the round notch on the right in five chomps                     | The same five chomps, mirrored to the left side (§2); the right bite is already there                                | asked for: the worm bites the opposite side, the apple ends symmetrical |
| Plan 8 §1: three marbled paint layers (generated masks) over a five-stop ground                    | Four soft radial blobs that drift and overlap over a plain ground (§3); the masks, their generator and tests go      | asked for: a gradient mesh like the reference                           |
| Plan 8 §1: the still `header__paint` container carries the soft top edge as a mask (+1 layer)      | No mask on the container; the soft edge, if kept, is a gradient on the still ground, so the container holds no layer | gives back the layer plan 8 went over its +0 limit with                 |
| Plan 0: `public/favicon.svg` and the icons rendered from it are the whole apple                    | The favicon gets the same bitten body; `favicon-32.png` and `apple-touch-icon.png` are rendered again                | one shape everywhere                                                    |

## 1. The mark is bitten at rest

Today `appleBodyPath` (`apple-mark-path.ts`) is a whole, left-right symmetric apple (about x = 12). The plan 8 hover ends in one round notch: r 4.2 at (21.6, 10.4) in the 24-unit space. That notch becomes the shape of the mark at rest.

- **In the path, not a mask.** The bite is cut into the path itself, so the fill, the drawn outline, the phone render, the football and every other user get it without a mask or an id. The right-hand curve `C19.8 11.6 19.4 8.6 17.5 7.1` (from (18.9, 14.4) up to (17.5, 7.1)) meets the circle at t ≈ 0.076, (19.08, 13.76), and t ≈ 0.851, (18.25, 7.87) (found numerically). The curve is split at both points (de Casteljau), the part between is replaced by the arc `A4.2 4.2 0 0 1 18.25 7.87`, and the rest of the path is unchanged. The leaf is not touched.
- **Computed once, stored as a literal, checked by a test.** `apple-mark-path.ts` keeps the whole body as `appleWholeBodyPath` (the tests use it) and exports `appleBodyPath` as the bitten one. Both stay single-quoted string literals: `scripts/generate-apple-points.mjs` reads them from the file with a regular expression, so the path is not assembled in code. The split points and the halves of the curve are written with two decimals; a unit test checks that both split points lie on the **last row of the chomp table** within 0.02 (so a retuned circle fails the test until the path is recomputed) and on the original curve within 0.02, and that the path has exactly one arc command.
- **The points generator learns the arc.** Its tokenizer reads only `M`, `C` and `Z` today; an `A` would be skipped and the next curve would start from the wrong point. `toPolyline` gains circular arcs (endpoints, radius and flags to a centre, then sampled like a curve).
- **Depth.** The notch is about 2 units deep (1.96) on a 14.7-unit-wide body (13 %). The real logo bites deeper (closer to a fifth); the centre and radius are a starting point and are tuned by eye at the header size (1.4 rem × 1.35 while hovered) and on the render. Whatever they become, the plan 8 chomps' last circle and this notch stay the same circle (§2 mirrors it).
- **Who gets it:**
  - the header and footer `LivingMark` (body piece);
  - `phone-render__mark` on the back of the render, including the faint `[data-ball-out]` outline, so the "goal" left behind by the ball has the bite too;
  - the football (`finishes-team.tsx`): the logo pops off and grows back into the logo, so it must be the same shape or the swap jumps;
  - the Reserve wallpaper glass apple (`ReserveWallpapers.tsx`) and the finishes particle apple. The particle targets are regenerated with `npm run points` from the new path (400 points, same count, so the particle code does not change);
  - `public/favicon.svg`, a copy of the path (it is a static file and cannot import it); `favicon-32.png` and `apple-touch-icon.png` are rendered from it again (the icon part of `scripts/render-share-images.mjs`; `og-image.jpg` hides the header and is not touched). A unit test checks the favicon carries the same body path.
- **Forced colours and high contrast:** the bite is the shape now, so it stays in every mode, including `off` and forced colours. Only the hover chomps and the worm keep `display: none` under `forced-colors`.
- **The outline draw** (plan 4 §2.2) runs along the bitten path with `pathLength={1}`; the arc is part of the stroke, so the bite edge is drawn too. Nothing else in the draw changes.

## 2. Hover: the worm bites the left side

Plan 8 §7 stays in everything but the side: five chomps at 630, 750, 870, 990 and 1 110 ms from hover, the worm visits from 240 ms for 1 620 ms, the blink at 1 050 ms, the jolt over 600 ms in `steps(10, jump-end)`, the grow 200 ms, the heal 300 ms.

- **Mirror about x = 12.** The body is symmetric about x = 12 (checked: every control point of `appleWholeBodyPath` has a partner at 24 − x), so the left chomps are the plan 8 table with `cx → 24 − cx`:

| Chomp | Circle (cx, cy, r) | At (ms, from hover) |
| ----- | ------------------ | ------------------- |
| 1     | 3.8, 8.9, 1.9      | 630                 |
| 2     | 4.4, 10.6, 2.1     | 750                 |
| 3     | 3.9, 12.0, 2.0     | 870                 |
| 4     | 3.2, 10.4, 3.3     | 990                 |
| 5     | 2.4, 10.4, 4.2     | 1 110               |

`apple-bite-chomps.ts` keeps one table for the right side (the rest bite's circle is its last row; the unit test in §1 ties the path's split points to it) and exports `leftChomps = chomps.map(c => ({ ...c, cx: 24 - c.cx }))`. The plan 8 unit test (all chomps inside the last one) runs on the left table. The mirror itself holds by construction, so the test that matters is the geometric one: the whole body is symmetric about x = 12, and the bitten path's arc is the last chomp circle.

- **Mask.** `AppleBiteMask` draws the left chomps only; the right bite is in the path and needs no circle. The rect stays the first child, so the `nth-child(2)`…`(6)` delays do not change.
- **Worm.** The segments and eyes are mirrored (`cx → 24 − cx`: segments at 4.6, 2.5, 0.6; eyes at 0.95 and 0.15, y unchanged), and so is the lean in `worm-visit`: `translate(-1.2px, -1.4px) rotate(14deg)`. `transform-origin: 2.8px 10.5px` (was 21.2 px).
- **Jolt.** `chomp-jolt` pushes the mark away from the bite: `translateX(1px)` instead of `-1px`.
- **Leave.** The left chomps heal over 300 ms as today; the right bite stays, it is part of the shape. `off`: a hover snaps to the symmetric apple; touch has no hover (unchanged).
- The leaf swing when the worm leaves keeps its side; the leaf is on the right and the worm no longer comes near it, which is fine.
- The worm now leans out to the left (to about −0.8 units, −1.5 px at the hovered header size): into the header's side padding and past the footer brand line's left edge. Checked by eye that nothing clips it.

## 3. Header: a gradient mesh

The reference is the common CSS mesh: a dark ground with several large, soft, coloured blobs that drift slowly, overlap and blend, so the colour field keeps shifting without a visible shape. The usual ways to build it break the rulebook: a `filter: blur()` on the moving blobs (rule 5), or `@property` blob positions animated inside one `background` (a repaint of the whole bar on the main thread every frame, rule 4). So the blobs are separate HTML spans whose softness is in their own gradient, and only `transform` moves.

**Look.**

- **Ground:** `--bar-mesh-ground`, one flat colour in the accent family (dark theme about 14 % lightness, light theme about 92 %), under the plan 7 / plan 8 bar opacity rules.
- **Four blobs**, `--bar-mesh-a/b/c/d`: the accent hue, +40, −50 and a fourth at +160 for the mesh's contrast (the reference mixes distant hues; whether the fourth stays in the accent family is decided by eye, §6). Each is `radial-gradient(closest-side, colour, transparent)` on an ellipse much larger than the bar: about 40–55 % of the bar's width and 4 times its height (240 px for the 60 px bar), centred on the bar, so only a soft horizontal band of each blob shows and the edges never read as circles.
- **Drift:** each blob moves on its own closed path (`translate` and a gentle `scale` 0.9–1.15, four to five keyframes, `alternate`, `ease-in-out`) at 18, 23, 29 and 37 s, so the pattern repeats only after minutes. They travel about a third of the bar's width and ±40 px vertically, so the blobs pass through each other and the colours merge where they meet.
- **Blend:** plain alpha, no `mix-blend-mode` (as plan 8 §1). The peak alpha of each blob is set by the contrast test (below), starting at 55 %.
- High contrast and forced colours: the flat bar, no blobs (`display: none`). The progress line, its tip and the plan 7 §11 edge pulse do not change.
- `calm` and `off`: the blobs stand still at their 0 % keyframe. The mesh is a look, not motion, so it stays.

**How.**

- `Header.tsx`: the `paint` span becomes `mesh` with four child spans; `aria-hidden`, `position: absolute; inset: 0; overflow: clip; contain: paint; pointer-events: none`, `z-index: -1` under `isolation: isolate`, as today. No mask on the container (it held a layer of its own in plan 8). If the plan 7 soft top edge is still wanted, it is a gradient on the ground or on an extra still span above the blobs, never a mask over the composited children; decided by eye and by the layer count.
- Blobs: `position: absolute`, sized in `%` of the bar's width and in px of height, `top: 50%` with a `-50%` translate inside the keyframes, so one `transform` animation per blob. Loops under `when-awake` (the header root already calls `useAwakeWhileInView`), `promote-while-awake(transform)`, keyframes generated from an SCSS map (duration, path) like the plan 8 layers.
- **Removed:** `src/assets/paint/`, `scripts/generate-paint-masks.mjs`, `config/paintMasks.ts` and its test, the `paint` npm script, the `assetsInlineLimit` exception in `vite.config.ts`, the `--bar-paint-*` tokens and the five-stop ground. README's plan 8 paragraph keeps its history; the motion list says what the header is now.
- Tokens: `--bar-mesh-ground` and `--bar-mesh-a…d` in all four token sets (plan 3 §5a), the blobs transparent in both high-contrast sets.
- **Contrast:** `config/contrast.test.ts` keeps its thresholds: the nav text at 4.5 : 1 (7 : 1 in high contrast) and the muted section label at 4.5 : 1; the Reserve button's fill and the pause toggle's border are graphics, 3 : 1 (plan 8 §8). The surfaces are the ground over the page and **every overlap of the blobs** (each blob alone, every pair, every three, all four, at peak alpha, composited in DOM order over the ground), for every finish and every token set; the worm test (plan 7 §4) moves to the same surfaces. If a finish fails, the lightness or alpha range is narrowed for every finish (as plan 8 did), not per finish.
- **Layers:** four blobs replace three paint layers and the masked container, so by element the count is **+0**, not −1 (3 + 1 → 4 + 0). The limit is +0 against P0 in a layer list by element; three blobs would give −1 and stay the fallback if the four do not read better. Each blob layer is about 650 × 240 px at 1 440 px wide; whether Chrome backs the full 240 px or the 60 px left after the container's clip decides the overdraw, so P3 measures it rather than assuming it is like a paint layer (2 160 × 120 px).

## 4. Tests (draft)

- **Unit:** the bitten path (split points on the last chomp circle and on the curve; one arc whose radius is the last chomp's; the whole body symmetric about x = 12); `leftChomps` are inside their last circle; the favicon carries `appleBodyPath` and `appleLeafPath`; the particle targets file is regenerated (point count 400, and **no point inside the bite circle** by more than 0.1 units: the outline points lie on the edge and some are on the leaf, so "inside the body" is the wrong test); the contrast test for the mesh in all four token sets and every finish; the per-frame guard needs no new property.
- **E2e:**
  - Mark at rest: the header, footer and render marks' body path has an arc command (not a fixed radius, which is tuned by eye); at `off` and under forced colours too.
  - Hover: the five left chomp circles are scaled in after the sequence (about 1.9 s at `full`, the plan 8 test) and sit left of x = 12; after the hover the body is symmetric, checked by geometry, not a screenshot (the leaf is on the right only and the mark breathes and leans): on a grid over the body, a point is "apple" when the body path's `isPointInFill` holds and no scaled-in chomp circle covers it, and every point agrees with its mirror at 24 − x; at `off` the hover snaps to the symmetric apple. The plan 7 and plan 8 bite tests (`games-and-surfaces.spec.ts`, `paint-and-fixes.spec.ts`) move to the left side.
  - Football: the ball's body path has the bite.
  - Header: at `full` four running animations on the mesh spans, all `transform`, all composited; none at `calm` / `off`; HC shows the flat bar; no request for `paint-*.svg`. The plan 8 paint tests are removed.
  - The plan 6 `off` test (animations 0, idle rAF 0) and `calm` test keep passing.
- **Perf:** `npm run perf` before P3 and after; hero drawing layers and overdraw into §8.

## 5. Budget

| What                     | Limit                               | What goes in                                                             |
| ------------------------ | ----------------------------------- | ------------------------------------------------------------------------ |
| Main JS                  | **+0.1 KB gz**                      | the bitten path string, `leftChomps`                                     |
| Main CSS                 | **−0.1 KB gz** or less (paint goes) | four blobs and their keyframes against three paint layers at 1/8 samples |
| Paint masks (files)      | **−3.5 KB**, gone                   |                                                                          |
| `finishes-team`, Reserve | +0                                  | the path is imported, not copied                                         |
| Favicon PNGs             | +0.5 KB together                    | the bitten shape rendered again                                          |
| Layers at the hero       | **+0** against P0, by element       | four blobs replace three paint layers and the masked container (4 → 4)   |
| `test:perf`              | no worse than P0                    | Pixel 7 hero layers 42 (budget 40), desktop overdraw 12.52 (budget 12.5) |

## 6. Open questions

- §1, trademark: plan 7 §4 kept the bite ragged on hover only, because a mark that reads as Apple's logo is a trademark risk even on a page marked unofficial; plan 8 made the hover bite round. This plan makes the round bite the resting shape everywhere, at the user's request. If that turns out to be a problem, the fallback is the plan 8 state: a whole apple at rest and the round bite on hover.
- §1: whether the Reserve wallpaper apple and the particle apple should be bitten too. The plan bites them (one path for every user, so nothing can drift apart); if they should stay whole, they import `appleWholeBodyPath`.
- §3: the fourth blob at +160 makes the mesh read like the reference but takes the bar outside the finish's colour family; the alternative is four hues within ±50 of the accent. Decided by eye in both themes.
- §3: the reference's exact code was not readable (the playground renders it client-side), so the look above is the common pattern it shows: soft blobs drifting over a dark ground. Checked against the reference by eye before P5 is called done.

## 7. Work order (draft)

| #   | Step                                                                                                  | Done when                                                    |
| --- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| P0  | Baseline `npm run build && npm run perf`; numbers into §8                                             | baseline written                                             |
| P1  | Bitten path (§1), arcs in the points generator, `npm run points`, favicon and its PNGs                | unit tests green; every mark on the page shows the bite      |
| P2  | Left-side hover bite and worm (§2)                                                                    | symmetric after hover; bite e2e green on the left            |
| P3  | Remove the paint (§3 "Removed"), build the mesh                                                       | contrast test green for every finish; layers ≤ P0 by element |
| P4  | Lint, typecheck, unit, e2e, `test:perf`, `perf`; README (motion list, budget, Known gaps) from output | all green, or the P0 reds no worse and in Known gaps         |

## 8. Implementation notes

Filled in during the build. Where the build differs from the text above, the build is the rule.
