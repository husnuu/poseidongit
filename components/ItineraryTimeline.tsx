import Image from 'next/image'
import styles from './ItineraryTimeline.module.css'

export interface ItineraryTimelineItem {
  title: string
  description?: string | null
  time?: string | null
  tag?: string | null
  imageUrl?: string | null
  imageBlurDataURL?: string | null
}

interface ItineraryTimelineProps {
  items?: ItineraryTimelineItem[] | null
}

export default function ItineraryTimeline({ items }: ItineraryTimelineProps) {
  if (!items || items.length === 0) return null

  const validItems = items.filter((item) => item.imageUrl && item.title)

  if (validItems.length === 0) return null

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Neler yapacaksınız?</h2>
      <div className={styles.timeline}>
        {validItems.length > 1 && <div className={styles.line} />}
        <ul className={styles.list}>
          {validItems.map((item, index) => (
            <li key={index} className={styles.item}>
              <div className={styles.left}>
                <div className={styles.thumb}>
                  <Image
                    src={item.imageUrl!}
                    alt={item.title}
                    fill
                    className={styles.image}
                    placeholder={
                      item.imageBlurDataURL ? 'blur' : 'empty'
                    }
                    blurDataURL={item.imageBlurDataURL ?? undefined}
                  />
                  {item.time && (
                    <span className={styles.badgeTime}>{item.time}</span>
                  )}
                  {item.tag && (
                    <span className={styles.badgeTag}>{item.tag}</span>
                  )}
                </div>
              </div>
              <div className={styles.right}>
                <h3 className={styles.itemTitle}>{item.title}</h3>
                {item.description && (
                  <p className={styles.itemDesc}>{item.description}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
