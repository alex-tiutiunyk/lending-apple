import { useEffect, useRef } from 'react'
import { a11yCopy } from '@/content/copy'
import { effectiveSettings, type MotionLevel, textScales, type Theme } from '@/hooks/a11ySettings'
import {
  resetA11ySettings,
  updateA11ySettings,
  useA11ySettings,
  useSettingsRemembered,
} from '@/hooks/a11yStore'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useSystemReducedMotion } from '@/hooks/useReducedMotion'
import { Choice, Segmented, TextSize } from './PanelControls'
import styles from './A11yPanel.module.scss'

type A11yPanelBodyProps = {
  focusRequest: number
  announce: (message: string) => void
}

const motionLevels: MotionLevel[] = ['full', 'calm', 'off']
const themes: Theme[] = ['dark', 'light']

export default function A11yPanelBody({ focusRequest, announce }: A11yPanelBodyProps) {
  const settings = useA11ySettings()
  const isRemembered = useSettingsRemembered()
  const isReducedMotion = useSystemReducedMotion()
  const isMoreContrast = useMediaQuery('(prefers-contrast: more)')
  const effective = effectiveSettings(settings, { isReducedMotion, isMoreContrast })
  const firstControl = useRef<HTMLDivElement>(null)
  const scaleIndex = textScales.indexOf(settings.textScale)

  useEffect(() => {
    if (focusRequest > 0)
      firstControl.current?.querySelector<HTMLInputElement>('input:checked')?.focus()
  }, [focusRequest])

  const stepText = (direction: -1 | 1) => {
    const next = textScales[scaleIndex + direction]
    if (next === undefined) return
    updateA11ySettings({ textScale: next })
    announce(a11yCopy.announce.text(next))
  }

  const toggle = (key: 'spacing' | 'font' | 'links' | 'pip', label: string) => (isOn: boolean) => {
    updateA11ySettings({ [key]: isOn })
    announce(a11yCopy.announce.toggle(label, isOn))
  }

  return (
    <div className={styles.body}>
      <div ref={firstControl}>
        <Segmented
          legend={a11yCopy.motion.legend}
          name="a11y-motion"
          options={motionLevels.map((level) => ({
            value: level,
            label: a11yCopy.motion.levels[level],
            isDisabled: false,
          }))}
          value={effective.motion}
          onChange={(level) => {
            // A level picked while the OS asks for reduced motion overrides it
            updateA11ySettings({
              motion: level,
              motionOverride: isReducedMotion && level !== 'off',
            })
            announce(a11yCopy.announce.motion(a11yCopy.motion.levels[level]))
          }}
          note={isReducedMotion ? a11yCopy.systemMotion : a11yCopy.motion.note}
        />
      </div>

      <TextSize
        scale={settings.textScale}
        canShrink={scaleIndex > 0}
        canGrow={scaleIndex < textScales.length - 1}
        onStep={stepText}
      />

      <Segmented
        legend={a11yCopy.theme.legend}
        name="a11y-theme"
        options={themes.map((theme) => ({
          value: theme,
          label: a11yCopy.theme.levels[theme],
          isDisabled: false,
        }))}
        value={settings.theme}
        onChange={(theme) => {
          updateA11ySettings({ theme })
          announce(a11yCopy.announce.theme(a11yCopy.theme.levels[theme]))
        }}
        note={null}
      />

      <Segmented
        legend={a11yCopy.contrast.legend}
        name="a11y-contrast"
        options={(['standard', 'high'] as const).map((level) => ({
          value: level,
          label: a11yCopy.contrast.levels[level],
          isDisabled: false,
        }))}
        value={effective.contrast}
        onChange={(level) => {
          updateA11ySettings({ contrast: level })
          announce(a11yCopy.announce.contrast(a11yCopy.contrast.levels[level]))
        }}
        note={isMoreContrast ? a11yCopy.systemContrast : null}
      />

      <fieldset className={styles.group}>
        <legend className={styles.legend}>{a11yCopy.reading.legend}</legend>
        <Choice
          label={a11yCopy.reading.spacing}
          isOn={settings.spacing}
          onChange={toggle('spacing', a11yCopy.reading.spacing)}
        />
        <Choice
          label={a11yCopy.reading.font}
          isOn={settings.font}
          onChange={toggle('font', a11yCopy.reading.font)}
        />
        <Choice
          label={a11yCopy.reading.links}
          isOn={settings.links}
          onChange={toggle('links', a11yCopy.reading.links)}
        />
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>{a11yCopy.pip.legend}</legend>
        <Choice
          label={a11yCopy.pip.show}
          isOn={settings.pip}
          onChange={toggle('pip', a11yCopy.pip.legend)}
        />
      </fieldset>

      <button
        type="button"
        className={styles.reset}
        onClick={() => {
          resetA11ySettings()
          announce(a11yCopy.announce.reset)
        }}
      >
        {a11yCopy.reset}
      </button>
      {!isRemembered && <p className={styles.note}>{a11yCopy.notRemembered}</p>}
    </div>
  )
}
