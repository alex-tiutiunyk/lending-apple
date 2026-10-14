import { useEffect, useRef, useState } from 'react'
import { subscribeTick } from '@/hooks/frameLoop'
import { useAmbientMotion } from '@/hooks/useAmbientMotion'
import { useInView } from '@/hooks/useInView'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { decodeFrame, decodeMs } from './decodeFrame'
import styles from './RevealText.module.scss'

const frameStepMs = 40

type DecodeTextProps = {
  text: string
  durationMs?: number
  /** `reveal` plays once on entry unless motion is off; `ambient` also goes instant at "calm". */
  level?: 'reveal' | 'ambient'
}

/**
 * Mono label that decodes once on entry; the real text stays in the DOM for screen readers.
 * To decode again for a new text, remount it with `key={text}` (the header label, plan 4 §2.3).
 */
export function DecodeText({ text, durationMs = decodeMs, level = 'reveal' }: DecodeTextProps) {
  const rootRef = useRef<HTMLSpanElement>(null)
  const overlayRef = useRef<HTMLSpanElement>(null)
  const isSeen = useInView(rootRef, { once: true, threshold: 1 })
  const isReducedMotion = useReducedMotion()
  const isAmbient = useAmbientMotion()
  const isInstant = level === 'ambient' ? !isAmbient : isReducedMotion
  const [phase, setPhase] = useState<'waiting' | 'running' | 'done'>('waiting')

  useEffect(() => {
    if (isSeen && phase === 'waiting') setPhase(isInstant ? 'done' : 'running')
  }, [isSeen, isInstant, phase])

  useEffect(() => {
    const overlay = overlayRef.current
    if (phase !== 'running' || !overlay) return
    let startedAt: number | null = null
    let drawnAt = -Infinity

    const stop = subscribeTick((time) => {
      startedAt ??= time
      const elapsed = time - startedAt
      if (elapsed >= durationMs) {
        stop()
        setPhase('done')
        return
      }
      if (time - drawnAt < frameStepMs) return
      drawnAt = time
      overlay.textContent = decodeFrame(text, elapsed, Math.random, durationMs)
    })
    return stop
  }, [phase, text, durationMs])

  return (
    <span
      ref={rootRef}
      className={styles.decode}
      data-decoding={phase === 'running' ? '' : undefined}
    >
      <span className={styles.decodeText}>{text}</span>
      {phase === 'running' && (
        <span ref={overlayRef} className={styles.decodeOverlay} aria-hidden="true">
          {text}
        </span>
      )}
    </span>
  )
}
