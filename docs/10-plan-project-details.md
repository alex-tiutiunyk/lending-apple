# Plan 10: the project details tab

Builds on `0-plan-landing.md` … `9-plan-bitten-mark-and-mesh.md`. Where this plan conflicts with an earlier one, this plan wins (plan-order note in plan 0). Everything not mentioned here keeps the earlier rules: no animation library and no new runtime dependency, one rAF loop (`frameLoop.ts`), visible without JS, all copy in `content/`, components under 150 lines, BEM class names, motion levels `full` / `calm` / `off` through the plan 3 mixins, and **the plan 6 rulebook (§2) for every animation**.

Goal: a visitor who wants to know how the page was made finds a small tab, presses it and reads the project details in a lightbox: the tech stack and what was built, the same text as the GitHub README, without the badges and GIFs. The text is in English by default and can be switched to Ukrainian. Nothing here is built yet.

**Starts from the plan 9 numbers.** Measure with `npm run build && npm run perf` before P1 and copy the numbers into §9; every limit in §5 is counted from them. The plan 9 reds in `npm run test:perf` (if they are still red) must not get worse.

## 0. Overrides of plans 0 to 9

| Earlier rule                                                          | Plan 10 change                                                                                       | Why                                                          |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Plan 0: all copy lives in `src/content/` as TS                        | The details text lives in Markdown files at the repo root (§1) and is turned into data at build time | one text for GitHub and the page; the README is the source   |
| Plan 0: the page is English only (`<html lang="en">`)                 | The dialog's text can be Ukrainian; the content block carries its own `lang`                         | asked for: English and Ukrainian                             |
| Plan 3: the left edge holds the only fixed tab (accessibility handle) | A second tab, on the right edge (§2)                                                                 | a "flag" that is always reachable and does not cover the nav |
| Plan 0 / README: Bricolage is the only text face                      | The Ukrainian text uses a system stack (§4): Bricolage has no Cyrillic                               | otherwise every Cyrillic letter falls back glyph by glyph    |

## 1. The text: one Markdown source per language

- **English:** the root `README.md`, as it is. The dialog shows its "Tech stack" and "Problems solved" sections (from `## Tech stack` up to, not including, `## Run it`). The title block, badges, GIFs, "Run it" and the closing links stay GitHub-only.
- **Ukrainian:** a new `README.uk.md` at the root, a full translation of `README.md` with the same structure (same headings in the same order, same table rows, same number of list items per section). `README.md` gets a one-line language switch under the title (`English · [Українська](README.uk.md)`), and the Ukrainian file the mirror of it; that is the usual GitHub convention, so the repo shows both too.
- **No images in the dialog.** The converter drops images, `<img>`, badges and raw HTML blocks; a unit test fails if the output has any `<img>`, `<picture>` or `<svg>`. Links are kept (opened in a new tab, `rel="noopener"`); repo-relative links (`docs/README.md`) are rewritten to the GitHub URL (`https://github.com/alex-tiutiunyk/lending-apple/blob/main/…`), since the page does not serve them.
- **Converted at build time, not in the browser.** A small Vite plugin (`config/projectDetails.ts`) reads both files, cuts the sections and turns the Markdown subset the README uses into a plain tree: headings (`##`, `###`), paragraphs, bullet lists, tables, `**bold**`, `` `code` ``, links. It is exposed as two virtual modules, `virtual:project-details/en` and `virtual:project-details/uk`, so each language is its own chunk and is fetched only when shown. A hand-written subset converter, not `marked` or similar: the subset is small, it keeps `dependencies` at `react` + `react-dom`, and it can **fail the build on syntax it does not know** (a blockquote, a nested list, a heading level 4), so a later README edit cannot silently render wrong. The tree is rendered by React components, not `dangerouslySetInnerHTML`.
- **Kept in sync by a test.** `config/projectDetails.test.ts` checks both languages produce the same shape: same section and heading count, same table column and row counts, same list item counts. A README edit in one language that is not mirrored fails `npm test`.
- Dev: the plugin watches both files, so editing a README reloads the dialog's chunk.

## 2. The tab

- **Where:** a vertical tab on the right edge of the window, below the header and above the sticky CTA, the mirror of the accessibility handle on the left: the same height and corner radius, a bookmark notch cut into its outer end (a `clip-path` on a still element, so it reads as a flag), the label "About this project" in the mono face, rotated. On phones it is the same 36 px-wide variant the plan 8 §11 alternative describes for the accessibility tab, with the label hidden and only the glyph showing (a small "i" over a document), so it covers less of the content edge.
- **Also in the footer:** a link "About this project" in the footer link list, next to "Font license", for readers who reach the end. Both open the same dialog.
- **Without JS:** both are real links to the README on GitHub (`…/blob/main/README.md`); a script intercepts the click and opens the dialog instead. The tab is in the prerendered HTML (unlike the accessibility handle, it does something without JS).
- **Motion:** the tab does not loop. On hover it slides out 4 px and the notch deepens (`transform` only, through `hover-motion`, so `off` and touch get nothing); no `will-change`, no layer at rest. It joins the plan 7 border pulse list only if the layer count in §5 allows it, decided at P4.
- `data-pip-avoid`, so Pip keeps off it, and the runaway letters do not pick its label.
- High contrast and forced colours: the plain tab with a border, as the accessibility handle.

## 3. The lightbox

- **A native `<dialog>` opened with `showModal()`.** It gives the top layer, the inert page behind, Escape to close and the focus handling for free. Focus goes to the dialog's title (`tabIndex={-1}`) on open and back to the button that opened it on close. A click on `::backdrop` closes it too (a click whose target is the `<dialog>` itself, outside the content box).
- **Layout:** a panel up to 46 rem wide and `min(90dvh, 52 rem)` tall, centred; on phones it fills the screen with the safe-area insets. A head row with the title ("About this project" / "Про проєкт"), the language switch and a close button (44 px tap area); below it the text scrolls on its own (`overflow-y: auto; overscroll-behavior: contain`), the page under it does not (`overflow: hidden` on the root while open, written once on open and once on close, not per frame).
- **Typography:** the README's sections as the page already sets text: `h2` / `h3` at the section-label and card-title steps, the tech stack table as a two-column definition grid on narrow screens (the table stays a `<table>` for screen readers, the grid is CSS), code in the mono face.
- **Backdrop:** a flat, near-opaque scrim from the surface token. **No `backdrop-filter`:** the ambient motion behind it would make the blur recompute every frame, the same cost that removed the header blur (Known gaps).
- **Motion:** at `full` and `calm` the panel fades in and rises 12 px over 240 ms (`opacity` and `transform`, a one-shot that fills `backwards` and ends on its base style, rule 6), and fades out over 160 ms on close (the `<dialog>` stays open until `animationend`, then `close()`). `off`: it just appears and disappears. Nothing loops inside the dialog.
- **Ambient motion behind it** is hidden by the scrim but still runs. Whether it should sleep while the dialog is open (the awake sections drop `[data-awake]`, Pip stands still, without touching the reader's pause choice) is decided at P2 from the "dialog open, idle" numbers in §9: the scrim is near-opaque, so if the frames behind it cost little, the dialog adds no code for it.
- **Code-split:** the dialog shell is a lazy chunk fetched on the first hover, focus or press of either trigger (as the accessibility panel's controls), the text chunk of the current language on open, the other language on the first hover of the switch. A slow chunk shows the plan 7 spinner in the panel body and `aria-busy`.

## 4. English and Ukrainian

- **Switch:** two buttons, "EN" and "УКР", as a group with `aria-label` "Language" / "Мова" and `aria-pressed` on the current one (not a `<select>`: two options, one press). English on every open.
- **Not remembered (decided):** every open starts in English; the switch only changes the dialog while it is open. Nothing goes to `localStorage` and there is no `<head>` script.
- **What switches:** the text, the dialog title, the switch's group label, the close button's label and the spinner text. The page around the dialog stays English. The dialog's content wrapper carries `lang="en"` or `lang="uk"`, so screen readers change voice and hyphenation follows. The UI strings live in `src/content/copy.ts` as `projectDetailsCopy.en` / `.uk`.
- **On switch:** the scroll position goes back to the top, focus stays on the pressed button, and a polite live region in the dialog says "Українська" / "English".
- **Font:** Bricolage Grotesque has no Cyrillic, so a Ukrainian line would mix Bricolage Latin (code names, "React") with fallback Cyrillic. Under `[lang='uk']` the dialog uses a system stack (`system-ui, 'Segoe UI', Roboto, sans-serif`) for the whole text. Decided: the system stack, no Cyrillic web font.

## 5. Budget

| What                             | Limit                        | What goes in                                                                  |
| -------------------------------- | ---------------------------- | ----------------------------------------------------------------------------- |
| Main JS                          | **+0.4 KB gz**               | the tab, the footer link, the lazy imports and the open/close glue            |
| Main CSS                         | **+0.4 KB gz**               | the tab and its hover                                                         |
| Dialog chunk                     | **≤ 2.0 KB JS + 1.0 KB CSS** | the `<dialog>` shell, the tree renderer, the language switch                  |
| Text chunks                      | **≤ 3.5 KB gz each**         | the README sections as a tree, one chunk per language                         |
| Layers at the hero, at rest      | **+0** against P0            | the tab is still; no `will-change`                                            |
| Idle frames, scroll, finish pick | no worse than P0             | nothing new runs per frame                                                    |
| Open dialog, idle                | measured, into §9            | what still runs behind the scrim; the input to the "sleep behind it" decision |
| `test:perf`                      | no worse than P0             |                                                                               |

## 6. Decisions and open questions

Decided (2026-10-16):

- §2, placement: the right-edge tab, plus the footer link. If two edge tabs on a phone turn out to cover too much, the phone tab goes and the footer link stays (checked by eye at P3).
- §4, language: English on every open, the choice is not remembered.
- §4, font: the system stack for Ukrainian, no Cyrillic web font.
- §1, content: the README's two sections only, no summary from `docs/README.md`.

Nothing is open.

## 7. Work order (draft)

| #   | Step                                                                                                  | Done when                                                          |
| --- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| P0  | Baseline `npm run build && npm run perf`; numbers into §9                                             | baseline written                                                   |
| P1  | `README.uk.md`, the language links in both READMEs, the converter plugin and its virtual modules (§1) | unit tests green: subset, no images, both languages the same shape |
| P2  | The `<dialog>`, the tree renderer, the language switch, the lazy chunks (§3, §4)                      | opens, closes, switches; e2e below green                           |
| P3  | The tab and the footer link, their no-JS fallback and hover (§2)                                      | both open the dialog; without JS both go to GitHub                 |
| P4  | Lint, typecheck, unit, e2e, `test:perf`, `perf`; README (motion list, budget, Known gaps) from output | all green, or the P0 reds no worse and in Known gaps               |

## 8. Tests (draft)

- **Unit:** the converter on each construct of the subset and its failure on an unknown one; no `<img>` / `<svg>` / raw HTML in the output; relative links rewritten to GitHub; English and Ukrainian trees the same shape; the "Tech stack" table has the same rows in both.
- **E2e:**
  - The tab and the footer link are in the prerendered HTML as links to GitHub; with JS, a click opens the dialog and does not navigate.
  - Open: the dialog is modal (`:modal`), focus is on its title, the page behind is inert, the body does not scroll; Escape, the close button and a backdrop click close it, and focus returns to the trigger.
  - Language: English on the first open; "УКР" swaps the text and the title, `lang="uk"` on the content, the live region speaks, focus stays on the switch; a reopen after switching shows English again, and `localStorage` has no key for it; no request for the Ukrainian chunk before the switch is hovered or pressed.
  - No `<img>` inside the dialog.
  - axe on the open dialog in both languages, both themes and high contrast.
  - `off`: no animation on open or close; the tab does not move on hover.
- **Perf:** `npm run perf` at P0 and P4; one new scenario "dialog open, idle" in `scripts/perf-probe.mjs`.

## 9. Implementation notes

Filled in during the build. Where the build differs from the text above, the build is the rule.

**P0 baseline (2026-10-16, `vite build` and `npm run perf` on this machine):** main JS 103.87 KB gz, main CSS 26.46 KB. Hero drawing layers 51 idle and 48 under the pointer, overdraw 11.1× / 11.9×; full scroll 19 ms mean; finish pick longest task 97 ms.

**How it was built, where it differs from the text above:**

- **Markers, not headings.** The converter cuts the README between `<!-- project-details:start -->` and `<!-- project-details:end -->` (invisible on GitHub) instead of between the "Tech stack" and "Run it" headings, so the Ukrainian file with its own headings cuts the same way. `README.md` gets a language line under the tagline (`**English** · [Українська](README.uk.md)`), `README.uk.md` the mirror of it.
- **Files.** `config/projectDetails.ts` (the converter and the Vite plugin, wired in `vite.config.ts`), `config/projectDetails.test.ts`, `src/content/projectDetailsTree.ts` (the tree types, the languages, the GitHub URLs), `src/content/projectDetailsModules.d.ts` (the virtual modules' type), `src/content/projectDetailsCopy.ts` (the dialog's strings in both languages, imported only by the dialog so they ride in its chunk; the tab's label stays in `copy.ts`), and `src/components/ProjectDetails/`: the tab, the shared link, a small store between the triggers and the lazy dialog, the slot, the dialog, its open/close hook `useModalDialog`, the tree renderer and the text loader.
- **The tab** is a still SVG flag (the swallowtail is part of the path, stretched with `preserveAspectRatio="none"` and a non-scaling stroke) behind an "i" glyph and the label read bottom-up. The hover only slides it out 4 px (`transform`, through `hover-motion`); the notch does not deepen, because a `clip-path` or path change would repaint. It is not in the border pulse list. `data-pip-avoid` was left off: Pip only walks the bottom of the window and the zone looks for links inside it, not the zone itself.
- **The dialog** is `role="region"` with `tabIndex={0}` on its scrolling body (axe `scrollable-region-focusable`; the English text has no link to tab to). The README levels move one down (`##` → `h3`, `###` → `h4`), the dialog title is the `h2`. The table's first column is a row header; under 30 rem the rows stack. The scroll lock is `:root[data-details-open] { overflow: hidden; scrollbar-gutter: stable }` in `global.scss`, so a classic scrollbar does not shift the layout. `::backdrop` has a fallback hue, since older engines do not inherit custom properties into it. The close fade is held with `forwards` until `close()` hides the dialog in the same frame. A modified click (Ctrl, Cmd, Shift, Alt, middle button) and an engine without `HTMLDialogElement` follow the link.
- **No spinner.** The shell chunk cannot show a spinner before it has loaded, and the text chunks are 2–3 KB, so while a language loads the body says "Loading…" / "Завантаження…" after 150 ms with `aria-busy`. A chunk that fails to load shows a link to the README.
- **WebKit** does not focus a clicked button, so after a click on "УКР" focus stays where it was there; the keyboard path is unchanged. A hover and the press after it share one request for the language chunk (WebKit fetched it twice before).
- **Sleep behind the dialog: not built.** With the dialog open over the hero, idle frames are 16.7 ms with 1.0 style recalcs and 0 long tasks (`details-open-idle`), so the dialog adds no code to put the page to sleep (§3).
- **Landmark.** The flag sits in an `<aside aria-label="About this project">`, so no content is outside a landmark (axe `region`, which the smoke test runs on every profile).

**P4 after (2026-10-16, same machine):**

| What                              | Limit          | Measured                                                    |
| --------------------------------- | -------------- | ----------------------------------------------------------- |
| Main JS                           | +0.4 KB gz     | **104.60 KB, +0.73** (over)                                 |
| Main CSS                          | +0.4 KB gz     | 26.78 KB, +0.32                                             |
| Dialog chunk                      | ≤ 2.0 + 1.0 KB | **2.08 + 1.60 KB** (over)                                   |
| Text chunks                       | ≤ 3.5 KB each  | English 2.18 KB, Ukrainian 2.98 KB                          |
| Layers at the hero, at rest       | +0             | **+1**: the flag (fixed, above moving layers, so promoted)  |
| Idle, scroll, finish pick (probe) | no worse       | idle 16.7 ms and 1.0–1.1 recalcs everywhere, scroll 18.7 ms |
| Dialog open                       | measured       | one 73 ms task on the first open (chunk, tree, `showModal`) |
| Dialog open, idle                 | measured       | 16.7 ms, 1.0 recalcs, 0 long tasks                          |

- **Main JS** is +0.73 KB against +0.4. A build without the tab and the footer link is 103.86 KB, so the whole cost is the flag, the link, the store, the slot and the lazy import. Moving the dialog's strings (both languages) out of `copy.ts` took it down from +0.98; what is left is code.
- **The layer.** Measured in one page, with the flag shown and then `display: none`: one drawing layer, `a.project-details-tab`, in each of three snapshots. It has no `will-change`; Chromium promotes it because it is fixed above composited, moving layers. Avoiding it would mean not overlapping them.
- **`npm run test:perf`** is red, as it was at the start of plan 9: the layer check (desktop 50–56 against 48, Pixel 7 43–49 against 40 in four runs back to back) and once in two runs the pointer sweep (p95 33 ms against 25). The layer counts move by up to 8 between consecutive runs, so the suite cannot show the flag's +1; the A/B above does. No P0 `test:perf` run was taken before the change.
- **E2e:** `npm run test:e2e` green apart from the smoke `region` check (fixed with the `<aside>`, then green on all five profiles) and one Firefox run of "without JavaScript Back to top is a plain jump" (scrollY 126 instead of 0) that passes three times in a row alone and passes with and without the new links stripped from the HTML; it failed while running in parallel with another test.
