import type { SiteLocale } from './config'

/**
 * Tur sayfasındaki "Bilmeniz Gerekenler" bölümü (biniş, yanınıza alın, yiyecek
 * & içecek). Yalnızca aşağıdaki turlarda görünür; anahtar Sanity tur _id'si
 * (slug değişse de bağ kopmasın). Konum bilgisi yok: sayfada "Nerede" bölümü var.
 * Saat, yemek ve içecek bilgileri turun kendi Sanity içeriğiyle (dahil olanlar,
 * SSS, program) uyumlu tutulmalı.
 */

export type KnowBeforeIcon = 'clock' | 'backpack' | 'cup'

export type KnowBeforeItem = {
  icon: KnowBeforeIcon
  title: string
  text: string
}

type Localized<T> = Record<SiteLocale, T>

export const KNOW_BEFORE_HEADING: Localized<string> = {
  tr: 'Bilmeniz gerekenler',
  en: 'Good to know',
  de: 'Gut zu wissen',
  ru: 'Полезно знать',
}

const TITLES: Localized<{ boarding: string; transfer: string; bring: string; food: string }> = {
  tr: { boarding: 'Biniş', transfer: 'Servis ve Biniş', bring: 'Yanınıza Almanız Gerekenler', food: 'Yiyecek & İçecek' },
  en: { boarding: 'Boarding', transfer: 'Pick-up & Boarding', bring: 'What to Bring', food: 'Food & Drinks' },
  de: { boarding: 'Einstieg', transfer: 'Transfer & Einstieg', bring: 'Was Sie mitbringen sollten', food: 'Essen & Getränke' },
  ru: { boarding: 'Посадка', transfer: 'Трансфер и посадка', bring: 'Что взять с собой', food: 'Еда и напитки' },
}

const BOARDING: Localized<string> = {
  tr: 'Tekneye biniş, kalkış saatinden 30 dakika önce başlar. Yerinize rahatça yerleşebilmeniz için en geç kalkıştan 10 dakika önce teknede olmanızı rica ederiz.',
  en: 'Boarding opens 30 minutes before departure. Please be on board no later than 10 minutes before departure so you can settle in comfortably.',
  de: 'Der Einstieg beginnt 30 Minuten vor der Abfahrt. Bitte seien Sie spätestens 10 Minuten vor Abfahrt an Bord, damit Sie in Ruhe Platz nehmen können.',
  ru: 'Посадка начинается за 30 минут до отправления. Пожалуйста, будьте на борту не позднее чем за 10 минут до отправления, чтобы спокойно занять свои места.',
}

/** İzmir çıkışlı tur: misafir tekneye servisle gelir (program: alım 08:30–09:00). */
const TRANSFER: Localized<string> = {
  tr: "Servislerimiz sabah 08:30–09:00 arasında İzmir'deki alım noktalarından hareket eder; kesin alım saatiniz rezervasyon onayınızla birlikte iletilir. Lütfen alım noktasında birkaç dakika erken hazır olun.",
  en: 'Our shuttles leave the İzmir pick-up points between 08:30 and 09:00; your exact pick-up time is sent with your booking confirmation. Please be ready at your pick-up point a few minutes early.',
  de: 'Unsere Shuttles fahren zwischen 08:30 und 09:00 Uhr an den Abholpunkten in İzmir ab; Ihre genaue Abholzeit erhalten Sie mit der Buchungsbestätigung. Bitte seien Sie ein paar Minuten früher am Abholpunkt.',
  ru: 'Наши автобусы отправляются от точек сбора в Измире между 08:30 и 09:00; точное время вы получите вместе с подтверждением бронирования. Пожалуйста, будьте на месте сбора на несколько минут раньше.',
}

const BRING_DAY: Localized<string> = {
  tr: 'Mayo, havlu, güneş kremi, güneş gözlüğü ve şapka almayı unutmayın. Yüzme molaları arasında rahat edebilmeniz için hafif ve rahat kıyafetler tercih etmenizi öneririz.',
  en: "Don't forget your swimwear, towel, sunscreen, sunglasses and a hat. Light, comfortable clothes are best for moving around between swim stops.",
  de: 'Denken Sie an Badesachen, Handtuch, Sonnencreme, Sonnenbrille und Hut. Zwischen den Badestopps ist leichte, bequeme Kleidung am angenehmsten.',
  ru: 'Не забудьте купальные принадлежности, полотенце, солнцезащитный крем, солнечные очки и головной убор. Между остановками для купания удобнее всего в лёгкой и свободной одежде.',
}

const BRING_DIVE: Localized<string> = {
  tr: 'Mayo, havlu ve güneş kremi yeterli; dalış sonrası teknede sıcak duş kullanabilirsiniz. Sertifikalı dalıcıysanız dalış sertifikanızı yanınıza almayı unutmayın.',
  en: 'Swimwear, a towel and sunscreen are all you need; there is a hot shower on board for after your dive. Certified divers, please remember to bring your diving certificate.',
  de: 'Badesachen, Handtuch und Sonnencreme genügen; nach dem Tauchgang steht an Bord eine warme Dusche bereit. Zertifizierte Taucher bringen bitte ihr Tauchbrevet mit.',
  ru: 'Достаточно купальных принадлежностей, полотенца и солнцезащитного крема; после погружения на борту можно принять горячий душ. Сертифицированных дайверов просим взять с собой сертификат.',
}

const BRING_SUNSET: Localized<string> = {
  tr: 'Yüzme molası için mayonuzu ve havlunuzu getirin. Güneş battıktan sonra denizde hava serinleyebilir; yanınıza ince bir hırka veya rüzgârlık almanızı öneririz.',
  en: 'Bring your swimwear and a towel for the swim stop. It can get cool on the water after sunset, so a light cardigan or windbreaker is a good idea.',
  de: 'Bringen Sie Badesachen und Handtuch für den Badestopp mit. Nach Sonnenuntergang kann es auf dem Wasser kühl werden – eine leichte Jacke oder Windjacke ist empfehlenswert.',
  ru: 'Возьмите купальные принадлежности и полотенце для остановки на купание. После заката на воде может быть прохладно, поэтому рекомендуем лёгкую кофту или ветровку.',
}

const FOOD_LUNCH: Localized<string> = {
  tr: 'Öğle yemeği teknede servis edilir ve tur fiyatına dahildir; içecekler teknede ayrıca satın alınabilir. Bu nedenle dışarıdan yiyecek ve içecek getirmemenizi rica ederiz.',
  en: 'Lunch is served on board and included in the price; drinks can be purchased on board. We kindly ask that you do not bring outside food or drinks.',
  de: 'Das Mittagessen wird an Bord serviert und ist im Preis inbegriffen; Getränke können an Bord gekauft werden. Bitte bringen Sie keine eigenen Speisen und Getränke mit.',
  ru: 'Обед подаётся на борту и включён в стоимость; напитки можно купить на борту. Просим не приносить с собой еду и напитки.',
}

const FOOD_DIVE: Localized<string> = {
  tr: 'Ev yemeği konseptindeki öğle yemeği fiyata dahildir; sıcak ve soğuk içecekler teknede ücretli olarak sunulur. Dışarıdan yiyecek ve içecek getirmemenizi rica ederiz.',
  en: 'A home-style lunch is included; hot and cold drinks are available on board for an extra charge. We kindly ask that you do not bring outside food or drinks.',
  de: 'Ein hausgemachtes Mittagessen ist inbegriffen; warme und kalte Getränke gibt es an Bord gegen Aufpreis. Bitte bringen Sie keine eigenen Speisen und Getränke mit.',
  ru: 'Домашний обед включён в стоимость; горячие и холодные напитки предлагаются на борту за дополнительную плату. Просим не приносить с собой еду и напитки.',
}

const FOOD_DINNER: Localized<string> = {
  tr: 'Akşam yemeği tura dahildir; içecekler teknede ayrıca satın alınabilir. Dışarıdan yiyecek ve içecek getirmemenizi rica ederiz.',
  en: 'Dinner is included in the tour; drinks can be purchased on board. We kindly ask that you do not bring outside food or drinks.',
  de: 'Das Abendessen ist im Preis inbegriffen; Getränke können an Bord gekauft werden. Bitte bringen Sie keine eigenen Speisen und Getränke mit.',
  ru: 'Ужин включён в стоимость тура; напитки можно купить на борту. Просим не приносить с собой еду и напитки.',
}

type ItemSpec = { icon: KnowBeforeIcon; title: keyof (typeof TITLES)['tr']; text: Localized<string> }

const TOURS: Record<string, ItemSpec[]> = {
  // Çeşme Adalar & Koylar Turu (cesme-tekne-turu)
  '86942097-bbba-45d9-91b6-3397f870ddb1': [
    { icon: 'clock', title: 'boarding', text: BOARDING },
    { icon: 'backpack', title: 'bring', text: BRING_DAY },
    { icon: 'cup', title: 'food', text: FOOD_LUNCH },
  ],
  // İzmir Çıkışlı Tam Gün Çeşme Tekne Turu (izmir-cikisli-cesme-tekne-turu)
  'd430b103-80bd-460c-bc9c-0dad6cff54bb': [
    { icon: 'clock', title: 'transfer', text: TRANSFER },
    { icon: 'backpack', title: 'bring', text: BRING_DAY },
    { icon: 'cup', title: 'food', text: FOOD_LUNCH },
  ],
  // Çeşme Sualtı Macerası: Tüplü Dalış & Şnorkel (cesme-tuplu-dalis-turu)
  '79de8e59-7f26-4dfa-8b8e-0a96581921ee': [
    { icon: 'clock', title: 'boarding', text: BOARDING },
    { icon: 'backpack', title: 'bring', text: BRING_DIVE },
    { icon: 'cup', title: 'food', text: FOOD_DIVE },
  ],
  // Günbatımı Turu (guenbatimi-turu)
  'ffa28aab-cea5-4a08-a545-a7042c6c2147': [
    { icon: 'clock', title: 'boarding', text: BOARDING },
    { icon: 'backpack', title: 'bring', text: BRING_SUNSET },
    { icon: 'cup', title: 'food', text: FOOD_DINNER },
  ],
}

/** Turun "Bilmeniz Gerekenler" maddeleri; listede olmayan turda null. */
export function getTourKnowBefore(tourId: string | null | undefined, locale: SiteLocale): KnowBeforeItem[] | null {
  const id = tourId?.replace(/^drafts\./, '')
  const specs = id ? TOURS[id] : undefined
  if (!specs) return null
  return specs.map((s) => ({ icon: s.icon, title: TITLES[locale][s.title], text: s.text[locale] }))
}
