import { useEffect, useRef, type RefObject } from 'react'
import { Bug } from '@/assets/svg/bug'
import { subscribePointerFrame, subscribeTick, write } from '@/hooks/frameLoop'
import { createLensBugWalk } from './lensBugWalk'
import { buildRoute, type Rect } from './lensBugRoute'
import styles from './LensBug.module.scss'

type LensBugProps = {
  /** The lens list; its children are the boxes the bug walks on. */
  lenses: RefObject<HTMLElement | null>
}

/**
 * A bug that walks the borders of the lens boxes (plan 5 §5): one route around all three, a
 * hop over each gap, random pauses to look around, the box under it brightening, and a hurry
 * to the next box when the pointer is over the one it is on. Ticks only while the card is awake.
 */
export function LensBug({ lenses }: LensBugProps) {
  const layerRef = useRef<HTMLSpanElement>(null)
  const bugRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const list = lenses.current
    const layer = layerRef.current
    const bug = bugRef.current
    const card = layer?.parentElement
    if (!list || !layer || !bug || !card) return

    const boxes = Array.from(list.children).filter((child) => child instanceof HTMLElement)
    const art = bug.firstElementChild
    const walk = createLensBugWalk(Math.random)
    let currentBox = -1

    const measure = () => {
      const origin = layer.getBoundingClientRect()
      const rects: Rect[] = boxes.map((box) => {
        const rect = box.getBoundingClientRect()
        return {
          left: rect.left - origin.left,
          top: rect.top - origin.top,
          width: rect.width,
          height: rect.height,
        }
      })
      walk.setRoute(buildRoute(rects))
    }
    const sizeObserver = new ResizeObserver(measure)
    sizeObserver.observe(list)
    measure()

    const onTick = (time: number) => {
      const frame = walk.step(time)
      if (!frame) return
      const leftBox = frame.box === currentBox ? null : boxes[currentBox]
      const enteredBox = frame.box === currentBox ? null : boxes[frame.box]
      currentBox = frame.box
      // The tick reads nothing, but its writes still wait for the write phase (plan 6 §5)
      write(() => {
        bug.style.translate = `${frame.x.toFixed(1)}px ${frame.y.toFixed(1)}px`
        bug.style.rotate = `${frame.angle.toFixed(1)}deg`
        bug.toggleAttribute('data-hop', frame.isHop)
        art?.toggleAttribute('data-walking', frame.isWalking)
        leftBox?.removeAttribute('data-bug')
        enteredBox?.setAttribute('data-bug', '')
      })
    }
    const onPointer = ({ target }: { target: Element | null }) => {
      const over = boxes.findIndex((box) => !!target && box.contains(target))
      if (over >= 0 && over === currentBox) walk.hurry(over)
    }

    let stopTicks: (() => void) | null = null
    let stopPointer: (() => void) | null = null
    const stop = () => {
      stopTicks?.()
      stopPointer?.()
      stopTicks = null
      stopPointer = null
    }
    const sync = () => {
      const isAwake = card.hasAttribute('data-awake')
      if (isAwake && !stopTicks) {
        stopTicks = subscribeTick(onTick)
        stopPointer = subscribePointerFrame(onPointer)
      } else if (!isAwake) {
        stop()
      }
    }
    const awakeObserver = new MutationObserver(sync)
    awakeObserver.observe(card, { attributes: true, attributeFilter: ['data-awake'] })
    sync()

    return () => {
      stop()
      sizeObserver.disconnect()
      awakeObserver.disconnect()
      boxes[currentBox]?.removeAttribute('data-bug')
    }
  }, [lenses])

  return (
    <span ref={layerRef} className={styles.root} aria-hidden="true">
      <span ref={bugRef} className={styles.bug}>
        <Bug />
      </span>
    </span>
  )
}
