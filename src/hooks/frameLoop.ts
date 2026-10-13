export type ScrollFrame = {
  scrollY: number
  viewportHeight: number
  documentHeight: number
}

type ScrollListener = (frame: ScrollFrame) => void
type LayoutListener = () => void
type TickListener = (time: number) => void

const scrollListeners = new Set<ScrollListener>()
const layoutListeners = new Set<LayoutListener>()
const tickListeners = new Set<TickListener>()
const frame: ScrollFrame = { scrollY: 0, viewportHeight: 0, documentHeight: 0 }
let pendingFrame = 0
let isScrollDirty = false
let bodyObserver: ResizeObserver | null = null

function runFrame(time: number) {
  pendingFrame = 0
  if (isScrollDirty) {
    isScrollDirty = false
    frame.scrollY = window.scrollY
    scrollListeners.forEach((listener) => listener(frame))
  }
  tickListeners.forEach((listener) => listener(time))
  if (tickListeners.size > 0) scheduleFrame()
}

function scheduleFrame() {
  if (pendingFrame === 0) pendingFrame = requestAnimationFrame(runFrame)
}

function markScrolled() {
  isScrollDirty = true
  scheduleFrame()
}

function relayout() {
  frame.viewportHeight = window.innerHeight
  frame.documentHeight = document.documentElement.scrollHeight
  layoutListeners.forEach((listener) => listener())
  markScrolled()
}

function startScrollTracking() {
  window.addEventListener('scroll', markScrolled, { passive: true })
  window.addEventListener('resize', relayout, { passive: true })
  bodyObserver = new ResizeObserver(relayout)
  bodyObserver.observe(document.body)
  if ('fonts' in document) void document.fonts.ready.then(relayout)
  relayout()
}

function stopScrollTracking() {
  window.removeEventListener('scroll', markScrolled)
  window.removeEventListener('resize', relayout)
  bodyObserver?.disconnect()
  bodyObserver = null
}

function cancelIdleFrame() {
  if (scrollListeners.size === 0 && tickListeners.size === 0) {
    cancelAnimationFrame(pendingFrame)
    pendingFrame = 0
  }
}

export function subscribeScrollFrame(onScroll: ScrollListener, onLayout?: LayoutListener) {
  const isFirst = scrollListeners.size === 0
  scrollListeners.add(onScroll)
  if (onLayout) {
    layoutListeners.add(onLayout)
    onLayout()
  }
  if (isFirst) startScrollTracking()
  else markScrolled()

  return () => {
    scrollListeners.delete(onScroll)
    if (onLayout) layoutListeners.delete(onLayout)
    if (scrollListeners.size === 0) stopScrollTracking()
    cancelIdleFrame()
  }
}

export function subscribeTick(onTick: TickListener) {
  tickListeners.add(onTick)
  scheduleFrame()
  return () => {
    tickListeners.delete(onTick)
    cancelIdleFrame()
  }
}

export function documentTop(element: Element) {
  return element.getBoundingClientRect().top + window.scrollY
}
