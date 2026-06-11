import IncludedNotIncluded from '@/components/IncludedNotIncluded'
import YachtGalleryGrid from '@/components/yacht/YachtGalleryGrid'
import type { YachtSidebarGalleryItem } from '@/lib/yachtImages'
import headingStyles from '@/components/yacht/yachtDetailHeading.module.css'
import styles from './YachtIncludedWithGallery.module.css'

interface YachtIncludedWithGalleryProps {
  included?: string[]
  notIncluded?: string[]
  gallery: YachtSidebarGalleryItem[]
}

export default function YachtIncludedWithGallery({
  included,
  notIncluded,
  gallery,
}: YachtIncludedWithGalleryProps) {
  const hasLists =
    (Array.isArray(included) && included.length > 0) ||
    (Array.isArray(notIncluded) && notIncluded.length > 0)
  const hasGallery = gallery.length > 0

  if (!hasLists && !hasGallery) return null

  return (
    <section className={styles.section} aria-label="Galeri, dahil olanlar ve dahil olmayanlar">
      {hasGallery ? (
        <div className={hasLists ? styles.galleryBlock : styles.galleryBlockSolo}>
          <h2 className={headingStyles.h2}>Galeri</h2>
          <YachtGalleryGrid images={gallery} />
        </div>
      ) : null}

      {hasLists ? (
        <div className={styles.lists}>
          <IncludedNotIncluded
            embedded
            columnHeadingClassName={headingStyles.h2}
            included={included}
            notIncluded={notIncluded}
          />
        </div>
      ) : null}
    </section>
  )
}
