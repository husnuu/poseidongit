import styles from './PoseidonSecure.module.css'
import { ShieldCheck, Undo2, CloudSun } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import { getPoseidonSecureStrings, type PoseidonSecureBadge } from '@/lib/i18n/strings/poseidonSecure'

export type PoseidonSecureLayout = 'fullBleed' | 'contained'

const BADGE_ICON: Record<PoseidonSecureBadge['icon'], typeof Undo2> = {
  refund: Undo2,
  weather: CloudSun,
}

export default function PoseidonSecure({
  locale = 'tr',
  layout = 'fullBleed',
}: {
  locale?: SiteLocale
  /** fullBleed: kenardan kenara şerit (ana sayfa). contained: üst kolon genişliğinde (tur sayfası). */
  layout?: PoseidonSecureLayout
}) {
  const t = getPoseidonSecureStrings(locale)
  const sectionClass = layout === 'contained' ? styles.contained : styles.fullBleed
  const shellClass = layout === 'contained' ? styles.shellContained : styles.maxWidth
  const innerClass = layout === 'contained' ? styles.innerContained : styles.inner
  return (
    <section className={sectionClass} aria-label={t.ariaLabel}>
      <div className={shellClass}>
        <div className={innerClass}>
          <div className={styles.logoRow}>
            <ShieldCheck size={19} strokeWidth={2} className={styles.shieldIcon} aria-hidden />
            <span className={styles.logoText}>
              <span className={styles.logoBold}>Poseidon</span>
              <span className={styles.logoAccent}>Secure</span>
            </span>
          </div>

          {/* İki garanti artık düz metnin içine gömülü değil, taranabilir ayrı
              rozetler — sitenin geri kalanındaki ikon+etiket diliyle (FeatureBar,
              Öne Çıkanlar) tutarlı. */}
          <div className={styles.badgesRow}>
            {t.badges.map((badge) => {
              const Icon = BADGE_ICON[badge.icon]
              return (
                <span key={badge.icon} className={styles.badge}>
                  <span className={styles.badgeIconWrap} aria-hidden>
                    <Icon size={15} strokeWidth={2.25} />
                  </span>
                  <span className={styles.badgeLabel}>{badge.label}</span>
                </span>
              )
            })}
          </div>

          <p className={styles.description}>{t.description}</p>
        </div>
      </div>
    </section>
  )
}
