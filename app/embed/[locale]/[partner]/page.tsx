import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { isSiteLocale, type SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import { getActivePartnerBySlug } from '@/lib/partner/partners'
import { PARTNER_REF_PARAM } from '@/lib/partner/links'
import { loadToursForLocale } from '@/lib/tours/listForLocale'
import { loadEmbedYachts, yachtSitePath } from '@/lib/embed/yachts'
import { EMBED_COPY } from '@/lib/embed/copy'
import { embedListPath, embedQuery, embedTourPath, parseEmbedOptions } from '@/lib/embed/options'
import EmbedTourCard from '@/components/embed/EmbedTourCard'
import EmbedYachtCard from '@/components/embed/EmbedYachtCard'
import EmbedFooter from '@/components/embed/EmbedFooter'
import type { TourListItem } from '@/components/tours/TourCard'
import type { HomePopularYachtCardData } from '@/components/home/HomePopularYachtCard'

/** Partner pasife alınınca widget hemen kapansın diye önbelleğe alınmaz. */
export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ locale: string; partner: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * Widget: tur ve tekne kiralama listesi (ikisi birden gösteriliyorsa sekmeli).
 * `?tour=<id>` ile doğrudan o turun sayfasına gider (tek tur modu).
 */
export default async function EmbedListPage({ params, searchParams }: PageProps) {
  const { locale: loc, partner: partnerSlug } = await params
  if (!isSiteLocale(loc)) notFound()
  const locale: SiteLocale = loc
  const sp = await searchParams
  const opts = parseEmbedOptions(sp)

  const partner = await getActivePartnerBySlug(partnerSlug).catch((e) => {
    console.error('[embed] partner', e)
    return null
  })
  if (!partner) notFound()

  const wantTours = opts.content !== 'yachts'
  const wantYachts = opts.content !== 'tours'
  const [tours, yachts] = await Promise.all([
    wantTours ? loadToursForLocale(locale).catch(() => [] as TourListItem[]) : Promise.resolve([] as TourListItem[]),
    wantYachts ? loadEmbedYachts() : Promise.resolve([] as HomePopularYachtCardData[]),
  ])

  const single = typeof sp.tour === 'string' ? tours.find((t) => t._id === sp.tour) : undefined
  if (single?.slug) {
    redirect(embedTourPath(locale, partner.slug, single.slug) + embedQuery({ ...opts, single: true }))
  }

  const visibleTours = tours.filter(
    (t) =>
      t.slug &&
      (opts.tours.length === 0 || opts.tours.includes(t._id)) &&
      (!opts.category || (t.category ?? 'daily') === opts.category)
  )
  const visibleYachts = yachts.filter((y) => y.slug)
  const showTabs = visibleTours.length > 0 && visibleYachts.length > 0
  const activeTab = !showTabs ? (visibleTours.length > 0 ? 'tours' : 'yachts') : opts.tab
  const copy = EMBED_COPY[locale]
  const yachtHref = (y: HomePopularYachtCardData) =>
    // Göreli adres iframe'in kendi alan adına (sitemize) çözülür.
    `${withLocalePath(locale, yachtSitePath(y)!)}?${PARTNER_REF_PARAM}=${partner.slug}&k=widget`

  return (
    <div
      className="px-3 pt-3 sm:px-4 sm:pt-4"
      style={opts.color ? ({ '--primary': opts.color } as React.CSSProperties) : undefined}
    >
      {showTabs && (
        <nav className="mb-4 flex justify-center" aria-label={`${copy.tabTours} / ${copy.tabYachts}`}>
          <div className="inline-flex rounded-full bg-zinc-100 p-1">
            {(['tours', 'yachts'] as const).map((tab) => {
              const active = activeTab === tab
              return (
                <Link
                  key={tab}
                  href={embedListPath(locale, partner.slug) + embedQuery({ ...opts, tab })}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-full px-4 py-2 text-[13.5px] font-bold transition-colors sm:px-5 ${
                    active ? 'bg-[var(--primary,#2168b8)] text-white shadow-sm' : 'text-zinc-600 hover:text-[#131719]'
                  }`}
                >
                  {tab === 'tours' ? copy.tabTours : copy.tabYachts}
                </Link>
              )
            })}
          </div>
        </nav>
      )}

      {activeTab === 'tours' && visibleTours.length > 0 && (
        <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {visibleTours.map((tour) => (
            <li key={tour._id}>
              <EmbedTourCard
                tour={tour}
                href={embedTourPath(locale, partner.slug, tour.slug!) + embedQuery({ ...opts, tab: 'tours' })}
                locale={locale}
                showPrice={opts.prices}
              />
            </li>
          ))}
        </ul>
      )}

      {activeTab === 'yachts' && visibleYachts.length > 0 && (
        <>
          <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {visibleYachts.map((yacht) => (
              <li key={yacht._id}>
                <EmbedYachtCard yacht={yacht} href={yachtHref(yacht)} locale={locale} showPrice={opts.prices} />
              </li>
            ))}
          </ul>
          <p className="m-0 mt-3 text-center text-[12px] text-zinc-400">{copy.yachtNote}</p>
        </>
      )}

      {visibleTours.length === 0 && visibleYachts.length === 0 && (
        <p className="py-12 text-center text-sm text-zinc-500">{copy.empty}</p>
      )}
      <EmbedFooter locale={locale} />
    </div>
  )
}
