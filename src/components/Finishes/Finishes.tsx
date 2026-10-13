import { useId, useState } from 'react'
import { PhoneRender } from '@/assets/svg/phone-render'
import { RevealTitle } from '@/components/RevealTitle/RevealTitle'
import { finishesCopy } from '@/content/copy'
import { finishes, type Finish, type FinishId } from '@/content/specs'
import styles from './Finishes.module.scss'

function applyFinishToPage({ hue, saturation, lightness }: Finish) {
  const root = document.documentElement.style
  root.setProperty('--accent-h', String(hue))
  root.setProperty('--accent-s', `${saturation}%`)
  root.setProperty('--accent-l', `${lightness}%`)
}

function swatchColor({ hue, saturation, lightness }: Finish) {
  return `hsl(${hue} ${saturation}% ${lightness}%)`
}

export function Finishes() {
  const titleId = useId()
  const [selectedId, setSelectedId] = useState<FinishId>(finishes[0].id)
  const [changeCount, setChangeCount] = useState(0)
  const selected = finishes.find(({ id }) => id === selectedId) ?? finishes[0]
  const tiltClassName = changeCount % 2 === 1 ? styles.tiltOdd : styles.tiltEven

  const selectFinish = (finish: Finish) => {
    setSelectedId(finish.id)
    setChangeCount((count) => count + 1)
    applyFinishToPage(finish)
  }

  return (
    <section id="finishes" className={styles.section} aria-labelledby={titleId}>
      <div className={styles.copy}>
        <RevealTitle id={titleId} className={styles.title} text={finishesCopy.title} />
        <p className={styles.body}>{finishesCopy.body}</p>
        <fieldset className={styles.picker}>
          <legend className={styles.legend}>{finishesCopy.legend}</legend>
          {finishes.map((finish) => (
            <label key={finish.id} className={styles.option}>
              <input
                className={styles.radio}
                type="radio"
                name="finish"
                value={finish.id}
                checked={finish.id === selectedId}
                onChange={() => selectFinish(finish)}
              />
              <svg
                className={styles.swatch}
                viewBox="0 0 20 20"
                aria-hidden="true"
                focusable="false"
              >
                <circle cx="10" cy="10" r="9" fill={swatchColor(finish)} />
              </svg>
              <span className={styles.optionName}>{finish.name}</span>
              <span className={styles.optionNote}>{finish.note}</span>
            </label>
          ))}
        </fieldset>
      </div>
      <PhoneRender
        view="back"
        particles="apple"
        className={changeCount === 0 ? styles.render : `${styles.render} ${tiltClassName}`}
        label={`${finishesCopy.renderLabel} ${selected.name}`}
      />
    </section>
  )
}
