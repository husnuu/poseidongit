import type { SiteLocale } from '../config'

export type AboutPageUiStrings = {
  metaTitleFallback: string
  metaDescriptionFallback: string
  loadError: string
  noImage: string
  defaultBoatImageAlt: string
  trustYearsLabel: string
  trustFleetLabel: string
  trustReviewsLabel: (count: string) => string
  heroCtaTours: string
  heroCtaContact: string
  /** Hikaye metninin üstündeki küçük eyebrow etiketi — metin "direkt" başlamasın diye. */
  introEyebrow: string
  /** Hero altındaki kompakt istatistik şeridi (kuruluş yılı / filo / tur / koy sayısı). */
  statFoundingYearLabel: string
  statFleetLabel: string
  statTourLabel: string
  statCoveLabel: string
  /** Uzun Sanity metinlerini varsayılan olarak kısaltan "Devamını oku" bloğu. */
  readMore: string
  readLess: string
  /** Gerçek, sitede zaten var olan güven unsurlarını (lisans/üyelik, iptal,
      hava garantisi, filo) kısa kartlar halinde özetleyen bölüm. */
  trustGridTitle: string
  trustGridLicensedTitle: string
  trustGridLicensedBody: string
  trustGridCancelTitle: string
  trustGridCancelBody: string
  trustGridWeatherTitle: string
  trustGridWeatherBody: string
  trustGridFleetTitle: string
  trustGridFleetBody: (fleetCount: string) => string
  /** Kapanış CTA bandı. */
  ctaTitle: string
  ctaButton: string
}

const TR: AboutPageUiStrings = {
  metaTitleFallback: 'Hakkımızda',
  metaDescriptionFallback: 'Hikayemiz ve teknelerimiz.',
  loadError: 'Hakkımızda içeriği yüklenemedi.',
  noImage: 'Görsel yok',
  defaultBoatImageAlt: 'Tekne',
  trustYearsLabel: 'Yıllık Deneyim',
  trustFleetLabel: 'Farklı Teknede Hizmet',
  trustReviewsLabel: (count) => `${count} Misafir Yorumu`,
  heroCtaTours: 'Turlarımızı Keşfet',
  heroCtaContact: 'Bize Ulaşın',
  introEyebrow: 'Hikayemiz',
  statFoundingYearLabel: 'Kuruluş Yılı',
  statFleetLabel: 'Tekne',
  statTourLabel: 'Aktif Tur',
  statCoveLabel: 'Koy',
  readMore: 'Devamını oku',
  readLess: 'Daha az göster',
  trustGridTitle: 'Bize güvenebilirsiniz, çünkü...',
  trustGridLicensedTitle: 'Lisanslı ve Üye',
  trustGridLicensedBody: 'TÜRSAB ve İMEAK Deniz Ticaret Odası üyesiyiz; HANTAL Turizm güvencesiyle hizmet veriyoruz.',
  trustGridCancelTitle: '24 Saat Ücretsiz İptal',
  trustGridCancelBody: 'Tur saatinden 24 saat öncesine kadar yapılan iptallerde ücretiniz iade edilir.',
  trustGridWeatherTitle: 'Hava Garantisi',
  trustGridWeatherBody: 'Hava koşulları nedeniyle tur yapılamazsa tam iade ya da ücretsiz tarih değişikliği sunuyoruz.',
  trustGridFleetTitle: 'Geniş Filo',
  trustGridFleetBody: (fleetCount) => `${fleetCount} tekneyle gruplara, ailelere ve çiftlere uygun seçenekler sunuyoruz.`,
  ctaTitle: 'Denize açılmaya hazır mısınız?',
  ctaButton: 'Turları Gör',
}

const EN: AboutPageUiStrings = {
  metaTitleFallback: 'About us',
  metaDescriptionFallback: 'Our story and boats.',
  loadError: 'About page could not be loaded.',
  noImage: 'No image',
  defaultBoatImageAlt: 'Boat',
  trustYearsLabel: 'Years of Experience',
  trustFleetLabel: 'Boats in Our Fleet',
  trustReviewsLabel: (count) => `${count} Guest Reviews`,
  heroCtaTours: 'Explore Our Tours',
  heroCtaContact: 'Contact Us',
  introEyebrow: 'Our Story',
  statFoundingYearLabel: 'Founded',
  statFleetLabel: 'Boats',
  statTourLabel: 'Active Tours',
  statCoveLabel: 'Coves',
  readMore: 'Read more',
  readLess: 'Show less',
  trustGridTitle: 'You can trust us, because...',
  trustGridLicensedTitle: 'Licensed & Certified',
  trustGridLicensedBody: 'We are members of TÜRSAB and the İMEAK Chamber of Shipping, operating under HANTAL Turizm.',
  trustGridCancelTitle: '24-Hour Free Cancellation',
  trustGridCancelBody: 'Cancellations made up to 24 hours before departure are fully refunded.',
  trustGridWeatherTitle: 'Weather Guarantee',
  trustGridWeatherBody: 'If weather prevents the tour, we offer a full refund or a free date change.',
  trustGridFleetTitle: 'A Large Fleet',
  trustGridFleetBody: (fleetCount) => `${fleetCount} boats, with options for groups, families and couples.`,
  ctaTitle: 'Ready to set sail?',
  ctaButton: 'See Tours',
}

const DE: AboutPageUiStrings = {
  metaTitleFallback: 'Über uns',
  metaDescriptionFallback: 'Unsere Geschichte und Boote.',
  loadError: 'Die Seite „Über uns“ konnte nicht geladen werden.',
  noImage: 'Kein Bild',
  defaultBoatImageAlt: 'Boot',
  trustYearsLabel: 'Jahre Erfahrung',
  trustFleetLabel: 'Boote in Unserer Flotte',
  trustReviewsLabel: (count) => `${count} Gästebewertungen`,
  heroCtaTours: 'Unsere Touren entdecken',
  heroCtaContact: 'Kontaktieren Sie uns',
  introEyebrow: 'Unsere Geschichte',
  statFoundingYearLabel: 'Gegründet',
  statFleetLabel: 'Boote',
  statTourLabel: 'Aktive Touren',
  statCoveLabel: 'Buchten',
  readMore: 'Mehr lesen',
  readLess: 'Weniger anzeigen',
  trustGridTitle: 'Sie können uns vertrauen, weil...',
  trustGridLicensedTitle: 'Lizenziert & Mitglied',
  trustGridLicensedBody: 'Wir sind Mitglied bei TÜRSAB und der İMEAK Handelskammer für Seefahrt und arbeiten unter der Marke HANTAL Turizm.',
  trustGridCancelTitle: '24 Stunden kostenlos stornieren',
  trustGridCancelBody: 'Bei Stornierungen bis 24 Stunden vor Abfahrt erstatten wir den vollen Betrag.',
  trustGridWeatherTitle: 'Wettergarantie',
  trustGridWeatherBody: 'Kann die Tour wetterbedingt nicht stattfinden, erhalten Sie eine volle Rückerstattung oder einen kostenlosen Termintausch.',
  trustGridFleetTitle: 'Große Flotte',
  trustGridFleetBody: (fleetCount) => `${fleetCount} Boote, passend für Gruppen, Familien und Paare.`,
  ctaTitle: 'Bereit, in See zu stechen?',
  ctaButton: 'Touren ansehen',
}

const RU: AboutPageUiStrings = {
  metaTitleFallback: 'О нас',
  metaDescriptionFallback: 'Наша история и катера.',
  loadError: 'Не удалось загрузить страницу «О нас».',
  noImage: 'Нет фото',
  defaultBoatImageAlt: 'Катер',
  trustYearsLabel: 'Лет опыта',
  trustFleetLabel: 'Катеров в нашем флоте',
  trustReviewsLabel: (count) => `${count} отзывов гостей`,
  heroCtaTours: 'Смотреть наши туры',
  heroCtaContact: 'Связаться с нами',
  introEyebrow: 'Наша история',
  statFoundingYearLabel: 'Год основания',
  statFleetLabel: 'Катеров',
  statTourLabel: 'Активных туров',
  statCoveLabel: 'Бухт',
  readMore: 'Читать далее',
  readLess: 'Свернуть',
  trustGridTitle: 'Нам можно доверять, потому что...',
  trustGridLicensedTitle: 'Лицензия и членство',
  trustGridLicensedBody: 'Мы являемся членами TÜRSAB и İMEAK (Палата судоходства), работаем под брендом HANTAL Turizm.',
  trustGridCancelTitle: 'Бесплатная отмена за 24 часа',
  trustGridCancelBody: 'При отмене не позднее чем за 24 часа до отправления сумма возвращается полностью.',
  trustGridWeatherTitle: 'Погодная гарантия',
  trustGridWeatherBody: 'Если тур не может состояться из-за погоды, мы предлагаем полный возврат средств или бесплатный перенос даты.',
  trustGridFleetTitle: 'Большой флот',
  trustGridFleetBody: (fleetCount) => `${fleetCount} катеров — варианты для групп, семей и пар.`,
  ctaTitle: 'Готовы выйти в море?',
  ctaButton: 'Смотреть туры',
}

export function getAboutPageUiStrings(locale: SiteLocale): AboutPageUiStrings {
  if (locale === 'en') return EN
  if (locale === 'de') return DE
  if (locale === 'ru') return RU
  return TR
}

/** Filo zaman çizgisinin ara başlığı. Sanity'deki aboutPage.timelineTitle
    ("GEÇMİŞTEN GÜNÜMÜZE TEKNELERİMİZ") artık görüntülenmiyor: başlığın kısa
    olması ve sayfa ana başlığı gibi değil, koyu bir ara başlık gibi durması
    istendi. timelineDescription CMS'ten gelmeye devam ediyor. */
export const ABOUT_TIMELINE_HEADING: Record<SiteLocale, string> = {
  tr: 'GEÇMİŞTEN GÜNÜMÜZE',
  en: 'FROM THEN TO NOW',
  de: 'VON DAMALS BIS HEUTE',
  ru: 'ОТ ПРОШЛОГО К НАСТОЯЩЕМУ',
}
