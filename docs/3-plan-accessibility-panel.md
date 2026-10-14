# Plan 3: accessibility panel

Builds on `0-plan-landing.md`, `1-plan-motion-and-detail.md` and `2-plan-play-and-polish.md`. Where this plan conflicts with an earlier one, this plan wins (plan-order note in plan 0). Everything not mentioned here keeps the earlier rules: no animation library, one rAF loop (`frameLoop.ts`), only `transform` and `opacity` in loops, visible without JS, all copy lives in `content/`, components stay under 150 lines, BEM class names (plan 2 §11).

Goal: one panel where the reader can turn off every animation (scroll-driven ones included), switch to a low-vision mode or a light theme, make text larger and adjust a few more reading settings. The panel is tucked away at the side of the screen, only its handle stays visible, and it slides out on hover or focus.

## 0. Overrides of plans 0 to 2

| Earlier rule                                                                       | Plan 3 change                                                                                                                                       | Why                                                                     |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Plan 0: reduced motion comes only from `prefers-reduced-motion`                    | Reduced motion = system setting **or** the panel's "Motion: off" (§2). One source of truth in CSS (mixins) and JS (`useReducedMotion`)              | readers can't always change OS settings (shared or work computers)      |
| Plan 1 §1: "Pause motion" is its own setting under `concept-18-motion-paused`      | Pause becomes the middle level of one motion setting: `full` / `calm` / `off`. Header and footer toggles stay and switch `full` ↔ `calm` (§2)       | two separate stores for one question confuse people and code            |
| Plan 1: smooth scroll for nav anchors, off only under system reduced motion        | Also off with "Motion: off"                                                                                                                         | smooth scroll is motion                                                 |
| Plan 0: dark color tokens only                                                     | A second token set for high contrast (§3); also used automatically under `prefers-contrast: more`; `forced-colors: active` gets its own small rules | low vision                                                              |
| Plan 0: the page is dark only (`color-scheme: dark`)                               | A light theme in the panel (§5a): `data-theme="light"`, its own token set, also with high contrast                                                  | readers with glare, bright rooms or a preference for dark text on light |
| Plan 0: layout breakpoints are viewport media queries                              | Layout breakpoints follow the text size: at 200 % text on a 1280 px screen the page uses its 640 px layout (§4)                                     | larger text in a desktop grid overflows and clips                       |
| Plan 1 / plan 2: pinned scroll sections (line draw, exploded view) always pin      | They do not pin at text scale 150 % and above, or with "Motion: off"; they show their final state in normal flow                                    | pinned stages are one viewport tall; large text does not fit            |
| Plan 2 §8: inline `<head>` script applies the stored finish before the first paint | The same script applies all stored panel settings (§6)                                                                                              | no flash of small text, animations or low contrast on reload            |
| Plan 1: z-index map                                                                | New layer `a11y-panel: 45` between `sticky-cta` (40) and `skip-link` (50)                                                                           | panel must cover the sticky CTA and Pip, but the skip link stays on top |
| Plan 2 budget                                                                      | Plan 3 may add at most **+4 KB gz** to the main bundle; the panel body is code-split and loaded on first hover, focus or tap of the handle (§1)     | the panel is used by few readers on most visits                         |

## 1. The panel

**Placement.** Left edge of the viewport, vertically centered, `position: fixed`. Left, because Pip walks along the bottom, the sticky CTA sits at the bottom right and the header at the top. Collapsed, the panel is entirely off screen and `visibility: hidden` (no edge or scrollbar peeks out); only the **handle** stays visible: a tab 2.75 × 2.75 rem (tap target, plan 0) with an accessibility icon (own drawing, a person in a circle, `aria-hidden`).

**Markup.**

- The handle is a real `<button aria-expanded aria-controls="a11y-panel">` with the visible-on-hover label and accessible name "Accessibility settings".
- The panel is a `<section id="a11y-panel" aria-labelledby>` with a heading, not a modal dialog: the page stays usable while it is open.
- DOM position: right after the skip link, so it is the second Tab stop on the page. The skip link still jumps to `#main`, past it.
- Without JS the handle is not rendered (settings need JS); the prerendered HTML has no empty button. The panel mounts after hydration through the same `useSyncExternalStore` "is mounted" pattern as `MascotSlot`, so there is no hydration mismatch.

**Open and close.**

| Trigger                               | Result                                                                                                                                                                                              |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pointer enters the handle             | Panel slides out (**preview**). Controls are usable with the pointer.                                                                                                                               |
| Pointer leaves the panel              | Closes after a 400 ms grace period, so moving diagonally from handle to a control does not close it (WCAG 1.4.13: hoverable)                                                                        |
| Keyboard focus lands on the handle    | Panel slides out (preview) and shows the hint "Enter to change settings". The controls stay `inert`, so Tab goes on to the page and the reader does not have to walk through 10 controls every time |
| Enter / Space / click / tap on handle | Panel **pins** open, `aria-expanded="true"`, controls lose `inert`, focus moves to the first control                                                                                                |
| Escape                                | Closes a preview or a pinned panel from anywhere on the page, without moving pointer or focus first (WCAG 1.4.13: dismissible). If focus was inside the panel, it goes back to the handle           |
| Click outside, or handle again        | Closes a pinned panel                                                                                                                                                                               |
| Focus leaves a pinned panel           | Stays open (the reader may be checking the result on the page); closes on Escape or outside click                                                                                                   |

- Touch has no hover: the first tap pins it open.
- Slide is `transform: translateX` over 240 ms; under reduced motion (§2) it appears instantly.
- Width `min(22rem, 100vw - 2rem)`, max height `100dvh - header height - 2rem`, scrolls inside, so it works at 200 % text and in landscape phones.
- The panel uses the page tokens, so it follows its own settings (larger text, high contrast) at once and the reader sees the result while choosing.
- Pip's avoidance (plan 2 §1) treats the panel and the handle as an avoid zone.

**Contents, top to bottom.** Each group is a `<fieldset>` with a `<legend>`; choices are native radios or checkboxes styled as segmented controls and switches.

1. Motion: Full / Calm / Off (§2)
2. Text size: A− and A+ buttons around an `<output>` with the current value, moving through the six steps of §4. No extra slider: it would be a second control for the same value and another Tab stop. A− is `disabled` at 100 %, A+ at 200 %
3. Theme: Dark / Light (§5a)
4. Contrast: Standard / High (§3)
5. Reading: wider spacing, readable font, underline links (§5)
6. Pip: show / hide (§5)
7. "Reset all" button, and a line "Your system asks for reduced motion" / "…for more contrast" when a system preference is active.

Every change is announced through a polite live region inside the panel ("Text size 150 %", "Motion off"). The page has no shared one: the only polite region today is Pip's announcer, which is gone when Pip is hidden or motion is off. The panel's region is rendered empty at mount, so the first message is read.

## 2. Motion: full / calm / off

One setting with three levels, stored in `localStorage` under `concept-18-a11y` (§6), mirrored to `<html data-motion="full|calm|off">`.

| Level  | What it means                                                                                                                                                                             |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full` | everything as plans 0–2 describe                                                                                                                                                          |
| `calm` | today's "Pause motion": everything ambient stops (pulses, nudges, living surfaces, particles wobble, floating parts, Pip). Scroll-driven effects and hover responses keep working         |
| `off`  | exactly what `prefers-reduced-motion: reduce` gives: no ambient motion, **no scroll-driven motion**, no hover motion, no smooth scroll, no Pip, no transitions longer than a color change |

`off` covers the scroll effects explicitly:

- View-timeline reveals (titles, ledes, chip rows, plan 2 §3): final state, no animation. The `@supports (animation-timeline: view())` blocks sit inside `motion-safe`, so they simply do not apply.
- `useScrollProgress` sections (line draw, exploded view, Numbers word scrub): `--p` is set to `1` once, as for system reduced motion today; the sections do not pin (§0).
- Nav indicator (plan 2 §7): the reduced-motion underline that jumps without transition.
- Particles canvas: draws one static frame of the nearest shape, no per-scroll updates; hero parallax off.
- Count-up numbers show the final value; decode and word-scrub effects render no overlay.
- Finish change: page retints instantly, no tilt.
- `scrollIntoView`, skip link and nav anchors use `behavior: 'instant'`.

**One switch for CSS.** Today `motion-safe`, `motion-reduce`, `when-awake` and the two mixins with their own media query (`reveal`, `living-surface`) in `_mixins.scss` read only the media query. They change to:

```scss
$motion-on: ':where(:root:not([data-motion="off"]))';
$motion-off: ':where(:root[data-motion="off"])';

@mixin motion-safe {
  @media (prefers-reduced-motion: no-preference) {
    @if & {
      #{$motion-on} & {
        @content;
      }
    } @else {
      #{$motion-on} {
        @content;
      }
    }
  }
}

@mixin motion-reduce {
  @media (prefers-reduced-motion: reduce) {
    @content;
  }

  @if & {
    #{$motion-off} & {
      @content;
    }
  } @else {
    #{$motion-off} {
      @content;
    }
  }
}
```

- `@if &` is needed: five modules (`HeroExtras`, `MotionToggle`, `SectionNav`, `Pressable`, …) call the mixins at the top level, where `&` does not exist and `:root … &` would not compile. At the top level the content's own selectors become descendants of `:root`.
- `:where()` keeps the specificity of every rule as it is today; a bare `:root:not(…)` prefix would add (0,2,0) and could make a motion rule beat a later override.
- `when-awake` and the `data-awake` rules read `:where(:root[data-motion='full'], :root:not([data-motion]))` instead of `:root:not([data-motion-paused])`. The second half keeps today's behavior before the head script ran and in tests that do not set the attribute.
- Mixin calls on the root element itself (`html { scroll-behavior }` and the `:root` accent transition in `global.scss`) cannot use `:root … &`; they get `root-motion-safe` / `root-motion-reduce` variants that write the attribute on `&` itself (`&:not([data-motion='off'])`, `&[data-motion='off']`).
- **Migration of direct uses.** Six modules use `prefers-reduced-motion` directly (`Backdrop`, `Finishes`, `LivingSurface`, `MotionToggle`, `Pressable`, `RevealTitle`, often combined with `hover: hover`), and `data-motion-paused` is read by `Backdrop`, `SectionNav`, `EmailBugs` and `ShapeParticles.tsx` (its `MutationObserver` `attributeFilter`). All of them move to the mixins / the `data-motion` attribute in R2; a `hover-motion` mixin covers the `(hover: hover) and (prefers-reduced-motion: no-preference)` pairs.
- Stylelint: `media-feature-name-disallowed-list: ['prefers-reduced-motion']` everywhere except `_mixins.scss`, and a disallowed-selector rule for `data-motion-paused`, so nothing bypasses the switch later.
- A global safety net under reduced motion (system **or** `off`, written through `motion-reduce`, so both give exactly the same result): `*, *::before, *::after { animation-duration: 0s !important; animation-iteration-count: 1 !important; transition-duration: 0s !important; scroll-behavior: auto !important; }`, except color/opacity transitions on the panel and toggles (≤ 200 ms). It catches anything a component forgot; it is the fallback, not the mechanism.

**One switch for JS.** `useReducedMotion()` returns `true` when the media query matches **or** the level is `off`. `useMotionPaused()` returns `true` for `calm` and `off`. Both hooks read the new store (§6) plus the media query; their signatures stay, so the callers (`Backdrop`, `DecodeText`, `useAmbientMotion`, `useCountUp`, `useReveal`, `useScrollProgress`, `useViewProgress`, Pip, particles) need no changes. `useMotionPaused` moves out of `motionPause.ts`, so the imports change. `MascotSlot` does not load the Pip chunk while the level is `off` or Pip is hidden (it already gates on `useAmbientMotion`; the Pip setting is added to that check).

**Pause toggle.** `MotionToggle` keeps its look and name. `aria-pressed` is `true` for `calm` and `off`. Clicking it switches `full → calm` and `calm|off → full`. The old key `concept-18-motion-paused = true` is migrated once to `calm`, then removed.

**System preference.** If the system asks for reduced motion, the effective level is `off` whatever is stored: `useReducedMotion` is already `true`, so `calm` would behave exactly like `off`, and `full` is not offered against the OS. The segmented control shows `off` checked, `full` and `calm` are `disabled`, and the note from §1 explains why. The stored choice is kept and applies again when the system preference goes away. `MotionToggle` keeps today's behavior under the system preference.

## 3. Low vision: high contrast

`<html data-contrast="high">`, also applied automatically under `@media (prefers-contrast: more)` unless the reader picked Standard in the panel. So the stored value has three states, `auto | standard | high` (default `auto`); the panel shows Standard / High with the effective one checked. In CSS: `:root[data-contrast='high']` plus `@media (prefers-contrast: more) { :root:not([data-contrast='standard']) }`, both including the same `high-contrast-tokens` mixin.

**Token set** (`_tokens.scss`, `high-contrast-tokens` mixin, same names):

- Text `--color-text` pure near-white, `--color-text-muted` raised to the same value as body text: no gray body copy. Target: all text **7 : 1** (WCAG AAA 1.4.6) against its background.
- `--color-bg-raised` becomes opaque; no text sits on a translucent or blurred layer.
- `--color-line` and `--color-line-strong` at least 3 : 1 (1.4.11) so card edges, inputs and the toggle outlines are visible.
- Accent: lightness raised per finish so accent text and the button fill reach 7 : 1 / 4.5 : 1. Computed from `--accent-h/s/l` with a `clamp`, so all four finishes and the remembered finish (plan 2 §8) stay valid. A unit test checks the contrast of every finish in both modes.
- `--focus-ring` 3 px plus 2 px offset, in a color that is not the accent (yellow on black), so focus never depends on the finish.

**What else changes in high contrast.**

- Decoration that sits behind text is removed: backdrop gradient, living surfaces, particles canvas, wave masks. Phone drawings and exploded parts stay (they are the content), with strokes at full opacity.
- Mono labels and eyebrows: no uppercase, letter-spacing 0, size `--step-0`.
- Font weight at least 450 everywhere (Bricolage is variable; thin display weights go).
- Placeholder text, disabled states and the email field border all meet 4.5 : 1.
- Links in body text are underlined (same as §5 "underline links").

**Forced colors** (`forced-colors: active`, Windows high contrast): a small rule set, independent of the panel. SVG strokes and fills that carry meaning use `currentColor` / `CanvasText`; decorative SVG and the canvas are hidden; buttons whose shape comes only from a background get `border: 1px solid ButtonText`; the focus ring uses `Highlight`; the pressable fill and sheen layers are hidden.

**Color is never the only signal.** Audit while here: finish radios have visible names, invalid email has text and an icon, the active nav link has `aria-current` and the underline, not only a color.

## 4. Text size

Steps **100, 115, 130, 150, 175, 200 %**, stored as a number, mirrored as `<html data-text-scale="150">` and `--text-scale: 1.5`.

- `html { font-size: calc(100% * var(--text-scale, 1)); }` — 100 % keeps the reader's browser default as the base, so browser zoom and the OS font setting still stack.
- Type steps (`--step-down-1` … `--step-5` in `_tokens.scss`) use `rem + vw` in `clamp`; the `vw` part does not grow with the scale (e.g. `--step-5: clamp(2.5rem, 1.5rem + 5vw, 5.6rem)` is mostly `vw` at 1440). Each step's preferred value becomes `calc(<rem part> + <vw part> * var(--text-scale))`, so min, max and the fluid part all scale. Check: at 200 % every step is at least 1.9× its 100 % size at 1440 and 390. `--gutter` uses the same pattern but is spacing, not text; it stays as it is.
- Everything that is text-sized is in `rem`/`em`. The five `px` font sizes (`phone-render.module.scss` ×2, `HeroExtras.module.scss` ×2, `TitaniumSample.module.scss` ×1) are inside SVG drawings and scale with their drawing; they stay.

**Layout follows the text.** Viewport media queries do not see the root font size, so a 1280 px screen at 200 % would still get the three-column grid with twice the text. Fix:

- `body` becomes the size container (`container: page / inline-size`). The breakpoint map in `_breakpoints.scss` is in `px` today (`sm 480`, `md 768`, `lg 1024`, `xl 1440`); it becomes `rem` (`30`, `48`, `64`, `90`), and `up` / `down` switch from `@media (min-width: …)` to `@container page (min-width: …)` (`down` keeps its `- 0.02` step, in rem). `rem` in a container query follows the root font size, so at 200 % the 48 rem (`md`) breakpoint needs 1536 px, and a 1280 px screen gets the layout of a 640 px one (between `sm` and `md`). One mixin change, no per-component edits.
- Rules that sit on `body` itself cannot query the container they are; the spike lists any `up`/`down` use on `body` and moves it to a child or keeps it as a media query.
- Before the switch, a spike checks that inline-size containment on `body` does not break `position: fixed` / `sticky` (header, sticky CTA, pinned stages, Pip, the panel itself) in Chromium, Firefox and WebKit. If it does, the fallback is generated media queries per scale step (`@media (min-width: 48rem * s) { :root[data-text-scale='s'] & {} }`), emitted by the same mixin.
- JS media queries with a width: `HeroExtras.tsx` (`min-width: 768px`, parallax) and `ShapeParticles.tsx` (`max-width: 767.98px`, compact particles) do not see the scale either. They move to one helper that compares `innerWidth` with the rem breakpoint times the computed root `font-size` (that already includes the browser default and the scale), re-checked on resize and on settings change, so CSS and JS agree.
- Pinned sections do not pin at 150 % and above (§0).
- The header nav collapses earlier through the same container rule; the sticky CTA bar wraps its text.

**Requirements.** No horizontal scroll and no clipped text at 320 px with 200 % (WCAG 1.4.4 and 1.4.10). Buttons grow with their text; the tap minimum stays a minimum.

## 5. More reading settings

Each is a checkbox, stored in the same object, mirrored as an attribute on `<html>`.

- **Wider spacing** (`data-spacing="wide"`): WCAG 1.4.12 values: line height 1.6× (titles 1.3×), paragraph spacing 2×, letter spacing 0.12 em, word spacing 0.16 em. Doubles as the check that nothing clips under 1.4.12; the e2e test turns it on and looks for overflow.
- **Readable font** (`data-font="plain"`): body and titles switch to `system-ui` at weight ≥ 400, mono labels to the same sans, no uppercase, no letter-spacing, no tight display tracking on the h1. No new font file is downloaded (budget). Not called "dyslexia font": the evidence for special fonts is weak, plain and well-spaced text is what helps.
- **Underline links** (`data-links="underline"`): every text link underlined, 1 px offset 0.2 em. Already on in high contrast.
- **Hide Pip** (`data-pip="off"`): Pip is not loaded at all, its poke button and live messages are gone. Useful for screen magnifier users, for whom a walking element covering text is worse than for others.
- **Reset all**: back to defaults, removes the stored key, the page re-renders, focus stays on the button, live region says "Settings reset".

**Not doing, on purpose.**

- No text-to-speech, no big cursor, no color-blindness filters, no page zoom widget: the OS and browser do these better, and a screen reader user already has one.
- No "this site is accessible" overlay claims. The panel adds preferences; the page itself has to stay accessible without touching it.

## 5a. Light theme

Dark stays the default and the identity of the page; Light is a choice in the panel (segmented Dark / Light, stored as `theme`, mirrored as `<html data-theme="light">`, omitted for dark). It does not follow `prefers-color-scheme` on its own: the dark page is the design, and the reader decides.

- **Tokens.** `light-tokens` in `_tokens.scss`, same names: paper background, dark ink text, secondary text at 6 : 1, lines and field borders at 3 : 1. The accent goes darker instead of lighter (`min(var(--accent-l), 34%)`), so accent text and white text on an accent button both reach 4.5 : 1 for all four finishes. Surfaces that were hardcoded (header bar, sticky bar, email field) become tokens (`--color-bar`, `--color-bar-strong`, `--color-field`).
- **With high contrast.** `light-high-contrast-tokens`: white background, near-black text and lines, accent at `min(var(--accent-l), 26%)` for 7 : 1, a dark blue focus ring. Applied for `[data-theme='light'][data-contrast='high']` and for light plus `prefers-contrast: more` unless the reader picked Standard.
- **Drawings.** The line drawings (`--color-stroke`) turn dark on the light page. The phone itself is an object, not the page: the render, the exploded layers and the hero screen pin their glass and highlight colors through a `device-tokens` mixin, so the screen stays a dark screen.
- **Decoration.** The backdrop sweep becomes a tinted paper version of itself; particles, waves and Pip are unchanged (they take the accent).
- **Browser chrome.** `color-scheme: light` on the root, and `applySettings` updates `<meta name="color-scheme">` and `<meta name="theme-color">`. The head script sets `data-theme` before the first paint like every other setting.
- **Checks.** The contrast unit test covers four token sets (dark, dark high, light, light high) for every finish; e2e runs axe `color-contrast` in light and `color-contrast-enhanced` in light high contrast for all finishes.

## 6. Storage and first paint

- One store module, `src/hooks/a11ySettings.ts`, replaces `motionPause.ts` (and its test): shape `{ v: 1, motion, contrast, theme, textScale, spacing, font, links, pip }`, defaults `full`, `auto`, `dark`, `100`, `false` ×3, `true`. Read and write in try/catch; unknown keys, wrong types and out-of-range scales fall back to defaults per field, not for the whole object. Read through `useSyncExternalStore`, server snapshot = defaults, so hydration matches the prerendered HTML.
- `applySettings(settings)` is the only place that writes the `<html>` attributes and `--text-scale`. Pure helper `settingsToAttributes(settings, system)` is unit-tested.
- The plan 2 §8 Vite plugin (`remembered-finish` in `vite.config.ts`) that injects the finish script into `<head>` also injects the settings script: it reads `concept-18-a11y` (and, if that key is missing, the old `concept-18-motion-paused` key, so the first reload after the update does not flash motion back on) and sets the attributes before the first paint. Same pattern as `finishHeadScript()`: `a11ySettings.ts` exports `settingsHeadScript()`, a plain ES5 string whose defaults and allowed values are filled in with `JSON.stringify` from the module's own tables. The parser itself cannot be shared (TS, imports), so a unit test runs the head script in jsdom on the same inputs as `parseSettings` (valid, broken JSON, out-of-range, old key) and checks that both produce the same attributes. The module uses relative imports only, because `vite.config.ts` loads it. With text at 200 % there is no visible jump from 100 % on reload.
- The head script writes only the stored values; system preferences (`prefers-reduced-motion`, `prefers-contrast`) stay in CSS and in the hooks.
- Storage blocked: the panel still works for the current page, a note in the panel says settings will not be remembered.
- Settings changes from another tab (`storage` event) apply live.

## 7. Tests

- **Unit:** store parse and migration (old pause key, broken JSON, out-of-range scale), head script and `parseSettings` give the same attributes (§6), `settingsToAttributes` with each system preference, accent contrast per finish in both contrast modes, mixin output (a compiled snippet of `motion-safe`/`motion-reduce`, nested and at the top level, contains the `[data-motion="off"]` selectors inside `:where()`).
- **E2e:**
  - Panel: hover opens and closes after the grace period; Escape closes a hover preview while the pointer stays on it; Tab to the handle shows the preview and Tab moves past it; Enter pins it and focuses the first control; Escape returns focus to the handle; tap on a touch project pins it; every change is announced in the panel's live region.
  - Motion off: after load and a full scroll to the bottom, no animation in `document.getAnimations()` has `playState === 'running'` (finished `fill: both` animations from the safety net may still be listed), no `subscribeTick` listener is registered (`frameLoop.ts` gets a test-only listener count, exposed on `window` in e2e builds only, as it has no such API today), Pip is not in the DOM, exploded view shows its assembled state, `html` has `scroll-behavior: auto`. The same checks run once with the system preference (`reducedMotion: 'reduce'`) to prove both give the same page.
  - Calm: same checks as today's pause test, and scroll effects still move `--p`.
  - Text 200 % at 320 and 1280: `scrollWidth <= clientWidth`, no element with clipped text (`scrollHeight > clientHeight` on text containers), layout at 1280 matches the 640 layout.
  - Wider spacing: same overflow check.
  - High contrast: axe with `color-contrast-enhanced` (AAA) enabled, zero violations, for all four finishes.
  - Reload with stored settings: attributes present in the first paint (check in a throttled run, as plan 2 §8 does for the finish).
  - Forced colors: Playwright `forcedColors: 'active'`, screenshot at 1440, key controls visible.
- **Perf:** perf test with default settings unchanged; main bundle within +4 KB gz.

## 8. Work order

| #   | Step                                                                                                                                                          | Done when                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| R1  | Settings store, migration from the pause key, head script via the plan 2 §8 plugin                                                                            | unit tests green, attributes set before first paint, pause toggles behave as before                                           |
| R2  | Motion levels: mixins, migration of direct `prefers-reduced-motion` / `data-motion-paused` uses, stylelint rules, `useReducedMotion` / `useMotionPaused`, net | motion off e2e green, calm e2e green, nothing changes visually at `full`, stylelint finds no direct use left                  |
| R3  | Panel shell: handle, preview/pin/close, inert, focus return, code-split body (§1)                                                                             | keyboard, hover and touch e2e green, axe clean, panel works with JS loaded late                                               |
| R4  | Container-query spike for `body`, breakpoints to rem, mixin switch, JS width queries (§4)                                                                     | fixed/sticky elements fine in all three engines, or fallback chosen and written down in this plan                             |
| R5  | Text size steps, type scale rewrite, unpinning at ≥ 150 % (§4)                                                                                                | 200 % at 320 and 1280: no horizontal scroll, no clipped text                                                                  |
| R6  | High contrast tokens, decoration removal, `prefers-contrast`, forced colors (§3)                                                                              | axe AAA contrast clean for all finishes, forced-colors screenshot reviewed                                                    |
| R7  | Reading settings: spacing, plain font, underline links, hide Pip, reset (§5)                                                                                  | each setting toggles its attribute and survives reload; 1.4.12 overflow check green                                           |
| R8  | Lint, typecheck, unit, e2e, perf, bundle size                                                                                                                 | all green, main +4 KB gz at most                                                                                              |
| R9  | README: "Accessibility" section and "Known gaps" updated                                                                                                      | describes the panel, the three motion levels, what high contrast changes, the text-size layout rule, non-goals                |
| R10 | Light theme: tokens, device tokens, panel control, head script, meta tags (§5a); handle-only collapsed state (§1)                                             | contrast unit test green for four token sets, axe light/light-high green for all finishes, closed panel shows only the handle |

## 9. Implementation notes

Where the build differs from the text above, the build is the rule.

- **Container queries (R4).** `body` as an inline-size container did not break the fixed header, sticky CTA, pinned stages, Pip or the panel in Chromium, Firefox and WebKit (full e2e suite on all five projects), so the media-query fallback was not needed. Side effect: with classic scrollbars the container is the window minus the scrollbar, so every breakpoint switches about 15 px later than before.
- **Modules (§6).** The store is split in two: `src/hooks/a11ySettings.ts` is pure (types, defaults, `parseSettings`, `settingsToAttributes`, `effectiveSettings`, `settingsHeadScript`) because `vite.config.ts` loads it; `src/hooks/a11yStore.ts` holds the runtime store, `applySettings` and the hooks. `settingsToAttributes(settings)` writes only stored values; the OS preferences are combined in `effectiveSettings(settings, system)` for the panel and stay in CSS for the page.
- **Mixins (§2).** Besides `motion-safe` / `motion-reduce` there are `motion-ambient` (full level only, for ambient effects outside `when-awake`), `hover-motion`, `static-scene` (motion off or text ≥ 150 %, for the pinned stages), `high-contrast`, `plain-font` and the `root-motion-*` variants. The safety net skips elements marked `data-calm-fade` (the pause toggle, the panel's segments and switches).
- **Particles under "off".** Not loaded at all, as under the OS setting, rather than one static frame: "off" is meant to be identical to `prefers-reduced-motion`.
- **Frame check (§7).** Instead of a test-only listener count in `frameLoop.ts`, the e2e test counts `requestAnimationFrame` calls during half a second of idle time; production code has no test hook.
- **Handle (§1).** No separate hover label: hovering opens the panel and its heading. There is no visible strip at any width (the first build showed a 0.75 rem strip of the panel, and its scrollbar peeked through). The handle keeps its 100 % size at every text scale, so the tab does not cover more of the page as text grows. Below a 48 rem window the tab is 1.75 rem wide (still above the 24 px target minimum of WCAG 2.5.8), because a fixed tab mid-screen covers the content edge; e2e tests tap option tiles rather than tiny inputs near that edge.
- **Large text (§4).** Long words break (`overflow-wrap: anywhere`, `hyphens: auto`) while a text scale is set. Primary buttons wrap between words (their rolling letters are grouped per word, the stagger is a `--i` custom property). At narrow widths with a text scale, the header keeps the mark and the pause toggle; the product name becomes visually hidden and Reserve stays in the hero and the sticky CTA.
- **Pip setting.** A checkbox "Show Pip" (on by default) rather than "Hide Pip"; the stored field is `pip: true | false`.
