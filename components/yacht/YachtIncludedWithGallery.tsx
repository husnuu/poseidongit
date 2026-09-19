import IncludedNotIncluded from '@/components/IncludedNotIncluded'
import YachtGalleryGrid from '@/components/yacht/YachtGalleryGrid'
import type { YachtSidebarGalleryItem } from '@/lib/yachtImages'
import type { SiteLocale } from '@/lib/i18n/config'
import { getYachtUi } from '@/lib/i18n/yachtUi'
import { getTourPageUi } from '@/lib/i18n/tourPageUi'
import headingStyles from '@/components/yacht/yachtDetailHeading.module.css'
import styles from './YachtIncludedWithGallery.module.css'

interface YachtIncludedWithGalleryProps {
  included?: string[]
  notIncluded?: string[]
  gallery: YachtSidebarGalleryItem[]
  locale?: SiteLocale
}

export default function YachtIncludedWithGallery({
  included,
  notIncluded,
  gallery,
  locale = 'tr',
}: YachtIncludedWithGalleryProps) {
  const ui = getYachtUi(locale)
  const tourUi = getTourPageUi(locale)
  const hasLists =
    (Array.isArray(included) && included.length > 0) ||
    (Array.isArray(notIncluded) && notIncluded.length > 0)
  const hasGallery = gallery.length > 0

  if (!hasLists && !hasGallery) return null

  return (
    <section className={styles.section} aria-label={ui.galleryAriaLabel}>
      {hasGallery ? (
        <div className={hasLists ? styles.galleryBlock : styles.galleryBlockSolo}>
          <h2 className={headingStyles.h2}>{ui.galleryHeading}</h2>
          <YachtGalleryGrid images={gallery} locale={locale} />
        </div>
      ) : null}

      {hasLists ? (
        <div className={styles.lists}>
          <IncludedNotIncluded
            embedded
            columnHeadingClassName={headingStyles.h2}
            included={included}
            notIncluded={notIncluded}
            tourUi={tourUi}
          />
        </div>
      ) : null}
    </section>
  )
}
