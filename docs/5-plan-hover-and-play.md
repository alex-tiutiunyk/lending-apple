# Plan 5: hover and play

Builds on `0-plan-landing.md` … `4-plan-living-details.md`. Where this plan conflicts with an earlier one, this plan wins (plan-order note in plan 0). Everything not mentioned here keeps the earlier rules: no animation library, one rAF loop (`frameLoop.ts`), only `transform` and `opacity` in loops, visible without JS, all copy lives in `content/`, components stay under 150 lines, BEM class names (plan 2 §11), every motion goes through the plan 3 motion levels (`full` / `calm` / `off`) and their mixins and hooks, lazy chunks for anything most visits never see (plan 4 §11).

Goal: richer answers to the pointer (hover on the handle, the nav, the quiet hero link, the finish options, the stats), more life inside the blocks that still sit still (the lens list, the titanium card, the finishes render, the footer edge, the hero copy), Pip you can pick up and drop, headings whose letters all get their turn, and three layout fixes (footnote numbers, the titanium card, the exploded view spilling into the numbers). Nothing here is built yet.

## 0. Overrides of plans 0 to 4

| Earlier rule                                                                                  | Plan 5 change                                                                                                                    | Why                                                                  |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Plan 3 §1: the panel handle shows the accessibility glyph (a person in a circle)              | The handle shows the brand apple; a worm bites it on hover and while the panel is open (§1)                                      | asked for; the handle keeps its spoken name "Accessibility settings" |
| Plan 4 §1: one escape at a time on the whole page, every 10–15 s, from any title or paragraph | Paragraphs keep that schedule; headings get their own, more frequent one, 1–2 letters, every letter gets its turn (§9)           | headings are where a running letter reads as a gag                   |
| Plan 2 §1: Pip never leaves its ground line                                                   | Pip can be picked up with the pointer; released, it floats back down on one of seven rigs and lands on its line (§6)             | asked for; the ground line stays the only place Pip walks            |
| Plan 1: `hero__secondary` is a `button-quiet` (wash on hover)                                 | It draws its own outline on hover, nothing shared with `Pressable` (§3)                                                          | the quiet link should answer differently from the primary buttons    |
| Plan 2: the titanium card sits in columns 3–13 of the 12-column grid                          | Full width (`1 / -1`), sample left, text right, both centred (§8)                                                                | the offset card looked unfinished                                    |
| Plan 0 / `Numbers`: the reels roll once when the list enters view and then hold               | They still do; a hover replays one stat, one random stat ticks now and then at `full`, and the digits lean with the scroll (§12) | the stats were the only static block left                            |
| Plan 0 / `ExplodedView`: the sticky stage is exactly `100svh` and lets its content overflow   | The stage clips at `100svh` and its content is made to fit short viewports (§13)                                                 | on a 620 px tall window the labels and the phone paint over Numbers  |
| Plan 4 §11 budget                                                                             | Plan 5 may add at most **+3 KB gz** to the main bundle; the rest is lazy (§16)                                                   | the main bundle is far over the 60 KB target                         |
| `global.scss`: `ol[class]` drops its markers                                                  | The footnote list keeps its numbers, styled through `::marker` (§4)                                                              | the superscript refs point at numbers the list did not show          |
| `EmailBugs.tsx` owns the bug drawing                                                          | The bug art moves to `assets/svg/bug.tsx` and is shared with the lens bug (§5)                                                   | one bug, not two drawings                                            |
| Plan 3 §5a: every colour exists in four token sets                                            | Unchanged, and it applies to every new colour here (the worm, the wave line, the finish wash, the scratches)                     | the light theme and high contrast must not be forgotten per feature  |

## 1. Panel handle: the apple and the worm

Today the handle (`a11y-panel__handle`) shows the accessibility glyph as four strokes. It becomes the brand apple (the same `appleBodyPath` and `appleLeafPath` as `LivingMark`, static: no breathing, no draw), and on hover a worm bites a piece out of it, so it ends up looking like the logo it is not allowed to be.

**Behaviour.**

- Rest: whole apple with its leaf, `currentColor`, the same size as today's icon (`1.5rem / text-scale`).
- Hover or `:focus-visible` (≈ 900 ms): the apple grows a little (`scale` 1 → 1.12, 160 ms, `ease-out`), a worm pushes out of the right side of the body (three segments and two eye dots, accent colour, `scale` from the bite point then a short arc of `translate` + `rotate`, ≈ 260 ms), and bites: the bite circle on the right side opens in **three chomps** (`steps(3, jump-end)`, 240 ms; the apple jolts 1 px to the left on each chomp), then the worm settles in the bite, head out, and blinks once.
- Leave: not a mirror of the entrance. The worm slips back inside (200 ms), the bite **heals** with a smooth ease (300 ms, no steps), the apple scales back with a small overshoot (1.12 → 0.98 → 1, 300 ms). ≈ 500 ms in all.
- Open panel (`data-state='open'`): the apple stays bitten with the worm out, so the handle reads as "on". Closing plays the leave sequence.
- Touch: no hover; a tap opens the panel and shows the bitten state through the open rule.

**How.**

- CSS only. The sequences are keyframes on the icon's parts, played from `.handle:hover`, `.handle:focus-visible` and `.root[data-state='open'] .handle`, through `hover-motion` for the moving parts; the colour and the final bitten state also at `off` (a snap, no worm travel, the worm appears in place by `opacity`).
- The bite is a `<mask>` (white `<rect>`, black `<circle>` at about (20.6, 10.8) with r 3.2 in the 24-unit viewBox) over the body and leaf group. The circle animates by `transform: scale()` with `transform-box: fill-box; transform-origin: center` (the `r` property does not animate everywhere; a transform inside a mask does). The mask id comes from `useId`.
- The worm is a `<g>`: three `<circle r="1.4">` in a row and two `r="0.35"` eyes in `--color-bg`; `transform-origin` at the bite point; the blink is `scale(1, 0)` on the eyes for 80 ms.
- The worm sticks out ≈ 0.3 rem past the icon: the icon and the handle get `overflow: visible`. The handle's box and tap target do not change; only the icon transforms. The existing e2e test "closed, only the handle shows" keeps passing because at rest nothing leaves the handle.
- The icon moves out of `A11yPanel.tsx` (74 lines) into `A11yHandleIcon.tsx` (≈ 45 lines).
- Colours: worm in `--color-accent` (dark, light), `--color-text` in both high-contrast sets; `forced-colors`: `CanvasText`. The apple stays `currentColor` as today.

**Motion levels.** Hover motion: `full` and `calm`; at `off` the hover state snaps to the bitten apple with the worm in place. Not ambient: nothing moves while the pointer is away.

## 2. Section nav links: hopping letters

`section-nav__link` today only changes colour on hover. The label is one `<span data-nav-text>` that the runner indicator measures (`offsetLeft` / `offsetWidth`); the new effect must not change that box.

- On hover and `:focus-visible` the letters **hop in a wave**: each letter lifts 0.18 em and lands (one-shot keyframes `hop`, 360 ms, `ease-out`, `--i × 35 ms` delay), and as it lands its colour flashes to the accent and settles to `--color-text`. On leave only the colour fades back (the hop is a one-shot keyframe, so nothing runs backwards).
- Markup: `RollingText` already splits a label into `aria-hidden` letters with `--i` and keeps a visually hidden plain name (plan 4 §7.1). It gets an `effect` prop (`'roll'` default, `'hop'`); the markup is the same, only the stylesheet differs (`rolling-text--hop`). The nav renders `<span data-nav-text><RollingText label effect="hop" /></span>`, so the accessible name stays the plain label and the measured box is unchanged (the letters are `inline-block` with no extra spacing; the wrapper keeps the word's width).
- The link's `min-height` (`--tap-min`) leaves room for the lift; the nav keeps `overflow: visible`.
- The active link hops too. The `aria-current` state and the indicator are untouched; the e2e test "the nav marks the section in view and its phone matches the link text" measures the same span as before.
- `hover-motion`: no hop at `off` or on touch; the colour change stays. The nav is already outside the letter picker (`nav` is in `skipBlocksInside`).

## 3. Hero secondary link: it draws its own outline

`hero__secondary` ("See how it is built", `#design`) is a `button-quiet`: transparent, 1 px `--color-line-strong` border, accent wash on hover. It should answer differently from `Pressable` (no ring, no liquid fill, no magnet, no letter roll). Since it leads to the line drawing, it **draws itself**:

- Hover or `:focus-visible`: the plain border fades out while an accent line draws once around the pill, clockwise from the top-left, ≈ 480 ms, with a brighter "pen point" running at its head; when the line closes, the wash fades in (`transition-delay`) and the label shifts 2 px right.
- Leave: the line un-draws backwards (300 ms), the pen point runs back, the plain border returns.
- How: a `::before` ring (1 px border in `--color-accent`, `border-radius: inherit`) revealed by `mask: conic-gradient(from -90deg, black var(--draw), transparent 0)`, where `--draw` is a registered custom property (`@property --draw { syntax: '<percentage>'; inherits: false; initial-value: 0% }`) so it transitions. The pen point is a `::after` dot with `offset-path: inset(0 round var(--radius-pill))` and `offset-distance` transitioning 0 → 100 % over the same duration, so both stay in sync. Where `@property` or `offset-path` basic shapes are missing, the ring snaps fully on and the dot is not drawn: still a hover state, just without the drawing.
- `hover-motion` for the drawing; at `off` or on touch the wash alone, as today. High contrast: ring in `--color-text`; forced colours: no mask (the plain border stays, the system colours apply).
- Lives in `Hero.module.scss` on `.secondary` (keeps `button-base` and the quiet colours; the `button-quiet` mixin stays for other users).

## 4. Numbers footnotes: show the numbers

`numbers__footnotes` is an `<ol>` with a class, and `global.scss` sets `ol[class] { list-style: none }`, so the two notes have no numbers while the stats link to "Note 1" and "Note 2" through superscripts.

- `.footnotes { list-style: decimal }` with `::marker { color: var(--color-accent); font-variant-numeric: tabular-nums }`, so the marker matches the superscript refs. `padding-left: var(--space-5)` already leaves room.
- Keep the `<ol>`, the `id`s and the refs as they are; the e2e axe check already covers the list. No `::before` counter: `::marker` is the real list number for assistive tech.
- High contrast: the marker in `--color-text`.

## 5. Lens list: a bug that walks the edges

The three `features__lens` boxes (13 mm, 24 mm, 120 mm) are static. A **bug** walks along their borders and crawls over the gaps from one box to the next.

**Behaviour.**

- One bug on the whole list. It walks on the border line of a box at about 40 px/s (Pip walks at 38), clockwise. Its route hugs the three boxes as one loop: along the top edges left to right, hopping each gap (`--space-2`; legs tuck, 3 px lift), down the right side of the third box, back along the bottom edges right to left, up the left side of the first box.
- It pauses at random for 0.5–1.5 s and looks around (`rotate` ± 20°), and now and then turns back and walks the other way.
- The box the bug is on brightens its border (`--color-line-strong`) and dims again when the bug leaves.
- Pointer over a box: the bug on that box hurries to the next one (×3 speed), the way the email bugs flee a focused field.

**How.**

- Art: the bug from `EmailBugs.tsx` (`Bug`: six legs in two groups, shell, head) moves to `src/assets/svg/bug.tsx` and both use it. The lens bug is 0.6 rem, `aria-hidden`, absolutely positioned inside `.lenses` (`position: relative`), moved with `translate` and `rotate` only; the leg walk cycle is the existing keyframes.
- Route: `lensBugRoute.ts` (pure, tested) builds the polyline from the three box rects relative to the list (corners in order, gap segments flagged as hops), measured through one `ResizeObserver` on the list; the walk runs on `subscribeTick`, the hurry reads `subscribePointerFrame`. The bug's facing is the segment's direction.
- Code: `src/components/Features/LensBug.tsx` + `lensBugRoute.ts`, mounted from `Features.tsx` after mount, in a lazy chunk `features-life` shared with the titanium extras (§11), loaded only while `useAmbientMotion()` is true (§16).
- Ambient: only at `full` and while the camera card is awake (`data-awake` is already on the card through `useAwakeWhileInView`; the bug subscribes to ticks only then). `calm` and `off`: not rendered. High contrast: bug in `--color-text`, no border brightening.

## 6. Pip: pick it up, and seven ways down

Pip is a `position: fixed` `<aside>` with a poke `<button>` inside; it moves only along `--pip-x`. It becomes draggable: the pointer can lift it anywhere in the viewport, and when released it floats back to its line on one of seven rigs, a different one each time.

**Pick-up.**

- `pointerdown` on the poke button starts a possible drag; a move of more than 6 px makes it a drag (`setPointerCapture`), less is a click and stays a poke. After a drag the click is swallowed, so a drag is never a poke.
- While carried (`data-act="carried"`, a new act that cannot start by itself): Pip hangs from the pointer with `--pip-x` / `--pip-y`, the body tilts the way it is pulled (from the pointer velocity, ± 15°), legs dangle and swing with momentum, eyes `wide`, a line from `mascotCopy.carried` ("Hey. Put me down.", "I have feet, you know.", "Mind the camera."). The bubble follows.
- Held through the existing `hold` with a new reason `'drag'`: the brain's tick stands still, avoidance and outside requests see `data-held` and keep off, Pip's x is clamped to the viewport minus 16 px.
- Touch: the poke button gets `touch-action: none` (it is 48 px wide, so page scrolling is not affected elsewhere), so a finger can carry Pip without scrolling the page.
- Keyboard: no drag equivalent; poking stays the keyboard action. Pip's name and the live region do not change.

**Release.** The rig is picked from a shuffled bag of seven (no repeat until all seven have played), horizontal release velocity carries into the descent (damped), so a flick throws Pip. Pip may be grabbed again in the air: a `pointerdown` on it during a descent drops the rig and carries it again.

| #   | Rig       | Descent                                                                                                                      | Landing line (`mascotCopy.landed`) |
| --- | --------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 1   | Parachute | round canopy opens above with a snap, slow fall (≈ 160 px/s), sways side to side, canopy folds on the ground                 | "Geronimo."                        |
| 2   | Propeller | a rotor beanie spins up, straight fall (≈ 260 px/s) with a wobble, blades slow and droop after the landing                   | "Is this what hair feels like?"    |
| 3   | Umbrella  | opens, slow sway (≈ 180 px/s); in the last 120 px it turns inside out and Pip drops the rest fast                            | "Practically perfect."             |
| 4   | Balloons  | three balloons on strings; Pip rises 20 px first, sinks slowly (≈ 140 px/s); one balloon pops and the rest fall faster (320) | "Up, briefly."                     |
| 5   | Glider    | the airplane wings (existing art) fold out; an S-shaped glide (≈ 240 px/s down, 300 px/s sideways) that lands running        | "Flight 18, now boarding."         |
| 6   | Leaf      | Pip holds a leaf over its head; wide zigzags (≈ 150 px/s), tumbles once                                                      | "Autumn came early."               |
| 7   | Bubble    | a soap bubble around Pip, the slowest (≈ 120 px/s), drifts; it pops on the ground and Pip sits for a moment                  | "Pop."                             |

- Landing: a short `land` act (squash and recover, feet step) then `walk`; the line goes through the live region as the combo lines do (it answers the reader's own action). If Pip lands over an avoid zone it steps aside as today (`useMascotAvoidance` re-checks on the act change).
- Movement: the vertical path and the per-rig horizontal drift are pure functions in `mascotDescent.ts` (tested); the ticks run in `useMascotDrag.ts` on `subscribeTick`, writing `--pip-x` / `--pip-y`. At the landing the brain gets the x through a new control `placeAt(x)`. The canopy sway, rotor spin, balloon pop and bubble pop are CSS keyframes on the rig art (`MascotRig.tsx`, mounted only while a rig is active), `transform` and `opacity` only.
- Pip is `fixed`, so scrolling during a carry or a descent changes nothing. Tab hidden during a descent: Pip lands at once.
- `useMascotBrain.ts` is already 155 lines: `hold` and `stepAside` move out into `useMascotControls.ts` with `placeAt`, so neither file grows past the limit.
- Budget: the rigs and the descent code are a lazy chunk `mascot-rigs` fetched on the first `pointerdown` on Pip (like the Back to top flight, plan 4 §7.3); the drag itself (≈ 1 KB) lives in the Pip chunk.

**Motion levels.** Pip exists only at `full` (plan 2), so there is nothing to gate; the descent is a reaction to the reader's action.

## 7. Footer edge: a living line

The footer's `border-top: 1px solid var(--color-line)` becomes a line that moves.

- The border is replaced by an `aria-hidden` SVG strip at the footer's top, 8 px tall, `pointer-events: none`: a **sine wave** (`<pattern>` of one 240 px tile with amplitude 2 px, stroke 1 px in `--color-line`, `preserveAspectRatio="none"`) that **travels** slowly to the right (a `<g>` with two tiles, `translateX` of one tile width, 12 s, linear, infinite), and once every 6 s an **accent pulse** runs along it left to right (a second path copy with `stroke-dasharray: 0.08 1` and `stroke-dashoffset` keyframes, like the drawing heads of plan 4 §8).
- Optional extra, tuned by eye: the wave amplitude grows with the scroll speed (`transform: scaleY(calc(1 + min(2, abs(var(--scroll-v)) * 2)))` on the wave group, `--scroll-v` is already on `<body>` from `useDocumentProgress`), so fast scrolling ruffles the line and it calms down again.
- Ambient: travel and pulse only at `full` and while the footer is awake (`useAwakeWhileInView` on the footer root; `when-awake`). `calm` and `off`: the static wave (still nicer than a flat rule). High contrast: a flat 2 px line in `--color-line` again (3 : 1 holds). Forced colours: `CanvasText`, static.
- The rocket anchor box and Pip's avoid zone are untouched; the strip sits inside the footer's `position: relative` box.

## 8. Titanium card: full width

`features__card--titanium` sits in grid columns `3 / 13` on `lg`, so it starts two columns in and ends flush right: it looks unfinished.

- `lg`: `grid-column: 1 / -1`, two equal columns (`minmax(0, 1fr) minmax(0, 1fr)`), the sample on the left (`justify-self: center; width: min(100%, 32rem)`), title and body on the right, both columns vertically centred. `md` keeps today's two-column layout, phones stack.
- The sample's SVG (viewBox 320 × 210) keeps its aspect; its `max-width` stops it from becoming a 600 px wide corner.
- Reveal values (`--reveal-to`, `--reveal-delay`) unchanged.

## 9. Headings: every letter gets to run

Plan 4 §1 picks one block anywhere on the page every 10–15 s, 1–3 letters. That stays for **paragraphs**. **Headings** (`h1`, `h2`, `h3`: the hero title, the section titles, the feature card titles) get their own schedule, automatically for any heading text, no per-component work:

- Each heading that is settled and fully in view runs its own timer: a first escape 2–4 s after it settles, then every 5–8 s, **1 or 2 letters** per escape (never two from the same word), with shorter runs than the paragraph letters (20–80 px, 1.5–2.5 s) so they stay near their title.
- Every letter gets its turn: a per-heading bag of letter spots, drawn without replacement until empty, then refilled, so over a long look at a title all of its letters have run.
- At most two headings run at once on the whole page, and a heading never runs while a paragraph escape is in progress inside the same section (one gag at a time per section).
- The chase (plan 4 §1) stays on paragraph escapes only.
- Everything else is as in plan 4: same overlay, same runner and legs, the Custom Highlight API hides the glyph, `isSettled`, the skip lists (`[aria-hidden]`, `[data-pip-avoid]`, the nav, links, buttons; the panel title and Pip's bubble are already skipped), hover makes a letter hurry home, tab hidden ends every escape, gated by `full`, no high contrast, no plain font.
- Code: `headingScheduler.ts` (pure: per-heading timers and bags, tested) next to `letterPicker.ts`; `useRunawayLetters.ts` runs both schedulers over one overlay. The letters chunk grows by ≈ 0.6 KB.

## 10. Finishes options: a richer hover

`finishes__option` today: border to `--color-line-strong`, swatch `scale(1.1)`.

- **Swatch drop and ripple:** the swatch grows to 1.15 and a ring in the finish colour expands out of it (`::after`, `scale` 1 → 2.2, opacity 0.6 → 0, 500 ms).
- **Wash in the finish colour:** each option carries its own hue (`--option-h/s/l` inline from `specs.finishes`); on hover the option's background is that colour at 8 % and the border at 40 %, so the row previews what picking it does. The name moves 2 px right; the note brightens.
- **The render previews the finish:** while an option is hovered, `Finishes.tsx` writes the hovered finish's `--accent-h/s/l` onto the `.render` element (inline style on `pointerenter`, removed on `pointerleave`), and the render lifts a little (`scale(1.02)`); the gradient stops transition (`transition: stop-color 300ms`). Only the render changes, never the page: the page still follows a pick. The bird (§11) flaps once on a preview change.
- Keyboard: the focused option shows the same wash and the render preview, so Tab through the options previews them.
- `hover-motion` for the moving parts; the wash and the preview also at `off` (a colour change, no motion). Touch: none of it (there is no hover). High contrast: no wash (surfaces stay opaque), border in the finish colour at full opacity, the render preview stays. Forced colours: unchanged.
- The e2e tests "finish picker retints the page" and "rapid finish changes end on the last pick" stay valid: a hover never touches `<html>`.

## 11. Finishes render: a bird on the camera. Titanium card: leaders, light and scratches

**The bird.** `finishes__render` (the back view of `PhoneRender`) gets a visitor: a small bird that lands on the camera plateau.

- Arrival: it flies in from outside the phone with four wing flaps (an arc of `translate`, wings `scale(1, ±1)` on 120 ms steps), lands on the top edge of the plateau (`back.plateau` from `phone-geometry.ts`, so it fits at every size), folds its wings, hops once.
- Perched (4–8 s): it tilts its head, looks at its reflection in a lens and pecks at it twice (the lens flashes a small highlight), ruffles. Then it leaves the way it came. It is back after 10–20 s; one time in four, two birds (the second lands on the flash).
- Reactions: a finish change (the render tilts) makes it flap and lift 6 px, then settle; a hover over the render makes it turn its head toward the pointer (`subscribePointerFrame`, head `rotate` ± 25°).
- Art: body, head, beak, tail, two legs, two wings, ≈ 12 units tall in phone coordinates; `aria-hidden`; colour `--color-text` with a `--color-accent` beak. `PhoneRender` gets a `children` slot rendered inside the SVG after the back group, so overlays sit in phone coordinates.
- Code: `src/components/Finishes/CameraBird.tsx` + `birdSchedule.ts` (pure, tested); the schedule runs on timers, the flight on `subscribeTick`. A lazy chunk `finishes-bird`, loaded after mount only while `useAmbientMotion()` is true and the render is awake (`useAwakeWhileInView` on the render).
- Motion levels: ambient. `full` and awake: everything. `calm`: the bird sits still on the plateau (no arrival, no pecking). `off`: no bird. High contrast: bird and beak in `--color-text`; the render label is unchanged.

**The titanium card** (`features__card--titanium`, `TitaniumSample`): today a static corner with one sheen when seen.

- **Leaders draw on view:** when `data-sheen='run'` fires (the existing `isSampleSeen`), the three callout dots pop (`scale` 0 → 1), the dashed leaders draw (`stroke-dashoffset`, `pathLength={1}`) and the callouts fade in, staggered 120 ms, before the sheen. CSS only, `motion-safe`; at `off` they are simply there.
- **Light sweep on the band, ambient:** a soft highlight (a skewed `<rect>` with a linear gradient, clipped to the band through a `<clipPath>`) crosses the band every 7 s, `translate` only, at `full` while the card is awake (`when-awake`).
- **Scratches as patina, on hover:** "wears scratches as patina, not damage": every hover over the sample draws one new hairline scratch on the band (six pre-drawn `<line>`s with `stroke-dashoffset`, revealed one per hover by a counter in `data-scratches`, 0.6 px, `--finish-shell-light` at 70 %), up to six; once all six are there they fade out together over 30 s and the count starts over. `hover-motion`; nothing at `off` or on touch. High contrast: scratches in `--color-text` at 50 %.
- The leaders and the light sweep are CSS in the main bundle (small); the scratch counter joins the `features-life` chunk (§5, §16).

## 12. Numbers: the stats move

The reels (`SlotNumber`) roll once into view and then hold. Three additions, each small:

- **Hover / focus replays one stat:** pointer over a `.stat` (or focus on its footnote ref) spins that stat's reels one full turn and lands them again (`useCountUp` restarted with a 700 ms duration through a `replay` counter prop), the unit flips once (`rotateX` 360°). `hover-motion`; at `off` nothing.
- **Ambient tick:** at `full` while the list is awake, every 6–9 s one random stat's last column slips one notch down and back (`--reel` +1 then back over 400 ms, like a flip clock catching up) with a glint across the digits. The tick always returns to the final digit, so the e2e tests "counters stay rolled" and "reads final stat values" hold (the readable value is a separate hidden span anyway).
- **Lean with the scroll:** the reels skew with the scroll speed, `transform: skewX(clamp(-6deg, var(--scroll-v) * -4deg, 6deg))` on `.reels` (`--scroll-v` on `<body>`, plan 4 §13), so a fast scroll drags the digits and they spring back; scroll-driven, so `full` and `calm`; the value eases back to 0 within half a second, so idle frames stay at zero at `off` (the writer already stops there).
- Markup unchanged apart from the `data-stat` hover hook on `.stat`; the reels stay `aria-hidden`.

## 13. Exploded view spilling into Numbers

Measured in Chromium with the dev server (`#inside` at the end of its pin, `--p` = 1), positions in viewport px:

| Viewport   | Sticky stage box | Stage content (copy + labels) | 3D layers, lowest edge | Numbers starts | Spill into Numbers            |
| ---------- | ---------------- | ----------------------------- | ---------------------- | -------------- | ----------------------------- |
| 1280 × 800 | −120 … 680       | 24 … 640                      | 636                    | 680            | none (title under the header) |
| 1280 × 620 | −60 … 560        | 24 … **676**                  | **676**                | 560            | **116 px**                    |
| 390 × 844  | −100 … 744       | −16 … 211                     | 676                    | 744            | none                          |

The stage is `height: 100svh` with `overflow` visible and `align-items: center`, so on a short window the content (title, intro, seven labels with their details) is taller than the stage: the title slides under the header and the last labels and the rotated phone paint over the top of the Numbers section while the stage is pinned and after it lets go.

**Fix.**

- The stage clips: `.stage { overflow: clip }` (a sticky element may clip its own content; only an _ancestor_ with hidden overflow breaks the pin). Nothing from the stage can paint outside its `100svh` box.
- The content is made to fit so the clip never cuts anything: below `height: 46rem` the layer details (`.layer-detail`) are visually hidden the way they are below `md`, the label gap drops to `--space-1`, and the title uses `--step-2`; below `height: 40rem` the intro is hidden too. The scene's `.stack` height already scales with `svh`.
- `align-items: center` becomes `start` on the copy column (`align-self: start`), so when something still does not fit it is the bottom that goes, never the title under the header.
- Numbers keeps its `padding-block` and its `content-visibility: auto`; no z-index games, so the backdrop particles still show through both.
- Static scene (`off`, text ≥ 150 %) is unchanged: the stage is static with `height: auto`.
- Checked in the e2e layout test (§15) at 1280 × 620, 1280 × 800 and 390 × 844 through the whole pin.

## 14. Hero: the single line, and words that lift

The hero already has the word rise, the outline draw, the float, the boot, the parts and the parallax. Two additions on the copy side, which is the part that holds still:

**The line leaves the phone.** "Drawn again from a single line": once the hero outline has finished drawing (`--dur-draw-total`, 1.8 s), the stroke **continues off the phone**: an accent hairline starts at the body path's top-left corner, loops out of the phone and runs under the headline, ending with a small flourish under its last word, like a signature. Then it stays as a faint guide (opacity 0.25).

- Geometry: two points measured after mount (the outline's `[data-part='body']` path start, and the rect of the last `.word` span of the h1), joined by one cubic and the underline segment; drawn as an absolutely positioned `aria-hidden` SVG over the hero, `pathLength={1}`, `stroke-dashoffset` 1 → 0 over 1.1 s, `vector-effect: non-scaling-stroke`. Measured by the `ResizeObserver` that `HeroExtras` already runs (it re-measures on text scale and resize), so the line follows the layout; on phones (stacked layout) it runs from the phone's top-left up to the title's last line.
- Start time: the line lives in the `hero-extras` chunk, so it starts at `max(0, 1.8 s − time since navigation start)` through an inline `animation-delay`: after the outline on a fast load, at once on a slow one.
- Ambient: at `full` while the hero visual is awake, a light point runs along the line from the phone to the word every 8 s (the dash-head trick, 900 ms), the flourish brightens when it arrives.
- Motion levels: the draw is `motion-safe` (a one-shot, so `full` and `calm`); the travelling light only at `full`; at `off` the line is shown complete and still. Without JS or before hydration: no line (it needs the measurement), nothing flashes. High contrast: line in `--color-text`; forced colours: `CanvasText`.
- The LCP element (the headline text) and the prerendered HTML are unchanged.

**Words lift on hover.** The h1 words are spans already (`.word`): `hover-motion` lifts a hovered word 0.06 em with a colour sweep to the accent and back (200 ms). Keyboard has nothing to focus here, so nothing for `:focus-visible`. The runaway letters keep working on the h1: a lifted word moves its highlight range with it, and the copy letter reads the block rect each frame, so it follows.

## 15. Tests (draft)

- **Unit:** the lens bug route (three rects → a closed polyline with two hops, order and facing); the heading scheduler (first delay, interval, bag drawn without replacement, the two-headings cap, one gag per section); the descent functions (seven rigs reach y = 0, horizontal drift stays within bounds, the bag never repeats within seven); the bird schedule; `RollingText` with `effect="hop"` keeps the plain name; `reelPositions` is unchanged and the tick returns to the final digit; the new colours in `config/contrast.test.ts` (worm, wave line, finish wash border, scratches) in all four token sets.
- **E2e:**
  - Panel: the handle is still named "Accessibility settings", the worm and the bite are inside the handle box at rest ("closed, only the handle shows" stays), hover shows the bite, the open panel keeps it, `off` snaps without running animations.
  - Nav: the measured link text box is the same before and after a hover; the accessible names are the plain labels.
  - Hero secondary: the link keeps its name and `href`; at `off` no running animation on hover.
  - Footnotes: the list items have visible markers "1." and "2." (computed `list-style-type`), the refs still jump to them.
  - Lens bug: present and moving at `full` with the card in view, absent at `calm` and `off`, in high contrast it is `--color-text`.
  - Pip: a 6 px move is a poke, a 40 px drag is not; after a release Pip ends on its ground line with `data-act="walk"`, seven releases play seven different rigs, the live region gets the landing line, a drop over the footer links ends off the links ("keeps off footer links" extended).
  - Footer line: static at `calm` and `off`, animations running only while the footer is in view at `full`.
  - Headings: at `full`, every heading in view gets an escape within 8 s; the text and the box are unchanged (the plan 4 test, run per heading); never more than two headings running.
  - Finishes: a hover never changes `--accent-h` on `<html>`; the render's inline value matches the hovered finish and clears on leave; the bird is absent at `off`.
  - Numbers: the readable values are unchanged during a hover replay and an ambient tick; at `off` nothing runs.
  - Exploded view: at 1280 × 620, 1280 × 800 and 390 × 844, stepping through the pin, no stage descendant's rect leaves the stage box, and the title's top is below the header at `p = 0`.
  - Hero: the line exists after hydration, is complete at `off`, absent without JS; the `off` test's running-animation count stays 0.
  - The `off` e2e test (animations 0, idle rAF 0) and the `calm` test keep passing with everything above.
- **Perf:** `test:perf` unchanged at default settings (the lens bug, the bird and the Numbers tick are ambient ticks like Pip's; the descent runs only after a drag). `check:cycles` and `check:unused` stay green: the shared bug art is an asset module, the rigs and the bird are lazy chunks without imports back into their hosts.

## 16. Budget

Measured with `vite build`, written into the README like the earlier plans.

| Chunk                                 | Limit        | What goes in                                                                                                                                                                                                          |
| ------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Main bundle                           | **+3 KB gz** | handle apple and worm, nav hop CSS, hero secondary ring, footnote markers, titanium layout, leaders and light sweep, finish option hover and preview, Numbers hover/tick/lean, stage fit, hero word lift, footer wave |
| `features-life` (new, lazy)           | ≤ 2 KB gz    | lens bug, titanium scratch counter; loaded after mount at `full`                                                                                                                                                      |
| `finishes-bird` (new, lazy)           | ≤ 1.5 KB gz  | the bird, its schedule; loaded after mount at `full` while the render is awake                                                                                                                                        |
| `mascot-rigs` (new, lazy)             | ≤ 3.5 KB gz  | seven rigs, descent math, rig CSS; loaded on the first `pointerdown` on Pip                                                                                                                                           |
| Pip chunk (today 6.1 KB + 2.8 KB CSS) | +1.2 KB gz   | drag, `carried` and `land` acts, `placeAt`, the copy lines                                                                                                                                                            |
| `hero-extras` (today 1.5 KB)          | +1 KB gz     | the single line and its light                                                                                                                                                                                         |
| `runaway-letters` (today 3.4 KB)      | +0.6 KB gz   | the heading scheduler                                                                                                                                                                                                 |

## 17. Work order (draft)

Fixes and CSS-only hovers first, then the lazy scenes, Pip last (the riskiest: pointer capture inside a button that must still poke).

| #   | Step                                                                                             | Done when                                                                                              |
| --- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| H1  | Fixes: footnote numbers (§4), titanium card width (§8), exploded stage fit and clip (§13)        | markers visible, card full width on `lg`, no spill at the three viewports, title below the header      |
| H2  | CSS hovers: handle apple and worm (§1), nav hop (§2), hero secondary ring (§3), words lift (§14) | all four at `full`, snap at `off`, names unchanged, panel e2e green                                    |
| H3  | Finish options hover and render preview (§10), Numbers hover, tick and lean (§12)                | preview never touches `<html>`, readable values stable, `off` e2e green                                |
| H4  | Footer living line (§7), titanium leaders and light sweep (§11)                                  | static at `calm` / `off`, moving only while in view at `full`, HC flat line                            |
| H5  | Heading scheduler (§9)                                                                           | every heading in view escapes, 1–2 letters, bag without replacement, paragraphs unchanged, text intact |
| H6  | Lazy scenes: lens bug (§5), bird (§11), hero line (§14), titanium scratches (§11)                | each absent at `off`, still at `calm`, moving at `full` and awake; chunks within §16                   |
| H7  | Pip drag and the seven rigs (§6)                                                                 | poke vs drag separated, seven rigs, landing on the line, avoid zones respected, mascot e2e green       |
| H8  | Lint, typecheck, unit, e2e, perf, cycles, unused, README (motion, accessibility, budget numbers) | all green; §16 numbers measured and written into README "Known gaps"                                   |

## 18. Open questions

Decided by eye once built, unless stated.

- §1: the apple replaces the accessibility glyph entirely. If the tab is no longer found by readers, the fallback is the glyph at rest that cross-fades into the apple on hover, which keeps all of §1.
- §5: one bug for the three boxes, or one per box that swap places? One, unless the loop looks empty.
- §6: whether a mid-air poke (not a drag) should pop the rig and drop Pip fast. Not in the first build.
- §7: the scroll-speed ruffle is an extra; keep it only if it reads as the line reacting, not as jitter.
- §9: headings every 5–8 s may be too much on the hero, which is in view for a long time: the hero h1 may get a longer interval (10–15 s) if it reads as a glitch.
- §12: the lean at 6° may be too much with tabular digits; 4° is the fallback.
- §14: whether the line should also run on phones (the stacked layout puts the phone below the copy, so it would run upward across the lede).

## 19. Implementation notes

Filled in during the build. Where the build differs from the text above, the build is the rule.
