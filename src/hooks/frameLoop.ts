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

const scrollListeners = new Set<ScrollListener>()
const layoutListeners = new Set<LayoutListener>()
const tickListeners = new Set<TickListener>()
const pointerListeners = new Set<PointerListener>()
const frame: ScrollFrame = { scrollY: 0, viewportHeight: 0, documentHeight: 0 }
const pointer: PointerFrame = { x: 0, y: 0, target: null }
let pendingFrame = 0
let isScrollDirty = false
let isPointerDirty = false
let bodyObserver: ResizeObserver | null = null

function runFrame(time: number) {
  pendingFrame = 0
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

export function documentTop(element: Element) {
  return element.getBoundingClientRect().top + window.scrollY
}
