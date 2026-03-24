import styles from './IncludedNotIncluded.module.css'

interface IncludedNotIncludedProps {
  included?: string[]
  notIncluded?: string[]
  /** Dış section sarmalayıcı olmadan (yan galeri düzeninde) */
  embedded?: boolean
  /** Varsa kolon başlıkları bu sınıfla (örn. yat detay ortak başlık) */
  columnHeadingClassName?: string
}

const CheckIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.icon}
    aria-hidden
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9.70711 14.2929L19 5L20.4142 6.41421L9.70711 17.1213L4 11.4142L5.41421 10L9.70711 14.2929Z"
      fill="currentColor"
    />
  </svg>
)

const XIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.icon}
    aria-hidden
  >
    <path
      d="M6 6L18 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M18 6L6 18"
      stroke="currentColor"
      strokeOpacity="0.6"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

export default function IncludedNotIncluded({
  included,
  notIncluded,
  embedded = false,
  columnHeadingClassName,
}: IncludedNotIncludedProps) {
  const hasIncluded = Array.isArray(included) && included.length > 0
  const hasNotIncluded = Array.isArray(notIncluded) && notIncluded.length > 0

  if (!hasIncluded && !hasNotIncluded) return null

  const colHeading = columnHeadingClassName ?? styles.colTitle

  const inner = (
    <div className={embedded ? styles.twoColEmbedded : styles.twoCol}>
        {hasIncluded && (
          <div className={styles.includedCol}>
            <h3 className={colHeading}>Dahil olanlar</h3>
            <ul className={styles.list}>
              {included!.map((item, idx) => (
                <li key={`in-${idx}-${item}`} className={styles.item}>
                  <span className={styles.iconWrap}>
                    <CheckIcon />
                  </span>
                  <span className={styles.text}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasNotIncluded && (
          <div className={styles.notIncludedCol}>
            <h3 className={colHeading}>Dahil olmayanlar</h3>
            <ul className={styles.list}>
              {notIncluded!.map((item, idx) => (
                <li key={`out-${idx}-${item}`} className={styles.item}>
                  <span className={styles.iconWrap}>
                    <XIcon />
                  </span>
                  <span className={styles.text}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
  )

  if (embedded) {
    return <div className={styles.embeddedRoot}>{inner}</div>
  }

  return <section className={styles.section}>{inner}</section>
}
