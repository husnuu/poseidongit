import { urlFor } from '@/lib/sanity'
import type { TourPageUi } from '@/lib/i18n/tourPageUi'
import { getTourPageUi } from '@/lib/i18n/tourPageUi'
import ReviewsList from './ReviewsList'
import styles from './ReviewsSection.module.css'

interface ReviewItemAvatar {
  asset?: { _ref?: string; _type?: string }
  url?: string
  metadata?: { lqip?: string; dimensions?: { width: number; height: number } }
}

interface ReviewItem {
  name: string
  title: string
  description: string
  rating?: number
  avatar?: ReviewItemAvatar
}

export interface ReviewsSectionProps {
  tourUi?: TourPageUi
  reviewsUrl?: string
  reviewsSection?: {
    enabled?: boolean
    reviewCount?: number
    ratingValue?: number
    ratingDots?: number
    sourceLabel?: string
    moreLinkText?: string
    moreLinkUrl?: string
    items?: ReviewItem[]
  }
}

function localeTagForNumbers(locale: TourPageUi['locale']): string {
  if (locale === 'de') return 'de-DE'
  if (locale === 'en') return 'en-US'
  return 'tr-TR'
}

function reviewsCountHeading(count: number | undefined, locale: TourPageUi['locale'], numLocale: string): string {
  if (count == null) return locale === 'en' ? 'reviews' : locale === 'de' ? 'Bewertungen' : 'yorum'
  const n = count.toLocaleString(numLocale)
  if (locale === 'en') return `${n} reviews`
  if (locale === 'de') return `${n} Bewertungen`
  return `${n} yorum`
}

function verifiedGuestLabel(locale: TourPageUi['locale']): string {
  if (locale === 'en') return 'Verified guest'
  if (locale === 'de') return 'Verifizierter Gast'
  return 'Doğrulanmış misafir'
}

function loadMoreLabel(locale: TourPageUi['locale']): string {
  if (locale === 'en') return 'Show more reviews'
  if (locale === 'de') return 'Weitere Bewertungen anzeigen'
  return 'Daha fazla yorum göster'
}

export default function ReviewsSection({
  tourUi: tourUiProp,
  reviewsSection,
}: ReviewsSectionProps) {
  const tourUi = tourUiProp ?? getTourPageUi('tr')
  if (!reviewsSection) return null
  if (reviewsSection.enabled === false) return null

  const allItems = reviewsSection.items || []
  if (allItems.length < 1) return null

  const reviewCount =
    typeof reviewsSection.reviewCount === 'number' ? reviewsSection.reviewCount : undefined
  const numLocale = localeTagForNumbers(tourUi.locale)
  const headingText = reviewsCountHeading(reviewCount, tourUi.locale, numLocale)

  const listItems = allItems.map((it) => ({
    name: it.name,
    dateLabel: it.title || '',
    description: it.description,
    rating: typeof it.rating === 'number' ? it.rating : 5,
    avatarSrc: it.avatar?.asset ? urlFor(it.avatar.asset).width(88).height(88).url() : it.avatar?.url ?? null,
    avatarLqip: it.avatar?.metadata?.lqip,
  }))

  return (
    <section className={styles.sectionWrapper} aria-labelledby="tour-reviews-heading">
      <div className={styles.header}>
        <h2 id="tour-reviews-heading" className={styles.sectionHeading}>
          {headingText}
        </h2>
      </div>

      <ReviewsList
        items={listItems}
        verifiedGuestLabel={verifiedGuestLabel(tourUi.locale)}
        loadMoreLabel={loadMoreLabel(tourUi.locale)}
      />
    </section>
  )
}
