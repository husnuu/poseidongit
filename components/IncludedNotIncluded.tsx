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

/** Minimal çizgi tik — yeşil (currentColor) */
const CheckIcon = () => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden className={styles.svgStroke}>
    <path
      d="M4 8.5l3 3 6-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/** Minimal çarpı — kırmızı (currentColor) */
const XIcon = () => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden className={styles.svgStroke}>
    <path
      d="M4.5 4.5l8 8M12.5 4.5l-8 8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

export default function IncludedNotIncluded({
  included,
  notIncluded,
  embedded = false,
  tourUi: tourUiProp,
  columnHeadingClassName,
}: IncludedNotIncludedProps) {
  const tourUi = tourUiProp ?? getTourPageUi('tr')
  const hasIncluded = Array.isArray(included) && included.length > 0
  const hasNotIncluded = Array.isArray(notIncluded) && notIncluded.length > 0

  if (!hasIncluded && !hasNotIncluded) return null

  const headingClass = columnHeadingClassName ?? styles.heading

  const inner = (
    <div className={styles.row}>
      <h3 className={headingClass}>{tourUi.includedTitle}</h3>

      <ul className={styles.list}>
        {hasIncluded &&
          included!.map((item, idx) => (
            <li key={`in-${idx}`} className={styles.item}>
              <span className={styles.iconIncluded} aria-hidden>
                <CheckIcon />
              </span>
              <span className={styles.text}>{item}</span>
            </li>
          ))}

        {hasNotIncluded &&
          notIncluded!.map((item, idx) => (
            <li key={`out-${idx}`} className={styles.item}>
              <span className={styles.iconExcluded} aria-hidden>
                <XIcon />
              </span>
              <span className={`${styles.text} ${styles.textMuted}`}>{item}</span>
            </li>
          ))}
      </ul>
    </div>
  )

  const sectionAria =
    hasIncluded && hasNotIncluded
      ? `${tourUi.includedTitle}; ${tourUi.notIncludedTitle}`
      : tourUi.includedTitle

  if (embedded) return <div className={styles.embeddedRoot}>{inner}</div>
  return (
    <section className={styles.section} aria-label={sectionAria}>
      {inner}
    </section>
  )
}
