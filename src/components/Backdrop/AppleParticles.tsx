import { useEffect, useRef } from 'react'
import { appleMarkGridScale, appleMarkPoints } from '@/assets/svg/apple-mark-points'
import { documentTop, subscribeScrollFrame, type ScrollFrame } from '@/hooks/frameLoop'
import { createParticles, settleAmount, type Particle } from './particleField'
import styles from './Backdrop.module.scss'

const maxPixelRatio = 2
const compactQuery = '(max-width: 767.98px)'
const particleCount = { compact: 120, wide: 400 }
const wrapMargin = 20
const driftSpeed = 0.35

function readAccent() {
  const root = document.documentElement
  const computed = getComputedStyle(root)
  const read = (name: string) =>
    root.style.getPropertyValue(name) || computed.getPropertyValue(name)
  return `${read('--accent-h')} ${read('--accent-s')} ${read('--accent-l')}`
}

export default function AppleParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    const finishes = document.getElementById('finishes')
    let particles: Particle[] = []
    let width = 0
    let height = 0
    let isCompact = false
    let finishesCenter = Infinity
    let accent = readAccent()
    let lastFrame: ScrollFrame | null = null

    const draw = (frame: ScrollFrame) => {
      lastFrame = frame
      const viewportCenter = frame.scrollY + frame.viewportHeight / 2
      const settle = settleAmount(viewportCenter, finishesCenter, frame.viewportHeight)
      const markSize = isCompact ? width * 0.82 : Math.min(width * 0.5, height * 0.92)
      const markLeft = (isCompact ? width * 0.5 : width * 0.74) - markSize / 2
      const markTop = height * 0.5 - markSize / 2
      const wrapHeight = height + wrapMargin * 2
      const settledAlpha = isCompact ? 0.35 : 0.7

      context.clearRect(0, 0, width, height)
      context.fillStyle = `hsl(${accent})`
      for (const particle of particles) {
        const travelled = particle.scatterY * height - frame.scrollY * particle.depth * driftSpeed
        const driftX = particle.scatterX * width
        const driftY = (((travelled % wrapHeight) + wrapHeight) % wrapHeight) - wrapMargin
        const x = driftX + (markLeft + particle.targetX * markSize - driftX) * settle
        const y = driftY + (markTop + particle.targetY * markSize - driftY) * settle
        context.globalAlpha = (0.1 + particle.depth * 0.3) * (1 - settle) + settledAlpha * settle
        context.beginPath()
        context.arc(x, y, 0.6 + particle.depth * 1.3, 0, Math.PI * 2)
        context.fill()
      }
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
        particles = createParticles(appleMarkPoints, appleMarkGridScale, count)
      }
      finishesCenter = finishes ? documentTop(finishes) + finishes.offsetHeight / 2 : Infinity
    }

    const accentObserver = new MutationObserver(() => {
      accent = readAccent()
      if (lastFrame) draw(lastFrame)
    })
    accentObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })

    const unsubscribe = subscribeScrollFrame(draw, layout)
    return () => {
      unsubscribe()
      accentObserver.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} className={styles.particles} />
}
