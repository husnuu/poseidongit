import { ArrowRight, MapPin } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import { getYachtUi } from '@/lib/i18n/yachtUi'
import headingStyles from '@/components/yacht/yachtDetailHeading.module.css'
import styles from './YachtRouteSection.module.css'

interface YachtRouteSectionProps {
  routes: string[]
  locale?: SiteLocale
}

export default function YachtRouteSection({ routes, locale = 'tr' }: YachtRouteSectionProps) {
  const ui = getYachtUi(locale)
  const list = routes.map((r) => r.trim()).filter(Boolean)
  if (list.length === 0) return null

  return (
    <section className={styles.section} aria-labelledby="yacht-routes-heading">
      <h2 id="yacht-routes-heading" className={headingStyles.h2}>
        {ui.routeHeading}
      </h2>
      {/* Yatay rota şeridi: duraklar hap şeklinde, aralarında ok; dar
          ekranda alt satıra sarar. Önceki dikey liste 3 durak için ~300px
          yer kaplıyordu. */}
      <ol className={styles.routeStrip}>
        {list.map((text, i) => (
          <li key={`${text}-${i}`} className={styles.routeItem}>
            <span className={styles.routeStop}>
              <span className={styles.routeIndex} aria-hidden>
                {i + 1}
              </span>
              <MapPin className={styles.routePin} strokeWidth={2.2} aria-hidden />
              <span className={styles.routeText}>{text}</span>
            </span>
            {i < list.length - 1 ? (
              <ArrowRight className={styles.routeArrow} strokeWidth={2.2} aria-hidden />
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  )
}
