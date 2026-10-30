import { NextResponse } from 'next/server'
import { client } from '@/lib/sanity'
import { getBaseUrl } from '@/lib/seo'
import { BUSINESS_FACTS } from '@/lib/seo/travelAgencyStructuredData'
import { SITE_BRAND } from '@/lib/seo/brand'
import { STATIC_HELP_CATEGORIES } from '@/lib/helpCenter/staticHelpData'

export const revalidate = 3600

type Row = { title?: string | null; slug?: string | null; summary?: string | null; price?: number | null }

/** Tek satır, gerekirse kelime sınırında kısaltılmış metin. */
function one(v: string | null | undefined, max = 220): string {
  const t = (v ?? '').replace(/\s+/g, ' ').trim()
  return t.length <= max ? t : `${t.slice(0, max).replace(/\s+\S*$/, '')}…`
}

async function fetchRows(query: string): Promise<Row[]> {
  try {
    return (await client.fetch<Row[]>(query)) ?? []
  } catch {
    return []
  }
}

/**
 * /llms.txt — yapay zekâ asistanları (ChatGPT, Claude, Perplexity, Gemini)
 * için sitenin düz metin özeti (llmstxt.org biçimi). İçerik Sanity'den canlı
 * üretilir: turlar, koylar, blog yazıları ve yardım merkezi her zaman güncel.
 */
export async function GET() {
  const base = getBaseUrl()
  const [tours, coves, posts, yachtLocations, ferries] = await Promise.all([
    fetchRows(`*[_type == "tour" && defined(slug.current) && seo.noIndex != true] | order(title asc){
      title, "slug": slug.current, "summary": coalesce(seo.metaDescription, shortDescription),
      "price": ticketClasses[0].pricesByAge[0].price
    }`),
    fetchRows(`*[_type == "cove" && defined(slug.current)] | order(title asc){
      title, "slug": slug.current, "summary": coalesce(seo.metaDescription, shortDescription, description)
    }`),
    fetchRows(`*[_type == "blog" && defined(slug.current)] | order(publishDate desc)[0...30]{
      title, "slug": slug.current, "summary": coalesce(seo.metaDescription, excerpt)
    }`),
    fetchRows(`*[_type == "yachtLocation" && defined(slug.current)] | order(title asc){ title, "slug": slug.current }`),
    fetchRows(`*[_type == "ferryRoute" && isActive != false && defined(slug.current)] | order(title asc){
      title, "slug": slug.current, "summary": cardDescription
    }`),
  ])

  const list = (rows: Row[], path: (slug: string) => string, withPrice = false) =>
    rows
      .filter((r) => r.slug && r.title)
      .map((r) => {
        const price = withPrice && r.price && r.price > 0 ? ` (kişi başı ${Math.round(r.price).toLocaleString('tr-TR')} ₺'den)` : ''
        const summary = one(r.summary)
        return `- [${one(r.title, 120)}](${base}${path(r.slug!)})${price}${summary ? `: ${summary}` : ''}`
      })
      .join('\n')

  const help = STATIC_HELP_CATEGORIES.map((c) => `- [${c.title}](${base}/yardim-merkezi/kategori/${c.slug})`).join('\n')

  const body = `# ${SITE_BRAND.tr} — Poseidon

> Çeşme (İzmir) çıkışlı günlük tekne turları, gün batımı turu, tüplü dalış, özel yat kiralama ve Sakız feribot biletleri için online rezervasyon ve bilet satış sitesi. Biletler online alınır; rezervasyon onayı e-posta ile gönderilir.

İşletme: ${BUSINESS_FACTS.name}
Adres: ${BUSINESS_FACTS.address}
Telefon: ${BUSINESS_FACTS.telephone}
E-posta: ${BUSINESS_FACTS.email}
WhatsApp: ${BUSINESS_FACTS.whatsappUrl}
Diller: Türkçe (${base}), English (${base}/en), Deutsch (${base}/de), Русский (${base}/ru)

## Tekne turları

${list(tours, (s) => `/tur/${s}`, true) || `- [Tüm turlar](${base}/turlar)`}

Tüm turlar ve fiyatlar: ${base}/turlar

## Özel yat kiralama

- [Yat kiralama](${base}/yat-kiralama): Çeşme ve çevresinde özel tekne ve yat kiralama
${list(yachtLocations, (s) => `/yat-kiralama/${s}`)}

## Feribot

${list(ferries, (s) => `/feribot/${s}`) || `- [Feribot biletleri](${base}/feribot)`}

## Koylar ve adalar rehberi

${list(coves, (s) => `/koylar/${s}`) || `- [Koylar](${base}/koylar)`}

## Yardım merkezi (rezervasyon, ödeme, iptal, ulaşım)

${help}
- [Sık sorulan sorular](${base}/sik-sorulanlar)

## Blog

${list(posts, (s) => `/blog/${s}`) || `- [Blog](${base}/blog)`}

## Kurumsal

- [Hakkımızda](${base}/hakkimizda)
- [İletişim](${base}/contact)
- [Teknedeki menü ve fiyatlar](${base}/menu)

## Optional

- [Sitemap](${base}/sitemap.xml)
- [English site](${base}/en)
- [Deutsche Seite](${base}/de)
- [Русская версия](${base}/ru)
`

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
