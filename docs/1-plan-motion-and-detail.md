# Plan 1: more motion, more detail, a mascot

Builds on `0-plan-landing.md`. Where this plan conflicts with plan 0, this plan wins (see the plan-order note in plan 0). Everything not mentioned here keeps the plan 0 rules: no animation library, one rAF loop (`frameLoop.ts`), only compositor-friendly properties in loops, reduced motion shows a calm final state, perf test stays green, all copy lives in `content/`, components stay under 150 lines.

## 0. Overrides of plan 0

| Plan 0 rule                                                    | Plan 1 change                                                                                                                                      | Why                                                                    |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| "No inline styles except the single `--p` write"               | Pointer position (`--mx`, `--my`, `--pull-x`, `--pull-y`) and the mascot position may also be written as custom properties                         | hover distortion and magnetic buttons need the pointer position in CSS |
| Particles settle only into the apple while Finishes is in view | Particles gather into a different shape beside every image; the apple stays for Finishes                                                           | page felt static between hero and finishes                             |
| Exploded view: 7 layers, nothing else moves                    | 7 layers in real build order plus small parts (screws, brackets, clips) that fly in from different directions                                      | more detail, honest structure                                          |
| Phone geometry: older square camera plateau                    | Silhouette in the spirit of the current Pro generation: full-width camera plateau, glass window on the back, thinner bezels. Close, not a 1:1 copy | must feel current, stays a concept                                     |
| Images on the right side in every section                      | Image side alternates right / left / right on md+                                                                                                  | rhythm                                                                 |
| "Smooth scroll: native only"                                   | Still native, now turned on: `scroll-behavior: smooth` for nav anchors, off under reduced motion                                                   | nav jumps felt abrupt                                                  |
| Sheen uses `overflow: hidden` on the host                      | Button gets explicit inner layers (see §5), so the pulse ring can sit outside the box while sheen and fill stay clipped                            | pulsing buttons                                                        |
| Fixed z-index map                                              | New layer `mascot` between `header` and `sticky-cta`                                                                                               | mascot walks above content, under the sticky bar                       |
| JS budget < 60 KB gz (currently ~83 KB)                        | Plan 1 may add at most **+10 KB gz** to the main bundle; the mascot and the shape data are code-split like the particle canvas                     | more features without making the gap worse                             |

## 1. Motion budget and pause control

Applies to every section below.

- **Pause control (WCAG 2.2.2).** A "Pause motion" toggle (real `<button aria-pressed>`) in the header and footer stops every looping or ambient motion: button pulse, living surfaces, hero float, particle wobble, mascot. The setting is stored in `localStorage` (wrapped in try/catch) and read through `useSyncExternalStore` with a server snapshot of "not paused". Scroll-driven effects keep working, they follow the reader and are not ambient.
- **Ambient = finite or off-screen-paused.** Anything that loops runs only while its element is in view (IntersectionObserver) and only while the tab is visible. Loops with no reason to be endless are finite (pulse: 3 cycles per entry into view).
- **Reduced motion** keeps plan 0 behaviour: calm final state, no loops, no mascot.
- **Compositor only in loops.** Loops animate `transform` and `opacity` only. Filters are allowed only on a small, fixed-size element (see §6) and never on a full-width layer.

Done when: with "Pause motion" on, the Performance panel shows no rAF activity while the page sits still; with it off, nothing ambient animates off screen.

## 2. Particles gather beside every image

- Any element with `data-particles="<shape>"` is an anchor. Shapes: `spark` (hero), `compass` (line draw), `gear` (exploded view), `lens`, `sun`, `chip`, `lattice` (feature cards), `apple` (finishes), `check` (reserve).
- Shapes are polylines in a unit square, sampled evenly into as many points as there are particles. Sampling runs once per shape on layout or when the particle count changes, never per frame. Apple keeps its generated point file.
- Anchor geometry is measured on layout only (document offsets, sticky stage offsets), never per frame. Pinned anchors use sticky math so the shape stays put while the section is pinned.
- Every frame: weight per anchor from distance to viewport center, sharpened (`w^6`) so crossovers are short; particles blend between drift and the weighted target.
- Shape sits beside the image on the outer side on md+, centered behind it on phones.
- While a shape is formed, a slow breathing wobble runs on the tick loop at **30 fps** (every second frame redraws). It stops when no shape is formed, when the canvas is off screen, when the tab is hidden or when motion is paused.

Done when: scrolling top to bottom shows a different shape at each image, no jumps at crossovers, the wobble stops when paused, perf test green. Unit test: sampling a polyline returns exactly N evenly spaced points inside the unit square.

## 3. Alternating image sides

Order on md+: Hero right, Line draw left, Exploded view right, Finishes left, Reserve right. Phones keep copy first.

Features keeps its asymmetric grid from plan 0. Inside it, the titanium card puts its sample on the left of its text on md+; that is a card layout detail, not part of the section rhythm.

## 4. Phone drawing in the spirit of the current Pro

Trademark rule (keeps plan 0 safe): the drawing may follow the current generation's proportions, but no part is traced 1:1, the lock screen is an own design, and **no Apple feature names appear in visible copy, labels or alt text**. Use generic names: "camera button" not Camera Control, "magnet ring" not MagSafe, "face sensors" not TrueDepth, "pill cutout" not Dynamic Island, "depth sensor" not LiDAR. Internal code names may stay short and descriptive (`island`, `magnetRing`).

- Front: thinner bezel, pill cutout, earpiece slit, antenna breaks on the band, action button + volume on the left, side button + camera button on the right.
- Back: full-width camera plateau with rounded top corners; three lenses in a triangle on the left; flash, microphone and depth sensor on the right; glass window below the plateau with the own mark.
- Render: own lock screen with time, date, status bar, two quick-action buttons, home indicator. No iOS fonts, icons or wallpapers.
- Line draw: new `details` group (earpiece, antenna breaks, glass window) drawn in its own window.

Done when: front and back look right at 320 and 1440, and a search of `content/` for Apple feature names returns nothing.

## 5. Exploded view with real parts

Layers back to front, as a phone is actually stacked:

1. Back glass and housing: plateau, glass window, magnet ring and charging coil on the inside.
2. Frame: band, antenna breaks, vapor chamber, USB-C port, speaker grille, button stubs.
3. Camera module: three sensor housings with lens barrels, depth sensor, flash, flex cables.
4. Battery: stacked cell, connector flex, pull-tab adhesive, haptic motor and loudspeaker beside it.
5. Logic board: L-shaped board around the camera, SoC, memory, modem, shields, connectors, passives.
6. Display: OLED panel, face sensors under the cutout, earpiece, flex tail.
7. Front glass: cover glass with an anti-reflective sheen.

Small parts fly in from different directions, each in a short window after its layer lands, spinning and shrinking onto its spot: pentalobe screws at the bottom edge, tri-point screws on shields, camera bracket screws, battery connector bracket, haptic motor and speaker screws, display connector cover, antenna clips.

- Parts are `aria-hidden` art, not list items. The labels list stays 7 entries (5 on phones).
- Phones (compact view, 5 layers): only the parts of those 5 layers, at most 6 parts in total, spread kept inside the stage.
- Every part animates `transform` and `opacity` only, from the same `--p`.

Done when: assembles forward, disassembles back, no part or layer overlaps the labels at 390, 768 and 1440.

## 6. Buttons that want to be pressed

DOM of a primary button (one shared component, `PressableLink`):

```
<a class="button">
  <span class="ring" aria-hidden>          pulse ring, outside the box, not clipped
  <span class="surface" aria-hidden>       clips its children (overflow: hidden)
    <span class="fill">                    liquid fill
    <span class="sheen">                   sheen sweep
  <span class="label-sr">Reserve</span>    visually hidden, the accessible name
  <span class="label" aria-hidden>         one span per letter for the roll
```

- Pulse: the ring scales out and fades, every 2.6 s, 3 cycles each time the button enters the view, then stops. Off when motion is paused.
- Hover (pointer devices): magnetic pull toward the cursor (max 6 px, `--pull-x/y`), a liquid fill that spreads from the cursor entry point, letters roll up one by one. Hover does **not** change the running pulse duration (that makes it jump); it starts one extra ring instead.
- The hit area does not move with the pull: the pull is applied to an inner wrapper, the `<a>` itself stays put.
- Keyboard focus gets the fill without the pull. Touch gets the plain press from plan 0.
- Reduced motion: no pulse, no pull, no roll; plain color change.

Done when: Tab, Enter, Space and touch work as before; axe sees one accessible name per button; e2e checks that the name is the plain label.

## 7. Dark blocks are alive

- Cards, CTA strip, reserve panel and the page backdrop get a living surface: wave lines in the accent color drift slowly (`transform` loop on a pre-drawn SVG tile). Runs only while the surface is in view and motion is not paused.
- On hover the area under the cursor distorts. The distortion is a **fixed-size lens** (about 160 px circle) that follows the pointer by `transform`; only that small element carries the SVG displacement filter and a soft glow. No filter on the full surface, no filter on the backdrop.
- One delegated pointer listener for the whole page writes `--mx/--my` on the hovered surface, coalesced into the shared frame loop.
- Touch-only devices (`hover: none`): waves stay, the distortion lens is not rendered. Reduced motion: waves static, no lens.

Done when: Performance panel while hovering a card shows paint only inside the lens; perf test green in Chromium; Firefox and WebKit checked by hand for frame drops.

## 8. More motion overall

- Hero: headline words rise in on load with pure CSS, visible without JS. The words animate `transform` only and start at full opacity, so the h1 counts for LCP on the first paint. The subline may fade. The hero phone floats gently after drawing (ambient, see §1).
- Section titles reveal word by word on scroll (view timeline, IntersectionObserver fallback). Visible without JS, as plan 0 K5.5 requires.
- Finishes: the phone does a short tilt-and-settle every time the finish changes; rapid changes restart it cleanly (K5.12).
- Native smooth scroll for nav and in-page links (`scroll-behavior: smooth`), disabled under reduced motion. The skip link still jumps instantly and moves focus: its click handler calls `scrollIntoView({ behavior: 'instant' })` on `#main`, which overrides the CSS setting.

Done when: Lighthouse LCP is no worse than before plan 1; the e2e tests that read scroll position after a hash jump wait for scrolling to settle instead of reading it immediately.

## 9. Mascot: "Pip"

A pocket-sized phone with legs. The pill cutout is its face: it widens into eyes, squints, turns into a mouth.

Behaviour:

- Walks along the bottom of the window, turns around at the edges and when the reader changes scroll direction.
- Random acts between walks: takes a selfie (turns, flash pops), runs out of battery and naps (low battery icon, floating Z), dances, trips and gets back up, checks itself in an imaginary mirror, short speech bubbles with dry jokes.
- Fast scrolling blows it back: leans, holds on, says "whoa".

Accessibility and safety:

- It is a real `<button>` labelled "Poke Pip"; poking makes it jump and complain. It sits last in the DOM, after the footer, so it is the last Tab stop and never interrupts reading order.
- When it receives keyboard focus it stops walking until focus leaves, so the target never moves under the user.
- Speech bubbles are `aria-hidden`; they are jokes, not information. The poke reply is announced once through a single polite live region.
- It never covers something the reader needs: it hides while the pointer or focus is within 120 px of it in the footer, form or sticky CTA, and on phones it walks above the sticky CTA. On screens narrower than 360 px it is not rendered at all while the sticky CTA is visible.
- Hidden under reduced motion and when motion is paused (§1). Pauses while the tab is hidden.

Implementation:

- Code-split with `React.lazy`, rendered only after mount (not part of the prerendered HTML).
- Split into small pieces: `Mascot` (position and walking), `MascotFace`, `MascotActs` (the act timeline), `useMascotBrain` (state machine). Each under 150 lines.
- Randomness is called only inside effects and timers, never in render (plan 0 K2), through one injectable `random()` so tests can pass a seed.
- Only transforms and opacity; timers are named constants, all cleared on unmount.
- Every speech bubble lives in `content/copy.ts` and passes the K6 copy checks.

Done when: walks, acts, reacts to scroll and pokes; e2e pokes it by role and name and sees the reply; it never overlaps the focused element in a keyboard run.

## 10. Work order

| #   | Step                                                                               | Done when                                                                        |
| --- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| P1  | Plan files renamed and cross-referenced                                            | this file exists, plan 0 has the precedence note                                 |
| P2  | Pause control and in-view gating (§1)                                              | toggle works, persists, stops every loop added later                             |
| P3  | Phone geometry and render (§4)                                                     | front and back right at 320 and 1440, no Apple feature names in `content/`       |
| P4  | Exploded view: reordered layers, detailed art, flying parts (§5)                   | assembles forward, disassembles back, no overlap with labels at 390 / 768 / 1440 |
| P5  | Alternating sides (§3)                                                             | md+ layout alternates, phones unchanged                                          |
| P6  | Particle anchors and shapes (§2)                                                   | a shape beside each image, sampling unit test green                              |
| P7  | Buttons: `PressableLink` with pulse, magnetic hover, liquid fill, letter roll (§6) | keyboard, touch and reduced motion still fine, accessible name checked in e2e    |
| P8  | Living surfaces with the hover lens (§7)                                           | paint only inside the lens, perf green                                           |
| P9  | Hero/title/finish motion, smooth scroll (§8)                                       | visible without JS, LCP not worse, hash tests updated                            |
| P10 | Mascot (§9)                                                                        | walks, acts, reacts to scroll and pokes; keyboard and screen reader checks pass  |
| P11 | Lint, typecheck, unit tests, e2e, perf, bundle size                                | all green, main bundle grew by at most 10 KB gz                                  |
| P12 | README "Known gaps" and "How the motion works" updated                             | describes the pause control, the mascot and the new budget numbers               |
