import { lazy, Suspense, useId, useRef, useSyncExternalStore } from 'react'
import { RevealTitle } from '@/components/RevealTitle/RevealTitle'
import { featuresCopy } from '@/content/copy'
import { chipCores, lenses } from '@/content/specs'
import { useAmbientMotion } from '@/hooks/useAmbientMotion'
import { useInView } from '@/hooks/useInView'
import { BorderPulse } from '@/components/BorderPulse/BorderPulse'
import { BrightnessBar } from './BrightnessBar'
import { FeatureCard } from './FeatureCard'
import { TitaniumSample } from './TitaniumSample'
import styles from './Features.module.scss'

// The lens bug and the scratch counter (plan 5 §5, §11): a chunk most visits at `calm` never see
const FeaturesLife = lazy(() => import('./features-life'))

function subscribeToNothing() {
  return () => undefined
}

export function Features() {
  const titleId = useId()
  const sampleRef = useRef<HTMLDivElement>(null)
  const lensesRef = useRef<HTMLUListElement>(null)
  const isSampleSeen = useInView(sampleRef, { once: true, threshold: 0.6 })
  const isMounted = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  )
  const isAmbient = useAmbientMotion()
  const { camera, display, chip, titanium } = featuresCopy

  return (
    <section className={styles.root} aria-labelledby={titleId}>
      <RevealTitle id={titleId} className={styles.title} text={featuresCopy.title} />
      <div className={styles.grid}>
        <FeatureCard area="camera" title={camera.title} particles="lens">
          <p className={styles.body}>{camera.body}</p>
          <ul ref={lensesRef} className={styles.lenses} aria-label={camera.lensesLabel}>
            {lenses.map((lens, index) => (
              <li key={lens.focalLength} className={styles.lens}>
                <BorderPulse seed={0.25 + index * 0.3} />
                <span className={styles.focal}>{lens.focalLength}</span>
                <span>{lens.role}</span>
              </li>
            ))}
          </ul>
          {isMounted && isAmbient && (
            <Suspense fallback={null}>
              <FeaturesLife lenses={lensesRef} sample={sampleRef} />
            </Suspense>
          )}
        </FeatureCard>

        <FeatureCard area="display" title={display.title} particles="sun">
          <p className={styles.body}>{display.body}</p>
          <BrightnessBar />
        </FeatureCard>

        <FeatureCard area="chip" title={chip.title} particles="chip">
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

        <FeatureCard area="titanium" title={titanium.title} particles="lattice">
          <p className={styles.body}>{titanium.body}</p>
          <div
            ref={sampleRef}
            className={styles.sample}
            data-sheen={isSampleSeen ? 'run' : undefined}
          >
            <TitaniumSample label={titanium.renderLabel} callouts={titanium.callouts} />
          </div>
        </FeatureCard>
      </div>
    </section>
  )
}
