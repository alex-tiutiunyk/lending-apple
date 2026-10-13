import { useId, useRef } from 'react'
import { featuresCopy } from '@/content/copy'
import { chipCores, lenses } from '@/content/specs'
import { useInView } from '@/hooks/useInView'
import { FeatureCard } from './FeatureCard'
import { TitaniumSample } from './TitaniumSample'
import styles from './Features.module.scss'

export function Features() {
  const titleId = useId()
  const sampleRef = useRef<HTMLDivElement>(null)
  const isSampleSeen = useInView(sampleRef, { once: true, threshold: 0.6 })
  const { camera, display, chip, titanium } = featuresCopy

  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
        {featuresCopy.title}
      </h2>
      <div className={styles.grid}>
        <FeatureCard area="camera" title={camera.title}>
          <p className={styles.body}>{camera.body}</p>
          <ul className={styles.lenses} aria-label={camera.lensesLabel}>
            {lenses.map((lens) => (
              <li key={lens.focalLength} className={styles.lens}>
                <span className={styles.focal}>{lens.focalLength}</span>
                <span>{lens.role}</span>
              </li>
            ))}
          </ul>
        </FeatureCard>

        <FeatureCard area="display" title={display.title}>
          <p className={styles.body}>{display.body}</p>
          <div className={styles.brightness} aria-hidden="true">
            <span>1 nit</span>
            <span>3,000 nits</span>
          </div>
        </FeatureCard>

        <FeatureCard area="chip" title={chip.title}>
          <p className={styles.body}>{chip.body}</p>
          <table className={styles.cores}>
            <caption>{chip.tableCaption}</caption>
            <thead>
              <tr>
                <th scope="col">{chip.unitHeader}</th>
                <th scope="col">{chip.coresHeader}</th>
              </tr>
            </thead>
            <tbody>
              {chipCores.map(({ unit, cores }) => (
                <tr key={unit}>
                  <th scope="row">{unit}</th>
                  <td>{cores}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </FeatureCard>

        <FeatureCard area="titanium" title={titanium.title}>
          <p className={styles.body}>{titanium.body}</p>
          <div
            ref={sampleRef}
            className={styles.sample}
            data-sheen={isSampleSeen ? 'run' : undefined}
          >
            <TitaniumSample label={titanium.renderLabel} />
          </div>
        </FeatureCard>
      </div>
    </section>
  )
}
