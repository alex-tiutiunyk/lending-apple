import { useEffect, useRef } from 'react'
import { subscribeScrollFrame, subscribeTick, type ScrollFrame } from '@/hooks/frameLoop'
import { isMotionPaused } from '@/hooks/motionPause'
import {
  anchorPointX,
  anchorPointY,
  measureAnchors,
  readAccent,
  type ShapeAnchor,
} from './particleAnchors'
import {
  anchorDocumentY,
  blendWeights,
  createParticles,
  pickAnchor,
  settleAmount,
  type Particle,
} from './particleField'
import styles from './Backdrop.module.scss'

const maxPixelRatio = 2
const compactQuery = '(max-width: 767.98px)'
const particleCount = { compact: 120, wide: 400 }
const wrapMargin = 20
const driftSpeed = 0.35
const formedThreshold = 0.2
const wobbleAmplitude = 1.8
const wobbleFrameGapMs = 30
const easeMs = 140
const settledGap = 0.4

export default function ShapeParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    let particles: Particle[] = []
    let anchors: ShapeAnchor[] = []
    let width = 0
    let height = 0
    let isCompact = false
    let accent = readAccent()
    let lastFrame: ScrollFrame | null = null
    let positions = new Float32Array(0)
    let lastDrawAt = 0
    let isMoving = false
    let isWobbling = false
    let stopTicks: (() => void) | null = null

    const draw = (frame: ScrollFrame) => {
      const now = performance.now()
      const easing = lastDrawAt === 0 ? 1 : 1 - Math.exp(-Math.min(64, now - lastDrawAt) / easeMs)
      lastFrame = frame
      lastDrawAt = now
      const viewportCenter = frame.scrollY + frame.viewportHeight / 2
      const centers = anchors.map((anchor) => anchorDocumentY(anchor, frame.scrollY))
      const settles = centers.map((y) => settleAmount(viewportCenter, y, frame.viewportHeight))
      const weights = blendWeights(settles)
      isWobbling = Math.max(0, ...settles) > formedThreshold && !isMotionPaused()
      const wobble = isWobbling ? wobbleAmplitude : 0
      const wrapHeight = height + wrapMargin * 2
      const settledAlpha = isCompact ? 0.35 : 0.7
      let largestGap = 0

      context.clearRect(0, 0, width, height)
      context.fillStyle = `hsl(${accent})`
      particles.forEach((particle, slot) => {
        const travelled = particle.scatterY * height - frame.scrollY * particle.depth * driftSpeed
        const driftX = particle.scatterX * width
        const driftY = (((travelled % wrapHeight) + wrapHeight) % wrapHeight) - wrapMargin
        const chosen = pickAnchor(particle.pick, weights)
        const anchor = anchors[chosen]
        const settle = settles[chosen] ?? 0
        const shapeX = anchor ? anchorPointX(anchor, slot) : driftX
        const shapeY = anchor
          ? anchorPointY(anchor, slot, (centers[chosen] ?? 0) - frame.scrollY)
          : driftY
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
        context.globalAlpha = (0.1 + particle.depth * 0.3) * (1 - settle) + settledAlpha * settle
        context.beginPath()
        context.arc(x, y, 0.6 + particle.depth * 1.3, 0, Math.PI * 2)
        context.fill()
      })

      isMoving = largestGap > settledGap
      const needsTicks = isMoving || isWobbling
      if (needsTicks && !stopTicks) stopTicks = subscribeTick(onTick)
      else if (!needsTicks && stopTicks) {
        stopTicks()
        stopTicks = null
      }
    }

    const onTick = (time: number) => {
      if (lastFrame && (isMoving || time - lastDrawAt >= wobbleFrameGapMs)) draw(lastFrame)
    }

    const layout = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, maxPixelRatio)
      width = window.innerWidth
      height = window.innerHeight
      isCompact = window.matchMedia(compactQuery).matches
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
      attributeFilter: ['style', 'data-motion-paused'],
    })

    const unsubscribe = subscribeScrollFrame(draw, layout)
    return () => {
      unsubscribe()
      stopTicks?.()
      accentObserver.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} className={styles.particles} />
}
