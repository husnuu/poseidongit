import { createHmac, timingSafeEqual } from 'node:crypto'
import { revalidatePath, revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { getBaseUrl } from '@/lib/seo'
import { SANITY_CACHE_TAG } from '@/lib/sanity'
import { localizedUrls, submitIndexNow } from '@/lib/seo/indexNow'

export const runtime = 'nodejs'

/**
 * Sanity webhook'u: içerik yayımlandığında/silindiğinde tüm sayfaları ve
 * sitemap'i hemen yeniler (ISR önbelleği beklenmez) ve değişen sayfaları
 * IndexNow ile Bing/Yandex'e bildirir.
 *
 * Sanity → API → Webhooks ayarı (docs/SEO_KURULUM.md):
 *   URL:        https://cesmetekneturu.net/api/revalidate
 *   Trigger:    Create, Update, Delete — Filter boş (tüm belgeler)
 *   Projection: {_type, "slug": slug.current, "en": translations.en.slug.current,
 *                "de": translations.de.slug.current, "ru": translations.ru.slug.current}
 *   Secret:     SANITY_REVALIDATE_SECRET ile aynı değer
 */

type Payload = {
  _type?: string
  slug?: string | null
  en?: string | null
  de?: string | null
  ru?: string | null
}

/** Sanity imzası: "t=<ms>,v1=<base64url(HMAC-SHA256(secret, `${t}.${body}`))>" */
function validSanitySignature(header: string | null, body: string, secret: string): boolean {
  if (!header) return false
  const parts = Object.fromEntries(
    header.split(',').map((p) => {
      const i = p.indexOf('=')
      return [p.slice(0, i).trim(), p.slice(i + 1).trim()]
    })
  )
  const t = parts.t
  const v1 = parts.v1
  if (!t || !v1) return false
  // 5 dakikadan eski imzalar reddedilir (tekrar gönderme saldırısına karşı).
  if (Math.abs(Date.now() - Number(t)) > 5 * 60 * 1000) return false
  const expected = createHmac('sha256', secret).update(`${t}.${body}`).digest('base64url')
  const a = Buffer.from(expected)
  const b = Buffer.from(v1)
  return a.length === b.length && timingSafeEqual(a, b)
}

/** Belge tipine göre değişen public sayfalar (IndexNow bildirimi için). */
function changedUrls(p: Payload): string[] {
  const slugs = { tr: p.slug, en: p.en || p.slug, de: p.de || p.slug, ru: p.ru || p.slug }
  const detail = (segment: string, list: string) =>
    p.slug ? [...localizedUrls(`/${segment}/${p.slug}`, slugs, segment), ...localizedUrls(list)] : localizedUrls(list)
  switch (p._type) {
    case 'tour':
      return [...detail('tur', '/turlar'), ...localizedUrls('/')]
    case 'cove':
      return detail('koylar', '/koylar')
    case 'blog':
      return detail('blog', '/blog')
    case 'legalPage':
      return p.slug ? localizedUrls(`/yasal/${p.slug}`) : []
    case 'ferryRoute':
      return detail('feribot', '/feribot')
    case 'yachtLocation':
      return detail('yat-kiralama', '/yat-kiralama')
    case 'yachtRental':
    case 'yachtRentalsPage':
      return localizedUrls('/yat-kiralama')
    case 'homePage':
      return localizedUrls('/')
    case 'toursPage':
      return localizedUrls('/turlar')
    case 'covesPage':
      return localizedUrls('/koylar')
    case 'blogPage':
      return localizedUrls('/blog')
    case 'aboutPage':
      return localizedUrls('/hakkimizda')
    case 'contactPage':
      return localizedUrls('/contact')
    case 'faqPage':
      return localizedUrls('/sik-sorulanlar')
    case 'menuItem':
      return localizedUrls('/menu')
    default:
      return []
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET?.trim()
  if (!secret) return NextResponse.json({ error: 'SANITY_REVALIDATE_SECRET not set' }, { status: 500 })

  const body = await req.text()
  if (!validSanitySignature(req.headers.get('sanity-webhook-signature'), body, secret)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  let payload: Payload = {}
  try {
    payload = JSON.parse(body) as Payload
  } catch {
    /* projeksiyon boş olabilir — yine de her şey yenilenir */
  }

  // Sanity verisiyle üretilmiş tüm sayfalar (tüm diller, sitemap, llms.txt) —
  // içerik sayfalar arasında paylaşıldığı için (ör. tur kartları ana sayfada da)
  // seçici yenileme yerine tamamı. revalidatePath('/', 'layout') KULLANILMIYOR:
  // o, sayfa yollarına bağlı çeviri önbelleğini de silip tüm siteyi yeniden
  // makine çevirisine (DeepL kotası + yavaş ilk açılış) gönderiyordu.
  revalidateTag(SANITY_CACHE_TAG)
  revalidatePath('/sitemap.xml')
  revalidatePath('/llms.txt')

  const urls = changedUrls(payload)
  const indexNow = urls.length > 0 ? await submitIndexNow(urls) : { ok: false, skipped: 'no public urls' }

  return NextResponse.json({
    revalidated: true,
    type: payload._type ?? null,
    indexNow: { ...indexNow, count: urls.length },
    base: getBaseUrl(),
  })
}
