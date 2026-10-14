import { lazy, Suspense, useCallback, useState, type MouseEvent } from 'react'
import { PressableLink } from '@/components/Pressable/PressableLink'
import { footerCopy } from '@/content/copy'
import { useAmbientMotion } from '@/hooks/useAmbientMotion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { focusHomeLink } from './backToTopScroll'

// The flight is a separate chunk, fetched on the first hover, focus or touch of the button
const BackToTopFlight = lazy(() => import('./BackToTopFlight'))

/**
 * "Back to top" (plan 4 §7.3): a real `#top` link. With JS, at `full` the rocket of dots lifts
 * off and a small phone flies up while the page scrolls with it; at `calm` a smooth scroll; at
 * `off` an instant jump. Focus lands on the home link afterwards in every case.
 */
export function BackToTop() {
  const isAmbient = useAmbientMotion()
  const isReducedMotion = useReducedMotion()
  const [isWanted, setWanted] = useState(false)
  const [flight, setFlight] = useState<{ from: DOMRect } | null>(null)
  const prime = useCallback(() => setWanted(true), [])
  const land = useCallback(() => setFlight(null), [])

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    if (!isAmbient) {
      window.scrollTo({ top: 0, behavior: isReducedMotion ? 'instant' : 'smooth' })
      focusHomeLink()
      return
    }
    setWanted(true)
    setFlight({ from: event.currentTarget.getBoundingClientRect() })
  }

  return (
    <>
      <PressableLink
        href="#top"
        label={footerCopy.backToTop}
        size="compact"
        onClick={onClick}
        onIntent={prime}
      />
      {isWanted && flight && (
        <Suspense fallback={null}>
          <BackToTopFlight from={flight.from} onDone={land} />
        </Suspense>
      )}
    </>
  )
}
