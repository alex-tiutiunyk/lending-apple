import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { letterRequests, type LetterTarget } from '@/hooks/letterRequests'
import { handleLetterRequests } from './letterRequestsHandler'

const createEscape = vi.fn((options: { kind: string }) => options)

vi.mock('@/hooks/frameLoop', () => ({ viewportSize: () => ({ width: 1280, height: 800 }) }))
vi.mock('./escapePlanner', () => ({
  settledBlocks: (selector: string, root: ParentNode) =>
    Array.from(root.querySelectorAll<HTMLElement>(selector)),
}))
vi.mock('./escapeRunner', () => ({
  createEscape: (options: { kind: string }) => createEscape(options),
  isInViewport: (rect: { top: number; bottom: number }) => rect.top >= 0 && rect.bottom <= 800,
}))

/** Glyph rects follow their block's `data-top` / `data-left`, so a test can "scroll" a block. */
function place(block: HTMLElement, left: number, top: number) {
  block.dataset.left = String(left)
  block.dataset.top = String(top)
}
const boxOf = (element: Element | null) => {
  const block = element instanceof HTMLElement ? element : element?.parentElement
  const left = Number(block?.dataset.left ?? 0)
  const top = Number(block?.dataset.top ?? 0)
  return { left, top, width: 10, height: 20, right: left + 10, bottom: top + 20 } as DOMRect
}

let main: HTMLElement
let stop: () => void = () => undefined

beforeEach(() => {
  main = document.createElement('main')
  main.innerHTML =
    '<section><p id="far">far away</p></section><section><p id="near">close</p></section>'
  document.body.append(main)
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    return boxOf(this)
  })
  Range.prototype.getClientRects = function (this: Range) {
    return [boxOf(this.startContainer.parentElement)] as unknown as DOMRectList
  }
  createEscape.mockClear()
})
afterEach(() => {
  stop()
  main.remove()
  vi.restoreAllMocks()
})

const start = vi.fn(() => true)
const listen = (isSectionFree: (block: HTMLElement) => boolean = () => true) => {
  stop = handleLetterRequests({
    main,
    layer: document.createElement('div'),
    isSectionFree,
    start,
    random: () => 0,
  })
}
const aim = (fromX = 100, fromY = 700) => {
  let target: LetterTarget | null | undefined
  letterRequests.request({ type: 'aim', fromX, fromY, reply: (value) => (target = value) })
  return target
}
const block = (id: string) => main.querySelector<HTMLElement>(`#${id}`) as HTMLElement

describe('letter requests (plan 7 §2)', () => {
  it('aims at a glyph in a block near Pip and replies with its centre', () => {
    place(block('far'), 1200, 100)
    place(block('near'), 300, 500)
    listen()
    expect(aim()).toEqual({ x: 305, y: 510, spotId: 1 })
  })

  it('falls back to any free block when none is near, and replies null when none is free', () => {
    place(block('far'), 1200, 100)
    place(block('near'), 1200, 120)
    listen()
    expect(aim()).toMatchObject({ x: 1205, y: 110 })
    stop()
    listen(() => false)
    expect(aim()).toBeNull()
  })

  it('a hit pops the aimed glyph as a `hit` escape; a planned miss starts nothing', () => {
    place(block('far'), 1200, 100)
    place(block('near'), 300, 500)
    listen()
    const target = aim()
    letterRequests.request({ type: 'hit', spotId: target?.spotId ?? 0, missed: true })
    expect(createEscape).not.toHaveBeenCalled()
    const next = aim()
    letterRequests.request({ type: 'hit', spotId: next?.spotId ?? 0, missed: false })
    expect(createEscape).toHaveBeenCalledWith(expect.objectContaining({ kind: 'hit' }))
  })

  it('drops a hit on a glyph that scrolled away or whose section got busy', () => {
    place(block('far'), 1200, 100)
    place(block('near'), 300, 500)
    let isFree = true
    listen(() => isFree)
    const scrolled = aim()
    place(block('near'), 300, 460)
    letterRequests.request({ type: 'hit', spotId: scrolled?.spotId ?? 0, missed: false })
    const busy = aim()
    isFree = false
    letterRequests.request({ type: 'hit', spotId: busy?.spotId ?? 0, missed: false })
    expect(createEscape).not.toHaveBeenCalled()
  })
})
