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

The plans the page was built from live in `docs/`: `0-plan-landing.md` for the page itself and `1-plan-motion-and-detail.md` for the second pass with the mascot.

## How the motion works

There is no animation library. One module, `src/hooks/frameLoop.ts`, owns the only `requestAnimationFrame` loop, the only scroll listener and the only pointer listener. Pinned sections measure themselves on layout changes, turn scroll position into a 0..1 progress and write it once per frame as `--p` on the section. Everything visual is then plain CSS: stroke offsets, `clip-path`, 3D transforms and label colors are `calc()` and `clamp()` expressions of `--p`, so React never re-renders while you scroll.

Simple reveals use `animation-timeline: view()` where the browser has it and an IntersectionObserver fallback where it does not. With `prefers-reduced-motion: reduce` every pinned section drops into normal flow at its final frame, the counters show their values and the particle canvas is never loaded.

Ambient motion is everything that moves without the reader doing anything: the pulse on primary buttons, the drifting waves on dark blocks and the backdrop, the floating hero phone, the breathing particle shapes and Pip. It only runs while its element is on screen, and the "Pause motion" button in the header and footer stops all of it and remembers the choice. Scroll-driven effects keep working when motion is paused, because they follow the reader.

Particles drift with scroll and gather into a different shape beside each image: a spark by the hero, a compass by the line drawing, a gear by the exploded view, a lens, sun, chip and lattice by the feature cards, the apple by the finishes and a check mark by the form. Each particle picks one nearby shape by weight and eases toward it, so two cards side by side split the particles between them instead of blurring into one smudge.

Pip is a pocket phone with legs that walks along the bottom of the window. Its face is the cutout. Between walks it takes selfies, naps, dances, trips, checks itself in a mirror and makes dry remarks; fast scrolling blows it back, and poking it (it is a real button) makes it complain once through a polite live region. It stops while it has focus or the pointer is on it, steps out of the way of the footer, the form and the sticky bar, and is not loaded at all under reduced motion or when motion is paused.

## What was hard

- Getting the exploded view to read as depth with nothing but `translateZ` on flat SVGs. The layers share one viewBox, so the trick was tuning the rotation and spread so the gaps stay legible on a 390 px screen.
- `stroke-linecap: round` paints a dot for a zero-length dash, so undrawn paths showed a scatter of specks. Paths now fade in during the first few percent of their window.
- WebKit stops fractional scrolling a hair before the end of a pinned section, which left the exploded view at 0.999 instead of fully assembled. Progress now snaps to 1 within the last pixel.
- The page is prerendered at build time so the headline paints before any JavaScript runs. The countdown and the save-data check use `useSyncExternalStore` server snapshots so hydration never disagrees with the build-time HTML.

## Known gaps

- JavaScript is about 89 KB gzipped against a 60 KB budget (83 KB before the second pass, which allowed itself 10 KB more). React 19 alone accounts for roughly 60 KB. The particle canvas (4.5 KB) and Pip (2.9 KB plus 1.6 KB of CSS) load as separate chunks after the page is interactive.
- The header used to blur what scrolls under it. The blur was recomputed on every frame once ambient motion was running and cost Firefox two thirds of its frame rate, so the header is now a near-opaque bar instead.
- Checked in Chromium, Firefox and WebKit through Playwright emulation, not on real phones or tablets yet. iOS address-bar behavior and VoiceOver/NVDA passes still need a person with the devices.
- Lighthouse mobile (simulated Slow 4G), measured before the second pass: 96 performance, 100 accessibility, 100 best practices, 100 SEO, LCP 1.9 s against a 1.5 s target. Lighthouse has not been re-run since; a Playwright check with 4x CPU throttling on a Pixel 7 profile showed the same LCP before and after the second pass (about 1.3 s median there).
- The long-task check (`npm run test:perf`) occasionally fails on the first run after the machine has been busy, on the old build as well as the new one. Run it on its own when it matters.
