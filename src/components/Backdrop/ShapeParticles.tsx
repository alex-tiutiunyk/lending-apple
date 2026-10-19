import { useEffect, useRef } from 'react'
import {
  readInNextFrame,
  subscribeScrollFrame,
  subscribeTick,
  type ScrollFrame,
} from '@/hooks/frameLoop'
import { isLayoutAtLeast } from '@/hooks/layoutWidth'
import { getA11ySettings } from '@/hooks/a11yStore'
import { particleRequests } from '@/hooks/particleRequests'
import { anchorPointX, anchorPointY, measureAnchors, type ShapeAnchor } from './particleAnchors'
import { readAccent } from './readAccent'
import {
  anchorDocumentY,
  blendWeights,
  createParticles,
  pickAnchor,
  rotatedX,
  rotatedY,
  settleAmount,
  settleAtPageEnd,
  type Particle,
} from './particleField'
import { createTurnTracker } from './particleTurn'
import styles from './Backdrop.module.scss'

// The dots are 0.6–1.9 px and blurry on purpose: a 2× backing store would be four times the
// fill for no visible gain, and a phone gets a 1× one (plan 6 §10)
const maxPixelRatio = { pointer: 1.5, touch: 1 }
const particleCount = { compact: 120, wide: 400 }
const touchQuery = '(hover: none)'
const wrapMargin = 20
const driftSpeed = 0.35
const formedThreshold = 0.2
const wobbleAmplitude = 1.8
const wobbleFrameGapMs = 30
const easeMs = 140
const settledGap = 0.4
const alphaSteps = 12

export default function ShapeParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d', { desynchronized: true })
    if (!canvas || !context) return

    let particles: Particle[] = []
    let anchors: ShapeAnchor[] = []
    let width = 0
    let height = 0
    let isCompact = false
    let accent = readAccent()
    let lastFrame: ScrollFrame | null = null
    let positions = new Float32Array(0)
    let centers = new Float32Array(0)
    let settles = new Float32Array(0)
    let lastDrawAt = 0
    let lastDrawnScrollY = -1
    let isMoving = false
    let isWobbling = false
    let stopTicks: (() => void) | null = null
    let wobbleTimer = 0
    let launch: { index: number; startedAt: number; durationMs: number } | null = null
    const turns = createTurnTracker()

    // A launched shape (plan 4 §7.3) rises off the top of the viewport; as its center leaves,
    // the dots loosen into their drift on their own
    const liftOf = (index: number, now: number, viewportHeight: number) => {
      if (!launch || launch.index !== index) return 0
      const share = Math.min(1, (now - launch.startedAt) / launch.durationMs)
      if (share >= 1) launch = null
      return share * share * viewportHeight * 1.2
    }

    const draw = (frame: ScrollFrame) => {
      const now = performance.now()
      const easing = lastDrawAt === 0 ? 1 : 1 - Math.exp(-Math.min(64, now - lastDrawAt) / easeMs)
      lastFrame = frame
      lastDrawAt = now
      lastDrawnScrollY = frame.scrollY
      const viewportCenter = frame.scrollY + frame.viewportHeight / 2
      // Preallocated per layout, so a scroll frame allocates nothing that outlives it
      if (centers.length !== anchors.length) {
        centers = new Float32Array(anchors.length)
        settles = new Float32Array(anchors.length)
      }
      anchors.forEach((anchor, index) => {
        centers[index] =
          anchorDocumentY(anchor, frame.scrollY) - liftOf(index, now, frame.viewportHeight)
        settles[index] = settleAmount(viewportCenter, centers[index] ?? 0, frame.viewportHeight)
      })
      // The last shape always forms at the page end, except while it is lifting off
      if (!launch)
        settleAtPageEnd(settles, frame.scrollY, frame.viewportHeight, frame.documentHeight)
      const weights = blendWeights(settles)
      turns.update(anchors, frame, easing)
      isWobbling = Math.max(0, ...settles) > formedThreshold && getA11ySettings().motion === 'full'
      const wobble = isWobbling ? wobbleAmplitude : 0
      const wrapHeight = height + wrapMargin * 2
      const settledAlpha = isCompact ? 0.35 : 0.7
      let largestGap = 0
      const layers: Path2D[] = []

      context.clearRect(0, 0, width, height)
      context.fillStyle = `hsl(${accent})`
      particles.forEach((particle, slot) => {
        const travelled = particle.scatterY * height - frame.scrollY * particle.depth * driftSpeed
        const driftX = particle.scatterX * width
        const driftY = (((travelled % wrapHeight) + wrapHeight) % wrapHeight) - wrapMargin
        const chosen = pickAnchor(particle.pick, weights)
        const anchor = anchors[chosen]
        const settle = settles[chosen] ?? 0
        const centerY = (centers[chosen] ?? 0) - frame.scrollY
        const pointX = anchor ? anchorPointX(anchor, slot) : driftX
        const pointY = anchor ? anchorPointY(anchor, slot, centerY) : driftY
        const cos = turns.cosines[chosen] ?? 1
        const sin = turns.sines[chosen] ?? 0
        const shapeX = anchor ? rotatedX(pointX, pointY, anchor.centerX, centerY, cos, sin) : pointX
        const shapeY = anchor ? rotatedY(pointX, pointY, anchor.centerX, centerY, cos, sin) : pointY
        const swayX = Math.sin(now * 0.0011 + particle.phase) * wobble
        const swayY = Math.cos(now * 0.0013 + particle.phase) * wobble
        const goalX = driftX + (shapeX + swayX - driftX) * settle
        const goalY = driftY + (shapeY + swayY - driftY) * settle
        const currentX = positions[slot * 2] ?? goalX
        const currentY = positions[slot * 2 + 1] ?? goalY
        const x = currentX + (goalX - currentX) * easing
        const y = currentY + (goalY - currentY) * easing
        positions[slot * 2] = x
        positions[slot * 2 + 1] = y
        largestGap = Math.max(largestGap, Math.abs(goalX - x), Math.abs(goalY - y))
        const alpha = (0.1 + particle.depth * 0.3) * (1 - settle) + settledAlpha * settle
        const radius = 0.6 + particle.depth * 1.3
        const layer = (layers[Math.round(alpha * alphaSteps)] ??= new Path2D())
        layer.moveTo(x + radius, y)
        layer.arc(x, y, radius, 0, Math.PI * 2)
      })
      layers.forEach((layer, step) => {
        context.globalAlpha = step / alphaSteps
        context.fill(layer)
      })

      isMoving = largestGap > settledGap || turns.remaining > settledGap || launch !== null
      // A formed shape only sways: one redraw every 30 ms on a timer, so the frame loop can
      // sleep in between (plan 6 rule 9); the ticks run only while the dots travel
      if (isMoving && !stopTicks) stopTicks = subscribeTick(onTick)
      else if (!isMoving && stopTicks) {
        stopTicks()
        stopTicks = null
      }
      if (isWobbling && !isMoving && wobbleTimer === 0) {
        wobbleTimer = window.setTimeout(() => {
          wobbleTimer = 0
          if (lastFrame) draw(lastFrame)
        }, wobbleFrameGapMs)
      }
    }

    const onTick = () => {
      if (lastFrame) draw(lastFrame)
    }
    // A scroll frame redraws only when the page actually moved; the ticks cover the rest
    const onScroll = (frame: ScrollFrame) => {
      if (frame.scrollY !== lastDrawnScrollY) draw(frame)
      else lastFrame = frame
    }

    const layout = () => {
      const isTouch = window.matchMedia(touchQuery).matches
      const pixelRatio = Math.min(
        window.devicePixelRatio || 1,
        isTouch ? maxPixelRatio.touch : maxPixelRatio.pointer,
      )
      // The canvas's own box, not the window (plan 11 §4): a backing store that disagrees with
      // the box it is drawn into stretches every dot
      width = canvas.clientWidth
      height = canvas.clientHeight
      // Phones and 2× screens take the compact count whatever their width (plan 6 §10)
      isCompact = !isLayoutAtLeast('md') || isTouch || (window.devicePixelRatio || 1) >= 2
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      const count = isCompact ? particleCount.compact : particleCount.wide
      if (particles.length !== count) {
        particles = createParticles(count)
        positions = new Float32Array(count * 2)
        lastDrawAt = 0
      }
      anchors = measureAnchors(count, isCompact)
    }

    const accentObserver = new MutationObserver(() => {
      accent = readAccent()
      if (lastFrame) draw(lastFrame)
    })
    accentObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'data-motion'],
    })

    const stopRequests = particleRequests.subscribe((request) => {
      const index = anchors.findIndex((anchor) => anchor.shape === request.shape)
      if (index < 0) return false
      launch =
        request.type === 'launch'
          ? { index, startedAt: performance.now(), durationMs: request.durationMs }
          : null
      if (lastFrame) draw(lastFrame)
      return true
    })

    // The box can change without a window resize (the toolbar on iOS, a late stylesheet)
    const boxObserver = new ResizeObserver(([entry]) => {
      const box = entry?.contentBoxSize[0]
      if (!box) return
      if (Math.round(box.inlineSize) === width && Math.round(box.blockSize) === height) return
      readInNextFrame(() => {
        layout()
        if (lastFrame) draw(lastFrame)
      })
    })
    boxObserver.observe(canvas)

    const unsubscribe = subscribeScrollFrame(onScroll, layout)
    return () => {
      unsubscribe()
      boxObserver.disconnect()
      stopTicks?.()
      window.clearTimeout(wobbleTimer)
      stopRequests()
      accentObserver.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} className={styles.particles} />
}
