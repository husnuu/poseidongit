import { MapPin, Navigation } from 'lucide-react'
import headingStyles from '@/components/yacht/yachtDetailHeading.module.css'
import styles from './YachtRouteSection.module.css'

interface YachtRouteSectionProps {
  routes: string[]
}

export default function YachtRouteSection({ routes }: YachtRouteSectionProps) {
  const list = routes.map((r) => r.trim()).filter(Boolean)
  if (list.length === 0) return null

  return (
    <section className={styles.section} aria-labelledby="yacht-routes-heading">
      <h2 id="yacht-routes-heading" className={headingStyles.h2}>
        Rota önerileri
      </h2>
      <ol className={styles.journey}>
        {list.map((text, i) => (
          <li key={`${text}-${i}`} className={styles.leg}>
            <div className={styles.stop}>
              <span className={styles.pinWrap} aria-hidden>
                <MapPin className={styles.pin} strokeWidth={2} />
              </span>
              <span className={styles.stopText}>{text}</span>
            </div>
            {i < list.length - 1 ? (
              <div className={styles.connector} aria-hidden>
                <span className={styles.connectorLine} />
                <span className={styles.navWrap}>
                  <Navigation className={styles.navIcon} strokeWidth={2} />
                </span>
                <span className={styles.connectorLine} />
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  )
}
