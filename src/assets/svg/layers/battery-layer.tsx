import { layerViewBox, roundedRectPath } from '../phone-geometry'
import { layerShapes } from './layer-geometry'
import { Bracket, CrossScrew } from './small-parts'
import styles from './layers.module.scss'

const { battery, hapticMotor, speaker } = layerShapes
const cellSeams = [0.34, 0.67].map((share) => battery.y + battery.height * share)
const pullTabs = [battery.x + 18, battery.x + battery.width - 30]
const speakerSlots = Array.from({ length: 7 }, (_, index) => speaker.x + 8 + index * 7)

export function BatteryLayer() {
  return (
    <svg className={styles.layer} viewBox={layerViewBox} aria-hidden="true" focusable="false">
      <path d={roundedRectPath(battery)} className={styles.cell} />
      {cellSeams.map((y) => (
        <line
          key={y}
          x1={battery.x + 10}
          x2={battery.x + battery.width - 10}
          y1={y}
          y2={y}
          className={styles.seam}
        />
      ))}
      {pullTabs.map((x) => (
        <rect
          key={x}
          x={x}
          y={battery.y + battery.height - 3}
          width={12}
          height={10}
          rx={1.5}
          className={styles.pullTab}
        />
      ))}
      <path
        d={`M${battery.x + battery.width - 24} ${battery.y + 2} V${battery.y - 6} H${battery.x + battery.width + 4}`}
        className={styles.flex}
      />
      <path d={roundedRectPath(hapticMotor)} className={styles.motor} />
      <line
        x1={hapticMotor.x + hapticMotor.width / 2}
        x2={hapticMotor.x + hapticMotor.width / 2}
        y1={hapticMotor.y + 8}
        y2={hapticMotor.y + hapticMotor.height - 8}
        className={styles.seam}
      />
      <path d={roundedRectPath(speaker)} className={styles.motor} />
      {speakerSlots.map((x) => (
        <rect
          key={x}
          x={x}
          y={speaker.y + 6}
          width={3}
          height={8}
          rx={1.5}
          className={styles.port}
        />
      ))}
      <Bracket
        slot={0}
        x={battery.x + battery.width - 32}
        y={battery.y - 10}
        width={26}
        height={8}
      />
      <CrossScrew slot={1} x={hapticMotor.x + hapticMotor.width / 2} y={hapticMotor.y - 5} />
      <CrossScrew slot={2} x={speaker.x + speaker.width + 6} y={speaker.y + speaker.height / 2} />
    </svg>
  )
}
