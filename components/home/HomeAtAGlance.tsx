import Image from 'next/image'
import Link from 'next/link'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'
import type { TourListItem } from '@/components/tours/TourCard'
import { tourCardDisplayPrice } from '@/lib/tourCardPrice'

const NUMBER_LOCALE: Record<SiteLocale, string> = { tr: 'tr-TR', en: 'en-GB', de: 'de-DE', ru: 'ru-RU' }

/** Gizlilik Politikası'ndaki ticari marka adı (veri sorumlusu bölümü). */
const BRAND = 'Poseidon Tekne Turu'

type Copy = {
  heading: string
  /** Tanım cümlesi ("X, … olan bir …dır") + kısa cevap. */
  summary: (o: { hasYachts: boolean; minPrice: string | null }) => string
  caption: string
  cols: { tour: string; duration: string; departure: string; price: string }
  perPerson: string
  perGroup: string
  viewAll: string
  updated: string
}

const COPY: Record<SiteLocale, Copy> = {
  tr: {
    heading: 'Çeşme tekne turları bir bakışta',
    summary: ({ hasYachts, minPrice }) =>
      `${BRAND}, Çeşme'de günlük tekne turları${hasYachts ? ' ve özel yat kiralama' : ''} hizmeti sunan, TÜRSAB üyesi bir tur işletmesidir. Biletler online alınır, rezervasyon onayı e-postayla gönderilir.${
        minPrice ? ` Tur fiyatları kişi başı ${minPrice}'den başlar.` : ''
      }`,
    caption: 'Popüler turların süre, kalkış noktası ve fiyat karşılaştırması',
    cols: { tour: 'Tur', duration: 'Süre', departure: 'Kalkış', price: 'Başlangıç fiyatı' },
    perPerson: 'kişi başı',
    perGroup: 'grup fiyatı',
    viewAll: 'Tüm Turları Görüntüle',
    updated: 'Son güncelleme',
  },
  en: {
    heading: 'Çeşme boat tours at a glance',
    summary: ({ hasYachts, minPrice }) =>
      `${BRAND} is a TÜRSAB-member tour operator in Çeşme offering daily boat tours${hasYachts ? ' and private yacht charters' : ''}. Tickets are booked online and confirmed by email.${
        minPrice ? ` Tour prices start from ${minPrice} per person.` : ''
      }`,
    caption: 'Duration, departure point and price of our most popular tours',
    cols: { tour: 'Tour', duration: 'Duration', departure: 'Departure', price: 'From' },
    perPerson: 'per person',
    perGroup: 'per group',
    viewAll: 'View All Tours',
    updated: 'Last updated',
  },
  de: {
    heading: 'Bootstouren in Çeşme auf einen Blick',
    summary: ({ hasYachts, minPrice }) =>
      `${BRAND} ist ein TÜRSAB-Mitglied und Tourveranstalter in Çeşme mit täglichen Bootstouren${hasYachts ? ' und privaten Yachtcharters' : ''}. Tickets werden online gebucht und per E-Mail bestätigt.${
        minPrice ? ` Die Tourpreise beginnen bei ${minPrice} pro Person.` : ''
      }`,
    caption: 'Dauer, Abfahrtsort und Preis unserer beliebtesten Touren',
    cols: { tour: 'Tour', duration: 'Dauer', departure: 'Abfahrt', price: 'Ab' },
    perPerson: 'pro Person',
    perGroup: 'pro Gruppe',
    viewAll: 'Alle Touren anzeigen',
    updated: 'Zuletzt aktualisiert',
  },
  ru: {
    heading: 'Морские прогулки в Чешме: коротко',
    summary: ({ hasYachts, minPrice }) =>
      `${BRAND} — туроператор в Чешме, член TÜRSAB, который проводит ежедневные морские прогулки${hasYachts ? ' и сдаёт яхты в частную аренду' : ''}. Билеты бронируются онлайн, подтверждение приходит по электронной почте.${
        minPrice ? ` Цены на туры — от ${minPrice} с человека.` : ''
      }`,
    caption: 'Продолжительность, место отправления и цена популярных туров',
    cols: { tour: 'Тур', duration: 'Длительность', departure: 'Отправление', price: 'Цена от' },
    perPerson: 'с человека',
    perGroup: 'за группу',
    viewAll: 'Посмотреть все туры',
    updated: 'Обновлено',
  },
}

/**
 * Ana sayfa "bir bakışta" bölümü: yapay zekâ özetlerinin ve aramadaki kısa
 * cevapların doğrudan alıntılayabileceği bir tanım cümlesi + popüler turların
 * karşılaştırma tablosu. Tüm değerler turların kendi verisinden gelir
 * (süre/kalkış: tur "hızlı bilgiler", fiyat: kartlardaki fiyat).
 *
 * HTML'de gerçek bir <table> (başlıklar ekran okuyucu/tarayıcı botları için
 * sr-only) ama görünümde küçük fotoğraflı sade bir liste: her satır blok/flex,
 * küçük görsel satıra göre mutlak konumlu, tur linki tüm satırı kaplar.
 */
export default function HomeAtAGlance({
  tours,
  hasYachts,
  updatedAt,
  locale,
}: {
  tours: TourListItem[]
  hasYachts: boolean
  /** Tablodaki turların en yeni güncellenme zamanı (Sanity _updatedAt). */
  updatedAt: string | null
  locale: SiteLocale
}) {
  const rows = tours.filter((t) => t.title && t.slug)
  if (rows.length === 0) return null

  const copy = COPY[locale]
  const numLoc = NUMBER_LOCALE[locale]
  const price = (n: number) => `${n.toLocaleString(numLoc)} ₺`
  // Kartlarla aynı fiyat (Sanity'de kart indirimi açıksa indirimli).
  const shownPrice = (t: TourListItem) => tourCardDisplayPrice(t)
  const perPersonPrices = rows
    .filter((t) => !t.privateTour)
    .map(shownPrice)
    .filter((n): n is number => n != null)
  const minPrice = perPersonPrices.length ? price(Math.min(...perPersonPrices)) : null
  const updated = updatedAt ? new Date(updatedAt) : null
  const updatedValid = updated && !Number.isNaN(updated.getTime()) ? updated : null

  return (
    <section className="w-full bg-white py-14 md:py-20" aria-labelledby="home-glance-heading">
      {/* Mobil sıra: giriş → liste → buton/tarih. lg'de giriş + buton solda, liste sağda. */}
      <div className="mx-auto max-w-[1200px] px-5 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:grid-rows-[auto_1fr] lg:gap-x-16">
        {/* Başlık/metin stili ana sayfanın diğer bölümleriyle aynı (Hakkımızda, SSS, Popüler Turlar). */}
        <div className="text-center lg:col-start-1 lg:row-start-1 lg:text-left">
          <h2
            id="home-glance-heading"
            className="m-0 text-[28px] font-black uppercase leading-[1.15] text-[var(--secondary,#131719)] [text-wrap:balance] sm:text-[32px] md:text-[36px] lg:text-[40px]"
            style={{ fontFamily: 'var(--font-family-title, var(--font-family))', fontWeight: 900, WebkitTextStroke: '0.6px currentColor' }}
          >
            {copy.heading}
          </h2>
          <p className="mx-auto mt-4 max-w-[560px] text-[15px] leading-relaxed text-[var(--text-color,#58595b)] md:mt-5 md:text-base lg:mx-0">
            {copy.summary({ hasYachts, minPrice })}
          </p>
        </div>

        <table className="mt-8 w-full border-collapse text-left lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:-mt-4">
          <caption className="sr-only">{copy.caption}</caption>
          <thead className="sr-only">
            <tr>
              <th scope="col">{copy.cols.tour}</th>
              <th scope="col">{copy.cols.duration}</th>
              <th scope="col">{copy.cols.departure}</th>
              <th scope="col">{copy.cols.price}</th>
            </tr>
          </thead>
          <tbody className="block divide-y divide-[#ebebeb]">
            {rows.map((t) => {
              const p = shownPrice(t)
              const per = t.privateTour ? copy.perGroup : copy.perPerson
              return (
                <tr
                  key={t._id}
                  className="group relative flex min-h-[104px] flex-wrap content-center items-baseline py-4 pl-[88px] sm:min-h-[120px] sm:pl-[108px] sm:pr-[132px]"
                >
                  <th scope="row" className="block w-full p-0 text-left font-normal">
                    {t.coverImageUrl ? (
                      <Image
                        src={t.coverImageUrl}
                        alt=""
                        width={176}
                        height={176}
                        sizes="(min-width: 640px) 88px, 72px"
                        className="absolute left-0 top-1/2 h-[72px] w-[72px] -translate-y-1/2 rounded-xl object-cover transition-opacity duration-200 group-hover:opacity-90 sm:h-[88px] sm:w-[88px]"
                      />
                    ) : (
                      <span
                        className="absolute left-0 top-1/2 h-[72px] w-[72px] -translate-y-1/2 rounded-xl bg-[#f2f2f2] sm:h-[88px] sm:w-[88px]"
                        aria-hidden
                      />
                    )}
                    {/* Link tüm satırı kaplar (after:inset-0); metin yine tur adı. */}
                    <Link
                      href={withLocalePath(locale, `/tur/${t.slug}`)}
                      className="text-[15px] font-bold leading-snug text-[var(--secondary,#131719)] no-underline transition-colors duration-200 after:absolute after:inset-0 after:rounded-xl after:content-[''] group-hover:text-[var(--primary,#2168b8)] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-[var(--primary,#2168b8)] sm:text-[16px]"
                    >
                      {t.title?.trim()}
                    </Link>
                  </th>
                  <td className="mt-1 p-0 text-[14px] text-[var(--text-color,#58595b)]">{t.durationLabel?.trim() || '—'}</td>
                  <td className="mt-1 p-0 text-[14px] text-[var(--text-color,#58595b)] before:mx-1.5 before:content-['·']">
                    {t.departureLabel?.trim() || '—'}
                  </td>
                  {/* Fiyat dili tur kartlarıyla aynı: kalın rakam + küçük büyük harfli birim. */}
                  <td className="mt-1.5 w-full p-0 sm:absolute sm:right-0 sm:top-1/2 sm:mt-0 sm:w-auto sm:-translate-y-1/2 sm:text-right">
                    {p != null ? (
                      <>
                        <span className="whitespace-nowrap text-[16px] font-extrabold tabular-nums tracking-tight text-[var(--secondary,#131719)] sm:block sm:text-[18px]">
                          {price(p)}
                        </span>{' '}
                        <span className="ml-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted,#81848b)] sm:ml-0 sm:mt-0.5 sm:block">
                          {per}
                        </span>
                      </>
                    ) : (
                      <span className="text-[var(--text-color,#58595b)]">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="mt-8 text-center lg:col-start-1 lg:row-start-2 lg:mt-8 lg:self-start lg:text-left">
          {/* Popüler Turlar bölümündeki "Tüm turları görüntüle" ile aynı buton. */}
          <Link
            href={withLocalePath(locale, '/turlar')}
            className="inline-flex h-11 min-w-[180px] items-center justify-center rounded-lg border-2 bg-transparent px-6 text-[14px] font-extrabold uppercase tracking-wide no-underline transition duration-200 hover:scale-105 hover:bg-[var(--primary)]/[0.06] sm:h-12 sm:px-8 sm:text-[15px]"
            style={{ borderColor: 'var(--primary, #2168b8)', color: 'var(--primary, #2168b8)' }}
          >
            {copy.viewAll}
          </Link>
          {updatedValid && (
            <p className="mt-4 text-[12px] text-[var(--muted,#81848b)]">
              {copy.updated}:{' '}
              <time dateTime={updatedValid.toISOString()}>
                {updatedValid.toLocaleDateString(numLoc, { day: 'numeric', month: 'long', year: 'numeric' })}
              </time>
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
