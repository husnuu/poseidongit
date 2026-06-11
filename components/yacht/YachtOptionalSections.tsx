import Link from 'next/link'
import HomePopularYachtCard from '@/components/home/HomePopularYachtCard'
import { mapSanityYachtToHomeCard } from '@/lib/mapYachtListItem'
import type { YachtRentalDocument, SanityYachtCardRow } from '@/lib/yachtTypes'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import headingStyles from '@/components/yacht/yachtDetailHeading.module.css'
import styles from './YachtOptionalSections.module.css'

interface YachtOptionalSectionsProps {
  locale: SiteLocale
  yacht: Pick<YachtRentalDocument, 'relatedTours' | 'relatedYachts' | 'termsAndNotes'>
}

export default function YachtOptionalSections({ locale, yacht }: YachtOptionalSectionsProps) {
  const hasTours = yacht.relatedTours && yacht.relatedTours.some((t) => t.slug)
  const relatedYachtCards = (yacht.relatedYachts ?? [])
    .filter((row): row is SanityYachtCardRow => row != null)
    .map((row) => mapSanityYachtToHomeCard(row))
    .filter((item): item is NonNullable<typeof item> => item != null)
  const hasYachts = relatedYachtCards.length > 0
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
                  <Link href={withLocalePath(locale, `/tur/${t.slug}`)} className={styles.link}>
                    {t.title ?? t.slug}
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      )}

      {hasYachts && (
        <section className={styles.relatedSection} aria-labelledby="yacht-related">
          <h2 id="yacht-related" className={styles.relatedHeading}>
            Benzer yatlar
          </h2>
          <div className={styles.yachtGrid}>
            {relatedYachtCards.map((item) => (
              <HomePopularYachtCard key={item._id} yacht={item} locale={locale} />
            ))}
          </div>
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
