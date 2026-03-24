import Link from 'next/link'
import type { YachtRentalDocument } from '@/lib/yachtTypes'
import headingStyles from '@/components/yacht/yachtDetailHeading.module.css'
import styles from './YachtOptionalSections.module.css'

interface YachtOptionalSectionsProps {
  yacht: Pick<YachtRentalDocument, 'relatedTours' | 'relatedYachts' | 'termsAndNotes'>
}

export default function YachtOptionalSections({ yacht }: YachtOptionalSectionsProps) {
  const hasTours = yacht.relatedTours && yacht.relatedTours.some((t) => t.slug)
  const hasYachts = yacht.relatedYachts && yacht.relatedYachts.some((y) => y.slug)
  const hasTerms = yacht.termsAndNotes?.trim()

  if (!hasTours && !hasYachts && !hasTerms) return null

  return (
    <div className={styles.wrap}>
      {hasTours && (
        <section className={styles.section} aria-labelledby="yacht-tours">
          <h2 id="yacht-tours" className={headingStyles.h2}>
            Önerilen turlar
          </h2>
          <ul className={styles.linkList}>
            {yacht.relatedTours!
              .filter((t): t is { title?: string; slug: string } => Boolean(t.slug))
              .map((t) => (
                <li key={t.slug}>
                  <Link href={`/tour/${t.slug}`} className={styles.link}>
                    {t.title ?? t.slug}
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      )}

      {hasYachts && (
        <section className={styles.section} aria-labelledby="yacht-related">
          <h2 id="yacht-related" className={headingStyles.h2}>
            Benzer yatlar
          </h2>
          <ul className={styles.linkList}>
            {yacht.relatedYachts!
              .filter((y): y is typeof y & { slug: string } => Boolean(y.slug))
              .map((y) => {
                const href = y.locationSlug
                  ? `/yat-kiralama/${y.locationSlug}/${y.slug}`
                  : `/yat-kiralama/${y.slug}`
                return (
                  <li key={href}>
                    <Link href={href} className={styles.link}>
                      {y.name ?? y.slug}
                    </Link>
                  </li>
                )
              })}
          </ul>
        </section>
      )}

      {hasTerms && (
        <section className={styles.section} aria-labelledby="yacht-terms">
          <h2 id="yacht-terms" className={headingStyles.h2}>
            Şartlar ve notlar
          </h2>
          <p className={styles.terms}>{yacht.termsAndNotes!.trim()}</p>
        </section>
      )}
    </div>
  )
}
