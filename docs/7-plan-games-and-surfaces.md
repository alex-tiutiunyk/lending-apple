# Plan 7: games and surfaces

Builds on `0-plan-landing.md` … `6-plan-animation-performance.md`. Where this plan conflicts with an earlier one, this plan wins (plan-order note in plan 0). Everything not mentioned here keeps the earlier rules: no animation library, one rAF loop (`frameLoop.ts`) that reads before it writes and sleeps when nothing moves, visible without JS, all copy in `content/`, components under 150 lines, BEM class names, motion levels `full` / `calm` / `off` through the plan 3 mixins and hooks, lazy chunks for what most visits never see, and **the plan 6 rulebook (§2) for every new animation**: loops only on `transform` / `opacity` of HTML elements or root `<svg>`s, no filters on moving things, `will-change` only through `promote-while-awake`, ambient loops only under `when-awake`.

Goal: Pip gets a voice when it falls and a way to play with the text, the panel handle gets its own glyph back while the apple and the worm move to the brand mark, the finishes render becomes a tiny football pitch, the header gets a moving gradient, the footer text and the reserve bugs come alive, the phone screens show the visitor's real time and change their picture, the borders pulse like the footer edge, and two fixes (the Numbers label width, the empty panel on first open). Nothing here is built yet.

**Starts after plan 6.** Plan 7 begins only when plan 6 P8 is closed: README has the "Animation performance rules" section and the plan 6 budget numbers, `npm run test:perf` is green. The plan 6 numbers measured then (main bundle JS, CSS, chunks, layers, overdraw) are the baseline every limit in §17 is counted from; they are copied into §19 before G1 starts.

## 0. Overrides of plans 0 to 6

| Earlier rule                                                                                                                                                                 | Plan 7 change                                                                                                                                                  | Why                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Plan 5 §1: the panel handle shows the apple and the worm                                                                                                                     | The handle shows the accessibility glyph again (the HEAD `6673b5a` markup) with its own hover (§3)                                                             | asked for; the apple belongs to the logo                        |
| Plan 1 / `LivingMark`: a hover spins the mark 360°                                                                                                                           | A hover grows the mark and a worm chews a three-chomp bite out of it (§4); the spin is removed                                                                 | asked for                                                       |
| Plan 5 §11: a bird lives on the finishes render                                                                                                                              | The bird and its chunk are deleted; tiny Pips play football with the back logo (§5)                                                                            | asked for                                                       |
| Plan 0 / plan 1: the header bar is a flat `--color-bar` with no blur                                                                                                         | A layered gradient with slow waves (§6); still no blur                                                                                                         | the bar read as dull; plan 1's no-blur override stays           |
| Plan 6 rule 7: ambient loops run under a `[data-awake]` ancestor; the header root (only its progress tip has one), the panel, the sticky CTA and the motion toggle have none | Each of these hosts gets `useAwakeWhileInView` on itself (§6, §11), so its loops follow rule 7 like everything else; the header root's call replaces the tip's | no exception to the rulebook                                    |
| Plan 4 §1 / plan 5 §9: letters run only inside `<main>`; the footer is skipped through `data-pip-avoid`                                                                      | Footer paragraphs run too, on their own schedule (§7)                                                                                                          | asked for                                                       |
| Plan 4 §1: every runaway letter has the same `em`-sized legs                                                                                                                 | Heading letters get legs 1.5 times smaller (§7.1)                                                                                                              | asked for                                                       |
| Plan 5 §6: each rig has a dry landing line; plan 1: `trip` says a dry line (`mascotCopy.trip`)                                                                               | Falls and landings speak joyful exclamations (§1); the rig lines become the second line of the bubble; `mascotCopy.trip` is removed                            | asked for                                                       |
| Plan 4 / `EmailBugs`: six bugs, three hidden at rest, they only twitch, rendered at `full` only                                                                              | Nine bugs, all visible at rest, wandering; focus still scatters them; still `full` only (§8)                                                                   | asked for                                                       |
| Plan 0 / `lockScreenCopy`: date and time are fixed strings                                                                                                                   | Every phone shows the visitor's live local date and time; the strings stay as the prerender fallback (§10)                                                     | asked for                                                       |
| Plan 0 / Reserve: the front render shows the still lock screen                                                                                                               | Its wallpaper changes every few seconds (§9)                                                                                                                   | asked for                                                       |
| Plan 0 / Numbers: `.label` has `max-width: 16rem`                                                                                                                            | Removed (§13)                                                                                                                                                  | asked for                                                       |
| Plan 3: the panel body is lazy with `fallback={null}`                                                                                                                        | The body chunk is preloaded on idle and the fallback is a themed spinner (§14)                                                                                 | the first open showed only the heading                          |
| Plan 6 §14 budget                                                                                                                                                            | Plan 7 may add at most **+2.5 KB gz** to the main bundle, JS and CSS together (§17); the rest is lazy                                                          | the main bundle is still over target                            |
| Plan 3 §5a: every colour exists in four token sets                                                                                                                           | Unchanged, and it applies to every new colour (header stops, mini Pips, ball, pulse light, wallpapers)                                                         | the light theme and high contrast are not forgotten per feature |

## 1. Pip: joy when it falls

Today Pip falls in three places: the `trip` act (random, with a dry line from `mascotCopy.trip`), the descent after a drag (seven rigs, `land` with `mascotCopy.landed[rig]`), and the airplane combo. None of them sounds happy. From now a fall is the best thing that can happen to Pip.

**Behaviour.**

- **During the fall**: the bubble shows a short exclamation from `mascotCopy.falling` ("Wheee!", "Wooo!", "Yippee!", "Here I goooo!"), the face goes `wide`. The bubble follows Pip down (it is a child of the figure box already). Where it shows:
  - the drag descent, from the first `fall` phase to the landing (the `flip` and `pop` phases of some rigs keep the same line);
  - `trip`: the first 45 % of the act (the stumble), then the joy line below;
  - the airplane combo: no change, it keeps `mascotCopy.combos.airplane`, since its fall is the joke of the combo.
- **On landing** (`land` act, and the last 55 % of `trip`): a delighted line from `mascotCopy.joy` ("Wow!", "So cool!", "Again! Again!", "Best. Fall. Ever.", "Did you see that?!", "10 out of 10.", "My heart! Again!"), face `talk`, then a little hop (`translate` −6 px, 220 ms, on the `.figure` box, never on the root, which `writePipPosition` owns) and the arms up (`armActs` gets `land`). Where a rig line exists it follows as a second, smaller line in the same bubble ("Wow! · Geronimo."), so the rig jokes survive; without the rigs chunk (offline) the joy line comes alone.
- `mascotCopy.trip` (the dry lines) is removed; a hint from `lineForRandomAct` still replaces the trip's joy line when one is due, as it replaces any random act's line today.
- Lines are drawn from a bag without replacement (the `createRigBag` pattern), so the same "Wow!" does not come twice in a row.
- The live region gets the landing line only (the plan 5 rule); the falling exclamation is `aria-hidden` like every other bubble line.

**How.**

- A new act `fall` (a `DragAct` next to `carried` and `land`, face `wide`, no fixed duration; `actDurationMs` gets it as `Infinity`, the descent ends it). The drag controller calls `startAct('fall', falling line)` once, on the first frame of the descent whose phase is not `open` (`fall`, `flip`, `pop` or `landed`). Not "on the change to `fall`": the umbrella sets `flip` inside its profile before the `open → fall` check (`mascotDescent.ts`), so a low release goes `open → flip` and never passes `fall`, and a short drop can go straight to `landed`. If the first such frame is already `landed`, no falling line is shown and the landing line comes alone. The act stays through `flip` and `pop`. Without the rigs chunk (offline) there is no descent and no falling line. The `drag` hold is still on during the descent, so the brain does nothing else with Pip; `land` replaces `fall` as today it replaces `carried`. One React commit per descent, none per frame.
- `land`: `lineFor('land')` keeps returning null (the drag passes the line); the drag controller passes `${joy} · ${landed[rig]}` or `joy` alone.
- `trip`: the act gets two lines. `startAct('trip')` shows the falling line; a timer in the brain at 45 % of `actDurationMs.trip` swaps the bubble to the joy line (one commit) and sets `pokeReply`, so the live region gets the joy line only. `lineFor('trip')` draws from the falling bag instead of `mascotCopy.trip`.
- Bags: `createLineBag(lines, random)` in the Pip chunk (`mascotLines.ts`), the same no-repeat rule as `createRigBag`, which stays in the rigs chunk.
- Copy in `src/content/copy.ts` (`mascotCopy.falling`, `mascotCopy.joy`).
- Size: `useMascotBrain.ts` is at 189 lines and `mascotDragController.ts` at 160 already; the trip line swap goes into a small helper (`mascotTripLines.ts`) and the falling / landing line choice into `mascotLines.ts`, so neither file grows by more than a few lines.

**Motion levels.** Pip exists only with ambient motion (`full`), so nothing new for `calm` / `off`.

## 2. Pip: shoot the letters

A new random act, **`throw`**: Pip pulls a slingshot (or, one in three, blows a pea shooter), aims at a letter in the text above, fires; the projectile flies in an arc, hits the letter, the letter pops out of its word, runs around for a moment like a runaway letter and goes home. Pip cheers or, on a miss, shrugs.

**Behaviour.**

1. Pip stops and turns towards the target, takes the slingshot out (`MascotProps` gets `slingshot` and `peashooter`), pulls back (400 ms, face `squint`).
2. Fire: a small projectile (a pebble 4 px, or a pea in `--color-accent`) leaves the sling and flies a parabola to the letter (550–800 ms, distance-scaled).
3. Hit: the letter jumps out of the word (bigger lift than a normal escape: 24–40 px with a spin), runs 1.5–3 s on the `paragraphRun` / `headingRun` ranges, looks around, returns. The projectile bounces off and fades.
4. One throw in four misses on purpose: the pebble lands next to the word, the letter only flinches (a 2 px shake), Pip says a `missed` line.
5. Pip says a line from `mascotCopy.throw` before ("Ready… aim…") and `mascotCopy.hit` after ("Bullseye!", "Got one!").

**Who picks the letter.** The letter code knows which blocks can run; Pip knows where it stands. A new request channel `letterRequests` (`src/hooks/letterRequests.ts`, the `createRequestChannel` pattern of `mascotRequests`) carries two requests:

- `aim { fromX, fromY, reply }`: sent by Pip when the `throw` act starts. The runaway hook picks a spot with the existing rules (`letterSpots`, `skipBlocksInside`, one gag per section, plan 6 §11.1 one heading at a time), prefers blocks in the lower 70 % of the viewport within 900 px horizontally of Pip, and calls `reply({ x, y, spotId })` with the glyph's centre from its `Range`; or `reply(null)` when nothing fits, and Pip plays `missed` without a target.
- `hit { spotId, missed }`: sent by Pip when the projectile arrives. The hook starts `createEscape({ kind: 'hit', spots: [spot], … })`; the `hit` kind uses a new `hitRun` plan (lift with spin, then the normal run phases). A miss starts nothing.

The request channel today is one-way (`request` returns whether a listener took it), so `aim` carries its own `reply` callback; Pip checks `letterRequests.hasListeners` before it draws `throw` and gives up (plays `missed` without a target) if no reply came within 300 ms.

Spots are kept in a small map inside the hook (id → `LetterSpot`), dropped after 3 s. If the text scrolled or the block left the viewport before the hit, the hook drops the request.

**The `hit` kind in the scheduler.** `useRunawayLetters` treats `hit` as its own kind, not as a paragraph:

- `end()` reschedules the paragraph timer only for `paragraph` escapes; a `hit` ending touches no timer (today every non-heading end calls `scheduleParagraph`, which would reset the paragraph rhythm after each throw).
- A `hit` does not count towards `paragraphEscapes`, so it never starts Pip's chase.
- For the one-gag-per-section rule a `hit` blocks both a paragraph and a heading escape in its section (`busySections` gets the kinds it blocks as a list), and `aim` skips sections where any escape is out.

**Projectile.** Drawn in the mascot overlay (fixed, `aria-hidden`, `pointer-events: none`), moved by `translate` on a `subscribeTick` listener that unsubscribes when it fades (rule 9). The target point is read once at aim time, not per frame.

**Conditions.** Only when the runaway letters chunk is loaded (ambient, Highlight API, no high contrast, no readable font); otherwise `throw` is never drawn from `randomActs`. At most one throw per 25 s; not while a chase runs. Pip in the footer avoid zone does not throw.

**Files.** `useMascotThrow.ts` (aim, fire, tick) in the Pip chunk, `ThrowProjectile.tsx` (≈ 20 lines), props art in `MascotProps.tsx`, `hitRun` in `letterRun.ts`, request handling in `letterRequestsHandler.ts`. `useRunawayLetters.ts` is at 137 lines already, and §2 and §7 both add to it, so the scheduling moves out first: the paragraph and heading timers go to `escapeSchedule.ts` (the footer schedule of §7 joins them there), and the hook keeps the wiring. `throw` joins `randomActs`, and `nextRandomAct` takes the list of acts allowed right now, so `throw` is drawn only when the conditions above hold. The throw sequence itself lives in `useMascotThrow.ts`, not in `useMascotBrain.ts` (already 189 lines): the brain only asks it whether a throw may start and hands it the act.

## 3. Panel handle: the accessibility glyph comes back, and it moves

The handle shows the person-in-circle glyph from HEAD again (`git show 6673b5a:src/components/A11yPanel/A11yPanel.tsx`): a circle r 10.5, a head dot, arms and legs as one path. `A11yHandleIcon.tsx` keeps its name and file but draws the glyph; the arms and legs become separate paths so they can move.

**Hover and `:focus-visible`** (≈ 700 ms, one-shot): the circle **draws itself** again (`stroke-dashoffset` 1 → 0 with `pathLength={1}`, 400 ms; a circle's stroke starts at 3 o'clock, so the circle carries `transform: rotate(-90deg)` with `transform-origin: center` to start at the top), at the same time the figure does a **star jump**: the arms swing up into a "V" (`rotate` around the shoulders, ±35°, 260 ms, `ease-out-back`), the legs open (±12°), the whole figure lifts 1 px and lands; the head dot bounces once. At the end the figure waves one arm (two 12° wags).

**Leave:** the arms and legs come back (200 ms, no overshoot), the circle stays.

**Open panel** (`data-state='open'`): the figure holds the "V" pose, so the handle reads as "on" (the role the worm had in plan 5).

**How.** CSS only, `hover-motion` for the moves, the pose state also at `off` as a snap. The parts are SVG children, so every move is a one-shot `transform` (never the `rotate` / `translate` properties, rule 4), and none of them loops. `transform-box: fill-box` and `transform-origin` at the shoulder and hip points. The plan 5 apple, bite and worm styles (`.apple`, `.bite`, `.worm`, `.worm-eyes`) leave `A11yPanel.module.scss` and move to the mark (§4). High contrast: `--color-text`; forced colours: `CanvasText`. The handle's spoken name "Accessibility settings" and the e2e "closed, only the handle shows" stay.

## 4. The brand mark: grow and bite

The header mark (`Header.tsx`, 1.4 rem) and the footer mark (`Footer.tsx`, 1.2 rem) are `LivingMark`s inside `[data-mark-host]`. Today a hover spins them once. From now:

**Hover and `:focus-visible` of the host** (≈ 1 s):

1. The apple grows (`scale` 1 → 1.35 in the header, 1 → 1.45 in the footer, 200 ms, `ease-out`), so the bite is visible at this size.
2. A worm pushes out of the right side of the body (three segments and two eyes, accent colour), and **bites** in three chomps (`steps(3, jump-end)`, 240 ms, the apple jolts 1 px on each chomp). The bite is the worm's own: three small overlapping circles (r 1.6–1.9) along the right edge around (20.6, 10.8) in the 24-unit space, one per chomp, so it reads as a ragged, chewed notch. It is **not** one clean round bite: a mark that reads as Apple's logo is a trademark problem, so the bitten mark must stay this page's apple.
3. The worm pulls back inside the apple (200 ms) and **the bite stays** while the pointer is on the mark.
4. The leaf swings once when the worm disappears.

**Leave:** the bite heals (300 ms, smooth), the apple scales back with a small overshoot (1.35 → 0.97 → 1, 300 ms).

**How.**

- The worm and the timings are the plan 5 §1 code (`A11yHandleIcon.tsx` today), moved to `src/assets/svg/apple-bite.tsx` (mask + worm group) and `apple-bite.module.scss`; the single bite circle becomes the three chomp circles above, each revealed on its step. `LivingMark` renders it inside its body piece: the body is one `<svg>` root (`Piece`) holding a fill group and a stroke group, and the `<mask>` wraps both groups. The leaf is the other root and is not masked. The mask id comes from `useId`, so the header and footer marks do not share ids.
- Where each motion sits (rule 4: a loop and a transition on a transform-family property never share an element): the root span (which also carries the `.mark` class from the header and footer stylesheets) keeps the scroll lean (`rotate` + its transition); the `.spin` span, free once the spin goes, is renamed `.grow` and takes the hover `scale` transition; the breathing loop stays on the body root inside it; the chomp circles and the worm are SVG children of the body root (one-shot `transform`s, not loops, so they are allowed).
- The worm sticks out past the mark: the mark and its host get `overflow: visible`; the header's home link keeps its tap box.
- `hover-motion` for the moves; at `off` the hover snaps to the bitten apple without a worm; the touch path: no hover state at all.
- The footer host is a `<p>` and never takes focus, so the footer mark answers hover only; the header host is the home link and answers hover and `:focus-visible`.
- The 360° spin keyframes and the `spin` hover rule are removed from `living-mark.module.scss`.
- The handle (§3) and the mark no longer share art: the handle draws the glyph, the bite lives only on the mark.
- Colours: worm `--color-accent` (dark, light), `--color-text` in both high-contrast sets; forced colours: no worm, no bite.

## 5. Finishes render: football with the logo

The camera bird leaves (`finishes-bird.tsx`, `CameraBird.tsx`, `CameraBird.module.scss`, `useBirdLife.ts`, `birdRun.ts`, `birdSchedule.ts`, their tests and e2e checks, the `lazy()` in `Finishes.tsx`). In its place four **mini Pips** in different colours live inside the render frame.

**Behaviour.**

- **Team.** Four mini Pips, each about 1.1 rem tall, one per finish (Tidewater, Ember, Moss, Basalt from `content/specs.ts`). There are no per-finish colour tokens (`--finish-shell` is computed from the current `--accent-h`), so each Pip box gets its finish's `--accent-h/s/l` as local custom properties through `optionStyle`-style inline style (set once, not per frame) and its shell reads the same `hsl()` as the swatch. Basalt is almost black and would vanish on the dark frame in every finish, so the Basalt Pip always gets a `--color-text` outline (1 px stroke on the body) in the dark themes. Two are a team, two run the perimeter.
- **Kick-off.** When the frame wakes up at `full`, the apple logo on the back of the phone (`back.mark` in `phone-geometry.ts`, 46 units) **pops out**: a copy of the logo shrinks to a ball (≈ 0.9 rem) and drops onto the frame floor, while the place on the back keeps a faint outline (opacity 0.25), the "goal".
- **The game.** The two players run to the ball and kick it (a kick: a 120 ms leg swing, the ball gets a velocity of 180–320 px/s at a random angle up to 50°). The ball rolls with friction (0.6 per second), bounces off the frame edges with 0.7 restitution and spins in the roll direction (`rotate` = distance / radius). Players run at 70–110 px/s, the closer one chases, the other drifts to a spot between the ball and the goal.
- **The perimeter.** The other two run laps along the frame's border, inside the rounded rectangle, one clockwise, one counter-clockwise, slower (40 px/s), and when they pass each other they high-five (a 200 ms arm up). When the ball rolls to the border near one of them, that one kicks it back into play.
- **Goal.** Every rally ends after 8–14 s of play (the header and the flight to the goal come after, ≈ 1.5 s): the nearest player heads the ball up onto the phone back; the ball flies an arc into the outline, grows back into the logo (`scale` 0.3 → 1, 260 ms) and the outline disappears. The four Pips jump twice (celebration) and sit down along the bottom edge. Rest for 6–10 s (the loop sleeps), then the next kick-off.
- **Finish change.** A finish pick or hover preview mid-rally recolours the logo and the ball (they read the local `--accent-*` from plan 5 §10); the game does not restart.
- **Pointer.** Clicking or tapping the ball kicks it away from the pointer (the frame keeps no other click target); the render keeps its accessible name and is not a button; the ball is `aria-hidden`.

**How.**

- Lazy chunk `finishes-team.tsx` (entry), `MiniPip.tsx`, `footballGame.ts` (pure state step: positions, velocities, kicks, perimeter routes, the goal; unit-tested), `useFootballGame.ts` (wiring to `subscribeTick`, reads the frame size from a `ResizeObserver`), `FinishesTeam.module.scss`.
- **Mini Pip is a small rig** (plan 6 §7), because its legs run for a whole rally, which is a loop: an HTML box (`.mini-pip`) with three `<svg>` roots in its own 24 × 36 space: body with face and arms, left leg, right leg. The run cycle (`mini-step`, 280 ms, infinite while `data-running`) is `transform: rotate()` on the two leg roots, `transform-origin` at the hip; the kick (120 ms), the high-five and the jumps are one-shots inside the body root. Pip's `MascotFigure` is a 48 × 88 rig with six roots built for one large figure, so it is not reused.
- **Per-frame writes** go in the write phase as one `transform` string per element (`translate(x, y)` for a Pip box, `translate(x, y) rotate(a)` for the ball), on HTML boxes: the ball is an HTML `.ball` box with the logo `<svg>` inside. No individual `translate` / `rotate` properties on SVG (rule 4).
- Coordinates: the game runs in the frame's CSS pixels; the logo position in the frame is measured once per layout from `back.mark` through the render's `viewBox` scale. A finish pick plays a tilt on the render (`tiltClassName`); the goal point is re-read when the tilt ends, and the ball's flight to the goal waits for it.
- The team is an HTML sibling of `PhoneRender` inside `.render-frame`, never a child of the `<svg>` (the bird was).
- The phone's logo is hidden by `opacity` while the ball is out (a `data-ball-out` attribute on the render frame); the outline is the same nested `<svg>` with `fill: none; stroke`.
- Rule 9: the tick listener runs only during a rally and the goal; during rest it unsubscribes and `data-running` comes off, so the leg loops stop too. Rule 6: the Pip boxes, the leg roots and the ball get `promote-while-awake(transform)`.
- Loaded after mount at `full` while the frame is `[data-awake]`; at `calm` and `off` and without JS: nothing, the logo stays on the phone. High contrast: not loaded.
- Copy: none visible. Size: `Finishes.tsx` drops the bird lines and gains the same lazy pattern, so it stays at ≈ 140 lines.

## 6. Header: a moving gradient

The bar is a flat `--color-bar` with a 1 px line. It becomes a slow, layered gradient with waves running through it.

**Look.** References checked: Stripe's WebGL mesh gradient (its `MiniGl` reconstructions, the Codrops "lava lamp" article), the CSS mesh-gradient libraries built on blurred blobs, and layered `background-position` meshes. WebGL is rejected (a GL context and a shader for a 60 px bar), the blurred blobs are rejected (plan 6 rule 5: no filters on moving things), so the bar uses **layered gradient strips with wave masks**, the technique the footer edge and the backdrop waves already use.

- Base: a linear gradient across the bar from the accent hue to its two neighbours, an "aurora" spread: `hsl(var(--accent-h) 45% 9%)` → `hsl(calc(var(--accent-h) + 40) 50% 11%)` → `hsl(calc(var(--accent-h) - 50) 45% 10%)` at 0 %, 55 %, 100 % in the dark theme, at 88 % opacity like today's bar; light theme: the same hues at 94–96 % lightness; high contrast: the flat bar as today, no waves.
- Three wave strips over it, each 200 % of the bar width, each a soft gradient of one hue at 12–20 % alpha, masked by a **filled** wave tile with different wavelengths (240, 360, 520 px) and amplitudes. The existing `wave-mask` mixin does not fit: its tile is three 1.2 px stroked lines in a 240 × 120 box, which would draw thin lines, not colour crests. A new mixin `crest-mask($width, $height)` in `_mixins.scss` takes a data-URI tile with one closed, filled wave (the area under the curve) and a soft edge (a vertical gradient mask on top, `mask-composite: intersect`). They translate horizontally by one tile width per loop (seamless, like `edge-travel`): 18 s left, 26 s right, 34 s left, linear, so the crests cross and the colour seems to flow.
- The bottom edge: today the 1 px border carries the plan 4 progress line (the accent line growing on a scroll timeline, with its tip). The §11 pulse runs on the same edge **under** the progress line: `.progress` keeps its z-order on top, and the pulse window is drawn in the border colour mixed with the accent at 60 %, so over the grown part of the progress line it is hidden and only the part of the border not yet covered pulses. The progress line, its tip and their timelines do not change.
- Because the stops read `--accent-h`, a finish change re-tints the bar with the page.

**How.**

- `Header.module.scss` `.root`: the base gradient as background; a new `aria-hidden` `<span class=header__waves>` with three child strips, `position: absolute; inset: 0; overflow: clip; contain: paint; pointer-events: none`, behind the content (`z-index: -1` inside the bar's stacking context, `isolation: isolate` on the root).
- Loops: `transform: translateX()` keyframes on HTML strips (rule 4), under `when-awake`: the header root gets `useAwakeWhileInView` (§0), so like every other ambient loop they run only at `full` and only while the header is on screen, which, sticky, is always while the page is visible. The strips get `promote-while-awake(transform)`: three bar-sized layers, 2× the viewport wide and 60 px tall. The hero is already over the plan 6 layer and overdraw targets (README: ≈ 44–51 layers against 40, overdraw ≈ 12 against 5, both held at their measured level), so these layers are not "inside the budget": they are paid for in §17 (layer budget). They are compositor animations, so they do not go on the perf allowlist (which lists only animations that fail to composite); the `@perf` allowlist test is what proves they composite.
- At `calm` and `off`: the base gradient and the strips stand still.
- Contrast: the nav text and the section label must keep 4.5:1 against the lightest and darkest point of the bar; `config/contrast.test.ts` samples the three stops plus the strongest wave overlay for every finish hue and every token set.

## 7. Footer: the letters run too

Today no footer text runs: `settledBlocks` searches only `main`, and the footer's `data-pip-avoid` is in `skipBlocksInside`.

- `settledBlocks` searches `main` and `footer` (today `document.querySelector('main') ?? document.body`; it becomes both roots, the main schedule passes `main` and the footer schedule passes `footer`). The skip selector stops using `[data-pip-avoid]` for letters (it stays for Pip and for `escapeChase`). The places that carry `data-pip-avoid` today, checked one by one: the footer (now wanted), `ReserveForm` (a `form`, still skipped by `form`), the panel root and `StickyCta` (outside `main` and `footer`, never searched). So no `data-letters="still"` is needed now; any new `data-pip-avoid` zone inside `main` must add it.
- Blocks that can run: the brand name, the legal line and the credit (`<p>`s). The brand `<p>` is also the mark's `data-mark-host`; the mark's `<span aria-hidden>` is skipped by `skipTextInside`, so only the name's letters run. The links (`a`, `nav`) and the actions stay skipped, as everywhere.
- Schedule: the footer is in view only at the end of the page, so it gets its own rhythm, in `escapeSchedule.ts` (§2). When the footer becomes visible (an `IntersectionObserver` on it), the first escape comes after 1.5 s, then every 5–8 s, 1–3 letters, while it stays in view; it stops when the footer leaves.
- A footer escape is its own kind, `footer`: its end reschedules only the footer timer (not the paragraph one), it does not count towards `paragraphEscapes`, so it never starts Pip's chase (Pip avoids the footer).
- One gag per section: `sectionOf` becomes `block.closest('section, footer')`, so the footer is its own section; today it would return `null` for every footer block.
- Pip's throw (§2) does not target the footer.

### 7.1 Heading letters: smaller legs

The legs are sized in `em` of the copied glyph (`.leg` in `RunawayLetters.module.scss`: height and drop 0.5 em, width 0.1 em, foot 0.3 em), so on a display heading they grow with the type and look heavy. Letters from headings get legs **1.5 times smaller**:

- `copyGlyph` sets `data-source="heading"` on the copy when the source block is an `h1`–`h3` (by the block, not by the escape kind, so a §2 `hit` on a heading letter gets the small legs too). `copyGlyph` gets only `{ range, rect }` today, so the runner passes the escape's block as a third argument.
- `.letter[data-source='heading'] .leg`: height and `bottom` 0.5 em → 0.333 em, width 0.1 em → 0.067 em, foot 0.3 em → 0.2 em; the `max(2px, …)` floors stay, so the legs never get thinner than 2 px. Through a `--leg-scale` local custom property on the copy (1 for paragraphs, 0.667 for headings), set once in the stylesheet, so the leg rule has one set of `calc()`s. Not a per-frame value (rule 1 does not apply).
- The walk (`leg-walk`, ±30°) and the timings stay; only the size changes. Paragraph letters keep today's legs.

## 8. Reserve field: more bugs, walking

`EmailBugs.tsx` renders six bugs; bugs 4–6 sit under the field at opacity 0, and at rest the bugs only twitch their legs.

- **Nine bugs**, all visible at rest, around the field edge (the `$spots` table grows to nine rest, away and error positions; the new ones on the top edge and the right end).
- **They walk.** Each bug has a wander loop: it walks a short route along the field border (20–60 px), stops, turns, cleans its antennae (the twitch), walks back. Routes and durations differ (9–15 s, delays spread), so the group never moves in step. Two bugs, once in a while, meet and touch antennae.
- **Focus** scatters them as today (`bug-flee`, 700 ms, to `--away`, fade out), from wherever they are on their route; blur with an empty field brings them back (`bug-return`) and the wander resumes.

**How.** Two elements per bug: the outer `.bug` keeps the rest / away / return / error transforms as today, the inner `.bug-walk` carries the wander keyframes (`translate` + `rotate`, HTML element, rule 4). In the `away` and `error` states the inner loop is paused (`animation-play-state: paused`), so the flee composes with the current wander offset and nothing jumps. Wander only under `when-awake` (the field area is awake while the reserve section is in view). At `calm` and `off` there are no bugs, as today: `EmailBugs` renders them only when `useAmbientMotion()` is true (`full`), and calm stops ambient motion. The DOM per bug becomes `.spot` (place) → `.bug` (rest / away / return / error) → `.bug-walk` (wander) → the shared `assets/svg/bug.tsx` rig, whose legs twitch as today.

## 9. Reserve render: the screen changes

The Reserve phone (`PhoneRender view="front"` in `Reserve.tsx`) shows the still lock screen. Its wallpaper now changes every 4 s with a cross-fade, while the clock and the date stay on top.

- Five wallpapers, vector, drawn in the screen's coordinate space and tinted by the local finish colours: an aurora gradient (the header's hues, §6), a sunrise over hills, a night sky with the moon, a close-up of the brand apple in glass, a macro of a titanium texture (the plan 5 scratch pattern).
- Cross-fade 600 ms, each picture zooms slowly (`scale` 1 → 1.06 over its 4 s), a Ken Burns feel.
- After a successful reservation (`data-reserved`), the cycle stops on a sixth wallpaper, "Reserved ✓" (the text from `reserveCopy.screenReserved` in `content/`).

**How.** Plan 6 rule 4 keeps loops on HTML elements or root `<svg>`s, and the screen lives inside the render's SVG, so the wallpapers are not drawn into it. `ReserveScreens.tsx` is an HTML stack laid over the screen area of the render. The render is centred in `.render-frame` at `width: min(100%, 14rem)`, so percentages of the frame would miss the screen: the render gets a wrapper `.render-box` (`position: relative`, the render's own size), and the stack is `position: absolute` in it, placed from the screen rect of `phone-geometry.ts` as percentages of the render's `viewBox` (no measuring), clipped by `clip-path: inset(0 round <screen radius>)`. The render draws the island, the earpiece and the glare over the screen (`phone-render.tsx`), and an HTML layer on top would cover them, so the stack's top layer is one root `<svg>` in the screen's coordinates that repeats the lock-screen text, the island and the glare. That copy reads the time and date from `useLocalClock()` like every other phone (§10). Each wallpaper is its own root `<svg>`; each of the five runs `screen-cycle` (20 s, `opacity` and `transform`) with `animation-delay: calc(var(--i) * 4s)`. The cycle is pure CSS; the only JS is the clock. Only under `when-awake` at `full`; at `calm` and `off` the first wallpaper is shown still. Size: inline in the main bundle is too much for six drawings, so `ReserveScreens` is a lazy chunk `reserve-screens.tsx` loaded after mount at `full`; until then the plain screen shows. Budget ≤ 2 KB gz (§17), so each drawing stays at a few paths and gradients; the titanium macro reuses the plan 5 scratch pattern instead of new geometry.

## 10. The visitor's time on every phone

Phones with a time or a date: the lock screen (`phone-lock-screen.tsx`, used by the LineDraw render and the Reserve render through `phone-render.tsx`, and by the exploded display layer `display-layer.tsx`), the text copy over the Reserve wallpapers (§9), and the hero boot screen (`HeroBoot.tsx`, which already shows the visitor's local time through `useMinuteClock()` and `Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', hourCycle: 'h23' })`).

- A new hook `useLocalClock()` built on `useMinuteClock()` returns `{ time, date } | null` in the visitor's own time zone (the browser default). The time is a 24-hour clock without a leading zero on the hour ("19:42", "7:05"), so it matches the fallback `lockScreenCopy.time` ("7:24"). `Intl` cannot give that: `{ hour: 'numeric', minute: '2-digit', hourCycle: 'h23' }` in `en-US` prints "07:05" (the CLDR `Hm` pattern is `HH:mm`), so the time is built from `formatToParts` with `hourCycle: 'h23'` and the hour part parsed as a number. The date is `{ weekday: 'short', month: 'short', day: 'numeric' }` in `en-US` ("Thu, Oct 15"), so it matches the English copy of the page.
- The formatting is a pure function `formatLocalClock(instant, timeZone?)` in `localClock.ts`; the hook passes `undefined` (the browser zone). Formatters are cached per zone, created on first use, not at module load: a module-level formatter keeps the zone it was created in, so a unit test could not switch zones. The unit test passes the zone explicitly.
- `HeroBoot.tsx` moves its formatting into the same hook, so the format lives in one place.
- All places use the hook (the lock screen covers three phones, plus the Reserve text copy and the hero boot), so all phones agree with each other and with the visitor's own clock.
- Prerender and before hydration: the hook returns null (the server snapshot of `useMinuteClock`), and the components render the `lockScreenCopy` strings as today; the live value replaces them after hydration. The `lockScreenCopy` comment says it is only a fallback now.
- Width: the lock-screen date and time are left-aligned today (`x={left}`, no `text-anchor`), so a longer value grows to the right. "19:42" at 40 px is about one digit wider than "7:24"; `.lock-time` and `.lock-date` get `font-variant-numeric: tabular-nums`, so the width depends only on the number of digits, and the longest values ("23:59", "Wed, Sep 30") are checked by eye at the three viewports to stay inside the screen with the status icons' margin.
- `useMinuteClock` already re-syncs when the tab comes back from the background, so a phone never shows a stale minute after the visitor returns.
- `aria-hidden` stays on all phone screens; no live region announces the minute.
- Tests freeze the clock and the zone (unit: `formatLocalClock` with an explicit `timeZone`; Playwright `page.clock` with `timezoneId` in `test.use`, which is per context, so the two zones are two `describe` blocks) and assert the value in two different zones.

## 11. Borders pulse like the footer edge

The footer edge (plan 5 §7) has a light window that travels along the line. Every visible border on the page gets the same kind of pulse.

**Two shapes.**

- **Lines** (a single edge: the header bottom, the Numbers stat tops, the core rows in Features): a 160 px bright window in the border colour mixed 60 % with the accent travels along the line, as in the footer. Only the pulse window moves to `_mixins.scss` (its gradient mask, `$pulse-window` and the `edge-pulse` keyframes) as `line-pulse($side)`, drawn by a `::after` on the element. The footer's `edge-strip` mixin and its counter box stay in `Footer.module.scss`: they exist to keep the pulse in step with the wave, and a straight line has no wave, so one element is enough. The header case sits under the progress line (§6).
- **Boxes** (cards, the lens boxes, the reserve panel and input, the Numbers CTA, the finishes options, the sticky CTA, the motion toggle, the panel and its handle, the segmented control, the switches): a short light runs once around the box. A turning conic gradient moves at a constant angle, not a constant speed along the edge, so on a wide card the light runs faster near the corners and is longer on the long sides; accepted (§18). A shared `<BorderPulse />` (`src/components/BorderPulse/`, `aria-hidden` span, `pointer-events: none`): an outer ring masked to the 1 px border (`mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)` plus `-webkit-mask-composite: xor` for WebKit, `padding: 1px`, `border-radius: inherit`), and inside it an oversized conic-gradient square that turns (`transform: rotate()` keyframes on an HTML element, compositor). Box mixin `ring-pulse` for the host (`position: relative; isolation: isolate`).
- **Void elements.** `<BorderPulse />` is a child, so it cannot sit inside an `<input>`. The email input pulses through its field wrapper (`ReserveForm` already wraps it for the bugs); the switches and the segmented control pulse on their label / track element, not on the native `<input>`. Each host is listed in the build notes (§19) with the element that carries the ring.

**Rhythm.** The footer pulses on a 6 s cycle. Elsewhere a constant pulse on twenty elements would be noise and twenty layers, so each element pulses **once every 7–12 s** (`animation-delay` from `--pulse-seed`, a per-element number set in the stylesheet), under `when-awake` at `full`. Sections carry no `[data-awake]`: `useAwakeWhileInView` sets it on single elements (feature cards, the finishes render, the reserve panel, the Numbers CTA and list, every pressable, the email bugs, the footer). So each host is checked: inside an awake element it uses that one (cards, lens boxes in a card, core rows in the chip card, the Numbers stat tops in the list, the Numbers CTA, the reserve panel and its input, the footer); otherwise `BorderPulse` calls `useAwakeWhileInView` on its own ring (the finishes options, the sticky CTA, the motion toggle, the panel and its handle, the panel controls), and the header root gets the hook (§0). The build notes (§19) list each host and its awake element. Interactive controls pulse at rest only: on hover, focus or the open / checked state their own states win and the pulse stops.

**Levels.** `calm` and `off`: plain borders, no pulse. High contrast and forced colours: plain borders. Rule 6: a ring's square is promoted only while its pulse runs (`promote-while-awake` on the ring host, and the square is `opacity: 0` and not animated between pulses), so most rings hold no layer at rest. Layers are budgeted in §17, counted from the measured hero number, not from the plan 6 target of 40 that the hero already misses; the rarest pulses (inputs, switches) are the first to drop if it goes over.

## 12. Features: the brightness bar comes alive

`features__brightness` is a static pill with a dark-to-accent gradient and two labels, "1 nit" and "3,000 nits" (hard-coded in `Features.tsx`).

- **Ambient** (`full`, card awake): a sun thumb (a 10 px disc with eight rays) slides along the pill from "1 nit" to "3,000 nits" and back (5 s each way, `ease-in-out`, a 1.5 s pause at each end); behind it the bright part of the gradient grows with it (a fill element scaled on `scaleX` from the left). The rays turn slowly while it moves (the rays are their own root `<svg>` inside the HTML thumb, turned by `transform: rotate()`), the thumb glows brighter near the right end (an `opacity` glow element, no filter). When the thumb reaches the end, "3,000 nits" flashes to full white for 300 ms, and the card's display icon brightens for the same moment. The flash is not a `color` animation, which is a main-thread loop (rule 4): a white copy of the label sits over it (`aria-hidden`, `position: absolute`) and only its `opacity` animates; the icon's brightening is the same trick, a light copy over it.
- **Hover on the card** (`hover-motion`): the thumb runs straight to the right end in 600 ms and stays there while the pointer is on the card.
- **How.** Track trick so `transform` alone does it: the thumb sits in a full-width wrapper translated from `-100%` to `0` (a percentage of its own width, the track width), so no layout read and no custom property per frame. The labels move to `content/` (`featuresCopy.brightness`). At `calm`: the thumb sits at the right end, no loop; at `off`: the same. High contrast: no gradient, a plain border, the thumb in `--color-text`.

## 13. Numbers: no label width limit

`Numbers.module.scss` `.label` loses `max-width: 16rem`. The labels then take the stat's column width; checked at 390, 768 and 1280 px so a label does not run under the next stat and the reel digits keep their alignment. The e2e screenshot of the Numbers block (if any) is updated.

## 14. Accessibility panel: the first open

Cause: the panel's `<h2>` is outside the `Suspense` boundary and the fallback is `null`. `isWanted` is set on a mouse `pointerenter`, on `focus` and on click. A touch tap has no `pointerenter`, and its `focus` comes in the same gesture as the click (Safari does not focus a button on click at all), so the chunk starts downloading only when the panel already slides in, and only the heading shows. The idle preload below is the real fix; the `pointerdown` preload only wins a few dozen milliseconds on a tap.

**Fix (both parts).**

- **Preload and mount.** The body renders only under `isWanted` (`A11yPanel.tsx`), and a `lazy()` component suspends on its first render even when its chunk is already loaded, so fetching the chunk early is not enough: the idle step sets `isWanted` (`requestIdleCallback`, 2 s timeout fallback through `setTimeout`), which mounts the body while the panel is still closed and `inert`. `pointerdown` on the handle sets it too (before the click). With `prefersSavedData()` only the `pointerdown` path runs.
- **Themed spinner.** The fallback is `PanelSpinner` (≈ 30 lines, in the main bundle, it is tiny): the accessibility glyph of §3 at 2.5 rem, built as a small rig so every loop composites (rule 4). An HTML box holds two `<svg>` roots: the ring and the figure.
  - The ring is a fixed arc (a quarter of the circle drawn with `stroke-dasharray`, no animated dash) on its own root, turned by `transform: rotate()` keyframes (1.2 s, linear, infinite).
  - The figure is still in the "V" pose of §3; the whole figure root bobs (`transform: translateY()` 2 px, 1.2 s, infinite). No star jumps inside the SVG: a loop on SVG children never composites.
  - It appears only after 150 ms (`animation-delay` on `opacity`), so a fast load shows nothing; the panel gets `aria-busy="true"` while it waits, and a visually hidden "Loading settings" in the status region.
- The panel reserves its height while loading (`min-height: 18rem`) so the slide does not jump when the body arrives.
- `off`: the ring is shown still with the text visible; high contrast: `--color-text`.

## 15. Tests (draft)

- **Unit:** the joy and falling bags (no repeat, landing line combines joy + rig, joy alone without a rig); the `fall` act starts once per descent, also for an umbrella released low (`open → flip`), and `trip` swaps its line at 45 %; `footballGame` (ball friction and bounce stay inside the frame, a kick changes velocity, the perimeter routes stay on the border, play stops within 14 s and the goal lands within 16 s, the step is deterministic with a seeded random); the escape schedule (a `hit` or `footer` end does not reset the paragraph timer and never starts a chase; `sectionOf` of a footer block is the footer); the heading copy gets `data-source="heading"`, a paragraph copy does not; `formatLocalClock` (a fixed instant reads "19:42" under `Europe/Kyiv` and "12:42" under `America/New_York`; 07:05 reads "7:05", midnight reads "0:05"; the date changes at the visitor's midnight, not UTC's); `letterRequests` aim / hit (a reply with a spot inside the viewport, `null` when nothing fits, a stale hit dropped); the `hitRun` plan; the contrast test for the header stops and wave overlay, the worm on the mark, the mini Pip colours, the pulse light, in all four token sets.
- **E2e:**
  - Pip: a drag release shows a falling line during the descent and a joy line on landing; the live region gets the landing line only; a forced `throw` act hides one glyph (Highlight range) and restores it, the paragraph text is unchanged; no throw without the letters chunk.
  - Handle: the glyph is back (circle + figure), the name is "Accessibility settings", hover at `off` runs no animations, the open state holds the pose.
  - Mark: hovering the header home link shows the bite mask applied and the worm inside the mark's box after the sequence; the hover `scale` is on `.grow`, not on the root; at `off` no running animations; header and footer masks have different ids.
  - Finishes: no bird element exists; at `full` with the render awake, four mini Pips and a ball appear and the logo opacity drops; at `calm` / `off` none; idle rAF returns to 0 and no leg animation runs during the rest phase.
  - Header: the waves run at `full` (three running animations on `transform`, all composited), none at `calm` / `off`; HC shows the flat bar; the progress line stays above the pulse.
  - Spinner: with the body chunk delayed, every running animation in the spinner composites (the plan 6 allowlist check).
  - Footer: at `full` with the footer in view a footer paragraph escape happens within 6 s; links never run; the main paragraph schedule keeps its 10–15 s gaps meanwhile.
  - Heading legs: during a heading escape the computed leg height is 2/3 of a paragraph letter's at the same font size (or the 2 px floor).
  - Reserve: nine bugs at rest at `full`, moving (running animations on `.bug-walk`), none at `calm` / `off`; focus fades all of them out, blur brings them back; the screen cycle runs and stops on success.
  - Clock: with `page.clock` set to a known UTC time, every phone screen (LineDraw, Reserve and its wallpaper text, exploded display, hero boot) shows the same local time and date; a second `describe` with another `timezoneId` shows another time on all of them.
  - Brightness: the thumb animates at `full`, sits at the right end at `calm` / `off`; labels come from `content/`; no running `color` animation.
  - Borders: at `full` a pulse runs on an awake card within 12 s, and on the header within 12 s; none at `calm` / `off` / HC; a focused email field shows no pulse.
  - Numbers: the computed `max-width` of a label is `none`.
  - Panel: with the body chunk delayed by route interception, the spinner shows and `aria-busy` is true, then the controls appear and focus lands as before; with a normal load and a prior idle, the controls are present on the first open frame.
  - The plan 6 `off` test (animations 0, idle rAF 0) and `calm` test keep passing.
- **Perf:** `npm run perf` with the header waves and the pulses on; every new loop composites (none joins the allowlist of animations that fail to composite); layers and overdraw at the hero within the §17 layer budget, counted from the number measured before G1.

## 16. Work order (draft)

| #   | Step                                                                                                  | Done when                                                                          |
| --- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| G1  | Handle glyph and its hover (§3), mark grow and bite (§4)                                              | glyph back, worm and bite on both marks, `off` snaps, mask ids unique              |
| G2  | Fixes: Numbers label (§13), panel preload and spinner (§14; the spinner draws the §3 glyph)           | first open shows controls or the spinner, never a bare heading                     |
| G3  | Local clock on every phone (§10), brightness bar (§12)                                                | all phones agree with a frozen clock; bar moves at `full` only                     |
| G4  | Header gradient and waves (§6), shared `line-pulse` / `ring-pulse` and `BorderPulse` (§11)            | contrast test green for every finish; layer count inside budget                    |
| G5  | Reserve bugs walking (§8), reserve screens chunk (§9)                                                 | flee from mid-walk without a jump; cycle stops on success                          |
| G6  | Escape schedule split out (§2), footer letters (§7), heading legs (§7.1), Pip joy lines (§1)          | footer escapes on its schedule; heading legs 1.5× smaller; joy lines on every fall |
| G7  | Remove the bird; football chunk (§5)                                                                  | game sleeps between rallies; chunk within §17                                      |
| G8  | Letter requests and Pip's throw (§2)                                                                  | hit pops the letter, text intact, no throw without the chunk                       |
| G9  | Lint, typecheck, unit, e2e, perf, cycles, unused, README (motion list, accessibility, budget numbers) | all green; §17 measured and written into README                                    |

## 17. Budget

Measured with `vite build`, written into the README like the earlier plans.

| Chunk                         | Limit                                     | What goes in                                                                                                                                                  |
| ----------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Main bundle JS                | **+1.0 KB gz**                            | handle glyph markup, mark bite and worm markup, `BorderPulse`, brightness markup, `useLocalClock`, panel preload and `PanelSpinner`, `letterRequests` channel |
| Main CSS                      | **+1.5 KB gz**                            | handle hover, bite and worm, header gradient and `crest-mask` waves, `line-pulse` / `ring-pulse`, brightness bar, bugs wander, spinner                        |
| Panel body chunk              | +0.2 KB gz                                | the ring hosts on the switches and the segmented control (their CSS lives with the controls)                                                                  |
| Layers at the hero            | **+4** over the number measured before G1 | the three header strips and the header line pulse; box rings hold a layer only while they pulse                                                               |
| `finishes-team` (new, lazy)   | ≤ 3 KB gz                                 | mini Pip rigs, ball, game step, wiring                                                                                                                        |
| `finishes-bird`               | removed (−2.16 KB JS, −0.70 KB CSS)       |                                                                                                                                                               |
| `reserve-screens` (new, lazy) | ≤ 2 KB gz                                 | six wallpapers, the text layer with the clock, the cycle CSS                                                                                                  |
| Pip chunk                     | +1.2 KB gz                                | joy and falling bags, the `fall` act, `throw` act, projectile, slingshot art                                                                                  |
| `runaway-letters`             | +0.8 KB gz                                | escape schedule with the footer, letter requests handler, `hitRun`, heading legs CSS                                                                          |

Main JS and main CSS together stay within the +2.5 KB of §0, counted from the plan 6 baseline (see the start of this plan).

## 18. Open questions

Decided by eye once built, unless stated.

- §2: slingshot only, or the pea shooter too? Both in the first build; the pea shooter goes if the prop art does not read at Pip's size.
- §4: whether the bitten logo should stay after the pointer leaves on touch (no hover). Not in the first build: touch shows no bite.
- §5: four mini Pips or six (three a side)? Four, unless the frame looks empty on `md`.
- §6: whether the waves should also lean with the scroll speed like the footer edge. Not in the first build; plan 6 rule 2 would make it a scroll timeline.
- §9: whether the wallpapers should follow the finish colours or keep their own palette.
- §11: the pulse may read as too busy on the finishes options next to the football game; the options are the first to drop.
- §11: the box light runs at a constant angle, so its speed along a wide card's edge is uneven; accepted unless it reads as a glitch, then the cards get a line pulse on their top edge instead.

## 19. Implementation notes

Filled in during the build. Where the build differs from the text above, the build is the rule.

**Baseline before G1** (2026-10-15, `vite build` and `npm run perf` on this machine, headed Chromium 1440 × 900): main JS 101.88 KB gz, main CSS 23.62 KB gz, Pip 8.37 + 3.00 KB, runaway letters 4.86 + 0.52 KB, camera bird 2.19 + 0.72 KB, panel body 1.31 KB, rigs 1.65 + 0.86 KB. Hero: 44–46 drawing layers, overdraw 9.4×; finishes 46 layers.

**Where the build differs from the text**

- §3, §14: the glyph geometry lives in `A11yPanel/a11yGlyph.ts` (the fast-refresh lint rule keeps constants out of component files); the handle and `PanelSpinner` share it. The spinner's "Loading settings" sits in the spinner itself, visually hidden at `full` / `calm` and shown at `off`, not in the status region: the body mounts on idle while the panel is closed, and the status region would announce it to nobody.
- §4: the three chomps are three snap transitions delayed 420, 500 and 580 ms on the chomp circles, not one `steps(3)` animation; the 1 px jolt is `steps(6, jump-end)` over 240 ms on `.grow`.
- §4: the chomp circles have radii 2.3–2.6 (centres (19.8, 9.2), (20.2, 11.1), (19.7, 13.0)); 1.6–1.9 left a one-pixel notch at 1.4 rem. Still three overlapping circles, so the notch stays ragged.
- §5: each mini Pip's shell reads `--pip-shell` (the swatch `hsl()`), not local `--accent-*`. The text-colour outline is on Basalt in the dark themes and on every Pip in the light theme, where all four finishes fall under 3 : 1 on the page (`config/contrast.test.ts`). The kick swing sits inside `when-awake` after the run cycle, so it wins over the step while the chaser is still running. The chunk loads at `full` without waiting for the frame to be awake; the game itself runs only while the frame is awake and in view. The high-five arm is a one-shot on an SVG `<path>` and does not composite: it is on the perf allowlist (`finishes-team__arm`).
- §5: the floor is the frame's bottom edge, just under the phone; the two lap Pips stop where they are at the whistle (on a wall or the top edge) instead of walking down to sit. The ball takes the page's finish colour; a hover preview recolours the logo on the render but not the ball (the ball is an HTML sibling of the render and does not see its local accent). The goal point is the logo's share of the frame (the frame is exactly the render's box), so it follows a resize; it is not re-read after the pick tilt.
- §6: the three crests share one tile, stretched to 240, 360 and 520 px (the tile ignores its aspect ratio), to keep the CSS small. Each strip is its tile width wider than the bar (`calc(100% + tile)`), not 200 %; one tile of travel is enough to loop.
- §8: the DOM per bug is `.spot` (place and the rest / away / return / error states, as before) → `.walk` (wander) → bug rig. One `bug-wander` keyframes for all nine, each bug's distance and timing as custom properties on its spot. The "two bugs touch antennae" beat is not built.
- §9: at `calm` and `off` the chunk is not loaded, so the render's plain lock screen shows, not the first wallpaper (the first wallpaper stands still only at `full` while the panel is asleep). The delays come from an SCSS `@for` over `nth-child`, not a `--i` custom property. The stack's position is the screen rect of `phone-geometry.ts` worked out by hand as percentages in `ReserveScreens.module.scss`.
- §9: the titanium wallpaper is brushed hairlines in the spirit of the plan 5 scratches, not the scratch pattern itself (it lives inside `TitaniumSample.tsx`). High contrast keeps the plain screen.
- §11: every `BorderPulse` and `LinePulse` calls `useAwakeWhileInView` on its own element, so no host depends on an awake ancestor. The ring sits just inside the border (`inset: 0`), because the living surfaces clip their overflow. Hosts: feature cards, lens boxes, the reserve panel, the email field wrapper, the Numbers CTA, the sticky CTA, the segmented controls and the switches (on the drawn `.switch`, hidden while checked). Lines: the header bottom (under the progress line) and the Numbers stat tops (the span sits in the `dt`, positioned against the stat, so the `dl` keeps only `dt` / `dd` groups). Not built: the core rows (a table row cannot hold the line), the panel itself (it scrolls), and the rings on the panel handle, both motion toggles and the finish options (dropped to save layers, below).
- §11: the beat is a timer per element (`usePulseBeat` in `BorderPulse.tsx`), not an infinite CSS animation: every 7–12 s by the seed it sets `data-pulse` on the light of an awake element, the light plays once (2.4 s ring, 2.6 s line) and `animationend` / `animationcancel` clears it. An infinite animation that is only transparent between pulses still runs and keeps its compositor layer, which the "no layer at rest" rule forbids. The seed is a prop, not a stylesheet value. The line window is the footer edge's: `pulse-window` and `pulse-run-keyframes` in `_mixins.scss` serve both the footer and `LinePulse` (a component with its own span, not a `line-pulse($side)` `::after`). In the light theme the light is the accent mixed 60 % into the page (`color-mix(in oklab, …)`), because the dark-theme mix has the luminance of the dark light border; `config/contrast.test.ts` checks the light against the border and the page. Older WebKit gets the prefixed `-webkit-mask` with `-webkit-mask-composite: xor`.
- §12: the card has no display icon, so only the label flashes. The sun runs between the labels (their widths are 5ch and 10ch in the mono font). The labels live in `featuresCopy.display.brightness`. A hover runs the thumb to the right end from the left end, not from where the loop had it.
- §1: the rig's joke follows the joy line in the same bubble line ("Wow! · Geronimo."), at the same size.
- §14: with `prefersSavedData()` the idle mount is skipped, but hover and focus still mount the body, as well as `pointerdown`.
- §2: slingshot only (open question in §18); the pea shooter is not built. A planned miss does not shake the letter. There is no `ThrowProjectile.tsx`: the pebble (4 px) is one `aria-hidden` span in `Mascot.tsx`, moved by `useMascotThrow.ts`; on arrival it bounces off and fades (360 ms of `transform` and `opacity` on the same tick, which the bounce outlives the act's cleanup to finish). The aim prefers blocks in the lower 70 % within 900 px of Pip and falls back to any free block in `main`; a heading is aimed at only while no other heading's letters are out (plan 6 §11.1). The `hit` and `missed` lines are drawn at random, not from a bag.
- Sizes: `useMascotBrain.ts` is 205 lines (the throw permission and the trip swap add 16); `useRunawayLetters.ts` 155 lines after the schedule moved out (the hit's one-heading rule adds three). `TitaniumSample.tsx` grew past 150 in plan 5 and plan 6; its band clip path and scratch table moved to `titaniumGeometry.ts`.
- §11: the rings on the panel handle, the header pause toggle (both on screen at the hero for the whole visit), the footer pause toggle and the finish options were dropped to save layers.
- §5: the leg roots take no standing `will-change`; a leg holds a layer only while its run cycle plays.
- §14: the panel root is `pointer-events: none` (the panel and the handle take presses): once the controls mount on idle, the root is as tall as the panel, and its empty strip beside the handle covered Pip and the page at the left edge (it broke the Firefox drag tests).

**Measured after G9** (same machine and method as the baseline): main JS 103.68 KB gz (+1.80, limit +1.0), main CSS 26.14 KB (+2.52, limit +1.5), `finishes-team` 3.11 + 0.75 KB (limit 3), `reserve-screens` 1.42 + 0.98 KB (limit 2), Pip 9.52 + 3.13 KB (+1.15 JS), `runaway-letters` 5.73 + 0.56 KB (+0.87), panel body 1.33 KB, camera bird removed. Probe: 16.7 ms mean frame idle in every section, full scroll 19.8 ms, startup 0 long tasks; layers hero 47–53 (+1 to +7, limit +4), Numbers 101, Features 89, Finishes 63, Reserve 94; hero overdraw 10.8–11.6×. `npm run test:perf` fails the layer checks at the hero on Pixel 7, the exploded view and Finishes; the budgets were not raised. Over budget: main JS and CSS, both lazy chunks a little, and the layer limit.

**After the review fixes** (2026-10-15, same method): main JS 103.78 KB gz (+1.90), main CSS 26.14 KB (+2.52), `finishes-team` 3.10 + 0.75 KB, `reserve-screens` 1.42 + 0.98 KB, Pip 9.62 + 3.13 KB (+1.25 JS, limit +1.2: the pebble's bounce), `runaway-letters` 5.78 + 0.56 KB (+0.92), panel body 1.33 KB. Probe: 16.7 ms idle everywhere, full scroll 20 ms; layers hero 47–50, Numbers 96, Features 93, Finishes 69, Reserve 96; hero overdraw 10.8–11.6×. `npm run test:perf`: the layer checks still fail (hero on Pixel 7 41, exploded view 78, Finishes 60); the finish-pick task budget and the idle recalc check fail now and then under the full suite and pass alone. E2e green on desktop, Pixel 7, Firefox, iPad and iPhone (one iPhone test failed once and passed on its own).

**§15 tests not built:** the forced Pip `throw` e2e (the act is random with a 25 s cooldown and the page has no hook to force it; the letters' side is covered by `letterRequestsHandler.test.ts`), the Finishes rest-phase check (idle rAF 0, no leg animation; a rally lasts 8–14 s), the spinner allowlist check, and the heading-legs size check in e2e (`letterWrap.test.ts` covers the `data-source` switch).
