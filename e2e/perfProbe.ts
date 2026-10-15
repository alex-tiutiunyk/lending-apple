import type { CDPSession, Page } from '@playwright/test'

/** Style recalcs and layouts so far, from the DevTools performance metrics. */
export async function renderCounts(cdp: CDPSession) {
  const { metrics } = await cdp.send('Performance.getMetrics')
  const pick = (name: string) => metrics.find((metric) => metric.name === name)?.value ?? 0
  return { recalcs: pick('RecalcStyleCount'), layouts: pick('LayoutCount') }
}

type TraceEvent = {
  name: string
  ph: string
  pid?: number
  tid?: number
  id?: string
  id2?: { local?: string }
  dur?: number
  args?: {
    name?: string
    beginData?: { stackTrace?: { functionName?: string; url?: string; lineNumber?: number }[] }
    data?: {
      compositeFailed?: number
      name?: string
      displayName?: string
      nodeName?: string
      unsupportedProperties?: string[]
    }
  }
}

/** An animation Chromium kept on the main thread: its target, failure bits and properties. */
export type MainThreadAnimation = { node: string; reasons: number; properties: string[] }

export type TraceSummary = {
  longTasks: number[]
  forcedLayouts: string[]
  notComposited: MainThreadAnimation[]
}

/** Records main-thread trace events until `stop` is called. */
export async function startTrace(cdp: CDPSession) {
  const events: TraceEvent[] = []
  const onData = ({ value }: { value: Record<string, string>[] }) => {
    events.push(...(value as unknown as TraceEvent[]))
  }
  cdp.on('Tracing.dataCollected', onData)
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
  return async (): Promise<TraceSummary> => {
    const done = new Promise((resolve) => cdp.once('Tracing.tracingComplete', resolve))
    await cdp.send('Tracing.end')
    await done
    cdp.off('Tracing.dataCollected', onData)
    const longTasks: number[] = []
    const forcedLayouts: string[] = []
    const notComposited = new Map<string, MainThreadAnimation>()
    // Only the page's main thread blocks the reader: GPU-process tasks are not long tasks
    const mainThreads = new Set(
      events
        .filter((event) => event.name === 'thread_name' && event.args?.name === 'CrRendererMain')
        .map((event) => `${event.pid}:${event.tid}`),
    )
    const isMain = (event: TraceEvent) => mainThreads.has(`${event.pid}:${event.tid}`)
    // The begin event names the target; a later event with the same id reports the failure
    const animationId = (event: TraceEvent) => event.id ?? event.id2?.local ?? ''
    const targets = new Map<string, string>()
    for (const event of events) {
      if (event.name === 'Animation' && event.ph === 'b') {
        targets.set(animationId(event), event.args?.data?.nodeName ?? '?')
      }
    }
    for (const event of events) {
      if (event.name === 'Animation' && (event.ph === 'b' || event.ph === 'n')) {
        const data = event.args?.data
        if (data?.compositeFailed) {
          const entry = {
            node: targets.get(animationId(event)) ?? data.nodeName ?? '?',
            reasons: Number(data.compositeFailed),
            properties: data.unsupportedProperties ?? [],
          }
          notComposited.set(JSON.stringify(entry), entry)
        }
        continue
      }
      if (event.ph !== 'X') continue
      const duration = (event.dur ?? 0) / 1000
      if (event.name === 'RunTask' && duration > 50 && isMain(event)) {
        longTasks.push(Math.round(duration))
      }
      const stack = event.args?.beginData?.stackTrace
      // A stack whose top frame has no URL is the test's own evaluate (its scrollTo), not the page
      if (event.name === 'Layout' && stack?.length && stack[0]?.url) {
        const top = stack[0]
        forcedLayouts.push(
          `${top?.functionName || '(anon)'}@${(top?.url ?? '').split('/').pop()}:${top?.lineNumber}`,
        )
      }
    }
    return { longTasks, forcedLayouts, notComposited: [...notComposited.values()] }
  }
}

/** rAF intervals over a run: the mean, the 95th percentile and the frames over 50 ms. */
export async function measureFrames<T>(page: Page, run: () => Promise<T>) {
  await page.evaluate(() => {
    const w = window as Window & { __gaps?: number[]; __rafOn?: boolean }
    w.__gaps = []
    w.__rafOn = true
    let last = performance.now()
    const tick = (time: number) => {
      w.__gaps?.push(time - last)
      last = time
      if (w.__rafOn) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  const result = await run()
  const frames = await page.evaluate(() => {
    const w = window as Window & { __gaps?: number[]; __rafOn?: boolean }
    w.__rafOn = false
    const gaps = (w.__gaps ?? []).slice(1).sort((a, b) => a - b)
    const mean = gaps.reduce((sum, gap) => sum + gap, 0) / Math.max(1, gaps.length)
    return {
      count: gaps.length,
      meanMs: Math.round(mean * 10) / 10,
      p95Ms: gaps[Math.floor(gaps.length * 0.95)] ?? 0,
      over50: gaps.filter((gap) => gap > 50).length,
    }
  })
  return { result, frames }
}

/** The page's own requestAnimationFrame calls over a quiet stretch. */
export function pageFrameRequests(page: Page, ms: number) {
  return page.evaluate(
    (wait) =>
      new Promise<number>((resolve) => {
        let count = 0
        const original = window.requestAnimationFrame.bind(window)
        window.requestAnimationFrame = (callback) => {
          count += 1
          return original(callback)
        }
        setTimeout(() => {
          window.requestAnimationFrame = original
          resolve(count)
        }, wait)
      }),
    ms,
  )
}

type Layer = { drawsContent?: boolean; width?: number; height?: number }

/** Drawing compositor layers and their overdraw (sum of areas over the viewport area). */
export async function layerCounts(page: Page, cdp: CDPSession) {
  let layers: Layer[] = []
  const onChange = ({ layers: next }: { layers?: Layer[] }) => {
    if (next) layers = next
  }
  cdp.on('LayerTree.layerTreeDidChange', onChange)
  await cdp.send('LayerTree.enable')
  await page.waitForTimeout(400)
  await cdp.send('LayerTree.disable')
  cdp.off('LayerTree.layerTreeDidChange', onChange)
  const viewport = page.viewportSize() ?? { width: 1, height: 1 }
  const drawing = layers.filter((layer) => layer.drawsContent)
  // Each layer counts at most once over the viewport: the root scrolling layer is the document
  const area = drawing.reduce(
    (sum, layer) =>
      sum +
      Math.min(layer.width ?? 0, viewport.width) * Math.min(layer.height ?? 0, viewport.height),
    0,
  )
  return { drawing: drawing.length, overdraw: area / (viewport.width * viewport.height) }
}

export function instantScroll(
  page: Page,
  selector: string,
  block: ScrollLogicalPosition = 'start',
) {
  return page.evaluate(
    ([target, position]) =>
      document
        .querySelector(String(target))
        ?.scrollIntoView({ block: position as ScrollLogicalPosition, behavior: 'instant' }),
    [selector, block],
  )
}
