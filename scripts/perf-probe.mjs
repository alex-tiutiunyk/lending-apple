// The animation performance probe (plan 6 §13): `npm run perf` against a running preview
// (`npm run preview`), headed Chromium through the DevTools protocol. Prints, per scenario, the
// rAF intervals, long tasks, style recalcs and layouts per frame, forced layouts with their top
// JS stack, the animations that failed to composite, the compositor layers and the overdraw.
// `--json` writes perf/<date>.json; DPR=2 runs the 2× profile; HEADLESS=1 for a quick look.
import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require('@playwright/test')

const dpr = Number(process.env.DPR ?? 1)
const headless = process.env.HEADLESS === '1'
const base = process.env.BASE ?? 'http://localhost:4173/'
const writeJson = process.argv.includes('--json')
const relayoutMark = 'frame-loop:relayout'
const longTaskMs = 50
const viewport = { width: 1440, height: 900 }

const mainThreadNames = [
  'RunTask',
  'FunctionCall',
  'UpdateLayoutTree',
  'Layout',
  'PrePaint',
  'Paint',
  'HitTest',
  'Animation',
]

const browser = await chromium.launch({ headless, args: ['--window-size=1500,1000'] })
const context = await browser.newContext({ viewport, deviceScaleFactor: dpr })
const page = await context.newPage()
const cdp = await context.newCDPSession(page)
await cdp.send('Performance.enable')
await cdp.send('LayerTree.enable')
await cdp.send('DOM.enable')

let layers = []
cdp.on('LayerTree.layerTreeDidChange', ({ layers: next }) => {
  if (next) layers = next
})
let events = []
cdp.on('Tracing.dataCollected', ({ value }) => {
  events.push(...value)
})

async function startTrace() {
  events = []
  await cdp.send('Tracing.start', {
    transferMode: 'ReportEvents',
    traceConfig: {
      includedCategories: [
        'devtools.timeline',
        'disabled-by-default-devtools.timeline',
        'disabled-by-default-devtools.timeline.stack',
      ],
      excludedCategories: ['*'],
    },
  })
}

const frameKey = (frame) =>
  `${frame.functionName || '(anon)'}@${(frame.url ?? '').split('/').pop()}:${frame.lineNumber}`
const stackKey = (stack) => stack.slice(0, 3).map(frameKey).join(' < ')
const round = (value) => Math.round(value * 10) / 10

async function endTrace() {
  const done = new Promise((resolve) => cdp.once('Tracing.tracingComplete', resolve))
  await cdp.send('Tracing.end')
  await done
  const ms = {}
  const counts = {}
  const forced = {}
  const notComposited = {}
  let longTasks = 0
  let longest = 0
  let restyledNodes = 0
  // Only the page's main thread blocks the reader: GPU-process tasks are not long tasks
  const mainThreads = new Set(
    events
      .filter((event) => event.name === 'thread_name' && event.args?.name === 'CrRendererMain')
      .map((event) => `${event.pid}:${event.tid}`),
  )
  for (const event of events) {
    if (event.name === 'Animation' && (event.ph === 'b' || event.ph === 'n')) {
      const data = event.args?.data ?? {}
      if (data.compositeFailed) {
        const key = `${data.nodeName ?? '?'} ${data.name ?? data.displayName ?? ''} [${(data.unsupportedProperties ?? []).join(',')}]`
        notComposited[key] = (notComposited[key] ?? 0) + 1
      }
      continue
    }
    if (event.ph !== 'X' || !mainThreadNames.includes(event.name)) continue
    if (!mainThreads.has(`${event.pid}:${event.tid}`)) continue
    const duration = event.dur / 1000
    ms[event.name] = (ms[event.name] ?? 0) + duration
    counts[event.name] = (counts[event.name] ?? 0) + 1
    if (event.name === 'RunTask') {
      if (duration > longTaskMs) longTasks += 1
      longest = Math.max(longest, duration)
    }
    if (event.name === 'UpdateLayoutTree') {
      restyledNodes += event.args?.beginData?.elementCount ?? 0
    }
    // A stack whose top frame has no URL is the probe's own evaluate (its scrollTo)
    if (event.name === 'Layout' && event.args?.beginData?.stackTrace?.[0]?.url) {
      const key = stackKey(event.args.beginData.stackTrace)
      const entry = (forced[key] ??= { count: 0, ms: 0 })
      entry.count += 1
      entry.ms += duration
    }
  }
  for (const key in ms) ms[key] = round(ms[key])
  const forcedTop = Object.entries(forced)
    .sort((a, b) => b[1].ms - a[1].ms)
    .slice(0, 6)
    .map(([key, value]) => `${value.count}× ${round(value.ms)} ms ${key}`)
  const recalcUsPerNode = restyledNodes
    ? round(((ms.UpdateLayoutTree ?? 0) * 1000) / restyledNodes)
    : 0
  return {
    ms,
    counts,
    longTasks,
    longestTaskMs: round(longest),
    forcedTop,
    notComposited,
    recalcUsPerNode,
  }
}

async function metrics() {
  const { metrics: list } = await cdp.send('Performance.getMetrics')
  const pick = Object.fromEntries(list.map((metric) => [metric.name, metric.value]))
  return {
    recalcs: pick.RecalcStyleCount,
    layouts: pick.LayoutCount,
    recalcMs: pick.RecalcStyleDuration * 1000,
    layoutMs: pick.LayoutDuration * 1000,
    nodes: pick.Nodes,
  }
}

async function relayouts() {
  return page.evaluate((name) => performance.getEntriesByName(name).length, relayoutMark)
}

async function rafStart() {
  await page.evaluate(() => {
    const w = window
    w.__gaps = []
    w.__rafCalls = 0
    w.__rafOn = true
    let last = performance.now()
    const tick = (time) => {
      w.__gaps.push(time - last)
      last = time
      if (w.__rafOn) requestAnimationFrame(tick)
    }
    tick.isProbe = true
    requestAnimationFrame(tick)
    if (!w.__rafPatched) {
      w.__rafPatched = true
      const original = w.requestAnimationFrame.bind(w)
      w.requestAnimationFrame = (callback) => {
        if (!callback.isProbe) w.__rafCalls += 1
        return original(callback)
      }
    }
  })
}

async function rafEnd() {
  return page.evaluate(() => {
    const w = window
    w.__rafOn = false
    const gaps = w.__gaps.slice(1).sort((a, b) => a - b)
    const mean = gaps.reduce((sum, gap) => sum + gap, 0) / Math.max(1, gaps.length)
    return {
      frames: gaps.length,
      meanMs: Math.round(mean * 10) / 10,
      p95Ms: Math.round((gaps[Math.floor(gaps.length * 0.95)] ?? 0) * 10) / 10,
      over50: gaps.filter((gap) => gap > 50).length,
      maxMs: Math.round(gaps[gaps.length - 1] ?? 0),
      pageRafCalls: w.__rafCalls,
    }
  })
}

async function layerSnapshot() {
  // The layer tree is reported on change only: toggle it to get a fresh snapshot
  await cdp.send('LayerTree.disable')
  layers = []
  await cdp.send('LayerTree.enable')
  await page.waitForTimeout(400)
  // Each layer counts at most once over the viewport: the root scrolling layer is the document
  const area = (layer) =>
    Math.min(layer.width ?? 0, viewport.width) * Math.min(layer.height ?? 0, viewport.height)
  const drawing = layers.filter((layer) => layer.drawsContent)
  const viewportArea = viewport.width * viewport.height
  const largest = []
  for (const layer of [...drawing].sort((a, b) => area(b) - area(a)).slice(0, 10)) {
    let node = ''
    if (layer.backendNodeId) {
      try {
        const { object } = await cdp.send('DOM.resolveNode', { backendNodeId: layer.backendNodeId })
        node = object.description ?? ''
      } catch {
        node = ''
      }
    }
    largest.push(`${layer.width}×${layer.height} ${node}`)
  }
  return {
    total: layers.length,
    drawing: drawing.length,
    overdraw: round(drawing.reduce((sum, layer) => sum + area(layer), 0) / viewportArea),
    largest,
  }
}

const results = { dpr, headless, startedAt: new Date().toISOString(), scenarios: {} }

async function scenario(label, run) {
  const before = await metrics()
  const relayoutsBefore = await relayouts()
  await rafStart()
  await startTrace()
  const started = Date.now()
  await run()
  const wallMs = Date.now() - started
  const trace = await endTrace()
  const raf = await rafEnd()
  const after = await metrics()
  const frames = Math.max(1, raf.frames)
  const result = {
    wallMs,
    raf,
    rafCallsPerSecond: round((raf.pageRafCalls / wallMs) * 1000),
    longTasks: trace.longTasks,
    longestTaskMs: trace.longestTaskMs,
    mainThreadMs: trace.ms,
    recalcsPerFrame: round((after.recalcs - before.recalcs) / frames),
    layoutsPerFrame: round((after.layouts - before.layouts) / frames),
    recalcMs: round(after.recalcMs - before.recalcMs),
    recalcUsPerNode: trace.recalcUsPerNode,
    forcedLayouts: trace.forcedTop,
    relayouts: (await relayouts()) - relayoutsBefore,
    hitTests: trace.counts.HitTest ?? 0,
    notComposited: trace.notComposited,
    layers: await layerSnapshot(),
    nodes: after.nodes,
  }
  results.scenarios[label] = result
  console.log(
    `${label.padEnd(22)} rAF ${String(result.raf.meanMs).padStart(5)} ms mean, p95 ${String(result.raf.p95Ms).padStart(5)}, >50: ${result.raf.over50}, long ${result.longTasks} (max ${result.longestTaskMs} ms), recalc/frame ${result.recalcsPerFrame}, layout/frame ${result.layoutsPerFrame}, forced ${result.forcedLayouts.length ? result.forcedLayouts[0] : 'none'}, relayouts ${result.relayouts}, rAF/s ${result.rafCallsPerSecond}, layers ${result.layers.drawing}/${result.layers.total}, overdraw ${result.layers.overdraw}×, not composited ${Object.keys(result.notComposited).length}`,
  )
}

const rafSteps = async (count, step) => {
  for (let index = 0; index < count; index += 1) {
    await step(index)
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve())))
  }
}
const parkPointer = () => page.mouse.move(viewport.width - 40, viewport.height - 20)
const scrollTo = (selector) =>
  page.evaluate(
    (target) =>
      document.querySelector(target)?.scrollIntoView({ block: 'start', behavior: 'instant' }),
    selector,
  )

// Startup: long tasks in the first two seconds after navigation, hydration included
await page.goto(base)
const startup = await page.evaluate(
  () =>
    new Promise((resolve) => {
      const observer = new PerformanceObserver(() => undefined)
      observer.observe({ type: 'longtask', buffered: true })
      setTimeout(() => {
        const tasks = observer
          .takeRecords()
          .concat(performance.getEntriesByType('longtask'))
          .filter((entry) => entry.startTime < 2000)
          .map((entry) => Math.round(entry.duration))
        observer.disconnect()
        resolve(tasks)
      }, 2100)
    }),
)
results.scenarios.startup = { longTasks: startup.length, longTasksMs: startup }
console.log(
  `startup                long tasks in the first 2 s: ${startup.length} (${startup.join(', ')} ms)`,
)
await page.waitForLoadState('networkidle')
await parkPointer()
await page.waitForTimeout(1500)

await scenario('idle-hero', () => page.waitForTimeout(3000))
await scenario('pointer-hero', () =>
  rafSteps(120, (index) =>
    page.mouse.move(200 + (index % 60) * 15, 300 + Math.sin(index / 6) * 150),
  ),
)
await parkPointer()
await scenario('scroll-full', () =>
  page.evaluate(async () => {
    const end = document.documentElement.scrollHeight - window.innerHeight
    for (let y = 0; y <= end; y += 60) {
      window.scrollTo({ top: y, behavior: 'instant' })
      await new Promise((resolve) => requestAnimationFrame(resolve))
    }
  }),
)
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
await page.waitForTimeout(500)
for (const id of ['design', 'inside', 'numbers', 'features', 'finishes', 'reserve']) {
  await scrollTo(`#${id}`)
  await page.evaluate(() => window.scrollBy({ top: -40, behavior: 'instant' }))
  await parkPointer()
  await page.waitForTimeout(1200)
  await scenario(`idle-${id}`, () => page.waitForTimeout(2500))
}
await scrollTo('#features')
await page.waitForTimeout(800)
const card = await page.locator('[data-surface]').first().boundingBox()
if (card) {
  await scenario('hover-surface-lens', () =>
    rafSteps(150, (index) =>
      page.mouse.move(
        card.x + card.width / 2 + Math.cos(index / 8) * card.width * 0.3,
        card.y + card.height / 2 + Math.sin(index / 8) * card.height * 0.3,
      ),
    ),
  )
}
await parkPointer()
const button = page.locator('[data-magnetic]').first()
await button.scrollIntoViewIfNeeded()
const buttonBox = await button.boundingBox()
if (buttonBox) {
  await scenario('hover-magnetic', () =>
    rafSteps(120, (index) =>
      page.mouse.move(
        buttonBox.x + buttonBox.width / 2 + Math.cos(index / 10) * buttonBox.width * 0.4,
        buttonBox.y + buttonBox.height / 2 + Math.sin(index / 10) * buttonBox.height * 0.4,
      ),
    ),
  )
}
await scrollTo('#finishes')
await page.waitForTimeout(800)
await scenario('finish-change', async () => {
  for (const name of ['Moss', 'Basalt', 'Tidewater', 'Ember']) {
    await page
      .locator('label', { has: page.getByRole('radio', { name: new RegExp(name) }) })
      .click()
    await page.waitForTimeout(900)
  }
})
await parkPointer()
await scenario('idle-finishes-after', () => page.waitForTimeout(2500))

if (writeJson) {
  mkdirSync('perf', { recursive: true })
  const file = `perf/${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}${dpr === 1 ? '' : `-dpr${dpr}`}.json`
  writeFileSync(file, JSON.stringify(results, null, 1))
  console.log('written', file)
}
await browser.close()
