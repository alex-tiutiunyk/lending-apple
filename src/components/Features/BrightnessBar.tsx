import { featuresCopy } from '@/content/copy'
import styles from './Features.module.scss'

const rays = Array.from({ length: 8 }, (_, index) => index * 45)

/**
 * The display card's brightness pill (plan 7 §12). While the card is awake at `full`, a sun slides
 * from "1 nit" to "3,000 nits" and back, the bright part of the gradient grows with it and the
 * high label flashes white at the end. Everything moves by `transform` and `opacity`: the sun
 * rides a wrapper translated by a share of its own width, and the flash is a white copy of the
 * label fading in, not a colour animation. At rest, `calm` and `off` the sun sits at the end.
 */
export function BrightnessBar() {
  const { low, high } = featuresCopy.display.brightness

  return (
    <div className={styles.brightness} aria-hidden="true">
      <span className={styles.brightnessFill} />
      <span className={styles.brightnessTrack}>
        <span className={styles.brightnessSun}>
          <span className={styles.brightnessGlow} />
          <svg className={styles.brightnessRays} viewBox="-8 -8 16 16" focusable="false">
            {rays.map((angle) => (
              <line key={angle} x1="0" y1="-5.2" x2="0" y2="-7.2" transform={`rotate(${angle})`} />
            ))}
          </svg>
          <span className={styles.brightnessDisc} />
        </span>
      </span>
      <span className={styles.brightnessLow}>{low}</span>
      <span className={styles.brightnessHigh}>
        {high}
        <span className={styles.brightnessFlash}>{high}</span>
      </span>
    </div>
  )
}
