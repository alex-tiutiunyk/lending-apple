# Plan 8: paint and fixes

Builds on `0-plan-landing.md` … `7-plan-games-and-surfaces.md`. Where this plan conflicts with an earlier one, this plan wins (plan-order note in plan 0). Everything not mentioned here keeps the earlier rules: no animation library, one rAF loop (`frameLoop.ts`) that reads before it writes and sleeps when nothing moves, visible without JS, all copy in `content/`, components under 150 lines, BEM class names, motion levels `full` / `calm` / `off` through the plan 3 mixins and hooks, and **the plan 6 rulebook (§2) for every animation**: loops only on `transform` / `opacity` of HTML elements or root `<svg>`s, no filters on moving things, `will-change` only through `promote-while-awake`, ambient loops only under `when-awake`.

Goal: the header bar looks like spilled, swirled paint instead of a soft wave; the runaway letters' legs start at the glyph; the panel handle is bigger; the line draw shows nothing before its scroll range; the mini Pips on the frame's walls and top turn their feet to the phone and stand still once a goal is scored; the worm takes a bigger, rounder bite, more slowly; the header pause toggle is smaller and its border easier to see. Nothing here is built yet.

**Starts from the plan 7 numbers.** Plan 7 §19 "After the review fixes" is the baseline (main JS 103.78 KB gz, main CSS 26.14 KB, hero 47–50 drawing layers, hero overdraw 10.8–11.6×). Measure again with `npm run build && npm run perf` before P1 and copy the numbers into §13; every limit in §10 is counted from them.

## 0. Overrides of plans 0 to 7

| Earlier rule                                                                                                           | Plan 8 change                                                                                                                | Why                                                                                                        |
| ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Plan 7 §6: three crest strips (`crest-mask`) over a three-stop linear gradient                                         | Three marbled **paint** layers (generated masks, §1) over a richer base; the crest strips and the `crest-mask` mixin go      | asked for: "a complex, twisted gradient, like spilled paint", not a wave                                   |
| Plan 4 §1, plan 7 §7.1: the legs hang from the bottom of the copy's box                                                | The legs start at the bottom of the glyph's ink (§2)                                                                         | asked for: there is a gap of about 0.2 em (the font's descent) between the letter and its legs             |
| Plan 3 / plan 5: the handle is `--tap-min` square on desktop and 1.75 rem × `--tap-min` on phones, with a 1.5 rem icon | Both sizes and the icon ×1.75 (§3)                                                                                           | asked for                                                                                                  |
| Plan 4 §8: blueprint hairlines use `vector-effect: non-scaling-stroke`                                                 | Removed; the hairline width is kept by a stroke width in user units divided by the drawing's scale, set once per layout (§4) | the non-scaling stroke breaks the `pathLength` draw in Chromium and leaves lines visible before the scroll |
| Plan 7 §5: the lap Pips stand on the border with their heads to the phone                                              | On the walls and the top their feet point to the phone and their heads to the border; on the floor nothing changes (§5)      | asked for                                                                                                  |
| Plan 7 §5, §19: the lap Pips keep running until the whistle and stop where they are                                    | Everybody stops when the header starts; nobody's legs run after the goal (§6)                                                | asked for: after a goal the Pips that are not on the floor keep moving                                     |
| Plan 7 §4: the bite is three small chomps, deliberately not one clean round bite                                       | Five chomps that end in one round bite on the right side, and the whole bite plays 1.5 times slower (§7)                     | asked for ("bite more, more like the logo"); see the trademark note in §11                                 |
| Plan 0: the motion toggle is `--tap-min` (2.75 rem) everywhere                                                         | In the header it draws 2.25 rem, with its 2.75 rem tap area kept by an invisible hit box; its border is stronger (§8)        | asked for: the button nearly fills the 60 px bar                                                           |

## 1. Header: spilled paint

Today (plan 7 §6) the bar is a linear gradient of three hues around the accent with three soft colour crests sliding across it. It reads as a wave. What is wanted is **marbling**: several colours poured into each other, twisted into swirls and veins, slowly flowing.

**Look.**

- **Base**: the three stops stay, but they become a diagonal gradient (`100deg`) with five stops that swap hue twice across the bar (accent → +40 → −50 → +40 → accent). This is what shows between the paint shapes.
- **Three paint layers** over it, each a flat colour in the accent family (`--bar-paint-a/b/c`: accent hue, +40, −50 in the dark theme at 26–34 % lightness and 55–70 % alpha; light theme at 84–90 % lightness), masked by a **marbled shape**: big curling lobes with thin tails, the shapes you get when you drag a comb through paint. Each mask has a different scale, so the swirls of one layer are three times the size of another's.
- **Flow**: each layer slides by one tile width per loop and drifts up and down at the same time (the tile is taller than the bar: 120 px for a 60 px bar, `top: -30px`, so the drift is at most ±30 px and the bar is always covered), in different directions and at different speeds (48 s, 66 s, 90 s). The drift goes through the same keyframes as the slide (x linear over one tile, y as a sine sampled at 0, 25, 50, 75 and 100 %, so the loop closes), so a layer keeps one `transform` animation. Where the layers cross, the visible pattern is new all the time, and the lobes seem to twist through each other.
- High contrast and forced colours: the flat bar, no paint (as today). The progress line, its tip and the plan 7 §11 edge pulse do not change.

**Why not the other ways.** WebGL (Stripe's mesh gradient) is rejected for the same reason as in plan 7: a GL context for a 60 px bar. Runtime `feTurbulence` + `feDisplacementMap` would give real marbling for free, but it is an SVG filter on something that moves (plan 6 rule 5; plan 6 §1 measured 200 ms tasks for the old ripple lens). `conic-gradient` layers that rotate give swirls, but a rotating layer cannot tile across a 1 440 px bar, and the layer has to be as large as the bar is wide. So the noise is computed **at build time** and only the masks move at runtime.

**How.**

- `scripts/generate-paint-masks.mjs` (like `scripts/generate-apple-points.mjs`, run by hand, output checked in): domain-warped value noise (two warp passes, which is what makes the curls), periodic in x so the tile repeats without a seam, contoured with marching squares at one threshold per layer, the contours smoothed (Catmull-Rom to cubic Béziers) and simplified to keep each file small. Output: `src/assets/paint/paint-a.svg`, `paint-b.svg`, `paint-c.svg`, one filled path each, white on transparent, tile 720 × 120. The scale is set as a whole number of noise cells across the tile (12, 7 and 4 for `-a`, `-b`, `-c`, so the largest swirls are three times the smallest), never as a fractional factor, so every layer's noise is periodic in the tile. Seeds are constants in the script, so a rerun gives the same files.
- The masks are files, referenced from the stylesheet with `url()`, not data URIs: they stay out of the main CSS, load after the first paint, and are not fetched at high contrast (the layer is `display: none` there).
- `Header.tsx`: the `waves` span becomes `paint` with three child spans; same `aria-hidden`, `position: absolute; inset: 0; overflow: clip; contain: paint; pointer-events: none`, `z-index: -1` under `isolation: isolate`. Each child: `width: calc(100% + 720px)` (`left: -720px` for a layer that slides right), `height: 120px`, `top: -30px`, `mask-image: url(paint-x.svg)`, `mask-repeat: repeat-x`, `mask-size: 720px 120px`. The plan 7 soft bottom edge (the vertical gradient mask) goes on the still `paint` container, not on the layers: on a layer that drifts it would drift with it.
- Loops: `transform` keyframes on HTML spans (rule 4), under `when-awake` (the header root already calls `useAwakeWhileInView`), `promote-while-awake(transform)`. Three layers replace the three crest strips, so the layer count does not grow. Each layer is twice the bar's height and a tile wider than the bar, so its texture is about 2.5 times a crest strip's: that growth is expected and accepted; the GPU memory and the hero overdraw are measured and written into §13 (§10).
- No `mix-blend-mode`: the layers overlap by plain alpha, which is enough for the paint look and keeps the compositor work flat.
- At `calm` and `off`: the paint stands still (the masks at their 0 % positions). The look is not motion, so it stays.
- Tokens: `--bar-paint-a/b/c` in all four token sets (plan 3 §5a), transparent in both high-contrast sets. The `--bar-wave-*` tokens and the `crest-mask` / `crest-tile` mixins are removed (the header is their only user).
- Contrast: the paint is stronger than the crests were, so `config/contrast.test.ts` samples the nav text, the section label and the Reserve button against the base stops and against each paint colour composited over the lightest and darkest stop, for every finish hue and every token set (4.5 : 1 for text). If a finish fails, the paint lightness range above is narrowed for every finish, not per finish.

## 2. Runaway letters: legs at the glyph

The copy of an escaped letter is a box exactly as tall as the range rect of the glyph (`copyGlyph` in `letterWrap.ts`), and the legs hang from its bottom (`.leg { bottom: calc(-0.5em * var(--leg-scale)) }`). The box bottom is the font's descent line, not the bottom of the letter: for a letter without a descender there is an empty strip of about 0.2 em between the ink and the legs, so the legs look detached, more so on headings.

- `copyGlyph` measures the glyph once, when the copy is made (not per frame): a 2D canvas context with the copy's computed `font` shorthand, `measureText(char)`. The gap from the box bottom to the ink bottom is `fontBoundingBoxDescent − actualBoundingBoxDescent` (for "a" this is the whole descent, for "g" it is almost zero). It is written once as `--leg-lift` (px) in the inline style that `copyGlyph` already writes. The measurement is cached per font shorthand and character in a module `Map` (`glyphMetrics.ts` in the letters chunk); the canvas is created once. A canvas ignores a font string it cannot parse and keeps its previous font, so after setting `ctx.font` the module checks that it took (non-empty shorthand, the size matches); if not, no `--leg-lift` is written and the fallback applies.
- `--leg-lift` goes into the `oncePerEvent` list of `config/perFrameProperties.test.ts` (it inherits into the legs, so it cannot be registered non-inherited).
- `.leg`: `top: calc(100% - var(--leg-lift, 0.22em) - 0.04em)` instead of `bottom`, so the legs start just inside the ink (0.04 em overlap, so they never show a hairline gap at fractional pixel positions). Leg length, width, feet, `--leg-scale` for headings and the `leg-walk` all stay.
- Without `fontBoundingBoxDescent` (old engines) the fallback is `0.22em`, today's average gap for the page fonts, measured once and written into the stylesheet.
- Not a per-frame value: `--leg-lift` is written once, when the copy is created, before it starts moving; the per-frame writes on the copy stay `translate` and `rotate`.

## 3. Accessibility panel handle: 1.75 times larger

Today (measured at 1440 × 900 and 390 × 844): the handle is 44 × 44 px on desktop and 28 × 44 px on phones, the icon 24 px.

- `A11yPanel.module.scss`: a factor `$handle-scale: 1.75`. `$handle` becomes `calc(var(--tap-min) * 1.75 / var(--text-scale, 1))` (77 px), `--handle-rem` becomes `calc(1.75rem * 1.75)` on phones (49 px) and `calc(var(--tap-min) * 1.75)` from 48 rem (77 px). The panel width already subtracts `$handle-width`, so the open panel stays inside the window.
- `.icon`: `calc(1.5rem * 1.75 / var(--text-scale, 1))` (42 px). The glyph strokes scale with it (stroke width 1.5 in its 24-unit viewBox, about 2.6 px on screen); if that reads heavy, the stroke goes to 1.25 (decided by eye).
- The star jump, the ring draw and the open pose are in viewBox units and need no change. The radius of the tab's corners goes from `--radius-s` to `--radius-m`, so the larger tab keeps the same proportions.
- The text-scale division stays: a larger text setting still does not make the tab larger.
- Phones: the README already lists the 28 px tab covering about 10 px of the content edge. At 49 px it covers about 31 px; see §11. The "closed, only the handle shows" e2e (`handleLeft <= 0`) keeps passing, and the closed panel still sits fully off screen.

## 4. Line draw: no lines before the scroll

Reported: in `line-draw__visual` some lines are visible before the drawing starts. Measured on the production build (`vite preview`, Chromium, 1440 × 900, the section's top 300 px below the viewport top, before the `contain` range starts): the computed values of every path say "not drawn" (`stroke-dashoffset: 1.02px`, the gap of the dash pattern), but the screen shows the camera rings, the island, the screen corners, the guides circle and the body contour. Two separate bugs:

1. **The heads draw the whole contour.** `.root--scrolled [data-part] path { stroke-dasharray: 1 1.1 }` (specificity 0-2-1) beats `.root--scrolled .head { stroke-dasharray: 0.05 2 }` (0-2-0), so the bright head of every main contour (body, screen, island) is drawn with the contour's own dash pattern. At its starting offset (0.06) that pattern shows 94 % of the path. Confirmed: the body head path computes `stroke-dasharray: 1px, 1.1px`.
   Fix: the head rule becomes `.root--scrolled [data-part] .head` (0-3-0), or the general rule is wrapped in `:where([data-part]) path`. Then the head is a 0.05 dash that rides the tip, as intended.
2. **`vector-effect: non-scaling-stroke` breaks `pathLength` in Chromium.** The blueprint paths carry it (plan 4 §8) to keep hairlines thin at every size. With it, Chromium lays the dash pattern out in screen space while `pathLength={1}` normalises it in user units, so on a drawing scaled by about 1.5 the 1.02 offset covers only part of each path and the rest shows. Confirmed: with `vector-effect: none` forced, all the thin parts disappear before the range, and with it on they show.
   Fix: drop `vector-effect`. The hairline width is kept by a stroke width in user units divided by the drawing's scale: `stroke-width: calc(0.6px / var(--outline-scale, 1))`, and the same division for every blueprint width that `vector-effect` covered today: 0.75 (low resolution, camera), 0.9 (body), 1.4 (the heads) and 1.2 (high contrast). `--outline-scale` is the drawing's scale under the default `preserveAspectRatio` (`meet`): `min(width / viewBox width, height / viewBox height)`, written on the `<svg>` from a `ResizeObserver` in the write phase (once per layout, not per frame; it inherits only into the drawing's own paths, which nothing animates per frame through it). The hook is small (`useOutlineScale` next to `phone-outline.tsx`) and only the blueprint uses it; the hero outline has no `vector-effect` and is not touched. `--outline-scale` goes into the `oncePerEvent` list of `config/perFrameProperties.test.ts`.

Also checked in the same run: the guides (opacity 0 before the range), the colour render (`clip-path: circle(0%)` before the range) and the plain paths are correct. Firefox and WebKit are checked by the new e2e test (§9) after the fix, since the bug is per engine.

## 5. Mini Pips: feet to the phone

Today `lapPoint` (`footballGame.ts`) returns the angle of the border: 0 on the floor, −90° on the right wall, −180° on the top, −270° on the left wall, so the feet stand on the border and the heads point to the phone (upside down on the top). From now, on the walls and the top **the feet point to the phone and the head touches the border**; on the floor nothing changes.

- The box takes the same space as today, only turned over: today the feet are on the border and the head is `H` inside it; now the head is on the border and the feet are `H` inside. So the route along the border does not change; each lap Pip gets a second turn, 180° about its own centre, on top of the border angle.
- `lapPoint` returns `flip`, a share from 0 to 1: 0 on the floor, 1 on the walls and the top, and 1 over the two top corner arcs. Over the bottom-right arc (floor → right wall, in the direction of `s`) it rises 0 → 1, over the bottom-left arc (left wall → floor) it falls 1 → 0. In a bottom corner the Pip does a quick half cartwheel while it rounds the corner (it climbs onto the wall head first), which reads as play, not a glitch. Total turn over a lap: zero, so the angle never accumulates.
- Draw: the transform string becomes `translate(x, y) rotate(angle) translateY(-50%) rotate(180 * flip) translateY(50%) scaleX(facing)`. Percentages in `translate` are of the box itself, so the half-height needs no measurement and follows the text scale; the origin is still the feet. One `transform` string per box in the write phase, as today.
- **Travel and facing are two fields.** Today `facing` is both the lap direction (`pip.lap += pip.facing * speed * dt`) and the drawn mirror. They split: `lapDirection` (±1, set once in `createGame`, never changed) moves the Pip along the border; `facing` is only drawn. On the border `facing` follows the running direction **on screen**: the sign of the dot product of the step vector and the Pip's own x axis after both turns, so a flipped Pip does not run backwards. The team Pips on the floor keep `runTo`'s facing.
- The kick of a lap Pip (the ball rolling to the border) still works from the same point; the distance test uses the box centre instead of the feet, since the feet are now inside the frame. The pure step does not know the box size, so the game takes the Pip height as `pipHeight` (frame px, from the frame's `ResizeObserver` together with the frame size: `1.1rem` read from one Pip box's `offsetHeight` on each resize).
- Unit tests: `flip` is 0 on the floor, 1 on the walls and the top, monotonic over a bottom corner; the drawn box never leaves the frame (the four box corners after the transform, for 400 points of a lap); `facing` matches the on-screen direction on every side.

## 6. Mini Pips: everyone stops at the goal

Reported: after a goal, the Pips that are not on the floor keep moving. From the code:

- `stepGame`: the `flight` and `scored` cases move only the ball and never clear `isRunning`, so every Pip that was running when the header started keeps `data-running` for 1.16 s and its legs run on the spot.
- `play(…, chaseOnly)` during `header` still advances the lap Pips along the border (up to 1.5 s) and keeps them `isRunning`.
- In `celebrate` the cheer is a hop of `.hop` by −8 px in the Pip's own frame; for a Pip on a wall or the top that is a jump into the border.

Changes:

- From the first frame of `header`, the lap Pips stop: no more lap travel, `isRunning = false`, and they turn to watch the ball (`facing` towards it along their side; only `facing`, so the next rally runs the lap the same way, §5). The team Pips keep running only for the header itself (the chaser to the ball, the other stops).
- `flight`, `scored`, `celebrate` and `rest`: `isRunning = false` for everybody, in one place at the top of those cases, not per case.
- The cheer: the floor Pips hop twice as today; a Pip with `flip > 0.5` raises both arms twice instead (`data-cheer="arms"`, a one-shot on the body root's arm, like the high-five), so nothing pushes into the border. `.hop` animates only on `.pip:not([data-cheer='arms'])`.
- Unit tests: during `header` a lap Pip's position does not change; during `flight`, `scored` and `celebrate` no Pip `isRunning`; `lapDirection` is the same before and after a whole rally. E2e: the e2e runs on the production build (`vite preview`), so there is no dev-only hook; the test drives the game with `page.clock.install()` / `runFor()` (as `living-details.spec.ts` does) until the root's `data-phase` is `flight`, then checks that no `mini-step` animation runs and every Pip transform is the same in two samples 200 ms of clock apart.

## 7. The brand mark: a bigger bite, 1.5 times slower

Today (plan 7 §4, §19): three chomp circles r 2.3–2.6 around (20, 11), snapped in at 420, 500 and 580 ms; the worm visits for 840 ms after a 160 ms delay; the mark jolts 1 px on each chomp over 240 ms.

**Bigger, more like the logo.** The bite becomes the familiar round bite out of the right side: **one round notch** of r 4.2 centred at (21.6, 10.4) in the 24-unit space, about a quarter of the apple's width deep (the body's right edge runs at x ≈ 19.4–19.9 there). It is still eaten, not stamped: five chomps.

| Chomp | Circle (cx, cy, r) | At (ms, from hover) |
| ----- | ------------------ | ------------------- |
| 1     | 20.2, 8.9, 1.9     | 630                 |
| 2     | 19.6, 10.6, 2.1    | 750                 |
| 3     | 20.1, 12.0, 2.0    | 870                 |
| 4     | 20.8, 10.4, 3.3    | 990                 |
| 5     | 21.6, 10.4, 4.2    | 1 110               |

The first three cut a ragged notch top to bottom, the fourth widens it, the fifth rounds it off; all five lie inside the last circle (distance between the centres plus the radius ≤ 4.2, checked by a unit test), so the end shape is the clean round bite and the steps are only visible on the way. Positions are a starting point and are tuned by eye at 1.4 rem × 1.35 (header) and 1.2 rem × 1.45 (footer).

**1.5 times slower.** Every time in the bite sequence × 1.5: the worm's delay 160 → 240 ms, its visit 840 → 1 260 ms plus 360 ms for the two extra chomps (ends at about 1 860 ms); the chomp spacing 80 → 120 ms (the table above); the blink 700 → 1 050 ms; the jolt starts at 630 ms (was 420) and runs `steps(10, jump-end)` over 600 ms (two steps per chomp, as before: 6 steps for 3 chomps); the leaf swing when the worm leaves moves with it. The grow on enter (200 ms) and the heal on leave (300 ms) are not the bite and keep their speed.

**How.** `apple-bite.tsx`: the `chomps` table becomes the five rows above; the worm segments move with the notch (they come out at about (19.6, 10.4) and lean to the right). `apple-bite.module.scss`: the delays become `nth-child` rules generated from an SCSS list (five, not three hand-written ones; the mask's `<rect>` is its first child, so the chomps are `nth-child(2)` to `nth-child(6)`). `living-mark.module.scss`: the jolt keyframes. `off`: the hover still snaps to the bitten apple, now with the round notch. Forced colours: no bite, no worm (unchanged). Masks keep their `useId` ids.

## 8. Header pause toggle: smaller, crisper border

Measured: the header toggle (`motion-toggle header__motion`, compact) is 44 × 44 px in a 60 px bar, 8 px from the top and bottom edges. Decided with the user: it draws **2.25 rem (36 px)**, so 12 px is left above and below and it sits a little lower than the Reserve button.

- `MotionToggle.module.scss`: the size reads `--toggle-size` with `--tap-min` as the fallback (`min-width` / `min-height`); `Header.module.scss` `.motion` sets `--toggle-size: 2.25rem`. The footer toggle and any non-compact toggle keep `--tap-min`.
- The tap area stays 44 px: a `::before` with `inset: calc((var(--toggle-size) - var(--tap-min)) / 2)` (negative), transparent, `border-radius: inherit`. `::after` is the freeze / thaw ring and is not touched. The `:active` `scale(0.92)` and the focus ring follow the drawn circle.
- The icon stays 1 rem; at 36 px it keeps 10 px around it.
- **Border**: `--color-line` (22 % alpha in the dark theme) becomes a new token `--color-control-line` used by the toggle in every place, between `--color-line` and `--color-line-strong`: dark `hsl(var(--ink-h) 14% 72% / 70%)`, light `hsl(var(--ink-h) 12% 46%)`, high contrast the same value as its `--color-line` (62 % dark, 45 % light, both opaque; the toggle reads `--color-line` there today). A rough check put 40 % alpha at about 2.5 : 1 on today's bar and about 2 : 1 on the paint, so the first value is 70 %. Target: 3 : 1 against the bar (WCAG 1.4.11, non-text contrast) over the darkest and the lightest point of the §1 paint, in every token set and finish, checked in `config/contrast.test.ts`. If 70 % does not reach 3 : 1 on the paint, the alpha goes up (to opaque), not the bar down.
- The pressed state keeps the accent border.

## 9. Tests (draft)

- **Unit:** the paint mask generator is deterministic (same seed, same path) and its tile is seamless (the first and last columns of the noise grid are equal); `glyphMetrics` (the lift for "a" is larger than for "g", the cache returns the same object, the fallback without `fontBoundingBoxDescent`); `lapPoint` `flip` and the box-inside-frame check (§5); `stepGame` stops (§6); the contrast test for the paint, the toggle border and the text over the paint, in all four token sets and every finish.
- **E2e:**
  - Header: at `full` three running animations on the paint spans, all on `transform`, all composited; none at `calm` / `off`; HC shows the flat bar and requests no mask file.
  - Letters: during a paragraph escape the top of the first leg is within 0.06 em of the glyph's ink bottom (the copy's rect bottom minus `--leg-lift`).
  - Handle: 77 × 77 px at 1440 px wide and 49 × 77 px at 390 px; the icon 42 px; still fully at the left edge when closed; the open panel fits the window at 320 px.
  - Line draw: with the colour render hidden and the section 300 px below the top, a screenshot of `.visual` equals a screenshot with the outline `visibility: hidden` (no drawn pixel), in Chromium, Firefox and WebKit; at the end of the range the outline is fully drawn (unchanged check).
  - Mini Pips: on a forced goal, no `mini-step` animation and no transform change for 200 ms (§6); a lap Pip on the top has its feet below its head on screen (the leg roots' rect centres are lower than the body's).
  - Mark: the five chomp circles are scaled in after the sequence (about 1.9 s at `full`); at `off` the hover snaps to the bitten mark.
  - Toggle: the header toggle draws 36 × 36 px, `elementFromPoint` 4 px outside its edge still hits it (44 px tap area); the footer toggle is still 44 px.
  - The plan 6 `off` test (animations 0, idle rAF 0) and `calm` test keep passing.
- **Unit (added in review):** the five chomp circles lie inside the last one; `--leg-lift` and `--outline-scale` are in the `oncePerEvent` list of the per-frame property guard.
- **Perf:** `npm run perf` before and after P5; the paint must not raise the hero drawing layers, and the hero overdraw and GPU memory are written into §13.

## 10. Budget

| What                | Limit                                       | What goes in                                                                    |
| ------------------- | ------------------------------------------- | ------------------------------------------------------------------------------- |
| Main JS             | **+0.3 KB gz**                              | `useOutlineScale`, the toggle size prop if one is needed                        |
| Main CSS            | **+0.5 KB gz** (the crest mixin goes)       | paint layers and keyframes, handle sizes, chomp rules, toggle hit box and token |
| Paint masks (files) | ≤ **6 KB gz** for all three, not in the CSS | the three generated SVGs, loaded after first paint, not at high contrast        |
| `runaway-letters`   | +0.3 KB gz                                  | `glyphMetrics.ts`, the leg rule                                                 |
| `finishes-team`     | +0.3 KB gz                                  | `flip`, on-screen facing, the stop rules, the arms cheer                        |
| Layers at the hero  | **+0** over the number measured before P5   | three paint layers replace three crest strips                                   |

## 11. Open questions

- §7, trademark: plan 7 §4 kept the bite ragged on purpose, because a mark that reads as Apple's logo is a trademark risk. This plan makes the bite round at the user's request. If that turns out to be a problem, stop after chomp 4 (a ragged notch about as large).
- §3, phones: at 49 px the closed tab covers about 31 px of the content edge (10 px today). Alternatives if it is too much: ×1.75 height and icon only, with the width at 2.25 rem (36 px). The first build follows the request (×1.75 everywhere) and README "Known gaps" gets the new number.
- §1: a fourth layer of thin light veins (a contour band instead of a filled region) would make it read even more as marbled paper; it costs a layer at the hero, so it is not in the first build.
- §1: whether the paint should follow the finish (it does: every colour reads `--accent-h`) or keep its own fixed palette. Decided by eye.

## 12. Work order (draft)

| #   | Step                                                                                                      | Done when                                                                      |
| --- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| P0  | Baseline `npm run build && npm run perf`; numbers into §13                                                | baseline written                                                               |
| P1  | Line draw fixes (§4)                                                                                      | the new pixel e2e green in three engines                                       |
| P2  | Mini Pips: stop at the goal (§6), feet to the phone (§5)                                                  | unit tests green; no leg loop after a goal                                     |
| P3  | Letter legs (§2), handle (§3), toggle (§8)                                                                | sizes measured as in §9; contrast test green                                   |
| P4  | Bite (§7)                                                                                                 | five chomps, round notch, about 1.9 s; `off` snaps                             |
| P5  | Paint masks generator and the paint layers (§1)                                                           | contrast test green for every finish; layers +0; checked by eye in both themes |
| P6  | Lint, typecheck, unit, e2e, `test:perf`, `perf`, cycles, unused; README (motion list, budget, Known gaps) | all green or written into Known gaps from the probe output                     |

## 13. Implementation notes

Filled in during the build. Where the build differs from the text above, the build is the rule.

**Review before the build (2026-10-15).** Checked against the code: §5 split `facing` from the lap direction; §7 chomp circles moved inside the last one (the first table had all four outside it); §6 e2e uses `page.clock` instead of a dev-only hook (e2e runs on the production build); §2 and §4 list the new custom properties for the per-frame guard; §8 starts at 70 % alpha (40 % was about 2.5 : 1) and names the high-contrast value; §1 moved the soft edge to the still container, set the tile to 120 px with a ±30 px drift, and set whole cell counts per layer; §4 lists every blueprint stroke width and the `meet` scale; §5 draws the half-height turn with `translate` percentages.

**P0 baseline (2026-10-15, before any change):** main JS 103.78 KB gz, main CSS 26.14 KB, `RunawayLetters` 5.78 + 0.56 KB, `finishes-team` 3.10 + 0.75 KB; hero drawing layers 50 idle / 52 under the pointer, overdraw 10.8× / 11.6×; full scroll 21.9 ms mean frame, 0 long tasks. The same as plan 7 §19.

**Where the build differs from the text:**

- §4: removing `vector-effect` was not enough in Chromium. The tiny camera rings (10 units long) still showed a dot before the scroll: Skia measures such a short closed path up to a quarter longer than `pathLength` says, so with the 1.1 gap the next dash started on the ring. The scroll-drawn dash pattern is `1 2` now (the gap twice the path); the start offset stays 1.02. The pixel test is green in Chromium (desktop and Pixel 7), Firefox and WebKit. The e2e hides everything but the outline (`visibility`), because the backdrop and the particles move between two shots.
- §4: `--outline-scale` is written for every blueprint, not only the scroll-drawn one (there is only one blueprint, the line draw's).
- §5: `flip` is in half turns and runs 0 → 1 over the bottom-right arc and −1 → 0 over the bottom-left arc (−1 and 1 are the same pose). With 1 → 0 on both corners the cartwheel turned the same way on both sides and the box stuck out of the left corner by 1.4 px; turned the other way it is 0.3 px, the same as the right corner and less than the plain base already reaches past the top corners (0.9 px, the tangent of the box base on an arc). The unit test allows 1 px.
- §5: the box-centre kick reads `pipHeight` (one Pip box's `offsetHeight`, in the frame's ResizeObserver); the draw needs none (`translateY(±50%)`). The lap Pips are put on the border in `createGame`, so they no longer stand at the bottom-left corner until the first rally.
- §6: the stop is in `setPhase` (on the way into a phase), not at the top of `stepGame`: with the stop at the top of the step the frame that switches from `play` to `header` still drew running legs. The arms cheer needed a second arm: a right arm path that is transparent except while it cheers (`mini-arms-right`), so the Pip keeps its one-armed look otherwise.
- §1: the masks are not thresholded noise. Thresholded domain-warped noise looked like camouflage at 60 px (blobs with jagged edges, the fine octave and a strong warp folding). Marbling is twisted stripes, so the field is `sin(2π · (bands · y / height + turbulence · warped noise))`: horizontal bands (2, 1.5 and 1 per tile) bent by the warped noise, with a gentle warp (1.6 cells), one faint second octave (6 %) and cells stretched 1.7 times along the bar. The cell counts are 6, 4 and 2 (not 12, 7, 4: smaller cells gave grain, not lobes), still three times between the smallest and the largest. Contours that go all the way round the tile (the edges of a band) are drawn as the region above the curve over three tiles, so with the even-odd rule two of them leave the band between. The coverage is set per layer (0.4, 0.4, 0.38) and the level is the field's quantile. Masks: 1.6 + 1.2 + 0.7 KB gz. `config/paintMasks.test.ts` checks the seam, the determinism and that the checked-in files match the generator (`npm run paint`). The core lives in `config/paintMasks.ts` (typechecked, testable); `scripts/generate-paint-masks.mjs` only writes the files (Node 22.18 runs the `.ts` import).
- §1: the plan 7 soft edge was at the top (transparent → opaque at 45 %), not the bottom; it is on the still `paint` container now. Vite inlines assets under 4 KB as data URIs, so `vite.config.ts` keeps `src/assets/paint/` as files (`assetsInlineLimit`). The drift amplitudes are 14, −22 and 30 px, sampled every 1/16 of the loop.
- §1 colours: in the dark theme 22 %, 21 % and 22 % lightness at 60, 56 and 55 % alpha, saturation 42–50 %. The first values in the plan's range (26–34 %) failed the contrast test for Moss (muted text 4.0 : 1) and Moss and Tidewater (the Reserve fill under 3 : 1), so the range was lowered for every finish, as §1 says. The light theme keeps 84–90 %.
- §8: 70 % alpha passes 3 : 1 in every set and finish; it did not need to go up.
- §2: the measured lift uses the copy's text after `text-transform: uppercase`; the fallback stays 0.22 em.
- §2, after the review: WebKit gives no `font` shorthand for the copy (it cannot express `font-width` and `font-variant-emoji`, which the copy now has as longhands), so the lift is measured with a font string built from `font-style`, `font-weight`, `font-size` and `font-family`. WebKit also gives the size back a float step off (45.123455px for 45.123456px), so the "did the canvas take it" check compares the sizes as numbers within 0.01 px. The e2e reads computed lengths, not `offsetTop` (whole pixels).
- §1, after the review: the drift is sampled every 1/8 of the loop, not 1/16 (within 2.3 px of the sine at 30 px drift); the 1/16 keyframes cost 0.4 KB gz and took the main CSS over its limit.
- §9: the toggle e2e hits 3 px outside the drawn edge, not 4 (the hit box ends exactly at 4 px). The plan 7 crest tests in `games-and-surfaces.spec.ts` are gone (the paint tests replace them; one of them passed on a missing element). The plan 7 bite e2e waits 5 s instead of 3 (the bite takes 1.9 s now).

**After (2026-10-16, `vite build`, sizes gz):** main JS 103.91 KB (+0.13, limit +0.3), main CSS 26.50 KB (+0.36, limit +0.5), masks 1.6 + 1.2 + 0.7 KB (limit 6), `RunawayLetters` 6.13 + 0.58 KB (+0.37, **over** the +0.3 limit: the measurement, the WebKit font string and the leg rule), `finishes-team` 3.51 + 0.83 KB (+0.49, **over** the +0.3 limit: `flip`, the on-screen facing, the stop, the second arm and its keyframes).

**Perf (`npm run perf`, headed Chromium, the P0 build served next to this one and probed alternately, two runs each, same machine and hour):** hero drawing layers idle 54–56 before / 54 after, under the pointer 48–50 / 54–55; hero overdraw 10.8–11.6× / 11.1×; full scroll 18.9 / 19.2–19.3 ms mean, 0 long tasks in both. A layer list by element shows the one real change: the three crest strips became the three paint layers, and the still `header__paint` container now has a layer of its own (**+1**, against the +0 limit), because its soft-edge mask sits over composited children; the other differences between runs are the letters and the panel, which move between the two builds alike. GPU memory is not measured by the probe and is not written here. `npm run test:perf`: hero layers on Pixel 7 42 against the budget 40 (41 after plan 7), desktop hero overdraw 12.52 against 12.5 (passed after plan 7); the rest passes.
