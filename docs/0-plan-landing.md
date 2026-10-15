# Animated iPhone concept landing (portfolio)

Unofficial concept page for the latest iPhone. Not affiliated with Apple. Trademark-safe: the page says "concept, not affiliated" in the footer, uses an own stylised apple mark instead of the real logo, and invented but plausible specs.

> **Plan order.** Plans in `docs/` are numbered `N-plan-<name>.md`; this is plan 0. If a requirement in a plan with a higher number conflicts with a requirement in a plan with a lower number, the higher-numbered plan wins. Everything a later plan does not touch still applies as written here.

## 1. Stack

| Area          | Choice                                                                                        | Why                                                |
| ------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Build         | Vite 6 + React 19 + TypeScript (strict)                                                       | fast, small output                                 |
| Styles        | SCSS modules + global tokens (`@use`)                                                         | requested; tokens as custom props, no magic values |
| Animation     | Own hooks: IntersectionObserver + one rAF loop + CSS scroll-driven animations where supported | zero animation deps, shows depth, JS < 60 KB gz    |
| Smooth scroll | native only (no Lenis / Locomotive)                                                           | a11y, battery, iOS correctness                     |
| Fonts         | one variable font, self-hosted, `font-display: swap`, preloaded                               | avoids the Inter + violet "AI look"                |
| Lint          | ESLint (react-hooks, jsx-a11y), Stylelint (scss), Prettier                                    | consistent, human code                             |
| Tests         | Vitest + Testing Library for hooks; Playwright smoke on desktop + mobile viewport             | proves it works                                    |

Fallback if the exploded-view timeline gets painful: GSAP core + ScrollTrigger only (free since 2025), still under 30 KB gz.

## 2. Page structure (single page, English)

1. **Header** - mark, 4 anchor links, "Reserve" button. Sticky; backdrop blur on desktop only.
2. **Hero** - headline, subline, two CTAs, full-page gradient behind. Phone outline starts drawing on load (first 10 %), the rest is scroll-driven.
3. **Line draw (sticky, 250vh)** - phone front and side as SVG strokes. `stroke-dashoffset` bound to section progress. Camera module, buttons, Dynamic Island draw in staggered progress windows. At the end strokes fade and a flat glass render fades in.
4. **Exploded view (sticky, 350vh)** - "What it is made of". 7 SVG layers (front glass, display, battery, logic board, camera, frame, back glass) start spread along Y/Z and assemble into one phone as the user scrolls. Each layer owns a progress window; its label pops when it lands. Scrolling back disassembles.
5. **Numbers** - 5 stats (process nm, camera MP, battery hours, peak nits, weight g). Slot-reel digit roll on enter, once, 1.2 s ease-out. Static value present for screen readers.
6. **Feature grid** - camera, display, chip, titanium. Asymmetric layout, not a 3-equal-card row. Reveal on enter with per-card delay, translateY no more than 24 px.
7. **Finishes** - colour picker (real radiogroup). Changing colour retints the page gradient through `--accent-h` and recolours the SVG render.
8. **Apple-mark backdrop** - stylised apple silhouette from ~400 canvas points. Points drift with scroll by depth and settle into the silhouette while Finishes is in view. `aria-hidden`, no pointer events, off under reduced motion.
9. **CTA + footer** - reserve form (email, visible label, native validation), legal note, links.

## 3. Full-page gradient

- One `position: fixed; inset: 0; z-index: -1` layer: 3 radial gradients + 1 conic, colours from `--accent-h/s/l` tokens.
- Shifts with document scroll progress (hue +-18 deg, blob positions). One custom property written once per frame, not per element.
- SVG `feTurbulence` noise as data-URI at 4-6 % opacity to kill banding. No `filter: blur()` on mobile.
- Dark theme only. Body text contrast checked on every gradient stop (>= 4.5:1).

## 4. Animation engine (own, small)

> **Performance rules (plan 6).** Every later feature that moves follows the nine rules in `6-plan-animation-performance.md` §2, kept current in README "Animation performance rules". Where this section differs, plan 6 wins: scroll progress is a CSS scroll timeline rather than a `--p` write, the frame loop has a read and a write phase, loops are `transform` / `opacity` on HTML elements, and the runtime budgets are checked by `npm run test:perf`.

- `useScrollProgress(ref, { start, end })` returns 0..1 for a sticky section. One passive scroll listener + rAF, writes to a ref, re-renders nothing.
- `useInView(ref, { once, rootMargin })` wraps IntersectionObserver.
- `useCountUp(target, { duration, format })` rAF based; under reduced motion it jumps to the final value.
- `useReducedMotion()` media-query hook; also disables the particle backdrop.
- Progress goes into a CSS custom property `--p` on the section; children animate with `calc()` in SCSS. JS does math, CSS does paint.
- `@supports (animation-timeline: view())` uses native scroll-driven animations for simple reveals. JS only where CSS cannot: counters, staggered line draw, particles.
- Only `transform`, `opacity`, `stroke-dashoffset`, `clip-path` animate. `will-change` is set when a section nears the viewport and removed after.

## 5. Mobile and tablet

- `100svh` / `100dvh` for the hero, never `100vh`.
- Sticky sections shorten on mobile (250vh to 180vh); exploded view keeps 5 layers instead of 7.
- No hover-only states; colour picker targets >= 44x44 px.
- Particles 400 to 120 under 768 px, off under reduced motion or `saveData`.
- Real-device pass: iOS Safari (sticky + address bar resize), Android Chrome, iPad landscape.
- Breakpoints as an SCSS map, mobile first, `clamp()` type scale.

## 6. Accessibility checklist

- `<html lang="en">`, skip link, landmarks, `section aria-labelledby`, single `h1`, correct heading order.
- Decorative SVG: `aria-hidden="true" focusable="false"`. Meaningful SVG: `role="img"` + `<title>`.
- Counters: final value in DOM text from the start (visually hidden), animated digits `aria-hidden`, `aria-live="off"`.
- Colour picker: `fieldset/legend` + real radio inputs, visible `:focus-visible` ring, colour name as text.
- `prefers-reduced-motion: reduce`: everything static at end state, sticky sections become normal flow.
- Contrast >= 4.5:1 text, >= 3:1 UI. Keyboard-only run-through. axe + Lighthouse a11y 100.
- Form: labels, `autocomplete="email"`, error linked via `aria-describedby`.

## 7. Performance budget

| Metric           | Target          |
| ---------------- | --------------- |
| JS (gz)          | < 60 KB         |
| CSS (gz)         | < 15 KB         |
| LCP (mobile, 4G) | < 1.5 s         |
| CLS              | 0               |
| INP              | < 100 ms        |
| Lighthouse       | 95+ in all four |

Inline critical SVG, `content-visibility: auto` on below-fold sections, `loading="lazy"` + explicit sizes on raster (AVIF/WebP), code-split particle backdrop, preload font, no third-party scripts.

## 8. "Made by a human" checklist (AI tells to avoid)

Code

- No comments (requirement); naming carries the meaning.
- No `any`, no `key={index}`, no `onClick` on `div`, no `!important`, no `z-index: 9999`, no `transition: all`.
- Every listener, observer and rAF has cleanup. No `useEffect` that mirrors props into state.
- No inline styles except the single `--p` write.
- No `console.log`, unused imports, dead CSS, `TODO`.
- Tokens for colour, spacing, radius, easing; no hard-coded hex inside components.
- Components under 150 lines, hooks in `hooks/`, SVG as components in `assets/`.
- Semantic HTML before ARIA.

Design

- No "icon + title + text" 3-card grid, no uniform 8 px radius, no Inter + violet gradient, no emoji in UI, no "Welcome to my website".
- Real copy, no lorem ipsum; concrete numbers with units.
- Custom easing (`cubic-bezier(.2,.7,.2,1)`), per-element durations, staggers that are not all 100 ms.
- One accent, one font pairing, strict type scale.

Behaviour

- Explicitly tested: `100vh` bug, scroll jank from layout props, missing reduced-motion, missing focus styles, font/image layout shift, hover-only on touch.

## 9. Borrowed from iGaming landings (used with taste)

iGaming pages are tuned for attention and conversion. Worth taking:

- **Slot-reel number roll** for the Numbers section: digits spin like reels and lock in from left to right, instead of a plain count-up. Mask-based, pure transform.
- **Light sweep / sheen** across the titanium render and the primary CTA, triggered once on enter. A single gradient pseudo-element on `transform`, 900 ms.
- **Sticky bottom CTA bar on mobile** that appears after the hero leaves the viewport and hides while a sticky animation section is pinned. Keeps "Reserve" one tap away.
- **Reveal as reward**: the glass render appears through an expanding `clip-path` as the line draw completes, the same beat a "win" reveal uses.
- **Pressable buttons**: 2 px press depth, 120 ms, scale 0.98, with `:active` and keyboard parity.
- **Launch countdown** in the CTA section (days / hours / minutes), honest and static-labelled, no fake scarcity.
- **Confetti-free success state**: after the form submits, the phone render does one short glow pulse instead of particles.
- **Above-the-fold clarity**: value proposition and primary CTA readable in under 3 seconds, CTA repeated after Numbers and in the footer.

Not taken: fake live counters ("1 203 people reserved"), exit-intent popups, autoplay sound, blinking neon, wheel-of-fortune widgets, dark-pattern urgency.

## 10. Folder structure

```
src/
  app/            App.tsx, providers
  components/     Header, Hero, LineDraw, ExplodedView, Numbers, Features, Finishes, Backdrop, StickyCta, Footer
  hooks/          useScrollProgress, useInView, useCountUp, useReducedMotion
  assets/svg/     phone-outline.tsx, layers/*.tsx, apple-mark-points.ts
  styles/         _tokens.scss, _mixins.scss, _breakpoints.scss, global.scss
  content/        copy.ts, specs.ts
```

## 11. Work order, small steps

Each step is one commit-sized change with a visible result. "Done when" is the check before moving on.

### Phase A. Foundation (nothing moves yet)

| #   | Step                                                                                                                                                                                                       | Why first                                              | Done when                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------- |
| A1  | `npm create vite` (react-ts), remove boilerplate, set `strict`, path alias `@/`                                                                                                                            | clean base, no template leftovers                      | `npm run dev` shows an empty page, no template CSS |
| A2  | Add `sass`, create `styles/_tokens.scss` (colour as h/s/l parts, spacing scale, radii, easing, z-index map), `_breakpoints.scss`, `_mixins.scss`, `global.scss` (reset, `html lang`, focus-visible, `svh`) | every later style reads tokens, never literals         | one token change retints the page                  |
| A3  | ESLint (react-hooks, jsx-a11y), Stylelint, Prettier, `npm run lint`                                                                                                                                        | catches `any`, missing deps, a11y misses on every step | lint passes on empty project                       |
| A4  | Self-host one variable font, `preload`, `font-display: swap`, size-adjust fallback                                                                                                                         | avoids CLS and the default-font look                   | no layout shift when the font loads                |
| A5  | `index.html` meta: title, description, theme-color, OG, favicon set                                                                                                                                        | first-impression details done early, not forgotten     | Lighthouse SEO 100                                 |
| A6  | `content/copy.ts` and `content/specs.ts` with all final English copy and numbers                                                                                                                           | real copy drives layout; no lorem ipsum ever           | every string in UI comes from `content/`           |

### Phase B. Static page (semantic, no animation)

| #   | Step                                                                                                    | Why                                                          | Done when                                               |
| --- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------- |
| B1  | `App` skeleton: skip link, `header`, `main`, `footer`, 7 `section`s with `aria-labelledby`, one `h1`    | structure and a11y before visuals                            | axe clean, heading order correct                        |
| B2  | `Header`: mark, nav, Reserve button, sticky                                                             | first interactive element, keyboard checked                  | Tab order correct, focus ring visible                   |
| B3  | `Hero`: headline, subline, two CTAs, `100svh`                                                           | sets type scale and rhythm                                   | fits phone viewport without jump when address bar hides |
| B4  | `Features` asymmetric grid, `Numbers` static values, `Finishes` radiogroup (real inputs), `Footer` form | all content visible and accessible in its final static state | keyboard-only run through whole page works              |
| B5  | Mobile-first responsive pass with the breakpoint map                                                    | static layout correct before motion is added                 | no horizontal scroll at 320, 768, 1024, 1440            |
| B6  | Lighthouse + axe baseline, record numbers                                                               | later steps must not regress these                           | 4x 95+, a11y 100                                        |

### Phase C. Animation core (reusable, tested)

| #   | Step                                                                                                  | Why                                        | Done when                                                          |
| --- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------ |
| C1  | `useReducedMotion`                                                                                    | every other hook branches on it            | returns true when the OS setting is on                             |
| C2  | `useInView` on IntersectionObserver, `once` option, cleanup                                           | reveals and counters need it               | unit test: fires once, disconnects on unmount                      |
| C3  | `useScrollProgress` for sticky sections: one passive scroll listener, one rAF, writes 0..1 into `--p` | the engine for line draw and exploded view | DevTools shows zero React re-renders during scroll                 |
| C4  | `useCountUp` with slot-reel digit formatter                                                           | Numbers section                            | test: ends exactly at target, jumps instantly under reduced motion |
| C5  | `@supports (animation-timeline)` reveal mixin in SCSS + JS fallback class                             | progressive enhancement for simple reveals | Chrome uses CSS path, Firefox uses JS path, both look the same     |

### Phase D. Gradient and backdrop

| #   | Step                                                                                        | Why                                      | Done when                                                   |
| --- | ------------------------------------------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------- |
| D1  | `Backdrop` fixed layer with 3 radial + 1 conic gradients from tokens                        | the page tone                            | looks right on hero without motion                          |
| D2  | Noise overlay (feTurbulence data-URI), tuned 4-6 %                                          | removes banding on OLED and cheap panels | no visible bands on a dark monitor                          |
| D3  | Hook document scroll progress to `--accent-h` shift and blob positions, one write per frame | gradient "travels" with the page         | Performance panel: no layout, paint only on the fixed layer |
| D4  | Mobile branch: no blur, fewer stops, static under reduced motion                            | battery and jank                         | 60 fps scroll on a mid-range Android                        |

### Phase E. Line draw section

| #   | Step                                                                                                                                  | Why                                                 | Done when                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------- |
| E1  | Hand-tune `PhoneOutline` SVG: body, screen, island, camera module, buttons, side view, ~12 paths, `vector-effect: non-scaling-stroke` | source asset quality decides the whole effect       | strokes look crisp at 320 and 1440                    |
| E2  | Measure path lengths once (`getTotalLength`) into dasharray/dashoffset                                                                | needed for draw effect                              | all paths hidden at `--p: 0`, fully drawn at `--p: 1` |
| E3  | Sticky wrapper 250vh, bind `--p` via `useScrollProgress`                                                                              | scroll drives the draw                              | scrubbing scroll draws and undraws                    |
| E4  | Stagger windows per group (body 0-.4, screen .3-.6, island .5-.7, camera .6-.85, buttons .8-1) in SCSS `calc()`                       | tells a story instead of drawing everything at once | each group starts and ends where intended             |
| E5  | Clip-path "reward" reveal of the flat glass render at `--p` .9-1 while strokes fade                                                   | payoff moment                                       | smooth, no flash of unstyled render                   |
| E6  | Reduced-motion and mobile branches (180vh, no sticky if reduce)                                                                       | a11y and small screens                              | static final frame shown under reduce                 |

### Phase F. Exploded view

| #   | Step                                                                               | Why                               | Done when                                           |
| --- | ---------------------------------------------------------------------------------- | --------------------------------- | --------------------------------------------------- |
| F1  | Draw 7 layer SVGs on one shared viewBox so they align when stacked                 | alignment is everything here      | stacked at offset 0 they form one phone             |
| F2  | Layout: sticky 350vh, layers absolutely positioned, labels beside                  | scene before motion               | all layers visible, spread by a static debug offset |
| F3  | Per-layer progress windows and Y/Z/scale/opacity formulas in SCSS from `--p`       | assembly choreography             | scroll forward assembles, back disassembles         |
| F4  | Labels pop at each layer's landing window                                          | explains "what it is made of"     | labels readable, never overlap the phone            |
| F5  | Mobile: 5 layers, smaller spread; reduced motion: assembled static with label list | keeps it legible on small screens | iPad portrait and phone check                       |

### Phase G. Numbers, features, finishes

| #   | Step                                                                                              | Why                                        | Done when                                  |
| --- | ------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------ |
| G1  | Slot-reel digit component (mask + translateY column), `aria-hidden`, static value visually hidden | gambling-style roll, still accessible      | screen reader reads the final value only   |
| G2  | Wire `useInView` + `useCountUp`, once per stat, staggered 80/140/220 ms                           | feels alive, not uniform                   | reels lock left to right                   |
| G3  | Feature cards reveal via C5 mixin, translateY 16-24 px, varied delays                             | subtle, not bouncy                         | no jank, no overshoot                      |
| G4  | Finishes picker writes `--accent-h/s/l` on `html`, SVG render recolours via CSS                   | one source of truth retints the whole page | gradient and phone change together, 200 ms |

### Phase H. iGaming-inspired polish

| #   | Step                                                                  | Why                                      | Done when                                   |
| --- | --------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------- |
| H1  | Sheen sweep on CTA and titanium render, once on enter                 | premium feel                             | runs once, never loops                      |
| H2  | Pressable buttons: `:active` depth 2 px, 120 ms, keyboard parity      | tactile                                  | works with Space/Enter                      |
| H3  | `StickyCta` on mobile: shows after hero, hides during pinned sections | conversion pattern without dark patterns | never covers a sticky animation             |
| H4  | Launch countdown in CTA block, static labels, no fake scarcity        | urgency, honestly                        | ticks once per minute, `aria-live="off"`    |
| H5  | Form success: one glow pulse on the render                            | reward beat                              | works with reduced motion as a static state |

### Phase I. Apple-mark particles

| #   | Step                                                                                        | Why                      | Done when                               |
| --- | ------------------------------------------------------------------------------------------- | ------------------------ | --------------------------------------- |
| I1  | Generate ~400 points from an own apple silhouette path (offline script, stored as array)    | no runtime path sampling | points file under 6 KB                  |
| I2  | Canvas component, DPR capped at 2, code-split with `React.lazy`                             | keeps main bundle small  | main bundle unchanged                   |
| I3  | Scatter by depth, settle into silhouette while Finishes is in view, tied to scroll progress | the background story     | 60 fps on desktop, 120 points on mobile |
| I4  | Off under reduced motion and `saveData`; `aria-hidden`, pointer-events none                 | a11y and battery         | never intercepts clicks                 |

### Phase J. Verification

| #   | Step                                                                               | Done when                                    |
| --- | ---------------------------------------------------------------------------------- | -------------------------------------------- |
| J1  | Real devices: iOS Safari, Android Chrome, iPad landscape                           | sticky, `dvh`, touch targets all correct     |
| J2  | A11y: axe, keyboard, NVDA, VoiceOver, reduced motion                               | 0 violations, every section usable           |
| J3  | Performance: bundle analysis vs budget, Lighthouse CI, Performance panel on scroll | budget met, no long tasks over 50 ms         |
| J4  | Playwright smoke: desktop + mobile, scroll to each section, form submit            | green                                        |
| J5  | Run Phase K (code audit) in full                                                   | every K-step ticked, each fix its own commit |
| J6  | README (short), deploy, OG image                                                   | live URL                                     |

### Phase K. Code audit: "made by a human" and typical AI bugs

Runs after J4, before deploy. Done with fresh eyes, file by file, in a separate branch. Every fix is its own small commit ("fix: double counter roll under StrictMode"), never one "cleanup" commit.

#### K1. Automated sweep

| Tool                                                                                     | Catches                                               | Done when                              |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------- |
| `eslint --max-warnings 0`                                                                | unused vars/imports, hook deps, a11y                  | 0 warnings, 0 `eslint-disable` in repo |
| `tsc --noEmit` with `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes` | dead code, loose types                                | clean                                  |
| `knip`                                                                                   | unused files, exports, dependencies                   | 0 unused                               |
| `stylelint` with `no-descending-specificity`, `declaration-no-important`                 | CSS smells                                            | clean                                  |
| `madge --circular src`                                                                   | circular imports                                      | none                                   |
| `npm ls --depth=0` vs actual imports                                                     | packages installed but unused, or used but not listed | match                                  |
| Bundle visualizer                                                                        | duplicate modules, accidental full-library imports    | one copy of everything                 |

#### K2. Grep patterns (must return nothing)

```
TODO|FIXME|XXX|HACK
console\.
lorem|ipsum|placeholder|example\.com|your-|YOUR_
: any|as any|as unknown as|@ts-ignore|@ts-expect-error
eslint-disable
key=\{(index|i|idx)\}
!important|z-index: *9{3,}|transition: *all
href="#"|onClick=\{\(\) *=> *\{\}\}
style=\{\{                                  (only the single --p write is allowed)
// =+|/\* *=+                               (section-divider comments)
// (Import|Define|Create|Handle|Render|Return)   (narrating comments)
Math\.random\(\)|Date\.now\(\)              (inside render / JSX)
setTimeout\(.*, *(0|100|500|1000)\)         (magic sequencing delays)
React\.FC|IProps                            (boilerplate typing)
vite\.svg|Vite \+ React|count is            (template leftovers)
```

#### K3. React and TypeScript tells

| #     | Check                                                                                                                                                                                          | Why it is a tell or a bug                        |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| K3.1  | No component defined inside another component                                                                                                                                                  | remounts every render, loses state and animation |
| K3.2  | No object/array/function literal in a dependency array or passed as prop to a memoised child                                                                                                   | effect loops, re-renders                         |
| K3.3  | No `useState` + `useEffect` that derives a value from props or another state                                                                                                                   | derived-state bug; compute inline                |
| K3.4  | No `useCallback` / `useMemo` without a measured reason                                                                                                                                         | cargo-cult memoisation                           |
| K3.5  | StrictMode on in dev, effects run twice: counters, observers, rAF loops, countdowns survive double mount                                                                                       | double roll, double listener, duplicate observer |
| K3.6  | Every `addEventListener`, `observe`, `requestAnimationFrame`, `setInterval` has a cleanup returned from the same effect                                                                        | leaks, callbacks on unmounted nodes              |
| K3.7  | Scroll and resize listeners are `{ passive: true }` and never read layout (`getBoundingClientRect`, `offsetTop`) per frame; measurements cached, refreshed on resize                           | jank, forced reflow                              |
| K3.8  | One rAF loop in the app, not one per component                                                                                                                                                 | duplicated work, out-of-sync frames              |
| K3.9  | No `catch (e) {}` and no catch that only logs                                                                                                                                                  | swallowed errors                                 |
| K3.10 | Non-null `!` only where the line above makes it obvious (ref after mount)                                                                                                                      | hidden null crashes                              |
| K3.11 | Types derived from data (`typeof specs`, `keyof typeof copy`, `as const`), not duplicated by hand                                                                                              | drift between data and types                     |
| K3.12 | Consistent export style: named exports for components, default only for `React.lazy` targets                                                                                                   | mixed styles are a generated-code tell           |
| K3.13 | No barrel `index.ts` re-exporting everything                                                                                                                                                   | tree-shaking, circular imports                   |
| K3.14 | No DOM `id` duplicated when a component renders twice; ids from `useId`                                                                                                                        | broken `aria-labelledby`, broken labels          |
| K3.15 | Every `aria-labelledby` / `aria-describedby` points to an existing id; no `role="button"` on `<button>`, no `aria-label` repeating visible text, no `tabIndex={0}` on non-interactive elements | ARIA sprinkled for show                          |
| K3.16 | Form: `preventDefault`, disabled + busy state while submitting, double submit blocked, error state rendered, success state reachable by keyboard                                               | happy-path-only forms                            |
| K3.17 | No `href="#"`, no empty handlers, no buttons that do nothing                                                                                                                                   | mock UI                                          |
| K3.18 | Long text, zero values, missing image, slow network: each component checked with an awkward input                                                                                              | no edge cases considered                         |
| K3.19 | Naming: no `data`, `item`, `info`, `handleClick`, `utils.ts`, `helpers.ts`, `Component2`; a name says what the thing is in this product                                                        | generic names                                    |
| K3.20 | File sizes and shapes vary. If every component is the same 40-line template, restructure where the content wants it                                                                            | uniformity is a generation tell                  |

#### K4. SCSS tells

| #     | Check                                                                                                                                                                         |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| K4.1  | No `* { margin: 0; padding: 0 }` reset; an own short reset instead                                                                                                            |
| K4.2  | No hard-coded hex, px spacing or breakpoints outside `_tokens.scss` / `_breakpoints.scss`                                                                                     |
| K4.3  | No unused selectors (compare against rendered DOM with the Coverage tab)                                                                                                      |
| K4.4  | No duplicated declaration blocks across modules that should be a mixin                                                                                                        |
| K4.5  | No manual vendor prefixes (autoprefixer does it), no `-webkit-` leftovers                                                                                                     |
| K4.6  | One unit system: `rem` for type and spacing, `px` only for borders and shadows                                                                                                |
| K4.7  | Nesting depth under 3; no `&-child` chains that only exist to look structured                                                                                                 |
| K4.8  | Focus styles exist for every interactive element and are never `outline: none` without a replacement                                                                          |
| K4.9  | Animated properties only `transform`, `opacity`, `clip-path`, `stroke-dashoffset`; search for `top`, `left`, `width`, `height`, `margin` inside `@keyframes` and `transition` |
| K4.10 | No `will-change` left permanently on elements                                                                                                                                 |

#### K5. Animation runtime glitches (manual QA, DevTools open)

| #     | Scenario                                                                           | Expected                                                                                                  |
| ----- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| K5.1  | Reload while scrolled to the middle of a pinned section (browser restores scroll)  | progress initialised on mount, no jump, no first-frame flash                                              |
| K5.2  | Open `#section` hash directly                                                      | pinned section lands at the correct progress, header offset correct                                       |
| K5.3  | Resize and rotate mid-scroll (DevTools device toggle, real iPad)                   | cached measurements refresh, no stuck sticky, no overflow                                                 |
| K5.4  | iOS Safari address bar collapse during hero and during a pinned section            | no layout jump, `svh/dvh` behave                                                                          |
| K5.5  | First paint before JS runs (CPU 6x, Slow 3G)                                       | content visible, not hidden at `opacity: 0` waiting for JS; reveal classes applied only after mount       |
| K5.6  | Fonts load late (block them in DevTools)                                           | no reflow that breaks measured path lengths or sticky heights                                             |
| K5.7  | Scroll fast with the wheel, then trackpad momentum, then by dragging the scrollbar | no skipped frames leaving a stage half-applied, no out-of-order stagger                                   |
| K5.8  | Scroll back up through every section                                               | every scroll-driven effect reverses cleanly; once-effects (counters, sheen) do not replay                 |
| K5.9  | Toggle `prefers-reduced-motion` while the page is open                             | hooks react live, no half-animated frozen state                                                           |
| K5.10 | Leave the tab for 5 minutes, return                                                | countdown correct (timestamp based, not interval counted), gradient loop continuous, no rAF backlog burst |
| K5.11 | Hover the CTA 10 times quickly                                                     | sheen does not stack or restart mid-run                                                                   |
| K5.12 | Change colour in Finishes 10 times quickly                                         | one transition, no flicker, no stale render                                                               |
| K5.13 | Keyboard only, Tab from hero to footer                                             | focus never trapped inside a 350vh section, focused element scrolled into view                            |
| K5.14 | Firefox and Safari                                                                 | `animation-timeline` fallback identical to Chrome; `backdrop-filter`, `clip-path`, `svh` all behave       |
| K5.15 | Performance panel on a full scroll                                                 | no long task over 50 ms, no layout thrash, paint only on the fixed backdrop and animated nodes            |
| K5.16 | Countdown target stored as UTC, timezone explicit in copy                          | no off-by-hours for visitors in other zones                                                               |

#### K6. Content and copy tells

| #    | Check                                                                                                              |
| ---- | ------------------------------------------------------------------------------------------------------------------ |
| K6.1 | No "Seamless", "Elevate", "Unleash", "Experience the future", "Welcome to", "Powered by", "Next-level", "Redefine" |
| K6.2 | No headline built as a triad ("Faster. Lighter. Smarter.") unless it is a deliberate brand device used once        |
| K6.3 | Sentences vary in length; not every feature card has exactly one headline plus two lines                           |
| K6.4 | Numbers have units and footnotes; no round "100%" claims                                                           |
| K6.5 | Spelling consistent (US English throughout)                                                                        |
| K6.6 | Legal texts are real, not "Legal text goes here"                                                                   |
| K6.7 | Alt texts describe the image, never "image" or "phone render"                                                      |
| K6.8 | OG title and description written for the share card, not copied from H1 and meta                                   |

#### K7. Repository tells

| #     | Check                                                                                                                                                                 |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| K7.1  | Git history: many small commits over days, with real `fix:` and `revert` commits; no single "Initial commit" with the whole project, no 40 commits sharing one minute |
| K7.2  | Commit messages describe intent ("limit particle DPR to 2 for iPad"), not "update files"                                                                              |
| K7.3  | README: short, no emoji headers, no "Features" list with sparkles, no claims about things that do not exist; a screenshot, the live URL, how to run, what was hard    |
| K7.4  | `package.json`: real name, no empty description, no unused scripts, versions locked by the lockfile                                                                   |
| K7.5  | No `.env.example` with fake keys when nothing reads env                                                                                                               |
| K7.6  | `index.html`: no Vite template leftovers (favicon `vite.svg`, title "Vite + React")                                                                                   |
| K7.7  | `.gitignore` covers `dist`, `node_modules`, `.DS_Store`, editor folders; no committed build output                                                                    |
| K7.8  | Folder structure matches project size: no `services/`, `store/`, `types/` folders with one file each                                                                  |
| K7.9  | Tests test behaviour, not implementation: no snapshot-only tests, no `expect(true).toBe(true)`, no tests of a mock                                                    |
| K7.10 | Final read of the whole diff as if reviewing a stranger's PR; anything that needs a comment to be understood gets renamed instead                                     |
