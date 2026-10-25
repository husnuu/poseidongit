import type { SiteLocale } from '../config'

export type CovesPageUiStrings = {
  metaTitleFallback: string
  metaDescriptionFallback: string
  pageTitleFallback: string
  emptyList: string
  noImage: string
  detailHint: string
  defaultCoveTitle: string
  closeAria: string
  cardAriaLabel: (title: string) => string
  covesListedCount: (n: number) => string
  exploreLabel: string
  toursCta: string
  ctaTitle: string
  ctaLead: string
  breadcrumbHome: string
  allCoves: string
  aboutTitle: (title: string) => string
  highlightsTitle: string
  factLocation: string
  factTravel: string
  factBestTime: string
  activitiesTitle: string
  activityLabels: Record<string, string>
  galleryShowAll: (n: number) => string
  galleryPrev: string
  galleryNext: string
  mapTitle: string
  openInMaps: string
  faqTitle: string
  relatedToursTitle: string
  otherCovesTitle: string
  asideTitle: string
  asideBody: string
  contactCta: string
  notFoundTitle: string
  metaTitlePattern: (title: string) => string
}

const TR: CovesPageUiStrings = {
  metaTitleFallback: 'Koylar',
  metaDescriptionFallback: 'Keşfedeceğiniz koylar.',
  pageTitleFallback: 'Koylar',
  emptyList: 'Henüz koy eklenmemiş.',
  noImage: 'Görsel yok',
  detailHint: 'Devamını oku',
  defaultCoveTitle: 'Koy',
  closeAria: 'Kapat',
  cardAriaLabel: (title) => `${title} hakkında devamını oku`,
  covesListedCount: (n) => `${n} koy listeleniyor`,
  exploreLabel: 'Keşfet',
  toursCta: 'Turları Gör',
  ctaTitle: 'Bu koyları teknemizle keşfedin',
  ctaLead: "Turlarımız Çeşme'nin en güzel koylarında yüzme molaları veriyor; size uygun turu seçin.",
  breadcrumbHome: "Ana Sayfa",
  allCoves: "Tüm koylar",
  aboutTitle: (t) => `${t} hakkında`,
  highlightsTitle: "Öne çıkanlar",
  factLocation: "Konum",
  factTravel: "Limandan ulaşım",
  factBestTime: "En iyi zaman",
  activitiesTitle: "Yapılabilecekler",
  activityLabels: {"swim": "Yüzme", "snorkel": "Şnorkel", "dive": "Tüplü dalış", "photo": "Fotoğraf", "sunbathe": "Güneşlenme", "fish": "Balık gözlemi", "cliffjump": "Kayadan atlama", "hike": "Doğa yürüyüşü"},
  galleryShowAll: (n) => `Tüm fotoğraflar (${n})`,
  galleryPrev: "Önceki fotoğraf",
  galleryNext: "Sonraki fotoğraf",
  mapTitle: "Haritada konum",
  openInMaps: "Google Haritalar'da aç",
  faqTitle: "Sık sorulan sorular",
  relatedToursTitle: "Bu koya uğrayan turlar",
  otherCovesTitle: "Diğer koylar",
  asideTitle: "Bu koyu teknemizle görün",
  asideBody: "Size uygun turu seçin, Çeşme'nin koylarını denizden keşfedin.",
  contactCta: "Bize ulaşın",
  notFoundTitle: "Koy bulunamadı",
  metaTitlePattern: (t) => `${t} – Çeşme Koyları`,
}

const EN: CovesPageUiStrings = {
  metaTitleFallback: 'Bays & coves',
  metaDescriptionFallback: 'Coves and bays to explore.',
  pageTitleFallback: 'Bays & coves',
  emptyList: 'No coves have been added yet.',
  noImage: 'No image',
  detailHint: 'Read more',
  defaultCoveTitle: 'Cove',
  closeAria: 'Close',
  cardAriaLabel: (title) => `Read more about ${title}`,
  covesListedCount: (n) => `${n} coves listed`,
  exploreLabel: 'Explore',
  toursCta: 'See Tours',
  ctaTitle: 'Discover these coves on our boat',
  ctaLead: "Our tours stop for swims at Çeşme's most beautiful coves; pick the one that suits you.",
  breadcrumbHome: "Home",
  allCoves: "All coves",
  aboutTitle: (t) => `About ${t}`,
  highlightsTitle: "Highlights",
  factLocation: "Location",
  factTravel: "From the harbour",
  factBestTime: "Best time",
  activitiesTitle: "Things to do",
  activityLabels: {"swim": "Swimming", "snorkel": "Snorkelling", "dive": "Scuba diving", "photo": "Photography", "sunbathe": "Sunbathing", "fish": "Fish watching", "cliffjump": "Cliff jumping", "hike": "Nature walk"},
  galleryShowAll: (n) => `All photos (${n})`,
  galleryPrev: "Previous photo",
  galleryNext: "Next photo",
  mapTitle: "Location on the map",
  openInMaps: "Open in Google Maps",
  faqTitle: "Frequently asked questions",
  relatedToursTitle: "Tours that stop here",
  otherCovesTitle: "Other coves",
  asideTitle: "See this cove from our boat",
  asideBody: "Pick the tour that suits you and explore the coves of Çeşme from the sea.",
  contactCta: "Contact us",
  notFoundTitle: "Cove not found",
  metaTitlePattern: (t) => `${t} – Coves of Çeşme`,
}

const DE: CovesPageUiStrings = {
  metaTitleFallback: 'Buchten',
  metaDescriptionFallback: 'Buchten und Buchten zum Entdecken.',
  pageTitleFallback: 'Buchten',
  emptyList: 'Es wurden noch keine Buchten hinzugefügt.',
  noImage: 'Kein Bild',
  detailHint: 'Mehr lesen',
  defaultCoveTitle: 'Bucht',
  closeAria: 'Schließen',
  cardAriaLabel: (title) => `Mehr über ${title} lesen`,
  covesListedCount: (n) => `${n} Buchten aufgelistet`,
  exploreLabel: 'Entdecken',
  toursCta: 'Touren ansehen',
  ctaTitle: 'Entdecken Sie diese Buchten mit unserem Boot',
  ctaLead: 'Unsere Touren legen Badestopps in den schönsten Buchten von Çeşme ein – wählen Sie Ihre Tour.',
  breadcrumbHome: "Startseite",
  allCoves: "Alle Buchten",
  aboutTitle: (t) => `Über ${t}`,
  highlightsTitle: "Highlights",
  factLocation: "Lage",
  factTravel: "Vom Hafen",
  factBestTime: "Beste Zeit",
  activitiesTitle: "Aktivitäten",
  activityLabels: {"swim": "Schwimmen", "snorkel": "Schnorcheln", "dive": "Tauchen", "photo": "Fotografie", "sunbathe": "Sonnenbaden", "fish": "Fische beobachten", "cliffjump": "Klippenspringen", "hike": "Naturwanderung"},
  galleryShowAll: (n) => `Alle Fotos (${n})`,
  galleryPrev: "Vorheriges Foto",
  galleryNext: "Nächstes Foto",
  mapTitle: "Lage auf der Karte",
  openInMaps: "In Google Maps öffnen",
  faqTitle: "Häufig gestellte Fragen",
  relatedToursTitle: "Touren mit Stopp hier",
  otherCovesTitle: "Weitere Buchten",
  asideTitle: "Diese Bucht mit unserem Boot erleben",
  asideBody: "Wählen Sie die passende Tour und entdecken Sie die Buchten von Çeşme vom Meer aus.",
  contactCta: "Kontakt",
  notFoundTitle: "Bucht nicht gefunden",
  metaTitlePattern: (t) => `${t} – Buchten in Çeşme`,
}

const RU: CovesPageUiStrings = {
  metaTitleFallback: 'Бухты',
  metaDescriptionFallback: 'Бухты, которые стоит исследовать.',
  pageTitleFallback: 'Бухты',
  emptyList: 'Бухты пока не добавлены.',
  noImage: 'Нет фото',
  detailHint: 'Подробнее',
  defaultCoveTitle: 'Бухта',
  closeAria: 'Закрыть',
  cardAriaLabel: (title) => `Подробнее о ${title}`,
  covesListedCount: (n) => `${n} бухт в списке`,
  exploreLabel: 'Исследовать',
  toursCta: 'Смотреть туры',
  ctaTitle: 'Откройте эти бухты на нашей лодке',
  ctaLead: 'Наши туры делают остановки для купания в лучших бухтах Чешме — выберите подходящий.',
  breadcrumbHome: "Главная",
  allCoves: "Все бухты",
  aboutTitle: (t) => `О месте: ${t}`,
  highlightsTitle: "Главное",
  factLocation: "Расположение",
  factTravel: "От порта",
  factBestTime: "Лучшее время",
  activitiesTitle: "Чем заняться",
  activityLabels: {"swim": "Плавание", "snorkel": "Снорклинг", "dive": "Дайвинг", "photo": "Фотография", "sunbathe": "Загар", "fish": "Наблюдение за рыбами", "cliffjump": "Прыжки со скал", "hike": "Прогулка на природе"},
  galleryShowAll: (n) => `Все фото (${n})`,
  galleryPrev: "Предыдущее фото",
  galleryNext: "Следующее фото",
  mapTitle: "На карте",
  openInMaps: "Открыть в Google Maps",
  faqTitle: "Частые вопросы",
  relatedToursTitle: "Туры с остановкой здесь",
  otherCovesTitle: "Другие бухты",
  asideTitle: "Посетите эту бухту на нашей лодке",
  asideBody: "Выберите подходящий тур и откройте бухты Чешме с моря.",
  contactCta: "Связаться с нами",
  notFoundTitle: "Бухта не найдена",
  metaTitlePattern: (t) => `${t} — бухты Чешме`,
}

export function getCovesPageUiStrings(locale: SiteLocale): CovesPageUiStrings {
  if (locale === 'en') return EN
  if (locale === 'de') return DE
  if (locale === 'ru') return RU
  return TR
}
