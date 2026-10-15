# Plan 5: hover and play

Builds on `0-plan-landing.md` … `4-plan-living-details.md`. Where this plan conflicts with an earlier one, this plan wins (plan-order note in plan 0). Everything not mentioned here keeps the earlier rules: no animation library, one rAF loop (`frameLoop.ts`), only `transform` and `opacity` in loops, visible without JS, all copy lives in `content/`, components stay under 150 lines, BEM class names (plan 2 §11), every motion goes through the plan 3 motion levels (`full` / `calm` / `off`) and their mixins and hooks, lazy chunks for anything most visits never see (plan 4 §11).

Goal: richer answers to the pointer (hover on the handle, the nav, the quiet hero link, the finish options, the stats), more life inside the blocks that still sit still (the lens list, the titanium card, the finishes render, the footer edge, the hero copy), Pip you can pick up and drop, headings whose letters all get their turn, and three layout fixes (footnote numbers, the titanium card, the exploded view spilling into the numbers). Nothing here is built yet.

## 0. Overrides of plans 0 to 4

| Earlier rule                                                                                  | Plan 5 change                                                                                                                                                                                      | Why                                                                  |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Plan 3 §1: the panel handle shows the accessibility glyph (a person in a circle)              | The handle shows the brand apple; a worm bites it on hover and while the panel is open (§1)                                                                                                        | asked for; the handle keeps its spoken name "Accessibility settings" |
| Plan 4 §1: one escape at a time on the whole page, every 10–15 s, from any title or paragraph | Paragraphs keep that schedule and the picker stops offering headings; headings get their own, more frequent one, 1–2 letters, every letter gets its turn; up to three escapes may run at once (§9) | headings are where a running letter reads as a gag                   |
| Plan 2 §1: Pip never leaves its ground line                                                   | Pip can be picked up with the pointer; released, it floats back down on one of seven rigs and lands on its line (§6)                                                                               | asked for; the ground line stays the only place Pip walks            |
| Plan 1: `hero__secondary` is a `button-quiet` (wash on hover)                                 | It draws its own outline on hover, nothing shared with `Pressable` (§3)                                                                                                                            | the quiet link should answer differently from the primary buttons    |
| Plan 2: the titanium card sits in columns 3–13 of the 12-column grid                          | Full width (`1 / -1`), sample left, text right, both centred (§8)                                                                                                                                  | the offset card looked unfinished                                    |
| Plan 0 / `Numbers`: the reels roll once when the list enters view and then hold               | They still do; a hover replays one stat, one random stat ticks now and then at `full`, and the digits lean with the scroll (§12)                                                                   | the stats were the only static block left                            |
| Plan 0 / `ExplodedView`: the sticky stage is exactly `100svh` and lets its content overflow   | The stage clips at `100svh` and its content is made to fit short viewports (§13)                                                                                                                   | on a 620 px tall window the labels and the phone paint over Numbers  |
| Plan 4 §11 budget                                                                             | Plan 5 may add at most **+3 KB gz** to the main bundle; the rest is lazy (§16)                                                                                                                     | the main bundle is far over the 60 KB target                         |
| `global.scss`: `ol[class]` drops its markers                                                  | The footnote list keeps its numbers, styled through `::marker` (§4)                                                                                                                                | the superscript refs point at numbers the list did not show          |
| `EmailBugs.tsx` owns the bug drawing                                                          | The bug art and its walk styles move to `assets/svg/bug.tsx` + `bug.module.scss` and are shared with the lens bug (§5)                                                                             | one bug, not two drawings                                            |
| `_tokens.scss`: the five `--finish-*` colours are declared once on `:root`                    | They come from a mixin, declared on `:root` and again on the finishes render, so a local `--accent-*` reaches the gradients (§10)                                                                  | custom properties resolve where they are declared, not where read    |
| Plan 4 §1 code: `useRunawayLetters` holds one escape (one block, one timer, one letter list)  | It holds a list of escapes; the per-escape work moves to `escapeRunner.ts` (§9)                                                                                                                    | headings and paragraphs run at the same time                         |
| Plan 3 §5a: every colour exists in four token sets                                            | Unchanged, and it applies to every new colour here (the worm, the wave line, the finish wash, the scratches)                                                                                       | the light theme and high contrast must not be forgotten per feature  |

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

- Art: the bug from `EmailBugs.tsx` (`Bug`: six legs in two groups, shell, head) moves to `src/assets/svg/bug.tsx` **with its styles**: the legs, shell and head classes and the leg walk keyframes live in `EmailBugs.module.scss` today and go to `bug.module.scss` next to the art; `EmailBugs.module.scss` keeps only the spot, flee and error states and the `[data-state]` rules. The lens bug is 0.6 rem, `aria-hidden`, absolutely positioned inside `.lenses` (`position: relative`), moved with `translate` and `rotate` only; the leg walk cycle is the shared keyframes, switched on by a `data-walking` attribute.
- Route: `lensBugRoute.ts` (pure, tested) builds the polyline from the three box rects relative to the list (corners in order, gap segments flagged as hops), measured through one `ResizeObserver` on the list; the walk runs on `subscribeTick`, the hurry reads `subscribePointerFrame`. The bug's facing is the segment's direction.
- Code: `src/components/Features/LensBug.tsx` + `lensBugRoute.ts`, mounted from `Features.tsx` after mount, in a lazy chunk `features-life` shared with the titanium extras (§11), loaded only while `useAmbientMotion()` is true (§16).
- Ambient: only at `full` and while the camera card is awake (`data-awake` is already on the card through `useAwakeWhileInView`; the bug subscribes to ticks only then). `calm` and `off`: not rendered. High contrast: bug in `--color-text`, no border brightening.

## 6. Pip: pick it up, and seven ways down

Pip is a `position: fixed` `<aside>` with a poke `<button>` inside; it moves only along `--pip-x`. It becomes draggable: the pointer can lift it anywhere in the viewport, and when released it floats back to its line on one of seven rigs, a different one each time.

**Pick-up.**

- `pointerdown` on the poke button starts a possible drag; a move of more than 6 px makes it a drag (`setPointerCapture`), less is a click and stays a poke. After a drag the click is swallowed, so a drag is never a poke.
- While carried (`data-act="carried"`, a new act that cannot start by itself and never runs out: `remainingMs` is `Infinity`, like `hurry`, because the held branch of the brain's tick still counts down every act other than `walk` and `hurry`, and a counted-down `carried` would start `walk` in the reader's hand): Pip hangs from the pointer with `--pip-x` / `--pip-y` (the root's `translate` gets the second axis: `var(--pip-x) var(--pip-y, 0)`; its transition is on `transform` and `opacity`, so the drag does not lag), the body tilts the way it is pulled (from the pointer velocity, ± 15°), legs dangle and swing with momentum, eyes `wide`, a line from `mascotCopy.carried` ("Hey. Put me down.", "I have feet, you know.", "Mind the camera."). The bubble follows.
- Held through the existing `hold` with a new reason `'drag'`: the brain's tick stands still, avoidance and outside requests see `data-held` and keep off (`useMascotRequests` already requires `walk` and no `data-held`), Pip's x is clamped to the viewport minus 16 px.
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

- Landing, in this order: `placeAt(x)` gives the brain the landing x, `hold('drag', false)` lifts the hold, **then** the `land` act starts (squash and recover, feet step) and `walk` follows. The order matters: `useMascotAvoidance` re-checks the spot on the act change and calls `stepAside`, and `stepAside` refuses while any hold is set, so a hold lifted after `land` would leave Pip standing on a footer link. The line goes through the live region as the combo lines do (it answers the reader's own action).
- Movement: the vertical path and the per-rig horizontal drift are pure functions in `mascotDescent.ts` (tested); the ticks run in `useMascotDrag.ts` on `subscribeTick`, writing `--pip-x` / `--pip-y`. At the landing the brain gets the x through a new control `placeAt(x)`. The canopy sway, rotor spin, balloon pop and bubble pop are CSS keyframes on the rig art (`MascotRig.tsx`, mounted only while a rig is active), `transform` and `opacity` only.
- Pip is `fixed`, so scrolling during a carry or a descent changes nothing. Tab hidden during a descent: Pip lands at once.
- `useMascotBrain.ts` is already 156 lines, over the limit before anything is added: the first step of H7 moves `hold`, `stepAside`, `turnTo` and `currentAct` out into `useMascotControls.ts` with `placeAt`, so neither file is past the limit afterwards.
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
- Code. `useRunawayLetters.ts` (203 lines today) holds exactly one escape: one `block`, one `blockTop`, one `timer`, one `letters` array, and `finish` tears the whole thing down. Up to three escapes at once (two headings and a paragraph in different sections) need a list, so the hook is split:
  - `escapeRunner.ts` (pure apart from DOM reads, tested with jsdom): one escape, from `hideGlyph` and `copyGlyph` through the per-frame step to `finish`; it owns its block, letters, runner and chaser, and exposes `step(now, pip)`, `hurryNear(x, y)` and `end()`.
  - `headingScheduler.ts` (pure, tested): per-heading timers and bags, the two-headings cap, the one-gag-per-section rule.
  - `letterPicker.ts`: `blockSelector` splits into `paragraphSelector` (`p`) and `headingSelector` (`h1, h2, h3`), so the paragraph picker no longer offers headings and the two schedulers never book the same block.
  - `useRunawayLetters.ts`: the paragraph timer as today plus the heading scheduler, a `Set` of running escapes, one tick subscription while the set is not empty, one pointer subscription, the visibility handler ending every escape. Under 150 lines once the escape work is out.
  - The chase (plan 4 §1) stays with the paragraph escape: `startChase` is called only for escapes the paragraph timer started.
  - The letters chunk grows by ≈ 1.2 KB (the refactor plus the scheduler), see §16.

## 10. Finishes options: a richer hover

`finishes__option` today: border to `--color-line-strong`, swatch `scale(1.1)`.

- **Swatch drop and ripple:** the swatch grows to 1.15 and a ring in the finish colour expands out of it (`::after`, `scale` 1 → 2.2, opacity 0.6 → 0, 500 ms).
- **Wash in the finish colour:** each option carries its own hue (`--option-h/s/l` inline from `specs.finishes`); on hover the option's background is that colour at 8 % and the border at 40 %, so the row previews what picking it does. The name moves 2 px right; the note brightens.
- **The render previews the finish:** while an option is hovered, `Finishes.tsx` writes the hovered finish's `--accent-h/s/l` onto the `.render` element (inline style on `pointerenter`, removed on `pointerleave`), and the render lifts a little (`scale(1.02)`); the gradient stops transition (`transition: stop-color 300ms`). Only the render changes, never the page: the page still follows a pick. The bird (§11) flaps once on a preview change.
  - **Why that needs a token change.** The render's gradients read `--finish-shell`, `--finish-shell-light`, `--finish-shell-dark`, `--finish-screen-a` and `--finish-screen-b`, and those are declared once on `:root` in `_tokens.scss` from `var(--accent-h)`. A custom property resolves its `var()`s where it is declared, so `--accent-h` set on the render would not reach the gradients. The five declarations move into a mixin `finish-tokens` in `_tokens.scss`, included on `:root` as today and again on `.render` in `Finishes.module.scss`, where they resolve against the render's own `--accent-*`. No theme set redeclares them (checked), so one mixin covers all four token sets.
  - `PhoneRender` takes `ref` (React 19 passes it as a prop) so `Finishes.tsx` can write the style, and `children` (§11). It is 120 lines: the `<defs>` move to `PhoneRenderDefs.tsx` so both files stay under 150.
- Keyboard: the focused option shows the same wash and the render preview, so Tab through the options previews them.
- `hover-motion` for the moving parts; the wash and the preview also at `off` (a colour change, no motion). Touch: none of it (there is no hover). High contrast: no wash (surfaces stay opaque), border in the finish colour at full opacity, the render preview stays. Forced colours: unchanged.
- The e2e tests "finish picker retints the page" and "rapid finish changes end on the last pick" stay valid: a hover never touches `<html>`.

## 11. Finishes render: a bird on the camera. Titanium card: leaders, light and scratches

**The bird.** `finishes__render` (the back view of `PhoneRender`) gets a visitor: a small bird that lands on the camera plateau.

- Arrival: it flies in from outside the phone with four wing flaps (an arc of `translate`, wings `scale(1, ±1)` on 120 ms steps), lands on the top edge of the plateau (`back.plateau` from `phone-geometry.ts`, so it fits at every size), folds its wings, hops once.
- Perched (4–8 s): it tilts its head, looks at its reflection in a lens and pecks at it twice (the lens flashes a small highlight), ruffles. Then it leaves the way it came. It is back after 10–20 s; one time in four, two birds (the second lands on the flash).
- Reactions: a finish change (the render tilts) makes it flap and lift 6 px, then settle; a hover over the render makes it turn its head toward the pointer (`subscribePointerFrame`, head `rotate` ± 25°).
- Art: body, head, beak, tail, two legs, two wings, ≈ 12 units tall in phone coordinates; `aria-hidden`; colour `--color-text` with a `--color-accent` beak. `PhoneRender` gets a `children` slot rendered inside the SVG after the back group, so overlays sit in phone coordinates (the `ref` and the `PhoneRenderDefs` split are in §10).
- Code: `src/components/Finishes/CameraBird.tsx` + `birdSchedule.ts` (pure, tested); the schedule runs on timers, the flight on `subscribeTick`. A lazy chunk `finishes-bird`, loaded after mount only while `useAmbientMotion()` is true and the render is awake (`useAwakeWhileInView` on the render).
- Motion levels: ambient. `full` and awake: everything. `calm`: the bird sits still on the plateau (no arrival, no pecking). `off`: no bird. High contrast: bird and beak in `--color-text`; the render label is unchanged.

**The titanium card** (`features__card--titanium`, `TitaniumSample`): today a static corner with one sheen when seen.

- **Leaders draw on view:** when `data-sheen='run'` fires (the existing `isSampleSeen`), the three callout dots pop (`scale` 0 → 1), the dashed leaders draw (`stroke-dashoffset`, `pathLength={1}`) and the callouts fade in, staggered 120 ms, before the sheen. CSS only, `motion-safe`; at `off` they are simply there.
- **Light sweep on the band, ambient:** a soft highlight (a skewed `<rect>` with a linear gradient, clipped to the band through a `<clipPath>`) crosses the band every 7 s, `translate` only, at `full` while the card is awake (`when-awake`).
- **Scratches as patina, on hover:** "wears scratches as patina, not damage": every hover over the sample draws one new hairline scratch on the band (six pre-drawn `<line>`s with `stroke-dashoffset`, revealed one per hover by a counter in `data-scratches`, 0.6 px, `--finish-shell-light` at 70 %), up to six; once all six are there they fade out together over 30 s and the count starts over. `hover-motion`; nothing at `off` or on touch. High contrast: scratches in `--color-text` at 50 %.
- The leaders and the light sweep are CSS in the main bundle (small); the scratch counter joins the `features-life` chunk (§5, §16).

## 12. Numbers: the stats move

The reels (`SlotNumber`) roll once into view and then hold. Three additions, each small:

- **Hover / focus replays one stat:** pointer over a `.stat` (or focus on its footnote ref) spins that stat's reels one full turn and lands them again, the unit flips once (`rotateX` 360°). `useCountUp` today sets `hasFinished` after its first run and never subscribes again, so a `replay` counter in its options is not enough on its own: an effect keyed on `replay` resets `hasFinished` and `animatedValue` to 0 before the run starts, and the run uses a 700 ms `duration` (`SlotNumber` passes `replay` and the shorter duration while a replay is pending). `hover-motion`; at `off` nothing (the hook already returns the target under reduced motion).
- **Ambient tick:** at `full` while the list is awake, every 6–9 s one random stat's last column slips one notch down and back (`--reel` +1 then back over 400 ms, like a flip clock catching up) with a glint across the digits. The awake flag today sits on the CTA paragraph (`useAwakeWhileInView(ctaRef)` in `Numbers.tsx`), not on the list, so the `<dl>` gets its own `useAwakeWhileInView` and the tick subscribes to ticks only while the list carries `data-awake`. The tick always returns to the final digit, so the e2e tests "counters stay rolled" and "reads final stat values" hold (the readable value is a separate hidden span anyway).
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

- Geometry: two points measured after mount (the outline's `[data-part='body']` path start, and the rect of the last `.word` span of the h1), joined by one cubic and the underline segment; drawn as an absolutely positioned `aria-hidden` SVG over the hero, `pathLength={1}`, `stroke-dashoffset` 1 → 0 over 1.1 s, `vector-effect: non-scaling-stroke`. Measured in the layout callback that `HeroExtras` already passes to `subscribeScrollFrame` (`measure`, which runs on resize and on a text scale change; there is no `ResizeObserver` there), so the line follows the layout; on phones (stacked layout) it runs from the phone's top-left up to the title's last line.
- Start time: the line lives in the `hero-extras` chunk, so it starts at `max(0, 1.8 s − time since navigation start)` through an inline `animation-delay`: after the outline on a fast load, at once on a slow one.
- Ambient: at `full` while the hero visual is awake, a light point runs along the line from the phone to the word every 8 s (the dash-head trick, 900 ms), the flourish brightens when it arrives.
- Motion levels: the draw is `motion-safe` (a one-shot, so `full` and `calm`); the travelling light only at `full`; at `off` the line is shown complete and still. Without JS or before hydration: no line (it needs the measurement), nothing flashes. High contrast: line in `--color-text`; forced colours: `CanvasText`.
- The LCP element (the headline text) and the prerendered HTML are unchanged.

**Words lift on hover.** The h1 words are spans already (`.word`): `hover-motion` lifts a hovered word 0.06 em with a colour sweep to the accent and back (200 ms). Keyboard has nothing to focus here, so nothing for `:focus-visible`. The runaway letters keep working on the h1: a lifted word moves its highlight range with it. The copy letter today follows only the block's top (`shift = rect.top - blockTop`), and a word lifted by `transform` does not change the h1's rect, so a returning letter would land 0.06 em off its word. The escape runner (§9) therefore takes the home position from `letter.range.getBoundingClientRect()` each frame instead of the block shift (at most three ranges, so cheap); the lifted word then carries its home with it.

## 15. Tests (draft)

- **Unit:** the lens bug route (three rects → a closed polyline with two hops, order and facing); the heading scheduler (first delay, interval, bag drawn without replacement, the two-headings cap, one gag per section); `letterPicker` offers paragraphs and headings through separate selectors; the descent functions (seven rigs reach y = 0, horizontal drift stays within bounds, the bag never repeats within seven); the bird schedule; `RollingText` with `effect="hop"` keeps the plain name; `reelPositions` is unchanged and the tick returns to the final digit; `useCountUp` runs again when `replay` changes and ends on the target; the new colours in `config/contrast.test.ts` (worm, wave line, finish wash border, scratches) in all four token sets.
- **E2e:**
  - Panel: the handle is still named "Accessibility settings", the worm and the bite are inside the handle box at rest ("closed, only the handle shows" stays), hover shows the bite, the open panel keeps it, `off` snaps without running animations.
  - Nav: the measured link text box is the same before and after a hover; the accessible names are the plain labels.
  - Hero secondary: the link keeps its name and `href`; at `off` no running animation on hover.
  - Footnotes: the list items have visible markers "1." and "2." (computed `list-style-type`), the refs still jump to them.
  - Lens bug: present and moving at `full` with the card in view, absent at `calm` and `off`, in high contrast it is `--color-text`.
  - Pip: a 6 px move is a poke, a 40 px drag is not; after a release Pip ends on its ground line with `data-act="walk"`, seven releases play seven different rigs, the live region gets the landing line, a drop over the footer links ends off the links ("keeps off footer links" extended).
  - Footer line: static at `calm` and `off`, animations running only while the footer is in view at `full`.
  - Headings: at `full`, every heading in view gets an escape within 8 s; the text and the box are unchanged (the plan 4 test, run per heading); never more than two headings running.
  - Finishes: a hover never changes `--accent-h` on `<html>`; the render's inline value matches the hovered finish and clears on leave; the computed `stop-color` of the render's shell gradient changes while an option is hovered (the token mixin works); the bird is absent at `off`.
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
| `runaway-letters` (today 3.4 KB)      | +1.2 KB gz   | the escape list refactor and the heading scheduler                                                                                                                                                                    |

Chunk names: `vite.config.ts` has no `manualChunks`, so a chunk is named after the file behind its dynamic import. The names above are the file names to use (`features-life.tsx`, `finishes-bird.tsx`, `mascot-rigs.tsx` as the lazy entry of each group).

**Measured** (`vite build`, gzip): main bundle 100.66 KB (98.7 before, +2.0 KB, within +3); `features-life` 1.95 KB + 0.27 KB CSS (within 2); `finishes-bird` 2.16 KB + 0.70 KB CSS (**over** the 1.5 KB line by 0.7 KB JS: the flight, the schedule and the pointer follow); `mascot-rigs` 1.65 KB + 0.86 KB CSS (within 3.5); Pip 7.68 KB + 2.89 KB CSS (+1.58 KB JS, **over** +1.2 by 0.4 KB: the drag controller and the carry maths); `hero-extras` 2.09 KB + 1.56 KB CSS (+0.6 KB, within +1); `runaway-letters` 4.45 KB + 0.52 KB CSS (+1.05 KB, within +1.2).

## 17. Work order (draft)

Fixes and CSS-only hovers first, then the lazy scenes, Pip last (the riskiest: pointer capture inside a button that must still poke).

| #   | Step                                                                                             | Done when                                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1  | Fixes: footnote numbers (§4), titanium card width (§8), exploded stage fit and clip (§13)        | markers visible, card full width on `lg`, no spill at the three viewports, title below the header                                                                       |
| H2  | CSS hovers: handle apple and worm (§1), nav hop (§2), hero secondary ring (§3), words lift (§14) | all four at `full`, snap at `off`, names unchanged, panel e2e green                                                                                                     |
| H3  | Finish options hover and render preview (§10), Numbers hover, tick and lean (§12)                | preview never touches `<html>`, readable values stable, `off` e2e green                                                                                                 |
| H4  | Footer living line (§7), titanium leaders and light sweep (§11)                                  | static at `calm` / `off`, moving only while in view at `full`, HC flat line                                                                                             |
| H5  | Escape list refactor, then the heading scheduler (§9)                                            | plan 4 letters e2e still green after the refactor; every heading in view escapes, 1–2 letters, bag without replacement, paragraphs no longer pick headings, text intact |
| H6  | Lazy scenes: lens bug (§5), bird (§11), hero line (§14), titanium scratches (§11)                | each absent at `off`, still at `calm`, moving at `full` and awake; chunks within §16                                                                                    |
| H7  | `useMascotControls` split first, then Pip drag and the seven rigs (§6)                           | brain under 150 lines; poke vs drag separated, seven rigs, landing on the line, avoid zones respected, mascot e2e green                                                 |
| H8  | Lint, typecheck, unit, e2e, perf, cycles, unused, README (motion, accessibility, budget numbers) | all green; §16 numbers measured and written into README "Known gaps"                                                                                                    |

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

- **§3 the ring is an SVG, not a conic mask.** The outline is a `<rect rx="999" pathLength={1}>` inside the link (`hero__ring`), drawn by a `stroke-dashoffset` transition, with a second rect as the pen point (`stroke-dasharray: 0.03 1`, offset 0.03 → −0.97). An SVG rect path starts at the top-left of the straight edge and runs clockwise, so the line and the pen are in step on every browser without `@property` or `offset-path`; the fallback paragraph in §3 is moot.
- **§1 the sequences are transitions with step timing, not keyframes in both directions.** The bite opens through `transition: transform 240ms steps(3, jump-end)` on the hover rule and heals through the rest rule's smooth 300 ms transition; the worm's arc and blink and the apple's jolt are the only keyframes. A keyframe on the rest state would have played once at load.
- **§2 hop markup.** `RollingText` keeps the two-copy strip in both effects; the hop stylesheet hides the second copy and lets the letter overflow. The nav link carries `data-roll-host` so the shared hover selector applies.
- **§4 specificity.** The global `ol[class]` reset (0,1,1) outranked the module's `.footnotes` (0,1,0), which is why the padding was missing as well as the numbers; the rule is now `.root .footnotes`.
- **§10 token mixin.** `finish-tokens` is included by `root-tokens` and by `device-tokens`, so every device drawing (the finishes render, the line draw render, the exploded layers) resolves the finish colours locally; a preview writes `--accent-*` on the finishes render only. `PhoneRender` takes `ref` and `children`; its gradients moved to `phone-render-defs.tsx` and the ids to `phone-render-ids.ts` (a separate module so the defs file exports only a component, for fast refresh).
- **§10 swatch ripple.** The swatch SVG sits in a `swatch-wrap` span that carries the `::after` ring; an SVG element cannot have pseudo-elements.
- **§12 replay and tick.** `useCountUp` resets during render when `replay` changes (the "adjust state on prop change" pattern), `SlotNumber` shortens the duration to 700 ms for replays and keys the unit span on the replay count so the flip restarts. The hover and focus listeners are native (`useStatReplay`), because jsx-a11y refuses pointer handlers on a static `<div>`. The ambient tick is a timer in `useStatTick` (6–9 s, only while the `<dl>` has `data-awake`), and the slip animates `transform` from `--reel` in keyframes, so the inline `--reel` value, which the e2e tests read, never changes.
- **§13 short windows.** The fit rules use `@media (height < 46rem)` / `(height < 40rem)` and apply in the static scene too (there the stage is `height: auto`, so nothing is clipped, only the details and the intro are hidden on a short window). The copy column is `align-self: start` from `md`.
- **§7 footer edge.** The pulse is the accent wave masked by a 160 px gradient window that translates across (`transform-box: view-box`), not a dash head: a pattern fill has no path to dash. The scroll ruffle uses `max(v, -v)` for the absolute value, as the header line does.
- **§11 leaders.** The dashed leaders grow through `scaleX` (`transform-box: fill-box`) rather than `stroke-dashoffset`, which would have fought the dash pattern; the sample's sheen waits 600 ms so the leaders draw first. The light sweep is a gradient rect inside a `<clipPath>` of the band, inside the existing fade masks.
- **Mixin order.** Inside `hover-motion`/`motion-safe` blocks a nested `.parent &` lands the scope in the wrong place (`.parent :where(:root…) .child`); the first build of §3 had that bug. The correct form is `.parent & { @include hover-motion { … } }`.
- **§9 the escape list.** `escapeRunner.ts` (one escape), `escapeChase.ts` (the plan 4 chase start and ground bounds), `escapePlanner.ts` (the spot picking for both kinds) and `headingScheduler.ts` (pure); `useRunawayLetters.ts` went from 203 to 117 lines. The heading clock is a 1 s poll that syncs the settled in-view headings, with the per-heading due times inside the pure scheduler, rather than one `setTimeout` per heading. "1.5–2.5 s" is the whole heading trip: 350–800 ms per leg plus lift, look and settle. The plan 4 e2e "an escape leaves every block's text and box unchanged" asserted zero letters at a fixed moment; with headings on their own clock it now samples every 250 ms for up to 15 s until all glyphs are home. "Every heading in view escapes within 8 s" holds only when the cap of two leaves room: the e2e checks it at the top of the page (the hero h1) and, over the five feature-card headings, that at least three ran in 20 s and never more than two at once.
- **§6 the drag.** The 150-line limit split the drag into `mascotCarry.ts` (pure: threshold, clamp, smoothed velocity, tilt), `mascotPlacement.ts` (the `--pip-x/y/tilt` writer), `mascotDragController.ts` (the pointer state machine outside React) and `useMascotDrag.ts` (the listeners, the swallowed click, the lazy `mascot-rigs` import); `useMascotBrain.ts` is 131 lines after the controls moved to `useMascotControls.ts`. Two holds the plan did not foresee: the pointerdown focuses the poke button, so the carry blurs it when the drag starts (a `focus` hold would freeze Pip after landing), and landing also lifts the `pointer` hold, because no `pointerleave` reaches a button that fell away from a stationary pointer. A failed rig-chunk load drops Pip straight back onto its line. The carried line's bubble stays up through the descent.
- **§5, §11, §14 the lazy scenes.** The bug art and its walk styles live in `assets/svg/bug.tsx` + `bug.module.scss`; `EmailBugs` keeps only its colour rules. The lens bug splits into `lensBugRoute.ts` (pure) and `lensBugWalk.ts` (pure apart from `random`), `LensBug.tsx` and `useScratchCounter.ts`, behind the `features-life.tsx` entry; its legs tuck on a hop through `scaleX(0.4)`. The bird chunk (`finishes-bird.tsx`) loads whenever motion is not `off`, not only at `full`, because `calm` must show the still bird on the plateau; the bird itself rests at `calm` through `useAmbientMotion()`. The "reflection" is a head tilt and two pecks with a lens highlight, the ruffle a body wobble, and the second bird flies the same arc 260 ms later onto the flash. The accent and option style helpers moved out of `Finishes.tsx` into `finishStyle.ts` to keep it under 150 lines. The hero line (`HeroLine.tsx`, `heroLinePath.ts`) sits inside the hero visual's parts layer, the only positioned ancestor, so it floats with the phone and fades with `--hero-out` like the parts; on phones it runs upward across the lede, faintly (the §18 question, answered by keeping it). The flourish does not brighten on its own: the travelling light passing its end is the highlight. The scratch counter holds the sixth scratch 1.2 s before `fading` and removes the attribute after 30 s.
- **§15 the e2e suite.** Two plan 4 tests read the nav link's `textContent`, which now carries the hidden letter copies: the nav runner test finds the label by the link text's start and the section label test checks the accessible name. The lazy-scene tests scroll with `scrollIntoView({ behavior: 'instant' })`: WebKit's `scrollIntoViewIfNeeded` scrolls smoothly and a 7,000 px trip outran the 5 s polls. A first full run with five projects on two workers produced 41 timeouts (Firefox and WebKit starving each other on one machine); run per project, every test passes. Firefox frame rates were measured against the pre-plan-5 build in a separate checkout: no difference at `full` once the sampling window is longer than the post-scroll jank.
- **Review fixes.** The titanium scratches keep `opacity` at 0 for the 420 ms of their un-draw when the count resets, so the six never flash in after the fade. The hero line is measured again on the headline's `animationend`: on a fast load the chunk arrives while the words are still rising and a rising word's box is off by its translate. "One gag at a time per section" (§9) holds both ways: a paragraph escape also waits while a heading's letters are out in its section. The finish option's focus wash no longer sits inside `(hover: hover)`, so Tab previews on touch devices with a keyboard. §10 override: in high contrast the hovered option's border stays `--color-line-strong` rather than the finish colour, which reaches only about 2 : 1 on the light theme's white (the ripple and the render preview still carry the finish). A `pointercancel` on Pip no longer swallows the next click, a failed `mascot-rigs` fetch is retried on the next drag, the bird's head turns only over the render and comes back when the pointer leaves, and the Numbers glint is the accent rather than white, so it shows on the light theme.
- **§15 perf.** `test:perf` did not pass in this session: 74 long tasks over the 76 scroll steps, 7–8 s in all. The pre-plan-5 build, rebuilt from `HEAD` in a separate worktree on the same machine, gave 74–75 and 9.3–9.6 s, so the check is red for an environmental reason (every forced layout costs about 80 ms here) and plan 5 is not slower. The CPU profile puts the time in `getBoundingClientRect` called from the frame loop's tick listeners (Pip's avoidance on scroll frames, the letters while an escape runs) and inside `scrollTo`; the writers of `--doc-p` / `--scroll-v` / `--pip-x` earlier in the same frame dirty the style, and the readers pay for the recalc. A later pass could batch reads before writes in `frameLoop.ts`; not done here.
