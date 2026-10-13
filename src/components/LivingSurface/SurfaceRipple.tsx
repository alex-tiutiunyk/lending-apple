import styles from './LivingSurface.module.scss'

const surfaceRippleId = 'surface-ripple'

export function SurfaceRipple() {
  return (
    <svg className={styles.defs} aria-hidden="true" focusable="false">
      <filter id={surfaceRippleId} x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="2" seed="7" />
        <feDisplacementMap in="SourceGraphic" scale="16" result="rippled" />
        <feGaussianBlur in="rippled" stdDeviation="2.4" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="rippled" />
        </feMerge>
      </filter>
    </svg>
  )
}

export function SurfaceLens() {
  return (
    <span className={styles.lens} aria-hidden="true">
      <span className={styles.lensWaves} />
    </span>
  )
}
