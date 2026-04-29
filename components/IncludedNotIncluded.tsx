import type { TourPageUi } from '@/lib/i18n/tourPageUi'
import { getTourPageUi } from '@/lib/i18n/tourPageUi'
import styles from './IncludedNotIncluded.module.css'

interface IncludedNotIncludedProps {
  included?: string[]
  notIncluded?: string[]
  tourUi?: TourPageUi
  embedded?: boolean
  columnHeadingClassName?: string
}

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
    <circle cx="9" cy="9" r="9" fill="#16a34a" fillOpacity="0.12" />
    <path
      d="M5.5 9.25l2.5 2.5 4.5-5"
      stroke="#16a34a"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
    <circle cx="9" cy="9" r="9" fill="#ef4444" fillOpacity="0.1" />
    <path
      d="M6 6l6 6M12 6l-6 6"
      stroke="#ef4444"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
  </svg>
)

export default function IncludedNotIncluded({
  included,
  notIncluded,
  embedded = false,
  tourUi: tourUiProp,
}: IncludedNotIncludedProps) {
  const tourUi = tourUiProp ?? getTourPageUi('tr')
  const hasIncluded = Array.isArray(included) && included.length > 0
  const hasNotIncluded = Array.isArray(notIncluded) && notIncluded.length > 0

  if (!hasIncluded && !hasNotIncluded) return null

  const inner = (
    <div className={styles.row}>
      <h3 className={styles.heading}>{tourUi.includedTitle}</h3>

      <ul className={styles.list}>
        {hasIncluded &&
          included!.map((item, idx) => (
            <li key={`in-${idx}`} className={styles.item}>
              <span className={styles.iconWrap}>
                <CheckIcon />
              </span>
              <span className={styles.text}>{item}</span>
            </li>
          ))}

        {hasNotIncluded &&
          notIncluded!.map((item, idx) => (
            <li key={`out-${idx}`} className={styles.item}>
              <span className={styles.iconWrap}>
                <XIcon />
              </span>
              <span className={`${styles.text} ${styles.textMuted}`}>{item}</span>
            </li>
          ))}
      </ul>
    </div>
  )

  if (embedded) return <div className={styles.embeddedRoot}>{inner}</div>
  return <section className={styles.section}>{inner}</section>
}
