import Image from 'next/image'
import IncludedNotIncluded from '@/components/IncludedNotIncluded'
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
          <div className={styles.galleryGrid}>
            {gallery.slice(0, 6).map((item, i) => (
              <div key={`${item.src}-${i}`} className={styles.thumb}>
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 320px"
                />
              </div>
            ))}
          </div>
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
