import styles from './PoseidonSecure.module.css'
import { BadgeCheck, ShieldCheck, Undo2, CloudSun } from 'lucide-react'
import { getAboutPageUiStrings } from '@/lib/i18n/strings/aboutPage'
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
  const split = layout !== 'contained'
  const sectionClass = layout === 'contained' ? styles.contained : styles.fullBleed
  const shellClass = layout === 'contained' ? styles.shellContained : styles.maxWidth
  // Anasayfa varyantında üçüncü güvence: sitede zaten yer alan lisans/üyelik
  // bilgisi (Hakkımızda sayfasındaki güven maddesiyle aynı metin).
  const about = getAboutPageUiStrings(locale)
  const items = [
    ...t.badges.map((b) => ({ key: b.icon, Icon: BADGE_ICON[b.icon], label: b.label, body: b.body })),
    ...(split
      ? [{ key: 'licensed', Icon: BadgeCheck, label: about.trustGridLicensedTitle, body: about.trustGridLicensedBody }]
      : []),
  ]
  return (
    <section className={sectionClass} aria-label={t.ariaLabel}>
      {split && <ShieldCheck className={styles.watermark} strokeWidth={1} aria-hidden />}
      <div className={shellClass}>
        <div className={`${styles.panel} ${split ? styles.panelSplit : ''}`}>
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
          <div className={`${styles.cards} ${split ? styles.cardsSplit : ''}`}>
            {items.map(({ key, Icon, label, body }) => (
              <div key={key} className={styles.card}>
                <span className={styles.cardIconWrap} aria-hidden>
                  <Icon size={split ? 22 : 19} strokeWidth={2} />
                </span>
                <div className={styles.cardText}>
                  <p className={styles.cardTitle}>{label}</p>
                  <p className={styles.cardBody}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
