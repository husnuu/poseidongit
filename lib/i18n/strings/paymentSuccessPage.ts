import type { SiteLocale } from '@/lib/i18n/config'

export type PaymentSuccessUi = {
  invalidLinkTitle: string
  invalidLinkDesc: string
  notFoundTitle: string
  notFoundDesc: string
  yachtDepositPaidTitle: string
  yachtDepositPendingTitle: string
  tourPaidTitle: string
  tourPendingTitle: string
  yachtDepositPaidDesc: string
  yachtDepositPendingDesc: string
  tourPaidDesc: string
  tourPendingDesc: string
  yachtDepositEmailNote: string
  tourEmailNote: string
  labelReference: string
  labelGuest: string
  labelTransaction: string
  labelTour: string
  labelDate: string
  labelAmountPaid: string
  labelPaidAt: string
  viewTicket: string
  downloadPdf: string
  backHome: string
  footerNote: string
}

const TR: PaymentSuccessUi = {
  invalidLinkTitle: 'Bağlantı geçersiz',
  invalidLinkDesc: 'Sipariş numarası eksik veya geçersiz.',
  notFoundTitle: 'Rezervasyon bulunamadı',
  notFoundDesc: 'Kayıt yüklenemedi. Lütfen destek ile iletişime geçin.',
  yachtDepositPaidTitle: 'Kapora ödemeniz alındı!',
  yachtDepositPendingTitle: 'Ödemeniz işleniyor',
  tourPaidTitle: 'Rezervasyonunuz onaylandı!',
  tourPendingTitle: 'Ödemeniz alındı',
  yachtDepositPaidDesc:
    'Kapora ödemeniz alındı. Onay e-postası adresinize gönderilmiştir; ekibimiz sizinle iletişime geçecektir.',
  yachtDepositPendingDesc: 'Ödemeniz birkaç saniye içinde onaylanacaktır.',
  tourPaidDesc: 'Ödemeniz başarıyla tamamlandı. Biletiniz e-posta adresinize gönderilmiştir.',
  tourPendingDesc: 'Rezervasyonunuz birkaç saniye içinde onaylanacaktır.',
  yachtDepositEmailNote: 'Onay e-posta olarak gönderilmiştir.',
  tourEmailNote: 'Biletiniz e-posta olarak gönderilmiştir.',
  labelReference: 'Rezervasyon no',
  labelGuest: 'Misafir',
  labelTransaction: 'İşlem',
  labelTour: 'Tur',
  labelDate: 'Tarih',
  labelAmountPaid: 'Ödenen tutar',
  labelPaidAt: 'Ödeme zamanı',
  viewTicket: 'Biletimi Görüntüle',
  downloadPdf: 'Biletimi İndir (PDF)',
  backHome: 'Ana sayfaya dön',
  footerNote: 'Sorularınız için bizimle iletişime geçebilirsiniz.',
}

const EN: PaymentSuccessUi = {
  invalidLinkTitle: 'Invalid link',
  invalidLinkDesc: 'The order reference is missing or invalid.',
  notFoundTitle: 'Booking not found',
  notFoundDesc: 'We could not load your record. Please contact support.',
  yachtDepositPaidTitle: 'Deposit payment received!',
  yachtDepositPendingTitle: 'Processing your payment',
  tourPaidTitle: 'Your booking is confirmed!',
  tourPendingTitle: 'Payment received',
  yachtDepositPaidDesc:
    'Your deposit has been received. A confirmation email has been sent; our team will contact you shortly.',
  yachtDepositPendingDesc: 'Your payment will be confirmed within a few seconds.',
  tourPaidDesc: 'Payment completed successfully. Your ticket has been sent to your email.',
  tourPendingDesc: 'Your booking will be confirmed within a few seconds.',
  yachtDepositEmailNote: 'Confirmation has been sent by email.',
  tourEmailNote: 'Your ticket has been sent by email.',
  labelReference: 'Reference no',
  labelGuest: 'Guest',
  labelTransaction: 'Transaction',
  labelTour: 'Tour',
  labelDate: 'Date',
  labelAmountPaid: 'Amount paid',
  labelPaidAt: 'Payment time',
  viewTicket: 'View my ticket',
  downloadPdf: 'Download ticket (PDF)',
  backHome: 'Back to homepage',
  footerNote: 'Contact us if you have any questions.',
}

const MAP: Record<SiteLocale, PaymentSuccessUi> = {
  tr: TR,
  en: EN,
  de: EN,
}

export function getPaymentSuccessUi(locale: SiteLocale): PaymentSuccessUi {
  return MAP[locale] ?? TR
}

export function paymentSuccessLocaleFromBooking(uiLocale: string | null | undefined): SiteLocale {
  if (uiLocale === 'en' || uiLocale === 'de') return uiLocale
  return 'tr'
}

export function formatPaymentSuccessDate(dateStr: string, locale: SiteLocale): string {
  if (!dateStr) return '—'
  try {
    const tag = locale === 'en' ? 'en-US' : locale === 'de' ? 'de-DE' : 'tr-TR'
    return new Date(dateStr).toLocaleDateString(tag, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function formatPaymentSuccessDateTime(iso: string, locale: SiteLocale): string {
  try {
    const tag = locale === 'en' ? 'en-US' : locale === 'de' ? 'de-DE' : 'tr-TR'
    return new Date(iso).toLocaleString(tag, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Europe/Istanbul',
    })
  } catch {
    return iso
  }
}

export function formatPaymentAmount(amount: number, currency: string, locale: SiteLocale): string {
  const tag = locale === 'en' ? 'en-US' : locale === 'de' ? 'de-DE' : 'tr-TR'
  return `${Number(amount).toLocaleString(tag)} ${currency}`
}
