import { CircleCheck } from 'lucide-react'
import headingStyles from '@/components/yacht/yachtDetailHeading.module.css'
import styles from './YachtAmenitiesSection.module.css'

interface YachtAmenitiesSectionProps {
  amenities: string[]
}

export default function YachtAmenitiesSection({ amenities }: YachtAmenitiesSectionProps) {
  const list = amenities.filter((a) => a?.trim())
  if (list.length === 0) return null

  return (
    <div className={styles.wrap}>
      <section className={styles.section} aria-labelledby="yacht-amenities-heading">
        <h2 id="yacht-amenities-heading" className={headingStyles.h2}>
          Olanaklar
        </h2>
        <ul className={styles.grid}>
          {list.map((a) => (
            <li key={a} className={styles.card}>
              <span className={styles.iconWrap}>
                <CircleCheck className={styles.icon} strokeWidth={2} aria-hidden />
              </span>
              <span className={styles.label}>{a}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
