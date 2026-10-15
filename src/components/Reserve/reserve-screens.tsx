import { useId } from 'react'
import { PhoneLockScreen } from '@/assets/svg/phone-lock-screen'
import { front, roundedRectPath } from '@/assets/svg/phone-geometry'
import { reserveCopy } from '@/content/copy'
import {
  AppleGlassWall,
  AuroraWall,
  NightWall,
  SunriseWall,
  TitaniumWall,
} from './ReserveWallpapers'
import styles from './ReserveScreens.module.scss'

const { screen, island } = front
const screenViewBox = `${screen.x} ${screen.y} ${screen.width} ${screen.height}`

/**
 * The Reserve phone's changing screen (plan 7 §9), a lazy chunk loaded at `full`. An HTML stack
 * over the render's screen: five wallpapers, each its own `<svg>` root cross-fading on a pure CSS
 * cycle, and on top one root that repeats what the render draws over its screen (the lock-screen
 * text with the visitor's clock, the island and the glare), so the stack does not cover them.
 * After a reservation the cycle stops on a sixth picture.
 */
export default function ReserveScreens() {
  const id = useId()

  return (
    <div className={styles.root} aria-hidden="true">
      <div className={styles.walls}>
        <AuroraWall id={`${id}-aurora`} />
        <SunriseWall id={`${id}-dawn`} />
        <NightWall id={`${id}-moon`} />
        <AppleGlassWall id={`${id}-glass`} />
        <TitaniumWall id={`${id}-metal`} />
        <div className={styles.reserved}>
          <span>{reserveCopy.screenReserved}</span>
        </div>
      </div>
      <svg className={styles.top} viewBox={screenViewBox} focusable="false">
        <defs>
          <linearGradient id={`${id}-glare`} x1="0" y1="0" x2="1" y2="0.6">
            <stop offset="0" className={styles.glareOn} />
            <stop offset="0.4" className={styles.glareOff} />
          </linearGradient>
        </defs>
        <PhoneLockScreen />
        <path d={roundedRectPath(island)} className={styles.island} />
        <path d={roundedRectPath(screen)} fill={`url(#${id}-glare)`} />
      </svg>
    </div>
  )
}
