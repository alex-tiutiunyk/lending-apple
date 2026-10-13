import { layerViewBox, roundedRectPath } from '../phone-geometry'
import { layerShapes } from './layer-geometry'
import { AntennaClip, PentalobeScrew } from './small-parts'
import styles from './layers.module.scss'

const { body, band, vaporChamber } = layerShapes
const bottom = body.y + body.height
const antennaBreaks = [
  `M${body.x} ${body.y + 46} h4`,
  `M${body.x} ${bottom - 48} h4`,
  `M${body.x + body.width - 4} ${body.y + 46} h4`,
  `M${body.x + body.width - 4} ${bottom - 48} h4`,
  `M${body.x + 50} ${bottom - 4} v4`,
  `M${body.x + body.width - 50} ${bottom - 4} v4`,
]
const chamberRibs = [0.25, 0.5, 0.75].map((share) => vaporChamber.y + vaporChamber.height * share)
const grilleHoles = Array.from({ length: 6 }, (_, index) => 127 + index * 5)
const buttonStubs = [
  { x: body.x - 2, y: 78, height: 16 },
  { x: body.x - 2, y: 108, height: 30 },
  { x: body.x - 2, y: 144, height: 30 },
  { x: body.x + body.width - 1.5, y: 120, height: 46 },
  { x: body.x + body.width - 1.5, y: 218, height: 26 },
]

export function FrameLayer() {
  return (
    <svg className={styles.layer} viewBox={layerViewBox} aria-hidden="true" focusable="false">
      <path d={roundedRectPath(band)} className={styles.band} />
      <path d={roundedRectPath(body)} className={styles.bandEdge} />
      {antennaBreaks.map((d) => (
        <path key={d} d={d} className={styles.antennaBreak} />
      ))}
      {buttonStubs.map(({ x, y, height }) => (
        <rect
          key={y + x}
          x={x}
          y={y}
          width={3.5}
          height={height}
          rx={1.4}
          className={styles.stub}
        />
      ))}
      <path d={roundedRectPath(vaporChamber)} className={styles.vaporChamber} />
      {chamberRibs.map((y) => (
        <line
          key={y}
          x1={vaporChamber.x + 8}
          x2={vaporChamber.x + vaporChamber.width - 8}
          y1={y}
          y2={y}
          className={styles.seam}
        />
      ))}
      <rect x={77} y={bottom - 6} width={26} height={5} rx={2.5} className={styles.port} />
      {grilleHoles.map((x) => (
        <circle key={x} cx={x} cy={bottom - 3.5} r={1.1} className={styles.port} />
      ))}
      <PentalobeScrew slot={0} x={68} y={bottom - 3.5} />
      <PentalobeScrew slot={1} x={112} y={bottom - 3.5} />
      <AntennaClip slot={2} x={body.x + 9} y={body.y + 60} />
    </svg>
  )
}
