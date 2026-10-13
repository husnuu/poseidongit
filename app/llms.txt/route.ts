import { getBaseUrl, getSiteName } from '@/lib/seo'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

/**
 * llms.txt — AI/LLM crawler'lar için site özeti (llmstxt.org benzeri format).
 * SEO ve AI referansları için /llms.txt adresinde sunulur.
 */
export async function GET() {
  const base = getBaseUrl()
  const siteName = getSiteName()
  const heading = siteName ? `${siteName} – Tekne Turları ve Rezervasyon` : 'Tekne Turları ve Rezervasyon'

  const body = `# ${heading}

> Tekne turları, adalar ve koylar gezisi, online bilet ve rezervasyon. Günlük turlar, özel kiralama ve kurumsal etkinlikler.

## Ana Sayfalar

- [Ana Sayfa](${base}/)
- [Turlar](${base}/turlar) – Tekne turları listesi ve fiyatlar
- [Yat Kiralama](${base}/yat-kiralama) – Özel yat kiralama
- [Feribot](${base}/feribot) – Feribot bileti hatları
- [Koylar](${base}/koylar) – Koylar rehberi
- [Menü](${base}/menu) – Tekne üstü menü
- [Hakkımızda](${base}/hakkimizda)
- [İletişim](${base}/contact) – İletişim formu
- [Sık Sorulanlar](${base}/sik-sorulanlar) – SSS
- [Yardım Merkezi](${base}/yardim-merkezi) – Rezervasyon, ödeme, iptal rehberleri
- [Blog](${base}/blog) – Gezi ve tur yazıları

## Tekne Turları

Tur detayları, fiyatlar ve rezervasyon her tur sayfasında mevcuttur (ör. ${base}/tur/cesme-tekne-turu). Tur listesi: ${base}/turlar

## Yat Kiralama

Özel yat kiralama için kapora bilgisi: ${base}/yat-kapora

## Teknik

- Sitemap (tüm sayfalar): ${base}/sitemap.xml
${siteName ? `- Site adı: ${siteName}\n` : ''}- Dil: Türkçe (TR)
- Konum: İzmir, Türkiye
`

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate',
    },
  })
}
