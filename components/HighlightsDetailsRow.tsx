import { Check, UtensilsCrossed, Sparkles, Anchor, Sofa, Bus } from 'lucide-react'
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

const iconSize = 20
const iconStroke = 2

const CheckIcon = () => <Check size={iconSize} strokeWidth={iconStroke} className={styles.bulletIcon} aria-hidden />
const FoodIcon = () => <UtensilsCrossed size={iconSize} strokeWidth={iconStroke} className={styles.bulletIcon} aria-hidden />
const NewIcon = () => <Sparkles size={iconSize} strokeWidth={iconStroke} className={styles.bulletIcon} aria-hidden />
const CaptainIcon = () => <Anchor size={iconSize} strokeWidth={iconStroke} className={styles.bulletIcon} aria-hidden />
const ComfortIcon = () => <Sofa size={iconSize} strokeWidth={iconStroke} className={styles.bulletIcon} aria-hidden />
const LuxuryBusIcon = () => <Bus size={iconSize} strokeWidth={iconStroke} className={styles.bulletIcon} aria-hidden />

const HIGHLIGHT_ICONS: Record<string, () => JSX.Element> = {
  food: FoodIcon,
  new: NewIcon,
  captain: CaptainIcon,
  comfort: ComfortIcon,
  'luxury-bus': LuxuryBusIcon,
}

function getHighlightIcon(iconKey?: string | null) {
  if (!iconKey?.trim()) return CheckIcon
  const key = iconKey.trim().toLowerCase()
  return HIGHLIGHT_ICONS[key] ?? CheckIcon
}

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
            {highlights.map((highlight, index) => {
              const IconComponent = getHighlightIcon(highlight.icon)
              return (
              <li key={index} className={styles.bulletItem}>
                <IconComponent />
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
              )
            })}
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
