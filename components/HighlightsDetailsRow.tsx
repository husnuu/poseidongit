import styles from './HighlightsDetailsRow.module.css'

interface Highlight {
  icon?: string
  title: string
  description?: string
}

interface TourDetail {
  label: string
  value: string
  icon?: string
}

interface HighlightsDetailsRowProps {
  highlights?: Highlight[]
  tourDetails?: TourDetail[]
  quickFacts?: {
    durationText?: string
    availabilityText?: string
    meetingLocation?: string
    language?: string
    groupType?: string
    maxCapacity?: number
  }
}

const CheckIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.bulletIcon}
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

export default function HighlightsDetailsRow({
  highlights,
  tourDetails,
  quickFacts,
}: HighlightsDetailsRowProps) {
  const details: TourDetail[] = []

  if (quickFacts) {
    if (quickFacts.durationText) {
      details.push({ label: 'Süre', value: quickFacts.durationText })
    }
    if (quickFacts.availabilityText) {
      details.push({ label: 'Uygunluk', value: quickFacts.availabilityText })
    }
    if (quickFacts.meetingLocation) {
      details.push({ label: 'Kalkış', value: quickFacts.meetingLocation })
    }
    if (quickFacts.language) {
      details.push({ label: 'Dil', value: quickFacts.language })
    }
    if (quickFacts.groupType) {
      details.push({ label: 'Grup Tipi', value: quickFacts.groupType })
    }
    if (quickFacts.maxCapacity != null) {
      details.push({
        label: 'Kapasite',
        value: `${quickFacts.maxCapacity} kişi`,
      })
    }
  }

  if (tourDetails?.length) {
    details.push(...tourDetails)
  }

  const hasHighlights = highlights && highlights.length > 0
  const hasDetails = details.length > 0

  if (!hasHighlights && !hasDetails) return null

  return (
    <div className={styles.highlightsDetailsRow}>
      {hasHighlights && (
        <div className={styles.sectionColumn}>
          <h2 className={styles.sectionTitleSmall}>ÖNE ÇIKANLAR</h2>
          <ul className={styles.bulletList}>
            {highlights.map((highlight, index) => (
              <li key={index} className={styles.bulletItem}>
                <CheckIcon />
                <div className={styles.bulletText}>
                  {highlight.description ? (
                    <>
                      <div className={styles.bulletTitle}>{highlight.title}</div>
                      <div className={styles.bulletDescription}>
                        {highlight.description}
                      </div>
                    </>
                  ) : (
                    <div className={styles.bulletTitle}>{highlight.title}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasDetails && (
        <div className={styles.sectionColumn}>
          <h2 className={styles.sectionTitleSmall}>TUR DETAYLARI</h2>
          <ul className={styles.bulletList}>
            {details.map((detail, index) => (
              <li key={index} className={styles.detailLine}>
                <CheckIcon />
                <div className={styles.detailContent}>
                  <span className={styles.detailLabel}>{detail.label}:</span>
                  <span className={styles.detailValue}>{detail.value}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
