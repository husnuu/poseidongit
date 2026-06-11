import type { SiteLocale } from './config'
import { NUMBER_LOCALE } from './localizedLabels'

export type FirstClassLocaUi = {
  ariaGroup: string
  taken: string
  selected: string
  yourBooth: string
  available: string
  selectedIconAria: string
  current: string
  availableBadge: string
  twoPerson: string
  bowRowLabel: string
  selectedOfRequired: (selected: number, required: number) => string
}

export type BookingWizardUi = {
  locale: SiteLocale
  numberLocale: string
  firstClassLoca: FirstClassLocaUi
  rulesTitleFallback: string
  guestCountTitle: string
  adult: string
  adultAge: string
  child: string
  childAge: string
  baby: string
  babyAge: string
  ariaDecAdult: string
  ariaIncAdult: string
  ariaDecChild: string
  ariaIncChild: string
  ariaDecBaby: string
  ariaIncBaby: string
  maxGuestsError: (max: number) => string
  selectDateTitle: string
  prevMonthAria: string
  nextMonthAria: string
  weekdaysShort: string[]
  classSelectTitle: string
  bungalowTwoPersonOdd: string
  statusFull: string
  statusClosed: string
  statusInsufficientCap: string
  remainingAfterBookings: (cap: number) => string
  quotaFullThisDate: string
  lastNSpots: (n: number) => string
  selectedBadge: string
  adultPriceLine: (dateFormatted: string, priceFormatted: string) => string
  remainingSpots: (cap: number) => string
  insufficientCapLine: () => string
  firstClassAdultsOnly: string
  classCapacityShortage: () => string
  locaSelectTitle: string
  locaSelectAria: string
  summaryTitle: string
  tourOverlayLabel: string
  labelDate: string
  labelClass: string
  labelParticipants: string
  labelUnitPrice: string
  peopleCount: (n: number) => string
  totalLabel: string
  dueNowLabel: string
  /** Adım 3 özet: kapora satırı */
  payDepositNowLabel: (percent: number) => string
  /** Adım 3 özet: kalan tutar satırı */
  payRemainingAtDoorLabel: string
  formHeadingSr: string
  yourDetailsTitle: string
  labelFirstName: string
  labelLastName: string
  labelEmail: string
  labelPhone: string
  labelNote: string
  pickupLabel: string
  pickupAria: string
  ticketDeliveryNotice: string
  otherGuestsTitle: string
  otherGuestsHint: string
  labelMealPreference: string
  mealPreferenceAriaSuffix: string
  mealFallbackTitle: string
  labelGenderPrimary: string
  labelGender: string
  genderMale: string
  genderFemale: string
  genderAriaSuffix: string
  infantGenderLabel: (index: number) => string
  allMaleBlocked: string
  paymentInfoTitle: string
  payNowSummary: (amount: string, percent: number) => string
  remainingPayTourDay: (amount: string) => string
  testModeTitle: string
  /** <em>{pay button label}</em> öncesi */
  testModePageBeforePay: string
  /** <em>{pay button label}</em> sonrası */
  testModePageAfterPay: string
  testModeModalBeforePay: string
  testModeModalAfterPay: string
  /** Nestpay 3D: kart banka sayfasında; bizde kart alanı yok */
  nestpayRedirectTitle: string
  nestpayRedirectBody: string
  cardDetailsTitle: string
  cardholderName: string
  cardNumber: string
  cardExpiry: string
  cardCvc: string
  termsLinkText: string
  termsCheckboxLead: string
  termsCheckboxTrail: string
  back: string
  backAria: string
  closeAria: string
  continue: string
  toPayment: string
  processing: string
  pay: string
  payAria: string
  capacityClassShortage: () => string
  serverError: (status: number) => string
  bookingSaveFailed: (status: number) => string
  invalidServerResponse: string
  connectionError: string
  doneReturnToTour: string
  paymentSuccessTitle: string
  refLabel: string
  sheetTour: string
  sheetDate: string
  sheetClass: string
  sheetTotal: string
  ticketFootnote: string
  viewTicket: string
  manageBookingHintBefore: string
  manageBookingLink: string
  manageBookingHintAfter: string
  modalTitle: string
  modalCloseAria: string
  stepProgressAria: (step: number, max: number) => string
  savingReservation: string
  close: string
  stepLoadError: string
  paymentSummaryTitle: string
  paymentSummarySubtitle: string
  paymentTotalPrice: string
  paymentDueNow: string
  depositBadge: (percent: number) => string
  paymentRemainingTourDay: string
  selectClassButton: string
  selectClassAriaPickLoca: (classLabel: string) => string
  selectClassAriaContinue: (classLabel: string) => string
  classAriaAvailable: string
  classAriaInsufficient: string
  classAriaFull: string
  classAriaClosed: string
  calendarDayAria: (dayNum: number, isoDate: string, pricePart: string) => string
  validation: {
    firstName: string
    lastName: string
    emailRequired: string
    emailInvalid: string
    phoneRequired: string
    phoneInvalid: string
    travelerFirst: string
    travelerLast: string
    mealPreference: string
    gender: string
  }
}

const UI: Record<SiteLocale, BookingWizardUi> = {
  tr: {
    locale: 'tr',
    numberLocale: NUMBER_LOCALE.tr,
    firstClassLoca: {
      ariaGroup: 'First Class loca seçimi',
      taken: 'Dolu',
      selected: 'Seçildi',
      yourBooth: 'Sizin loca',
      available: 'Uygun',
      selectedIconAria: 'Seçildi',
      current: 'Mevcut',
      availableBadge: 'Uygun',
      twoPerson: '2 Kişilik',
      bowRowLabel: 'Teknenin önü · 1. Sıra',
      selectedOfRequired: (s, r) => `${s} / ${r} loca seçildi`,
    },
    rulesTitleFallback: 'Rezervasyon Bilgileri',
    guestCountTitle: 'Kişi Sayısı',
    adult: 'Yetişkin',
    adultAge: '11–99 yaş',
    child: 'Çocuk',
    childAge: '6–10 yaş',
    baby: 'Bebek',
    babyAge: '0–5 yaş',
    ariaDecAdult: 'Yetişkin azalt',
    ariaIncAdult: 'Yetişkin artır',
    ariaDecChild: 'Çocuk azalt',
    ariaIncChild: 'Çocuk artır',
    ariaDecBaby: 'Bebek azalt',
    ariaIncBaby: 'Bebek artır',
    maxGuestsError: (max) => `En fazla ${max} kişi seçebilirsiniz.`,
    selectDateTitle: 'Tarih Seçin',
    prevMonthAria: 'Önceki ay',
    nextMonthAria: 'Sonraki ay',
    weekdaysShort: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
    classSelectTitle: 'Sınıf Seçimi',
    bungalowTwoPersonOdd:
      'Bu alandaki bungalov yataklarımız 2 kişiliktir. Tek sayılı kişi ile rezervasyon verilmemektedir.',
    statusFull: 'DOLU',
    statusClosed: 'KAPALI',
    statusInsufficientCap: 'KAPASİTE YETERSİZ',
    remainingAfterBookings: (cap) => `Mevcut rezervasyonlardan sonra kalan: ${cap} kişi`,
    quotaFullThisDate: 'Bu tarih için kontenjan dolmuştur',
    lastNSpots: (n) => `Son ${n} yer`,
    selectedBadge: 'SEÇİLDİ',
    adultPriceLine: (d, p) => `Yetişkin (${d}): ${p} ₺`,
    remainingSpots: (cap) => `Kalan: ${cap} kişi`,
    insufficientCapLine: () =>
      'Seçtiğiniz kişi sayısı için yeterli yer kalmamış. Başka sınıf seçin veya kişi sayısını azaltın.',
    firstClassAdultsOnly: 'First class için sadece 16 yaş üstü misafirler kabul edilmektedir.',
    classCapacityShortage: () =>
      'Bu sınıf için yeterli kapasite yok. Başka sınıf seçin veya kişi sayısını azaltın.',
    locaSelectTitle: 'Loca Seçimi',
    locaSelectAria: 'First Class loca seçimi',
    summaryTitle: 'Özet',
    tourOverlayLabel: 'Tekne Turu',
    labelDate: 'Tarih',
    labelClass: 'Sınıf',
    labelParticipants: 'Katılımcı',
    labelUnitPrice: 'Birim fiyat',
    peopleCount: (n) => `${n} kişi`,
    totalLabel: 'Toplam',
    dueNowLabel: 'Şimdi ödenecek tutar',
    payDepositNowLabel: (percent) => `%${percent} kapora — şimdi ödeyin`,
    payRemainingAtDoorLabel: 'Kalan — kapıda ödeyin',
    formHeadingSr: 'Bilgileriniz',
    yourDetailsTitle: 'Bilgileriniz',
    labelFirstName: 'Ad *',
    labelLastName: 'Soyad *',
    labelEmail: 'E-posta *',
    labelPhone: 'Telefon *',
    labelNote: 'Özel istek (opsiyonel)',
    pickupLabel: 'Toplanma / Alım noktası',
    pickupAria: 'Toplanma noktası seçin',
    ticketDeliveryNotice: 'Bilet bilgileriniz SMS ve e-postayla ücretsiz gönderilecektir.',
    otherGuestsTitle: 'Diğer yolcular',
    otherGuestsHint: 'Diğer misafirlerin bilgilerini doldurun.',
    labelMealPreference: 'Yemek tercihi *',
    mealPreferenceAriaSuffix: 'yemek tercihi',
    mealFallbackTitle: 'Yemek tercihi',
    labelGenderPrimary: 'Cinsiyet',
    labelGender: 'Cinsiyet',
    genderMale: 'Bay',
    genderFemale: 'Bayan',
    genderAriaSuffix: 'cinsiyet',
    infantGenderLabel: (index) => `Bebek ${index}`,
    allMaleBlocked: 'Rezervasyonu tamamlayabilmek için yolcular arasında en az bir bayan bulunmalıdır.',
    paymentInfoTitle: 'Ödeme Bilgileri',
    payNowSummary: (amount, percent) => `Şimdi öde: ${amount} ₺ (%${percent})`,
    remainingPayTourDay: (amount) => `Kalan: ${amount} ₺ (tur günü öde)`,
    testModeTitle: 'Test modu aktif',
    testModePageBeforePay: 'Sanal POS kapalı olsa da alttaki ',
    testModePageAfterPay: ' butonu ile rezervasyon oluşturup veri/e-posta akışını test edebilirsiniz.',
    testModeModalBeforePay: 'Sanal POS kapalı olsa da bu ekranda ',
    testModeModalAfterPay: ' ile rezervasyonu test amaçlı oluşturabilirsiniz.',
    nestpayRedirectTitle: 'Güvenli ödeme',
    nestpayRedirectBody:
      'Ödeme, bankanın güvenli sayfasında tamamlanır; kart bilgisi sitemizde toplanmaz. «Öde»ye bastığınızda kısa süre içinde ödeme ekranına yönlendirileceksiniz.',
    cardDetailsTitle: 'Kart Bilgileri',
    cardholderName: 'Kart Sahibi Adı *',
    cardNumber: 'Kart Numarası *',
    cardExpiry: 'Son Kullanma (AA/YY) *',
    cardCvc: 'CVC *',
    termsLinkText: 'Şartlar & Koşullar',
    termsCheckboxLead: '',
    termsCheckboxTrail: '’ı okudum ve kabul ediyorum.',
    back: 'Geri',
    backAria: 'Önceki adıma dön',
    closeAria: 'Kapat',
    continue: 'Devam',
    toPayment: 'Ödemeye Geç',
    processing: 'İşleniyor…',
    pay: 'ÖDE',
    payAria: 'Öde',
    capacityClassShortage: () =>
      'Bu sınıf için yeterli kapasite yok. Başka sınıf seçin veya kişi sayısını azaltın.',
    serverError: (status) =>
      `Sunucu hata döndü (${status}). Lütfen tekrar deneyin veya destek ile iletişime geçin.`,
    bookingSaveFailed: (status) => `Rezervasyon kaydedilemedi (${status}).`,
    invalidServerResponse: 'Sunucu yanıtı geçersiz. Lütfen tekrar deneyin.',
    connectionError: 'Bağlantı hatası. Lütfen tekrar deneyin.',
    doneReturnToTour: 'Tura Dön',
    paymentSuccessTitle: 'Rezervasyonunuz onaylandı',
    refLabel: 'Rezervasyon no',
    sheetTour: 'Tur',
    sheetDate: 'Tarih',
    sheetClass: 'Sınıf',
    sheetTotal: 'Toplam',
    ticketFootnote:
      'Biletinizi aşağıdan anında görüntüleyebilir veya e-postanızdaki PDF ekinde saklayabilirsiniz.',
    viewTicket: 'Biletimi Görüntüle',
    manageBookingHintBefore: 'Biletinizi görmek için ',
    manageBookingLink: 'Rezervasyonumu Yönet',
    manageBookingHintAfter: ' sayfasına gidip e-postanızı girin.',
    modalTitle: 'Rezervasyon',
    modalCloseAria: 'Rezervasyonu kapat',
    stepProgressAria: (step, max) => `Adım ${step} / ${max}`,
    savingReservation: 'Rezervasyonunuz kaydediliyor…',
    close: 'Kapat',
    stepLoadError: 'Adım bileşeni yüklenemedi. Sayfayı yenileyin.',
    paymentSummaryTitle: 'Ödeme Özeti',
    paymentSummarySubtitle: 'Toplam fiyat ve şimdi ödeyeceğiniz tutar',
    paymentTotalPrice: 'Toplam fiyat',
    paymentDueNow: 'Şimdi ödenecek tutar',
    depositBadge: (percent) => `%${percent} kapora`,
    paymentRemainingTourDay: 'Kalan — kapıda ödeyin',
    selectClassButton: 'Seçiniz',
    selectClassAriaPickLoca: (classLabel) => `${classLabel} seç, loca seçin`,
    selectClassAriaContinue: (classLabel) => `${classLabel} seç ve devam et`,
    classAriaAvailable: 'Müsait',
    classAriaInsufficient: 'Kapasite yetersiz',
    classAriaFull: 'Dolu',
    classAriaClosed: 'Kapalı',
    calendarDayAria: (dayNum, isoDate, pricePart) => `${dayNum} ${isoDate}${pricePart}`,
    validation: {
      firstName: 'Ad zorunludur.',
      lastName: 'Soyad zorunludur.',
      emailRequired: 'E-posta zorunludur.',
      emailInvalid: 'Geçerli bir e-posta adresi giriniz.',
      phoneRequired: 'Telefon zorunludur.',
      phoneInvalid: 'Geçerli bir telefon numarası giriniz.',
      travelerFirst: 'Ad zorunludur.',
      travelerLast: 'Soyad zorunludur.',
      mealPreference: 'Yemek tercihi zorunludur.',
      gender: 'Cinsiyet seçimi zorunludur.',
    },
  },
  en: {
    locale: 'en',
    numberLocale: NUMBER_LOCALE.en,
    firstClassLoca: {
      ariaGroup: 'First Class booth selection',
      taken: 'Taken',
      selected: 'Selected',
      yourBooth: 'Your booth',
      available: 'Available',
      selectedIconAria: 'Selected',
      current: 'Current',
      availableBadge: 'Available',
      twoPerson: '2 guests',
      bowRowLabel: 'Bow · Row 1',
      selectedOfRequired: (s, r) => `${s} / ${r} booths selected`,
    },
    rulesTitleFallback: 'Booking information',
    guestCountTitle: 'Number of guests',
    adult: 'Adult',
    adultAge: 'Ages 11–99',
    child: 'Child',
    childAge: 'Ages 6–10',
    baby: 'Infant',
    babyAge: 'Ages 0–5',
    ariaDecAdult: 'Decrease adults',
    ariaIncAdult: 'Increase adults',
    ariaDecChild: 'Decrease children',
    ariaIncChild: 'Increase children',
    ariaDecBaby: 'Decrease infants',
    ariaIncBaby: 'Increase infants',
    maxGuestsError: (max) => `You can select up to ${max} guests.`,
    selectDateTitle: 'Choose a date',
    prevMonthAria: 'Previous month',
    nextMonthAria: 'Next month',
    weekdaysShort: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    classSelectTitle: 'Choose a class',
    bungalowTwoPersonOdd:
      'Booth beds in this area are for two guests. Bookings with an odd number of guests are not available.',
    statusFull: 'FULL',
    statusClosed: 'CLOSED',
    statusInsufficientCap: 'NOT ENOUGH SPACE',
    remainingAfterBookings: (cap) => `${cap} spots left after current bookings`,
    quotaFullThisDate: 'No availability left on this date',
    lastNSpots: (n) => `Only ${n} left`,
    selectedBadge: 'SELECTED',
    adultPriceLine: (d, p) => `Adult (${d}): ${p} ₺`,
    remainingSpots: (cap) => `${cap} spots left`,
    insufficientCapLine: () =>
      'Not enough space for your party size. Choose another class or reduce the number of guests.',
    firstClassAdultsOnly: 'First class is for guests aged 16 and over only.',
    classCapacityShortage: () =>
      'Not enough capacity in this class. Choose another class or reduce the number of guests.',
    locaSelectTitle: 'Booth selection',
    locaSelectAria: 'First Class booth selection',
    summaryTitle: 'Summary',
    tourOverlayLabel: 'Boat tour',
    labelDate: 'Date',
    labelClass: 'Class',
    labelParticipants: 'Guests',
    labelUnitPrice: 'Unit price',
    peopleCount: (n) => (n === 1 ? '1 guest' : `${n} guests`),
    totalLabel: 'Total',
    dueNowLabel: 'Pay now',
    payDepositNowLabel: (percent) => `Pay ${percent}% deposit now`,
    payRemainingAtDoorLabel: 'Remaining — pay at boarding',
    formHeadingSr: 'Your details',
    yourDetailsTitle: 'Your details',
    labelFirstName: 'First name *',
    labelLastName: 'Last name *',
    labelEmail: 'Email *',
    labelPhone: 'Phone *',
    labelNote: 'Special requests (optional)',
    pickupLabel: 'Pick-up / meeting point',
    pickupAria: 'Select meeting point',
    ticketDeliveryNotice: 'Your ticket details will be sent by SMS and email at no charge.',
    otherGuestsTitle: 'Other guests',
    otherGuestsHint: 'Please enter details for your other guests.',
    labelMealPreference: 'Meal preference *',
    mealPreferenceAriaSuffix: 'meal preference',
    mealFallbackTitle: 'Meal preference',
    labelGenderPrimary: 'Gender',
    labelGender: 'Gender',
    genderMale: 'Male',
    genderFemale: 'Female',
    genderAriaSuffix: 'gender',
    infantGenderLabel: (index) => `Infant ${index}`,
    allMaleBlocked: 'To complete your booking, at least one guest must be marked as female.',
    paymentInfoTitle: 'Payment details',
    payNowSummary: (amount, percent) => `Pay now: ${amount} ₺ (${percent}%)`,
    remainingPayTourDay: (amount) => `Remaining: ${amount} ₺ (pay on tour day)`,
    testModeTitle: 'Test mode active',
    testModePageBeforePay: 'Even with the virtual POS disabled, you can complete a booking with the ',
    testModePageAfterPay: ' button below to test data and email flow.',
    testModeModalBeforePay: 'Even with the virtual POS disabled, you can use ',
    testModeModalAfterPay: ' on this screen to create a test booking.',
    nestpayRedirectTitle: 'Secure payment',
    nestpayRedirectBody:
      'You will complete payment on your bank’s secure page; card details are not collected on this site. After you tap Pay, you will be redirected to the payment screen.',
    cardDetailsTitle: 'Card details',
    cardholderName: 'Name on card *',
    cardNumber: 'Card number *',
    cardExpiry: 'Expiry (MM/YY) *',
    cardCvc: 'CVC *',
    termsLinkText: 'Terms & Conditions',
    termsCheckboxLead: 'I have read and accept the ',
    termsCheckboxTrail: '.',
    back: 'Back',
    backAria: 'Go to previous step',
    closeAria: 'Close',
    continue: 'Continue',
    toPayment: 'Continue to payment',
    processing: 'Processing…',
    pay: 'PAY',
    payAria: 'Pay',
    capacityClassShortage: () =>
      'Not enough capacity in this class. Choose another class or reduce the number of guests.',
    serverError: (status) =>
      `The server returned an error (${status}). Please try again or contact support.`,
    bookingSaveFailed: (status) => `Could not save your booking (${status}).`,
    invalidServerResponse: 'Invalid server response. Please try again.',
    connectionError: 'Connection error. Please try again.',
    doneReturnToTour: 'Back to tour',
    paymentSuccessTitle: 'Your booking is confirmed',
    refLabel: 'Booking no.',
    sheetTour: 'Tour',
    sheetDate: 'Date',
    sheetClass: 'Class',
    sheetTotal: 'Total',
    ticketFootnote: 'View your ticket below or keep the PDF attached to your email.',
    viewTicket: 'View my ticket',
    manageBookingHintBefore: 'To view your ticket, go to ',
    manageBookingLink: 'Manage my booking',
    manageBookingHintAfter: ' and enter your email.',
    modalTitle: 'Book',
    modalCloseAria: 'Close booking',
    stepProgressAria: (step, max) => `Step ${step} of ${max}`,
    savingReservation: 'Saving your booking…',
    close: 'Close',
    stepLoadError: 'Could not load this step. Please refresh the page.',
    paymentSummaryTitle: 'Payment summary',
    paymentSummarySubtitle: 'Total price and amount due now',
    paymentTotalPrice: 'Total price',
    paymentDueNow: 'Amount due now',
    depositBadge: (percent) => `${percent}% deposit`,
    paymentRemainingTourDay: 'Remaining — pay at boarding',
    selectClassButton: 'Select',
    selectClassAriaPickLoca: (classLabel) => `Select ${classLabel}, choose booths`,
    selectClassAriaContinue: (classLabel) => `Select ${classLabel} and continue`,
    classAriaAvailable: 'Available',
    classAriaInsufficient: 'Insufficient capacity',
    classAriaFull: 'Full',
    classAriaClosed: 'Closed',
    calendarDayAria: (dayNum, isoDate, pricePart) => `${dayNum} ${isoDate}${pricePart}`,
    validation: {
      firstName: 'First name is required.',
      lastName: 'Last name is required.',
      emailRequired: 'Email is required.',
      emailInvalid: 'Please enter a valid email address.',
      phoneRequired: 'Phone is required.',
      phoneInvalid: 'Please enter a valid phone number.',
      travelerFirst: 'First name is required.',
      travelerLast: 'Last name is required.',
      mealPreference: 'Meal preference is required.',
      gender: 'Gender selection is required.',
    },
  },
  de: {
    locale: 'de',
    numberLocale: NUMBER_LOCALE.de,
    firstClassLoca: {
      ariaGroup: 'First-Class-Logenwahl',
      taken: 'Belegt',
      selected: 'Ausgewählt',
      yourBooth: 'Ihre Loge',
      available: 'Frei',
      selectedIconAria: 'Ausgewählt',
      current: 'Aktuell',
      availableBadge: 'Frei',
      twoPerson: '2 Personen',
      bowRowLabel: 'Bug · Reihe 1',
      selectedOfRequired: (s, r) => `${s} / ${r} Logen gewählt`,
    },
    rulesTitleFallback: 'Buchungsinformationen',
    guestCountTitle: 'Personenanzahl',
    adult: 'Erwachsene',
    adultAge: '11–99 Jahre',
    child: 'Kind',
    childAge: '6–10 Jahre',
    baby: 'Baby',
    babyAge: '0–5 Jahre',
    ariaDecAdult: 'Erwachsene verringern',
    ariaIncAdult: 'Erwachsene erhöhen',
    ariaDecChild: 'Kinder verringern',
    ariaIncChild: 'Kinder erhöhen',
    ariaDecBaby: 'Babys verringern',
    ariaIncBaby: 'Babys erhöhen',
    maxGuestsError: (max) => `Sie können maximal ${max} Personen auswählen.`,
    selectDateTitle: 'Datum wählen',
    prevMonthAria: 'Vorheriger Monat',
    nextMonthAria: 'Nächster Monat',
    weekdaysShort: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
    classSelectTitle: 'Klasse wählen',
    bungalowTwoPersonOdd:
      'Die Kabinenbetten in diesem Bereich sind für zwei Personen. Buchungen mit ungerader Personenzahl sind nicht möglich.',
    statusFull: 'AUSGEBUCHT',
    statusClosed: 'GESCHLOSSEN',
    statusInsufficientCap: 'ZU WENIG PLATZ',
    remainingAfterBookings: (cap) => `Nach aktuellen Buchungen noch ${cap} Plätze`,
    quotaFullThisDate: 'Für dieses Datum ist kein Kontingent mehr frei',
    lastNSpots: (n) => `Nur noch ${n} Plätze`,
    selectedBadge: 'GEWÄHLT',
    adultPriceLine: (d, p) => `Erwachsene (${d}): ${p} ₺`,
    remainingSpots: (cap) => `Noch ${cap} Plätze`,
    insufficientCapLine: () =>
      'Für Ihre Personenzahl ist nicht genug Platz. Wählen Sie eine andere Klasse oder reduzieren Sie die Gästezahl.',
    firstClassAdultsOnly: 'First Class ist nur für Gäste ab 16 Jahren.',
    classCapacityShortage: () =>
      'In dieser Klasse reicht die Kapazität nicht. Wählen Sie eine andere Klasse oder reduzieren Sie die Personenzahl.',
    locaSelectTitle: 'Logenwahl',
    locaSelectAria: 'First-Class-Logenwahl',
    summaryTitle: 'Übersicht',
    tourOverlayLabel: 'Bootstour',
    labelDate: 'Datum',
    labelClass: 'Klasse',
    labelParticipants: 'Teilnehmende',
    labelUnitPrice: 'Stückpreis',
    peopleCount: (n) => (n === 1 ? '1 Person' : `${n} Personen`),
    totalLabel: 'Gesamt',
    dueNowLabel: 'Jetzt zu zahlen',
    payDepositNowLabel: (percent) => `${percent}% Anzahlung — jetzt zahlen`,
    payRemainingAtDoorLabel: 'Rest — vor Ort zahlen',
    formHeadingSr: 'Ihre Angaben',
    yourDetailsTitle: 'Ihre Angaben',
    labelFirstName: 'Vorname *',
    labelLastName: 'Nachname *',
    labelEmail: 'E-Mail *',
    labelPhone: 'Telefon *',
    labelNote: 'Sonderwünsche (optional)',
    pickupLabel: 'Abhol-/Treffpunkt',
    pickupAria: 'Treffpunkt wählen',
    ticketDeliveryNotice: 'Ihre Ticketdaten werden kostenlos per SMS und E-Mail gesendet.',
    otherGuestsTitle: 'Weitere Gäste',
    otherGuestsHint: 'Bitte füllen Sie die Daten der weiteren Gäste aus.',
    labelMealPreference: 'Menüwunsch *',
    mealPreferenceAriaSuffix: 'Menüwunsch',
    mealFallbackTitle: 'Menüwunsch',
    labelGenderPrimary: 'Geschlecht',
    labelGender: 'Geschlecht',
    genderMale: 'Herr',
    genderFemale: 'Frau',
    genderAriaSuffix: 'Geschlecht',
    infantGenderLabel: (index) => `Baby ${index}`,
    allMaleBlocked: 'Zur Buchungsabschluss muss mindestens eine Person als weiblich angegeben werden.',
    paymentInfoTitle: 'Zahlungsdaten',
    payNowSummary: (amount, percent) => `Jetzt zahlen: ${amount} ₺ (${percent}%)`,
    remainingPayTourDay: (amount) => `Rest: ${amount} ₺ (zahlbar am Tourtag)`,
    testModeTitle: 'Testmodus aktiv',
    testModePageBeforePay: 'Auch wenn das virtuelle POS deaktiviert ist, können Sie mit der Schaltfläche ',
    testModePageAfterPay: ' unten eine Buchung testen und Daten-/E-Mail-Flow prüfen.',
    testModeModalBeforePay: 'Auch wenn das virtuelle POS deaktiviert ist, können Sie hier mit ',
    testModeModalAfterPay: ' eine Testbuchung anlegen.',
    nestpayRedirectTitle: 'Sichere Zahlung',
    nestpayRedirectBody:
      'Die Zahlung erfolgt auf der sicheren Seite Ihrer Bank; Kartendaten werden auf dieser Website nicht erfasst. Nach „Bezahlen“ werden Sie zur Zahlungsseite weitergeleitet.',
    cardDetailsTitle: 'Kartendaten',
    cardholderName: 'Name auf der Karte *',
    cardNumber: 'Kartennummer *',
    cardExpiry: 'Gültig bis (MM/JJ) *',
    cardCvc: 'CVC *',
    termsLinkText: 'AGB',
    termsCheckboxLead: 'Ich habe die ',
    termsCheckboxTrail: ' gelesen und akzeptiere sie.',
    back: 'Zurück',
    backAria: 'Zum vorherigen Schritt',
    closeAria: 'Schließen',
    continue: 'Weiter',
    toPayment: 'Zur Zahlung',
    processing: 'Wird verarbeitet…',
    pay: 'ZAHLEN',
    payAria: 'Zahlen',
    capacityClassShortage: () =>
      'In dieser Klasse reicht die Kapazität nicht. Wählen Sie eine andere Klasse oder reduzieren Sie die Personenzahl.',
    serverError: (status) =>
      `Der Server hat einen Fehler zurückgegeben (${status}). Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.`,
    bookingSaveFailed: (status) => `Buchung konnte nicht gespeichert werden (${status}).`,
    invalidServerResponse: 'Ungültige Serverantwort. Bitte versuchen Sie es erneut.',
    connectionError: 'Verbindungsfehler. Bitte versuchen Sie es erneut.',
    doneReturnToTour: 'Zurück zur Tour',
    paymentSuccessTitle: 'Ihre Buchung ist bestätigt',
    refLabel: 'Buchungsnr.',
    sheetTour: 'Tour',
    sheetDate: 'Datum',
    sheetClass: 'Klasse',
    sheetTotal: 'Gesamt',
    ticketFootnote: 'Sehen Sie Ihr Ticket unten oder speichern Sie den PDF-Anhang Ihrer E-Mail.',
    viewTicket: 'Ticket anzeigen',
    manageBookingHintBefore: 'Um Ihr Ticket zu sehen, öffnen Sie ',
    manageBookingLink: 'Buchung verwalten',
    manageBookingHintAfter: ' und geben Sie Ihre E-Mail ein.',
    modalTitle: 'Buchung',
    modalCloseAria: 'Buchung schließen',
    stepProgressAria: (step, max) => `Schritt ${step} von ${max}`,
    savingReservation: 'Ihre Buchung wird gespeichert…',
    close: 'Schließen',
    stepLoadError: 'Dieser Schritt konnte nicht geladen werden. Bitte laden Sie die Seite neu.',
    paymentSummaryTitle: 'Zahlungsübersicht',
    paymentSummarySubtitle: 'Gesamtpreis und jetzt fälliger Betrag',
    paymentTotalPrice: 'Gesamtpreis',
    paymentDueNow: 'Jetzt fälliger Betrag',
    depositBadge: (percent) => `${percent}% Anzahlung`,
    paymentRemainingTourDay: 'Rest — vor Ort zahlen',
    selectClassButton: 'Wählen',
    selectClassAriaPickLoca: (classLabel) => `${classLabel} wählen, Logen wählen`,
    selectClassAriaContinue: (classLabel) => `${classLabel} wählen und fortfahren`,
    classAriaAvailable: 'Verfügbar',
    classAriaInsufficient: 'Kapazität nicht ausreichend',
    classAriaFull: 'Ausgebucht',
    classAriaClosed: 'Geschlossen',
    calendarDayAria: (dayNum, isoDate, pricePart) => `${dayNum} ${isoDate}${pricePart}`,
    validation: {
      firstName: 'Vorname ist erforderlich.',
      lastName: 'Nachname ist erforderlich.',
      emailRequired: 'E-Mail ist erforderlich.',
      emailInvalid: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
      phoneRequired: 'Telefon ist erforderlich.',
      phoneInvalid: 'Bitte geben Sie eine gültige Telefonnummer ein.',
      travelerFirst: 'Vorname ist erforderlich.',
      travelerLast: 'Nachname ist erforderlich.',
      mealPreference: 'Menüwunsch ist erforderlich.',
      gender: 'Geschlechtsauswahl ist erforderlich.',
    },
  },
}

export function getBookingWizardUi(locale: SiteLocale): BookingWizardUi {
  return UI[locale] ?? UI.tr
}

export function isBadgePopular(badge: string | null | undefined): boolean {
  const b = badge?.toLowerCase() ?? ''
  return b.includes('popüler') || b.includes('popular') || b.includes('populär')
}
