import type { SiteLocale } from '@/lib/i18n/config'
import type { FerryVessel } from '@/components/ferry/ferryTypes'
import type { IslandKey, IslandPhotoKey } from './islandGuides'

/**
 * Turyol feribot hatları: tekneler ve Euro fiyatları (kişi başı; araçlarda araç başı).
 * Kaynak: feribotlines.com/route-fees — yalnızca Turyol (ve Turyol Jalem) tekneleri.
 * Firma adı sitede gösterilmez (müşteri isteği); yalnızca tekne adı yazılır.
 * Fiyat değişince buradaki tutarları ve TURYOL_FARES_PERIOD'u güncelleyin.
 *
 * Sanity'de aynı slug'la bir "Feribot Hattı" belgesi varsa (örn. cesme-sakiz)
 * sayfa metinleri ve galeri Sanity'den gelir; fiyatlar, tekne seçimi ve "Ada
 * hakkında" bölümü buradan. Belgesi olmayan hatlar (`page` dolu) tamamen
 * buradaki metinlerle kurulur.
 */

/** Fiyatların referans alındığı sefer dönemi (sayfadaki fiyat notunda gösterilir). */
export const TURYOL_FARES_PERIOD = { from: '2026-11-25', to: '2026-12-25' } as const

type Localized<T> = Record<SiteLocale, T>

export type TuryolRouteTexts = {
  title: string
  cardDescription: string
  metaDescription: string
  durationLabel: string
  routeLabel: string
  departurePort: string
  arrivalPort: string
  bookingBullets: string[]
  about: string[]
  knowBefore: { title: string; body: string }[]
  included: string[]
  notIncluded: string[]
  faqs: { question: string; answer: string }[]
}

export type TuryolRoute = {
  slug: string
  /** Listeleme sırası (Sanity'deki hatlardan sonra). */
  order: number
  island: IslandKey
  vessels: FerryVessel[]
  page?: { images: IslandPhotoKey[]; texts: Localized<TuryolRouteTexts> }
}

const fare = (adult: number, child: number, infant: number) => ({ adult, child, infant })
const vehicle = (car: number, motorbike: number) => ({ car, motorbike })

const PASSPORT: Localized<{ title: string; body: string }> = {
  tr: { title: 'Pasaport', body: 'Yurt dışı seyahati için geçerli pasaportunuzun bulunması gerekir. Pasaport geçerlilik sürenizin en az 6 ay olduğundan emin olun.' },
  en: { title: 'Passport', body: 'You need a valid passport to travel abroad. Make sure it is valid for at least another 6 months.' },
  de: { title: 'Reisepass', body: 'Für die Auslandsreise benötigen Sie einen gültigen Reisepass, der noch mindestens 6 Monate gültig sein sollte.' },
  ru: { title: 'Паспорт', body: 'Для поездки за границу нужен действующий загранпаспорт. Убедитесь, что срок его действия составляет не менее 6 месяцев.' },
}

const visa = (island: Localized<string>): Localized<{ title: string; body: string }> => ({
  tr: { title: 'Vize', body: `Bordo pasaportla ${island.tr} için geçerli bir Schengen vizesi ya da sezonda uygulanan kapı vizesi gerekir. Kapı vizesi işlemleri önceden yapılmalıdır; lütfen bize danışınız. Yeşil pasaport sahipleri vizesiz seyahat edebilir.` },
  en: { title: 'Visa', body: `Turkish citizens with an ordinary passport need a valid Schengen visa for ${island.en}, or the island visa available during the season. The island visa must be arranged in advance — please contact us. Holders of a Turkish special (green) passport can travel visa-free.` },
  de: { title: 'Visum', body: `Türkische Staatsbürger mit regulärem Pass benötigen für ${island.de} ein gültiges Schengen-Visum oder in der Saison das Inselvisum. Das Inselvisum muss im Voraus beantragt werden – bitte sprechen Sie uns an. Inhaber eines grünen Sonderpasses reisen visumfrei.` },
  ru: { title: 'Виза', body: `Гражданам Турции с обычным паспортом для поездки на ${island.ru} нужна действующая шенгенская виза или сезонная виза острова. Визу острова нужно оформить заранее — пожалуйста, обратитесь к нам. Владельцы зелёного (специального) паспорта Турции могут въезжать без визы.` },
})

const VEHICLE_NOTE: Localized<{ title: string; body: string }> = {
  tr: { title: 'Araçla geçiş', body: 'Aracınızla geçecekseniz rezervasyonda araç tipini belirtin. Araç kontenjanı sınırlı olduğu için biletinizi erken almanızı öneririz.' },
  en: { title: 'Travelling with a vehicle', body: 'If you are taking your vehicle, add it when booking. Vehicle space is limited, so we recommend booking early.' },
  de: { title: 'Mit dem Fahrzeug', body: 'Wenn Sie mit Ihrem Fahrzeug reisen, geben Sie es bei der Buchung an. Die Plätze für Fahrzeuge sind begrenzt – buchen Sie daher früh.' },
  ru: { title: 'С автомобилем', body: 'Если вы едете на своём транспорте, укажите его при бронировании. Мест для автомобилей немного, поэтому лучше бронировать заранее.' },
}

const LESVOS: Localized<string> = { tr: 'Midilli', en: 'Lesvos', de: 'Lesbos', ru: 'Лесбос' }
const KOS: Localized<string> = { tr: 'Kos', en: 'Kos', de: 'Kos', ru: 'Кос' }

const notIncluded = (local: Localized<string>): Localized<string[]> => ({
  tr: ['Schengen vizesi / kapı vizesi işlemleri', 'Yurt dışı çıkış harcı', local.tr, 'Ada içi turlar ve aktiviteler', 'Kişisel harcamalar'],
  en: ['Schengen visa / island visa fees', 'Turkish departure tax', local.en, 'Island tours and activities', 'Personal expenses'],
  de: ['Schengen-Visum / Inselvisum', 'Türkische Ausreisegebühr', local.de, 'Inselausflüge und Aktivitäten', 'Persönliche Ausgaben'],
  ru: ['Шенгенская виза / виза острова', 'Выездной сбор Турции', local.ru, 'Экскурсии и развлечения на острове', 'Личные расходы'],
})

const LESVOS_NOT_INCLUDED = notIncluded({
  tr: 'Midilli’deki transfer ve ulaşım',
  en: 'Transfers and transport on Lesvos',
  de: 'Transfers und Verkehrsmittel auf Lesbos',
  ru: 'Трансферы и транспорт на Лесбосе',
})

const KOS_NOT_INCLUDED = notIncluded({
  tr: 'Kos’taki transfer ve ulaşım',
  en: 'Transfers and transport on Kos',
  de: 'Transfers und Verkehrsmittel auf Kos',
  ru: 'Трансферы и транспорт на Косе',
})

const ONE_WAY_OR_RETURN: Localized<string> = {
  tr: 'Seçilen bilete göre tek yön veya gidiş-dönüş yolculuk',
  en: 'One-way or return journey, depending on the ticket chosen',
  de: 'Einfache Fahrt oder Hin- und Rückfahrt je nach gewähltem Ticket',
  ru: 'Поездка в одну сторону или туда и обратно — в зависимости от билета',
}

export const TURYOL_ROUTES: TuryolRoute[] = [
  {
    slug: 'cesme-sakiz',
    order: 1,
    island: 'sakiz',
    vessels: [
      {
        id: 'imbros',
        name: 'Imbros',
        kind: 'catamaran',
        fares: { oneWay: fare(40, 30, 15), roundTrip: fare(50, 35, 25), sameDay: fare(50, 35, 25) },
      },
      {
        id: 'chios',
        name: 'Chios',
        kind: 'carFerry',
        fares: { oneWay: fare(40, 30, 20), roundTrip: fare(50, 35, 25), sameDay: fare(50, 35, 25) },
        vehicleFares: { oneWay: vehicle(100, 50), roundTrip: vehicle(150, 80), sameDay: vehicle(150, 80) },
      },
    ],
  },
  {
    slug: 'ayvalik-midilli',
    order: 2,
    island: 'midilli',
    vessels: [
      {
        id: 'fokaia',
        name: 'Fokaia',
        kind: 'carFerry',
        fares: { oneWay: fare(30, 20, 10), roundTrip: fare(40, 25, 10), sameDay: fare(40, 25, 10) },
        vehicleFares: { oneWay: vehicle(75, 40), roundTrip: vehicle(110, 60), sameDay: vehicle(110, 60) },
      },
      {
        id: 'kalimnos',
        name: 'Kalimnos',
        kind: 'catamaran',
        fares: { oneWay: fare(35, 22, 10), roundTrip: fare(45, 27.5, 10), sameDay: fare(45, 27.5, 10) },
      },
    ],
    page: {
      images: ['midilli/molivos', 'midilli/midilli-limani', 'midilli/plomari', 'midilli/petra', 'midilli/petra-plaji'],
      texts: {
        tr: {
          title: 'Ayvalık ↔ Midilli Feribot Bileti',
          cardDescription: 'Fokaia ve Kalimnos tekneleriyle Ayvalık’tan Midilli’ye; araçla geçiş de mümkün.',
          metaDescription: 'Ayvalık – Midilli (Lesvos) feribot bileti: Fokaia araçlı feribot ve Kalimnos katamaran Euro fiyatları, yolculuk süresi ve Midilli gezi rehberi.',
          durationLabel: '45 dk – 1,5 saat (tekneye göre)',
          routeLabel: 'Ayvalık Limanı ↔ Midilli (Mytilene) Limanı',
          departurePort: 'Ayvalık',
          arrivalPort: 'Midilli',
          bookingBullets: ['Feribot bileti, Ayvalık ↔ Midilli', 'Fokaia (araçlı feribot) veya Kalimnos (katamaran)'],
          about: [
            'Ayvalık ile Midilli arasında iki farklı tekneyle sefer yapılıyor: Hızlı bir yolculuk için Kalimnos katamaranı, aracıyla geçmek isteyenler için Fokaia araçlı feribotu. Tekne tipine göre yolculuk 45 dakika ile 1,5 saat arasında sürüyor.',
            'Feribot adanın başkenti Mytilene’nin merkezindeki limana yanaşıyor; kale, çarşı ve sahil iner inmez yürüme mesafesinde. Midilli’yi kendi aracınızla gezmek isterseniz Fokaia ile otomobil ya da motosikletinizi de adaya taşıyabilirsiniz.',
          ],
          knowBefore: [PASSPORT.tr, visa(LESVOS).tr, VEHICLE_NOTE.tr],
          included: ['Ayvalık ↔ Midilli (Mytilene) feribot bileti', ONE_WAY_OR_RETURN.tr],
          notIncluded: LESVOS_NOT_INCLUDED.tr,
          faqs: [
            { question: 'Ayvalık–Midilli feribotu ne kadar sürer?', answer: 'Tekne tipine göre 45 dakika ile 1,5 saat arasında sürer; Kalimnos katamaranı daha hızlıdır. Süre hava ve deniz koşullarına göre değişebilir.' },
            { question: 'Midilli’ye aracımla geçebilir miyim?', answer: 'Evet, araç taşıyan Fokaia feribotuyla. Otomobil ve motosiklet fiyatlarını sayfadaki fiyat tablosunda görebilirsiniz; araç kontenjanı sınırlıdır.' },
            { question: 'Feribot Midilli’de nereye yanaşıyor?', answer: 'Adanın başkenti Mytilene’nin merkezindeki limana. Kale, çarşı ve sahil limandan yürüme mesafesindedir.' },
          ],
        },
        en: {
          title: 'Ayvalık ↔ Lesvos Ferry Ticket',
          cardDescription: 'From Ayvalık to Lesvos on the Fokaia or the Kalimnos — you can take your car too.',
          metaDescription: 'Ayvalık – Lesvos (Mytilene) ferry tickets: fares in euros for the Fokaia car ferry and the Kalimnos catamaran, crossing time and a Lesvos travel guide.',
          durationLabel: '45 min – 1.5 hours (depending on vessel)',
          routeLabel: 'Ayvalık Port ↔ Mytilene Port (Lesvos)',
          departurePort: 'Ayvalık',
          arrivalPort: 'Lesvos (Mytilene)',
          bookingBullets: ['Ferry ticket, Ayvalık ↔ Lesvos', 'Fokaia (car ferry) or Kalimnos (catamaran)'],
          about: [
            'Two different vessels sail between Ayvalık and Lesvos: the Kalimnos catamaran for a quick crossing and the Fokaia car ferry for those travelling with a vehicle. Depending on the vessel, the crossing takes between 45 minutes and 1.5 hours.',
            'The ferry docks in the centre of Mytilene, the island’s capital, so the castle, the market and the seafront are within walking distance. To explore Lesvos in your own vehicle, you can take your car or motorbike on the Fokaia.',
          ],
          knowBefore: [PASSPORT.en, visa(LESVOS).en, VEHICLE_NOTE.en],
          included: ['Ayvalık ↔ Lesvos (Mytilene) ferry ticket', ONE_WAY_OR_RETURN.en],
          notIncluded: LESVOS_NOT_INCLUDED.en,
          faqs: [
            { question: 'How long is the Ayvalık–Lesvos ferry?', answer: 'Between 45 minutes and 1.5 hours depending on the vessel; the Kalimnos catamaran is the faster one. Times can vary with weather and sea conditions.' },
            { question: 'Can I take my car to Lesvos?', answer: 'Yes, on the Fokaia car ferry. Car and motorbike fares are shown in the fare table on this page; vehicle space is limited.' },
            { question: 'Where does the ferry arrive on Lesvos?', answer: 'At the harbour in the centre of Mytilene, the island’s capital. The castle, market and seafront are within walking distance.' },
          ],
        },
        de: {
          title: 'Ayvalık ↔ Lesbos Fährticket',
          cardDescription: 'Mit der Fokaia oder der Kalimnos von Ayvalık nach Lesbos – auch mit dem eigenen Auto.',
          metaDescription: 'Ayvalık – Lesbos (Mytilini) Fährtickets: Preise in Euro für die Autofähre Fokaia und den Katamaran Kalimnos, Fahrtdauer und Reiseinfos zu Lesbos.',
          durationLabel: '45 Min. – 1,5 Std. (je nach Schiff)',
          routeLabel: 'Hafen Ayvalık ↔ Hafen Mytilini (Lesbos)',
          departurePort: 'Ayvalık',
          arrivalPort: 'Lesbos (Mytilini)',
          bookingBullets: ['Fährticket, Ayvalık ↔ Lesbos', 'Fokaia (Autofähre) oder Kalimnos (Katamaran)'],
          about: [
            'Zwischen Ayvalık und Lesbos verkehren zwei Schiffe: den Katamaran Kalimnos für eine schnelle Überfahrt und die Autofähre Fokaia für Reisende mit Fahrzeug. Je nach Schiff dauert die Überfahrt 45 Minuten bis 1,5 Stunden.',
            'Die Fähre legt im Zentrum von Mytilini an, der Inselhauptstadt – Burg, Markt und Promenade sind zu Fuß erreichbar. Wer Lesbos mit dem eigenen Fahrzeug erkunden möchte, nimmt Auto oder Motorrad mit der Fokaia mit.',
          ],
          knowBefore: [PASSPORT.de, visa(LESVOS).de, VEHICLE_NOTE.de],
          included: ['Fährticket Ayvalık ↔ Lesbos (Mytilini)', ONE_WAY_OR_RETURN.de],
          notIncluded: LESVOS_NOT_INCLUDED.de,
          faqs: [
            { question: 'Wie lange dauert die Fähre Ayvalık–Lesbos?', answer: 'Je nach Schiff 45 Minuten bis 1,5 Stunden; der Katamaran Kalimnos ist schneller. Wetter und Seegang können die Fahrzeit verändern.' },
            { question: 'Kann ich mein Auto nach Lesbos mitnehmen?', answer: 'Ja, mit der Autofähre Fokaia. Die Preise für Pkw und Motorrad finden Sie in der Preistabelle auf dieser Seite; die Plätze sind begrenzt.' },
            { question: 'Wo legt die Fähre auf Lesbos an?', answer: 'Im Hafen im Zentrum von Mytilini, der Inselhauptstadt. Burg, Markt und Promenade sind zu Fuß erreichbar.' },
          ],
        },
        ru: {
          title: 'Билет на паром Айвалык ↔ Лесбос',
          cardDescription: 'Из Айвалыка на Лесбос на судах «Фокея» и «Калимнос» — можно и с автомобилем.',
          metaDescription: 'Билеты на паром Айвалык – Лесбос (Митилини): цены в евро на автомобильный паром «Фокея» и катамаран «Калимнос», время в пути и путеводитель по Лесбосу.',
          durationLabel: '45 мин – 1,5 ч (в зависимости от судна)',
          routeLabel: 'Порт Айвалык ↔ порт Митилини (Лесбос)',
          departurePort: 'Айвалык',
          arrivalPort: 'Лесбос (Митилини)',
          bookingBullets: ['Билет на паром Айвалык ↔ Лесбос', '«Фокея» (автомобильный паром) или «Калимнос» (катамаран)'],
          about: [
            'Между Айвалыком и Лесбосом ходят два судна: катамаран «Калимнос» для быстрой переправы и автомобильный паром «Фокея» для тех, кто едет со своим транспортом. В зависимости от судна дорога занимает от 45 минут до 1,5 часа.',
            'Паром прибывает в центр Митилини, столицы острова, — крепость, рынок и набережная в пешей доступности. Чтобы путешествовать по Лесбосу на своём транспорте, можно взять с собой автомобиль или мотоцикл на «Фокее».',
          ],
          knowBefore: [PASSPORT.ru, visa(LESVOS).ru, VEHICLE_NOTE.ru],
          included: ['Билет на паром Айвалык ↔ Лесбос (Митилини)', ONE_WAY_OR_RETURN.ru],
          notIncluded: LESVOS_NOT_INCLUDED.ru,
          faqs: [
            { question: 'Сколько идёт паром Айвалык–Лесбос?', answer: 'От 45 минут до 1,5 часа в зависимости от судна; катамаран «Калимнос» быстрее. Время в пути зависит от погоды и состояния моря.' },
            { question: 'Можно ли взять автомобиль на Лесбос?', answer: 'Да, на автомобильном пароме «Фокея». Цены для автомобиля и мотоцикла указаны в таблице на этой странице; мест немного.' },
            { question: 'Куда прибывает паром на Лесбосе?', answer: 'В гавань в центре Митилини, столицы острова. Крепость, рынок и набережная — в пешей доступности.' },
          ],
        },
      },
    },
  },
  {
    slug: 'aliaga-midilli',
    order: 3,
    island: 'midilli',
    vessels: [
      {
        id: 'emine-jale',
        name: 'Emine Jale',
        kind: null,
        fares: { oneWay: fare(25, 25, 11), roundTrip: fare(45, 45, 11), sameDay: fare(45, 45, 11) },
      },
    ],
    page: {
      images: ['midilli/midilli-limani', 'midilli/molivos', 'midilli/petra', 'midilli/plomari', 'midilli/petra-plaji'],
      texts: {
        tr: {
          title: 'Aliağa ↔ Midilli Feribot Bileti',
          cardDescription: 'Emine Jale teknesiyle İzmir Aliağa’dan Midilli’ye; aynı gün dönüş seçeneğiyle.',
          metaDescription: 'Aliağa – Midilli (Lesvos) feribot bileti: Emine Jale Euro fiyatları, yolculuk süresi, aynı gün dönüş seçeneği ve Midilli gezi rehberi.',
          durationLabel: 'Yaklaşık 1 saat 50 dakika',
          routeLabel: 'Aliağa Limanı ↔ Midilli (Mytilene) Limanı',
          departurePort: 'Aliağa',
          arrivalPort: 'Midilli',
          bookingBullets: ['Feribot bileti, Aliağa ↔ Midilli', 'Tekne: Emine Jale'],
          about: [
            'İzmir’in kuzeyindeki Aliağa’dan kalkan bu hatta Emine Jale teknesiyle sefer yapılıyor. Yolculuk yaklaşık 1 saat 50 dakika sürüyor; İzmir ve çevresinden gelenler için Ayvalık’a gitmeden Midilli’ye geçmenin pratik bir yolu.',
            'Tekne adanın başkenti Mytilene’nin merkezindeki limana yanaşıyor. Aynı gün gidiş-dönüş biletiyle günübirlik gezi de yapabilirsiniz. Bu hatta araç taşınmıyor; aracınızla geçmek isterseniz Ayvalık – Midilli hattındaki Fokaia feribotunu tercih edebilirsiniz.',
          ],
          knowBefore: [PASSPORT.tr, visa(LESVOS).tr],
          included: ['Aliağa ↔ Midilli (Mytilene) feribot bileti', ONE_WAY_OR_RETURN.tr],
          notIncluded: LESVOS_NOT_INCLUDED.tr,
          faqs: [
            { question: 'Aliağa–Midilli feribotu ne kadar sürer?', answer: 'Yolculuk yaklaşık 1 saat 50 dakika sürer; hava ve deniz koşullarına göre değişebilir.' },
            { question: 'Bu hatta aracımı götürebilir miyim?', answer: 'Hayır, Aliağa–Midilli hattında yalnızca yolcu taşınıyor. Aracınızla geçmek için Ayvalık–Midilli hattındaki Fokaia feribotuna bakabilirsiniz.' },
            { question: 'Midilli’ye günübirlik gidebilir miyim?', answer: 'Evet, aynı gün gidiş-dönüş bileti alabilirsiniz. Günübirlik gezide Mytilene merkezine ve yakın çevresine odaklanmanızı öneririz.' },
          ],
        },
        en: {
          title: 'Aliağa ↔ Lesvos Ferry Ticket',
          cardDescription: 'From Aliağa (İzmir) to Lesvos on the Emine Jale, with a same-day return option.',
          metaDescription: 'Aliağa – Lesvos (Mytilene) ferry tickets: Emine Jale fares in euros, crossing time, same-day return option and a Lesvos travel guide.',
          durationLabel: 'About 1 hour 50 minutes',
          routeLabel: 'Aliağa Port ↔ Mytilene Port (Lesvos)',
          departurePort: 'Aliağa',
          arrivalPort: 'Lesvos (Mytilene)',
          bookingBullets: ['Ferry ticket, Aliağa ↔ Lesvos', 'Vessel: Emine Jale'],
          about: [
            'The Emine Jale sails from Aliağa, north of İzmir, to Lesvos. The crossing takes about 1 hour 50 minutes — a convenient way to reach Lesvos from the İzmir area without driving to Ayvalık.',
            'The boat docks in the centre of Mytilene, the island’s capital. With a same-day return ticket you can also make it a day trip. Vehicles are not carried on this route; to bring your car, choose the Fokaia ferry on the Ayvalık – Lesvos route.',
          ],
          knowBefore: [PASSPORT.en, visa(LESVOS).en],
          included: ['Aliağa ↔ Lesvos (Mytilene) ferry ticket', ONE_WAY_OR_RETURN.en],
          notIncluded: LESVOS_NOT_INCLUDED.en,
          faqs: [
            { question: 'How long is the Aliağa–Lesvos ferry?', answer: 'About 1 hour 50 minutes; times can vary with weather and sea conditions.' },
            { question: 'Can I take my car on this route?', answer: 'No, the Aliağa–Lesvos route is for foot passengers only. To bring a vehicle, see the Fokaia ferry on the Ayvalık–Lesvos route.' },
            { question: 'Can I visit Lesvos as a day trip?', answer: 'Yes, you can buy a same-day return ticket. On a day trip we recommend focusing on Mytilene town and its surroundings.' },
          ],
        },
        de: {
          title: 'Aliağa ↔ Lesbos Fährticket',
          cardDescription: 'Mit der Emine Jale von Aliağa (İzmir) nach Lesbos – auch als Tagesausflug.',
          metaDescription: 'Aliağa – Lesbos (Mytilini) Fährtickets: Preise in Euro für die Emine Jale, Fahrtdauer, Rückfahrt am selben Tag und Reiseinfos zu Lesbos.',
          durationLabel: 'Ca. 1 Std. 50 Min.',
          routeLabel: 'Hafen Aliağa ↔ Hafen Mytilini (Lesbos)',
          departurePort: 'Aliağa',
          arrivalPort: 'Lesbos (Mytilini)',
          bookingBullets: ['Fährticket, Aliağa ↔ Lesbos', 'Schiff: Emine Jale'],
          about: [
            'Von Aliağa nördlich von İzmir fährt die Emine Jale nach Lesbos. Die Überfahrt dauert etwa 1 Stunde 50 Minuten – praktisch für alle aus der Region İzmir, die nicht erst nach Ayvalık fahren möchten.',
            'Das Schiff legt im Zentrum von Mytilini an, der Inselhauptstadt. Mit einem Ticket für Hin- und Rückfahrt am selben Tag ist auch ein Tagesausflug möglich. Fahrzeuge werden auf dieser Strecke nicht befördert – mit dem Auto nehmen Sie die Fokaia auf der Strecke Ayvalık – Lesbos.',
          ],
          knowBefore: [PASSPORT.de, visa(LESVOS).de],
          included: ['Fährticket Aliağa ↔ Lesbos (Mytilini)', ONE_WAY_OR_RETURN.de],
          notIncluded: LESVOS_NOT_INCLUDED.de,
          faqs: [
            { question: 'Wie lange dauert die Fähre Aliağa–Lesbos?', answer: 'Etwa 1 Stunde 50 Minuten; Wetter und Seegang können die Fahrzeit verändern.' },
            { question: 'Kann ich auf dieser Strecke mein Auto mitnehmen?', answer: 'Nein, auf der Strecke Aliağa–Lesbos werden nur Passagiere befördert. Mit Fahrzeug nutzen Sie die Fähre Fokaia auf der Strecke Ayvalık–Lesbos.' },
            { question: 'Ist ein Tagesausflug nach Lesbos möglich?', answer: 'Ja, mit einem Ticket für Hin- und Rückfahrt am selben Tag. Für einen Tagesausflug empfehlen wir, sich auf Mytilini und Umgebung zu konzentrieren.' },
          ],
        },
        ru: {
          title: 'Билет на паром Алиага ↔ Лесбос',
          cardDescription: 'Из Алиаги (Измир) на Лесбос на судне «Эмине Джале» — можно вернуться в тот же день.',
          metaDescription: 'Билеты на паром Алиага – Лесбос (Митилини): цены в евро на «Эмине Джале», время в пути, возвращение в тот же день и путеводитель по Лесбосу.',
          durationLabel: 'Около 1 ч 50 мин',
          routeLabel: 'Порт Алиага ↔ порт Митилини (Лесбос)',
          departurePort: 'Алиага',
          arrivalPort: 'Лесбос (Митилини)',
          bookingBullets: ['Билет на паром Алиага ↔ Лесбос', 'Судно: «Эмине Джале»'],
          about: [
            'Из Алиаги, к северу от Измира, на Лесбос ходит судно «Эмине Джале». Дорога занимает около 1 часа 50 минут — удобный способ добраться до Лесбоса из Измира и окрестностей, не заезжая в Айвалык.',
            'Судно прибывает в центр Митилини, столицы острова. С билетом туда и обратно в тот же день можно съездить на остров на один день. Автомобили на этой линии не перевозятся — для поездки на машине выбирайте паром «Фокея» на линии Айвалык – Лесбос.',
          ],
          knowBefore: [PASSPORT.ru, visa(LESVOS).ru],
          included: ['Билет на паром Алиага ↔ Лесбос (Митилини)', ONE_WAY_OR_RETURN.ru],
          notIncluded: LESVOS_NOT_INCLUDED.ru,
          faqs: [
            { question: 'Сколько идёт паром Алиага–Лесбос?', answer: 'Около 1 часа 50 минут; время в пути зависит от погоды и состояния моря.' },
            { question: 'Можно ли взять автомобиль на этой линии?', answer: 'Нет, на линии Алиага–Лесбос перевозят только пассажиров. Для поездки с автомобилем есть паром «Фокея» на линии Айвалык–Лесбос.' },
            { question: 'Можно ли съездить на Лесбос на один день?', answer: 'Да, можно купить билет туда и обратно в тот же день. В однодневной поездке лучше сосредоточиться на Митилини и окрестностях.' },
          ],
        },
      },
    },
  },
  {
    slug: 'bodrum-kos',
    order: 4,
    island: 'kos',
    vessels: [
      {
        id: 'k-sevket-iyidere',
        name: 'K. Şevket İyidere',
        kind: null,
        // Bu hatta araç taşınmıyor (yalnızca yolcu).
        fares: { oneWay: fare(25, 20, 15), roundTrip: fare(35, 25, 15), sameDay: fare(35, 25, 15) },
      },
    ],
    page: {
      images: ['kos/kos-kalesi-liman', 'kos/kos-limani', 'kos/asklepion-manzara', 'kos/kastri-adasi', 'kos/tigaki-plaji'],
      texts: {
        tr: {
          title: 'Bodrum ↔ Kos Feribot Bileti',
          cardDescription: 'K. Şevket İyidere teknesiyle Bodrum’dan Kos’a; tek yön, gidiş-dönüş ve aynı gün dönüş seçenekleriyle.',
          metaDescription: 'Bodrum – Kos (İstanköy) feribot bileti: K. Şevket İyidere Euro fiyatları, tek yön ve gidiş-dönüş seçenekleri, yolculuk süresi ve Kos gezi rehberi.',
          durationLabel: '30 dakikadan başlayan yolculuk',
          routeLabel: 'Bodrum Kruvaziyer Limanı ↔ Kos Limanı',
          departurePort: 'Bodrum',
          arrivalPort: 'Kos',
          bookingBullets: ['Feribot bileti, Bodrum ↔ Kos', 'Tekne: K. Şevket İyidere'],
          about: [
            'Bodrum ile Kos arasında K. Şevket İyidere teknesiyle sefer yapılıyor. Tek yön, gidiş-dönüş ve aynı gün dönüş biletleri mevcut; bu hatta araç taşınmıyor, yalnızca yolcu kabul ediliyor.',
            'Feribot Kos şehir merkezindeki limana yanaşıyor; Neratzia Kalesi, antik agora ve Hipokrat Ağacı limandan birkaç dakikalık yürüme mesafesinde.',
          ],
          knowBefore: [PASSPORT.tr, visa(KOS).tr],
          included: ['Bodrum ↔ Kos feribot bileti', ONE_WAY_OR_RETURN.tr],
          notIncluded: KOS_NOT_INCLUDED.tr,
          faqs: [
            { question: 'Bodrum–Kos feribotu ne kadar sürer?', answer: 'Bodrum ile Kos arası deniz yolculuğu 30 dakikadan başlar; süre tekneye, hava ve deniz koşullarına göre değişebilir.' },
            { question: 'Kos’a aracımla geçebilir miyim?', answer: 'Hayır, Bodrum–Kos hattında araç taşınmıyor; yalnızca yolcu seferi yapılıyor.' },
            { question: 'Kos için kapı vizesi alabilir miyim?', answer: 'Kos, sezonda kapı vizesi uygulanan adalardan biri. Kapı vizesi işlemleri önceden yapılmalıdır; lütfen bize danışınız. Geçerli bir Schengen vizeniz varsa ek vize gerekmez.' },
          ],
        },
        en: {
          title: 'Bodrum ↔ Kos Ferry Ticket',
          cardDescription: 'From Bodrum to Kos on the K. Şevket İyidere — one-way, return and same-day return tickets.',
          metaDescription: 'Bodrum – Kos ferry tickets: K. Şevket İyidere fares in euros, one-way and return options, crossing time and a Kos travel guide.',
          durationLabel: 'Crossings from 30 minutes',
          routeLabel: 'Bodrum Cruise Port ↔ Kos Port',
          departurePort: 'Bodrum',
          arrivalPort: 'Kos',
          bookingBullets: ['Ferry ticket, Bodrum ↔ Kos', 'Vessel: K. Şevket İyidere'],
          about: [
            'The K. Şevket İyidere sails between Bodrum and Kos. One-way, return and same-day return tickets are available; vehicles are not carried on this route, foot passengers only.',
            'The ferry docks at the harbour in Kos town; Neratzia Castle, the ancient agora and the Hippocrates Tree are just a few minutes’ walk away.',
          ],
          knowBefore: [PASSPORT.en, visa(KOS).en],
          included: ['Bodrum ↔ Kos ferry ticket', ONE_WAY_OR_RETURN.en],
          notIncluded: KOS_NOT_INCLUDED.en,
          faqs: [
            { question: 'How long is the Bodrum–Kos ferry?', answer: 'Crossings between Bodrum and Kos start from 30 minutes; the time depends on the vessel and on weather and sea conditions.' },
            { question: 'Can I take my car to Kos?', answer: 'No, vehicles are not carried on the Bodrum–Kos route; it is for foot passengers only.' },
            { question: 'Can I get an island visa for Kos?', answer: 'Kos is one of the islands where a seasonal island visa is available. It must be arranged in advance — please contact us. With a valid Schengen visa no extra visa is needed.' },
          ],
        },
        de: {
          title: 'Bodrum ↔ Kos Fährticket',
          cardDescription: 'Mit der K. Şevket İyidere von Bodrum nach Kos – einfache Fahrt, Hin- und Rückfahrt oder Rückfahrt am selben Tag.',
          metaDescription: 'Bodrum – Kos Fährtickets: Preise in Euro für die K. Şevket İyidere, einfache Fahrt sowie Hin- und Rückfahrt, Fahrtdauer und Reiseinfos zu Kos.',
          durationLabel: 'Überfahrt ab 30 Minuten',
          routeLabel: 'Kreuzfahrthafen Bodrum ↔ Hafen Kos',
          departurePort: 'Bodrum',
          arrivalPort: 'Kos',
          bookingBullets: ['Fährticket, Bodrum ↔ Kos', 'Schiff: K. Şevket İyidere'],
          about: [
            'Zwischen Bodrum und Kos verkehrt die K. Şevket İyidere. Es gibt Tickets für die einfache Fahrt, Hin- und Rückfahrt sowie Rückfahrt am selben Tag; Fahrzeuge werden auf dieser Strecke nicht befördert, nur Passagiere.',
            'Die Fähre legt im Hafen von Kos-Stadt an; Burg Neratzia, die antike Agora und die Platane des Hippokrates sind nur wenige Gehminuten entfernt.',
          ],
          knowBefore: [PASSPORT.de, visa(KOS).de],
          included: ['Fährticket Bodrum ↔ Kos', ONE_WAY_OR_RETURN.de],
          notIncluded: KOS_NOT_INCLUDED.de,
          faqs: [
            { question: 'Wie lange dauert die Fähre Bodrum–Kos?', answer: 'Die Überfahrt zwischen Bodrum und Kos dauert ab 30 Minuten; die Zeit hängt vom Schiff, vom Wetter und vom Seegang ab.' },
            { question: 'Kann ich mein Auto nach Kos mitnehmen?', answer: 'Nein, auf der Strecke Bodrum–Kos werden keine Fahrzeuge befördert, nur Passagiere.' },
            { question: 'Gibt es für Kos ein Inselvisum?', answer: 'Kos gehört zu den Inseln, für die in der Saison ein Inselvisum erhältlich ist. Es muss im Voraus beantragt werden – bitte sprechen Sie uns an. Mit gültigem Schengen-Visum ist kein weiteres Visum nötig.' },
          ],
        },
        ru: {
          title: 'Билет на паром Бодрум ↔ Кос',
          cardDescription: 'Из Бодрума на Кос на судне «К. Шевкет Ийидере» — в одну сторону, туда и обратно или с возвращением в тот же день.',
          metaDescription: 'Билеты на паром Бодрум – Кос: цены в евро на «К. Шевкет Ийидере», билеты в одну сторону и туда и обратно, время в пути и путеводитель по Косу.',
          durationLabel: 'Переправа от 30 минут',
          routeLabel: 'Круизный порт Бодрума ↔ порт Коса',
          departurePort: 'Бодрум',
          arrivalPort: 'Кос',
          bookingBullets: ['Билет на паром Бодрум ↔ Кос', 'Судно: «К. Шевкет Ийидере»'],
          about: [
            'Между Бодрумом и Косом ходит судно «К. Шевкет Ийидере». Есть билеты в одну сторону, туда и обратно и с возвращением в тот же день; автомобили на этой линии не перевозятся — только пассажиры.',
            'Паром прибывает в гавань города Кос; крепость Нерадзия, древняя агора и платан Гиппократа — в нескольких минутах ходьбы.',
          ],
          knowBefore: [PASSPORT.ru, visa(KOS).ru],
          included: ['Билет на паром Бодрум ↔ Кос', ONE_WAY_OR_RETURN.ru],
          notIncluded: KOS_NOT_INCLUDED.ru,
          faqs: [
            { question: 'Сколько идёт паром Бодрум–Кос?', answer: 'Переправа между Бодрумом и Косом занимает от 30 минут; время зависит от судна, погоды и состояния моря.' },
            { question: 'Можно ли взять автомобиль на Кос?', answer: 'Нет, на линии Бодрум–Кос автомобили не перевозятся — только пассажиры.' },
            { question: 'Можно ли получить визу на Кос в порту?', answer: 'Кос входит в число островов, где в сезон оформляют визу острова. Её нужно оформить заранее — пожалуйста, обратитесь к нам. При действующей шенгенской визе дополнительная виза не нужна.' },
          ],
        },
      },
    },
  },
]

export function getTuryolRoute(slug: string | null | undefined): TuryolRoute | null {
  if (!slug) return null
  return TURYOL_ROUTES.find((r) => r.slug === slug) ?? null
}
