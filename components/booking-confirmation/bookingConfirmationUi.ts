import type { SiteLocale } from '@/lib/i18n/config'

export interface BookingConfirmationUi {
  paidTitle: (name: string) => string
  pendingCashTitle: (name: string) => string
  pendingTitle: (name: string) => string
  failedTitle: string
  cancelledTitle: string
  paidSubtitle: string
  pendingCashSubtitle: string
  pendingSubtitle: string
  failedSubtitle: string
  cancelledSubtitle: string
  reservationCode: string
  scanHint: string
  expandBoardingPass: string
  guestLabel: string
  tourLabel: string
  guestCountLabel: (n: number) => string
  paidBadge: string
  cashDueBadge: string
  pendingBadge: string
  addToCalendar: string
  appleOutlookCalendar: string
  googleCalendar: string
  changeDate: string
  cancelBooking: string
  cancelConfirmTitle: string
  cancelConfirmBody: string
  cancelConfirmYes: string
  cancelConfirmNo: string
  cancelling: string
  cancelledNotice: string
  cancelPolicyText: (deadline: string, amount: string) => string
  cancelUnavailableText: string
  guestListTitle: string
  editInfoLink: string
  boatBarTitle: string
  boatBarDesc: string
  boatBarCta: string
  whereTitle: string
  boardingTimeLabel: string
  returnTimeLabel: string
  departureTimeLabel: string
  viewOnMap: string
  goodToKnowTitle: string
  foodDrinkTitle: string
  foodDrinkPolicyText: string
  needHelpTitle: string
  whatsappCta: string
  viewTicket: string
  downloadPdf: string
  backHome: string
  boardingPassTitle: string
  boardingPassHint: string
  reservationOwner: string
  guestsCount: string
  viewFullTicket: string
  close: string
}

const TR: BookingConfirmationUi = {
  paidTitle: (name) => (name ? `Teşekkürler ${name}! Rezervasyonunuz onaylandı.` : 'Rezervasyonunuz onaylandı!'),
  pendingCashTitle: (name) => (name ? `Teşekkürler ${name}! Rezervasyonunuz alındı.` : 'Rezervasyonunuz alındı!'),
  pendingTitle: (name) => (name ? `Teşekkürler ${name}!` : 'Ödemeniz alındı'),
  failedTitle: 'Ödeme tamamlanamadı',
  cancelledTitle: 'Rezervasyon iptal edildi',
  paidSubtitle: 'Ödemeniz başarıyla tamamlandı. Biletiniz e-posta adresinize gönderildi.',
  pendingCashSubtitle: 'Toplam tutar tur günü teknede nakit olarak ödenecektir.',
  pendingSubtitle: 'Kesin onay ve biletiniz birkaç saniye içinde e-postanıza ulaşacaktır.',
  failedSubtitle: 'Bu rezervasyon ödeme aşamasında başarısız olarak işaretlendi. Sorun devam ederse lütfen bizimle iletişime geçin.',
  cancelledSubtitle: 'Bu rezervasyon iptal edilmiştir.',
  reservationCode: 'Rezervasyon kodu',
  scanHint: 'Ekip biniş sırasında bunu okutur',
  expandBoardingPass: 'Biniş kartını büyüt',
  guestLabel: 'Misafir',
  tourLabel: 'Tur',
  guestCountLabel: (n) => `${n} Misafir`,
  paidBadge: 'Ödeme tamamlandı',
  cashDueBadge: 'Kapıda nakit ödenecek',
  pendingBadge: 'Ödeme bekleniyor',
  addToCalendar: 'Takvime Ekle',
  appleOutlookCalendar: 'Apple / Outlook Takvim',
  googleCalendar: 'Google Takvim',
  changeDate: 'Tarihi değiştir',
  cancelBooking: 'İptal Et',
  cancelConfirmTitle: 'Rezervasyonu iptal et',
  cancelConfirmBody: 'Bu rezervasyonu iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
  cancelConfirmYes: 'Evet, iptal et',
  cancelConfirmNo: 'Vazgeç',
  cancelling: 'İptal ediliyor...',
  cancelledNotice: 'Rezervasyonunuz iptal edildi.',
  cancelPolicyText: (deadline, amount) =>
    `${deadline} tarihine kadar iptal ederseniz ödemenizin tamamı (${amount}) iade edilir.`,
  cancelUnavailableText: 'İptal süresi geçmiştir. Değişiklik için lütfen bizimle iletişime geçin.',
  guestListTitle: 'Misafir listesi',
  editInfoLink: 'Bilgilerinizi düzenleyin',
  boatBarTitle: 'Tekne Barı',
  boatBarDesc: 'Kokteyller, soğuk içecekler ve daha fazlası',
  boatBarCta: 'Bar menüsünü gör',
  whereTitle: 'Toplanma noktası',
  boardingTimeLabel: 'Biniş saati',
  returnTimeLabel: 'Dönüş saati',
  departureTimeLabel: 'Hareket saati',
  viewOnMap: 'Haritada görüntüle',
  goodToKnowTitle: 'Bilmeniz gerekenler',
  foodDrinkTitle: 'Yiyecek & İçecek',
  foodDrinkPolicyText: 'Dışarıdan yiyecek getirmeniz serbesttir; içecek getirilmesine izin verilmemektedir.',
  needHelpTitle: 'Sorunuz mu var?',
  whatsappCta: "WhatsApp'tan yazın",
  viewTicket: 'Biletimi görüntüle',
  downloadPdf: 'Biletimi indir (PDF)',
  backHome: 'Ana sayfaya dön',
  boardingPassTitle: 'Biniş Kartı',
  boardingPassHint: 'Biniş sırasında ekibe gösterin',
  reservationOwner: 'Rezervasyon sahibi',
  guestsCount: 'Misafir',
  viewFullTicket: 'Tam bileti görüntüle / yazdır',
  close: 'Kapat',
}

const EN: BookingConfirmationUi = {
  paidTitle: (name) => (name ? `Thank you, ${name}! Your booking is confirmed.` : 'Your booking is confirmed!'),
  pendingCashTitle: (name) => (name ? `Thank you, ${name}! We received your booking.` : 'Your booking has been received!'),
  pendingTitle: (name) => (name ? `Thank you, ${name}!` : 'Payment received'),
  failedTitle: 'Payment could not be completed',
  cancelledTitle: 'Booking cancelled',
  paidSubtitle: 'Your payment was completed successfully. Your ticket has been sent to your email.',
  pendingCashSubtitle: 'The total amount will be paid in cash on board on the day of the tour.',
  pendingSubtitle: 'Your final confirmation and ticket will arrive in your inbox shortly.',
  failedSubtitle: 'This booking was marked as failed during payment. Please contact us if the issue persists.',
  cancelledSubtitle: 'This booking has been cancelled.',
  reservationCode: 'Reservation code',
  scanHint: 'The crew will scan this at boarding',
  expandBoardingPass: 'Expand boarding pass',
  guestLabel: 'Guest',
  tourLabel: 'Tour',
  guestCountLabel: (n) => `${n} Guests`,
  paidBadge: 'Payment completed',
  cashDueBadge: 'Cash due on board',
  pendingBadge: 'Payment pending',
  addToCalendar: 'Add to Calendar',
  appleOutlookCalendar: 'Apple / Outlook Calendar',
  googleCalendar: 'Google Calendar',
  changeDate: 'Change date',
  cancelBooking: 'Cancel',
  cancelConfirmTitle: 'Cancel booking',
  cancelConfirmBody: 'Are you sure you want to cancel this booking? This action cannot be undone.',
  cancelConfirmYes: 'Yes, cancel it',
  cancelConfirmNo: 'Keep booking',
  cancelling: 'Cancelling...',
  cancelledNotice: 'Your booking has been cancelled.',
  cancelPolicyText: (deadline, amount) =>
    `Cancel before ${deadline} for a full refund (${amount}).`,
  cancelUnavailableText: 'The cancellation window has passed. Please contact us for changes.',
  guestListTitle: 'Guest list',
  editInfoLink: 'Edit your details',
  boatBarTitle: 'Boat Bar',
  boatBarDesc: 'Cocktails, cold drinks and more',
  boatBarCta: 'View bar menu',
  whereTitle: 'Meeting point',
  boardingTimeLabel: 'Boarding time',
  returnTimeLabel: 'Return time',
  departureTimeLabel: 'Departure time',
  viewOnMap: 'View on map',
  goodToKnowTitle: 'Good to know',
  foodDrinkTitle: 'Food & Drinks',
  foodDrinkPolicyText: "You're welcome to bring your own food; outside drinks are not permitted on board.",
  needHelpTitle: 'Need help?',
  whatsappCta: 'Message us on WhatsApp',
  viewTicket: 'View my ticket',
  downloadPdf: 'Download ticket (PDF)',
  backHome: 'Back to homepage',
  boardingPassTitle: 'Boarding Pass',
  boardingPassHint: 'Show this to the crew at boarding',
  reservationOwner: 'Reservation holder',
  guestsCount: 'Guests',
  viewFullTicket: 'View / print full ticket',
  close: 'Close',
}

const MAP: Record<SiteLocale, BookingConfirmationUi> = { tr: TR, en: EN, de: EN }

export function getBookingConfirmationUi(locale: SiteLocale): BookingConfirmationUi {
  return MAP[locale] ?? TR
}
