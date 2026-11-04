import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { isSiteLocale, type SiteLocale } from '@/lib/i18n/config'
import { translateText } from '@/lib/i18n/runtimeTranslate'
import { getActivePartnerBySlug, type PartnerPublic } from '@/lib/partner/partners'
import { loadToursForLocale } from '@/lib/tours/listForLocale'
import TourCategoryFilter from '@/components/tours/TourCategoryFilter'
import PartnerAttributionSaver from '@/components/partner/PartnerAttributionSaver'
import type { TourListItem } from '@/components/tours/TourCard'

/** Partner pasife alındığında sayfa hemen kapansın diye önbelleğe alınmaz. */
export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ locale: string; slug: string }> }

const COPY: Record<SiteLocale, { heading: string; assurance: string; empty: string }> = {
  tr: {
    heading: 'Misafirlerimize özel Çeşme deneyimleri',
    assurance: 'Rezervasyonlar Poseidon güvencesiyle',
    empty: 'Şu anda listelenecek tur yok.',
  },
  en: {
    heading: 'Çeşme experiences for our guests',
    assurance: 'Bookings secured by Poseidon',
    empty: 'There are no tours to list right now.',
  },
  de: {
    heading: 'Çeşme-Erlebnisse für unsere Gäste',
    assurance: 'Buchungen mit der Sicherheit von Poseidon',
    empty: 'Derzeit sind keine Touren verfügbar.',
  },
  ru: {
    heading: 'Впечатления в Чешме для наших гостей',
    assurance: 'Бронирование с гарантией Poseidon',
    empty: 'Сейчас нет доступных туров.',
  },
}

async function findPartner(slug: string): Promise<PartnerPublic | null> {
  try {
    return await getActivePartnerBySlug(slug)
  } catch (e) {
    console.error('[partner page]', e)
    return null
  }
}

/** Kişiye özel satış sayfası: arama sonuçlarında ana tur sayfalarıyla yarışmasın. */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: loc, slug } = await params
  const partner = await findPartner(slug)
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'tr'
  return {
    title: partner ? `${partner.name} | ${COPY[locale].heading}` : undefined,
    robots: { index: false, follow: false },
  }
}

export default async function PartnerMiniPage({ params }: PageProps) {
  const { locale: loc, slug } = await params
  if (!isSiteLocale(loc)) notFound()
  const locale: SiteLocale = loc
  const partner = await findPartner(slug)
  if (!partner) notFound()

  let tours: TourListItem[] = []
  try {
    tours = await loadToursForLocale(locale)
  } catch (e) {
    console.error('[partner page] tours', e)
  }
  const copy = COPY[locale]
  const heading = partner.welcomeMessage?.trim()
    ? (await translateText(partner.welcomeMessage, locale)) || partner.welcomeMessage
    : copy.heading

  return (
    <div className="min-h-screen bg-white">
      <PartnerAttributionSaver slug={partner.slug} />
      <section className="border-b border-zinc-100 bg-zinc-50">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center px-4 py-10 text-center md:py-14">
          {partner.logoData && (
            // eslint-disable-next-line @next/next/no-img-element -- veritabanından gelen küçük data URL
            <img src={partner.logoData} alt="" className="mb-4 h-20 w-20 rounded-xl bg-white object-contain p-1.5 shadow-sm" />
          )}
          <h1
            className="break-words text-[28px] font-extrabold leading-tight text-[#131719] md:text-[38px]"
            style={{ fontFamily: 'var(--font-family-title, var(--font-family))' }}
          >
            {partner.name}
          </h1>
          <p className="mt-2 max-w-xl text-[16px] text-zinc-600 md:text-[18px]">{heading}</p>
          <p className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--primary,#2168b8)]">
            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
            {copy.assurance}
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-[1200px] px-4 py-8 md:py-12">
        {tours.length > 0 ? (
          <TourCategoryFilter tours={tours} locale={locale} />
        ) : (
          <p className="py-12 text-center text-black/60">{copy.empty}</p>
        )}
      </section>
    </div>
  )
}
