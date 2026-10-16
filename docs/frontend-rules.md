# Frontend rules

A rulebook for frontend code, not a plan: nothing here is built, and it has no number because it does not override or follow any plan. It is written to be stack-neutral — React or Vue, Next or Nuxt, JavaScript or TypeScript — and to be lifted into another project as is. It is also the source of the `/front-rules` command (see "Using it as a command" at the end).

**Project rules win.** Where a project's own `CLAUDE.md`, README, lint config or plans say something different (here: the plan 6 animation rulebook, the 150-line component limit, BEM through `config/bemClassName.ts`), the project rule wins and this file only fills the gaps.

The file has three parts:

1. **How the code should read** — naming, the "senior, not clever" middle, structure, framework habits.
2. **Mistakes AI makes** — a catalogue with an ID per mistake, why it happens, and how to find it.
3. **The review** — the order the check runs in and the shape of its report.

---

## Part 1. How the code should read

The bar: a reviewer opening any file should think a careful senior developer wrote it by hand. That means two things at once — no tricks a teammate has to decode, and no beginner padding a teammate has to scroll past.

### 1.1 Names

| Rule | Bad | Good |
| --- | --- | --- |
| A name says what the value **is** in the domain, not its type or its role in the code | `data`, `item`, `obj`, `res`, `val`, `temp`, `list2` | `orders`, `selectedPlan`, `priceResponse` |
| One-letter names only where the letter is the convention | `const u = users.find(...)`, `(a, b) => a.p - b.p` | `i` / `j` in a short index loop, `x` / `y` for coordinates, `t` for 0–1 progress, `_` for an unused argument |
| Booleans read as a yes/no question | `open`, `loading2`, `flag`, `check` | `isOpen`, `hasError`, `canSubmit`, `shouldAnimate` |
| Functions start with a verb; getters that compute say so | `userData()`, `priceFn` | `fetchUser()`, `formatPrice()`, `getVisibleRows()` |
| Units are in the name when the type cannot carry them | `delay = 300`, `size = 14` | `delayMs`, `fontSizePx`, `angleDeg` |
| Event handlers: `handleX` inside the component, `onX` for the prop / emit | `clickFn`, `doSubmit`, `onClickHandler` | `handleSubmit` passed as `onSubmit` (React) / `emit('submit')` (Vue) |
| One word per concept across the codebase | `user` / `customer` / `client` for the same thing | pick one, use it in types, variables, files and copy |
| No abbreviations a newcomer has to guess | `btnCfg`, `usrLst`, `calcTtl` | `buttonConfig`, `users`, `calculateTotal`; `id`, `url`, `api`, `props`, `ref` are fine |
| No suffix soup | `UserDataManagerService`, `handleClickHandler`, `IUserInterface` | `UserRepository` if it is one; plain `User` for a type |
| No version / copy numbers | `Button2`, `useFetchNew`, `handleChangeOld` | the old one is deleted or the new one is named for what differs |
| Files and folders follow the project's casing, one convention | `userCard.tsx` next to `Order-List.vue` | whatever the project already uses, everywhere |

A name that needs a comment to explain it is the wrong name.

### 1.2 The middle: senior, not clever, not junior

Modern syntax is welcome when it removes noise; it is not welcome when the reader has to run it in their head. Every row below has a "too clever" side and a "too junior" side; the target is the middle column.

| Topic | Too clever (hard to read) | Senior (target) | Too junior (noise) |
| --- | --- | --- | --- |
| Conditionals | nested ternaries; `a && b \|\| c` as control flow | early return; one ternary for one choice; a lookup object for many | `if (x === true)`, `else` after `return`, five-level `if` pyramids |
| Collections | a `reduce` that builds three things; chained `.flatMap().reduce().sort()` in one line | `map` / `filter` for one step each; a plain `for…of` when there are side effects or several outputs | `for (let i = 0; i < arr.length; i++)` with `arr[i]` everywhere; pushing into an outer array inside `map` |
| Null handling | `x!.y!.z`, `as unknown as T`, `?.` on values that cannot be null | one guard at the boundary, then trusted types inside; `??` for real defaults | `if (x !== null && x !== undefined && x !== '')` repeated in every function |
| Types (TS) | conditional / mapped / template-literal type puzzles in app code; generics with one use | named types and unions; discriminated unions for states; `satisfies` for config objects; generics only when two call sites need them | `any`; types copied by hand next to the real ones; interfaces for every tiny object |
| Enums & constants | bit flags, `enum` with computed members | string literal unions (`'idle' \| 'loading' \| 'error'`) or an `as const` object | magic strings repeated in five files |
| Functions | point-free composition, currying for one call site, IIFEs | small named functions with one job; an options object past three parameters | 200-line functions; boolean parameters that flip behaviour (`render(true, false)`) |
| Destructuring | three levels with renames and defaults in a parameter list | one level; rename only to avoid a clash | `props.user.address.city` written ten times |
| Async | promise chains mixed with `await`; `async` inside `forEach` | `async` / `await`; `Promise.all` for independent work; an `AbortController` when a request can go stale | `.then().then().catch()` nests; unawaited promises |
| Abstraction | a factory, a registry or a base class for one implementation | extract on the **second** real duplicate, not the first imagined one | the same 15 lines pasted in three components |
| Comments | none, and code too dense to follow | a short **why** where the code cannot say it (a browser bug, a business rule, a measured number) | a comment on every line saying what it does |

Rules that follow from the table:

- **Readability beats brevity.** If a one-liner and a four-liner do the same thing, the four-liner wins when it reads in one pass.
- **One idea per line, one job per function.** A function name with "And" in it is two functions.
- **Guard clauses, then the happy path** at the left margin.
- **No dense regex without a name** — put it in a constant whose name says what it matches.
- **Magic numbers get a name** (`const MAX_RETRIES = 3`), unless the meaning is obvious in place (`index + 1`, `/ 2`).

### 1.3 Structure

- **Follow the project's layout first.** Feature folders or type folders — use what is there; do not start a second convention.
- **Layers point one way.** Views → hooks / composables → services / stores → API client. A component does not call `fetch` with a hand-built URL if there is an API layer; the API layer does not import a component.
- **Components stay small.** Over ~150–200 lines (or the project's limit) the component is doing two jobs: split the view from the logic (a hook / composable) or split the view into parts.
- **Logic that is not UI is a plain function** in its own module, with a unit test. Pure functions do not live inside components.
- **Copy, config and constants live apart from components** (content files, i18n keys, a config module), so a text change does not touch logic.
- **Types live next to what they describe;** shared domain types in one place. API types come from the contract (OpenAPI / GraphQL codegen / a schema like Zod) where there is one, not typed by hand.
- **No junk drawers.** `utils.ts`, `helpers.ts`, `common/` grow forever. Name modules by subject: `formatPrice.ts`, `dateRange.ts`.
- **Barrel files (`index.ts`) only at a public boundary,** never re-exporting a whole tree (they hide cycles and hurt tree-shaking).
- **One component per file.** Small private sub-components may stay in the same file only if nothing else uses them.
- **Imports are sorted and use the project's aliases;** no `../../../../`.
- **State lives at the lowest level that needs it.** Global stores for truly global state only (session, theme, cart), not for a form field.

### 1.4 Framework habits

#### React

- **Effects synchronise with something outside React** (a subscription, the DOM, a timer, a non-React widget). Derived values are computed during render; a value copied from props into state is a bug waiting for a stale prop.
- **Dependency arrays are honest.** No `// eslint-disable-next-line react-hooks/exhaustive-deps`; if the effect re-runs too often, the design is wrong, not the linter.
- **Every subscription, listener and timer is cleaned up** in the effect's return.
- **Data fetching goes through the project's data layer** (TanStack Query, SWR, RTK Query, server components, loaders); a raw `fetch` in `useEffect` needs abort / race handling and loading / error states.
- **`useMemo` / `useCallback` / `memo` where they matter** (a measured slow render, a stable reference a child or an effect depends on), not on every line and not nowhere.
- **Keys are stable ids,** not array indices for lists that reorder, insert or delete.
- **No component defined inside another component** (it remounts every render).
- **Function components and hooks only;** no new class components.

#### Vue

- **`computed` for derived values, `watch` for side effects.** A `watch` that only sets another ref is a `computed`.
- **Do not lose reactivity:** do not destructure `reactive()` objects or `props` without `toRefs` / `toRef` (or Vue 3.5+ reactive props destructure, if the project uses it).
- **`ref` by default;** `reactive` only for objects that are never replaced.
- **Props and emits are declared and typed** (`defineProps<…>()`, `defineEmits<…>()`); a child never mutates a prop — it emits.
- **`v-for` always has `:key`;** `v-if` and `v-for` are never on the same element.
- **`<script setup>` and the Composition API** unless the project is on the Options API; never mixed in one component.
- **Composables are named `useX`,** return refs, and clean up in `onUnmounted` / `onScopeDispose`.

#### Next.js

- **Server components by default** (App Router); `'use client'` only on the leaves that need state, effects or browser APIs, not on a whole page.
- **Fetch on the server** when the data is needed for the first render; no client `useEffect` fetch for it.
- **Secrets never reach the client:** only `NEXT_PUBLIC_*` variables are allowed in client code, and nothing secret is ever `NEXT_PUBLIC_*`.
- **`next/image`, `next/link`, `next/font` and the Metadata API** instead of raw `<img>`, `<a>` for internal routes, font `<link>`s and hand-written `<head>`.
- **Router per project:** no `pages/` patterns (`getServerSideProps`, `next/router`) in an `app/` project and the other way round.
- **Server actions validate their input** like any public endpoint.

#### Nuxt

- **`useFetch` / `useAsyncData`** for data the page renders, not `$fetch` in `onMounted`; `$fetch` is for event handlers.
- **`useState` for state shared between server and client,** not a module-level `ref` (it leaks between requests on the server).
- **`runtimeConfig`:** secrets at the top level, only public values under `public`.
- **Auto-imports are used, not fought;** no manual imports of `ref` / `computed` where the project relies on auto-imports (or the reverse, if it turned them off).
- **Browser-only code** in `onMounted`, `<ClientOnly>`, or a `.client` plugin.

#### Any SSR (Next, Nuxt, Remix, Astro…)

- **No hydration mismatches.** `window`, `document`, `localStorage`, `Date.now()`, `new Date()` formatting, `Math.random()` and locale / time-zone dependent output are not used during the server render, or are made identical on both sides.
- **Valid HTML nesting** (no `<div>` inside `<p>`, no `<a>` in `<a>`): the browser rewrites it and hydration fails.

### 1.5 Markup, styles, accessibility, performance

- **Semantic HTML first:** `<button>` for actions, `<a href>` for navigation, headings in order, lists as lists, `<label>` tied to every input. A `div` with `onClick` is a bug.
- **Everything works with the keyboard;** focus is visible; images have `alt` (empty for decoration); icon-only buttons have an accessible name.
- **Motion respects `prefers-reduced-motion`;** colour contrast meets WCAG AA.
- **Styles use the project's tokens / variables,** not raw hex values and pixel sizes scattered through components; no `!important` except to beat third-party CSS, with a comment.
- **One styling approach per project** (CSS modules, Tailwind, styled-components, scoped styles) — do not add a second one.
- **Animations on `transform` / `opacity`;** nothing that animates layout properties per frame.
- **Imports are tree-shakable** (`import debounce from 'lodash/debounce'` or a native alternative, not the whole library); a new dependency is justified in the PR.
- **Images have dimensions and lazy-load below the fold;** fonts are subset and preloaded where they block.

### 1.6 Errors and edge cases

- **Every async UI has four states:** loading, error, empty, data. "Data" alone is a demo, not a feature.
- **Errors are handled where something can be done about them** (retry, message, fallback), and reported otherwise. `catch (e) { console.log(e) }` and an empty `catch` are both bugs.
- **Double submit, stale responses and unmounted components** are handled (disable while pending, abort or ignore stale results).
- **Validate at the boundary** (form input, API response, URL params) once, then trust the types inside.
- **User-facing text is not hardcoded** if the project has i18n or a content layer.

### 1.7 Comments and documentation

- **Comments say why, not what.** `// Safari 17 drops the first frame, so start one frame late` is useful; `// set loading to false` is noise.
- **No narration** (`// Now we…`, `// Step 1:`, `// Here we handle…`), no section banners, no emoji, no "This function…" JSDoc that repeats the signature.
- **No commented-out code** — git remembers it.
- **TODOs carry context** (what, why not now, a ticket if there is one), or they are not written.
- **README / docs change with the behaviour** they describe.

### 1.8 Tests

- **Test behaviour, not implementation:** what the user sees and does (Testing Library / Vue Test Utils queries by role and text), what a function returns.
- **Never mock the thing under test,** and never assert only that a mock was called.
- **A test must be able to fail:** break the code on purpose once and watch it go red.
- **No snapshot-only tests** of large trees; snapshots for small, stable output only.
- **Test names are sentences** about behaviour: `shows an error when the card is declined`.

---

## Part 2. Mistakes AI makes

These are the failure patterns reported for AI-written code, collected from public research and reviews and from experience. Each has an ID so a review can cite it. Background numbers:

- **Hallucinated packages:** a study of 16 code models found about 440 000 of 2.23 million samples imported packages that do not exist, and many of the invented names repeat across runs — attackers register them ("slopsquatting").
- **Duplication and churn:** GitClear's analysis of hundreds of millions of changed lines links AI assistants to more copy-pasted code, less moved (refactored, reused) code, and more code rewritten within two weeks.
- **Security:** Veracode's GenAI code security reports found insecure choices in about 45 % of tasks, and cross-site scripting defended in only about 12–15 % of cases.
- **React specifics:** reviews of AI-written React code keep finding the same things — `useEffect` for derived state or "just in case", invented API fields, non-null assertions, missing accessibility, extra re-renders, and tests that mock the hard part.

| ID | Mistake | Why AI does it | How to find it | Fix |
| --- | --- | --- | --- | --- |
| **AI-01** | **Hallucinated packages, APIs and options** — imports a package that does not exist, a hook / prop / config option the installed version does not have | Predicts plausible names | Every import resolves to `package.json` or a local file; new deps exist on the registry and are maintained; framework APIs match the **installed** version's docs | Use the real API or remove; never `npm install` a name you have not checked |
| **AI-02** | **Invented data fields** — reads `user.fullName` when the API sends `name`; types written by hand to match the guess | Infers shapes from context, not the contract | Compare types against the API schema / real responses; look for hand-written API types next to generated ones | Types from the contract (codegen, Zod); one source of truth |
| **AI-03** | **Duplicates what exists** — a new `formatDate`, `useDebounce`, `Button` beside the project's own | Does not search the codebase before writing | For each new helper / hook / component, search for the same verb + noun and the same logic | Reuse; if the existing one is wrong, fix it in place |
| **AI-04** | **Over-engineering** — factories, base classes, generic config, adapters, "extensible" options for one use; wrapper components that only forward props | Pattern-matches "good architecture" | Abstractions with one implementation or one call site; props passed through unchanged; files under 20 lines that only re-export | Inline it; extract on the second real need |
| **AI-05** | **Defensive overkill** — null checks on values that cannot be null, `?.` chains everywhere, `try/catch` around code that cannot throw, fallback values that hide bugs (`?? []` on required data) | Optimises for "never crashes" over "correct" | `?.` on non-optional types; `try` blocks without a real failure mode; `|| 0`, `?? ''` on required fields | Guard once at the boundary; let real bugs surface |
| **AI-06** | **Type escapes** — `any`, `as X`, `as unknown as X`, `!`, `@ts-ignore`, `@ts-expect-error` without reason, `eslint-disable` | Fastest way to make errors go away | Grep for them (Part 3) | Fix the type; if an escape is truly needed, one line with a why-comment |
| **AI-07** | **Narrating comments and doc noise** — comments restating code, "Step 1", JSDoc repeating the signature, banners, emoji | Trained on tutorials | Comment-to-code ratio far above the rest of the project; comments that are English versions of the next line | Delete; keep only why-comments |
| **AI-08** | **Effect / watcher misuse** — `useEffect` / `watch` to derive state, effect chains that set state that triggers another effect, missing cleanup, fetch without abort, stale closures | Reaches for the most familiar hook | Effects whose only body is `setX(f(y))`; `watch` that only assigns a ref; `addEventListener` / `setInterval` without removal | Compute in render / `computed`; clean up; use the data layer |
| **AI-09** | **Outdated or mixed idioms** — class components, Options API in a Composition API project, `pages/` patterns in `app/`, Nuxt 2 / Vue 2 syntax, `React.FC` everywhere, deprecated lifecycles, `moment` | Training data is older than the project | Compare with the framework version in `package.json` and with neighbouring files | Use the project's current idiom |
| **AI-10** | **Breaks local conventions** — a different styling approach, state library, date library, folder layout, naming or error-handling style than the project uses | Writes "generic best practice", not this project's practice | Diff against two neighbouring files of the same kind | Match the neighbours |
| **AI-11** | **Security holes** — `dangerouslySetInnerHTML` / `v-html` / `innerHTML` with unsanitised data, secrets in client bundles (`NEXT_PUBLIC_` / `public` runtimeConfig), tokens in `localStorage`, `eval` / `new Function`, open redirects from query params, unvalidated server actions | Lacks the data-flow context to see untrusted input | Grep sinks (Part 3) and trace each one back to its source | Sanitise (DOMPurify) or render as text; keep secrets server-side; validate inputs |
| **AI-12** | **Accessibility left out** — clickable `div`s, inputs without labels, images without `alt`, icon buttons without names, no focus styles, no reduced-motion path | Visual output looks done | Grep `onClick` / `@click` on non-interactive elements; axe / Lighthouse run | Semantic elements, labels, alt text, focus styles |
| **AI-13** | **Hydration-unsafe code** in SSR apps — browser APIs, dates, random values during server render; invalid nesting | Writes client-only code by default | Grep `window`, `document`, `localStorage`, `Math.random`, `new Date` in component bodies of SSR pages | Move to mount hooks / client-only boundaries; share values through state |
| **AI-14** | **Fake tests** — mock the unit under test, assert the mock was called, snapshot everything, tests that cannot fail, happy path only | Optimises for green | Tests whose `vi.mock` / `jest.mock` target is the module being tested; tests without a meaningful assertion | Test behaviour through the public surface; add a failing case |
| **AI-15** | **Leftovers** — `console.log`, unused imports / variables / exports / params, commented-out code, placeholder data ("John Doe", `example.com`), empty handlers, `TODO: implement` | Generates scaffolding and forgets it | Lint (`no-unused-vars`, `no-console`), `knip` / `ts-prune` for unused exports, grep | Delete |
| **AI-16** | **Happy path only** — no loading / error / empty states, no double-submit guard, no stale-response handling, no offline / slow network thinking | Prompt described the success case | For each async UI, look for all four states | Add the states |
| **AI-17** | **Magic values** — raw numbers, colours, breakpoints, durations, strings inline | Copies values from the prompt or the design straight in | Hex colours and px values in components; repeated literals | Tokens, named constants, content files |
| **AI-18** | **Generic or robotic names** — `data`, `result`, `item`, `handleClick2`, `processData`, `Manager` / `Helper` / `Util` suffixes, overly long descriptive names (`handleUserProfileFormSubmitButtonClick`) | Avoids committing to a domain meaning | Read the names alone: can you tell what the module does? | Domain names (§1.1) |
| **AI-19** | **God files** — one component that fetches, transforms, validates and renders; 300+ line files; deeply nested JSX / templates | Keeps adding to the file it is in | File length and nesting depth | Split view / logic / pure functions (§1.3) |
| **AI-20** | **Scope creep and drive-by edits** — reformatting, renaming or "improving" files unrelated to the task; changing public APIs on the way | Tries to be helpful | `git diff --stat` shows files the task did not need | Revert unrelated changes |
| **AI-21** | **Performance blind spots** — memo on everything or nowhere, new object / array / function literals in dependency lists, index keys, whole-library imports, unoptimised images, layout animations | Does not measure | Grep `import _ from 'lodash'`, `key={index}`; bundle analyser | Measure, then fix the one that matters |
| **AI-22** | **Floating promises and async mistakes** — `async` callbacks in `forEach`, unawaited calls, `await` in loops that could run in parallel, races between requests | Treats `async` as decoration | Lint `@typescript-eslint/no-floating-promises`; grep `forEach(async` | `for…of` with `await`, or `Promise.all`; abort stale work |
| **AI-23** | **Confident but unverified "done"** — claims it builds and tests pass without running them; says an API exists without checking | Writing the claim is cheaper than checking it | Run lint, typecheck, tests and build yourself | Report only what was run, with the output |

**Calibrating.** None of these signals proves anything alone — clean code is not evidence of AI, and humans write every one of these mistakes too. The review looks for the mistake, not the author: a finding is reported because it makes the code worse, never because it "looks AI".

---

## Part 3. The review

What the check does, in order. It only reads and reports; it changes code only when asked afterwards.

### 3.1 Setup

1. **Read the project's own rules first:** `CLAUDE.md`, `AGENTS.md`, `README`, `CONTRIBUTING`, `docs/`, the lint / prettier / tsconfig settings. Where they disagree with this file, they win.
2. **Detect the stack** from `package.json`: React or Vue; Next, Nuxt, Vite, Remix or Astro; TypeScript or JavaScript; the styling approach; the test runner; the data layer. Only the matching sections of §1.4 apply.
3. **Pick the scope:**
   - default — the files changed against the main branch plus uncommitted changes;
   - a path — that folder or file;
   - `all` — the whole `src/` (or the project's source root).

### 3.2 Automated pass

Run what the project already has, read-only, and record the output (do not fix yet): lint, typecheck (`tsc --noEmit` / `vue-tsc --noEmit` / `nuxi typecheck`), unit tests, build. If a command does not exist, say so; do not invent one.

### 3.3 Sweep

Searches that point at likely problems. Each hit is a lead to read, not a finding by itself. Adjust the globs to the source root (`src/`, `app/`, `components/`, `pages/`…).

| Looks for | Pattern (ripgrep) |
| --- | --- |
| AI-06 type escapes | `:\s*any\b`, `as any`, `as unknown as`, `@ts-ignore`, `@ts-nocheck`, `@ts-expect-error`, `eslint-disable`, `\w!\.` and `\w!\)` (non-null assertions) |
| AI-15 leftovers | `console\.(log\|debug\|info)`, `debugger`, `TODO\|FIXME\|XXX\|HACK`, `John Doe\|Lorem ipsum\|example\.com\|foo\|bar\b` in non-test code, commented-out code `^\s*//\s*(const\|let\|return\|import\|if\|<)` |
| AI-07 narration | `//\s*(Step \d\|Now we\|Here we\|This function\|First,\|Finally,)`, emoji in comments |
| AI-08 effects | `useEffect\(` (then read each: does it only derive state?), `watch\(` / `watchEffect\(`, `addEventListener\|setInterval\|setTimeout` (then check for cleanup) |
| AI-11 security | `dangerouslySetInnerHTML`, `v-html`, `innerHTML\s*=`, `eval\(`, `new Function\(`, `localStorage\.(set\|get)Item\(.*(token\|jwt\|auth)`, `NEXT_PUBLIC_.*(SECRET\|KEY\|TOKEN)`, `window\.location\s*=.*(query\|params\|search)` |
| AI-12 accessibility | `<div[^>]*(onClick\|@click)`, `<span[^>]*(onClick\|@click)`, `<img(?![^>]*\balt=)`, `<button[^>]*>\s*<(svg\|Icon)` without `aria-label` |
| AI-13 hydration | `window\.\|document\.\|localStorage\|sessionStorage\|Math\.random\|Date\.now\|new Date\(` in component files, outside mount hooks / effects |
| AI-17 magic values | `#[0-9a-fA-F]{3,8}\b` and `\d+px` in component / style files outside the tokens file, `!important` |
| AI-18 names | `\b(const\|let\|var)\s+(data\|result\|res\|temp\|tmp\|item\|obj\|val\|arr)\d*\b`, `\w+(2\|New\|Old)\s*[=(]`, files named `utils\|helpers\|common` |
| AI-21 performance | `key=\{(index\|i\|idx)\}`, `:key="(index\|i)"`, `from 'lodash'$`, `import \* as` |
| AI-22 async | `forEach\(async`, `\.then\(.*\.then\(` |
| AI-09 idioms | `extends (React\.)?Component`, `React\.FC`, `export default \{` with `data\(\)` in a Composition API project, `getServerSideProps\|getStaticProps` in an `app/` project, `from 'moment'` |
| AI-19 size | files over the project limit (default 200 lines for components, 300 for modules) |

### 3.4 Read

For each file in scope, read it whole and go through:

1. **Names** (§1.1) — could a newcomer tell what each thing is from its name alone?
2. **Readability** (§1.2) — anything too clever to read in one pass? Anything junior that adds noise?
3. **Structure** (§1.3) — is the file in the right layer and folder, one job, under the size limit? Does it reuse what the project already has (AI-03)?
4. **Framework habits** (§1.4) for the detected stack.
5. **Markup, a11y, performance** (§1.5) and **edge cases** (§1.6).
6. **Comments** (§1.7) and **tests** (§1.8) for the code it touches.
7. **The AI catalogue** (Part 2) — every ID once, against this file.
8. **Verify imports and APIs** (AI-01, AI-02) — every new import resolves; every framework API exists in the installed version; every data field exists in the contract.

### 3.5 Report

- **Lead with a short verdict:** how many findings by severity, and the two or three that matter most.
- **One row per finding,** most severe first:

  | Severity | Rule | Where | What is wrong | Fix |
  | --- | --- | --- | --- | --- |
  | must | AI-11 | `src/components/Comment.tsx:42` | `dangerouslySetInnerHTML` with `comment.body` from the API, unsanitised | render as text, or sanitise with DOMPurify |

  - **must** — a bug, a security hole, an accessibility barrier, a broken project rule;
  - **should** — makes the code harder to read or change (naming, structure, duplication, over-engineering);
  - **nit** — style, worth fixing on the way.
- **Group repeated findings** ("`any` in 14 places, list below") instead of 14 rows.
- **Cite the automated pass** as it ran: which commands, pass or fail, with the relevant output.
- **No false certainty:** a lead from the sweep that turned out fine is not reported; a finding that is only likely is marked as such.
- **Do not edit.** End by offering to fix the `must` items, or all of them, when asked.

---

## Using it as a command

The same rules are installed as a personal Claude Code skill, so `/front-rules` works in any project on this machine:

```
~/.claude/skills/front-rules/
├── SKILL.md   # the command: arguments and the review steps (Part 3)
└── rules.md   # a copy of this file
```

- `/front-rules` — reviews the changed files against the main branch.
- `/front-rules src/features/checkout` — reviews a path.
- `/front-rules all` — reviews the whole source root.

To move the rules into another project instead, copy the folder to that project's `.claude/skills/front-rules/` (it then travels with the repo). When this file changes, copy it over `rules.md` again — the skill reads `rules.md`, not this file.

### Sources

- Evil Martians, "10 anti-AI slop moves for frontend projects" — invented API fields, non-null assertions, layer boundaries: https://evilmartians.com/chronicles/ten-anti-ai-slop-moves-for-frontend-projects-going-faster-than-humans-can-review
- "React Doctor 2026 — static analysis for AI-generated React code": https://braindetox.kr/en/posts/react_doctor_ai_code_analysis_2026.html
- "How to vibe-check an AI-generated React Native codebase" — reinvented helpers, mocked tests: https://dev.to/russel_melroydsouza_afb/how-to-vibe-check-an-ai-generated-react-native-codebase-before-you-ship-1j53
- "We Have a Package for You! A Comprehensive Analysis of Package Hallucinations by Code Generating LLMs": https://arxiv.org/html/2406.10279v3
- CACM, "Nonsense and malicious packages: LLM hallucinations in code generation": https://cacm.acm.org/news/nonsense-and-malicious-packages-llm-hallucinations-in-code-generation
- GitClear AI code quality research, summarised: https://arc.dev/developer-blog/impact-of-ai-on-code/ and https://blog.robbowley.net/2025/02/17/gitclears-latest-report-indicates-genai-is-having-a-negative-impact-on-code-quality/
- Veracode GenAI code security research: https://sdtimes.com/security/ai-generated-code-poses-major-security-risks-in-nearly-half-of-all-development-tasks-veracode-research-reveals/ and https://www.veracode.com/wp-content/uploads/2026-GenAI-Report-Infographic.pdf
- Nuxt, "Nuxt and hydration": https://nuxt.com/docs/guide/best-practices/hydration
- "Thank you for explaining setLoading(false) to me" — narrating comments: https://levelup.gitconnected.com/thank-you-for-explaining-setloading-false-to-me-38bcb75839f4
