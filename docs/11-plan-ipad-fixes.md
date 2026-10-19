# Plan 11: iPad fixes

Builds on `0-plan-landing.md` … `10-plan-project-details.md`. Where this plan conflicts with an earlier one, this plan wins (plan-order note in plan 0). Everything not mentioned here keeps the earlier rules: no animation library, one rAF loop (`frameLoop.ts`) that reads before it writes and sleeps when nothing moves, visible without JS, all copy in `content/`, components under 150 lines, BEM class names, motion levels `full` / `calm` / `off` through the plan 3 mixins and hooks, and **the plan 6 rulebook (§2) for every animation**.

Goal: the page works on an iPad. Reported on iPadOS 18.3.1, in Safari and in Chrome (Chrome on iPadOS is WebKit with another UI, so both are one engine and get one fix):

1. Pip is not visible until the footer is reached.
2. Runaway letters vanish from the text, but no copy is seen running; they work only at scroll position 0.
3. In portrait the brand name in the header breaks onto two lines.
4. The particle shapes are made of dots stretched far vertically (`Screenshot_43.png`: streaks instead of dots).
5. The accessibility handle (`a11y-panel`) and the project details flag (`project-details-tab`) are not fixed to the window: they sit in the vertical middle of the page, half a page down.
6. `project-details-dialog__title` is sometimes visible and sometimes not.
7. `reserve__submit` (`pressable pressable--button`) is shorter than the email field next to it.
8. In landscape the figures in "The numbers" do not sit on one line (`Screenshot_42.png`, also in desktop Chrome at 1079 × 490).
9. The header trembles while scrolling.

What is built and what is still open is in §14. Most of it is one bug: in the iPad's WebKit, `body` is the containing block of every `position: fixed` element on the page (§2). Fix that first, then look at what is still wrong before going further.

## 0. Why the tests did not catch this

The `webkit-ipad` and `webkit-iphone` projects in `playwright.config.ts` run Playwright's WebKit, which reports itself as **Safari 27.2**. The iPad has **Safari 18.3**. For this page the two are different engines:

| Feature the page leans on                                                                  | Playwright WebKit (27.2) | iPadOS 18.3                       | Where it matters                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------ | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `animation-timeline: scroll()` / `view()`                                                  | yes                      | no (came in Safari 26)            | every pinned section, the backdrop, the header progress line and every reveal run on the JS fallback (`animationDriver.ts`) on the iPad |
| `container-type: inline-size` makes the container a containing block for `position: fixed` | no                       | yes, most likely (P0 confirms it) | §2: bugs 1, 2, 4, 5 and parts nobody reported yet (the sticky CTA, the Back to top flight, Pip's pebble)                                |
| CSS Custom Highlight API                                                                   | yes                      | yes (since 17.2)                  | the runaway letters (§3)                                                                                                                |

So the iPad runs code paths no test runs in WebKit: the scroll-timeline fallback, and fixed positioning inside a size container. §10 adds tests for both that run in Chromium, where they can be forced.

There is no Mac here, so no Safari Web Inspector. P0 (§1) gets the facts from the device itself.

## 0a. Overrides of plans 0 to 10

| Earlier rule                                                                                      | Plan 11 change                                                                                                                                                                  | Why                                                                          |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Plan 3 §4: `body` is the page container (`container: page / inline-size`)                         | The flow content gets a `.page` wrapper that is the container; the fixed layers live outside it in two fixed, viewport-sized wrappers that are containers named `page` too (§2) | in WebKit 18 a size container holds its `position: fixed` descendants (§2)   |
| Plans 0–10: each fixed component is a direct child of the React root                              | Fixed components render inside `.under` (the backdrop) or `.over` (everything above the header) (§2)                                                                            | same                                                                         |
| Plan 0 / plan 6 §10: the particle canvas takes its backing size from `innerWidth` / `innerHeight` | From its own box, through a `ResizeObserver` (§4)                                                                                                                               | a canvas whose CSS box and backing store disagree stretches its dots (bug 4) |
| Plan 4 §2.3: the section label shows from `md`                                                    | From `lg` (§6)                                                                                                                                                                  | at 744–810 px the bar has no room for it and the name wraps (bug 3)          |
| Plan 5 §12: a stat is a `column-reverse` flex column packed at the bottom                         | Packed at the top, so the figures of one row share a line (§8)                                                                                                                  | labels of different lengths push the figures to different heights (bug 8)    |

## 1. P0: facts from the device

Before any fix, one temporary diagnostic, so every later step is checked against the iPad and not against a guess.

- `?diag` in the URL (read once in `main.tsx`, nothing loaded without it) mounts a small fixed panel in the top-right corner that prints, live on scroll: `navigator.userAgent`; `CSS.supports('animation-timeline: scroll()')`; `'highlights' in CSS`; `scrollY`, `innerHeight`, `visualViewport.height`, `document.documentElement.scrollHeight`; the `getBoundingClientRect()` top and height of `.a11y-panel`, `.project-details-tab`, `.mascot`, `.sticky-cta`, the particle canvas (with its `canvas.height`), and of a probe `<div style="position:fixed;top:0;height:1px">` appended to `body`; and, while the details dialog is open, the title's rect, its computed `opacity` and `visibility`, the dialog's `scrollTop` and `CSS.highlights.size`.
- The panel itself is `position: fixed` and inside `body`, so on the broken engine it would sit at the top of the page. It is therefore appended to `<html>`, outside `body`, and shows `[probe fixed: OK]` or `[probe fixed: relative to body]` in large type.
- The reader takes three screenshots on the iPad: at the top of the page, in the middle (with the details dialog open) and at the footer. They go into `docs/media/plan-11/` and the numbers into §13.
- The `?diag` code is removed in the last step (P9); it never ships in a build that is measured.
- How the iPad reaches the build: `npm run build && npm run preview -- --host`, and the iPad opens `http://<LAN IP>:4173/?diag` on the same Wi-Fi (Windows asks once to let Node through the firewall). Every device check in this plan uses that route, so the iPad sees the prerendered build under test, not the dev server.

What P0 decides: if the probe says `relative to body`, §2 is the fix as written. If it says `OK`, the containing block is something else on the ancestor chain of `#root` (a `transform`, `filter`, `contain`, `will-change: transform` or `perspective` only under a touch or WebKit-only rule), and §2 is rewritten after a search for it before going further.

## 2. Root cause: `body` holds the fixed layers (bugs 1, 2, 4, 5)

`global.scss` gives `body` `container: page / inline-size`, so the breakpoints follow the text size (plan 3 §4). The container queries spec first said a size container gets layout containment, and layout containment makes the element the containing block of `position: fixed` descendants. The spec has since dropped that, and current Chromium and WebKit 27 follow it, so nothing shows on the desktop or in Playwright. WebKit 18 still does it, most likely (P0 confirms). Then every fixed element is placed against `body`, the whole page, instead of the window:

| Reported                                                                              | What the containment does                                                                                                                                                                    |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Pip shows only at the footer                                                       | `.mascot { position: fixed; bottom: … }` sits at the bottom of the page                                                                                                                      |
| 5. The handle and the flag are half a page down                                       | `top: 50%; translate: 0 -50%` is the middle of the page                                                                                                                                      |
| 4. Dots stretched vertically                                                          | the backdrop and its canvas are `inset: 0` of the page (about 14 000 px tall at 820 px wide) while the canvas draws `innerHeight` px: a 12× stretch                                          |
| 2. Letters vanish, no runner, correct only at scroll 0                                | the overlay is `inset: 0` of the page, but the copies are placed from `getBoundingClientRect()` (window coordinates): they land `scrollY` px too high, off screen; at scroll 0 the two agree |
| not reported yet: the sticky CTA, the Back to top flight, Pip's pebble, the skip link | the same, each at its page position                                                                                                                                                          |

**Reproduced in Chromium** (820 × 1180, `body { contain: layout }` added to simulate it, the plan 10 build):

| Element                               | as built, scroll 0 / 3000 | with layout containment, scroll 0 / 3000 |
| ------------------------------------- | ------------------------- | ---------------------------------------- |
| `.a11y-panel` top                     | 171 / 171                 | 6 629 / 3 629                            |
| `.project-details-tab` top            | 494 / 494                 | 6 953 / 3 953                            |
| `.mascot` top                         | 1 084 / 1 084             | 14 002 / 11 002                          |
| particle canvas, CSS / backing height | 1 180 / 1 180             | 14 098 / 1 180                           |

Every symptom of bugs 1, 2, 4 and 5 is in this table.

**Fix: the container leaves the fixed layers' ancestor chain.**

- `App.tsx` gets wrappers, each a still element with no paint of its own:
  - `.page`: the flow, `Header`, `main`, `Footer`. It takes `container: page / inline-size` from `body`.
  - `.under`: `position: fixed; inset: 0; z-index: z(backdrop); pointer-events: none; container: page / inline-size`. Holds `Backdrop`.
  - `.over`, once, before `.under` and `.page`: `position: fixed; inset: 0; z-index: z(mascot); pointer-events: none; container: page / inline-size`. Holds `A11yPanel`, `ProjectDetailsTab`, `StickyCta`, `MascotSlot`, `RunawayLettersSlot`, `ProjectDetailsSlot` and the Back to top flight (today `BackToTop.tsx` renders it lazily inside the footer; it becomes a portal into `.over`, found by `[data-fixed-layer]`).
  - The skip link stays a direct child of the root, first in the tab order: it has no container query, and after the fix no ancestor of it is a container.
  - One `.over`, not two (a first draft split it in two to keep Pip and the CTA after the footer in the tab order): measured in Chromium, each `.over` is a window-sized drawing layer, and the second one put the hero overdraw up by 1 to 1.7× (12.9× against 11.1–11.9×). The cost of one is a tab order with Pip's button right after the flag instead of after the footer; the sticky CTA is `inert` at the top of the page, so it adds no stop there.
- Why this works on both engines: a fixed element inside `.over` is placed against `.over` on WebKit 18 and against the window elsewhere, and `.over` is the window. It is one element inside `body`, but it is itself fixed with `inset: 0`, and its own containing block is the window on every engine because no ancestor of it is a container any more.
- Why `.over` and `.under` are containers too: the fixed components use `bp.up()` / `bp.down()`, which are `@container page` queries, and a query needs a container among the ancestors. A fixed `inset: 0` box is as wide as `body` (both exclude a classic scrollbar), so every breakpoint switches at the same width as before. `isLayoutAtLeast()` keeps reading `document.body.clientWidth`; the `frameLoop` body `ResizeObserver` stays on `body`.
- Stacking: `.over` is a stacking context at `z(mascot)` (35), above the header (30), as every layer in it is today. Inside it the existing tokens keep their order (sticky CTA 40, panel and flag 45); the skip link (50) is above it at the root. Nothing in the flow is meant to be above any of these; check the focus rings of header and footer links at P2.
- Pointer events inherit, so every interactive child of `.over` sets `pointer-events: auto` itself. The panel already does (`A11yPanel.module.scss`); the flag, the CTA and the details dialog rely on the default today and get it. Pip, the letters and the flight keep their own `none`.
- The `<dialog>` is in the top layer, which changes painting, not inheritance: inside `.over` it would inherit `pointer-events: none` and swallow no click, backdrop included, so `.root` in `ProjectDetailsDialog.module.scss` sets `pointer-events: auto`. Its `bp.up(md)` queries still find a container. The top layer's containing block is the viewport, whatever its DOM ancestors contain.
- Horizontal clip: `body { overflow-x: clip }` moves to `.page`. On a `body` with containment (a container) the value stayed on `body`; without it, it passes to the viewport as `hidden`, which still scrolls by script, and the footer waves made the page 5 px wider (caught by the a11y text-size e2e checks).
- Prerender: `scripts/prerender.mjs` renders the same tree, so the HTML gains the three wrappers and the first paint already has the fixed layers in place. Without JS the flag, the handle and the skip link work as before.
- Rules: the wrappers never move and take no per-frame writes (rule 1). They paint nothing, so Chromium should not give them layers; `npm run perf` checks that the hero layer count does not grow (§11).
- Size: `App.tsx` is 60 lines; it stays under 150.

**Rejected.** Media queries instead of container queries: `rem` in a media query is the browser's 16 px, not the root size, so the 200 % text layout (plan 3 §4) breaks. Detecting the bug and portalling the fixed layers only on WebKit 18: two DOM trees to test for one engine, and the detection itself is a fixed element measured at startup, a forced layout. `contain: none` on `body`: `container-type` sets the containment, and it cannot be undone while the container stays.

## 3. Runaway letters (bug 2)

§2 fixes the reported bug. After P2, on the device:

- A letter's copy appears over the glyph it replaces, at any scroll position, and walks back to it. If it does not, the overlay's coordinates are still off: compare the copy's rect with the original range's rect in `?diag`.
- The pebble (Pip's slingshot) lands on its letter.
- Both run on the frame loop's `lastScrollY()`; with the JS fallback on the iPad, check that a letter that is away while the reader scrolls stays on its glyph. If it lags a frame behind the text (the copy is in a fixed layer, the text scrolls on the compositor), the copy follows the text by one frame on iOS. That is acceptable for a walk; if not, the overlay goes into the flow (`position: absolute` in `.page`) instead of `.over`. That is a separate decision for §12.

## 4. Particle dots (bug 4)

§2 fixes the stretch. The canvas still takes its backing size from `innerWidth` / `innerHeight` and its CSS size from `inset: 0`, and those can disagree on their own: on iOS `innerHeight` changes when the address bar collapses, before or after the fixed box does. When they disagree, the dots stretch again by a few percent.

- `ShapeParticles.tsx` `layout()` reads the canvas's own content box from a `ResizeObserver` on the canvas (`devicePixelContentBoxSize` where it exists, `contentBoxSize` × the capped pixel ratio elsewhere) instead of `innerWidth` / `innerHeight`. That is plan 6 rule 3 ("sizes come from layout listeners or a `ResizeObserver`"); the old code also broke the rule's "never `innerWidth`".
- WebKit has no `devicePixelContentBoxSize`, so the iPad always takes the `contentBoxSize` branch; that is the expected path there, not a fallback.
- The address bar: the canvas box is `inset: 0` of `.under`, which on iOS changes height each time the bar collapses or returns, and every new backing size clears the canvas and reallocates it. The canvas is therefore `height: 100lvh` (the large viewport, with `100vh` before it for engines without `lvh`), so its box, and with it the backing store, holds still while the bar moves; the part under the bar is simply not seen.
- The particle field keeps its coordinates in CSS px of the canvas box, so the shapes stay where they are.
- The other `innerWidth` / `innerHeight` reads (`particleAnchors.ts`, `escapeChase.ts`, `escapeRunner.ts`, `useScrollSpy.ts`, `useMascotBrain.ts`) are window bounds for things placed in the window, and after §2 the window is what they are placed in, so they stay. They break rule 3's "never `innerWidth`" all the same; that goes into "Known gaps", not into this plan.
- A test in `particleField.test.ts` is not enough here; §10 adds an e2e check that the canvas's CSS height equals `canvas.height / pixelRatio` within 1 px.

## 5. Project details title (bug 6)

The title is a plain `h2` in the dialog head: no reveal, no letters (`data-letters="still"` on the dialog), nothing that should hide it. What might:

1. **§2 again, unlikely.** A top-layer element's containing block is the viewport whatever its ancestors contain, so the dialog should not be placed against `body`. It costs nothing to check after P2: if the title is still missing, §2 was not it; go on to 2.
2. **The dialog scrolls itself.** The UA gives `<dialog>` `overflow: auto`. If the panel is a few pixels taller than the dialog (`height: 100%` of `min(90dvh, 52rem)`, plus the safe-area padding), the dialog scrolls and focusing the title or the body can push the head out. `?diag` prints the dialog's `scrollTop`; if it is ever above 0, the dialog gets `overflow: hidden` and the panel `box-sizing: border-box` with the safe-area padding inside the height.
3. **`:root[data-details-open] { overflow: hidden }` on iOS.** iOS 18 honours it, but the scroll position can jump on open, and the dialog's `dvh` height is taken before the toolbar settles. Check with `?diag` whether `visualViewport.height` changes between open and the first paint.
4. **The open animation.** `details-in` animates `opacity` and `transform` of the top-layer dialog with `backwards`. A WebKit paint bug that leaves text unpainted after such an animation would show as "the title is missing until something repaints". Test with the motion level at Off: if the title is always there then, the animation goes from the dialog to the panel (an ordinary element).

Fix in that order, one per build, each checked on the device.

## 6. The brand name on two lines (bug 3)

`.home` (`inline-flex`) shrinks with the bar, and "Concept 18 Pro" wraps. Measured in Chromium and WebKit, the home link is 44 px tall (one line) at 744, 820, 834 and 1 024 px and 52–53 px (two lines) at 768 and 810 px, the iPad mini and the 10.2" iPad in portrait. With `white-space: nowrap` alone the bar overflows by 29 px at 768 px: the section label (89 px) and the nav (303 px) do not fit beside it.

- `.home`: `flex-shrink: 0`, and `.name`: `white-space: nowrap`.
- The section label shows from `lg` (64 rem) instead of `md` (decided, §12). It repeats the active nav link, so between 48 and 64 rem nothing is lost; the nav keeps its runner.
- Check the large-text rules: at `data-text-scale` the name is visually hidden below `sm`; nothing else changes.
- e2e: at 744, 768, 810, 820, 834 and 1 024 px wide the home link is one line (`height ≤ --tap-min`) and the bar does not overflow (`scrollWidth === clientWidth`).

## 7. Submit button shorter than the field (bug 7)

Both have `min-height: 3rem`, and the grid row holds `.field` (a grid wrapping the input) and `.submit`, so in Chromium and Playwright WebKit both are 48 px at every width. On the iPad the field is taller. The likely cause is the iOS UA style for text inputs: `-webkit-appearance: textfield` with its own line height and inner padding makes the input taller than `3rem`, `.field` grows with it, and the button keeps its own height. `.pressable` is `inline-flex`, and WebKit 18 may not stretch a `<button>` grid item.

- `.input`: `appearance: none`, `line-height: 1.2`, and a `height` of `var(--field-height)` (a new token, 3 rem) instead of `min-height`, so iOS cannot grow it.
- `.submit`: `height: var(--field-height)` too. A set height is not stretched, so there is no `align-self` to add; the two match because both are the same token.
- Larger text: `--field-height` is in rem, so it grows with the text scale; the button label must still fit at 200 % (below `sm` the row is one column, so the button already has its own line).
- Check in `?diag` mode on the device: the two heights match to the pixel. If the field is still taller, the extra comes from `font-size` (iOS zooms inputs under 16 px and some styles keep the zoom size); then `font-size: max(16px, var(--step-0))` on the input.

## 8. The figures in "The numbers" (bug 8)

Not an iPad bug: it shows in desktop Chrome at 1079 × 490 too. Each `.stat` is a flex column in `column-reverse` (the label comes first in the DOM, `dt` before `dd`, and is drawn under the figure). In `column-reverse` the main start is the bottom, so the default `justify-content` packs the figure and the label at the **bottom** of the grid cell. Grid cells in one row are as tall as the tallest, so a stat whose label is one line has its figure lower than a neighbour whose label wraps ("on each of the three rear cameras ¹" wraps its footnote mark; "of video playback on one charge ²" does not).

- `.stat`: `justify-content: flex-end` (in `column-reverse` that is the top), so every figure starts at the top of its row and the labels run on below, ragged at the bottom, which is where ragged text belongs.
- The first stat spans two rows at `lg` and today sets `justify-content: flex-end` already. It stays at the top like the others (§12), so that override becomes redundant and is removed, leaving one rule on `.stat`.
- e2e: at 1079 × 490, 1180 × 820, 1194 × 834 and 1440 × 900, the `.numbers__value` tops in one visual row differ by at most 1 px.

## 9. The header trembles (bug 9)

The header is `position: sticky`. On iOS a sticky element is moved by the scrolling thread, so it should be as steady as the content. What might shake it, most likely first:

1. **The giant fixed layers from §2.** Today the backdrop (`contain: strict`) and the particle canvas are page-tall on the iPad: about 820 × 14 000 CSS px, 2× that in device pixels, redrawn on every scroll frame (the canvas draws on scroll). That runs out of tile memory and stalls the compositor, and the sticky header is the most visible thing on screen. Recheck after P2 before anything else.
2. **The scroll-timeline fallback writes into the header on every frame.** Without timelines, `useDocumentProgress` sets `currentTime` on the progress line and tip animations from the main thread, and `useScrollVelocity` writes `--scroll-v` on the tip. The scroll position iOS paints is ahead of the one the main thread sees, so the line and its glow move a frame behind the page. If the reader means the line and not the bar, it is this. Fix: on engines without timelines, write the progress through `scaleX` / `translateX` on the frame loop's `write()` phase only when `lastScrollY()` changed (no change at rest), and drop the glow's speed opacity there.
3. **`content-visibility: auto` without scroll anchoring.** Safari has no `overflow-anchor`. When a section above the window is rendered at its real size instead of its `contain-intrinsic-size` placeholder, everything below jumps while the header stays. That looks like the header jerking against the content. `contain-intrinsic-size: auto …` remembers the last size, so it happens on the first pass down the page. `?diag` logs `scrollHeight` changes while scrolling; if they come with the jerks, the placeholders are set closer to the real heights at the iPad widths (measured, per section).
4. **The mesh blobs.** Four promoted, animated spans inside a sticky element with `isolation: isolate`. If 1 to 3 do not explain it, check with motion at Calm (the blobs stand still); if the shaking stops, the mesh drops `promote-while-awake` on touch screens.

Each step is checked on the device with a screen recording, not from a description.

## 10. Tests

- **The WebKit 18 fixed-position guard** (`e2e/fixed-layers.spec.ts`, Chromium projects): adds `contain: layout` to every element whose computed `container-type` is not `normal`, the way WebKit 18 treats a container, then at scroll 0, the middle and the end checks that the handle, the flag, Pip, the sticky CTA (where shown) and the particle canvas have the same window rects as without it. Picking the elements by their computed style, not by a class, makes it fail on the plan 10 tree (where `body` is the container) and pass after §2, and it catches any future container that ends up above a fixed component. `.over` and `.under` get the containment too, which is harmless: they are the window.
- **A config test** (`config/fixedLayers.test.ts`): every component stylesheet with `position: fixed` belongs to a component that `App.tsx` renders inside `.over` or `.under` (read from `App.tsx` itself, no separate list), or to one that portals into `[data-fixed-layer]`, so the rule is written down where it is checked. Exempt: `App.module.scss`, which declares the wrappers and the skip link.
- **The timeline fallback in Chromium** (an e2e project `desktop-no-timelines`). The page picks its branch in CSS with `@supports (animation-timeline: …)` and `@supports not (…)` (`_mixins.scss` `driven` and `reveal`, `Features`, `HeroExtras`, `ScrubText`), so overriding `CSS.supports` in JS changes nothing in the stylesheets, and `--disable-blink-features=ScrollTimeline` no longer does anything in current Chromium (checked: `@supports` still matches). Instead the project's fixture routes every `*.css` response and rewrites `@supports (animation-timeline:…)` to a condition that is false and `@supports not (animation-timeline:…)` to one that is true, and an init script makes `CSS.supports('animation-timeline…')` return false, so the JS side (`supportsScrollTimeline()`) agrees. The prerendered HTML has no inline CSS, so that covers every rule. The existing e2e specs run in it; the pinned sections reach their final frames, the progress line grows.
- The header (§6), the numbers (§8) and the canvas size (§4) checks named above.
- A `webkit-ipad-portrait` project (`iPad (gen 7)` at 810 × 1080) next to the landscape one, for the header.
- `npm run lint`, `npm test`, `npm run build`, `npm run test:perf` and `npm run perf` as in `CLAUDE.md`.

The emulated WebKit is not the iPad, so every bug is closed only on the device, with the P0 screenshots taken again (§1).

## 11. Budget

- Main JS: +0.3 KB gz at most (the wrappers, the canvas `ResizeObserver`, the fallback progress writer). `?diag` is a separate chunk, loaded only with the flag, and is gone at P9.
- Main CSS: +0.3 KB gz.
- Drawing layers: +0 at the hero. The wrappers paint nothing; if Chromium promotes `.over` because it is fixed over moving layers (as it did the plan 10 flag), that layer replaces the flag's, and the count is measured, not assumed.
- Frame times and recalcs: no change on the desktop. On the iPad the page-tall backdrop and canvas go, so it should get faster there; this is measured by eye and screen recording only, there is no probe for the device.

## 12. Decisions and open questions

- **Decided: the section label from `lg`** (§6), not a custom 56 rem step. It keeps to the breakpoint tokens; the label is accepted as lost on 834–1 023 px windows where it would fit.
- **Decided: the first stat is top-aligned** (§8) like the others, so the figures share a line across the whole row.
- **The letters overlay** (§3): stays in `.over` unless the device shows the copies lagging the text.
- **The header progress on engines without timelines** (§9 point 2): only if step 1 does not already stop the shaking.
- **Keep `?diag`?** It is removed at P9. If more device bugs are expected, it could stay as a separate chunk behind the flag, at the cost of keeping it working. Recommended: remove, and keep the code in the plan 11 commit history.

## 13. Work order (draft)

- **P0**: `?diag` (§1). Code done; the device run is open. Screenshots from the iPad at the top, the middle with the dialog open and the footer. Record the facts here.
- **P1**: the e2e guard (§10, first item), red on the current tree.
- **P2**: `.page`, `.under`, `.over` (§2). Guard green; device check of bugs 1, 2, 4, 5 and the sticky CTA, the flight and the skip link.
- **P3**: the canvas size from its own box (§4).
- **P4**: the numbers (§8) and the brand name (§6), with their e2e checks. Both reproducible on the desktop, so they need no device for the fix, only for the final check.
- **P5**: the submit height (§7), on the device.
- **P6**: the dialog title (§5), in the order listed, on the device.
- **P7**: the header (§9), in the order listed, on the device with a screen recording.
- **P8**: the fallback e2e project and the iPad portrait project (§10).
- **P9**: remove `?diag`; `npm run lint`, `npm test`, `npm run build`, `npm run test:perf`, `npm run perf`; update the budget table and "Known gaps" in `docs/README.md` from the probe output, and the "Checked in … not on real phones or tablets yet" gap with what was checked on the iPad.

## 14. Implementation notes

Done on 2026-10-18 without the device, in this order: plan review fixes, P1, P2, P3, P4, P5, P8, and `?diag` (P0's code, so the device run can start). P0's screenshots, P6 (the dialog title), P7 (the header) and every device check are still open: they need the iPad.

- **P1.** `e2e/fixed-layers.spec.ts` was red on the plan 10 tree with the numbers of §2 (Chromium, 820 × 1180, scroll 0: flag 494 → 6 953, Pip 1 084 → 14 002, canvas 1 180 → 14 098 tall) and is green after P2 on desktop and Pixel 7, four repeats each. It measures the handle button (`.a11y-panel__handle`), not the panel root, which grows when the controls mount on idle, and allows 1 px of rounding.
- **P2.** As §2, with one `.over` and the skip link at the root (see there for why), and `overflow-x: clip` moved from `body` to `.page`. Pointer events: `auto` on the flag, the CTA and the dialog.
- **P3.** `ShapeParticles` reads `canvas.clientWidth` / `clientHeight` in its layout listener (the read phase) and a `ResizeObserver` on the canvas queues a re-layout through `readInNextFrame()` when the box changes without a window resize. `devicePixelContentBoxSize` is not used: the backing store is capped at 1.5× (1× on touch), so the device-pixel size would be the wrong number anyway. The canvas is `height: 100lvh`. `ShapeParticles.tsx` is 237 lines (217 before), over the 150-line rule already before this plan.
- **P4.** As §6 and §8. The header and numbers e2e checks pass in Chromium, Firefox, Playwright WebKit (iPad landscape and portrait) and Pixel 7.
- **P5.** As §7, with one change: the button's set height applies from `sm`, where it sits beside the field; below `sm` it keeps `min-height`, so a wrapped label at 200 % text still fits.
- **Review fixes.** Pip's `data-behind` (stepping behind the footer when no spot is free) was `z-index: z(backdrop)`; inside `.over` that only sorts Pip among the fixed layers, so Pip stayed over the footer and caught taps on its links. It now fades out and passes pointer events, like `data-hiding`. The canvas gets `100vh` before `100lvh`, as §4 says.
- **P8.** `webkit-ipad-portrait` (`iPad (gen 7)`, 810 × 1080) and `desktop-no-timelines`. The latter runs against `scripts/serve-no-timelines.mjs` on port 4174 (a second `webServer` in `playwright.config.ts`), which serves `dist/` with every `@supports (animation-timeline: …)` rewritten false, every `@supports not (…)` true, and `CSS.supports` patched in `<head>`. The whole e2e suite passes in it (161, 1 skipped).
- **`?diag`.** `src/diag/diag.ts`, its own 1.2 KB chunk. The probe sits inside `.page`, the container, so even on this build it shows whether the engine places fixed elements against a size container: `[probe fixed: relative to .page]` on the iPad confirms the root cause.
- **Checks.** `npm run lint` clean apart from `docs/frontend-rules.md`, which Prettier flagged before this plan; `npm test` 52 files, 436 tests; e2e per project: desktop 161, desktop-no-timelines 161, Firefox 138 + 1 failure that passes 3 of 3 alone (Back to top without JS, a timeout under load), webkit-ipad 111, webkit-ipad-portrait 111, webkit-iphone 110, mobile 135, all passing otherwise.
- **Budget** (gzip of the built files against the same measure of the HEAD build): main JS +0.09 KB, main CSS +0.10 KB, particles chunk +0.09 KB, flight chunk +0.06 KB. `npm run perf`, interleaved with the HEAD build: hero overdraw 11.1–11.9× (HEAD 11.1–11.9×), drawing layers at the hero 49–60 (HEAD 49–58, the count is noisy), full scroll 19.2–19.4 ms mean (HEAD 19.2–19.7 ms). `npm run test:perf` fails only the layer check it failed before (desktop 50 against 48, Pixel 7 43 against 40).
