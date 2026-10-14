import type { SiteLocale } from '@/lib/i18n/config'
import { getTourPageUi } from '@/lib/i18n/tourPageUi'
import styles from './DemandNotice.module.css'

interface DemandNoticeProps {
  locale?: SiteLocale
  className?: string
  /** `card` (varsayılan): amber kutu — masaüstü sidebar kartı.
      `compact`: tek satırlık ince şerit, kutu/kenarlık yok — mobilde meta
      satırlarının arasına; kart mobilde fazla yer kaplayıp hantal duruyordu. */
  variant?: 'card' | 'compact'
}

/** "Bu tur için talepler yoğun / Erken rezervasyon önerilir".
    Metinler tourPageUi'den (4 dil) — her iki varyant aynı metni kullanır,
    böylece metin tek kaynaktan. */
export default function DemandNotice({ locale = 'tr', className = '', variant = 'card' }: DemandNoticeProps) {
  const ui = getTourPageUi(locale)
  if (variant === 'compact') {
    return (
      <p className={`${styles.compact} ${className}`} role="note" aria-label={ui.stickyDemandAria}>
        <span className={styles.demandIcon} aria-hidden />
        <span className={styles.compactTitle}>{ui.stickyDemandTitle}</span>
        <span className={styles.compactSep} aria-hidden>·</span>
        <span className={styles.compactSubtitle}>{ui.stickyDemandSubtitle}</span>
      </p>
    )
  }
  return (
    <div className={`${styles.demand} ${className}`} role="note" aria-label={ui.stickyDemandAria}>
      <span className={styles.demandIcon} aria-hidden />
      <div className={styles.demandText}>
        <p className={styles.demandTitle}>{ui.stickyDemandTitle}</p>
        <p className={styles.demandSubtitle}>{ui.stickyDemandSubtitle}</p>
      </div>
    </div>
  )
}
