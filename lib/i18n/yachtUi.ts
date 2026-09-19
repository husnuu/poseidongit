import type { SiteLocale } from './config'

export type YachtUi = {
  locale: SiteLocale
  numberLocale: string
  dateLocale: string
  // Header
  locationInfoAria: (loc: string) => string
  // Highlights
  highlightsHeading: string
  specBuildYear: string
  specCapacity: string
  specCabins: string
  specWc: string
  specLength: string
  specCrew: string
  specEngine: string
  specDeparture: string
  personSuffix: string
  // Description / gallery
  descriptionHeading: string
  galleryHeading: string
  galleryAriaLabel: string
  galleryEnlargeAriaSuffix: string
  galleryLightboxAria: string
  galleryLoadingAria: string
  breadcrumbYachtRental: string
  locationHeadingSuffix: string
  locationEmptyStateMessage: string
  // Route / amenities
  routeHeading: string
  amenitiesHeading: string
  // Policy sections
  policyCancelTitle: string
  policyCancelCheckPriceDefault: string
  policyLicenceTitle: string
  policyPetsTitle: string
  policyPaymentMethodsTitle: string
  policyMarinaTitle: string
  // FAQ / optional sections
  relatedToursHeading: string
  relatedYachtsHeading: string
  termsNotesHeading: string
  // Yacht card
  cardNoImage: string
  cardFeaturedBadge: string
  cardTypeLabel: string
  cardLocationLabel: string
  cardCapacityLabel: string
  cardBuildYearLabel: string
  cardCabinsLabel: string
  cardLengthLabel: string
  cardViewButton: string
  // yacht type labels
  yachtTypeGulet: string
  yachtTypeMotoryacht: string
  yachtTypeSailing: string
  yachtTypeCatamaran: string
  yachtTypeOther: string
  // Rental list section
  yachtsListedCount: (n: number) => string
  sortButton: string
  filtersButton: string
  noResultsMessage: string
  // Filters sheet
  filtersCloseAria: string
  filtersTitle: string
  filtersDailyPriceTitle: string
  filtersCapacityTitle: string
  filtersCabinsTitle: string
  filtersClearButton: string
  filtersApplyButton: string
  filterAll: string
  filterThisPrice: string
  filterUpTo: (amount: string) => string
  filterPeopleRange: (label: string) => string
  filterCabinsRange: (label: string) => string
  // Sort sheet
  sortCloseAria: string
  sortTitle: string
  sortDefault: string
  sortPriceAsc: string
  sortPriceDesc: string
  sortCapacityAsc: string
  sortCapacityDesc: string
  sortCabinsAsc: string
  sortCabinsDesc: string
  // Rental mode tabs
  rentalModeTabsAria: string
  rentalModeDaily: string
  rentalModeOvernight: string
  // Hero badge overlay
  featuresAriaLabel: string
  // Inquiry conversion copy defaults
  defaultInquiryTitle: string
  defaultInquiryCta: string
  defaultTrustBullets: readonly string[]
  defaultNoteTitle: string
  defaultNoteSubtitle: string
  selectFromCalendarFallback: string
  // Inquiry experience
  selectedDayLabel: string
  dailyLabel: string
  perDaySuffix: string
  overnightTotalLabel: string
  overnightLabel: string
  perNightSuffix: string
  modesClosedWarning: string
  // Inquiry modal
  inquiryModalTitle: string
  modalCloseAria: string
  stepAria: (step: number, max: number) => string
  step1Subtitle: string
  step2Subtitle: string
  guestCountLabel: string
  decreaseAria: string
  increaseAria: string
  pickDayHint: string
  pickRangeHint: string
  overnightPriceHint: string
  continueButton: string
  backToDateGuests: string
  // Inquiry form
  validationFirstNameRequired: string
  validationLastNameRequired: string
  validationEmailInvalid: string
  validationPhoneRequired: string
  validationMessageMin: string
  turnstileRequired: string
  selectDateRequired: string
  selectRangeRequired: string
  submitFailed: string
  connectionError: string
  submitSuccess: string
  summaryTitle: string
  summaryYacht: string
  summaryLocation: string
  summaryRentalType: string
  summaryDate: string
  summaryDuration: string
  summaryDurationHours: string
  summaryNights: (n: number) => string
  summaryGuestCount: string
  summaryDailyPrice: string
  summaryTotalPrice: string
  rentalTypeDailyLabel: string
  rentalTypeOvernightLabel: string
  labelFirstName: string
  labelLastName: string
  labelEmail: string
  labelPhone: string
  labelMessage: string
  sending: string
}

const TR: YachtUi = {
  locale: 'tr',
  numberLocale: 'tr-TR',
  dateLocale: 'tr-TR',
  locationInfoAria: (loc) => `Konum: ${loc}`,
  highlightsHeading: 'Öne çıkan bilgiler',
  specBuildYear: 'Yapım yılı',
  specCapacity: 'Kapasite',
  specCabins: 'Kabin',
  specWc: 'WC / banyo',
  specLength: 'Uzunluk',
  specCrew: 'Mürettebat',
  specEngine: 'Motor',
  specDeparture: 'Kalkış',
  personSuffix: 'kişi',
  descriptionHeading: 'Açıklama',
  galleryHeading: 'Galeri',
  galleryAriaLabel: 'Galeri, dahil olanlar ve dahil olmayanlar',
  galleryEnlargeAriaSuffix: 'büyüt',
  galleryLightboxAria: 'Fotoğraf galerisi',
  galleryLoadingAria: 'Galeri yükleniyor',
  breadcrumbYachtRental: 'Yat kiralama',
  locationHeadingSuffix: 'YAT KİRALAMA',
  locationEmptyStateMessage: 'Bu lokasyon için henüz yat eklenmemiş.',
  routeHeading: 'Rota önerileri',
  amenitiesHeading: 'Olanaklar',
  policyCancelTitle: 'İptal / ödeme politikaları',
  policyCancelCheckPriceDefault: 'Fiyatı kontrol edin',
  policyLicenceTitle: 'Gerekli belge / ehliyet',
  policyPetsTitle: 'Evcil hayvanlar',
  policyPaymentMethodsTitle: 'Charter şirketinin kabul ettiği ödeme yöntemleri',
  policyMarinaTitle: 'Marina hakkında',
  relatedToursHeading: 'Önerilen turlar',
  relatedYachtsHeading: 'Benzer yatlar',
  termsNotesHeading: 'Şartlar ve notlar',
  cardNoImage: 'Görsel yok',
  cardFeaturedBadge: 'Öne çıkan',
  cardTypeLabel: 'Yat tipi:',
  cardLocationLabel: 'Konum:',
  cardCapacityLabel: 'Yolcu Kapasitesi:',
  cardBuildYearLabel: 'Yapım Yılı:',
  cardCabinsLabel: 'Kabin:',
  cardLengthLabel: 'Uzunluk:',
  cardViewButton: 'İncele',
  yachtTypeGulet: 'Gulet',
  yachtTypeMotoryacht: 'Motoryat',
  yachtTypeSailing: 'Yelkenli',
  yachtTypeCatamaran: 'Katamaran',
  yachtTypeOther: 'Yat',
  yachtsListedCount: (n) => `${n} yat listeleniyor`,
  sortButton: 'Sırala',
  filtersButton: 'Filtreler',
  noResultsMessage: 'Seçtiğiniz filtrelere uygun yat bulunamadı. Filtreleri temizleyip tekrar deneyin.',
  filtersCloseAria: 'Filtreleri kapat',
  filtersTitle: 'Filtreler',
  filtersDailyPriceTitle: 'Günlük fiyat',
  filtersCapacityTitle: 'Kişi kapasitesi',
  filtersCabinsTitle: 'Kabin sayısı',
  filtersClearButton: 'Temizle',
  filtersApplyButton: 'Uygula',
  filterAll: 'Tümü',
  filterThisPrice: 'Bu fiyat',
  filterUpTo: (amount) => `${amount}’ye kadar`,
  filterPeopleRange: (label) => `${label} kişi`,
  filterCabinsRange: (label) => `${label} kabin`,
  sortCloseAria: 'Kapat',
  sortTitle: 'Sıralama',
  sortDefault: 'Önerilen',
  sortPriceAsc: 'Fiyat: düşükten yükseğe',
  sortPriceDesc: 'Fiyat: yüksekten düşüğe',
  sortCapacityAsc: 'Kapasite: azdan çoğa',
  sortCapacityDesc: 'Kapasite: çoktan aza',
  sortCabinsAsc: 'Kabin: azdan çoğa',
  sortCabinsDesc: 'Kabin: çoktan aza',
  rentalModeTabsAria: 'Kiralama türü',
  rentalModeDaily: 'Günlük',
  rentalModeOvernight: 'Konaklamalı',
  featuresAriaLabel: 'Özellikler',
  defaultInquiryTitle: 'MÜSAİTLİK SORUN',
  defaultInquiryCta: 'MÜSAİTLİK SOR',
  defaultTrustBullets: [
    'Günlük başlangıç fiyatından planlayın',
    'Tercih ettiğiniz tarihi seçin',
    'Ekibimiz size özel dönüş yapar',
  ],
  defaultNoteTitle: 'Bilgilendirme',
  defaultNoteSubtitle:
    'Bu adımda ödeme alınmaz; talebiniz iletilir ve müsaitlik için sizinle iletişime geçilir.',
  selectFromCalendarFallback: 'Takvimden seçim yapın',
  selectedDayLabel: 'Seçilen gün',
  dailyLabel: 'Günlük',
  perDaySuffix: '/ gün',
  overnightTotalLabel: 'Konaklamalı toplam',
  overnightLabel: 'Konaklamalı',
  perNightSuffix: '/ gece',
  modesClosedWarning:
    'Bu yat için günlük veya konaklamalı talep seçenekleri kapalı. Lütfen içerik yönetiminden en az bir modu açın.',
  inquiryModalTitle: 'Rezervasyon talebi',
  modalCloseAria: 'Kapat',
  stepAria: (step, max) => `Adım ${step} / ${max}`,
  step1Subtitle: 'Tarih ve misafir sayısını seçin',
  step2Subtitle: 'İletişim bilgilerinizi bırakın',
  guestCountLabel: 'Misafir sayısı',
  decreaseAria: 'Azalt',
  increaseAria: 'Artır',
  pickDayHint: 'Devam etmek için takvimden bir gün seçin.',
  pickRangeHint: 'Devam etmek için giriş ve ayrılış günlerini seçin (en az 1 gece).',
  overnightPriceHint:
    'Konaklama fiyatı için gece takviminde tüm geceler tanımlı olmalı veya konaklamalı gecelik referans fiyat girilmeli.',
  continueButton: 'Devam et',
  backToDateGuests: 'Tarih ve misafir',
  validationFirstNameRequired: 'Ad gerekli',
  validationLastNameRequired: 'Soyad gerekli',
  validationEmailInvalid: 'Geçerli e-posta girin',
  validationPhoneRequired: 'Telefon gerekli',
  validationMessageMin: 'Mesaj en az 5 karakter olsun',
  turnstileRequired: 'Lütfen doğrulama kutusunu işaretleyin.',
  selectDateRequired: 'Lütfen takvimden bir tarih seçin.',
  selectRangeRequired: 'Lütfen geçerli bir konaklama aralığı seçin.',
  submitFailed: 'Gönderim başarısız.',
  connectionError: 'Bağlantı hatası.',
  submitSuccess: 'Talebiniz alındı. En kısa sürede sizinle iletişime geçeceğiz.',
  summaryTitle: 'Talep özeti',
  summaryYacht: 'Yat',
  summaryLocation: 'Konum',
  summaryRentalType: 'Kiralama türü',
  summaryDate: 'Tarih',
  summaryDuration: 'Süre',
  summaryDurationHours: '7 saat',
  summaryNights: (n) => `${n} gece`,
  summaryGuestCount: 'Misafir sayısı',
  summaryDailyPrice: 'Günlük fiyat',
  summaryTotalPrice: 'Toplam fiyat',
  rentalTypeDailyLabel: 'Günlük kiralama',
  rentalTypeOvernightLabel: 'Konaklamalı kiralama',
  labelFirstName: 'Ad *',
  labelLastName: 'Soyad *',
  labelEmail: 'E-posta *',
  labelPhone: 'Telefon *',
  labelMessage: 'Mesaj / özel talep *',
  sending: 'Gönderiliyor...',
}

const EN: YachtUi = {
  locale: 'en',
  numberLocale: 'en-US',
  dateLocale: 'en-US',
  locationInfoAria: (loc) => `Location: ${loc}`,
  highlightsHeading: 'Highlights',
  specBuildYear: 'Build year',
  specCapacity: 'Capacity',
  specCabins: 'Cabins',
  specWc: 'WC / bathroom',
  specLength: 'Length',
  specCrew: 'Crew',
  specEngine: 'Engine',
  specDeparture: 'Departure',
  personSuffix: 'people',
  descriptionHeading: 'Description',
  galleryHeading: 'Gallery',
  galleryAriaLabel: 'Gallery, included and not included',
  galleryEnlargeAriaSuffix: 'enlarge',
  galleryLightboxAria: 'Photo gallery',
  galleryLoadingAria: 'Loading gallery',
  breadcrumbYachtRental: 'Yacht rental',
  locationHeadingSuffix: 'YACHT RENTAL',
  locationEmptyStateMessage: 'No yachts have been added for this location yet.',
  routeHeading: 'Suggested routes',
  amenitiesHeading: 'Amenities',
  policyCancelTitle: 'Cancellation / payment policies',
  policyCancelCheckPriceDefault: 'Check the price',
  policyLicenceTitle: 'Required document / licence',
  policyPetsTitle: 'Pets',
  policyPaymentMethodsTitle: 'Payment methods accepted by the charter company',
  policyMarinaTitle: 'About the marina',
  relatedToursHeading: 'Recommended tours',
  relatedYachtsHeading: 'Similar yachts',
  termsNotesHeading: 'Terms and notes',
  cardNoImage: 'No image',
  cardFeaturedBadge: 'Featured',
  cardTypeLabel: 'Yacht type:',
  cardLocationLabel: 'Location:',
  cardCapacityLabel: 'Passenger capacity:',
  cardBuildYearLabel: 'Build year:',
  cardCabinsLabel: 'Cabins:',
  cardLengthLabel: 'Length:',
  cardViewButton: 'View',
  yachtTypeGulet: 'Gulet',
  yachtTypeMotoryacht: 'Motor yacht',
  yachtTypeSailing: 'Sailing yacht',
  yachtTypeCatamaran: 'Catamaran',
  yachtTypeOther: 'Yacht',
  yachtsListedCount: (n) => `${n} yachts listed`,
  sortButton: 'Sort',
  filtersButton: 'Filters',
  noResultsMessage: 'No yachts match your filters. Clear the filters and try again.',
  filtersCloseAria: 'Close filters',
  filtersTitle: 'Filters',
  filtersDailyPriceTitle: 'Daily price',
  filtersCapacityTitle: 'Guest capacity',
  filtersCabinsTitle: 'Number of cabins',
  filtersClearButton: 'Clear',
  filtersApplyButton: 'Apply',
  filterAll: 'All',
  filterThisPrice: 'This price',
  filterUpTo: (amount) => `Up to ${amount}`,
  filterPeopleRange: (label) => `${label} people`,
  filterCabinsRange: (label) => `${label} cabins`,
  sortCloseAria: 'Close',
  sortTitle: 'Sort',
  sortDefault: 'Recommended',
  sortPriceAsc: 'Price: low to high',
  sortPriceDesc: 'Price: high to low',
  sortCapacityAsc: 'Capacity: low to high',
  sortCapacityDesc: 'Capacity: high to low',
  sortCabinsAsc: 'Cabins: low to high',
  sortCabinsDesc: 'Cabins: high to low',
  rentalModeTabsAria: 'Rental type',
  rentalModeDaily: 'Daily',
  rentalModeOvernight: 'Overnight',
  featuresAriaLabel: 'Features',
  defaultInquiryTitle: 'CHECK AVAILABILITY',
  defaultInquiryCta: 'ASK AVAILABILITY',
  defaultTrustBullets: [
    'Plan from the daily starting price',
    'Choose your preferred date',
    'Our team will get back to you personally',
  ],
  defaultNoteTitle: 'Please note',
  defaultNoteSubtitle:
    'No payment is taken at this step; your request is forwarded and we will contact you about availability.',
  selectFromCalendarFallback: 'Select from the calendar',
  selectedDayLabel: 'Selected day',
  dailyLabel: 'Daily',
  perDaySuffix: '/ day',
  overnightTotalLabel: 'Overnight total',
  overnightLabel: 'Overnight',
  perNightSuffix: '/ night',
  modesClosedWarning:
    'Daily and overnight requests are both closed for this yacht. Please enable at least one mode from the content management.',
  inquiryModalTitle: 'Booking request',
  modalCloseAria: 'Close',
  stepAria: (step, max) => `Step ${step} / ${max}`,
  step1Subtitle: 'Choose a date and number of guests',
  step2Subtitle: 'Leave your contact details',
  guestCountLabel: 'Number of guests',
  decreaseAria: 'Decrease',
  increaseAria: 'Increase',
  pickDayHint: 'Select a day from the calendar to continue.',
  pickRangeHint: 'Select a check-in and check-out day to continue (at least 1 night).',
  overnightPriceHint:
    'For the overnight price, all nights must be priced in the calendar, or a nightly reference price must be entered.',
  continueButton: 'Continue',
  backToDateGuests: 'Date and guests',
  validationFirstNameRequired: 'First name is required',
  validationLastNameRequired: 'Last name is required',
  validationEmailInvalid: 'Enter a valid email address',
  validationPhoneRequired: 'Phone number is required',
  validationMessageMin: 'Message must be at least 5 characters',
  turnstileRequired: 'Please complete the verification checkbox.',
  selectDateRequired: 'Please select a date from the calendar.',
  selectRangeRequired: 'Please select a valid overnight date range.',
  submitFailed: 'Submission failed.',
  connectionError: 'Connection error.',
  submitSuccess: 'Your request has been received. We will contact you shortly.',
  summaryTitle: 'Request summary',
  summaryYacht: 'Yacht',
  summaryLocation: 'Location',
  summaryRentalType: 'Rental type',
  summaryDate: 'Date',
  summaryDuration: 'Duration',
  summaryDurationHours: '7 hours',
  summaryNights: (n) => `${n} night${n === 1 ? '' : 's'}`,
  summaryGuestCount: 'Number of guests',
  summaryDailyPrice: 'Daily price',
  summaryTotalPrice: 'Total price',
  rentalTypeDailyLabel: 'Daily rental',
  rentalTypeOvernightLabel: 'Overnight rental',
  labelFirstName: 'First name *',
  labelLastName: 'Last name *',
  labelEmail: 'Email *',
  labelPhone: 'Phone *',
  labelMessage: 'Message / special request *',
  sending: 'Sending...',
}

const DE: YachtUi = {
  locale: 'de',
  numberLocale: 'de-DE',
  dateLocale: 'de-DE',
  locationInfoAria: (loc) => `Standort: ${loc}`,
  highlightsHeading: 'Wichtige Informationen',
  specBuildYear: 'Baujahr',
  specCapacity: 'Kapazität',
  specCabins: 'Kabinen',
  specWc: 'WC / Bad',
  specLength: 'Länge',
  specCrew: 'Besatzung',
  specEngine: 'Motor',
  specDeparture: 'Abfahrt',
  personSuffix: 'Personen',
  descriptionHeading: 'Beschreibung',
  galleryHeading: 'Galerie',
  galleryAriaLabel: 'Galerie, inklusive und nicht inklusive Leistungen',
  galleryEnlargeAriaSuffix: 'vergrößern',
  galleryLightboxAria: 'Fotogalerie',
  galleryLoadingAria: 'Galerie wird geladen',
  breadcrumbYachtRental: 'Yachtcharter',
  locationHeadingSuffix: 'YACHTCHARTER',
  locationEmptyStateMessage: 'Für diesen Standort wurden noch keine Yachten hinzugefügt.',
  routeHeading: 'Routenvorschläge',
  amenitiesHeading: 'Ausstattung',
  policyCancelTitle: 'Storno- / Zahlungsbedingungen',
  policyCancelCheckPriceDefault: 'Preis prüfen',
  policyLicenceTitle: 'Erforderliches Dokument / Führerschein',
  policyPetsTitle: 'Haustiere',
  policyPaymentMethodsTitle: 'Vom Charterunternehmen akzeptierte Zahlungsmethoden',
  policyMarinaTitle: 'Über die Marina',
  relatedToursHeading: 'Empfohlene Touren',
  relatedYachtsHeading: 'Ähnliche Yachten',
  termsNotesHeading: 'Bedingungen und Hinweise',
  cardNoImage: 'Kein Bild',
  cardFeaturedBadge: 'Empfohlen',
  cardTypeLabel: 'Yachttyp:',
  cardLocationLabel: 'Standort:',
  cardCapacityLabel: 'Personenkapazität:',
  cardBuildYearLabel: 'Baujahr:',
  cardCabinsLabel: 'Kabinen:',
  cardLengthLabel: 'Länge:',
  cardViewButton: 'Ansehen',
  yachtTypeGulet: 'Gulet',
  yachtTypeMotoryacht: 'Motoryacht',
  yachtTypeSailing: 'Segelyacht',
  yachtTypeCatamaran: 'Katamaran',
  yachtTypeOther: 'Yacht',
  yachtsListedCount: (n) => `${n} Yachten aufgelistet`,
  sortButton: 'Sortieren',
  filtersButton: 'Filter',
  noResultsMessage: 'Keine Yacht entspricht Ihren Filtern. Setzen Sie die Filter zurück und versuchen Sie es erneut.',
  filtersCloseAria: 'Filter schließen',
  filtersTitle: 'Filter',
  filtersDailyPriceTitle: 'Tagespreis',
  filtersCapacityTitle: 'Personenkapazität',
  filtersCabinsTitle: 'Anzahl der Kabinen',
  filtersClearButton: 'Zurücksetzen',
  filtersApplyButton: 'Anwenden',
  filterAll: 'Alle',
  filterThisPrice: 'Dieser Preis',
  filterUpTo: (amount) => `Bis zu ${amount}`,
  filterPeopleRange: (label) => `${label} Personen`,
  filterCabinsRange: (label) => `${label} Kabinen`,
  sortCloseAria: 'Schließen',
  sortTitle: 'Sortierung',
  sortDefault: 'Empfohlen',
  sortPriceAsc: 'Preis: aufsteigend',
  sortPriceDesc: 'Preis: absteigend',
  sortCapacityAsc: 'Kapazität: aufsteigend',
  sortCapacityDesc: 'Kapazität: absteigend',
  sortCabinsAsc: 'Kabinen: aufsteigend',
  sortCabinsDesc: 'Kabinen: absteigend',
  rentalModeTabsAria: 'Mietart',
  rentalModeDaily: 'Täglich',
  rentalModeOvernight: 'Übernachtung',
  featuresAriaLabel: 'Merkmale',
  defaultInquiryTitle: 'VERFÜGBARKEIT PRÜFEN',
  defaultInquiryCta: 'VERFÜGBARKEIT ANFRAGEN',
  defaultTrustBullets: [
    'Planen Sie ab dem täglichen Startpreis',
    'Wählen Sie Ihr bevorzugtes Datum',
    'Unser Team meldet sich persönlich bei Ihnen',
  ],
  defaultNoteTitle: 'Hinweis',
  defaultNoteSubtitle:
    'In diesem Schritt wird keine Zahlung eingezogen; Ihre Anfrage wird weitergeleitet und wir kontaktieren Sie bezüglich der Verfügbarkeit.',
  selectFromCalendarFallback: 'Im Kalender auswählen',
  selectedDayLabel: 'Ausgewählter Tag',
  dailyLabel: 'Täglich',
  perDaySuffix: '/ Tag',
  overnightTotalLabel: 'Übernachtung gesamt',
  overnightLabel: 'Übernachtung',
  perNightSuffix: '/ Nacht',
  modesClosedWarning:
    'Für diese Yacht sind weder Tages- noch Übernachtungsanfragen verfügbar. Bitte aktivieren Sie mindestens einen Modus in der Inhaltsverwaltung.',
  inquiryModalTitle: 'Buchungsanfrage',
  modalCloseAria: 'Schließen',
  stepAria: (step, max) => `Schritt ${step} / ${max}`,
  step1Subtitle: 'Wählen Sie Datum und Anzahl der Gäste',
  step2Subtitle: 'Hinterlassen Sie Ihre Kontaktdaten',
  guestCountLabel: 'Anzahl der Gäste',
  decreaseAria: 'Verringern',
  increaseAria: 'Erhöhen',
  pickDayHint: 'Wählen Sie einen Tag im Kalender, um fortzufahren.',
  pickRangeHint: 'Wählen Sie An- und Abreisetag, um fortzufahren (mindestens 1 Nacht).',
  overnightPriceHint:
    'Für den Übernachtungspreis müssen alle Nächte im Kalender bepreist sein, oder es muss ein nächtlicher Referenzpreis angegeben werden.',
  continueButton: 'Weiter',
  backToDateGuests: 'Datum und Gäste',
  validationFirstNameRequired: 'Vorname erforderlich',
  validationLastNameRequired: 'Nachname erforderlich',
  validationEmailInvalid: 'Gültige E-Mail-Adresse eingeben',
  validationPhoneRequired: 'Telefonnummer erforderlich',
  validationMessageMin: 'Nachricht muss mindestens 5 Zeichen lang sein',
  turnstileRequired: 'Bitte bestätigen Sie das Kontrollkästchen.',
  selectDateRequired: 'Bitte wählen Sie ein Datum im Kalender.',
  selectRangeRequired: 'Bitte wählen Sie einen gültigen Übernachtungszeitraum.',
  submitFailed: 'Übermittlung fehlgeschlagen.',
  connectionError: 'Verbindungsfehler.',
  submitSuccess: 'Ihre Anfrage ist eingegangen. Wir melden uns in Kürze bei Ihnen.',
  summaryTitle: 'Zusammenfassung',
  summaryYacht: 'Yacht',
  summaryLocation: 'Standort',
  summaryRentalType: 'Mietart',
  summaryDate: 'Datum',
  summaryDuration: 'Dauer',
  summaryDurationHours: '7 Stunden',
  summaryNights: (n) => (n === 1 ? `${n} Nacht` : `${n} Nächte`),
  summaryGuestCount: 'Anzahl der Gäste',
  summaryDailyPrice: 'Tagespreis',
  summaryTotalPrice: 'Gesamtpreis',
  rentalTypeDailyLabel: 'Tagesmiete',
  rentalTypeOvernightLabel: 'Übernachtungsmiete',
  labelFirstName: 'Vorname *',
  labelLastName: 'Nachname *',
  labelEmail: 'E-Mail *',
  labelPhone: 'Telefon *',
  labelMessage: 'Nachricht / Sonderwunsch *',
  sending: 'Wird gesendet...',
}

const MAP: Record<SiteLocale, YachtUi> = { tr: TR, en: EN, de: DE }

export function getYachtUi(locale: SiteLocale): YachtUi {
  return MAP[locale] ?? TR
}
