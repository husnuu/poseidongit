import styles from './PoseidonSecure.module.css'
import { ShieldCheck } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import { getPoseidonSecureStrings } from '@/lib/i18n/strings/poseidonSecure'

export type PoseidonSecureLayout = 'fullBleed' | 'contained'

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
            <ShieldCheck size={32} strokeWidth={2} className={styles.shieldIcon} aria-hidden />
            <span className={styles.logoText}>
              <span className={styles.logoBold}>Poseidon</span>
              <span className={styles.logoAccent}>Secure</span>
            </span>
          </div>

          <p className={styles.description}>
            {t.beforeStrong}
            <strong>{t.strong}</strong>
            {t.afterStrong}
          </p>
        </div>
      </div>
    </section>
  )
}
