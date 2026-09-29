'use client'

import type { BookingWizardUi } from '@/lib/i18n/bookingWizardUi'
import styles from './booking.module.css'

const TOTAL_PRICE_LABEL: Record<string, string> = {
  tr: 'Toplam Ücret:',
  en: 'Total price:',
  de: 'Gesamtpreis:',
}

const MEETING_POINT_LABEL: Record<string, string> = {
  tr: 'Hareket noktası',
  en: 'Departure point',
  de: 'Abfahrtsort',
}

const BOAT_LABEL: Record<string, string> = {
  tr: 'Tekneniz',
  en: 'Your boat',
  de: 'Ihr Boot',
}

const GUEST_LABEL: Record<string, string> = {
  tr: 'Misafir:',
  en: 'Guests:',
  de: 'Gäste:',
}

const TEAR_HERE_LABEL: Record<string, string> = {
  tr: 'Buradan yırtın',
  en: 'Tear here',
  de: 'Hier abtrennen',
}

/** "YYYY-MM-DD" tarihini biletteki gibi "Pazar, 27 Eylül 2026" biçimine çevirir
    (Intl'in kendi hafta günü sırası tr-TR'de tarihin SONUNA koyduğu için elle birleştiriyoruz). */
export function formatTicketDateLabel(dateStr: string, ui: BookingWizardUi): string {
  const localeTag = ui.locale === 'tr' ? 'tr-TR' : ui.locale === 'de' ? 'de-DE' : 'en-US'
  const d = new Date(dateStr + 'T00:00:00')
  const weekday = d.toLocaleDateString(ui.numberLocale, { weekday: 'long' })
  const dayMonthYear = d.toLocaleDateString(ui.numberLocale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const weekdayCap = weekday.charAt(0).toLocaleUpperCase(localeTag) + weekday.slice(1)
  return `${weekdayCap}, ${dayMonthYear}`
}

/** Filodaki varsayılan tekne (site sahibi tarafından belirtildi — Sanity'de
    kaptan/host alanı kişi ismi taşıdığı için "Tekneniz" satırında bunun yerine kullanılır). */
export const DEFAULT_BOAT_NAME = 'Poseidon 2'

/** Bazı turlar filonun farklı bir teknesiyle yapılıyor — tur slug'ına göre
    override. Eşleşme yoksa DEFAULT_BOAT_NAME kullanılır. */
const BOAT_NAME_BY_TOUR_SLUG: Record<string, string> = {
  'cesme-tuplu-dalis-turu': 'Güneşim',
}

/** Biletteki "Tekneniz" satırında gösterilecek tekne adını tur slug'ına göre döndürür. */
export function boatNameForTour(tourSlug?: string | null): string {
  if (tourSlug && BOAT_NAME_BY_TOUR_SLUG[tourSlug]) return BOAT_NAME_BY_TOUR_SLUG[tourSlug]
  return DEFAULT_BOAT_NAME
}

export interface ReservationTicketGuestLine {
  /** Örn. "1" veya "2 Yetişkin" */
  label: string
  /** Kişi başı ücret, örn. "1.500 ₺" — sınıf seçilmeden hesaplanamıyorsa boş bırakılır. */
  unitPriceText?: string | null
}

export interface ReservationTicketRow {
  label: string
  value: string
  /** true ise kapora satırı gibi vurgulu (turuncu) gösterilir. */
  emphasis?: boolean
}

export interface ReservationTicketProps {
  ui: BookingWizardUi
  tourTitle: string
  /** Örn. "Tam Gün (yaklaşık 7 saat)" — sadece gerçek veri varsa gösterilir. */
  durationText?: string | null
  /** Sanity'deki gerçek kaptan/host adı — sadece tanımlıysa gösterilir (uydurma isim yok). */
  hostName?: string | null
  /** Örn. "Çeşme Sahil" — sadece gerçek veri varsa gösterilir. */
  meetingLocation?: string | null
  guestLines: ReservationTicketGuestLine[]
  /** Hafta günü + uzun tarih, örn. "Pazar, 27 Eylül 2026" — tarih seçilmediyse null. */
  dateLabel?: string | null
  /** Örn. "10:50" — tur için tanımlıysa. */
  timeLabel?: string | null
  /** Toplam ücret (₺) — sınıf seçilmeden hesaplanamıyorsa null (yer tutucu gösterilir, uydurma değer yok). */
  totalValue?: number | null
  /** Kapora / kalan tutar satırları — verilirse bilete, yırtık bir kesik çizginin
      altında, aynı kartın devamı olarak eklenir (3. adımda). */
  breakdownRows?: ReservationTicketRow[]
}

/** Referans siteki bilet kesiği ile birebir: dikey kesik çizgi + "Buradan yırtın" etiketi,
    solda tur/lojistik bilgisi, sağda saat/tarih/toplam ücret. */
export default function ReservationTicket({
  ui,
  tourTitle,
  durationText,
  hostName,
  meetingLocation,
  guestLines,
  dateLabel,
  timeLabel,
  totalValue,
  breakdownRows,
}: ReservationTicketProps) {
  const totalPriceLabel = TOTAL_PRICE_LABEL[ui.locale] ?? TOTAL_PRICE_LABEL.tr
  const meetingPointLabel = MEETING_POINT_LABEL[ui.locale] ?? MEETING_POINT_LABEL.tr
  const boatLabel = BOAT_LABEL[ui.locale] ?? BOAT_LABEL.tr
  const guestLabel = GUEST_LABEL[ui.locale] ?? GUEST_LABEL.tr
  const tearHereLabel = TEAR_HERE_LABEL[ui.locale] ?? TEAR_HERE_LABEL.tr

  return (
    <div className={styles.reservationTicketStackWrap}>
      {/* Referanstaki "arkada bir bilet daha duruyor" görünümü — tek dekoratif
          kart dilimi (toplam 2 bilet). Kendi çentikleri de GERÇEKTEN kesik
          (mask ile) — arkadaki asıl sayfa arka planı görünüyor. */}
      <div className={styles.reservationTicketStackLayer} aria-hidden />
      <div className={styles.reservationTicket}>
      <div className={styles.reservationTicketBodyCell}>
      <div className={styles.reservationTicketBodyBg} aria-hidden />
      <div>
      <div className={styles.reservationTicketStub}>
        <div className={styles.reservationTicketStubLeft}>
          <p className={styles.summaryTourName}>{tourTitle}</p>

          <div className={styles.ticketInfoGroup}>
            {durationText && (
              <p className={styles.ticketInfoLineBold}>{durationText}</p>
            )}
            {hostName && (
              <p className={styles.ticketInfoLine}>
                <span className={styles.ticketInfoLabel}>{boatLabel}</span>{' '}
                <span className={styles.ticketInfoLink}>{hostName}</span>
              </p>
            )}
            {meetingLocation && (
              <p className={styles.ticketInfoLine}>
                <span className={styles.ticketInfoLabel}>{meetingPointLabel}</span>{' '}
                <span className={styles.ticketInfoLink}>{meetingLocation}</span>
              </p>
            )}
            <p className={styles.ticketInfoLineBold}>
              {guestLabel}{' '}
              {guestLines.map((g, i) => (
                <span key={i}>
                  {i > 0 && ', '}
                  {g.label}
                  {g.unitPriceText ? ` × ${g.unitPriceText}` : ''}
                </span>
              ))}
            </p>
          </div>
        </div>

        <div
          className={`${styles.reservationTicketDivider} ${breakdownRows && breakdownRows.length > 0 ? styles.reservationTicketDividerConnected : ''}`}
          aria-hidden
        >
          <span className={styles.reservationTicketTearLabel}>{tearHereLabel}</span>
        </div>

        <div className={styles.reservationTicketStubRight}>
          <div>
            {/* Tarih henüz seçilmediyse referanstaki gibi gri iskelet kutular gösterilir
                (saat de tarihe bağlı gösteriliyor — hangi gün olduğu belli olmadan
                "kaçta" sorusu da netleşmiyor). */}
            {dateLabel ? (
              <>
                {timeLabel && <p className={styles.ticketTimeLabel}>{timeLabel}</p>}
                <p className={styles.ticketDateLabel}>{dateLabel}</p>
              </>
            ) : (
              <>
                <span className={styles.ticketSkeletonBox} style={{ width: 58, height: 26 }} aria-hidden />
                <span
                  className={styles.ticketSkeletonBox}
                  style={{ width: 118, height: 16, marginTop: 8 }}
                  aria-hidden
                />
              </>
            )}
          </div>
          <div className={styles.ticketTotalWrap}>
            <span className={styles.ticketTotalLabel}>{totalPriceLabel}</span>
            {totalValue != null ? (
              <span className={styles.ticketTotalValue}>
                {totalValue.toLocaleString(ui.numberLocale)} ₺
              </span>
            ) : (
              <span className={styles.ticketSkeletonBox} style={{ width: 76, height: 18 }} aria-hidden />
            )}
          </div>
        </div>
      </div>

      {breakdownRows && breakdownRows.length > 0 && (
        <>
          {/* Bilgi (stub) kısmı ile kapora/kalan dökümü arasındaki ince ayraç —
              gerçek yırtılma/çentik noktası artık kartın EN ALTINA taşındı
              (bkz. .reservationTicketBodyBg), burası sade bir çizgi. */}
          <div className={styles.reservationTicketTornEdge} aria-hidden />
          <div className={styles.reservationTicketBreakdownRows}>
            {breakdownRows.map((row, i) => (
              <div
                key={i}
                className={`${styles.ticketBreakdownRow} ${row.emphasis ? styles.ticketBreakdownRowEmphasis : ''}`}
              >
                <span className={styles.ticketBreakdownLabel}>{row.label}</span>
                <span className={styles.ticketBreakdownValue}>{row.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
      </div>
      </div>
      </div>
    </div>
  )
}
