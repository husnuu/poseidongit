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
  return (
    <section className={sectionClass} aria-label={t.ariaLabel}>
      <div className={shellClass}>
        <div className={styles.panel}>
          <div className={styles.intro}>
            <div className={styles.logoRow}>
              <ShieldCheck strokeWidth={2} className={styles.shieldIcon} aria-hidden />
              <span className={styles.logoText}>
                <span className={styles.logoBold}>Poseidon</span>
                <span className={styles.logoAccent}>Secure</span>
              </span>
            </div>
            <p className={styles.description}>{t.description}</p>
          </div>

          {/* Her garanti ayrı bir kart: ikon + başlık + açıklama. */}
          <div className={styles.cards}>
            {t.badges.map((badge) => {
              const Icon = BADGE_ICON[badge.icon]
              return (
                <div key={badge.icon} className={styles.card}>
                  <span className={styles.cardIconWrap} aria-hidden>
                    <Icon size={19} strokeWidth={2} />
                  </span>
                  <p className={styles.cardTitle}>{badge.label}</p>
                  <p className={styles.cardBody}>{badge.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
