import styles from './PoseidonSecure.module.css'
import { ShieldCheck } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import { getPoseidonSecureStrings } from '@/lib/i18n/strings/poseidonSecure'

export default function PoseidonSecure({ locale = 'tr' }: { locale?: SiteLocale }) {
  const t = getPoseidonSecureStrings(locale)
  return (
    <section className={styles.fullBleed} aria-label={t.ariaLabel}>
      <div className={styles.maxWidth}>
        <div className={styles.inner}>
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
