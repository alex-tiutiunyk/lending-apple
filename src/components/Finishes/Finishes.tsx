import {
  lazy,
  Suspense,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent,
} from 'react'
import { PhoneRender } from '@/assets/svg/phone-render'
import { DecodeText } from '@/components/RevealText/DecodeText'
import { RevealText } from '@/components/RevealText/RevealText'
import { RevealTitle } from '@/components/RevealTitle/RevealTitle'
import { finishesCopy } from '@/content/copy'
import { finishes, type Finish } from '@/content/specs'
import { useAmbientMotion, useAwakeWhileInView } from '@/hooks/useAmbientMotion'
import { useHighContrast } from '@/hooks/useHighContrast'
import {
  applyFinishToPage,
  clearAccent,
  optionStyle,
  swatchColor,
  writeAccent,
} from './finishStyle'
import { chooseFinish, useStoredFinish } from './useStoredFinish'
import styles from './Finishes.module.scss'

// Mini Pips play football with the logo (plan 7 §5): a chunk loaded only at `full`
const FinishesTeam = lazy(() => import('./finishes-team'))

function subscribeToNothing() {
  return () => undefined
}

export function Finishes() {
  const titleId = useId()
  const selectedId = useStoredFinish()
  const [changeCount, setChangeCount] = useState(0)
  const renderRef = useRef<SVGSVGElement>(null)
  useAwakeWhileInView(renderRef)
  const isMounted = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  )
  const isAmbient = useAmbientMotion()
  const isHighContrast = useHighContrast()
  const hasTeam = isMounted && isAmbient && !isHighContrast
  const selected = finishes.find(({ id }) => id === selectedId) ?? finishes[0]
  const tiltClassName = changeCount % 2 === 1 ? styles.renderTiltOdd : styles.renderTiltEven

  const selectFinish = (finish: Finish) => {
    chooseFinish(finish.id)
    setChangeCount((count) => count + 1)
    applyFinishToPage(finish)
  }

  // A hovered or focused option previews its finish on the render alone (plan 5 §10): the
  // render declares its own finish tokens, so a local accent reaches its gradients and never
  // the page, which still follows a pick only
  const previewFinish = (finish: Finish | null) => {
    const render = renderRef.current
    if (!render) return
    if (!finish) {
      clearAccent(render.style)
      render.removeAttribute('data-preview')
      return
    }
    writeAccent(render.style, finish)
    render.setAttribute('data-preview', '')
  }
  const onPointerEnter = (finish: Finish) => (event: PointerEvent) => {
    if (event.pointerType !== 'touch') previewFinish(finish)
  }

  return (
    <section id="finishes" className={styles.root} aria-labelledby={titleId}>
      <div className={styles.copy}>
        <RevealTitle id={titleId} className={styles.title} text={finishesCopy.title} />
        <RevealText className={styles.body} isDelayed>
          {finishesCopy.body}
        </RevealText>
        <fieldset className={styles.picker}>
          <legend className={styles.legend}>
            <DecodeText text={finishesCopy.legend} />
          </legend>
          {finishes.map((finish) => (
            <label
              key={finish.id}
              className={styles.option}
              style={optionStyle(finish) as CSSProperties}
              onPointerEnter={onPointerEnter(finish)}
              onPointerLeave={() => previewFinish(null)}
            >
              <input
                className={styles.radio}
                type="radio"
                name="finish"
                value={finish.id}
                checked={finish.id === selectedId}
                onChange={() => selectFinish(finish)}
                onFocus={() => previewFinish(finish)}
                onBlur={() => previewFinish(null)}
              />
              <span className={styles.swatchWrap}>
                <svg
                  className={styles.swatch}
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                  focusable="false"
                >
                  <circle cx="10" cy="10" r="9" fill={swatchColor(finish)} />
                </svg>
              </span>
              <span className={styles.optionName}>{finish.name}</span>
              <span className={styles.optionNote}>{finish.note}</span>
            </label>
          ))}
        </fieldset>
      </div>
      {/* The glow is a gradient behind the render, not a filter on it (plan 6 §8) */}
      <div className={styles.renderFrame}>
        <span className={styles.renderGlow} aria-hidden="true" />
        <PhoneRender
          ref={renderRef}
          view="back"
          particles="apple"
          className={changeCount === 0 ? styles.render : `${styles.render} ${tiltClassName}`}
          label={`${finishesCopy.renderLabel} ${selected.name}`}
        />
        {hasTeam && (
          <Suspense fallback={null}>
            <FinishesTeam render={renderRef} />
          </Suspense>
        )}
      </div>
    </section>
  )
}
