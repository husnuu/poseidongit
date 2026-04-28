import styles from './PoseidonSecure.module.css'
import { ShieldCheck } from 'lucide-react'

interface PoseidonSecureProps {
  /** Wrap in a max-w-7xl container (for homepage use). Defaults to false. */
  contained?: boolean
}

export default function PoseidonSecure({ contained = false }: PoseidonSecureProps) {
  const banner = (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <div className={styles.logoRow}>
          <ShieldCheck size={32} strokeWidth={2} className={styles.shieldIcon} aria-hidden />
          <span className={styles.logoText}>
            <span className={styles.logoBold}>Poseidon</span>
            <span className={styles.logoAccent}>Secure</span>
          </span>
        </div>

        <p className={styles.description}>
          Yeni nesil tam donanımlı teknelerimizde,{' '}
          <strong>24 saate kadar şartsız iade ve hava durumu garantisiyle</strong> size kusursuz
          bir deniz keyfi sunar. Siz sadece rotanın tadını çıkarın; güvenliğiniz ve tüm
          haklarınız bizim güvencemizde.
        </p>
      </div>
    </div>
  )

  if (contained) {
    return (
      <div className={styles.container}>
        {banner}
      </div>
    )
  }

  return banner
}
