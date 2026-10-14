# Plan 4: living details

Builds on `0-plan-landing.md` … `3-plan-accessibility-panel.md`. Where this plan conflicts with an earlier one, this plan wins (plan-order note in plan 0). Everything not mentioned here keeps the earlier rules: no animation library, one rAF loop (`frameLoop.ts`), only `transform` and `opacity` in loops, visible without JS, all copy lives in `content/`, components stay under 150 lines, BEM class names (plan 2 §11), every motion goes through the plan 3 motion levels (`full` / `calm` / `off`) and their mixins and hooks.

Goal: a set of small, separate touches that make the page feel more alive. This plan is open: new items are added as numbered sections while it is being written. Nothing here is built yet.

## 0. Overrides of plans 0 to 3

| Earlier rule                                                                   | Plan 4 change                                                                                                        | Why                                                                       |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Plan 1 / `Pressable`: the attention ring pulses 3 times after load, then stops | The ring pulses without end on the header Reserve and on the primary pressables (§3)                                 | the call to action should keep drawing the eye                            |
| Browser default scrollbars                                                     | Site-styled scrollbars, set once globally (§4)                                                                       | default scrollbars break the dark look                                    |
| Particles: assembled shapes hold still apart from the sway                     | Shapes 1–3 turn slightly with scroll while assembled (§5)                                                            | adds depth and ties the shapes to scrolling                               |
| Plan 1: line draw reveals the color render in the last 10 % of its scroll      | The reveal gets about 35 % of a longer section (§6)                                                                  | the color phone appears too fast                                          |
| Plan 3 budget: +4 KB gz main bundle                                            | Plan 4 may add at most **+5 KB gz** to the main bundle; letters, chase and the rocket flight are code-split (§11)    | the main bundle is already far over the 60 KB target                      |
| Plan 2 §4 / `useIdleNudge`: the first nudge waits for the 3 pulses (`pulseMs`) | The first nudge keeps the same delay (7.8 s, renamed `firstNudgeDelayMs`); nudges and the endless pulse coexist (§3) | the idle-nudge e2e clock values stay valid                                |
| Plan 1 / `Backdrop.tsx` writes the document progress `--doc-p` on the backdrop | One document-progress writer on `<html>` (`useDocumentProgress`), read by the backdrop and the header line (§2.1)    | no second scroll listener for the same number                             |
| `BrandMark`: two filled paths, used by the header and the footer               | `LivingMark` with a stroke layer replaces it in both places (§2.2, §7.2)                                             | one component, both marks behave the same                                 |
| `DecodeText` decodes once, on entering the viewport                            | It can also replay when its text changes, instant at `calm` (§2.3)                                                   | the section label needs a re-decode per change                            |
| Footer: "Back to top" is a plain link in the link list                         | It becomes the rocket pressable next to the pause toggle; the list keeps Reserve and Font license (§7.3)             | one "Back to top", not two                                                |
| Plan 3 §1: the panel opens on hover, previews on focus, pins on click          | The panel opens only on a click or Enter on its handle; hover and focus just fetch the controls (§13)                | asked for during the build: no panel sliding out while the pointer passes |
| Plan 3 §5a: every color exists in four token sets                              | Unchanged, and it applies to every new color here: scrollbar, outline gradient, progress glow (§4, §8)               | the light theme and high contrast must not be forgotten per feature       |

## 1. Runaway letters

Now and then a few letters in titles and body text grow small legs, run off in different directions, and then walk back to their place.

**Behavior.**

- One "escape" at a time on the whole page, the first 5 s after load and then every 10–15 s (a 2 s retry when no block qualifies), only in a text block that is fully in the viewport.
- 1–3 letters per escape, from one block. Never spaces or punctuation, never letters in links, buttons, form fields, the a11y panel, or numbers in the Numbers section.
- Sequence: the letter lifts a little, legs grow out from under it (≈ 200 ms), it runs off a short distance (40–160 px, its own direction per letter, stays in the viewport), stops, looks around (small tilt), runs back, legs pull back in, the letter settles with a small bounce. About 2.5–4 s in total.
- While the letter is away, its place in the line stays empty (the line does not reflow).
- Hovering or tapping a running letter makes it hurry home (optional extra).

**How.**

- The real text in the DOM stays unchanged: screen readers, copy-paste, search and layout see the normal text. At the start of an escape, the letter is located with a `Range` (`getClientRects`), a copy is drawn in one `aria-hidden` overlay layer (`position: fixed`, `pointer-events: none`), and the original glyph is hidden by wrapping it in a short-lived `<span>` with `color: transparent` — this wrap is removed after the return, so the text node is whole again.
- Legs: two tiny SVG strokes (or `::before` / `::after`) in the text color, with a 2–4 frame walk cycle through `transform` only.
- Movement runs on `frameLoop.ts` (`subscribeTick`), not its own rAF.
- Same font, size, weight and color as the source (from `getComputedStyle`), so the copy matches the glyph exactly.
- Scroll during an escape: the letters are tied to the position of the block, so they move with the page; if the block leaves the viewport, they snap back at once.
- Which blocks qualify (checked against the code): titles are `SplitWords` word spans (`RevealTitle`, the hero h1), so a `Range` over one character inside a word's text node works. Skipped: `ScrubText` words (their opacity follows scroll, a copy would not match), `DecodeText` while it decodes, blocks still revealing (`data-reveal="hidden"`, or a view-timeline reveal not yet at its end: wait until the block has been fully in view for ≥ 1 s), the nav, Pip's bubble, the panel, the form, `SlotNumber` reels and the stat values.
- Kerning check: wrapping one glyph in a `<span>` can change the kerning with its neighbors in some fonts. Measure the block's width and the glyph rect before and after the wrap; if anything moved by more than 0.5 px, unwrap and abort this escape (no layout shift, ever). The wrap itself is the trick `DecodeText` already uses (`color: transparent` on `.decode-text`).
- "Hurry home" on hover needs no `pointer-events` on the overlay: the letters read the pointer from `subscribePointerFrame` (`frameLoop.ts`) and compare it with their own rects.
- Legs reuse the nav runner's leg art and walk cycle (`SectionNav.module.scss`, `.leg`), not a third drawing of legs.
- Tab hidden (`document.hidden`): a running escape ends at once and no new one starts, as Pip does (plan 1 §9).
- Code: `src/components/RunawayLetters/` — `letterPicker.ts` (pure: candidate blocks and characters), `useRunawayLetters.ts` (timer, overlay, tick), `RunawayLetters.tsx` (the overlay layer). Code-split like `MascotSlot`, mounted from `App.tsx` after mount, only while `useAmbientMotion()` is true, high contrast is off and the plain font is off (§11 budget).

**Motion levels.** Ambient motion: only at `full` (the `when-awake` / `useAmbientMotion` gate). `calm` and `off`: no escapes, any running one ends at once, the text is whole. Not in high contrast or with the plain font (plan 3 §3, §5): moving letters hurt readability there.

**Pip chases the letters.** When Pip is loaded (motion `full`, "Show Pip" on) and idle, about every second escape becomes a chase:

- One of the escaping letters jumps down out of its line onto Pip's ground line at the bottom of the viewport (an arc, legs kicking), and runs along it away from Pip.
- Pip notices (`wide` eyes, short "Hey!" bubble) and runs after it with a new act `chase` (faster than `hurry`). The letter dodges once or twice: stops, turns, slips past Pip.
- End: just before Pip catches it, the letter jumps back up in an arc to its place in the line. Pip stops, looks up after it, `dizzy` or `squint`, a line like "So close!" (`mascotCopy.chase` in `content/`, several lines, picked at random).
- Pip never catches a letter, and never leaves its ground line (plan 2 §1). The letter runs only on free ground: it respects Pip's avoid zones (footer, a11y panel, sticky CTA) and turns before them.
- Through Pip's act system (`mascotActs.ts`): `chase` is a new act of the `blown` kind (started from outside, not by Pip's own timer), **not** a `ComboAct` — in the code "combo" means the poke series (`poked` / `screenshot` / `dizzy` / `airplane`, `mascotCombos.ts`). Like `hurry` it ends by event (the letter jumps home) with a cap in `actDurationMs.chase` (≈ 6 s), `actExpression.chase: 'wide'`, line from `mascotCopy.chase` in `lineFor`. Cooldown: at most one chase per 60 s. Not started while Pip is held (`data-held`), hiding (`data-hiding`), behind the footer (`data-behind`), poked, blown away or in another act; the other letters of that escape run as usual.
- Channel between the two chunks: the letters and Pip are separate lazy chunks, and `startAct` lives inside `useMascotBrain`. A tiny shared module `src/hooks/mascotRequests.ts` (subscribe / request, no React) carries `chase({ x, direction })` from the letters to Pip and Pip's answer (`accepted` or not). The letters read Pip's state from the DOM: `.mascot[data-act="walk"]` without the attributes above, and its rect for the ground line. No import between the two component folders, so `check:cycles` stays green.
- Pip's ground line is not a constant: Pip sits at `bottom: space-2 + safe-area` and is lifted by `--sticky-cta-clearance` while the sticky CTA shows. The letter reads Pip's rect each frame and runs on that line.
- "Avoid zones" are the `[data-pip-avoid]` rects (footer, a11y panel, sticky CTA, reserve form): the letter turns 24 px before one, the same margin as Pip's approach rule (plan 2 §1).
- Chase speed: Pip walks at 38 px/s and hurries at ×3; `chase` runs at ×4, the letter at ×4.5 with two dodges, so Pip never closes the gap.
- If Pip is hidden or not loaded, or the source block is too far from the bottom (the jump would cross more than half the viewport), the escape is a normal one.
- Pip's poke button and live messages stay as they are; the chase lines go through Pip's existing polite announcer, like its other lines.

**Open question.** Should headings and body text have the same chance, or should headings run more often? Suggested: headings twice the weight of a paragraph (a running letter in a 2.7 rem title reads as a gag, in body text it reads as a glitch), decided by eye once built.

## 2. Header: more life

Today the bar holds the mark, the name, the section nav, the pause toggle and Reserve, and none of it moves. Chosen: three parts (§2.1–2.3) and a small Pip reaction (§2.4). Not doing: a header that changes height with the scroll direction.

### 2.1 Scroll progress along the bottom edge

- The 1 px bottom border of `.root` becomes the track; on top of it an accent line (`header__progress`, `aria-hidden`) grows from left to right with the page scroll: `transform: scaleX(var(--page-p))`, `transform-origin: left`.
- `--page-p` is the document progress the page already computes: `Backdrop.tsx` writes `--doc-p` on the backdrop from one `subscribeScrollFrame` listener (skipped under reduced motion). That writer moves to a hook `useDocumentProgress` that writes `--doc-p` once on `<html>`; the backdrop and the header both read it. No `animation-timeline: scroll(root)` path: a scroll-driven CSS animation counts as `running` in `document.getAnimations()`, which the `off` e2e test requires to be 0, and the JS value is needed anyway for Pip (§2.4). One mechanism, no `@supports` branch.
- A small light point on the tip (radial gradient, `translateX` with the same value), slightly brighter while scrolling and dimmer at rest.
- Color follows the finish (`--color-accent`), glow uses `--color-accent-glow`.
- Scroll-driven, so it works at `full` and `calm`. At `off`: the line still follows the scroll, with no glow and no transition, the way the nav indicator jumps without transition at `off` (plan 3 §2). It is a position readout like the scrollbar, not motion, and the writer runs only on scroll frames, so the idle rAF count in the `off` test stays 0. (`useDocumentProgress` therefore does not bail out under reduced motion; the backdrop's own drift stays gated as today.)
- High contrast: the line stays, glow off, 2 px height. Forced colors: `Highlight`.
- Without JS and before hydration: no line (`--doc-p` unset → `scaleX(0)`), nothing to flash.

### 2.2 Living brand mark

`BrandMark` today is two filled paths (body and leaf).

- **On load:** the outline is drawn first (a stroke copy of both paths, `stroke-dasharray` / `stroke-dashoffset`, ≈ 900 ms), then the fill fades in and the stroke copy fades out. Without JS and at `off` the mark is shown filled at once (the stroke layer is CSS-only, so nothing waits for hydration).
- **At rest:** slow "breathing", `scale` 1 → 1.04 and back over about 4 s, the leaf swings a few degrees around its stem. Ambient, so only at `full` (`when-awake`).
- **On scroll:** the mark turns a few degrees with the scroll speed and springs back when scrolling stops (same smoothing as §5, max ±8°). Scroll-driven, so `full` and `calm`.
- **Hover / focus on the home link:** one short spin (360°, 600 ms, `ease-out`). Through `hover-motion`, so not at `off` and not on touch.
- All movement is `transform` on the SVG or its paths; `transform-box: fill-box` so the leaf turns around its own base.
- The header has no `data-awake` today and is sticky, so it is always "in view": the breathing runs without end at `full`. That is allowed (it is what `when-awake` means for the hero), but the mark gets `useAwakeWhileInView` anyway so the shared observer, not a special case, is the gate, and the footer mark (§7.2) stops when the footer is off screen.
- The scroll turn needs a scroll velocity: `useDocumentProgress` (§2.1) also derives it from consecutive scroll frames and writes `--scroll-v` (px per ms, clamped) on `<html>`; the mark maps it to `rotate()`. The spring back runs on `subscribeTick` only while `|--scroll-v| > 0`, so idle frames stay at zero.
- Component: `LivingMark` in `assets/svg/`, replacing `BrandMark` (header and footer). It keeps `aria-hidden`, `fill="currentColor"`, and adds the stroke copy (`stroke="currentColor"`, `pathLength={1}`) behind a `motion-safe` block, so without JS and at `off` only the filled paths show.

### 2.3 Section label next to the name

- After the product name: a small mono label, "/ Design", "/ Inside", "/ Numbers", "/ Finishes", for the section in view (the four nav targets in `navigation`; there are no "Camera" or "Display" sections). Above the first target (hero) the label is empty, and so it is once `#reserve` reaches the band: `activeSection` returns `-1` there and the nav indicator hides, so the label follows. Features has no nav entry, so the label stays "/ Numbers" through it, as `aria-current` does.
- Source of the active section: the existing `useScrollSpy` / `activeSection.ts` of the section nav, so the label and the nav indicator never disagree. Today the hook is called inside `SectionNav`; it moves up to `Header`, which passes `active` and `hold` to `SectionNav` and `active` to the label (one state, no context needed).
- Change: the old label is replaced letter by letter with the decode effect (`DecodeText`), ≈ 300 ms. At `calm` and `off` the new text appears at once (cross-fade ≤ 200 ms). `DecodeText` today decodes once on entering the viewport (`useInView`, once, 500 ms) and reads `useReducedMotion` (only `off`): it gets a `replayOn` prop (the label text) that restarts the decode when the text changes without waiting for `useInView`, a `durationMs` prop, and it goes instant on `useMotionPaused()` (so `calm` too). The hero eyebrow keeps today's behavior.
- Labels live in `content/` (`headerCopy.sections`), the same names as the nav.
- Accessibility: the label is `aria-hidden` and sits **outside** the home link (`headerCopy.homeLabel` stays the link's name), as a sibling after it. The nav already tells the current section through `aria-current`. No live region, so screen readers are not interrupted while scrolling.
- Small screens: the label is hidden below `md` when the nav is collapsed, and with a text scale (plan 3 §9, the name itself may be hidden there).
- Width: the label sits in a box sized to the longest label, so the nav does not move when the text changes: all four labels are rendered stacked in one grid cell (`grid-area: 1 / 1`), the inactive ones `visibility: hidden`, so the box is as wide as the widest without JS measuring.

### 2.4 Pip and the header

Pip reacts to the header a little, rarely:

- When the progress line reaches the end of the page (`--doc-p` ≥ 0.99), Pip looks up at it, and once per visit does a small celebration (jump, short "Done!" bubble from the Pip copy in `content/`). Only while Pip is not `data-behind` or `data-hiding` (at the page end it often stands among the footer links and steps aside, plan 2 §1).
- When the section label changes and Pip is idle, Pip sometimes (≈ 1 in 4) glances up at the header. Both go through `mascotRequests.ts` (§1), the same channel as the chase, so Pip has one entry point for outside requests.
- No climbing on the header: Pip stays on its ground line (plan 2 §1), and the header is not an avoid zone change.
- Only when Pip is loaded (motion `full`, "Show Pip" on); goes through Pip's existing act system (`mascotActs.ts`), with its cooldowns, so it does not stack on other acts.

Motion levels for the whole header: ambient parts (breathing, leaf swing) only at `full`; scroll-driven parts (progress line, mark turn, label decode) at `full` and `calm` (decode becomes instant at `calm`); at `off` everything is static.

## 3. Endless attention pulse on buttons

The `.ring` layer of `Pressable` (`ring-pulse`, `--dur-pulse` 2.6 s) plays 3 times after load and then stops. It should repeat without end on:

- the compact header button (`pressable pressable--compact header__reserve`);
- the full-size `pressable` buttons (hero Reserve, Reserve form submit, sticky CTA).

**Rules.**

- `animation-iteration-count: infinite`, plus a pause of about 1.5–2 s between pulses (inside the keyframes, so the button is not always moving): new keyframes `ring-pulse-loop` in `global.scss` where today's pulse fills `0 – 60 %` and `60 – 100 %` holds `opacity: 0`; cycle `--dur-pulse-loop: 4.3s` (2.6 s pulse + 1.7 s rest). The one-shot `ring-pulse` stays for the hover ring.
- Only at `full` (`when-awake` as today). At `calm` and `off` the ring is not drawn; the pause toggle (plan 1) is the way to stop it, so WCAG 2.2.2 (pause, stop, hide for motion over 5 s) holds. (The `motion-reduce` safety net also forces `animation-iteration-count: 1`, so nothing can loop at `off`.)
- Stops while the button is off-screen: already the case. `when-awake` only matches with `data-awake`, which `useAwakeWhileInView` (the shared `IntersectionObserver` in `useAmbientMotion.ts`) toggles on every pressable. No new observer. A hidden tab is not painted, so a CSS animation costs nothing there; no `visibilitychange` code.
- Stops while the button is hovered, focused or busy: then the hover ring and the fill take over. `.root:hover .ring`, `.root:focus-visible .ring` → `animation: none` (the `[data-busy]` rule already hides it).
- If two pulsing buttons are on screen at once (header Reserve and hero Reserve), their pulses are offset by half a period so they do not blink together: the compact variant gets `animation-delay: calc(var(--dur-pulse-loop) / -2)` (a negative delay starts mid-cycle).
- Keyframes: checked, `ring-pulse` in `global.scss` already animates only `opacity` and `transform: scale(1.12, 1.6)`; nothing to rewrite.
- Idle nudges (plan 2 §4, `useIdleNudge.ts`) were timed after the three pulses (`pulseMs = 3 × 2600`). The delay stays as a plain constant (`firstNudgeDelayMs = 7800`, see §0), so the e2e idle-nudge test keeps its clock values; while a nudge runs (`[data-nudge]`) the ring is paused for that 900 ms, so buzz and pulse do not stack.

## 4. Custom scrollbars, globally

The page scrollbar and every inner scroll area (a11y panel, any overflowing block) get one style that fits the site.

- Standard properties on `:root`: `scrollbar-color: <thumb> <track>` and `scrollbar-width: thin`. Thumb: muted accent (follows the finish through `--accent-h/s/l`), brighter on hover; track: the page background or a slightly raised dark tone.
- WebKit fallback for older Safari: `::-webkit-scrollbar`, `::-webkit-scrollbar-thumb` (pill shape, 8 px, transparent border so it looks thinner), `::-webkit-scrollbar-track`. No `@supports` wrapper is needed: where the standard properties exist (Chromium 121+, Firefox), they win and the `::-webkit-` rules are ignored by spec; where they do not, the pseudo-elements apply.
- Tokens: `--scrollbar-thumb`, `--scrollbar-thumb-hover`, `--scrollbar-track` in all four token sets of `_tokens.scss` (`root-tokens`, `high-contrast-tokens`, `light-tokens`, `light-high-contrast-tokens`), and in `config/contrast.test.ts` like the other pairs.
- `color-scheme` already follows the theme in `global.scss` (`dark`, `light` under `data-theme="light"`), so overlay scrollbars match the theme before any custom rule applies. The `<meta name="color-scheme">` in `index.html` is `dark` only; it is informational and stays.
- High contrast (plan 3 §3): thumb at 3 : 1 against the track. Forced colors: leave the system scrollbar alone.
- Note plan 3 §9: the body container is the window minus the scrollbar; a thinner scrollbar moves the breakpoints a few px. Check that the e2e layout tests still pass at the edges.
- Mobile overlay scrollbars stay as they are.

## 5. Particle shapes 1–3 turn while scrolling

Shapes 1–3 in page order are `spark` (hero), `compass` (line draw) and `gear` (exploded view). While the particles are assembled into one of them, the whole shape turns slightly with scroll.

- In `ShapeParticles.tsx`, the anchor points of an assembled shape are rotated around the shape center before `goalX` / `goalY` are computed (`cos` / `sin` once per anchor per frame, then 2 × 2 per point, only for anchors with `settle > 0`). The angle comes from scroll, but two cases: `compass` and `gear` sit in **pinned** sections, where `anchorDocumentY` clamps the shape to the pin and it stays centered through the whole pin (150svh), so "distance from the viewport center" would saturate at once. For a pinned anchor the angle is `(p − 0.5) × 2 × max` with `p = (scrollY − pinFrom) / (pinTo − pinFrom)` (both already in `AnchorTrack`); for an unpinned anchor (`spark`) it is `clamp((anchorScreenY − viewportCenter) / viewportHeight, −1, 1) × max`. Both are 0 at the middle, turn one way going down and back going up.
- The angle is mixed in through the same `settle` factor as the shape itself: while the dots gather or break apart, the turn fades in and out, so there is no jump.
- Smoothing: the angle follows its target with an easing per frame, so a quick scroll wheel step does not jerk the shape. Ticks run only while `isMoving || isWobbling`, and at `calm` the wobble is off, so the angular motion must count as "moving" (its remaining delta joins `largestGap`), otherwise the smoothing stalls after the scroll frame. When it settles, ticks stop as today.
- Turn per shape is a field in a small table (`spark: 12°`, `compass: 18°`, `gear: 30°`, others `0`), so other shapes can join later. The rotation and the angle rule are pure functions in `particleField.ts`, tested in `particleField.test.ts`.
- Scroll-driven, so it runs at `full` and `calm`. At `off` the particles are not loaded (plan 3 §9).
- Cost: one 2×2 rotation per point per frame for the active shape only; check with the perf test.

## 6. Line draw: slower color reveal

In `line-draw__visual` the color render (`PhoneRender`) opens with a growing `clip-path: circle()` while the outline fades. Today this is `--reveal: clamp(0, (var(--progress) - 0.9) / 0.1, 1)` in `LineDraw.module.scss`: the last 10 % of the pin. With a section of `250svh` (md and up) and a `100svh` stage, the pin is `150svh`, so the reveal takes only about **15svh** of scroll (about **8svh** on phones, `180svh` section). One wheel step and the phone is fully in color.

**Change.**

- Give the reveal a larger share of the timeline: the outline drawing is squeezed into `0 – 0.6` (each `--draw-*` step scaled by 0.6), the reveal runs over `0.6 – 0.95`, and the last 5 % holds the finished color phone before the pin lets go.
- Make the section longer so the drawing does not get faster: `300svh` on md and up, `220svh` on phones. Result: the reveal takes about **70svh** of scroll on desktop and about **42svh** on phones, roughly 4–5× slower than today; the drawing keeps about the same speed as now.
- Ease the reveal instead of growing it linearly: smoothstep on `--reveal` (`r * r * (3 - 2 * r)` in `calc`), so the circle starts slowly, opens in the middle and settles at the end.
- The outline fades over the same window (it already reads `--reveal`), so the two stay in sync.
- The exact numbers (`0.6`, `0.95`, section heights) are tokens at the top of `.stage`, to be tuned by eye in the browser.
- `static-scene` (motion `off`, text ≥ 150 %) is unchanged: `--progress: 1`, color phone shown at once.
- The hero outline is unaffected: `Hero.module.scss` draws it with its own `draw-once` keyframes, not with the `--draw-*` steps.
- Smoothstep in `calc` is `calc(var(--reveal) * var(--reveal) * (3 - 2 * var(--reveal)))` (unitless products are fine in `calc`).
- Side effect: the sticky CTA hides while a pinned section is in view (`StickyCta.tsx`), so it stays hidden about 50svh longer on desktop. Acceptable.
- Check: the `compass` particle shape (§5) and the next section still line up after the longer section. Existing e2e tests use fractions of the pin (`scrollToShare`, mid-pin `0.3 < p < 0.7`), so they are unaffected; there is no test for the reveal threshold yet, so one is **added**: at `p = 0.55` the render `clip-path` is still at 0 %, at `p = 0.8` it is partly open, at `p = 0.97` fully open (read the computed `--reveal`).

## 7. Footer: more life

Today the footer (`Footer.tsx`) holds the mark with the name, the link list, the pause toggle, the legal line and the font credit, and nothing moves. Chosen: §7.1–7.3. Not doing: a staggered entrance of the footer rows. Pip stays out: the footer keeps `data-pip-avoid`, Pip does not wave or speak there.

### 7.1 Links with a hover animation

- Underline grows from left to right (`::after`, `transform: scaleX(0 → 1)`, `transform-origin: left`; on leave it shrinks to the right), in the accent color. Replaces today's `text-decoration-color` fade.
- The letters roll once like in the primary buttons (the rolling letters of `PressableInner`): the shared part moves into a small `RollingText` helper used by both, so the effect is not written twice. Letters are `aria-hidden` copies, the accessible name stays the plain label. Today `wordsOf`, `.letters` / `.word` / `.letter` / `.strip` and the `--i` stagger live in `Pressable.module.scss` and `PressableInner.tsx`; they move to `components/RollingText/` (own module, BEM block `rolling-text`), the visually hidden name included. `Pressable` keeps its rings, surface and fill.
- A small arrow `→` slides in after the label (`translateX` + `opacity`). The three footer links are `#top`, `#reserve` and `/fonts/OFL.txt`; none leaves the site, so `↗` is used only for the font license (a file that replaces the page), `→` for the anchors.
- Same on `:focus-visible`, so keyboard users see it too.
- Through `hover-motion`: no rolling and no slide at `off` or on touch; the underline then just appears (color change only). Under high contrast or "underline links" (plan 3 §3, §5, `data-links="underline"` uses `text-decoration`) the real `text-decoration` underline stays always visible and the `::after` line is not drawn; only the arrow animates.

### 7.2 Living brand mark

The footer mark uses the same living mark as the header (§2.2), as one shared component (`LivingMark`), not a copy:

- The outline draws itself when the footer comes into view (`IntersectionObserver`, once per visit), then the fill fades in.
- Breathing and leaf swing at `full` only; both marks share one phase so they do not breathe out of step when both are visible.
- Hover on the brand line: one spin. The footer brand is a `<p>`, not a link, so there is no focus case there (it does not become a link: "Back to top" already exists in the footer).
- Without JS and at `off`: filled mark, no draw.

### 7.3 Final scene: dots and the rocket phone

**Dots shape.** A new particle anchor sits right above the footer (`data-particles="rocket"`): the dots gather into a small phone with a flame under it, standing upright like a rocket ready to start. New shape in `particleShapes.ts` (added to the `particleShapes` list and `shapeLines`; polylines for the phone body, the window and three flame tongues). It forms as the last shape of the page, after `check` in Reserve.

- The anchor element is a small dedicated box (an empty `aria-hidden` `<div>` of about 12 × 12 rem in the footer grid, not the footer itself): `placement()` in `particleAnchors.ts` sizes the shape from the element rect and, on wide screens, puts it beside the element, so a footer-wide anchor would give a huge shape in the wrong place.
- A shape forms only when its anchor center is near the viewport center (`settleAmount`, plateau 1.6: fully formed within about 0.34 vh of the center). At the end of the page the viewport cannot scroll further, so check that at maximum scroll the anchor center is close enough on desktop (short footer) and on phones (tall footer, `space-9` bottom padding). If it is not, `settleAmount` gets an end-of-page rule: when `scrollY` is at its maximum, the last anchor counts as centered.

**"Back to top" button.** The footer already has a plain "Back to top" link (`footerCopy.links`, `#top`). It leaves the link list and becomes a pressable next to the pause toggle, same label, same `href`; the list keeps Reserve and Font license.

- On press: the rocket made of dots lifts off, a small phone drawing (SVG, `PhoneOutline view="front"` scaled to about 3 rem, `position: fixed`) flies up the viewport with a short dot trail, and the page scrolls to the top in sync with it. At the top the phone fades out and the dots go back to their usual drift.
- Scroll in sync: `scrollTo({ behavior: 'smooth' })` has a browser-defined duration (Chromium, Firefox and WebKit differ), so the flight cannot be matched to it. Instead the flight drives the scroll itself on `frameLoop.ts`: one eased `window.scrollTo({ top, behavior: 'instant' })` per tick over 900–1400 ms (longer for a longer page), with `behavior: 'instant'` on every step because `html { scroll-behavior: smooth }` is on at `motion-safe` and would fight it.
- Lift-off of the dots: the canvas does not know about the button. The particle chunk subscribes to a small request (`particlesRequest('launch', anchorIndex)` in the same `mascotRequests`-style module, or its own `particleRequests.ts`), lifts that anchor's `offsetY` with an easing over the flight time and resets it after. Only `transform`-like math on the canvas, nothing else moves.
- After the scroll, focus moves to the home link in the header, so keyboard and screen reader users continue from the start. There is **no element with `id="top"`** anywhere: browsers special-case `#top` as the document top, which is why the link works. That stays as is (adding `id="top"` would change where every `#top` link lands); the flight focuses the home link through a `data-home-link` hook, `preventScroll: true`. The button is a real `<a href="#top">` enhanced with JS, so it works without JS too.
- The flight runs on `frameLoop.ts`; only `transform` and `opacity`.
- A user scroll or a key press during the flight cancels it: the phone fades out at once, the page stays where the user put it. "User scroll" is read from `wheel`, `touchstart`, `pointerdown` and `keydown`, not from `scroll` events, because the flight itself scrolls.
- Motion levels: at `full` the full scene; at `calm` the dots shape still forms (scroll-driven), the flight is replaced by the browser's smooth scroll without the phone; at `off` the particles are not loaded (plan 3 §9) and the jump to the top is instant (the safety net already sets `scroll-behavior: auto`).
- High contrast: no particles (plan 3 §3); the button stays.
- Pip: the new pressable is an interactive target inside the footer's `data-pip-avoid`, so Pip steps off it on its own (plan 2 §1). Nothing to add.
- Budget: the flight code (`BackToTopFlight`, lazy) is loaded on the first hover / focus / tap of the button, like the a11y panel body (plan 3 §1). Before it loads, a click is a plain anchor jump.

## 8. Line draw: thinner, more and gradient lines

The outline drawing in `line-draw__visual` (`PhoneOutline`, `phone-outline.module.scss`) today has few lines (body, band, screen, island, buttons, camera, a few details), all `stroke-width: 1.3` in one flat `--color-stroke`. Goal: a finer, richer "blueprint" look.

**Thinner.** `stroke-width` about `0.6` for detail lines and `0.9` for the main body contour (two weights read better than one thin weight everywhere). `vector-effect: non-scaling-stroke` so the lines stay hairline-thin at every size of the drawing; with it the width is in CSS px, so `0.6` is less than one device pixel at `1dppx` and renders as a grey smear. Minimum under `@media (resolution < 1.5dppx)`: `0.75`.

**More lines.** New paths in `phone-geometry.ts` / `phone-outline.tsx`, grouped into the existing parts (so they draw in the same order) plus one new part `guides`:

- Body: a second inner contour (glass edge) and the band's inner edge.
- Screen: inner screen edge, a faint status bar line and home-indicator line.
- Camera: one more ring per lens, the lens glass "iris" lines, flash and microphone details, the plateau's inner edge.
- Buttons: inner outline of each button.
- Details: speaker and port slots on the bottom edge, more antenna breaks, SIM tray.
- `guides` (new, drawn first and quietest): construction lines like a technical drawing — center axes, a few dimension lines with ticks at the edges, thin arcs at the corner radii. They fade out a bit when the color render appears (§6), the main lines stay.
- Paths are generated from the existing geometry (`inset`, `circlePath`, `roundedRectPath`), not hand-drawn, so they stay aligned with the body and the render. New boxes (status bar, home indicator, speaker and port slots, SIM tray) go into `phone-geometry.ts` next to `front` / `back`, where `PhoneRender` can reuse them later.
- Target: about 2–3× as many paths as today; check the drawing stays fluid in the perf test (all paths animate only `stroke-dashoffset` and `opacity`, which is cheap for SVG of this size). The outline is in the prerendered HTML, so the extra paths grow the HTML by roughly 3–4 KB raw (less gzipped), not the JS bundle.

**Gradient.**

- One `<linearGradient>` in the outline SVG, `gradientUnits="userSpaceOnUse"`, diagonal across the phone: from the accent color (`--color-accent`, follows the finish) through `--color-stroke` to a cool tone at the other corner. Set through `stop-color: var(…)` in CSS on `<stop className>`, the way `phone-render.tsx` already does its shell and screen gradients, so a finish change retints it. The cool tone is a new token `--stroke-cool` with a value in all four token sets (dark, light, and both high contrast variants, where it equals `--color-stroke`).
- Main contour and camera rings use the full gradient; detail lines and guides use the same gradient at lower opacity (0.35–0.6), so the drawing has depth.
- Optional: a bright "drawing head" — while a part is drawing, its line is brighter near the end being drawn. Not "a second dash on the same path": one element has one `stroke-dasharray`, and every path already uses `pathLength={1}` with `1 1`. The head is a `<use href>` copy of the path (main contour and camera rings only, to keep the count down) with `stroke-dasharray: 0.06 1`, the same `stroke-dashoffset`, and a brighter stroke; it fades out when the part's `--draw-*` reaches 1. Chosen over a moving gradient because gradient transforms cannot read CSS variables in all browsers.
- High contrast (plan 3 §3): no gradient, one solid stroke at full opacity, weight back to at least 1.2, guides hidden. Forced colors: `CanvasText`.

**Scope.** `PhoneOutline` is also used in the hero (`view="front"`). The new lines and the gradient are a variant (`detail="blueprint"`) used by the line draw section; the hero keeps today's look unless we decide to use it there too (§12). The extra paths and the `<use>` heads are rendered only for the variant, so the hero's path count and its `draw-once` keyframes do not change.

**Timing.** The extra lines follow the new timeline of §6: `guides` in `0 – 0.1`, then the existing order squeezed into `0.1 – 0.6`. Today each step is `clamp(0, (p − start) / span, 1)` with hard-coded numbers in `LineDraw.module.scss`; they become `calc(var(--draw-from) + k * var(--draw-span))` with `--draw-from: 0.1` and `--draw-span: 0.5`, next to the §6 tokens, so one edit moves the whole drawing.

## 9. Tests (draft)

- **Unit:** letter picker (skips spaces, punctuation, links, buttons, numbers, scrub and decode text); chase only starts when Pip is idle, respects the cooldown and avoid zones (`mascotActs.test.ts`, `mascotRequests.test.ts`); rotated anchor points and the two angle rules (angle 0 gives the original points, clamp holds, pinned and unpinned cases) in `particleField.test.ts`; scrollbar tokens in all four token sets meet 3 : 1 in `config/contrast.test.ts`; `DecodeText` replays on a text change and is instant at `calm`; `RollingText` keeps the plain name.
- **E2e:** at `calm` and `off`: no runaway letters, no ring animation running; the `off` checks that already exist keep passing (`document.getAnimations()` running count 0, idle rAF count 0: the header line must not use a scroll timeline and the mark's spring must not tick at rest); text content of every block is the same before and after an escape (`innerText` compare) and the block's rect does not move; ring pulse has no `data-awake` when the button is off screen (as the nudge test checks today); header progress line matches `scrollY / (scrollHeight − innerHeight)`, the section label matches the nav `aria-current` for the four targets and is empty in the hero and at `#reserve`, the mark shows filled at `off` and without JS; footer links keep their plain accessible name (extend the existing pressable-name test); Back to top without JS jumps to the document top, with JS moves focus to the home link, and a wheel event cancels the flight; the rocket shape is formed (`settle ≥ 0.95`) at maximum scroll on desktop and mobile; screenshots of the scrollbar in Chromium and WebKit; screenshot of the line draw outline at progress 0.5 and 1 in all four finishes, in high contrast and in the light theme; the new reveal-threshold test from §6; the idle-nudge clock test unchanged.
- **Perf:** perf test unchanged at default settings (the full-page scroll gets more 120 px steps from the longer line draw section, nothing else). `check:cycles` and `check:unused` stay green: the letters ↔ Pip channel is a plain module, not an import between component folders.

## 10. Work order (draft)

Cheap CSS-only steps first, then the two line draw steps together (they share the timeline tokens), then the shared pieces that the header and footer both need, then the two big ones, letters last (the riskiest: DOM surgery inside live text).

| #   | Step                                                                                                             | Done when                                                                                                                                |
| --- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| L1  | Custom scrollbars (§4)                                                                                           | same look in Chromium, Firefox, WebKit, in all four token sets; layout e2e green                                                         |
| L2  | Endless button pulse (§3)                                                                                        | pulses at `full`, stops at `calm` / `off`, off-screen, on hover and during a nudge; idle-nudge e2e unchanged                             |
| L3  | Line draw: slower reveal and the blueprint outline (§6, §8)                                                      | reveal spans ~70svh on desktop, drawing speed unchanged, new paths aligned with the render, gradient follows the finish, perf test green |
| L4  | Turning particle shapes (§5)                                                                                     | smooth turn while scrolling, pinned and unpinned, no jump on gather / break apart, ticks stop at rest                                    |
| L5  | Shared pieces: `useDocumentProgress` on `<html>`, `LivingMark`, `RollingText`, `DecodeText` replay (§0)          | backdrop, buttons and hero eyebrow look and test exactly as before                                                                       |
| L6  | Header: progress line, living mark, section label, Pip reaction (§2)                                             | all four built, motion levels respected, nav and label agree, `off` e2e (animations 0, idle frames 0) green                              |
| L7  | Footer: link hover, living mark, rocket shape, Back to top flight (§7)                                           | all built, motion levels respected, focus lands on the home link, Pip still clears the footer links                                      |
| L8  | Runaway letters and Pip chase (§1)                                                                               | text stays intact for assistive tech, no reflow, gated by motion, high contrast and plain font; Pip chases and misses                    |
| L9  | Lint, typecheck, unit, e2e, perf, cycles, unused, README (motion section, accessibility section, budget numbers) | all green; §11 numbers measured and written into README "Known gaps"                                                                     |

## 11. Budget

Measured with `vite build` (gzip sizes from the build output), written into the README like the earlier plans.

| Chunk                                 | Limit        | What goes in                                                                                                                                                                        |
| ------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Main bundle                           | **+5 KB gz** | document progress hook, header line and label, `LivingMark`, `RollingText`, footer links, pulse CSS, scrollbar CSS, `DecodeText` replay, the Back to top pressable (not its flight) |
| `runaway-letters` (new, lazy)         | ≤ 3.5 KB gz  | picker, overlay, legs CSS; loaded after mount only at `full`, without high contrast or plain font                                                                                   |
| `back-to-top-flight` (new, lazy)      | ≤ 1.5 KB gz  | the flight, the trail, the own scroll loop; loaded on first hover / focus / tap                                                                                                     |
| Pip chunk (today 5.7 KB + 2.6 KB CSS) | +2 KB gz     | `chase`, the header glance and celebration, `mascotRequests`                                                                                                                        |
| Particles chunk (today 4.5 KB)        | +1 KB gz     | rotation, the `rocket` shape, the launch request                                                                                                                                    |
| Prerendered HTML                      | +4 KB raw    | the blueprint paths of the line draw outline (§8)                                                                                                                                   |

Gates that keep the lazy chunks off most visits: letters and chase need `full` and Pip on; the flight needs an interaction with one footer button.

## 12. Open questions

Decided by eye once built, unless stated.

- §1: headings vs body text chance (suggested: headings ×2).
- §2.1: the progress line at `off`. Written above as "follows the scroll without transition, like the nav indicator". The alternative is to hide it at `off`; the first is kept unless the `off` e2e test objects.
- §7.1: `↗` only for the font license, or `→` everywhere.
- §8: does the hero outline also get the blueprint look? Not in this plan; it would change the hero's `draw-once` timing and the LCP element.
- §7.3: if the rocket cannot fully form at maximum scroll on phones, the end-of-page rule in `settleAmount` (§7.3) or extra bottom padding; measured first.

## 13. Implementation notes

Where the build differs from the text above, the build is the rule.

- **Accessibility panel opens on click only (override of plan 3 §1, asked for during the build).** The handle is still a focusable button, but hover and keyboard focus no longer open or preview the panel; they only fetch the controls chunk. A click or Enter opens it, a second click, a click outside or Escape closes it, Escape returns focus to the handle. The `hover` and `peek` states and the "Enter to change settings" hint are gone; the state is `closed` or `open`.
- **Page position on `<body>`, not `<html>` (§2.1).** The particles watch the `style` attribute of `<html>` for finish changes, so `useDocumentProgress` writes `--doc-p` and `--scroll-v` on `<body>` instead. The scroll velocity is skipped under reduced motion; it eases back to zero on ticks that stop within half a second, so the idle frame count in the `off` test stays at zero.
- **Progress tip is a sibling of the line, not a child.** Inside the scaled line the glow would be squashed; the tip sits in the same track and moves with `translateX(calc((var(--doc-p) - 1) * 100%))` of its own full width.
- **Section labels come from `navigation`**, not a separate `headerCopy.sections`: same names, one source. The label re-decodes by remounting `DecodeText` with `key={label}`; `DecodeText` gained `durationMs` and `level="ambient"` (instant at `calm`).
- **Drawing heads are path copies, not `<use>`.** Styles in a `<use>` shadow tree are unreliable across browsers; the main contour and the three lens rings are rendered twice, the copy with a short dash (`0.05 1`) and `stroke-dashoffset: calc(1.1 - var(--draw))`, which puts the dash just behind the drawing end.
- **Endless pulse: hover, focus and a nudge use `animation: none`** rather than pausing, so the ring never freezes mid-pulse; the loop restarts from its rest state afterwards. The standard `scrollbar-color` has no hover value, so the brighter thumb on hover exists only on the WebKit fallback path.
- **Back to top drives the scroll itself** (`scrollTo` per tick with `behavior: 'instant'`) over 0.9–1.4 s, as planned; at `calm` the browser's smooth scroll is used. The rocket anchor is a 12 rem box fixed to the footer's top right. Measured at maximum scroll, its natural settle is 1 on desktop and about 0.96 on an iPhone 15 viewport, just over the 0.95 the tests ask for; since a taller footer on another phone would fall under it, the end-of-page rule from §7.3 is in (`settleAtPageEnd`, `particleField.ts`): at maximum scroll the last anchor counts as centred, except while it is lifting off.
- **Chase choreography.** The letter dodges once per approach: after a turn it must get clear of Pip's reach before it may dodge again, otherwise it turned twice in a row. Pip's `chase` walks at 4× its speed the way it faces; a `chase` request while already chasing only turns Pip. The letters never read Pip's code: `src/hooks/mascotRequests.ts` and `particleRequests.ts` are small request channels (`requestChannel.ts`). The chasing letter reads its line every frame, as planned: Pip's ground from Pip's rect (the sticky CTA lifts it) and its home spot from the block's current position, so a scroll during the chase does not leave it jumping back to a stale place.
- **The letters' legs are their own drawing, not the nav runner's.** The nav legs (`SectionNav.module.scss`, `.leg`) are 1 × 3 px pixel art under a 5 px phone; the letters need legs that scale with the font size (`em` units, a foot) and sit under a glyph of any size, so sharing the rules would have meant overriding every one of them. The walk cycle is the same idea (a rotate swing, alternating).
- **Both marks breathe in step.** `LivingMark` pins its `breathe` and `leaf-swing` loops to one clock: whenever `data-awake` appears, a negative `animation-delay` (`--breath-delay`, minus `performance.now()` modulo 4 s) is written, so the header and the footer mark are always in the same phase when both are visible.
- **A cancelled flight lands the rocket.** `BackToTopFlight` sends `particleRequests` a `land` for the `rocket` anchor on cancel, so the dots settle back into the shape instead of finishing the lift-off on their own.
- **Glyphs are hidden with the CSS Custom Highlight API, not a wrap (§1).** Wrapping one glyph in a `<span>` breaks kerning in Bricolage in Chromium, so the half-pixel check rejected almost every letter. A `Range` in a shared `Highlight`, painted `color: transparent` through `::highlight(runaway-letters)`, leaves the text node, the kerning and the layout untouched: no check, no unwrap. Browsers without the API (Firefox before 140) never run the letters. Letters skip `ScrubText` through `data-letters="still"` on its paragraph, and blocks whose words are still revealing (`opacity` of the first word span below 1).
- **Budget, measured:** main bundle 98.7 KB gz (+2.4 KB), runaway letters 3.4 KB + 0.5 KB CSS, Back to top flight 0.9 KB, Pip 6.1 KB (+0.4), particles 5.2 KB (+0.7). `ShapeParticles.tsx` is 191 lines and `useMascotBrain.ts` 156 after this plan, over the 150-line rule from plan 0; both were already at the limit before it.
