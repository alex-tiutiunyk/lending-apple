# Concept 18 Pro

An unofficial, scroll-driven concept page for a next-generation phone. Portfolio work: not affiliated with Apple, and every spec on the page is invented.

![Hero of the page: a line drawing of a phone next to the headline](public/og-image.jpg)

Live URL: not deployed yet. `npm run build` produces a static `dist/` that any static host can serve.

## Run it

```sh
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check, client build, prerender into dist/index.html
npm run preview      # serve dist/ on http://localhost:4173
npm test             # Vitest: hooks and pure animation math
npm run test:e2e     # Playwright: Chrome, Pixel 7, Firefox, iPad and iPhone (WebKit), with axe
npm run test:perf    # one Chromium run that fails on any long task while scrolling
npm run lint         # ESLint, Stylelint, Prettier
```

`npm run points` regenerates the 400 apple-mark particle targets from `src/assets/svg/apple-mark-path.ts`. The other particle shapes are polylines in `src/components/Backdrop/particleShapes.ts`, sampled at runtime.

The plans the page was built from live in `docs/`: `0-plan-landing.md` for the page itself, `1-plan-motion-and-detail.md` for the second pass with the mascot `2-plan-play-and-polish.md` for the third pass with Pip combos, the nav indicator and more motion on load, and `3-plan-accessibility-panel.md` for the accessibility panel.

## How the motion works

There is no animation library. One module, `src/hooks/frameLoop.ts`, owns the only `requestAnimationFrame` loop, the only scroll listener and the only pointer listener. Pinned sections measure themselves on layout changes, turn scroll position into a 0..1 progress and write it once per frame as `--p` on the section. Everything visual is then plain CSS: stroke offsets, `clip-path`, 3D transforms and label colors are `calc()` and `clamp()` expressions of `--p`, so React never re-renders while you scroll.

Simple reveals (titles, ledes, the chip table rows) use `animation-timeline: view()` where the browser has it and an IntersectionObserver fallback where it does not; text is never hidden without JavaScript. Mono labels decode once on entry through an `aria-hidden` overlay, and the sentence under "The numbers" lights up word by word from its own crossing progress, backwards too. With reduced motion (the OS setting or "Motion: off" in the accessibility panel) every pinned section drops into normal flow at its final frame, the counters show their values and the particle canvas is never loaded.

Ambient motion is everything that moves without the reader doing anything: the pulse and the idle nudges on primary buttons (a buzz or a sheen every 7 s, at most five per visit to the view, never again once hovered), the bugs in the empty email field, the drifting waves on dark blocks and the backdrop, the floating hero phone and the parts drifting around it, the breathing particle shapes and Pip. It only runs while its element is on screen, and the "Pause motion" button in the header and footer stops all of it and remembers the choice (it is the "Calm" level of the panel's motion setting). Scroll-driven effects keep working when motion is paused, because they follow the reader. The pause button itself still animates on click (the bars fold into the play triangle through CSS `d`, with a crossfade where WebKit has no `d`), since that is the answer to the reader's own action.

The hero phone boots after the headline: its screen lights up with the time and three notifications and a cable plugs in. That decoration is a separate chunk loaded after hydration, so it never touches the LCP. In the exploded view the stack ends as a finished phone: the glass is clear, the black OLED panel wakes into the lock screen once the glass lands, a glint crosses it, the band gets real thickness from stacked slices and the camera turns to a three-quarter view, all from the same `--p`.

The header nav marks the section in view with a tiny landscape phone on legs that runs to the active link, as wide as its text. The finish you pick is stored and applied by an inline script in `<head>`, so a reload shows it from the first paint.

Particles drift with scroll and gather into a different shape beside each image: a spark by the hero, a compass by the line drawing, a gear by the exploded view, a lens, sun, chip and lattice by the feature cards, the apple by the finishes and a check mark by the form. Each particle picks one nearby shape by weight and eases toward it, so two cards side by side split the particles between them instead of blurring into one smudge.

Pip is a pocket phone with legs that walks along the bottom of the window. Its face is the cutout. Between walks it takes selfies, naps, dances, trips, checks itself in a mirror and makes dry remarks; fast scrolling blows it back, and poking it (it is a real button) makes it complain through a polite live region. Two, three and four quick pokes are combos (a screenshot, a dizzy spin, airplane mode), and now and then it hints at the ones you have not found. It also waves, takes calls, charges, moonwalks, stretches and juggles screws. It stops while it has focus or the pointer is on it, and its eyes follow the pointer then. It keeps itself off links and fields in the footer, the form and the sticky bar instead of fading out, and is not loaded at all under reduced motion or when motion is paused.

The fourth pass adds small living details. The attention ring on primary buttons now pulses without end while the button is on screen (a rest between pulses, half a cycle apart on the header and hero buttons, gone while hovered, focused or nudged). The scrollbars follow the site's palette and the finish. The spark, compass and gear shapes turn a little with scroll while assembled, through the pin for the pinned ones. The line drawing is a blueprint now: hairlines in two weights, about twice as many paths (inner contours, status bar, speaker slots, SIM tray, construction axes and radius marks), a diagonal gradient that follows the finish and a bright head on the contour being drawn; its color reveal takes a third of a longer section instead of the last tenth, eased. The brand mark draws its outline before it fills, breathes while awake, turns with the scroll speed and spins once on hover; a line along the header's bottom edge shows the page position with a glow on its tip, and a mono label next to the name names the section in view with the same state as the nav. Footer links roll their letters like the buttons, grow an underline and slide in an arrow; "Back to top" is a button next to the pause toggle, and above the footer the dots gather into a small rocket that lifts off when you press it while a tiny phone flies up the page and the page scrolls with it (any wheel, touch or key cancels the flight; focus lands on the home link). Now and then a few letters in a title or paragraph grow legs, run off, look around and walk back; the text itself never changes (the glyph is painted transparent through the CSS Custom Highlight API while a copy runs in an overlay, so neither the DOM nor the kerning is touched; browsers without the API never run the letters). Every second escape, when Pip is idle, one letter jumps down onto Pip's line and Pip gives chase, loses it twice and misses. Pip also glances up when the section label changes and cheers once when the page reaches its end. One module, `useDocumentProgress`, writes the page position and scroll speed on `<body>` for the backdrop, the header line and the marks.

CSS module class names are readable BEM: the block is the module file name, `.root` is the block itself and other local classes become elements, so the DOM shows `pressable--button` and `exploded-view__stack` instead of hashes. A Vitest check fails on duplicate blocks or names outside the pattern.

## Accessibility

A panel on the left edge of the window holds the reading settings. Only its handle shows. The handle is an ordinary button: Tab reaches it, and only a click or Enter opens the panel (hover and focus do nothing but fetch the controls early); the controls stay `inert` while it is closed. A second click, a click outside or Escape closes it, and Escape puts focus back on the handle. The controls are a separate 1.3 KB chunk loaded on the first hover, focus or tap. Every change is announced in a polite live region inside the panel, and the choices are applied by the same inline `<head>` script as the finish, so a reload never flashes the defaults.

- **Motion: Full, Calm, Off.** Calm stops ambient motion and keeps scroll effects. Off is exactly what `prefers-reduced-motion: reduce` gives: no ambient, scroll-driven or hover motion, no smooth scroll, no Pip. One attribute (`data-motion` on `<html>`) and the motion mixins in `_mixins.scss` carry both sources, and Stylelint rejects a direct `prefers-reduced-motion` query anywhere else. A safety net zeroes every animation and transition under reduced motion in case a component forgets. When the OS asks for reduced motion, Off is the only level offered.
- **Text size, 100 to 200 %.** The root font size scales, and so does the `vw` share of the fluid type steps. Breakpoints are rem container queries against `body`, so the layout follows the text: at 200 % a 1280 px window gets the 640 px layout, and from 150 % the pinned sections show their final state in normal flow. Long words break instead of widening the grid.
- **Contrast: Standard, High.** High contrast (also used under `prefers-contrast: more` unless the reader picked Standard) uses opaque surfaces, near-white body and secondary text at 7 : 1 or more, lines at 3 : 1, a raised accent lightness for every finish and a yellow focus ring that does not depend on the finish. The backdrop, particles and wave textures go; the phone drawings stay. Windows high contrast (`forced-colors`) gets its own small rule set.
- **Theme: Dark, Light.** Dark is the default and the design; Light is the reader's choice. Its tokens darken the accent instead of lightening it, so every finish keeps 4.5 : 1 (7 : 1 with high contrast, which has its own light set). Line drawings turn dark, while the phone render, the exploded layers and the hero screen keep their own glass colors.
- **Reading:** wider spacing (the WCAG 1.4.12 values on every element), a plain system font, underlined links, and hiding Pip.

What the panel does not do on purpose: text-to-speech, cursor or color-blindness filters (the OS does these better), or "accessible" overlay claims. The light theme does not switch on by itself from `prefers-color-scheme`.

## What was hard

- Getting the exploded view to read as depth with nothing but `translateZ` on flat SVGs. The layers share one viewBox, so the trick was tuning the rotation and spread so the gaps stay legible on a 390 px screen.
- `stroke-linecap: round` paints a dot for a zero-length dash, so undrawn paths showed a scatter of specks. Paths now fade in during the first few percent of their window.
- WebKit stops fractional scrolling a hair before the end of a pinned section, which left the exploded view at 0.999 instead of fully assembled. Progress now snaps to 1 within the last pixel.
- The page is prerendered at build time so the headline paints before any JavaScript runs. The countdown and the save-data check use `useSyncExternalStore` server snapshots so hydration never disagrees with the build-time HTML.

## Known gaps

- JavaScript is about 98.7 KB gzipped against a 60 KB budget (96.3 KB before the fourth pass, which allowed itself 5 KB and took about 2.4 KB; 89.3 KB before the third pass, which allowed itself 6 KB more; about 93.5 KB before the accessibility panel, which allowed itself 4 KB and took about 2.8 KB). React 19 alone accounts for roughly 60 KB. The particle canvas (5.2 KB), Pip (6.1 KB plus 2.8 KB of CSS), the hero decoration (1.5 KB), the panel controls (1.3 KB), the runaway letters (3.4 KB plus 0.5 KB of CSS, only at the Full motion level) and the Back to top flight (0.9 KB, on the first hover of its button) load as separate chunks after the page is interactive.
- Until the third pass, CSS modules renamed the global keyframes they used, so the button pulse, the sheen, the drifting waves and the title reveals never actually played in a build. Generating class names ourselves fixed that; it also means those effects now cost real frames, which is visible in slow emulated WebKit.
- The header used to blur what scrolls under it. The blur was recomputed on every frame once ambient motion was running and cost Firefox two thirds of its frame rate, so the header is now a near-opaque bar instead.
- Checked in Chromium, Firefox and WebKit through Playwright emulation, not on real phones or tablets yet. iOS address-bar behavior and VoiceOver/NVDA passes still need a person with the devices.
- Lighthouse mobile (simulated Slow 4G), measured before the second pass: 96 performance, 100 accessibility, 100 best practices, 100 SEO, LCP 1.9 s against a 1.5 s target. Lighthouse has not been re-run since; a Playwright check with 4x CPU throttling on a Pixel 7 profile showed the same LCP before and after the second pass (about 1.3 s median there). After the third pass, an unthrottled local Chromium check showed the same LCP as before it (about 150 ms) and a CLS of 0.
- With classic (non-overlay) scrollbars the layout breakpoints now see the page without the scrollbar, so each one switches about 15 px of window width later than before. At 320 px and 200 % text, display headings break inside long words.
- On phones the accessibility tab (28 px wide) still covers about 10 px of the content edge in the middle of the window; content scrolls out from under it.
- The accessibility panel has been checked with axe (AAA contrast in high contrast, all finishes) and Playwright, not yet with a screen reader or a real screen magnifier.
- The long-task check (`npm run test:perf`) occasionally fails on the first run after the machine has been busy, on the old build as well as the new one. Run it on its own when it matters.
