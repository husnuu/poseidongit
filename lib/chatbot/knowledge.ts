import { unstable_cache } from 'next/cache'
import { client, urlFor } from '@/lib/sanity'
import { extractChatDocument, type ExtractedDoc } from './documents'

/**
 * Sohbet asistanının bilgi kaynağı: Sanity'deki turlar, yatlar, SSS ve
 * iletişim bilgisi tek bir düz metne çevrilir. Metin system prompt'ta
 * önbelleğe alınır (prompt caching), bu yüzden çıktı deterministik olmalı:
 * sıralama sabit, tarih/saat gibi değişken bir şey yok. Sanity webhook'u
 * 'sanity' etiketini yeniledikçe metin de yenilenir.
 */

type PtSpan = { _type?: string; text?: string }
type PtBlock = { _type?: string; style?: string; listItem?: string; children?: PtSpan[] }
type RichText = string | PtBlock[] | null | undefined

type PriceByAge = { ageLabel?: string | null; minAge?: number | null; maxAge?: number | null; price?: number | null }
type TicketClass = {
  key?: string | null
  label?: string | null
  description?: string | null
  bullets?: string[] | null
  pricesByAge?: PriceByAge[] | null
  dateRangePrices?: Array<{ label?: string | null; start?: string | null; end?: string | null; pricesByAge?: PriceByAge[] | null }> | null
}

type TourRow = {
  _id: string
  title?: string | null
  slug?: string | null
  shortDescription?: string | null
  description?: RichText
  privateTour?: boolean | null
  singlePrice?: boolean | null
  cashPaymentEnabled?: boolean | null
  deposit?: { enabled?: boolean | null; type?: string | null; value?: number | null } | null
  quickFacts?: {
    durationText?: string | null
    availabilityText?: string | null
    meetingLocation?: string | null
    startTime?: string | null
    returnTime?: string | null
    language?: string | null
    groupType?: string | null
    maxCapacity?: number | string | null
  } | null
  highlights?: Array<{ title?: string | null; description?: string | null }> | null
  tourDetails?: Array<{ label?: string | null; value?: string | null }> | null
  itinerary?: Array<{ time?: string | null; title?: string | null; description?: string | null }> | null
  included?: string[] | null
  notIncluded?: string[] | null
  faqs?: Array<{ question?: string | null; answer?: RichText }> | null
  whereSection?: { meetingPointLabel?: string | null; meetingPointAddress?: string | null; locationMapLink?: string | null } | null
  pickupPoints?: Array<{ name?: string | null; address?: string | null; description?: string | null }> | null
  mealMenu?: { enabled?: boolean | null; description?: string | null; options?: Array<{ label?: string | null; description?: string | null }> | null } | null
  bookingRules?: { show?: boolean | null; bullets?: string[] | null } | null
  ticketClasses?: TicketClass[] | null
  rating?: number | null
  reviewCount?: number | null
  boatName?: string | null
  mainImage?: { asset?: unknown } | null
}

type YachtRow = {
  name?: string | null
  slug?: string | null
  locationSlug?: string | null
  locationTitle?: string | null
  marina?: string | null
  departurePoint?: string | null
  yachtType?: string | null
  shortDescription?: string | null
  dailyRentalEnabled?: boolean | null
  overnightRentalEnabled?: boolean | null
  priceFrom?: number | null
  overnightPriceFrom?: number | null
  overnightTotalPrice?: number | null
  currency?: string | null
  amenities?: string[] | null
  included?: string[] | null
  notIncluded?: string[] | null
  specifications?: { capacity?: number | null; cabins?: number | null; wc?: string | null; length?: string | null; crew?: string | null; buildYear?: number | null } | null
}

type KnowledgeQueryResult = {
  tours?: TourRow[] | null
  yachts?: YachtRow[] | null
  faq?: Array<{ sectionTitle?: string | null; items?: Array<{ question?: string | null; answer?: RichText }> | null }> | null
  contact?: { phone?: string | null; whatsapp?: string | null; email?: string | null; address?: string | null } | null
  assistant?: {
    notes?: string | null
    files?: Array<{ key?: string; title?: string | null; assetId?: string | null; url?: string | null; filename?: string | null; mimeType?: string | null }> | null
  } | null
}

const KNOWLEDGE_QUERY = `{
  "tours": *[_type == "tour" && defined(slug.current) && !(_id in path("drafts.**"))]
    | order(coalesce(isPopular, false) desc, title asc) {
    _id, title, "slug": slug.current, shortDescription, description,
    privateTour, singlePrice, cashPaymentEnabled, deposit{ enabled, type, value },
    quickFacts{ durationText, availabilityText, meetingLocation, startTime, returnTime, language, groupType, maxCapacity },
    highlights[]{ title, description }, tourDetails[]{ label, value }, itinerary[]{ time, title, description },
    included, notIncluded, faqs[]{ question, answer },
    whereSection{ meetingPointLabel, meetingPointAddress, locationMapLink },
    pickupPoints[]{ name, address, description },
    mealMenu{ enabled, description, options[]{ label, description } },
    bookingRules{ show, bullets },
    ticketClasses[]{ key, label, description, bullets,
      pricesByAge[]{ ageLabel, minAge, maxAge, price },
      dateRangePrices[]{ label, start, end, pricesByAge[]{ ageLabel, minAge, maxAge, price } } },
    rating, reviewCount, "boatName": coalesce(ticketBoatName, boat->name), mainImage{ asset }
  },
  "yachts": *[_type == "yachtRental" && defined(slug.current) && !(_id in path("drafts.**"))] | order(name asc) {
    name, "slug": slug.current, "locationSlug": location->slug.current, "locationTitle": location->title,
    marina, departurePoint, yachtType, shortDescription, dailyRentalEnabled, overnightRentalEnabled,
    priceFrom, overnightPriceFrom, overnightTotalPrice, currency, amenities, included, notIncluded,
    specifications{ capacity, cabins, wc, length, crew, buildYear }
  },
  "faq": *[_type == "faqPage"][0].sections[]{ sectionTitle, items[]{ question, answer } },
  "contact": *[_type == "siteSettings"][0].contactInfo{ phone, whatsapp, email, address },
  "assistant": *[_type == "chatbotSettings" && _id == "chatbotSettings"][0]{
    notes,
    "files": knowledgeFiles[enabled != false && defined(file.asset)]{
      "key": _key, title, "assetId": file.asset->_id, "url": file.asset->url,
      "filename": file.asset->originalFilename, "mimeType": file.asset->mimeType
    }
  }
}`

/** Müsaitlik aracının doğrulaması ve sohbetteki tur kartları için tur kaydı. */
export type ChatTourRef = {
  slug: string
  title: string
  privateTour: boolean
  classes: Array<{ key: string; label: string }>
  imageUrl: string | null
  /** Kartta "…'den başlayan": sınıflardaki en düşük yetişkin fiyatı (özel turda grup fiyatı). */
  priceFrom: number | null
  duration: string | null
}

/** Bir sınıfın yetişkin fiyatı: etiketi "Yetişkin/Adult" olan ya da en büyük yaş aralığındaki fiyat. */
function adultPrice(c: TicketClass): number | null {
  const prices = (c.pricesByAge ?? []).filter((p) => p.price != null && p.price > 0)
  if (!prices.length) return null
  const byLabel = prices.find((p) => /yetişkin|adult|erwachsen|взросл/i.test(p.ageLabel ?? ''))
  if (byLabel) return byLabel.price as number
  return [...prices].sort((a, b) => (b.minAge ?? 0) - (a.minAge ?? 0))[0].price as number
}

function tourImage(asset: unknown): string | null {
  if (!asset) return null
  try {
    return urlFor(asset as Parameters<typeof urlFor>[0]).width(480).height(300).fit('crop').auto('format').url()
  } catch {
    return null
  }
}

/** Studio'dan yüklenen belgenin okunma durumu (admin durum sayfası için). */
export type ChatDocStatus = {
  title: string
  filename: string
  chars: number
  truncated: boolean
  pages?: number
  error?: ExtractedDoc['error']
  preview: string
}

export type ChatKnowledge = {
  text: string
  tours: ChatTourRef[]
  documents: ChatDocStatus[]
  notesChars: number
}

function clean(s: string | null | undefined): string {
  return (s ?? '').replace(/\s+/g, ' ').trim()
}

/** Portable Text veya düz metni sade metne çevirir (liste maddeleri "- " ile). */
function richToText(value: RichText): string {
  if (!value) return ''
  if (typeof value === 'string') return value.trim()
  return value
    .filter((b) => b?._type === 'block')
    .map((b) => {
      const line = (b.children ?? []).map((c) => c.text ?? '').join('').trim()
      if (!line) return ''
      return b.listItem ? `- ${line}` : line
    })
    .filter(Boolean)
    .join('\n')
}

function money(n: number | null | undefined, currency = 'TRY'): string {
  if (n == null || !Number.isFinite(n)) return ''
  const amount = n.toLocaleString('tr-TR')
  if (currency === 'TRY' || currency === 'TL' || !currency) return `${amount} ₺`
  if (currency === 'EUR') return `${amount} €`
  if (currency === 'USD') return `${amount} $`
  return `${amount} ${currency}`
}

function ageText(p: PriceByAge): string {
  const label = clean(p.ageLabel) || 'Kişi'
  const range =
    p.minAge != null && p.maxAge != null ? ` (${p.minAge}–${p.maxAge} yaş)` : p.minAge != null ? ` (${p.minAge}+ yaş)` : ''
  return `${label}${range}: ${p.price != null ? money(p.price) : '—'}`
}

function list(label: string, items: Array<string | null | undefined> | null | undefined): string | null {
  const xs = (items ?? []).map((x) => clean(x)).filter(Boolean)
  return xs.length ? `${label}: ${xs.join('; ')}` : null
}

function tourBlock(t: TourRow): string {
  const lines: string[] = []
  lines.push(`### Tur: ${clean(t.title)}`)
  lines.push(`Sayfa: /tur/${t.slug}`)
  if (t.shortDescription) lines.push(`Kısa açıklama: ${clean(t.shortDescription)}`)
  const q = t.quickFacts ?? {}
  const facts = [
    q.durationText && `Süre: ${clean(q.durationText)}`,
    q.startTime && `Kalkış saati: ${clean(q.startTime)}`,
    q.returnTime && `Dönüş saati: ${clean(q.returnTime)}`,
    q.availabilityText && `Çalıştığı günler: ${clean(q.availabilityText)}`,
    q.meetingLocation && `Kalkış/buluşma: ${clean(q.meetingLocation)}`,
    q.language && `Dil: ${clean(q.language)}`,
    q.groupType && `Grup: ${clean(q.groupType)}`,
    q.maxCapacity != null && `Kapasite: ${q.maxCapacity}`,
    t.boatName && `Tekne: ${clean(t.boatName)}`,
  ].filter(Boolean)
  if (facts.length) lines.push(facts.join(' | '))
  if (t.whereSection?.meetingPointLabel || t.whereSection?.meetingPointAddress) {
    lines.push(
      `Buluşma noktası: ${[clean(t.whereSection.meetingPointLabel), clean(t.whereSection.meetingPointAddress)].filter(Boolean).join(' — ')}` +
        (t.whereSection.locationMapLink ? ` (Harita: ${t.whereSection.locationMapLink})` : '')
    )
  }
  const payment: string[] = []
  if (t.privateTour) payment.push('Özel tur: fiyat kişi başı değil, tüm grup içindir; online ödeme alınmaz, rezervasyon talebi gönderilir ve ekip onaylar')
  else if (t.cashPaymentEnabled) payment.push('Ödeme: rezervasyon online yapılır, ödeme teknede nakit alınır')
  else payment.push('Ödeme: online kartla')
  if (!t.privateTour && t.deposit?.enabled && t.deposit.value != null) {
    payment.push(t.deposit.type === 'percent' || t.deposit.type === 'percentage' ? `Kapora: %${t.deposit.value}` : `Kapora: ${money(t.deposit.value)}`)
  }
  lines.push(payment.join(' | '))

  const classes = (t.ticketClasses ?? []).filter((c) => c?.key || c?.label)
  if (classes.length) {
    lines.push(t.singlePrice ? 'Fiyatlar (tek fiyat):' : 'Bilet sınıfları ve fiyatlar:')
    for (const c of classes) {
      const prices = (c.pricesByAge ?? []).map(ageText).join('; ')
      lines.push(`- ${clean(c.label) || clean(c.key)}${prices ? `: ${prices}` : ''}`)
      if (c.description) lines.push(`  Açıklama: ${clean(c.description)}`)
      const bullets = (c.bullets ?? []).map(clean).filter(Boolean)
      if (bullets.length) lines.push(`  Özellikler: ${bullets.join('; ')}`)
      for (const r of c.dateRangePrices ?? []) {
        const rp = (r.pricesByAge ?? []).map(ageText).join('; ')
        if (rp) lines.push(`  ${clean(r.label) || 'Tarih aralığı'} (${r.start ?? '?'} – ${r.end ?? '?'}): ${rp}`)
      }
    }
  }

  const itinerary = (t.itinerary ?? [])
    .map((i) => [clean(i.time), clean(i.title), clean(i.description)].filter(Boolean).join(' — '))
    .filter(Boolean)
  if (itinerary.length) lines.push(`Program: ${itinerary.join(' | ')}`)
  for (const l of [
    list('Dahil', t.included),
    list('Dahil değil', t.notIncluded),
    list('Öne çıkanlar', (t.highlights ?? []).map((h) => [clean(h.title), clean(h.description)].filter(Boolean).join(': '))),
    list('Detaylar', (t.tourDetails ?? []).map((d) => [clean(d.label), clean(d.value)].filter(Boolean).join(': '))),
    list('Alınış noktaları', (t.pickupPoints ?? []).map((p) => [clean(p.name), clean(p.address), clean(p.description)].filter(Boolean).join(', '))),
    t.mealMenu?.enabled
      ? list('Yemek seçenekleri', (t.mealMenu.options ?? []).map((o) => [clean(o.label), clean(o.description)].filter(Boolean).join(': ')))
      : null,
    t.bookingRules?.show !== false ? list('Rezervasyon kuralları', t.bookingRules?.bullets) : null,
  ]) {
    if (l) lines.push(l)
  }
  if (t.mealMenu?.enabled && t.mealMenu.description) lines.push(`Yemek: ${clean(t.mealMenu.description)}`)
  if (t.rating != null) lines.push(`Puan: ${t.rating}${t.reviewCount ? ` (${t.reviewCount} değerlendirme)` : ''}`)
  const description = richToText(t.description)
  if (description) lines.push(`Detaylı açıklama:\n${description}`)
  const faqs = (t.faqs ?? []).filter((f) => f.question && f.answer)
  if (faqs.length) {
    lines.push('Bu turla ilgili SSS:')
    for (const f of faqs) lines.push(`S: ${clean(f.question)}\nC: ${richToText(f.answer)}`)
  }
  return lines.join('\n')
}

function yachtBlock(y: YachtRow): string {
  const lines: string[] = []
  const path = y.locationSlug ? `/yat-kiralama/${y.locationSlug}/${y.slug}` : `/yat-kiralama/${y.slug}`
  lines.push(`### Yat: ${clean(y.name)}`)
  lines.push(`Sayfa: ${path}`)
  const s = y.specifications ?? {}
  const facts = [
    y.yachtType && `Tür: ${clean(y.yachtType)}`,
    y.locationTitle && `Lokasyon: ${clean(y.locationTitle)}`,
    y.marina && `Marina: ${clean(y.marina)}`,
    y.departurePoint && `Kalkış: ${clean(y.departurePoint)}`,
    s.capacity != null && `Kapasite: ${s.capacity} kişi`,
    s.cabins != null && `Kabin: ${s.cabins}`,
    s.length && `Uzunluk: ${clean(s.length)}`,
    s.crew && `Mürettebat: ${clean(s.crew)}`,
    s.wc && `WC: ${clean(s.wc)}`,
    s.buildYear != null && `Yapım yılı: ${s.buildYear}`,
  ].filter(Boolean)
  if (facts.length) lines.push(facts.join(' | '))
  const cur = y.currency ?? 'TRY'
  const prices = [
    y.dailyRentalEnabled !== false && y.priceFrom != null && `Günlük kiralama: ${money(y.priceFrom, cur)}'den başlayan`,
    y.overnightRentalEnabled && y.overnightPriceFrom != null && `Konaklamalı: gecelik ${money(y.overnightPriceFrom, cur)}'den başlayan`,
    y.overnightRentalEnabled && y.overnightTotalPrice != null && `Konaklamalı toplam: ${money(y.overnightTotalPrice, cur)}`,
  ].filter(Boolean)
  if (prices.length) lines.push(prices.join(' | '))
  lines.push('Rezervasyon: yat sayfasındaki form ile talep gönderilir; ekip fiyatı ve müsaitliği teyit eder.')
  if (y.shortDescription) lines.push(`Açıklama: ${clean(y.shortDescription)}`)
  for (const l of [list('Olanaklar', y.amenities), list('Dahil', y.included), list('Dahil değil', y.notIncluded)]) {
    if (l) lines.push(l)
  }
  return lines.join('\n')
}

async function buildKnowledge(): Promise<ChatKnowledge> {
  const data = await client.fetch<KnowledgeQueryResult>(KNOWLEDGE_QUERY)
  const tours = (data.tours ?? []).filter((t) => t.slug && clean(t.title))
  const yachts = (data.yachts ?? []).filter((y) => y.slug && clean(y.name))
  const sections: string[] = []

  const c = data.contact ?? {}
  const contact = [
    c.phone && `Telefon: ${clean(c.phone)}`,
    c.whatsapp && `WhatsApp: ${clean(c.whatsapp)}`,
    c.email && `E-posta: ${clean(c.email)}`,
    c.address && `Adres: ${clean(c.address)}`,
  ].filter(Boolean)
  sections.push(`## İletişim\n${contact.length ? contact.join('\n') : 'İletişim bilgisi için /contact sayfası.'}\nİletişim sayfası: /contact`)

  sections.push(`## Turlar (${tours.length})\nTüm turlar: /turlar\n\n${tours.map(tourBlock).join('\n\n')}`)
  if (yachts.length) sections.push(`## Yat kiralama (${yachts.length})\nTüm yatlar: /yat-kiralama\n\n${yachts.map(yachtBlock).join('\n\n')}`)

  const faq = (data.faq ?? [])
    .map((s) => {
      const items = (s.items ?? []).filter((i) => i.question && i.answer)
      if (!items.length) return ''
      return `### ${clean(s.sectionTitle) || 'Genel'}\n${items.map((i) => `S: ${clean(i.question)}\nC: ${richToText(i.answer)}`).join('\n')}`
    })
    .filter(Boolean)
  if (faq.length) sections.push(`## Sık sorulan sorular (genel)\nSSS sayfası: /sik-sorulanlar\n\n${faq.join('\n\n')}`)

  // Studio → "Sohbet Asistanı": yüklenen belgeler + serbest metin (Studio'daki sırayla).
  const files = (data.assistant?.files ?? []).filter((f) => f.assetId && f.url)
  const extracted = await Promise.all(
    files.map((f) => extractChatDocument(f.assetId as string, f.url as string, f.filename ?? '', f.mimeType ?? ''))
  )
  const documents: ChatDocStatus[] = files.map((f, i) => ({
    title: clean(f.title) || clean(f.filename) || 'Belge',
    filename: f.filename ?? '',
    chars: extracted[i].chars,
    truncated: extracted[i].truncated,
    pages: extracted[i].pages,
    error: extracted[i].error,
    preview: extracted[i].text.slice(0, 600),
  }))
  const notes = (data.assistant?.notes ?? '').trim()
  const docBlocks = documents
    .map((d, i) => (extracted[i].text ? `### Belge: ${d.title}\n${extracted[i].text}${d.truncated ? '\n[Belgenin devamı uzunluk sınırı nedeniyle alınmadı.]' : ''}` : ''))
    .filter(Boolean)
  if (notes) docBlocks.push(`### Ek bilgiler\n${notes}`)
  if (docBlocks.length) {
    sections.push(`## İşletme belgeleri\nİşletmenin Studio'dan yüklediği SSS, kural ve bilgi belgeleri.\n\n${docBlocks.join('\n\n')}`)
  }

  return {
    text: sections.join('\n\n'),
    documents,
    notesChars: notes.length,
    tours: tours.map((t) => ({
      slug: t.slug as string,
      title: clean(t.title),
      privateTour: Boolean(t.privateTour),
      classes: (t.ticketClasses ?? [])
        .filter((cl) => cl?.key)
        .map((cl) => ({ key: String(cl.key), label: clean(cl.label) || String(cl.key) })),
      imageUrl: tourImage(t.mainImage?.asset),
      priceFrom: (() => {
        const xs = (t.ticketClasses ?? []).map(adultPrice).filter((n): n is number => n != null)
        return xs.length ? Math.min(...xs) : null
      })(),
      duration: clean(t.quickFacts?.durationText) || null,
    })),
  }
}

/** Sanity değişince ('sanity' etiketi) yenilenir; aksi halde 10 dakika önbellekte. */
export const getChatKnowledge = unstable_cache(buildKnowledge, ['chatbot-knowledge-v1'], {
  revalidate: 600,
  tags: ['sanity'],
})
