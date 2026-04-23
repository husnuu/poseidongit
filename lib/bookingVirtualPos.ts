/**
 * Online ödeme (Nestpay / sanal POS) açık mı?
 * Açıkken: 4. adımda bankaya yönlendiren güvenli ödeme akışı (`/api/payment/initiate`).
 * Kapalıyken: test modu; rezervasyon ödeme sayfasına gitmeden tamamlanır.
 * Açmak için: NEXT_PUBLIC_BOOKING_PAYMENT_ENABLED=true
 */
export const isBookingOnlinePaymentEnabled =
  process.env.NEXT_PUBLIC_BOOKING_PAYMENT_ENABLED === 'true'
