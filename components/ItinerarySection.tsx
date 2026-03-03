import ItineraryItem from './ItineraryItem'
import styles from './ItinerarySection.module.css'

export interface ItineraryTimelineItem {
  title: string
  description?: string | null
  time?: string | null
  tag?: string | null
  imageUrl?: string | null
  imageBlurDataURL?: string | null
}

interface ItinerarySectionProps {
  items?: ItineraryTimelineItem[] | null
  /** Opsiyonel: başlık altında muted açıklama */
  subtitle?: string | null
}

export default function ItinerarySection({
  items,
  subtitle,
}: ItinerarySectionProps) {
  if (!items || items.length === 0) return null

  return (
    <section className={styles.section} aria-labelledby="itinerary-heading">
      <div className={styles.inner}>
        <h2 id="itinerary-heading" className={styles.title}>
          Neler yapacaksınız?
        </h2>
        {subtitle && (
          <p className={styles.subtitle}>{subtitle}</p>
        )}
        <ul className={styles.list}>
          {items.map((item, index) => (
            <ItineraryItem
              key={index}
              title={item.title}
              description={item.description}
              time={item.time}
              tag={item.tag}
              imageUrl={item.imageUrl}
              imageBlurDataURL={item.imageBlurDataURL}
              isLast={index === items.length - 1}
            />
          ))}
        </ul>
      </div>
    </section>
  )
}
