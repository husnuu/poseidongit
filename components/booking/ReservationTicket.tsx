'use client'

import type { BookingWizardUi } from '@/lib/i18n/bookingWizardUi'
import { useEffect, useState } from 'react'
import { CalendarDays, Clock, Crown, MapPin, Ship, Users } from 'lucide-react'
import styles from './ReservationTicket.module.css'

type L = Record<string, string>

const TOTAL_PRICE_LABEL: L = { tr: 'Toplam ücret', en: 'Total price', de: 'Gesamtpreis', ru: 'Итого' }
const MEETING_POINT_LABEL: L = { tr: 'Hareket noktası', en: 'Departure point', de: 'Abfahrtsort', ru: 'Место отправления' }
const BOAT_LABEL: L = { tr: 'Tekne', en: 'Boat', de: 'Boot', ru: 'Лодка' }
const CLASS_LABEL: L = { tr: 'Sınıf', en: 'Class', de: 'Klasse', ru: 'Класс' }
const LOCA_LABEL: L = { tr: 'Loca', en: 'Booth', de: 'Loge', ru: 'Ложа' }
const GUEST_LABEL: L = { tr: 'Misafir', en: 'Guests', de: 'Gäste', ru: 'Гости' }
const DATE_LABEL: L = { tr: 'Tarih', en: 'Date', de: 'Datum', ru: 'Дата' }
const TIME_LABEL: L = { tr: 'Kalkış saati', en: 'Departure', de: 'Abfahrt', ru: 'Отправление' }
const PENDING_LABEL: L = { tr: 'Seçilmedi', en: 'Not selected', de: 'Nicht gewählt', ru: 'Не выбрано' }
const PRICE_PENDING_LABEL: L = {
  tr: 'Sınıf seçiminden sonra',
  en: 'After choosing a class',
  de: 'Nach Klassenwahl',
  ru: 'После выбора класса',
}
/** Sitenin logosu (header/footer ile aynı kaynak: siteSettings.logo), aynı
    origin'deki /api/site-logo üzerinden. Bilet birden fazla adımda tekrar
    çizildiği için tek bir istekle çekilip modül düzeyinde saklanıyor. */
type SiteLogo = { url: string; alt: string } | null
let logoPromise: Promise<SiteLogo> | null = null
function loadSiteLogo(): Promise<SiteLogo> {
  if (!logoPromise) {
    logoPromise = fetch('/api/site-logo')
      .then((r) => (r.ok ? r.json() : null))
      .then((row: { url?: string | null; alt?: string | null } | null) =>
        row?.url ? { url: row.url, alt: row.alt || 'Poseidon' } : null,
      )
      .catch(() => null)
  }
  return logoPromise
}

function useSiteLogo(): SiteLogo {
  const [logo, setLogo] = useState<SiteLogo>(null)
  useEffect(() => {
    let alive = true
    loadSiteLogo().then((l) => {
      if (alive) setLogo(l)
    })
    return () => {
      alive = false
    }
  }, [])
  return logo
}

const CONFIRMATION_EMAIL_LABEL: L = {
  tr: 'Onay e-postası şu adrese gönderilecek:',
  en: 'A confirmation email will be sent to:',
  de: 'Eine Bestätigungs-E-Mail wird gesendet an:',
  ru: 'Подтверждение будет отправлено на:',
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
  /** Seçilen bilet sınıfının görünen adı (örn. "First Class") — seçilmediyse gösterilmez. */
  classLabel?: string | null
  /** First Class için seçilen loca numaraları (örn. ["L1", "L2"]) — sadece First Class'ta ve seçim yapıldıysa gösterilir. */
  locaIds?: string[] | null
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
  /** Girilmişse biletin altında "Onay e-postası şu adrese gönderilecek: …" notu gösterilir. */
  confirmationEmail?: string | null
}

/** Biniş kartı (boarding pass) görünümlü rezervasyon özeti: üstte degrade
    başlık bandı (E-Bilet + tur adı + süre), ortada ikonlu bilgi alanları,
    yan çentikli kesik çizgi ve altta toplam ücret + dekoratif barkod.
    Henüz seçilmemiş alanlar (tarih/fiyat) uydurma değer yerine "Seçilmedi"
    gibi soluk bir yer tutucuyla gösterilir. */
export default function ReservationTicket({
  ui,
  tourTitle,
  durationText,
  hostName,
  meetingLocation,
  classLabel,
  locaIds,
  guestLines,
  dateLabel,
  timeLabel,
  totalValue,
  breakdownRows,
  confirmationEmail,
}: ReservationTicketProps) {
  const t = (m: L) => m[ui.locale] ?? m.tr
  const logo = useSiteLogo()
  const locaIdsClean = (locaIds ?? []).filter((x) => x?.trim())
  const guestText = guestLines
    .map((g) => `${g.label}${g.unitPriceText ? ` × ${g.unitPriceText}` : ''}`)
    .join(', ')

  const fields: { key: string; Icon: typeof Clock; label: string; value: string | null; wide?: boolean }[] = [
    { key: 'date', Icon: CalendarDays, label: t(DATE_LABEL), value: dateLabel ?? null },
    { key: 'time', Icon: Clock, label: t(TIME_LABEL), value: dateLabel ? (timeLabel ?? null) : null },
    ...(meetingLocation ? [{ key: 'meet', Icon: MapPin, label: t(MEETING_POINT_LABEL), value: meetingLocation }] : []),
    ...(hostName ? [{ key: 'boat', Icon: Ship, label: t(BOAT_LABEL), value: hostName }] : []),
    ...(classLabel
      ? [
          {
            key: 'class',
            Icon: Crown,
            label: t(CLASS_LABEL),
            value: `${classLabel}${locaIdsClean.length > 0 ? ` · ${t(LOCA_LABEL)} ${locaIdsClean.join(', ')}` : ''}`,
          },
        ]
      : []),
    { key: 'guests', Icon: Users, label: t(GUEST_LABEL), value: guestText || null, wide: guestText.length > 18 },
  ]
  // Saat yalnızca tur için tanımlıysa ve tarih seçildiyse gösterilir; tarih
  // seçiliyken saat tanımsızsa alanı hiç göstermiyoruz.
  const visibleFields = fields.filter((f) => !(f.key === 'time' && dateLabel && !timeLabel))

  return (
    <>
      <div className={styles.ticket}>
        <div className={styles.top}>
        {/* ── Başlık bandı ── */}
        <div className={styles.head}>
          <svg className={styles.headWave} viewBox="0 0 600 60" preserveAspectRatio="none" aria-hidden>
            <path d="M0 35 C 100 10, 200 55, 300 32 S 500 8, 600 30 V60 H0 Z" fill="rgba(255,255,255,0.08)" />
          </svg>
          <div className={styles.headTop}>
            {/* Logo yüklenene kadar aynı yükseklikte boş yer — bant zıplamasın. */}
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo.url} alt={logo.alt} className={styles.logo} />
            ) : (
              <span className={styles.logoPlaceholder} aria-hidden />
            )}
          </div>
          <p className={styles.title}>{tourTitle}</p>
          {durationText && (
            <span className={styles.durationChip}>
              <Clock size={13} strokeWidth={2.4} aria-hidden />
              {durationText}
            </span>
          )}
        </div>

        {/* ── Bilgi alanları ── */}
        <dl className={styles.fields}>
          {visibleFields.map(({ key, Icon, label, value, wide }) => (
            <div key={key} className={`${styles.field} ${wide ? styles.fieldWide : ''}`}>
              <dt className={styles.fieldLabel}>
                <Icon size={13} strokeWidth={2.4} aria-hidden />
                {label}
              </dt>
              <dd className={`${styles.fieldValue} ${value ? '' : styles.fieldPending}`}>
                {value ?? t(PENDING_LABEL)}
              </dd>
            </div>
          ))}
        </dl>
        </div>

        {/* ── Alt kısım: kesik çizgi + toplam + barkod. Üst/alt parçaların
            birleştiği köşeler mask ile gerçekten kesik (çentik). ── */}
        <div className={styles.stub}>
          <div className={styles.perforation} aria-hidden />
          <div className={styles.totalRow}>
            <div className={styles.totalBlock}>
              <span className={styles.totalLabel}>{t(TOTAL_PRICE_LABEL)}</span>
              {totalValue != null ? (
                <span className={styles.totalValue}>{totalValue.toLocaleString(ui.numberLocale)} ₺</span>
              ) : (
                <span className={styles.totalPending}>{t(PRICE_PENDING_LABEL)}</span>
              )}
            </div>
            <span className={styles.barcode} aria-hidden />
          </div>

          {breakdownRows && breakdownRows.length > 0 && (
            <div className={styles.breakdown}>
              {breakdownRows.map((row, i) => (
                <div key={i} className={`${styles.breakdownRow} ${row.emphasis ? styles.breakdownRowEmphasis : ''}`}>
                  <span className={styles.breakdownLabel}>{row.label}</span>
                  <span className={styles.breakdownValue}>{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {confirmationEmail && (
        <p className={styles.emailNote}>
          {t(CONFIRMATION_EMAIL_LABEL)} <span className={styles.emailValue}>{confirmationEmail}</span>
        </p>
      )}
    </>
  )
}
