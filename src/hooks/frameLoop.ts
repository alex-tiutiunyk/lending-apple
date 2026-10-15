export type ScrollFrame = {
  scrollY: number
  viewportHeight: number
  documentHeight: number
}

export type PointerFrame = {
  x: number
  y: number
  target: Element | null
}

type ScrollListener = (frame: ScrollFrame) => void
type PointerListener = (pointer: PointerFrame) => void
type LayoutListener = () => void
type TickListener = (time: number) => void
type Write = () => void
type Phase = 'idle' | 'read' | 'write'

/** Marked on each layout measure, so the perf probe can count them (plan 6 §5, §13). */
const relayoutMark = 'frame-loop:relayout'

const scrollListeners = new Set<ScrollListener>()
const layoutListeners = new Set<LayoutListener>()
const tickListeners = new Set<TickListener>()
const pointerListeners = new Set<PointerListener>()
const frame: ScrollFrame = { scrollY: 0, viewportHeight: 0, documentHeight: 0 }
const viewport = { width: 0, height: 0 }
const pointer: PointerFrame = { x: 0, y: 0, target: null }
const writes: Write[] = []
const reads: (() => void)[] = []
let phase: Phase = 'idle'
let pendingFrame = 0
let isLayoutDirty = false
let isScrollDirty = false
let isPointerDirty = false
let bodyObserver: ResizeObserver | null = null

/**
 * One frame, two phases (plan 6 §5): every listener runs in the read phase, where layout is
 * clean and a measurement costs nothing, and queues its DOM writes through `write`; the writes
 * run together once every listener has read. Outside a frame a write runs at once.
 */
export function write(fn: Write) {
  if (phase === 'idle') fn()
  else writes.push(fn)
}

/**
 * Runs `fn` in the read phase of the next frame, where layout is clean. For work that starts
 * on a timer and measures (a runaway letter's escape): measured from the timer itself, it would
 * force a layout of whatever changed since the last frame (plan 6 §5).
 */
export function readInNextFrame(fn: () => void) {
  reads.push(fn)
  scheduleFrame()
}

/** Dev guard for read helpers: a measurement during the write phase forces a layout. */
function assertReadPhase(what: string) {
  if (import.meta.env.DEV && phase === 'write') {
    throw new Error(
      `${what} measured during the write phase; read in a listener and queue the write`,
    )
  }
}

function flushWrites() {
  phase = 'write'
  // Writes queued by a write run in the same flush
  for (let index = 0; index < writes.length; index += 1) writes[index]?.()
  writes.length = 0
  phase = 'idle'
}

function measureLayout() {
  performance.mark(relayoutMark)
  frame.viewportHeight = window.innerHeight
  viewport.width = window.innerWidth
  viewport.height = window.innerHeight
  frame.documentHeight = document.documentElement.scrollHeight
  layoutListeners.forEach((listener) => listener())
}

function runFrame(time: number) {
  pendingFrame = 0
  phase = 'read'
  if (isLayoutDirty) {
    isLayoutDirty = false
    measureLayout()
  }
  reads.splice(0).forEach((read) => read())
  if (isScrollDirty) {
    isScrollDirty = false
    frame.scrollY = window.scrollY
    scrollListeners.forEach((listener) => listener(frame))
  }
  if (isPointerDirty) {
    isPointerDirty = false
    pointerListeners.forEach((listener) => listener(pointer))
  }
  tickListeners.forEach((listener) => listener(time))
  flushWrites()
  if (tickListeners.size > 0) scheduleFrame()
}

function scheduleFrame() {
  if (pendingFrame === 0) pendingFrame = requestAnimationFrame(runFrame)
}

function markScrolled() {
  isScrollDirty = true
  scheduleFrame()
}

/** A layout change: the measures run at the start of the next frame, before any listener. */
function markLayoutChanged() {
  isLayoutDirty = true
  markScrolled()
}

function startScrollTracking() {
  window.addEventListener('scroll', markScrolled, { passive: true })
  window.addEventListener('resize', markLayoutChanged, { passive: true })
  bodyObserver = new ResizeObserver(markLayoutChanged)
  bodyObserver.observe(document.body)
  if ('fonts' in document) void document.fonts.ready.then(markLayoutChanged)
  markLayoutChanged()
}

function stopScrollTracking() {
  window.removeEventListener('scroll', markScrolled)
  window.removeEventListener('resize', markLayoutChanged)
  bodyObserver?.disconnect()
  bodyObserver = null
}

function markPointerMoved(event: PointerEvent) {
  if (event.pointerType === 'touch') return
  pointer.x = event.clientX
  pointer.y = event.clientY
  pointer.target = event.target instanceof Element ? event.target : null
  isPointerDirty = true
  scheduleFrame()
}

function markPointerLeft(event: PointerEvent) {
  if (event.relatedTarget) return
  pointer.target = null
  isPointerDirty = true
  scheduleFrame()
}

function cancelIdleFrame() {
  if (scrollListeners.size === 0 && tickListeners.size === 0 && pointerListeners.size === 0) {
    cancelAnimationFrame(pendingFrame)
    pendingFrame = 0
  }
}

/**
 * `onLayout` runs in the read phase of the next frame (one layout for every subscriber at
 * mount) and again on every layout change, always before the scroll listeners of that frame.
 */
export function subscribeScrollFrame(onScroll: ScrollListener, onLayout?: LayoutListener) {
  const isFirst = scrollListeners.size === 0
  scrollListeners.add(onScroll)
  if (onLayout) layoutListeners.add(onLayout)
  if (isFirst) startScrollTracking()
  else if (onLayout) markLayoutChanged()
  else markScrolled()

  return () => {
    scrollListeners.delete(onScroll)
    if (onLayout) layoutListeners.delete(onLayout)
    if (scrollListeners.size === 0) stopScrollTracking()
    cancelIdleFrame()
  }
}

/** A tick keeps the loop running: subscribe only while something moves (plan 6 rule 9). */
export function subscribeTick(onTick: TickListener) {
  tickListeners.add(onTick)
  scheduleFrame()
  return () => {
    tickListeners.delete(onTick)
    cancelIdleFrame()
  }
}

export function subscribePointerFrame(onPointer: PointerListener) {
  if (pointerListeners.size === 0) {
    document.addEventListener('pointermove', markPointerMoved, { passive: true })
    document.addEventListener('pointerout', markPointerLeft, { passive: true })
  }
  pointerListeners.add(onPointer)

  return () => {
    pointerListeners.delete(onPointer)
    if (pointerListeners.size === 0) {
      document.removeEventListener('pointermove', markPointerMoved)
      document.removeEventListener('pointerout', markPointerLeft)
    }
    cancelIdleFrame()
  }
}

/**
 * The page position as of the last scroll frame. Per-frame code reads this instead of
 * `window.scrollY`, which makes Blink update style and layout first: after the frame's CSS
 * animations have run, that is a forced style recalc on every frame (plan 6 §5).
 */
export function lastScrollY() {
  return frame.scrollY
}

/**
 * The viewport as of the last layout change, for per-frame code: on a mobile viewport Blink
 * may update layout before it answers `innerWidth` / `innerHeight` (plan 6 §5).
 */
export function viewportSize() {
  if (viewport.width === 0) {
    viewport.width = window.innerWidth
    viewport.height = window.innerHeight
  }
  return viewport
}

export function documentTop(element: Element) {
  assertReadPhase('documentTop')
  return element.getBoundingClientRect().top + window.scrollY
}
