import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import JsonLd from '@/components/seo/JsonLd'
import {
  faqPageQuery,
  homePageHeroImageUrlsQuery,
  siteSettingsTravelAgencyImagesQuery,
} from '@/lib/queries'
import { client } from '@/lib/sanity'
import { buildTravelAgencyStructuredData } from '@/lib/seo/travelAgencyStructuredData'
import { travelAgencyImageOverridesFromSanity } from '@/lib/seo/travelAgencySanityImages'
import { absoluteUrl, buildFAQSchema } from '@/lib/seo'
import { withLocalePath } from '@/lib/i18n/paths'
import type { SiteLocale } from '@/lib/i18n/config'
import { isSiteLocale } from '@/lib/i18n/config'

export const metadata: Metadata = {
  title: 'JSON-LD önizleme (TravelAgency + FAQ)',
  robots: { index: false, follow: false },
}

type FaqItemRaw = {
  question?: string | null
  answer?: string | null
}

type FaqSection = {
  sectionTitle?: string | null
  items?: FaqItemRaw[] | null
}

type FaqPageData = {
  sections?: FaqSection[] | null
}

function flattenFaqPairs(sections: FaqSection[]): Array<{ question: string; answer: string }> {
  const out: Array<{ question: string; answer: string }> = []
  for (const section of sections) {
    for (const it of section.items ?? []) {
      const q = it.question?.trim()
      const a = it.answer?.trim()
      if (q && a) out.push({ question: q, answer: a })
    }
  }
  return out
}

export default async function SeoSchemaPreviewPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  if (!isSiteLocale(raw)) notFound()
  const locale = raw as SiteLocale

  let travelAgencyData = buildTravelAgencyStructuredData()
  let faqSchema: ReturnType<typeof buildFAQSchema> | null = null

  try {
    const [settingsRow, heroRow, faqDoc] = await Promise.all([
      client.fetch(siteSettingsTravelAgencyImagesQuery, {}, { useCdn: false }),
      client.fetch(homePageHeroImageUrlsQuery, {}, { useCdn: false }),
      client.fetch<FaqPageData | null>(faqPageQuery, {}, { useCdn: false }),
    ])

    const overrides = travelAgencyImageOverridesFromSanity({
      settings: settingsRow,
      hero: heroRow,
    })
    travelAgencyData = buildTravelAgencyStructuredData(overrides)

    const faqSections = (faqDoc?.sections ?? []).filter(
      (s) => s.sectionTitle && (s.items?.length ?? 0) > 0
    )
    const faqPairs = flattenFaqPairs(faqSections)
    if (faqPairs.length > 0) {
      const faqUrl = absoluteUrl(withLocalePath(locale, '/sik-sorulanlar'))
      faqSchema = buildFAQSchema(faqPairs, { url: faqUrl })
    }
  } catch {
    // Önizleme: Sanity yoksa TravelAgency yedekleriyle, FAQ blokları basılmaz
  }

  const travelPretty = JSON.stringify(travelAgencyData, null, 2)
  const faqPretty = faqSchema ? JSON.stringify(faqSchema, null, 2) : null

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 text-zinc-800">
      <JsonLd data={travelAgencyData} />
      {faqSchema && <JsonLd data={faqSchema} />}

      <h1 className="text-xl font-bold text-zinc-900">JSON-LD önizlemesi</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Bu sayfa noindex. Aşağıdaki yapılar canlıda ana sayfa (TravelAgency) ve Sık Sorulanlar
        (FAQPage) ile aynı Sanity kaynağından üretilir.
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        Rich Results:{' '}
        <a
          className="text-blue-700 underline"
          href="https://search.google.com/test/rich-results"
          target="_blank"
          rel="noreferrer"
        >
          Google Rich Results Test
        </a>
      </p>

      <h2 className="mt-10 text-lg font-semibold text-zinc-900">TravelAgency</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Metin:{' '}
        <code className="rounded bg-zinc-100 px-1">lib/seo/travelAgencyStructuredData.ts</code> —
        görseller: Site Ayarları + hero.
      </p>
      <pre className="mt-3 max-h-[50vh] overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-xs leading-relaxed">
        {travelPretty}
      </pre>

      <h2 className="mt-10 text-lg font-semibold text-zinc-900">FAQPage</h2>
      <p className="mt-1 text-sm text-zinc-600">
        İçerik: Sanity → Sık Sorulanlar dokümanı. Soru yoksa bu blok önizlemede de basılmaz.
      </p>
      {faqPretty ? (
        <pre className="mt-3 max-h-[50vh] overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-xs leading-relaxed">
          {faqPretty}
        </pre>
      ) : (
        <p className="mt-3 text-sm text-zinc-500">Sanity&apos;de henüz geçerli SSS yok veya istek başarısız.</p>
      )}
    </div>
  )
}
