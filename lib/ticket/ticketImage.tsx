import { ImageResponse } from 'next/og'
import QRCode from 'qrcode'
import type { SiteLocale } from '@/lib/i18n/config'
import { loadSatoriFonts as loadFonts, SATORI_FONT_FAMILY, toDataUrl } from '@/lib/og/satoriAssets'

/**
 * WhatsApp onay mesajının başlık görseli: biniş kartı (boarding pass)
 * tasarımlı PNG bilet — sitedeki rezervasyon biletiyle aynı görsel dil.
 * 1080×1350 (4:5) — WhatsApp'ta kırpılmadan, büyük görünür.
 * QR, PDF bilet ve ekip tarayıcısıyla aynı içerik (bilet erişim linki).
 */

export type TicketImageData = {
  locale: SiteLocale
  tourTitle: string
  passengerName: string
  dateLabel: string
  time: string | null
  boardingTime: string | null
  meetingPoint: string
  className: string | null
  guests: string
  reservationCode: string
  qrPayload: string
  total: number
  paid: number
  currency: string
  logoUrl?: string | null
}

const W = 1080
const H = 1350
const PAGE_BG = '#e9f0f8'
const NAVY = '#11356b'
const PRIMARY = '#2168b8'
const INK = '#131719'
const MUTED = '#7b8594'
const LINE = '#d3dce6'

const L: Record<SiteLocale, Record<string, string>> = {
  tr: { date: 'Tarih', dep: 'Kalkış', board: 'Biniş', meet: 'Buluşma noktası', cls: 'Sınıf', guests: 'Misafir', pax: 'Yolcu', code: 'Rezervasyon kodu', total: 'Toplam', paid: 'Ödenen', rest: 'Kalan (kapıda)', scan: 'Binişte bu QR kodu okutun · Kalkıştan 30 dk önce iskelede olun' },
  en: { date: 'Date', dep: 'Departure', board: 'Boarding', meet: 'Meeting point', cls: 'Class', guests: 'Guests', pax: 'Passenger', code: 'Booking code', total: 'Total', paid: 'Paid', rest: 'Due on board', scan: 'Show this QR code at boarding · Be at the pier 30 min before departure' },
  de: { date: 'Datum', dep: 'Abfahrt', board: 'Einstieg', meet: 'Treffpunkt', cls: 'Klasse', guests: 'Gäste', pax: 'Passagier', code: 'Buchungscode', total: 'Gesamt', paid: 'Bezahlt', rest: 'Rest vor Ort', scan: 'QR-Code beim Einsteigen vorzeigen · 30 Min. vor Abfahrt am Steg' },
  ru: { date: 'Дата', dep: 'Отправление', board: 'Посадка', meet: 'Место встречи', cls: 'Класс', guests: 'Гости', pax: 'Пассажир', code: 'Код брони', total: 'Итого', paid: 'Оплачено', rest: 'Остаток на месте', scan: 'Покажите QR-код при посадке · Будьте на причале за 30 мин' },
}

function money(n: number, currency: string, locale: SiteLocale): string {
  const tag = locale === 'tr' ? 'tr-TR' : locale === 'de' ? 'de-DE' : locale === 'ru' ? 'ru-RU' : 'en-GB'
  const v = Math.round(n).toLocaleString(tag)
  return currency === 'TRY' ? `${v} ₺` : `${v} ${currency}`
}

function Field({ label, value, width }: { label: string; value: string; width: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width, marginBottom: 34 }}>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 2, color: MUTED }}>{label}</div>
      <div style={{ fontSize: 34, fontWeight: 800, color: INK, marginTop: 6, lineHeight: 1.2 }}>{value}</div>
    </div>
  )
}

export async function renderTicketImage(d: TicketImageData): Promise<ImageResponse> {
  const t = L[d.locale] ?? L.tr
  const [fonts, qr, logo] = await Promise.all([
    loadFonts(),
    QRCode.toDataURL(d.qrPayload, { margin: 1, width: 560, errorCorrectionLevel: 'M', color: { dark: INK, light: '#ffffff' } }),
    toDataUrl(d.logoUrl),
  ])
  const remaining = Math.max(0, d.total - d.paid)
  // Dile duyarlı büyük harf (Türkçe i → İ); CSS uppercase bunu yapmıyor.
  const tag = d.locale === 'tr' ? 'tr-TR' : d.locale === 'de' ? 'de-DE' : d.locale === 'ru' ? 'ru-RU' : 'en-GB'
  const up = (v: string) => v.toLocaleUpperCase(tag)
  const colW = 404

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(160deg, ${PAGE_BG} 0%, #f6f9fc 100%)`,
          fontFamily: SATORI_FONT_FAMILY,
        }}
      >
        <div
          style={{
            width: 960,
            height: 1250,
            display: 'flex',
            flexDirection: 'column',
            background: '#ffffff',
            borderRadius: 44,
            border: `2px solid ${LINE}`,
            boxShadow: '0 30px 60px -30px rgba(17,53,107,0.35)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Başlık bandı */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '44px 56px 46px',
              backgroundImage: `linear-gradient(120deg, ${NAVY} 0%, ${PRIMARY} 70%, #3f97d1 100%)`,
              color: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {logo ? (
                <div style={{ display: 'flex', background: '#ffffff', borderRadius: 18, padding: '12px 22px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logo} height={44} style={{ height: 44 }} alt="" />
                </div>
              ) : (
                <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 4 }}>POSEIDON</div>
              )}
            </div>
            <div style={{ fontSize: 50, fontWeight: 800, lineHeight: 1.12, marginTop: 30, letterSpacing: -0.5 }}>
              {up(d.tourTitle)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 22, fontSize: 32, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
              {d.dateLabel}
              {d.time ? `  ·  ${d.time}` : ''}
            </div>
          </div>

          {/* Bilgi alanları */}
          <div style={{ display: 'flex', flexWrap: 'wrap', padding: '44px 56px 6px', justifyContent: 'space-between' }}>
            <Field label={up(t.pax)} value={d.passengerName} width={colW} />
            <Field label={up(t.guests)} value={d.guests} width={colW} />
            <Field label={up(t.dep)} value={d.time ?? '—'} width={colW} />
            <Field label={up(t.board)} value={d.boardingTime ?? '—'} width={colW} />
            <Field label={up(t.meet)} value={d.meetingPoint} width={colW} />
            <Field label={up(t.cls)} value={d.className ?? '—'} width={colW} />
          </div>

          {/* Kesik çizgi + çentikler */}
          <div style={{ display: 'flex', position: 'relative', height: 56, alignItems: 'center' }}>
            <div style={{ position: 'absolute', left: -30, width: 60, height: 60, borderRadius: 30, background: PAGE_BG, border: `2px solid ${LINE}` }} />
            <div style={{ display: 'flex', flex: 1, margin: '0 56px', borderTop: `4px dashed ${LINE}` }} />
            <div style={{ position: 'absolute', right: -30, width: 60, height: 60, borderRadius: 30, background: PAGE_BG, border: `2px solid ${LINE}` }} />
          </div>

          {/* QR + kod + ödeme */}
          <div style={{ display: 'flex', padding: '26px 56px 0', alignItems: 'center' }}>
            <div style={{ display: 'flex', padding: 14, borderRadius: 24, border: `2px solid ${LINE}`, background: '#fff' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} width={268} height={268} alt="" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 44, flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 2, color: MUTED }}>{up(t.code)}</div>
              <div style={{ fontSize: 46, fontWeight: 800, color: INK, letterSpacing: 3, marginTop: 4 }}>{d.reservationCode}</div>
              <div style={{ display: 'flex', flexDirection: 'column', marginTop: 26, borderTop: `2px solid #e8edf3`, paddingTop: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 28, color: MUTED, fontWeight: 500 }}>
                  <span>{t.total}</span>
                  <span style={{ color: INK, fontWeight: 800 }}>{money(d.total, d.currency, d.locale)}</span>
                </div>
                {d.paid > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 28, color: PRIMARY, fontWeight: 700, marginTop: 10 }}>
                    <span>{t.paid}</span>
                    <span style={{ fontWeight: 800 }}>{money(d.paid, d.currency, d.locale)}</span>
                  </div>
                )}
                {remaining > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 28, color: MUTED, fontWeight: 500, marginTop: 10 }}>
                    <span>{t.rest}</span>
                    <span style={{ color: INK, fontWeight: 800 }}>{money(remaining, d.currency, d.locale)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              marginTop: 'auto',
              padding: '24px 56px',
              background: '#f4f7fb',
              borderTop: `2px solid #e8edf3`,
              fontSize: 24,
              fontWeight: 700,
              color: MUTED,
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            {t.scan}
          </div>
        </div>
      </div>
    ),
    { width: W, height: H, fonts }
  )
}
