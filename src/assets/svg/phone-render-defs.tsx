import type { RenderIds } from './phone-render-ids'
import styles from './phone-render.module.scss'

/** The shell, screen, glare and lens gradients of `PhoneRender`; the stop colours are CSS. */
export function PhoneRenderDefs({ ids }: { ids: RenderIds }) {
  return (
    <defs>
      <linearGradient id={ids.shell} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" className={styles.shellLight} />
        <stop offset="0.55" className={styles.shellMid} />
        <stop offset="1" className={styles.shellDark} />
      </linearGradient>
      <linearGradient id={ids.screen} x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0" className={styles.screenA} />
        <stop offset="1" className={styles.screenB} />
      </linearGradient>
      <linearGradient id={ids.glare} x1="0" y1="0" x2="1" y2="0.6">
        <stop offset="0" className={styles.glareOn} />
        <stop offset="0.4" className={styles.glareOff} />
      </linearGradient>
      <radialGradient id={ids.lens} cx="0.4" cy="0.35" r="0.7">
        <stop offset="0" className={styles.lensHighlight} />
        <stop offset="0.5" className={styles.lensDeep} />
      </radialGradient>
    </defs>
  )
}
