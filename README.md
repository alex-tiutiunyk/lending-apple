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
npm run test:e2e     # Playwright on desktop and Pixel 7 viewports, with axe
npm run lint         # ESLint, Stylelint, Prettier
```

`npm run points` regenerates the 400 particle targets from the mark path in `src/assets/svg/apple-mark-path.ts`.

## How the motion works

There is no animation library. One module, `src/hooks/frameLoop.ts`, owns the only `requestAnimationFrame` loop and the only scroll listener. Pinned sections measure themselves on layout changes, turn scroll position into a 0..1 progress and write it once per frame as `--p` on the section. Everything visual is then plain CSS: stroke offsets, `clip-path`, 3D transforms and label colors are `calc()` and `clamp()` expressions of `--p`, so React never re-renders while you scroll.

Simple reveals use `animation-timeline: view()` where the browser has it and an IntersectionObserver fallback where it does not. With `prefers-reduced-motion: reduce` every pinned section drops into normal flow at its final frame, the counters show their values and the particle canvas is never loaded.

## What was hard

- Getting the exploded view to read as depth with nothing but `translateZ` on flat SVGs. The layers share one viewBox, so the trick was tuning the rotation and spread so the gaps stay legible on a 390 px screen.
- `stroke-linecap: round` paints a dot for a zero-length dash, so undrawn paths showed a scatter of specks. Paths now fade in during the first few percent of their window.
- The page is prerendered at build time so the headline paints before any JavaScript runs. The countdown and the save-data check use `useSyncExternalStore` server snapshots so hydration never disagrees with the build-time HTML.

## Known gaps

- JavaScript is about 83 KB gzipped against a 60 KB budget. React 19 alone accounts for roughly 60 KB of that; the page's own code is around 20 KB.
- Tested in Chromium (desktop and mobile emulation) only. Safari, Firefox and real devices are still to check.
