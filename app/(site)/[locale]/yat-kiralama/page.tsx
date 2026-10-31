import type { Metadata } from 'next'
import { client } from '@/lib/sanity'
import { yachtRentalsPageQuery } from '@/lib/queries'
import { yachtRentalsAllQuery } from '@/lib/yachtQueries'
import { mapSanityYachtRowsToHomeCards } from '@/lib/mapYachtListItem'
import type { SanityYachtCardRow } from '@/lib/yachtTypes'
import YachtRentalListSection from '@/components/yacht/YachtRentalListSection'
import listStyles from '../turlar/page.module.css'
import { getSiteName, buildItemListSchema } from '@/lib/seo'
import { buildPageMetadata } from '@/lib/seo/buildPageMetadata'
import JsonLd from '@/components/seo/JsonLd'
import { withLocalePath } from '@/lib/i18n/paths'
import { isSiteLocale, type SiteLocale } from '@/lib/i18n/config'
import { translateText } from '@/lib/i18n/runtimeTranslate'
import { LISTING_HEADINGS } from '@/lib/i18n/strings/listingHeadings'
import StandardPageLd from '@/components/seo/StandardPageLd'

const siteName = getSiteName()

type YachtRentalsPageData = {
  slug?: string | null
  titleTop?: string | null
  titleBottom?: string | null
  intro?: string | null
  emptyStateMessage?: string | null
  seo?: { title?: string | null; description?: string | null } | null
}

const DEFAULT_INTRO: Record<SiteLocale, string> = {
  tr: 'Tarih ve misafir sayınızı seçin, müsaitlik talebi bırakın — ekibimiz size özel teklif için en kısa sürede dönüş yapar.',
  en: 'Pick your dates and guest count, submit an availability request — our team will get back to you with a tailored quote.',
  de: 'Wählen Sie Datum und Gästezahl, senden Sie eine Verfügbarkeitsanfrage — unser Team meldet sich zeitnah mit einem individuellen Angebot.',
  ru: 'Выберите даты и количество гостей, отправьте запрос на доступность — наша команда свяжется с вами в ближайшее время с индивидуальным предложением.',
}

const DEFAULT_EMPTY: Record<SiteLocale, string> = {
  tr: 'Yakında yat ilanları eklenecek. Sanity Studio’dan yat kiralama içeriği ekleyebilirsiniz.',
  en: 'Yacht listings will be added soon. You can add yacht rental content from Sanity Studio.',
  de: 'In Kürze werden Yachtangebote hinzugefügt. Sie können Yachtcharter-Inhalte über Sanity Studio hinzufügen.',
  ru: 'Скоро здесь появятся предложения яхт. Вы можете добавить контент по аренде яхт через Sanity Studio.',
}

const DEFAULT_TITLE_TOP: Record<SiteLocale, string> = {
  tr: 'ÖZEL',
  en: 'PRIVATE',
  de: 'EXKLUSIVE',
  ru: 'ЧАСТНАЯ',
}

const DEFAULT_TITLE_BOTTOM: Record<SiteLocale, string> = {
  tr: 'YAT KİRALAMA',
  en: 'YACHT RENTAL',
  de: 'YACHTCHARTER',
  ru: 'АРЕНДА ЯХТ',
}

const DEFAULT_SEO_TITLE: Record<SiteLocale, string> = {
  tr: siteName ? `Yat Kiralama | ${siteName}` : 'Yat kiralama | Özel charter',
  en: siteName ? `Yacht Rental | ${siteName}` : 'Yacht rental | Private charter',
  de: siteName ? `Yachtcharter | ${siteName}` : 'Yachtcharter | Privatcharter',
  ru: siteName ? `Аренда яхт | ${siteName}` : 'Аренда яхт | Частный чартер',
}

const DEFAULT_SEO_DESCRIPTION: Record<SiteLocale, string> = {
  tr: 'Özel yat ve gulet kiralama. Günlük charter, kaptanlı seçenekler. Müsaitlik talebi ile teklif alın.',
  en: 'Private yacht and gulet rental. Daily charters, skippered options available. Request a quote via our availability form.',
  de: 'Private Yacht- und Gulet-Vermietung. Tagescharter, Optionen mit Skipper. Angebot per Verfügbarkeitsanfrage erhalten.',
  ru: 'Аренда частных яхт и гулетов. Дневные чартеры, есть варианты с капитаном. Получите предложение через форму запроса доступности.',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: loc } = await params
  const locale = (isSiteLocale(loc) ? loc : 'tr') as SiteLocale
  let page: YachtRentalsPageData | null = null
  try {
    page = await client.fetch<YachtRentalsPageData | null>(
      yachtRentalsPageQuery,
      {},
      { useCdn: true }
    )
  } catch {
    page = null
  }

  const rawTitle = page?.seo?.title?.trim()
  const rawDescription = page?.seo?.description?.trim()
  const [translatedTitle, translatedDescription] =
    locale === 'tr'
      ? [rawTitle, rawDescription]
      : await Promise.all([
          rawTitle ? translateText(rawTitle, locale) : Promise.resolve(undefined),
          rawDescription ? translateText(rawDescription, locale) : Promise.resolve(undefined),
        ])

  const title = translatedTitle?.trim() || DEFAULT_SEO_TITLE[locale]
  const description = translatedDescription?.trim() || DEFAULT_SEO_DESCRIPTION[locale]

  return buildPageMetadata({ locale, path: '/yat-kiralama', title, description })
}

export default async function YatKiralamaPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: loc } = await params
  const locale = (isSiteLocale(loc) ? loc : 'tr') as SiteLocale

  let yachts = mapSanityYachtRowsToHomeCards([])
  let pageData: YachtRentalsPageData | null = null

  try {
    const [raw, page] = await Promise.all([
      client.fetch<SanityYachtCardRow[]>(yachtRentalsAllQuery, {}, { useCdn: true }),
      client.fetch<YachtRentalsPageData | null>(yachtRentalsPageQuery, {}, { useCdn: true }),
    ])
    pageData = page ?? null
    yachts = mapSanityYachtRowsToHomeCards(Array.isArray(raw) ? raw : [])
  } catch {
    yachts = []
  }

  const [titleTop, titleBottom, intro, emptyStateMessage] =
    locale === 'tr'
      ? [
          pageData?.titleTop?.trim() || DEFAULT_TITLE_TOP[locale],
          pageData?.titleBottom?.trim() || DEFAULT_TITLE_BOTTOM[locale],
          pageData?.intro?.trim() || DEFAULT_INTRO[locale],
          pageData?.emptyStateMessage?.trim() || DEFAULT_EMPTY[locale],
        ]
      : await Promise.all([
          pageData?.titleTop?.trim() ? translateText(pageData.titleTop, locale) : DEFAULT_TITLE_TOP[locale],
          pageData?.titleBottom?.trim() ? translateText(pageData.titleBottom, locale) : DEFAULT_TITLE_BOTTOM[locale],
          pageData?.intro?.trim() ? translateText(pageData.intro, locale) : DEFAULT_INTRO[locale],
          pageData?.emptyStateMessage?.trim()
            ? translateText(pageData.emptyStateMessage, locale)
            : DEFAULT_EMPTY[locale],
        ])

  const itemListSchema = buildItemListSchema(
    yachts.map((yacht) => ({
      name: yacht.name,
      url: withLocalePath(
        locale,
        yacht.locationSlug ? `/yat-kiralama/${yacht.locationSlug}/${yacht.slug}` : `/yat-kiralama/${yacht.slug}`
      ),
      image: yacht.coverImageUrl ?? undefined,
    }))
  )

  return (
    <div className="min-h-screen bg-white">
      <JsonLd data={itemListSchema} />
      <StandardPageLd type="CollectionPage" locale={locale} path="/yat-kiralama" name={LISTING_HEADINGS.yachts[locale]} description={intro || undefined} />
      <section className="w-full py-14 md:py-20" aria-labelledby="yachts-heading">
        <div className="mx-auto max-w-[1200px] px-4">
          <header className="mb-12 text-center">
            <h1 id="yachts-heading" className={listStyles.heading}>
              {titleTop && <span className={listStyles.headingLine1}>{titleTop}</span>}
              {titleTop && titleBottom ? ' ' : null}
              {titleBottom && <span className={listStyles.headingLine2}>{titleBottom}</span>}
            </h1>
            <p
              className="mx-auto mt-6 max-w-2xl whitespace-pre-wrap text-base leading-relaxed text-zinc-600 sm:text-[17px] sm:leading-[1.65]"
              style={{ fontFamily: 'var(--font-family)' }}
            >
              {intro}
            </p>
          </header>

          <h2 className="sr-only">{LISTING_HEADINGS.yachts[locale]}</h2>
          <YachtRentalListSection
            yachts={yachts}
            emptyStateMessage={emptyStateMessage}
            locale={locale}
          />
        </div>
      </section>
    </div>
  )
}
