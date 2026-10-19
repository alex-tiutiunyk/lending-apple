/**
 * Plan 11 §1 (P0): a temporary on-device readout, loaded only with `?diag`, removed at P9.
 * Appended to `<html>`, outside `body`, so it stays in the window even where a container holds
 * the fixed layers. A fixed probe inside the page container (`body` before plan 11 §2) says
 * whether this engine places fixed elements against a size container: the root cause, checked
 * on the device even on a build that already works around it.
 */
const watched = {
  handle: '.a11y-panel__handle',
  flag: 'a[class~="project-details-tab"]',
  pip: '.mascot',
  cta: '[data-sticky-cta]',
  canvas: '.backdrop canvas',
}

function rectLine(name: string, element: Element | null) {
  if (!element) return `${name}: –`
  const box = element.getBoundingClientRect()
  const extra = element instanceof HTMLCanvasElement ? ` backing ${element.height}` : ''
  return `${name}: top ${Math.round(box.top)} h ${Math.round(box.height)}${extra}`
}

function dialogLines() {
  const dialog = document.querySelector('dialog[open]')
  if (!dialog) return []
  const title = dialog.querySelector('h2')
  const style = title ? getComputedStyle(title) : null
  const highlights = 'highlights' in CSS ? CSS.highlights.size : 'n/a'
  return [
    rectLine('dialog', dialog),
    rectLine('title', title),
    `title opacity ${style?.opacity} visibility ${style?.visibility}`,
    `dialog scrollTop ${dialog.scrollTop}, highlights ${highlights}`,
  ]
}

const panel = document.createElement('div')
const verdict = document.createElement('strong')
const readout = document.createElement('pre')
verdict.style.cssText = 'display:block;font-size:20px'
readout.style.cssText = 'margin:0;font:inherit;white-space:pre-wrap'
panel.append(verdict, readout)
panel.setAttribute('aria-hidden', 'true')
panel.style.cssText =
  'position:fixed;top:0;right:0;z-index:2147483647;max-width:min(26rem,90vw);margin:0;' +
  'padding:6px 8px;font:11px/1.35 ui-monospace,monospace;' +
  'color:#0f0;background:rgb(0 0 0 / 82%);pointer-events:none'
const probe = document.createElement('div')
probe.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;pointer-events:none'
const container = document.querySelector('.app__page') ?? document.body

let lastScrollHeight = 0
const heightLog: string[] = []

function render() {
  const root = document.documentElement
  if (root.scrollHeight !== lastScrollHeight) {
    heightLog.unshift(`${Math.round(window.scrollY)}: ${lastScrollHeight} → ${root.scrollHeight}`)
    heightLog.length = Math.min(heightLog.length, 4)
    lastScrollHeight = root.scrollHeight
  }
  const isProbeOk = Math.abs(probe.getBoundingClientRect().top) < 1
  verdict.textContent = isProbeOk
    ? '[probe fixed: OK]'
    : `[probe fixed: relative to ${container === document.body ? 'body' : '.page'}]`
  readout.textContent = [
    navigator.userAgent,
    `scroll timeline ${CSS.supports('animation-timeline: scroll()')}, highlights ${'highlights' in CSS}`,
    `scrollY ${Math.round(window.scrollY)} innerH ${window.innerHeight} ` +
      `vvH ${Math.round(window.visualViewport?.height ?? 0)} docH ${root.scrollHeight}`,
    ...Object.entries(watched).map(([name, selector]) =>
      rectLine(name, document.querySelector(selector)),
    ),
    ...dialogLines(),
    `docH changes: ${heightLog.join('; ')}`,
  ].join('\n')
  requestAnimationFrame(render)
}

// After load, so the probe never lands in a tree React is still hydrating
function start() {
  document.documentElement.append(panel)
  container.append(probe)
  requestAnimationFrame(render)
}

if (document.readyState === 'complete') start()
else window.addEventListener('load', start, { once: true })
