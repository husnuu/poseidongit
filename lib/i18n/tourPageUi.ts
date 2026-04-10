import type { SiteLocale } from './config'
import { NUMBER_LOCALE } from './localizedLabels'

export type TourPageUi = {
  locale: SiteLocale
  numberLocale: string
  metaTourNotFoundTitle: string
  metaTitleSuffix: string
  metaDescriptionFallback: (tourTitle: string) => string
  breadcrumbHome: string
  breadcrumbTours: string
  galleryImageAlt: (tourTitle: string, index: number) => string
  videoNotSupported: string
  foodMenuFallbackTitle: string
  extrasSectionTitle: string
  pricePerPerson: string
  priceTotal: string
  itineraryTitle: string
  highlightsTitle: string
  tourDetailsTitle: string
  quickFactDuration: string
  quickFactAvailability: string
  quickFactDeparture: string
  quickFactLanguage: string
  quickFactGroupType: string
  quickFactCapacity: string
  quickFactCapacityValue: (n: number) => string
  includedTitle: string
  notIncludedTitle: string
  departureMetaLabel: string
  captainLabel: string
  captainAvatarAltFallback: string
  hostWhyFallbackTitle: string
  faqDefaultTitle: string
  faqMissingQuestion: string
  faqWhatsappCta: string
  reviewsSectionTitle: string
  reviewsMoreDefault: string
  ratingAriaLabel: (value: number, max: number) => string
  reviewsCountSuffix: string
  defaultRatingLabel: string
  whereHeadingFallback: string
  foodMenuDetailBtn: string
  foodMenuCloseAria: string
  foodMenuEmptyDetail: string
  foodMenuExcerptAria: string
  tourDescriptionHeading: string
  tourDescriptionShowMore: string
  tourDescriptionShowLess: string
  photoGridOpenGallery: string
  photoGridSeeAll: string
  photoGridSeeAllWithExtra: (extraCount: number) => string
  /** Mobil 2. görseldeki “tüm fotoğraflar” (+toplam adet). */
  photoGridMobileSeeAllWithCount: (totalCount: number) => string
  photoGridLightboxAria: string
  photoGridClose: string
  photoGridPrev: string
  photoGridNext: string
  tourCardViewTour: string
  tourCardPopularBadge: string
  tourCardPerPersonFrom: (priceFormatted: string) => string
  tourCardReviews: (n: number) => string
  tourCardRatingPoints: (rating: number) => string
  tourCardCoverAltFallback: string
  tourCardNoImage: string
  tourCardDeparturePrefix: string
  tourCardDurationPrefix: string
  tourCardGoogleReviewsTitle: string
}

const UI: Record<SiteLocale, TourPageUi> = {
  tr: {
    locale: 'tr',
    numberLocale: NUMBER_LOCALE.tr,
    metaTourNotFoundTitle: 'Tur bulunamadı',
    metaTitleSuffix: ' | Çeşme Tekne Turu',
    metaDescriptionFallback: (tourTitle) => `Çeşme tekne turu: ${tourTitle}. Rezervasyon yapın.`,
    breadcrumbHome: 'Ana Sayfa',
    breadcrumbTours: 'Turlar',
    galleryImageAlt: (tourTitle, i) => `${tourTitle} - Görsel ${i + 1}`,
    videoNotSupported: 'Tarayıcınız video etiketini desteklemiyor.',
    foodMenuFallbackTitle: 'Yemek menüsü',
    extrasSectionTitle: 'Ekstra Hizmetler',
    pricePerPerson: 'Kişi başı',
    priceTotal: 'Toplam',
    itineraryTitle: 'Neler yapacaksınız?',
    highlightsTitle: 'ÖNE ÇIKANLAR',
    tourDetailsTitle: 'TUR DETAYLARI',
    quickFactDuration: 'Süre',
    quickFactAvailability: 'Uygunluk',
    quickFactDeparture: 'Kalkış',
    quickFactLanguage: 'Dil',
    quickFactGroupType: 'Grup Tipi',
    quickFactCapacity: 'Kapasite',
    quickFactCapacityValue: (n) => `${n} kişi`,
    includedTitle: 'Dahil olanlar',
    notIncludedTitle: 'Dahil olmayanlar',
    departureMetaLabel: 'Kalkış:',
    captainLabel: 'Kaptan',
    captainAvatarAltFallback: 'Kaptan',
    hostWhyFallbackTitle: "WHY I THINK YOU'LL LOVE THIS TOUR",
    faqDefaultTitle: 'Sık Sorulan Sorular',
    faqMissingQuestion: 'Sorunuz yukarıda yok mu?',
    faqWhatsappCta: "WhatsApp'tan ulaşın",
    reviewsSectionTitle: 'Yorumlar',
    reviewsMoreDefault: 'Daha fazla yorumu okuyun',
    ratingAriaLabel: (v, max) => `Puan: ${v} / ${max}`,
    reviewsCountSuffix: 'yorum',
    defaultRatingLabel: 'EXCELLENT',
    whereHeadingFallback: 'Nerede',
    foodMenuDetailBtn: 'Detay',
    foodMenuCloseAria: 'Kapat',
    foodMenuEmptyDetail: 'Bu menü öğesi için detay metni eklenmemiş.',
    foodMenuExcerptAria: 'Menü satırları',
    tourDescriptionHeading: 'Tur Açıklaması',
    tourDescriptionShowMore: 'Daha fazla göster',
    tourDescriptionShowLess: 'Daha az göster',
    photoGridOpenGallery: 'Galeriyi aç',
    photoGridSeeAll: 'HEPSİNİ GÖR',
    photoGridSeeAllWithExtra: (extra) => `HEPSİNİ GÖR (+${extra})`,
    photoGridMobileSeeAllWithCount: (total) => `TÜM FOTOĞRAFLARI GÖR (+${total})`,
    photoGridLightboxAria: 'Fotoğraf galerisi',
    photoGridClose: 'Kapat',
    photoGridPrev: 'Önceki',
    photoGridNext: 'Sonraki',
    tourCardViewTour: 'Turu görüntüle',
    tourCardPopularBadge: 'En Popüler',
    tourCardPerPersonFrom: (p) => `Kişi başı ${p}’den`,
    tourCardReviews: (n) => `${n} değerlendirme`,
    tourCardRatingPoints: (r) => `${r} puan`,
    tourCardCoverAltFallback: 'Tur görseli',
    tourCardNoImage: 'Görsel yok',
    tourCardDeparturePrefix: 'Kalkış: ',
    tourCardDurationPrefix: 'Süre: ',
    tourCardGoogleReviewsTitle: 'Google yorumları',
  },
  en: {
    locale: 'en',
    numberLocale: NUMBER_LOCALE.en,
    metaTourNotFoundTitle: 'Tour not found',
    metaTitleSuffix: ' | Çeşme Boat Tours',
    metaDescriptionFallback: (tourTitle) => `Çeşme boat tour: ${tourTitle}. Book online.`,
    breadcrumbHome: 'Home',
    breadcrumbTours: 'Tours',
    galleryImageAlt: (tourTitle, i) => `${tourTitle} - Photo ${i + 1}`,
    videoNotSupported: 'Your browser does not support the video tag.',
    foodMenuFallbackTitle: 'Food menu',
    extrasSectionTitle: 'Optional extras',
    pricePerPerson: 'Per person',
    priceTotal: 'Total',
    itineraryTitle: 'What you will do',
    highlightsTitle: 'HIGHLIGHTS',
    tourDetailsTitle: 'TOUR DETAILS',
    quickFactDuration: 'Duration',
    quickFactAvailability: 'Availability',
    quickFactDeparture: 'Departure',
    quickFactLanguage: 'Language',
    quickFactGroupType: 'Group type',
    quickFactCapacity: 'Capacity',
    quickFactCapacityValue: (n) => (n === 1 ? '1 guest' : `${n} guests`),
    includedTitle: "What's included",
    notIncludedTitle: 'Not included',
    departureMetaLabel: 'Departure:',
    captainLabel: 'Captain',
    captainAvatarAltFallback: 'Captain',
    hostWhyFallbackTitle: "WHY I THINK YOU'LL LOVE THIS TOUR",
    faqDefaultTitle: 'Frequently asked questions',
    faqMissingQuestion: "Don't see your question?",
    faqWhatsappCta: 'Contact us on WhatsApp',
    reviewsSectionTitle: 'Reviews',
    reviewsMoreDefault: 'Read more reviews',
    ratingAriaLabel: (v, max) => `Rating: ${v} out of ${max}`,
    reviewsCountSuffix: 'reviews',
    defaultRatingLabel: 'EXCELLENT',
    whereHeadingFallback: 'Location',
    foodMenuDetailBtn: 'Details',
    foodMenuCloseAria: 'Close',
    foodMenuEmptyDetail: 'No details have been added for this menu item.',
    foodMenuExcerptAria: 'Menu lines',
    tourDescriptionHeading: 'About this tour',
    tourDescriptionShowMore: 'Show more',
    tourDescriptionShowLess: 'Show less',
    photoGridOpenGallery: 'Open gallery',
    photoGridSeeAll: 'SEE ALL',
    photoGridSeeAllWithExtra: (extra) => `SEE ALL (+${extra})`,
    photoGridMobileSeeAllWithCount: (total) => `SEE ALL PHOTOS (+${total})`,
    photoGridLightboxAria: 'Photo gallery',
    photoGridClose: 'Close',
    photoGridPrev: 'Previous',
    photoGridNext: 'Next',
    tourCardViewTour: 'View tour',
    tourCardPopularBadge: 'Most popular',
    tourCardPerPersonFrom: (p) => `From ${p} per person`,
    tourCardReviews: (n) => (n === 1 ? '1 review' : `${n} reviews`),
    tourCardRatingPoints: (r) => `${r} rating`,
    tourCardCoverAltFallback: 'Tour image',
    tourCardNoImage: 'No image',
    tourCardDeparturePrefix: 'Departure: ',
    tourCardDurationPrefix: 'Duration: ',
    tourCardGoogleReviewsTitle: 'Google reviews',
  },
  de: {
    locale: 'de',
    numberLocale: NUMBER_LOCALE.de,
    metaTourNotFoundTitle: 'Tour nicht gefunden',
    metaTitleSuffix: ' | Çeşme Bootstouren',
    metaDescriptionFallback: (tourTitle) => `Bootstour in Çeşme: ${tourTitle}. Jetzt buchen.`,
    breadcrumbHome: 'Startseite',
    breadcrumbTours: 'Touren',
    galleryImageAlt: (tourTitle, i) => `${tourTitle} - Bild ${i + 1}`,
    videoNotSupported: 'Ihr Browser unterstützt das Video-Tag nicht.',
    foodMenuFallbackTitle: 'Speisekarte',
    extrasSectionTitle: 'Zusatzleistungen',
    pricePerPerson: 'Pro Person',
    priceTotal: 'Gesamt',
    itineraryTitle: 'Das erwartet Sie',
    highlightsTitle: 'HIGHLIGHTS',
    tourDetailsTitle: 'TOURDETAILS',
    quickFactDuration: 'Dauer',
    quickFactAvailability: 'Verfügbarkeit',
    quickFactDeparture: 'Abfahrt',
    quickFactLanguage: 'Sprache',
    quickFactGroupType: 'Gruppentyp',
    quickFactCapacity: 'Kapazität',
    quickFactCapacityValue: (n) => (n === 1 ? '1 Person' : `${n} Personen`),
    includedTitle: 'Inklusive',
    notIncludedTitle: 'Nicht inbegriffen',
    departureMetaLabel: 'Abfahrt:',
    captainLabel: 'Kapitän',
    captainAvatarAltFallback: 'Kapitän',
    hostWhyFallbackTitle: 'WARUM SIE DIESE TOUR LIEBEN WERDEN',
    faqDefaultTitle: 'Häufige Fragen',
    faqMissingQuestion: 'Ihre Frage ist nicht dabei?',
    faqWhatsappCta: 'Schreiben Sie uns auf WhatsApp',
    reviewsSectionTitle: 'Bewertungen',
    reviewsMoreDefault: 'Weitere Bewertungen lesen',
    ratingAriaLabel: (v, max) => `Bewertung: ${v} von ${max}`,
    reviewsCountSuffix: 'Bewertungen',
    defaultRatingLabel: 'EXZELLENT',
    whereHeadingFallback: 'Ort',
    foodMenuDetailBtn: 'Details',
    foodMenuCloseAria: 'Schließen',
    foodMenuEmptyDetail: 'Für diesen Menüpunkt wurden keine Details hinterlegt.',
    foodMenuExcerptAria: 'Menüzeilen',
    tourDescriptionHeading: 'Über diese Tour',
    tourDescriptionShowMore: 'Mehr anzeigen',
    tourDescriptionShowLess: 'Weniger anzeigen',
    photoGridOpenGallery: 'Galerie öffnen',
    photoGridSeeAll: 'ALLE ANZEIGEN',
    photoGridSeeAllWithExtra: (extra) => `ALLE ANZEIGEN (+${extra})`,
    photoGridMobileSeeAllWithCount: (total) => `ALLE FOTOS (+${total})`,
    photoGridLightboxAria: 'Fotogalerie',
    photoGridClose: 'Schließen',
    photoGridPrev: 'Zurück',
    photoGridNext: 'Weiter',
    tourCardViewTour: 'Tour ansehen',
    tourCardPopularBadge: 'Am beliebtesten',
    tourCardPerPersonFrom: (p) => `Ab ${p} pro Person`,
    tourCardReviews: (n) => (n === 1 ? '1 Bewertung' : `${n} Bewertungen`),
    tourCardRatingPoints: (r) => `${r} Punkte`,
    tourCardCoverAltFallback: 'Tourbild',
    tourCardNoImage: 'Kein Bild',
    tourCardDeparturePrefix: 'Abfahrt: ',
    tourCardDurationPrefix: 'Dauer: ',
    tourCardGoogleReviewsTitle: 'Google-Bewertungen',
  },
}

export function getTourPageUi(locale: SiteLocale): TourPageUi {
  return UI[locale] ?? UI.tr
}
