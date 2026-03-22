/**
 * Online ödeme (sanal POS) açık mı?
 * Kapalıyken 4. adımda kart formu ve ödeme tamamlama yok; bilgilendirme gösterilir.
 * Açmak için: NEXT_PUBLIC_BOOKING_PAYMENT_ENABLED=true
 */
export const isBookingOnlinePaymentEnabled =
  process.env.NEXT_PUBLIC_BOOKING_PAYMENT_ENABLED === 'true'
