# Working on this page

Read `README.md` first: "How the motion works" says what moves and why, "Animation performance rules" is the rulebook every new feature follows, and "Known gaps" is what is still open. The plans in `docs/` are numbered; a higher number wins over a lower one, and plan 6 (`docs/6-plan-animation-performance.md`) is where the performance rules come from.

Before a feature that moves anything is called done:

1. Keep the nine rules in README "Animation performance rules". The short form: nothing per frame on `<html>`, `<body>` or a section; scroll position is a timeline, not a variable; read in a listener, write through `write()` from `src/hooks/frameLoop.ts`; loops are `transform` / `opacity` on HTML elements or root `<svg>`s; no filters on moving things; `will-change` only through `promote-while-awake`; off-screen things sleep; the loop sleeps; budgets are measured.
2. `npm run lint`, `npm test` (the `config/` tests include the `will-change` and per-frame-property guards), `npm run build`.
3. `npm run test:perf` against the build, and `npm run perf` when a number in README's budget table might have moved. Update the table and "Known gaps" from the probe's output, never from memory.
4. Motion levels go through the mixins in `src/styles/_mixins.scss` (`motion-safe`, `motion-reduce`, `motion-ambient`, `when-awake`, `hover-motion`); copy lives in `src/content/`; components stay under 150 lines; class names are BEM through the CSS-module naming in `config/bemClassName.ts`.

Commit only when asked.
