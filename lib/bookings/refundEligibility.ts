/**
 * İade Talebi uygunluk hesabı.
 *
 * Kural: Tur kalkışına 24 saatten az kaldıysa müşteri iade talebi gönderemez.
 * Saat verilmemişse o günün öğlen 12:00'si referans alınır.
 * Tüm hesap Europe/Istanbul (UTC+3) olarak yapılır.
 */

const TR_OFFSET_MS = 3 * 60 * 60 * 1000
export const REFUND_REQUEST_MIN_HOURS = 24

export type RefundEligibilityReason =
  | 'no_date'
  | 'window_closed'
  | 'eligible'

export type RefundEligibility = {
  /** Müşteri talep gönderebilir mi? */
  eligible: boolean
  /** Tur kalkışına kaç saat var (ondalıklı). null = tarih yok. */
  hoursUntilTour: number | null
  reason: RefundEligibilityReason
}

/**
 * `date` (YYYY-MM-DD) ve opsiyonel `time` (HH:mm) ile uygunluğu hesaplar.
 * Saat dilimi: kalkış UTC+3 olarak yorumlanır (tour times stored in TR local).
 */
export function computeRefundEligibility(
  date?: string | null,
  time?: string | null,
  now: number = Date.now()
): RefundEligibility {
  const dateStr = (date ?? '').toString().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { eligible: false, hoursUntilTour: null, reason: 'no_date' }
  }

  const timeStr = typeof time === 'string' && /^\d{2}:\d{2}/.test(time) ? time.slice(0, 5) : '12:00'
  const tourTime = new Date(`${dateStr}T${timeStr}:00.000Z`).getTime() - TR_OFFSET_MS
  const hoursUntilTour = (tourTime - now) / (60 * 60 * 1000)

  if (hoursUntilTour < REFUND_REQUEST_MIN_HOURS) {
    return { eligible: false, hoursUntilTour, reason: 'window_closed' }
  }
  return { eligible: true, hoursUntilTour, reason: 'eligible' }
}

/**
 * Kullanıcıya gösterilecek mesaj.
 */
export function refundEligibilityMessage(eligibility: RefundEligibility): string | null {
  if (eligibility.eligible) return null
  if (eligibility.reason === 'no_date') return 'Tur tarihi bulunamadı.'
  return `Tur kalkışına 24 saatten az kaldığı için iade talebi gönderilemez. Lütfen bizimle iletişime geçin.`
}
