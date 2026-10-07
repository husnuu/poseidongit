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
  mealLabel: string
  paidBadge: string
  depositPaidBadge: string
  remainingCashLabel: string
  remainingCashNote: string
  cashDueBadge: string
  pendingBadge: string
  addToCalendar: string
  appleOutlookCalendar: string
  googleCalendar: string
  changeDate: string
  requestRefund: string
  refundModalTitle: string
  refundModalBody: string
  refundReasonLabel: string
  refundReasonPlaceholder: string
  refundModalCancel: string
  refundModalConfirm: string
  refundSending: string
  refundAlreadyRequestedNotice: string
  refundNotOnlinePaidText: string
  refundWindowClosedText: string
  refundPolicyText: (deadline: string) => string
  guestListTitle: string
  editInfoLink: string
  boatBarTitle: string
  boatBarDesc: string
  boatBarCta: string
  whereTitle: string
  boardingStartLabel: string
  latestBoardingLabel: string
  departureTimeLabel: string
  viewOnMap: string
  whatToBringTitle: string
  whatToBringText: string
  equipmentProvidedText: string
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
  mealLabel: 'Yemek',
  paidBadge: 'Ödeme tamamlandı',
  depositPaidBadge: 'Kapora ödendi',
  remainingCashLabel: 'Kalan tutar (nakit)',
  remainingCashNote: 'Kalan ödeme tur günü nakit olarak alınmaktadır.',
  cashDueBadge: 'Kapıda nakit ödenecek',
  pendingBadge: 'Ödeme bekleniyor',
  addToCalendar: 'Takvime Ekle',
  appleOutlookCalendar: 'Apple / Outlook Takvim',
  googleCalendar: 'Google Takvim',
  changeDate: 'Tarihi değiştir',
  requestRefund: 'İade İsteği Gönder',
  refundModalTitle: 'İade Talebi Gönder',
  refundModalBody:
    'Talebiniz yöneticilerimize iletilecek ve 24 saat içinde sonuçlanacaktır. Onaylanma anında ödemeniz kartınıza iade edilir.',
  refundReasonLabel: 'İade nedeni (opsiyonel)',
  refundReasonPlaceholder: 'Örn. tarih değişikliği yapamadım, hava koşulları, vb.',
  refundModalCancel: 'Vazgeç',
  refundModalConfirm: 'Talebi Gönder',
  refundSending: 'Gönderiliyor...',
  refundAlreadyRequestedNotice:
    'İade talebiniz yöneticilerimize iletildi. 24 saat içinde sonuçlanacaktır; onaylanma anında size e-posta gönderilecektir.',
  refundNotOnlinePaidText: 'Bu rezervasyon online ödenmediği için sadece iletişim kanalları üzerinden işlem yapılabilir.',
  refundWindowClosedText: 'Tur kalkışına 24 saatten az kaldığı için iade talebi gönderilemez. Lütfen bizimle iletişime geçin.',
  refundPolicyText: (deadline) => `${deadline} tarihine kadar iade talebi gönderebilirsiniz.`,
  guestListTitle: 'Misafir listesi',
  editInfoLink: 'Bilgilerinizi düzenleyin',
  boatBarTitle: 'Tekne Barı',
  boatBarDesc: 'Kokteyller, soğuk içecekler ve daha fazlası',
  boatBarCta: 'Bar menüsünü gör',
  whereTitle: 'Toplanma noktası',
  boardingStartLabel: 'Biniş başlar',
  latestBoardingLabel: 'En geç biniş',
  departureTimeLabel: 'Kalkış',
  viewOnMap: 'Haritada görüntüle',
  whatToBringTitle: 'Getirmeniz gerekenler',
  whatToBringText:
    'Yüzme kıyafetleri, güneş kremi, şapka, havlu ve yüzme molaları arasında rahat hareket edebilmeniz için hafif kıyafetler getirmenizi öneririz.',
  equipmentProvidedText: 'Can yeleği gibi güvenlik ekipmanları tarafımızdan temin edilmektedir.',
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
  mealLabel: 'Meal',
  paidBadge: 'Payment completed',
  depositPaidBadge: 'Deposit paid',
  remainingCashLabel: 'Remaining (cash)',
  remainingCashNote: 'The remaining balance is paid in cash on the day of the tour.',
  cashDueBadge: 'Cash due on board',
  pendingBadge: 'Payment pending',
  addToCalendar: 'Add to Calendar',
  appleOutlookCalendar: 'Apple / Outlook Calendar',
  googleCalendar: 'Google Calendar',
  changeDate: 'Change date',
  requestRefund: 'Request Refund',
  refundModalTitle: 'Request a Refund',
  refundModalBody:
    'Your request will be sent to our team and resolved within 24 hours. Once approved, your payment will be refunded to your card.',
  refundReasonLabel: 'Reason (optional)',
  refundReasonPlaceholder: 'E.g. could not change the date, weather conditions, etc.',
  refundModalCancel: 'Cancel',
  refundModalConfirm: 'Send Request',
  refundSending: 'Sending...',
  refundAlreadyRequestedNotice:
    'Your refund request has been sent to our team. It will be resolved within 24 hours; you will receive an email once it is approved.',
  refundNotOnlinePaidText: 'This booking was not paid online, so changes can only be made through our contact channels.',
  refundWindowClosedText: 'Less than 24 hours remain until departure, so a refund request can no longer be sent. Please contact us.',
  refundPolicyText: (deadline) => `You can request a refund until ${deadline}.`,
  guestListTitle: 'Guest list',
  editInfoLink: 'Edit your details',
  boatBarTitle: 'Boat Bar',
  boatBarDesc: 'Cocktails, cold drinks and more',
  boatBarCta: 'View bar menu',
  whereTitle: 'Meeting point',
  boardingStartLabel: 'Boarding starts',
  latestBoardingLabel: 'Latest boarding',
  departureTimeLabel: 'Departure',
  viewOnMap: 'View on map',
  whatToBringTitle: 'What to bring',
  whatToBringText:
    "Swimwear, sunscreen, a hat, a towel, and light clothing to move comfortably between swim stops.",
  equipmentProvidedText: 'Safety equipment such as life jackets is provided on board.',
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

const RU: BookingConfirmationUi = {
  paidTitle: (name) => (name ? `Спасибо, ${name}! Ваше бронирование подтверждено.` : 'Ваше бронирование подтверждено!'),
  pendingCashTitle: (name) => (name ? `Спасибо, ${name}! Мы получили ваше бронирование.` : 'Ваше бронирование получено!'),
  pendingTitle: (name) => (name ? `Спасибо, ${name}!` : 'Платёж получен'),
  failedTitle: 'Не удалось завершить оплату',
  cancelledTitle: 'Бронирование отменено',
  paidSubtitle: 'Ваш платёж успешно завершён. Билет отправлен на вашу электронную почту.',
  pendingCashSubtitle: 'Полная сумма будет оплачена наличными на борту в день тура.',
  pendingSubtitle: 'Окончательное подтверждение и билет поступят на вашу почту в течение нескольких секунд.',
  failedSubtitle: 'Это бронирование было отмечено как неудавшееся во время оплаты. Если проблема повторится, пожалуйста, свяжитесь с нами.',
  cancelledSubtitle: 'Это бронирование было отменено.',
  reservationCode: 'Код бронирования',
  scanHint: 'Экипаж отсканирует это при посадке',
  expandBoardingPass: 'Развернуть посадочный талон',
  guestLabel: 'Гость',
  tourLabel: 'Тур',
  guestCountLabel: (n) => `${n} гостей`,
  mealLabel: 'Питание',
  paidBadge: 'Оплата завершена',
  depositPaidBadge: 'Депозит оплачен',
  remainingCashLabel: 'Остаток (наличными)',
  remainingCashNote: 'Остаток оплачивается наличными в день тура.',
  cashDueBadge: 'Наличные оплачиваются на борту',
  pendingBadge: 'Ожидается оплата',
  addToCalendar: 'Добавить в календарь',
  appleOutlookCalendar: 'Календарь Apple / Outlook',
  googleCalendar: 'Календарь Google',
  changeDate: 'Изменить дату',
  requestRefund: 'Запросить возврат',
  refundModalTitle: 'Запрос на возврат средств',
  refundModalBody:
    'Ваш запрос будет отправлен нашей команде и рассмотрен в течение 24 часов. После одобрения средства будут возвращены на вашу карту.',
  refundReasonLabel: 'Причина (необязательно)',
  refundReasonPlaceholder: 'Например: не удалось изменить дату, погодные условия и т.д.',
  refundModalCancel: 'Отмена',
  refundModalConfirm: 'Отправить запрос',
  refundSending: 'Отправка...',
  refundAlreadyRequestedNotice:
    'Ваш запрос на возврат отправлен нашей команде. Он будет рассмотрен в течение 24 часов; после одобрения вы получите письмо на электронную почту.',
  refundNotOnlinePaidText: 'Это бронирование не было оплачено онлайн, поэтому изменения можно внести только через наши каналы связи.',
  refundWindowClosedText: 'До отправления осталось менее 24 часов, поэтому запрос на возврат больше не может быть отправлен. Пожалуйста, свяжитесь с нами.',
  refundPolicyText: (deadline) => `Вы можете запросить возврат до ${deadline}.`,
  guestListTitle: 'Список гостей',
  editInfoLink: 'Изменить свои данные',
  boatBarTitle: 'Бар на борту',
  boatBarDesc: 'Коктейли, холодные напитки и многое другое',
  boatBarCta: 'Посмотреть меню бара',
  whereTitle: 'Место встречи',
  boardingStartLabel: 'Посадка начинается',
  latestBoardingLabel: 'Последняя посадка',
  departureTimeLabel: 'Отправление',
  viewOnMap: 'Посмотреть на карте',
  whatToBringTitle: 'Что взять с собой',
  whatToBringText:
    'Рекомендуем взять плавательную одежду, солнцезащитный крем, шляпу, полотенце и лёгкую одежду, чтобы было удобно передвигаться между остановками для купания.',
  equipmentProvidedText: 'Спасательные жилеты и другое оборудование безопасности предоставляются на борту.',
  foodDrinkTitle: 'Еда и напитки',
  foodDrinkPolicyText: 'Вы можете привезти свою еду; приносить напитки с собой на борт не разрешается.',
  needHelpTitle: 'Нужна помощь?',
  whatsappCta: 'Напишите нам в WhatsApp',
  viewTicket: 'Посмотреть мой билет',
  downloadPdf: 'Скачать билет (PDF)',
  backHome: 'Вернуться на главную',
  boardingPassTitle: 'Посадочный талон',
  boardingPassHint: 'Покажите это экипажу при посадке',
  reservationOwner: 'Владелец бронирования',
  guestsCount: 'Гости',
  viewFullTicket: 'Посмотреть / распечатать полный билет',
  close: 'Закрыть',
}

const MAP: Record<SiteLocale, BookingConfirmationUi> = { tr: TR, en: EN, de: EN, ru: RU }

export function getBookingConfirmationUi(locale: SiteLocale): BookingConfirmationUi {
  return MAP[locale] ?? TR
}
