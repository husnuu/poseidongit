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
  if (locale === 'ru') return 'ru-RU'
  return 'tr-TR'
}

function reviewsCountHeading(count: number | undefined, locale: TourPageUi['locale'], numLocale: string): string {
  if (count == null)
    return locale === 'en' ? 'reviews' : locale === 'de' ? 'Bewertungen' : locale === 'ru' ? 'отзывов' : 'yorum'
  const n = count.toLocaleString(numLocale)
  if (locale === 'en') return `${n} reviews`
  if (locale === 'de') return `${n} Bewertungen`
  if (locale === 'ru') return `${n} отзывов`
  return `${n} yorum`
}

function verifiedGuestLabel(locale: TourPageUi['locale']): string {
  if (locale === 'en') return 'Verified guest'
  if (locale === 'de') return 'Verifizierter Gast'
  if (locale === 'ru') return 'Проверенный гость'
  return 'Doğrulanmış misafir'
}

function loadMoreLabel(locale: TourPageUi['locale']): string {
  if (locale === 'en') return 'Show more reviews'
  if (locale === 'de') return 'Weitere Bewertungen anzeigen'
  if (locale === 'ru') return 'Показать больше отзывов'
  return 'Daha fazla yorum göster'
}

function readMoreLabel(locale: TourPageUi['locale']): string {
  if (locale === 'en') return 'Read more'
  if (locale === 'de') return 'Weiterlesen'
  if (locale === 'ru') return 'Читать далее'
  return 'Devamını oku'
}

function closeLabel(locale: TourPageUi['locale']): string {
  if (locale === 'en') return 'Close'
  if (locale === 'de') return 'Schließen'
  if (locale === 'ru') return 'Закрыть'
  return 'Kapat'
}

/** Puan özeti satırı ("Google'da 2.971 yorum") ve dış bağlantının etiketi. */
function summaryCountLabel(count: string, source: string | undefined, locale: TourPageUi['locale']): string {
  const src = source?.trim()
  if (locale === 'en') return src ? `${count} reviews on ${src}` : `${count} reviews`
  if (locale === 'de') return src ? `${count} Bewertungen auf ${src}` : `${count} Bewertungen`
  if (locale === 'ru') return src ? `${count} отзывов в ${src}` : `${count} отзывов`
  return src ? `${src}'da ${count} yorum` : `${count} yorum`
}

function allReviewsLabel(locale: TourPageUi['locale']): string {
  if (locale === 'en') return 'See all reviews'
  if (locale === 'de') return 'Alle Bewertungen ansehen'
  if (locale === 'ru') return 'Все отзывы'
  return 'Tüm yorumları gör'
}

export default function ReviewsSection({
  tourUi: tourUiProp,
  reviewsSection,
  reviewsUrl,
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
  const ratingValue = typeof reviewsSection.ratingValue === 'number' ? reviewsSection.ratingValue : undefined
  const allReviewsHref = reviewsSection.moreLinkUrl?.trim() || reviewsUrl?.trim() || null

  const listItems = allItems.map((it) => ({
    name: it.name,
    dateLabel: it.title || '',
    description: it.description,
    rating: typeof it.rating === 'number' ? it.rating : 5,
    avatarSrc: it.avatar?.asset ? urlFor(it.avatar.asset).width(88).height(88).url() : it.avatar?.url ?? null,
    avatarLqip: it.avatar?.metadata?.lqip,
  }))

  return (
    <section
      id="all-reviews"
      className={`${styles.sectionWrapper} scroll-mt-24`}
      aria-labelledby="tour-reviews-heading"
    >
      <div className={styles.header}>
        <h2 id="tour-reviews-heading" className="tourSectionHeading">
          {headingText}
        </h2>
      </div>

      {/* Puan özeti — yalnızca Sanity'de dolu alanlar (ratingValue,
          reviewCount, sourceLabel, moreLinkUrl). Yıldız dağılımı verisi
          olmadığı için dağılım çubuğu gösterilmiyor. */}
      {typeof ratingValue === 'number' && ratingValue > 0 && (
        <div className={styles.summary}>
          <div className={styles.summaryScore}>
            <span className={styles.summaryValue}>
              {ratingValue.toLocaleString(numLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </span>
            <div className={styles.summaryText}>
              <span className={styles.stars} aria-label={`${ratingValue} / 5`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} style={{ color: i < Math.round(ratingValue) ? 'rgb(245, 166, 35)' : '#dcdce6' }}>
                    ★
                  </span>
                ))}
              </span>
              {reviewCount != null && (
                <span className={styles.summaryCount}>
                  {summaryCountLabel(reviewCount.toLocaleString(numLocale), reviewsSection.sourceLabel, tourUi.locale)}
                </span>
              )}
            </div>
          </div>
          {allReviewsHref && (
            <a href={allReviewsHref} target="_blank" rel="noopener noreferrer" className={styles.summaryLink}>
              {reviewsSection.moreLinkText?.trim() || allReviewsLabel(tourUi.locale)}
            </a>
          )}
        </div>
      )}

      <ReviewsList
        items={listItems}
        verifiedGuestLabel={verifiedGuestLabel(tourUi.locale)}
        loadMoreLabel={loadMoreLabel(tourUi.locale)}
        readMoreLabel={readMoreLabel(tourUi.locale)}
        closeLabel={closeLabel(tourUi.locale)}
      />
    </section>
  )
}
