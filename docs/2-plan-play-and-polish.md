# Plan 2: play and polish

Builds on `0-plan-landing.md` and `1-plan-motion-and-detail.md`. Where this plan conflicts with an earlier one, this plan wins (plan-order note in plan 0). Everything not mentioned here keeps the earlier rules: no animation library, one rAF loop (`frameLoop.ts`), only `transform` and `opacity` in loops, reduced motion shows a calm final state, the pause control stops everything ambient, visible without JS, all copy lives in `content/`, components stay under 150 lines, randomness only in effects and timers.

## 0. Overrides of plans 0 and 1

| Earlier rule                                                                                                    | Plan 2 change                                                                                                                                             | Why                                                                        |
| --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Plan 1 §9: Pip fades out while the pointer or focus is within 120 px of an avoid zone                           | Pip keeps itself off links and steps aside instead of fading; it fades only when keyboard focus lands on something it covers (§1)                         | at the bottom of the page Pip vanished as soon as the pointer came near it |
| Plan 1 §9: poking makes it jump and complain                                                                    | Single poke still complains; 2, 3 and 4 quick pokes trigger combos (§2)                                                                                   | more to discover                                                           |
| Plan 1 §6: pulse runs 3 cycles per entry into view, then the button is still                                    | After the pulse, hero and sticky CTA buttons keep an idle nudge: one short move every 7 s, at most 5 per entry into view (§4)                             | buttons went quiet too early                                               |
| Plan 1: only section titles reveal on scroll                                                                    | Ledes, body copy, mono labels and one statement per page also animate with scroll (§3)                                                                    | text felt static between the visuals                                       |
| Plan 1 §5: exploded view ends when the front glass lands, layers stay partly transparent, fixed isometric angle | Landed layers are opaque, the stack has a real band edge, the screen wakes under clear glass and the camera turns to a three-quarter view at the end (§9) | the assembled stack read as a white rectangle, not a phone                 |
| Plan 0: SCSS modules with Vite's default scoped names                                                           | Generated names follow BEM (`block__element--modifier`), block from the module file name, no hash (§11)                                                   | readable DOM, names no longer start with `_`                               |
| Plan 1 §6: one shared `PressableLink` for primary links                                                         | Shared inner part with `PressableLink` and `PressableButton`; the reserve submit button uses it (§10)                                                     | the submit button had no hover motion                                      |
| Plan 1 budget: +10 KB gz main bundle                                                                            | Plan 2 may add at most **+6 KB gz** to the main bundle and **+4 KB gz** to the Pip chunk; hero extras that are not above the fold are code-split          | keep the gap to the 60 KB target from growing faster than the features     |

## 1. Bug: Pip disappears at the bottom of the page

**Cause.** `useMascotAvoidance` hides Pip when the pointer target is inside `[data-pip-avoid]` and the pointer is within 120 px of Pip. At the bottom of the page Pip stands on top of the footer, which is an avoid zone. Any approach to Pip crosses the footer first, so Pip fades out. Once hidden it has `pointer-events: none`, so the pointer now hits the footer underneath, which keeps it hidden. Pip can never be hovered or poked there.

**Fix.** The poke button covers Pip's whole width and takes the pointer, so while Pip stands on a link the pointer can never reach that link. Pip therefore keeps itself off interactive targets on its own, by geometry, instead of waiting for the pointer.

- Interactive targets are `a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])` inside an avoid zone. Plain footer text does not count.
- **Standing rule (geometry, no pointer needed):** at the end of every walk segment and on scroll frames, Pip checks whether its rect (plus 8 px) overlaps an interactive target. If it does, it hurries to the nearest free spot along its walk line (walk speed ×3, short "excuse me" lean), then resumes. Walk targets are picked so they do not end on a target in the first place.
- **Approach rule (pointer):** a pointer **outside** Pip's rect that is within 24 px of an interactive target, which in turn overlaps Pip's rect plus 24 px, also makes Pip step aside. "Pointer near Pip" alone is not a reason.
- A pointer **inside** Pip's rect (plus 8 px) always wins: Pip never moves away from a pointer that is reaching for it. This cannot trap a link, because the standing rule already keeps Pip off links.
- If no free spot exists along the walk line (narrow viewport, footer row full of links), Pip stays where it is and lowers its own `z-index` below the footer's, so the links stay clickable and Pip peeks out from behind them. It never fades for the pointer.
- Fading stays only for keyboard focus on an element Pip covers, as plan 1 requires; the fade lasts until focus moves on.
- Hysteresis: a stepping-aside decision holds for at least 600 ms, so Pip does not jitter at the border.

**Tests.** Unit tests for the pure decisions: `overlapsTarget(pipRect, targetRects)`, `freeSpot(pipRect, targetRects, lineBounds)` and `shouldStepAside(pipRect, pointer, targetRect)`. E2e: scroll to the bottom, expect Pip's rect to overlap no footer link; move the pointer onto Pip, expect it visible and `Poke Pip` clickable; click every footer link with the pointer (Playwright's actionability check fails if Pip covers one).

## 2. Pip: more moves, poses, lines and combos

**New random acts** (added to `randomActs`, same timeline and copy rules):

| Act        | What happens                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------- |
| `wave`     | stops, turns to the reader, waves with one arm, short "hi" bubble                                 |
| `ring`     | vibrates in place with buzz lines, looks at its own screen, declines the call ("Unknown number.") |
| `charge`   | a cable slides in from the screen edge, plugs into its port, battery icon fills, happy squint     |
| `moonwalk` | walks backwards for one walk segment, facing the other way                                        |
| `stretch`  | arms up, body stretches tall (`scale`), small yawn                                                |
| `juggle`   | juggles three screws (the ones from the exploded view), drops the last one, picks it up           |

**Arms.** Pip has only legs today (`MascotArt.tsx`). `wave`, `stretch` and `juggle` need two small arms: one shared arm path, mirrored, drawn only while one of these acts or the airplane combo runs. Counted in the Pip chunk budget (§0).

**Idle pose:** while held by hover or focus, Pip's eyes follow the pointer (eyes shift by at most 1.5 px, written as a custom property from the existing pointer frame).

**More lines:** `quips` and `complaints` grow to at least 8 entries each. The single-line acts (`selfie`, `nap`, `mirror`, `trip`, `blown`) become pools of at least 3 lines; `lineFor` picks from them the same way it does for quips. New acts get pools of at least 3 from the start. Poke complaints get a section-aware pool: if the section under Pip is Finishes, Inside or Reserve, one of three lines specific to it can come up (e.g. "Careful, that finish is new.").

**Combos.** Pokes are counted while each next poke comes within 450 ms of the previous one; the combo resolves 450 ms after the last poke. Mouse, touch and repeated Enter/Space on the button all count.

| Pokes | Combo         | What happens                                                                                                  |
| ----- | ------------- | ------------------------------------------------------------------------------------------------------------- |
| 1     | complaint     | as today: jump and a line                                                                                     |
| 2     | screenshot    | screen flashes white once, a tiny polaroid of the page drops out and fades ("Saved to my camera roll.")       |
| 3     | dizzy         | spins 720°, eyes turn into spirals, staggers two steps, sits down                                             |
| 4+    | airplane mode | "Fine. Airplane mode." Wings fold out, it takes off, loops once over the bottom of the screen, lands and bows |

- Pokes during a running combo are ignored; the combo cannot be restarted until it ends.
- The flash in "screenshot" is a single flash on Pip's own small area, nothing near 3 flashes per second (WCAG 2.3.1).
- The airplane flight stays inside the bottom 40 % of the viewport and never above the sticky CTA's interactive area.
- Each combo announces one short text through the existing polite live region.

**Hints.** Sometimes Pip says a hint instead of a quip: "Psst. Poke me twice.", "Three pokes. I dare you.", "Four pokes and I fly." Rules: not before the second random act, at most one hint per 4 acts, at most 3 per session, never a hint for a combo the reader has already found. The found combos and hint count live in `sessionStorage` (wrapped in try/catch, works without it).

**Code.** `mascotCombos.ts` (pure counter with an injected clock, unit-tested), `mascotHints.ts` (pure scheduler, unit-tested), new act CSS in its own module so `Mascot.module.scss` does not keep growing. Combo art (wings, spirals, polaroid, cable) is drawn only while its act runs.

**Done when:** every new act plays and returns to walking, combos trigger at exactly 2, 3 and 4 pokes in unit tests and 5 or more pokes still give airplane mode (not a new combo), e2e pokes twice and three times quickly and reads the live region.

## 3. Text animates with scroll

Same no-JS rule as `RevealTitle` today: the view-timeline animation sits under `@supports (animation-timeline: view())` and `prefers-reduced-motion: no-preference`, so its start state exists only inside the animation; without view-timeline support, `useReveal` sets `data-reveal="hidden"` / `"shown"` and only `[data-reveal='hidden']` hides anything. Without JS, text is either animated by CSS alone or fully visible (plan 0 K5.5). Effects that need JS (decode, word scrub) render their extra markup only after mount. Reduced motion shows the final state.

- **Ledes and body paragraphs:** rise 12 px and fade in on entry, siblings staggered by 60 ms. Same mechanism as `RevealTitle` (view timeline, `useReveal` fallback). Once per element in the fallback; scrubbed by the view timeline otherwise, as titles are.
- **Mono labels and eyebrows:** short decode effect on entry: characters cycle through a few glyphs and settle left to right in about 500 ms. The real text stays in the DOM for screen readers; the animated copy is an `aria-hidden` overlay added after mount and positioned over the real text (which goes `visibility: hidden` only while the overlay runs), like the button letters. Cycling glyphs are taken from the same font and the overlay is absolutely positioned, so width changes never move layout.
- **One scroll-scrubbed statement:** Numbers gets a one-sentence intro under its title (new `numbersCopy.intro`) and gets its own crossing progress (`useViewProgress`: `--p` runs 0 → 1 while the sentence's top travels from 90 % to 40 % of the viewport; `useScrollProgress` only measures pinned sections). The sentence lights up word by word: each word goes from opacity 0.5 to 1 (0.5 keeps 4.5:1 contrast while dim), driven by that `--p`. Scrubbed, so it follows the reader backwards too. Without JS `--p` is unset and the words fall back to opacity 1.
- **Chip table in Features:** the rows of the cores table rise one after another on entry (same stagger as paragraphs). The feature cards have no number-and-unit pairs, so there is no unit slide-in.

**Done when:** text is fully visible with JS off and with reduced motion, no layout shift from any of the effects (CLS unchanged), perf test green.

## 4. Primary buttons that keep asking

Applies to the regular-size `PressableLink`s: hero and sticky CTA. The compact header button only runs the pulse, no idle nudges. The reserve submit button gets no nudges either: when its field is empty, the email bugs (§5) already move right next to it, and two attention effects in one spot are one too many.

- After the existing pulse, the button keeps an **idle nudge**: one short move every 7 s while it is in view, the tab is visible and motion is not paused. At most 5 nudges per entry into view; stops for good after the reader hovers or focuses it once.
- Nudges alternate:
  - **Buzz:** the button vibrates like a phone on a table: 3 quick `translate` jitters of 1.5 px, two short buzz marks flash at its sides.
  - **Sheen:** the existing sheen sweep runs once more.
- **Border beam** (hero button only): a narrow accent highlight travels around the border once per nudge. Drawn on a pseudo-element with a conic gradient that rotates (`transform`), masked to the border ring.
- Hit area, accessible name and the plan 1 hover/press behaviour do not change. Reduced motion: none of this.

**Done when:** nudges stop after 5 or after one hover, nothing runs off screen or with motion paused, keyboard and touch unchanged.

## 5. Email field: bugs run away on focus

- At rest, three tiny bugs (software "bugs", 8 px beetles, `aria-hidden` SVG) sit in the right padding of the empty email field, legs twitching slowly while the form is in view. They never cover typed text and ignore the pointer (`pointer-events: none`).
- **On focus** a scan line sweeps the field once and the bugs scatter: 6 bugs (3 from rest plus 3 from under the field) run off in different directions, legs animating, and fade out within 700 ms. Directions are fixed per bug in CSS custom properties, not random in render.
- **On blur with an empty field** they creep back slowly.
- **On an invalid submit** they run back in and sit on the field next to the error message; the error text itself stays the information, the bugs are decoration.
- **After success** no bugs.
- The focus ring stays the plan 0 ring; the animation is added next to it, never instead of it.
- Reduced motion or paused: no bugs, plain focus ring.

**Done when:** focus, blur, invalid submit and success each show the right state; axe clean; typed text is never covered at 320 px.

## 6. More to see on load: phones and parts in the hero

The h1 stays the LCP element and nothing below delays it. All of this starts after the headline words have risen.

- **Screen boots:** after the outline draws, the hero phone's screen lights up (opacity), shows the time from `useMinuteClock`, then three notifications slide in one after another and stay: "Pre-orders open Nov 20", "31 h of video on one charge", "Pip: let me out". Copy in `content/`. Notifications are `aria-hidden`; the same facts are already on the page.
- **Floating parts:** 5 to 7 small parts drift slowly around the phone. Screws reuse the three screw components from `small-parts.tsx`; a lens, the chip, a battery cell and a SIM tray are new art in the same file and the same style (simple shapes, token colors), counted in the §0 main bundle budget. On pointer devices they shift with the pointer in 3 depths (parallax, at most 12 px). They fade out as the hero scrolls away. Ambient: in view only, paused with the toggle.
- **Charging cable:** a cable draws in from the bottom edge (stroke) and plugs into the phone's port; a ring around the port fills once, then the cable stays.
- **Pip arrives:** on first load Pip walks in from the left edge instead of appearing in place.
- Phones: floating parts limited to 3, no parallax; the rest unchanged.

**Done when:** Lighthouse LCP and CLS no worse than before plan 2, the hero has visible motion for about 4 s after load and then settles, everything ambient stops when paused.

## 7. Active state in the main navigation: a walking phone

- **Scrollspy:** one IntersectionObserver on the nav targets (`#design`, `#inside`, `#numbers`, `#finishes`) with a band around the vertical middle of the viewport, plus `#reserve` as an end marker. The active link is the last nav target whose top has passed the band: Features (no id, between Numbers and Finishes) keeps Numbers active. Above the first target (hero) nothing is active, and from the moment `#reserve` reaches the band (Reserve and footer) nothing is active either. The active link gets `aria-current="location"` and full text color. The choice of the active section is a pure function (`activeSection(targetTops, endTop, bandY)`), unit-tested for hero, each target, Features and Reserve.
- **Indicator:** one element per nav list, under the links: a small phone lying horizontally (landscape), with a camera bump at its front end and two pairs of legs underneath. Its body is exactly as wide as the active link's **text**, not the padded pill.
- **Running:** when the active link changes, the phone turns to face the direction of travel, runs to the new link (`translate`), legs stepping only while it moves, and settles with a small bob. The width change is done with `scaleX` on the body's middle segment between two fixed end caps, so the legs and the camera bump are never distorted. All compositor-only.
- Link positions and text widths are measured on layout only (resize, font load), never per frame.
- On a nav click with smooth scroll, the phone runs straight to the clicked link instead of stopping at every section passed on the way.
- Reduced motion: a plain accent underline at text width that jumps without transition. Paused motion: the phone still moves (it follows the reader, not ambient), legs do not step.
- Phones: the nav is hidden below md, nothing changes there.

**Done when:** scrolling through the page moves the phone link by link, the width matches the text at 768 and 1440, `aria-current` is checked in e2e.

## 8. The chosen finish survives a reload

Today the finish picked in Finishes recolors the whole page (`--accent-h/s/l` on `<html>`), but the choice lives only in React state, so a reload falls back to the first finish.

- The chosen finish id is stored in `localStorage` under `concept-18-finish`, read and written in try/catch, the same way `motionPause.ts` stores the pause setting. Unknown or broken values fall back to the first finish.
- **No flash of the default color:** a tiny inline script in `<head>` reads the key and sets `--accent-h/s/l` on `<html>` before the first paint. It is injected by a small local Vite plugin (`transformIndexHtml`, in `vite.config.ts` or `scripts/`) that imports the finish table from `content/specs.ts` and writes it into the script, so the two cannot drift apart. `transformIndexHtml` runs in dev and in `vite build`, before `prerender.mjs`, which only replaces `<div id="root">` and leaves `<head>` untouched. No CSP is set today; if one is added later, the script needs a hash.
- Finishes reads the stored id through `useSyncExternalStore` with a server snapshot of the first finish, so hydration matches the prerendered HTML and the radio switches to the stored finish right after hydration. No tilt animation for this restore, only for changes the reader makes.
- Particles, living surfaces and Pip already read the accent custom properties, so they follow without extra work.
- Without storage (private mode, blocked site data) the page works as today: first finish on every load.

**Done when:** pick a finish, reload, the page shows that finish from the first paint (no flash in a throttled run) and its radio is checked; unit test for the read/write helpers including broken values; e2e covers the reload.

## 9. Exploded view: assembles into a believable phone

Today the scene (`ExplodedView` `.scene`) ends in a stack of flat, semi-transparent sheets. Why it does not read as a phone:

- **The last layer is a pale rectangle.** Front glass fills the whole body with `--part-glass` (light, 16 %) plus a 22 % white sheen, on top of six layers that are themselves partly transparent. Together they wash out to a near-white slab, and the display under it never shows.
- **No thickness.** Every layer is a flat SVG at its own `translateZ`, 0.2 rem apart. There is no band edge between them, so the assembled stack looks like paper, not an 8 mm metal and glass body.
- **No light, no ground.** All layers have the same flat colors from every angle and nothing casts a shadow, so the stack floats.
- **The ending has no payoff.** When the last layer lands nothing happens; the reader never sees "a phone".

Plan 1 §5 (layer order, small parts, labels, compact view) stays. On top of it:

**Front glass.**

- Glass is clear, not tinted white: fill at most 4 % opacity, a thin bright edge highlight (inner bevel stroke, 1 px, lighter at the top-left corner) and a narrow diagonal reflection band at about 10 %.
- No island on the glass layer: the cutout belongs to the display, the glass is one continuous sheet.
- While in flight the glass shows only its edge and reflection, so it reads as glass, not as a card.

**Display and the final beat.**

- The display panel is near-black (OLED off) while the phone assembles, with a faint pixel-grid texture so it reads as a panel.
- When the front glass lands (`--progress` past its window), the screen wakes: the own lock screen from `phone-lock-screen.tsx` fades in under the glass, then a single glint sweeps across the glass. Driven by `--p`, so scrolling back turns the screen off again.
- In the same last stretch the stack turns from the isometric angle (`rotateX(56deg) rotateZ(-34deg)`) toward a three-quarter front view (about `rotateX(24deg) rotateZ(-14deg)`), so the finished phone is shown from the side people know. Transform only, from the same progress value.

**Thickness and body.**

- The frame layer becomes a real band: the band outline is drawn as 4 slices in front of the frame (0.26 rem steps in Z, so the band spans the assembled thickness), darker toward the back, so the assembled stack has a visible metal edge with the side buttons on it.
- Rest offsets inside the stack are tuned so the total assembled thickness matches the real ratio (about 1 : 9 to the width). Inner layers end up hidden inside the band; from the three-quarter view you see glass, screen and frame edge only.
- Layers are fully opaque once landed (today they keep `0.55 + 0.45 * eased` until the end); transparency is used only while a layer is in flight.

**Materials and light.**

- One light direction (top left) for the whole scene. Each layer gets a top highlight edge and a darker lower edge from the same rule, as a small shared SVG helper, not per-layer magic numbers.
- Materials from tokens, with a short pass over each layer against real teardown photos: black adhesive and copper/gold flex cables, dark green-black board with matte gray shields, foil battery with a printed label block, frosted back glass tinted by the selected finish (follows §8), anodized frame matching the finish.
- No part is traced 1:1 from a photo; plan 1 §4 trademark rule still applies.

**Ground shadow.**

- A soft shadow on the floor plane under the stack: a pre-blurred radial-gradient element (no `filter`), which grows darker and tighter as layers land (`opacity` and `scale` from `--p`).

**Performance.**

- Still `transform` and `opacity` only, still driven by the one `--progress` value. Extra SVG for slices, highlights and the lock screen: at most +2 KB gz, counted in the §0 budget.
- Compact view (phones, 5 layers) gets the same glass, wake-up and shadow; band slices drop to 2.

**Done when:** at the end of the scroll the scene looks like a finished phone with a lit screen at 390, 768 and 1440 (before/after screenshots in the PR); scrolling back disassembles it and turns the screen off; no layer or part overlaps the labels; perf test green.

## 10. Reserve submit button behaves like the other primary buttons

The form's submit button (`Reserve.module.scss` `.submit`) only has the plain `button-primary` and `sheen-host` mixins: no magnetic pull, no liquid fill, no letter roll, no hover ring. Every other primary button (header, hero, sticky CTA) is a `PressableLink` and has all of them, so the most important button on the page is the dullest.

- Split `PressableLink` into a shared inner part and two thin wrappers in `components/Pressable/` (one `Pressable.module.scss`, block `pressable`): `PressableLink` (`<a>`, as today) and `PressableButton` (`<button>`, takes `type`, `isBusy`, `busyLabel`; disabled while busy). The ring, hover ring, surface, fill, sheen, visually hidden name and letter strip live in the shared part, so both look and move the same.
- The submit button gets the same hover as the header button: magnetic pull, liquid fill from the entry point, letters roll, extra ring. Keyboard focus gets the fill without the pull, touch gets the plain press, reduced motion gets a plain color change (plan 1 §6 rules, unchanged).
- Busy state (`Reserving…`): no pull, no ring, the letters swap to the busy label with one roll, `cursor: progress`. The button stays a real `type="submit"` and stays disabled while busy; the form keeps `aria-busy`.
- The submit button gets no §4 idle nudges (see §4: the email bugs already move next to it).
- While at it, every interactive element is checked for a hover and focus state that matches its role: hero secondary link, nav links, finish radios, motion toggle, footer links, Pip.

**Done when:** hovering the submit button looks and moves exactly like the header button; Enter in the field still submits; axe sees one accessible name; e2e submits the form with keyboard and pointer.

## 11. Readable class names: BEM instead of `_submit_1xym1_141`

CSS modules use Vite's default scoped names, so the DOM is full of names like `_submit_1xym1_141` and `_scene_1ex08_137`: they start with an underscore, carry a hash and a line number, and say nothing about where they come from. The page is a portfolio piece, people will open DevTools.

**Naming rule (BEM).**

- **Block** = the module file: `Reserve.module.scss` → `reserve`, `ExplodedView.module.scss` → `exploded-view`, `layers.module.scss` → `layers`. Kebab case, always starts with a letter.
- **Element** = a local class in that module: `.submit` in `Reserve.module.scss` → `reserve__submit`.
- **Block root:** the local class `.root` maps to the bare block name (`reserve`). Each module's outer class is renamed to `root` (`.section`, `.header`, `.pip`, …).
- **Modifier:** written in SCSS as a flat `.element--name` selector (nesting `&--name` would break the nesting-depth limit in several modules): `.root--compact` → `pressable--compact`, `.render--tilt-odd` → `finishes__render--tilt-odd`. Static variants (button `size`, `tiltOdd`/`tiltEven`, alternating sides) become modifiers.
- **State toggled by JS** stays in `data-*` and ARIA attributes, as today (`data-act`, `data-hiding`, `data-visible`, `aria-current`, `aria-invalid`). These are already readable and are the hooks the motion code uses; BEM modifiers are for variants chosen in markup.
- Local class names in SCSS are kebab case (`.layer-name`, `.field-row`) to match the output; components keep reading them in camel case through `localsConvention: 'camelCaseOnly'` (`styles.layerName`). Today `selector-class-pattern` enforces camelCase, so this renames the local classes in **every** `.module.scss` file, not only the outer ones.
- **Keyframes:** `generateScopedName` is also called for `@keyframes` names in modules (`reveal-rise` in `RevealTitle.module.scss` would become `reveal-title__reveal-rise`). That output is accepted and matches the pattern; the pattern check runs over class names and keyframe names alike. Keyframes shared between modules stay in global SCSS (`_mixins.scss`), unscoped, as today.

**Implementation.**

- `css.modules.generateScopedName` in `vite.config.ts` builds `block__element[--modifier]` from the file name and the local name, the same in dev, build, prerender and Vitest. No hash, no line number.
- Collisions: block names come from module file names, which are unique today. A small check (Vitest or a script in `npm run lint`) fails if two modules would produce the same block name, or if a generated name does not match `^[a-z][a-z0-9-]*(__[a-z0-9-]+)?(--[a-z0-9-]+)?$`.
- Stylelint gets `selector-class-pattern` for kebab case with optional `--modifier`, so new classes follow the rule.
- e2e selectors that match on class fragments (`[class*="strip"]` in `runtime.spec.ts`) switch to the full BEM name or to a role / `data-*` hook.
- One mechanical commit per area (layout, sections, mascot, svg layers), each with lint, unit and e2e green, so the rename stays reviewable.

**Done when:** no class in the rendered DOM (dev and prerendered build) starts with `_` or contains a hash; every class matches the pattern above; the visual result is unchanged (before/after screenshots identical at 390 and 1440); CSS size not larger than before.

## 12. Pause / play toggle with its own motion

Today `MotionToggle` swaps two static icons (two bars ↔ triangle) and changes the border color, with no transition. It is the one control that talks about motion, so it should show what it does.

- **Morph on change:** the two pause bars fold into the play triangle and back in about 220 ms. Today the icon is two `<rect>`s or one triangle `<path>`, swapped in JSX; both states become the same two `<path>` elements, always rendered, each a closed 4-point polygon (`M L L L Z`) in both states, so the command lists match and `d` can interpolate (the rounded bar corners go; at 16 px they are not visible). Each bar's `d` transitions to one half of the triangle (left half / right half), so the shapes meet in the middle. Where `d` cannot transition (WebKit), the two icons crossfade with a small rotate instead. One-shot on a 16 px icon, not a loop, so the plan 1 compositor rule for loops is not touched.
- **Feedback on change:** when motion is paused, a single ring expands from the button and fades (like a "freeze" wave); when it resumes, the ring runs inward. The border color change gets a transition.
- **Hover:** while motion runs, the bars bounce like a tiny equalizer (staggered `scaleY`, 2 bars, only while hovered); while paused, the triangle nudges forward 1.5 px. **Press:** short squash (`scale` 0.92).
- **This animation runs even while motion is paused:** it is the direct response to the reader's click, not ambient motion, and lasts under 400 ms. Implemented as CSS transitions on the button only. Pause gates motion through explicit `:root:not([data-motion-paused])` selectors (the `ambient` mixins in `_mixins.scss`, Backdrop), not through a global rule, so the toggle simply must not use those mixins or selectors.
- The accessible name stays the same ("Pause motion") with `aria-pressed` carrying the state, as today; the animation adds nothing for screen readers.
- Reduced motion: icons swap instantly, no ring, no bounce; only the color change.
- Header (compact) and footer toggles share the same component, so both get it.

**Done when:** clicking toggles with the morph and the ring in Chromium and Firefox and the crossfade in WebKit; the animation also plays when switching back from paused; nothing moves under reduced motion; `aria-pressed` still checked in e2e.

## 13. Work order

The BEM rename (§11) goes right after the Pip fix, so every later step is written with the new names instead of being renamed afterwards. The submit button (§10) comes before the idle nudges (§4), so the shared pressable part exists before the nudges are added to it.

| #   | Step                                                                     | Done when                                                                                                                                                   |
| --- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Pip avoidance fix (§1)                                                   | e2e at the page bottom: Pip covers no footer link, every link clickable, Pip pokeable; unit tests for the decisions                                         |
| Q2  | BEM class names via `generateScopedName`, renames, stylelint rule (§11)  | no `_hash` classes in DOM, pattern check green, screenshots unchanged                                                                                       |
| Q3  | Nav scrollspy and walking phone indicator (§7)                           | correct link active through the page, width matches text, `aria-current` set                                                                                |
| Q4  | Text on scroll (§3)                                                      | visible without JS, CLS unchanged                                                                                                                           |
| Q5  | Submit button as `PressableButton`, hover audit (§10)                    | submit hover matches the header button, keyboard submit and axe fine                                                                                        |
| Q6  | Button idle nudges and border beam (§4)                                  | caps respected, stops on hover, keyboard and touch unchanged                                                                                                |
| Q7  | Email field bugs (§5)                                                    | all four states right, axe clean                                                                                                                            |
| Q8  | Hero: screen boot, floating parts, cable, Pip entrance (§6)              | LCP and CLS no worse, everything ambient stops when paused                                                                                                  |
| Q9  | Pip: new acts, poses, lines, combos, hints (§2)                          | unit tests for combos and hints, e2e combo check                                                                                                            |
| Q10 | Remembered finish (§8)                                                   | reload keeps the finish from the first paint, unit and e2e tests green                                                                                      |
| Q11 | Exploded view realism: glass, screen wake, thickness, light, shadow (§9) | looks like a finished phone at 390 / 768 / 1440, reversible, perf green                                                                                     |
| Q12 | Pause / play toggle animation (§12)                                      | morph, ring and hover work in all three engines, plain swap under reduced motion                                                                            |
| Q13 | Lint, typecheck, unit tests, e2e, perf, bundle size                      | all green, main +6 KB gz and Pip chunk +4 KB gz at most                                                                                                     |
| Q14 | README "Known gaps" and "How the motion works" updated                   | describes combos, the nav indicator, the remembered finish, the new exploded view ending, the BEM naming rule, the toggle animation, the new budget numbers |
