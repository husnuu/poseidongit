import type { SiteLocale } from '@/lib/i18n/config'

/**
 * Feribot hattı sayfalarındaki "Ada hakkında" bölümü (Sakız, Midilli, Kos).
 * Metinler kendi cümlelerimizle, ada rehberlerindeki bilgilerden yazıldı;
 * fotoğraflar Wikimedia Commons'tan, CC BY-SA lisanslı — sayfada kaynak
 * satırı (yazar + lisans) gösterilmesi lisans gereği zorunlu.
 */

export type IslandKey = 'sakiz' | 'midilli' | 'kos'

type Localized<T> = Record<SiteLocale, T>

export type IslandPhoto = {
  src: string
  width: number
  height: number
  caption: Localized<string>
  credit: { author: string; license: string; licenseUrl: string; sourceUrl: string }
}

const BY_SA = (version: '2.0' | '3.0' | '4.0') => ({
  license: `CC BY-SA ${version}`,
  licenseUrl: `https://creativecommons.org/licenses/by-sa/${version}/`,
})

export const ISLAND_PHOTOS = {
  'sakiz/mesta': {
    src: '/images/feribot/sakiz/mesta.jpg',
    width: 1600,
    height: 1067,
    caption: { tr: 'Mesta köyünün kemerli sokakları', en: 'Vaulted alleys of Mesta village', de: 'Überwölbte Gassen in Mesta', ru: 'Сводчатые улочки деревни Места' },
    credit: { author: 'Konstantinos Zannaras', ...BY_SA('4.0'), sourceUrl: 'https://commons.wikimedia.org/wiki/File:MESTA_CHIOS_GREECE_131%CE%91.jpg' },
  },
  'sakiz/pirgi': {
    src: '/images/feribot/sakiz/pirgi.jpg',
    width: 1600,
    height: 1067,
    caption: { tr: 'Pirgi köyünün desenli cepheleri', en: 'Patterned façades of Pyrgi', de: 'Gemusterte Fassaden in Pyrgi', ru: 'Узорчатые фасады Пирги' },
    credit: { author: 'Eva-tzi', ...BY_SA('4.0'), sourceUrl: 'https://commons.wikimedia.org/wiki/File:Pyrgi_village_photo_3.jpg' },
  },
  'sakiz/nea-moni': {
    src: '/images/feribot/sakiz/nea-moni.jpg',
    width: 1600,
    height: 1101,
    caption: { tr: 'Nea Moni Manastırı', en: 'Nea Moni Monastery', de: 'Kloster Nea Moni', ru: 'Монастырь Неа-Мони' },
    credit: { author: 'RomkeHoekstra', ...BY_SA('4.0'), sourceUrl: 'https://commons.wikimedia.org/wiki/File:Nea_Moni,_Chios.jpg' },
  },
  'midilli/molivos': {
    src: '/images/feribot/midilli/molivos.jpg',
    width: 1600,
    height: 1200,
    caption: { tr: 'Molivos ve tepesindeki kale', en: 'Molyvos and its hilltop castle', de: 'Molyvos mit seiner Burg', ru: 'Моливос и крепость на холме' },
    credit: { author: 'Rosa-Maria Rinkl', ...BY_SA('4.0'), sourceUrl: 'https://commons.wikimedia.org/wiki/File:Mithymna-Lesbos.JPG' },
  },
  'midilli/midilli-limani': {
    src: '/images/feribot/midilli/midilli-limani.jpg',
    width: 1600,
    height: 900,
    caption: { tr: 'Midilli (Mytilene) limanı ve Agios Therapon Kilisesi', en: 'Mytilene harbour and the Church of Agios Therapon', de: 'Hafen von Mytilini mit der Kirche Agios Therapon', ru: 'Гавань Митилини и церковь Святого Ферапонта' },
    credit: { author: 'Timeheritage', ...BY_SA('4.0'), sourceUrl: 'https://commons.wikimedia.org/wiki/File:Mytilene_port.jpg' },
  },
  'midilli/plomari': {
    src: '/images/feribot/midilli/plomari.jpg',
    width: 1600,
    height: 1200,
    caption: { tr: 'Plomari', en: 'Plomari', de: 'Plomari', ru: 'Пломари' },
    credit: { author: 'Kalogeropoulos', ...BY_SA('3.0'), sourceUrl: 'https://commons.wikimedia.org/wiki/File:Plomari_a.JPG' },
  },
  'midilli/petra': {
    src: '/images/feribot/midilli/petra.jpg',
    width: 1600,
    height: 1200,
    caption: { tr: 'Petra kasabası', en: 'Petra village', de: 'Der Ort Petra', ru: 'Посёлок Петра' },
    credit: { author: 'Rosa-Maria Rinkl', ...BY_SA('4.0'), sourceUrl: 'https://commons.wikimedia.org/wiki/File:Petra,_Lesbos.JPG' },
  },
  'midilli/petra-plaji': {
    src: '/images/feribot/midilli/petra-plaji.jpg',
    width: 1600,
    height: 1067,
    caption: { tr: 'Petra Plajı', en: 'Petra Beach', de: 'Strand von Petra', ru: 'Пляж Петра' },
    credit: { author: 'Mike Peel', ...BY_SA('4.0'), sourceUrl: 'https://commons.wikimedia.org/wiki/File:Petra_beach,_Lesbos.jpg' },
  },
  'midilli/midilli-kalesi': {
    src: '/images/feribot/midilli/midilli-kalesi.jpg',
    width: 1600,
    height: 1067,
    caption: { tr: 'Midilli Kalesi', en: 'Mytilene Castle', de: 'Burg von Mytilini', ru: 'Крепость Митилини' },
    credit: { author: 'Katsiaryna Naliuka', ...BY_SA('3.0'), sourceUrl: 'https://commons.wikimedia.org/wiki/File:Fortress_of_Mytilini,_Lesvos_1.jpg' },
  },
  'midilli/molivos-limani': {
    src: '/images/feribot/midilli/molivos-limani.jpg',
    width: 1600,
    height: 1200,
    caption: { tr: 'Molivos limanı', en: 'Molyvos harbour', de: 'Hafen von Molyvos', ru: 'Гавань Моливоса' },
    credit: { author: 'Rosa-Maria Rinkl', ...BY_SA('4.0'), sourceUrl: 'https://commons.wikimedia.org/wiki/File:Hafen_von_Molivos.JPG' },
  },
  'midilli/taslasmis-orman': {
    src: '/images/feribot/midilli/taslasmis-orman.jpg',
    width: 1600,
    height: 1200,
    caption: { tr: 'Taşlaşmış Orman', en: 'Petrified Forest', de: 'Versteinerter Wald', ru: 'Окаменевший лес' },
    credit: { author: 'Giorgos ab1234', ...BY_SA('4.0'), sourceUrl: 'https://commons.wikimedia.org/wiki/File:Petrified_forest,_Lesbos,_Greece.jpg' },
  },
  'kos/kos-kalesi-liman': {
    src: '/images/feribot/kos/kos-kalesi-liman.jpg',
    width: 1600,
    height: 1198,
    caption: { tr: 'Kos limanı ve Neratzia Kalesi', en: 'Kos harbour and Neratzia Castle', de: 'Hafen von Kos und Burg Neratzia', ru: 'Гавань Коса и крепость Нерадзия' },
    credit: { author: 'Arne Müseler', license: 'CC BY-SA 3.0 DE', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/de/deed.en', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Greece_kos_city_neratzia.jpg' },
  },
  'kos/kos-limani': {
    src: '/images/feribot/kos/kos-limani.jpg',
    width: 1600,
    height: 1200,
    caption: { tr: 'Kos limanı', en: 'Kos harbour', de: 'Hafen von Kos', ru: 'Гавань Коса' },
    credit: { author: 'Rikki Mitterer', ...BY_SA('4.0'), sourceUrl: 'https://commons.wikimedia.org/wiki/File:Kos-Harbour-11ESD.jpg' },
  },
  'kos/asklepion-manzara': {
    src: '/images/feribot/kos/asklepion-manzara.jpg',
    width: 1600,
    height: 1063,
    caption: { tr: 'Asklepion terasları', en: 'Terraces of the Asklepion', de: 'Terrassen des Asklepieion', ru: 'Террасы Асклепиона' },
    credit: { author: 'Michal Osmenda', ...BY_SA('2.0'), sourceUrl: 'https://commons.wikimedia.org/wiki/File:Asklepion,_Kos,_Greece_(5652978891).jpg' },
  },
  'kos/kastri-adasi': {
    src: '/images/feribot/kos/kastri-adasi.jpg',
    width: 1600,
    height: 1063,
    caption: { tr: 'Kefalos açıklarındaki Kastri adacığı', en: 'Kastri islet off Kefalos', de: 'Die Insel Kastri vor Kefalos', ru: 'Островок Кастри у Кефалоса' },
    credit: { author: 'Michal Osmenda', ...BY_SA('2.0'), sourceUrl: 'https://commons.wikimedia.org/wiki/File:Kastri_Island,_Kos,_Greece_(5654243980).jpg' },
  },
  'kos/tigaki-plaji': {
    src: '/images/feribot/kos/tigaki-plaji.jpg',
    width: 1600,
    height: 1200,
    caption: { tr: 'Tigaki Plajı', en: 'Tigaki Beach', de: 'Strand von Tigaki', ru: 'Пляж Тигаки' },
    credit: { author: 'Andy Mitchell', ...BY_SA('2.0'), sourceUrl: 'https://commons.wikimedia.org/wiki/File:Tingaki_Beach_(273378828).jpg' },
  },
  'kos/asklepion': {
    src: '/images/feribot/kos/asklepion.jpg',
    width: 1600,
    height: 1200,
    caption: { tr: 'Asklepion', en: 'Asklepion', de: 'Asklepieion', ru: 'Асклепион' },
    credit: { author: 'ΑΝώΔυΝος', ...BY_SA('4.0'), sourceUrl: 'https://commons.wikimedia.org/wiki/File:Asklepion_Kos_Greece.jpg' },
  },
  'kos/antik-agora': {
    src: '/images/feribot/kos/antik-agora.jpg',
    width: 1600,
    height: 1200,
    caption: { tr: 'Antik Agora', en: 'Ancient Agora', de: 'Antike Agora', ru: 'Древняя агора' },
    credit: { author: 'Rikki Mitterer', ...BY_SA('4.0'), sourceUrl: 'https://commons.wikimedia.org/wiki/File:Kos-Archaeological_site_quarter_agora-04ESD.jpg' },
  },
  'kos/neratzia-kalesi': {
    src: '/images/feribot/kos/neratzia-kalesi.jpg',
    width: 1600,
    height: 1322,
    caption: { tr: 'Neratzia (Şövalyeler) Kalesi', en: 'Neratzia (Knights) Castle', de: 'Burg Neratzia (Johanniterburg)', ru: 'Крепость Нерадзия (крепость рыцарей)' },
    credit: { author: 'Rikki Mitterer', ...BY_SA('4.0'), sourceUrl: 'https://commons.wikimedia.org/wiki/File:Kos-Nerantzia_Castle-03ESD.jpg' },
  },
} satisfies Record<string, IslandPhoto>

export type IslandPhotoKey = keyof typeof ISLAND_PHOTOS

export type IslandGuideText = {
  heading: string
  intro: string[]
  /** Fotoğraflı olanlar kart olarak, diğerleri kısa liste olarak gösterilir. */
  mustSee: { name: string; text: string; photo?: IslandPhotoKey }[]
  beaches: { name: string; text: string }[]
  practical: { title: string; text: string }[]
}

const SAKIZ: Localized<IslandGuideText> = {
  tr: {
    heading: 'Sakız Adası Hakkında',
    intro: [
      'Yunanların Chios dediği Sakız, Çeşme’nin hemen karşısında, Yunanistan’ın beşinci büyük adası. Feribotlar adanın merkezindeki limana yanaştığı için kale, çarşı ve sahil yolu iner inmez yürüyerek gezilebilir. Ada, Atina’ya ve diğer Ege adalarına devam etmek isteyenler için de pratik bir aktarma noktası.',
      'Sakız’ı özel kılan, adanın güneyinde yetişen damla sakızı ağaçları ve onların çevresinde kurulmuş Orta Çağ köyleri. Ada genelde iki rotada gezilir: Güneyde taş köyler ve volkanik plajlar, kuzeyde manastırlar ve dağ köyleri öne çıkar.',
    ],
    mustSee: [
      { name: 'Mesta', photo: 'sakiz/mesta', text: 'Surlarla çevrili, kemerli dar sokaklarıyla Orta Çağ dokusunu bugüne taşıyan damla sakızı köyü. Labirent gibi sokaklarında kaybolmak gezinin en keyifli kısmı.' },
      { name: 'Pirgi', photo: 'sakiz/pirgi', text: 'Ev cephelerini baştan sona saran siyah-beyaz geometrik desenleriyle tanınan köy; adanın en çok fotoğraflanan yeri.' },
      { name: 'Nea Moni Manastırı', photo: 'sakiz/nea-moni', text: 'Adanın ortasındaki dağlık bölgede, 11. yüzyıldan kalma mozaikleriyle UNESCO Dünya Mirası listesindeki Bizans manastırı.' },
      { name: 'Anavatos', text: 'Sarp bir kayalığın tepesine kurulmuş, bugün terk edilmiş taş köy; hikâyesi kadar manzarası da etkileyici.' },
      { name: 'Sakız Kalesi ve Arkeoloji Müzesi', text: 'Liman çevresinde, şehir merkezinde yürüyerek görülebilecek iki durak.' },
      { name: 'Armolia ve Avgonima', text: 'Güneyde çömlekçiliğiyle bilinen Armolia, kuzeyde ise yemek molası için ideal dağ köyü Avgonima.' },
    ],
    beaches: [
      { name: 'Mavra Volia', text: 'Siyah volkanik çakıllarıyla adanın en ünlü plajı.' },
      { name: 'Karfas', text: 'Merkeze yakın, otellerin yoğun olduğu uzun kumsal.' },
      { name: 'Komi', text: 'Kumlu ve berrak; sahil boyunca kafe ve restoranlar.' },
      { name: 'Agia Fotia', text: 'Merkezin yaklaşık 8 km güneyinde, çakıllı ve gençlerin uğrak yeri.' },
    ],
    practical: [
      { title: 'Kaç gün kalmalı?', text: '2 gece 3 gün; güney ve kuzey rotasını görmek ve birkaç plajı denemek için yeterli.' },
      { title: 'Ada içi ulaşım', text: 'Köyler birbirinden uzak ve otobüs seferleri seyrek. Araç kiralamak ya da günübirlik ada turlarına katılmak en rahat seçenek.' },
      { title: 'Lezzetler', text: 'Taze deniz ürünleri, ızgara kalamar ve kuzey köylerinde oğlak eti mutlaka denenmeli.' },
    ],
  },
  en: {
    heading: 'About Chios',
    intro: [
      'Chios (Sakız in Turkish) lies right across from Çeşme and is Greece’s fifth-largest island. Ferries dock in the harbour of the main town, so the castle, the market streets and the seafront are all within walking distance. The island is also a handy stopover for travellers heading on to Athens or other Aegean islands.',
      'What makes Chios special are the mastic trees that grow in its south and the medieval villages built around them. Most visitors explore it in two loops: stone villages and volcanic beaches in the south, monasteries and mountain villages in the north.',
    ],
    mustSee: [
      { name: 'Mesta', photo: 'sakiz/mesta', text: 'A walled mastic village whose narrow vaulted lanes have kept their medieval character. Getting lost in its maze of streets is half the fun.' },
      { name: 'Pyrgi', photo: 'sakiz/pirgi', text: 'Known for the black-and-white geometric patterns covering its house façades — the most photographed village on the island.' },
      { name: 'Nea Moni Monastery', photo: 'sakiz/nea-moni', text: 'A UNESCO-listed Byzantine monastery in the island’s mountainous centre, famous for its 11th-century mosaics.' },
      { name: 'Anavatos', text: 'An abandoned stone village perched on a steep cliff — the views are as striking as its history.' },
      { name: 'Chios Castle & Archaeological Museum', text: 'Two stops in the town centre, an easy walk from the harbour.' },
      { name: 'Armolia & Avgonima', text: 'Armolia in the south is known for its pottery; Avgonima in the north is a lovely mountain village for lunch.' },
    ],
    beaches: [
      { name: 'Mavra Volia', text: 'The island’s most famous beach, covered in black volcanic pebbles.' },
      { name: 'Karfas', text: 'A long sandy beach close to town, lined with hotels.' },
      { name: 'Komi', text: 'Sandy with clear water and cafés and restaurants along the shore.' },
      { name: 'Agia Fotia', text: 'A lively pebble beach about 8 km south of town, popular with young people.' },
    ],
    practical: [
      { title: 'How long to stay?', text: 'Two nights and three days are enough to cover the southern and northern routes and try a few beaches.' },
      { title: 'Getting around', text: 'Villages are far apart and buses are infrequent. Renting a car or joining a day tour of the island is the easiest option.' },
      { title: 'What to eat', text: 'Fresh seafood, grilled squid and, in the northern villages, roast goat are well worth trying.' },
    ],
  },
  de: {
    heading: 'Über Chios',
    intro: [
      'Chios (türkisch Sakız) liegt direkt gegenüber von Çeşme und ist die fünftgrößte Insel Griechenlands. Die Fähren legen im Hafen des Hauptortes an – Burg, Einkaufsstraßen und Uferpromenade sind zu Fuß erreichbar. Außerdem ist Chios ein praktischer Umsteigepunkt für die Weiterreise nach Athen oder zu anderen Ägäisinseln.',
      'Besonders machen Chios die Mastixbäume im Süden der Insel und die mittelalterlichen Dörfer, die um sie herum entstanden sind. Meist wird die Insel in zwei Touren erkundet: im Süden Steindörfer und Vulkanstrände, im Norden Klöster und Bergdörfer.',
    ],
    mustSee: [
      { name: 'Mesta', photo: 'sakiz/mesta', text: 'Ein ummauertes Mastixdorf, dessen enge, überwölbte Gassen ihren mittelalterlichen Charakter bewahrt haben. Sich im Gassenlabyrinth zu verlieren, gehört dazu.' },
      { name: 'Pyrgi', photo: 'sakiz/pirgi', text: 'Bekannt für die schwarz-weißen geometrischen Muster, die die Hausfassaden vollständig bedecken – das meistfotografierte Dorf der Insel.' },
      { name: 'Kloster Nea Moni', photo: 'sakiz/nea-moni', text: 'Ein byzantinisches Kloster im bergigen Inselinneren, UNESCO-Welterbe und berühmt für seine Mosaiken aus dem 11. Jahrhundert.' },
      { name: 'Anavatos', text: 'Ein verlassenes Steindorf auf einem steilen Felsen – die Aussicht ist so eindrucksvoll wie seine Geschichte.' },
      { name: 'Burg & Archäologisches Museum', text: 'Zwei Stationen im Ortszentrum, bequem zu Fuß vom Hafen.' },
      { name: 'Armolia & Avgonima', text: 'Armolia im Süden ist für Töpferwaren bekannt, Avgonima im Norden ein schönes Bergdorf für die Mittagspause.' },
    ],
    beaches: [
      { name: 'Mavra Volia', text: 'Der bekannteste Strand der Insel mit schwarzen Vulkankieseln.' },
      { name: 'Karfas', text: 'Langer Sandstrand nahe dem Hauptort mit vielen Hotels.' },
      { name: 'Komi', text: 'Sandstrand mit klarem Wasser, Cafés und Restaurants.' },
      { name: 'Agia Fotia', text: 'Lebhafter Kiesstrand rund 8 km südlich des Hauptortes, beliebt bei jungen Leuten.' },
    ],
    practical: [
      { title: 'Wie lange bleiben?', text: 'Zwei Nächte und drei Tage reichen für die Süd- und die Nordroute und ein paar Strände.' },
      { title: 'Unterwegs auf der Insel', text: 'Die Dörfer liegen weit auseinander, Busse fahren selten. Am bequemsten sind ein Mietwagen oder eine geführte Tagestour.' },
      { title: 'Kulinarisches', text: 'Frischer Fisch, gegrillter Tintenfisch und in den Norddörfern Zicklein sollte man probieren.' },
    ],
  },
  ru: {
    heading: 'Об острове Хиос',
    intro: [
      'Хиос (по-турецки Сакыз) находится прямо напротив Чешме и является пятым по величине островом Греции. Паромы швартуются в гавани главного города, поэтому крепость, торговые улицы и набережная — в пешей доступности. Остров также удобен как пересадочный пункт для тех, кто едет дальше, в Афины или на другие острова Эгейского моря.',
      'Главная особенность Хиоса — мастиковые деревья на юге острова и средневековые деревни, выросшие вокруг них. Обычно остров осматривают по двум маршрутам: на юге — каменные деревни и вулканические пляжи, на севере — монастыри и горные сёла.',
    ],
    mustSee: [
      { name: 'Места', photo: 'sakiz/mesta', text: 'Окружённая стенами мастиковая деревня с узкими сводчатыми улочками, сохранившая средневековый облик. Заблудиться в её лабиринте — часть удовольствия.' },
      { name: 'Пирги', photo: 'sakiz/pirgi', text: 'Деревня, известная чёрно-белыми геометрическими узорами на фасадах домов, — самое фотографируемое место острова.' },
      { name: 'Монастырь Неа-Мони', photo: 'sakiz/nea-moni', text: 'Византийский монастырь в горной части острова, объект Всемирного наследия ЮНЕСКО, знаменитый мозаиками XI века.' },
      { name: 'Анаватос', text: 'Заброшенная каменная деревня на вершине отвесной скалы — виды здесь так же впечатляют, как и её история.' },
      { name: 'Крепость и Археологический музей', text: 'Две остановки в центре города, недалеко от гавани.' },
      { name: 'Армолия и Авгонима', text: 'Армолия на юге славится гончарным ремеслом, Авгонима на севере — уютная горная деревня для обеда.' },
    ],
    beaches: [
      { name: 'Мавра-Волья', text: 'Самый известный пляж острова с чёрной вулканической галькой.' },
      { name: 'Карфас', text: 'Длинный песчаный пляж недалеко от города, много отелей.' },
      { name: 'Коми', text: 'Песчаный пляж с прозрачной водой, кафе и ресторанами.' },
      { name: 'Агия-Фотия', text: 'Оживлённый галечный пляж примерно в 8 км к югу от города, популярный у молодёжи.' },
    ],
    practical: [
      { title: 'Сколько дней нужно?', text: 'Двух ночей и трёх дней хватит, чтобы проехать южный и северный маршруты и побывать на нескольких пляжах.' },
      { title: 'Передвижение по острову', text: 'Деревни далеко друг от друга, автобусы ходят редко. Удобнее всего арендовать машину или поехать на экскурсию по острову.' },
      { title: 'Что попробовать', text: 'Свежие морепродукты, кальмары на гриле, а в северных деревнях — блюда из козлятины.' },
    ],
  },
}

const MIDILLI: Localized<IslandGuideText> = {
  tr: {
    heading: 'Midilli Adası Hakkında',
    intro: [
      'Yunanca adı Lesvos olan Midilli, Yunanistan’ın yüzölçümü bakımından üçüncü büyük adası. Türkiye’den gelen feribotlar adanın merkezi Mytilene’ye yanaşır; kale, dükkânlarla dolu Ermou Caddesi ve sahil boyunca uzanan kafeler limandan yürüme mesafesinde.',
      'Midilli birkaç saatte baştan sona gezilecek bir ada değil: Doğuda şehir hayatı ve zeytinlikler, kuzeyde taş evli Molivos ve Petra, güneyde uzosuyla ünlü Plomari, batıda ise volkanik arazisiyle Sigri bambaşka deneyimler sunar. Adanın tamamı UNESCO Küresel Jeopark ağına dahil.',
    ],
    mustSee: [
      { name: 'Midilli (Mytilene) merkez', photo: 'midilli/midilli-kalesi', text: 'Şehre ve denize hâkim büyük kale, Agios Therapon Kilisesi ve neoklasik konaklarıyla Surada bölgesi limandan yürüyerek gezilebilir.' },
      { name: 'Molivos', photo: 'midilli/molivos-limani', text: 'Tepedeki kaleden limana inen taş sokaklarıyla adanın en etkileyici kasabası. Gündüz kale, akşam limanda gün batımı ve yemek klasik plan.' },
      { name: 'Taşlaşmış Orman (Sigri)', photo: 'midilli/taslasmis-orman', text: 'Milyonlarca yıl önce volkanik küllerin altında kalarak taşlaşan ağaçlar. Sigri’deki Doğal Tarih Müzesi ile birlikte tam günlük bir gezi.' },
      { name: 'Petra', text: 'Dev bir kayanın tepesindeki Panagia Glykofilousa Kilisesi ve hemen önündeki plajıyla aileler için ideal.' },
      { name: 'Plomari', text: 'Renkli evleri ve uzo imalathaneleriyle güney kıyısının kasabası.' },
      { name: 'Agiasos ve Skala Kallonis', text: 'Olympos Dağı yamacında seramik ve ahşap işçiliğiyle bilinen Agiasos; Kalloni sardalyasıyla ünlü sahil köyü Skala Kallonis.' },
    ],
    beaches: [
      { name: 'Petra Plajı', text: 'Kasabanın hemen önünde, restoranlara yürüme mesafesinde.' },
      { name: 'Agios Isidoros', text: 'Plomari yakınında, berrak ve çakıllı.' },
      { name: 'Vatera', text: 'Güneyde kilometrelerce uzanan geniş kumsal.' },
      { name: 'Skala Eresou', text: 'Batı kıyısında sakin, uzun bir kumsal.' },
    ],
    practical: [
      { title: 'Kaç gün kalmalı?', text: 'Mytilene, Molivos ve Petra için 2–3 gün yeterli; Sigri ve Plomari’yi de görmek için 4–5 gün ayırın.' },
      { title: 'Ada içi ulaşım', text: 'Mytilene merkezi yürüyerek gezilir. Molivos, Petra, Plomari ve Sigri için araç kiralamak en esnek seçenek.' },
      { title: 'Günübirlik gidiyorsanız', text: 'Merkeze ve yakın çevresine odaklanın; uzak kasabalar için konaklamalı plan daha rahat.' },
      { title: 'Lezzetler', text: 'Kalloni sardalyası (papalina), ladotyri peyniri ve Plomari uzosu adanın imza tatları.' },
    ],
  },
  en: {
    heading: 'About Lesvos',
    intro: [
      'Lesvos (Midilli in Turkish) is Greece’s third-largest island. Ferries from Türkiye dock at Mytilene, the island’s capital, where the castle, the shops of Ermou Street and the seafront cafés are all within walking distance of the harbour.',
      'Lesvos is too big to see in a few hours: the east has city life and olive groves, the north the stone villages of Molyvos and Petra, the south Plomari with its ouzo, and the west the volcanic landscapes of Sigri. The whole island is part of the UNESCO Global Geoparks network.',
    ],
    mustSee: [
      { name: 'Mytilene town', photo: 'midilli/midilli-kalesi', text: 'The large castle overlooking town and sea, the Church of Agios Therapon and the neoclassical mansions of Sourada are all a short walk from the port.' },
      { name: 'Molyvos', photo: 'midilli/molivos-limani', text: 'The island’s most striking town, with stone lanes running from the hilltop castle down to the harbour. Castle by day, sunset dinner by the harbour in the evening.' },
      { name: 'Petrified Forest (Sigri)', photo: 'midilli/taslasmis-orman', text: 'Trees turned to stone after being buried under volcanic ash millions of years ago. Combined with the Natural History Museum in Sigri, it makes a full day out.' },
      { name: 'Petra', text: 'The Panagia Glykofilousa church on top of a huge rock, with a beach right in front — ideal for families.' },
      { name: 'Plomari', text: 'The south-coast town of colourful houses and ouzo distilleries.' },
      { name: 'Agiasos & Skala Kallonis', text: 'Agiasos on the slopes of Mount Olympos is known for ceramics and woodwork; Skala Kallonis is the seaside village famous for Kalloni sardines.' },
    ],
    beaches: [
      { name: 'Petra Beach', text: 'Right in front of the village, steps from the restaurants.' },
      { name: 'Agios Isidoros', text: 'Clear water and pebbles near Plomari.' },
      { name: 'Vatera', text: 'A wide sandy beach stretching for kilometres in the south.' },
      { name: 'Skala Eresou', text: 'A long, quiet sandy beach on the west coast.' },
    ],
    practical: [
      { title: 'How long to stay?', text: 'Two to three days cover Mytilene, Molyvos and Petra; allow four to five days to add Sigri and Plomari.' },
      { title: 'Getting around', text: 'Mytilene town is walkable. For Molyvos, Petra, Plomari and Sigri, a rental car gives you the most flexibility.' },
      { title: 'On a day trip', text: 'Focus on the town and its surroundings; the more distant villages are best visited with an overnight stay.' },
      { title: 'What to eat', text: 'Kalloni sardines (papalina), ladotyri cheese and ouzo from Plomari are the island’s signature flavours.' },
    ],
  },
  de: {
    heading: 'Über Lesbos',
    intro: [
      'Lesbos (türkisch Midilli) ist die drittgrößte Insel Griechenlands. Die Fähren aus der Türkei legen in Mytilini an, der Inselhauptstadt – Burg, die Geschäfte der Ermou-Straße und die Cafés an der Promenade sind vom Hafen aus zu Fuß erreichbar.',
      'Lesbos ist zu groß für ein paar Stunden: Im Osten Stadtleben und Olivenhaine, im Norden die Steindörfer Molyvos und Petra, im Süden Plomari mit seinem Ouzo und im Westen die Vulkanlandschaft um Sigri. Die ganze Insel gehört zum UNESCO-Netzwerk der Global Geoparks.',
    ],
    mustSee: [
      { name: 'Mytilini', photo: 'midilli/midilli-kalesi', text: 'Die große Burg über Stadt und Meer, die Kirche Agios Therapon und die klassizistischen Villen im Viertel Sourada liegen nur wenige Gehminuten vom Hafen entfernt.' },
      { name: 'Molyvos', photo: 'midilli/molivos-limani', text: 'Der eindrucksvollste Ort der Insel: Steingassen führen von der Burg hinunter zum Hafen. Tagsüber die Burg, abends Sonnenuntergang und Essen am Hafen.' },
      { name: 'Versteinerter Wald (Sigri)', photo: 'midilli/taslasmis-orman', text: 'Vor Jahrmillionen unter Vulkanasche versteinerte Bäume. Zusammen mit dem Naturkundemuseum in Sigri ein Ausflug für einen ganzen Tag.' },
      { name: 'Petra', text: 'Die Kirche Panagia Glykofilousa auf einem riesigen Felsen und ein Strand direkt davor – ideal für Familien.' },
      { name: 'Plomari', text: 'Der Ort an der Südküste mit bunten Häusern und Ouzo-Brennereien.' },
      { name: 'Agiasos & Skala Kallonis', text: 'Agiasos am Hang des Olympos ist für Keramik und Holzarbeiten bekannt, Skala Kallonis für die Sardinen aus dem Golf von Kalloni.' },
    ],
    beaches: [
      { name: 'Strand von Petra', text: 'Direkt vor dem Ort, nur wenige Schritte zu den Restaurants.' },
      { name: 'Agios Isidoros', text: 'Klares Wasser und Kies nahe Plomari.' },
      { name: 'Vatera', text: 'Kilometerlanger, breiter Sandstrand im Süden.' },
      { name: 'Skala Eresou', text: 'Langer, ruhiger Sandstrand an der Westküste.' },
    ],
    practical: [
      { title: 'Wie lange bleiben?', text: 'Für Mytilini, Molyvos und Petra reichen 2–3 Tage; mit Sigri und Plomari sollten es 4–5 Tage sein.' },
      { title: 'Unterwegs auf der Insel', text: 'Mytilini lässt sich zu Fuß erkunden. Für Molyvos, Petra, Plomari und Sigri ist ein Mietwagen am flexibelsten.' },
      { title: 'Als Tagesausflug', text: 'Konzentrieren Sie sich auf die Stadt und ihre Umgebung; entferntere Orte besser mit Übernachtung.' },
      { title: 'Kulinarisches', text: 'Sardinen aus Kalloni (Papalina), Ladotyri-Käse und Ouzo aus Plomari sind die typischen Spezialitäten.' },
    ],
  },
  ru: {
    heading: 'Об острове Лесбос',
    intro: [
      'Лесбос (по-турецки Мидилли) — третий по величине остров Греции. Паромы из Турции прибывают в Митилини, столицу острова: крепость, магазины улицы Эрму и кафе на набережной — в нескольких минутах ходьбы от порта.',
      'За несколько часов Лесбос не объехать: на востоке — городская жизнь и оливковые рощи, на севере — каменные посёлки Моливос и Петра, на юге — Пломари со своим узо, на западе — вулканические пейзажи Сигри. Весь остров входит в сеть Глобальных геопарков ЮНЕСКО.',
    ],
    mustSee: [
      { name: 'Митилини', photo: 'midilli/midilli-kalesi', text: 'Большая крепость над городом и морем, церковь Святого Ферапонта и неоклассические особняки района Сурада — всё в шаговой доступности от порта.' },
      { name: 'Моливос', photo: 'midilli/molivos-limani', text: 'Самый живописный городок острова: каменные улочки спускаются от крепости к гавани. Днём — крепость, вечером — закат и ужин у моря.' },
      { name: 'Окаменевший лес (Сигри)', photo: 'midilli/taslasmis-orman', text: 'Деревья, окаменевшие под вулканическим пеплом миллионы лет назад. Вместе с Музеем естественной истории в Сигри — поездка на целый день.' },
      { name: 'Петра', text: 'Церковь Панагии Гликофилусы на вершине огромной скалы и пляж прямо перед посёлком — отличный вариант для семей.' },
      { name: 'Пломари', text: 'Городок на южном побережье с яркими домами и винокурнями узо.' },
      { name: 'Агиасос и Скала-Каллонис', text: 'Агиасос на склоне горы Олимп известен керамикой и резьбой по дереву, Скала-Каллонис — сардинами из залива Каллони.' },
    ],
    beaches: [
      { name: 'Пляж Петра', text: 'Прямо перед посёлком, в двух шагах от ресторанов.' },
      { name: 'Агиос-Исидорос', text: 'Прозрачная вода и галька недалеко от Пломари.' },
      { name: 'Ватера', text: 'Широкий песчаный пляж длиной в несколько километров на юге.' },
      { name: 'Скала-Эресу', text: 'Длинный спокойный песчаный пляж на западном побережье.' },
    ],
    practical: [
      { title: 'Сколько дней нужно?', text: 'Для Митилини, Моливоса и Петры хватит 2–3 дней; чтобы добавить Сигри и Пломари, заложите 4–5 дней.' },
      { title: 'Передвижение по острову', text: 'Митилини можно обойти пешком. Для поездок в Моливос, Петру, Пломари и Сигри удобнее всего арендовать машину.' },
      { title: 'Если едете на один день', text: 'Сосредоточьтесь на городе и окрестностях; дальние посёлки лучше посещать с ночёвкой.' },
      { title: 'Что попробовать', text: 'Сардины из Каллони (папалина), сыр ладотири и узо из Пломари — визитная карточка острова.' },
    ],
  },
}

const KOS: Localized<IslandGuideText> = {
  tr: {
    heading: 'Kos (İstanköy) Adası Hakkında',
    intro: [
      'Türkçede İstanköy olarak da bilinen Kos, Bodrum’un tam karşısında, On İki Adalar’ın en hareketli adalarından biri. Feribotlar şehir merkezindeki limana yanaşır; Neratzia Kalesi, antik agora ve kafelerle dolu sokaklar iner inmez yürüme mesafesinde.',
      'Kos, Antik Yunan’dan kalma kalıntılarıyla öne çıkar: Tıbbın babası sayılan Hipokrat’ın izleri Asklepion’dan şehir merkezindeki Hipokrat Ağacı’na kadar adanın her yerinde. Uzun kumsalları, tavernaları ve canlı gece hayatıyla da her zevke hitap eder.',
    ],
    mustSee: [
      { name: 'Asklepion', photo: 'kos/asklepion', text: 'Şehrin birkaç kilometre dışında, tepeye teraslar hâlinde kurulmuş antik şifa merkezi. Hipokrat’ın burada eğitim gördüğü anlatılır; üst teraslardan Türkiye kıyıları görünür.' },
      { name: 'Antik Agora', photo: 'kos/antik-agora', text: 'Şehrin tam ortasında, sütunları ve tapınak kalıntılarıyla antik Kos’un çarşısı ve buluşma alanı.' },
      { name: 'Neratzia (Şövalyeler) Kalesi', photo: 'kos/neratzia-kalesi', text: 'Liman girişindeki, Rodos Şövalyeleri’nin inşa ettiği kale. Bodrum Kalesi’ni de aynı şövalyeler yaptığı için iki kale adeta karşılıklı bakışır.' },
      { name: 'Hipokrat Ağacı', text: 'Hipokrat’ın altında ders verdiği anlatılan dev çınar, kalenin hemen yanında.' },
      { name: 'Zia', text: 'Dikeos Dağı yamacında, tavernaları ve gün batımı manzarasıyla bilinen dağ köyü.' },
      { name: 'Kefalos ve Kastri adacığı', text: 'Adanın güneybatısında, Agios Stefanos bazilikası kalıntıları ve karşısındaki küçük şapelli adacık.' },
    ],
    beaches: [
      { name: 'Tigaki', text: 'Kuzey kıyısında uzun, kumlu ve adanın en sevilen plajlarından.' },
      { name: 'Lambi', text: 'Şehre en yakın plajlardan; yürüyerek ya da bisikletle ulaşılır.' },
      { name: 'Agios Fokas', text: 'Merkeze yaklaşık 9 km; kum ve çakıl bölümleri bir arada.' },
      { name: 'Mastichari', text: 'İnce kumu ve rüzgâr sörfü imkânıyla bilinir.' },
    ],
    practical: [
      { title: 'Kaç gün kalmalı?', text: 'Plaj tatili için 2 gece 3 gün yeterli; antik alanları rahatça gezmek için 3–4 gün ayırın.' },
      { title: 'Ada içi ulaşım', text: 'Otobüsler şehir merkezinden köylere düzenli sefer yapar; taksi ve araç ya da motosiklet kiralama da yaygın.' },
      { title: 'Lezzetler', text: 'Deniz ürünleri, kalamar dolması ve adaya özgü tatlı domates reçeli mutlaka denenmeli.' },
    ],
  },
  en: {
    heading: 'About Kos',
    intro: [
      'Kos (İstanköy in Turkish) sits right opposite Bodrum and is one of the liveliest islands of the Dodecanese. Ferries dock at the harbour in the town centre, with Neratzia Castle, the ancient agora and café-lined streets all a short walk away.',
      'Kos stands out for its ancient Greek heritage: traces of Hippocrates, the father of medicine, are everywhere from the Asklepion to the Hippocrates Tree in town. Long sandy beaches, tavernas and a lively nightlife complete the picture.',
    ],
    mustSee: [
      { name: 'Asklepion', photo: 'kos/asklepion', text: 'An ancient healing centre built in terraces on a hillside a few kilometres outside town. Hippocrates is said to have trained here; from the upper terraces you can see the Turkish coast.' },
      { name: 'Ancient Agora', photo: 'kos/antik-agora', text: 'Right in the middle of town, the columns and temple remains of ancient Kos’s market and meeting place.' },
      { name: 'Neratzia (Knights) Castle', photo: 'kos/neratzia-kalesi', text: 'Built by the Knights of Rhodes at the harbour entrance. The same knights built Bodrum Castle, so the two fortresses face each other across the sea.' },
      { name: 'Hippocrates Tree', text: 'The giant plane tree under which Hippocrates is said to have taught, right next to the castle.' },
      { name: 'Zia', text: 'A mountain village on the slopes of Mount Dikeos, known for its tavernas and sunset views.' },
      { name: 'Kefalos & Kastri islet', text: 'In the south-west: the ruins of the Agios Stefanos basilica and the tiny islet with its chapel just offshore.' },
    ],
    beaches: [
      { name: 'Tigaki', text: 'A long sandy beach on the north coast and one of the island’s favourites.' },
      { name: 'Lambi', text: 'One of the closest beaches to town, reachable on foot or by bike.' },
      { name: 'Agios Fokas', text: 'About 9 km from town, with both sandy and pebbly stretches.' },
      { name: 'Mastichari', text: 'Known for its fine sand and windsurfing.' },
    ],
    practical: [
      { title: 'How long to stay?', text: 'Two nights and three days are fine for a beach break; allow three to four days to explore the ancient sites at leisure.' },
      { title: 'Getting around', text: 'Buses run regularly from town to the villages; taxis and car or scooter rentals are widely available.' },
      { title: 'What to eat', text: 'Seafood, stuffed squid and the island’s own sweet tomato jam are must-tries.' },
    ],
  },
  de: {
    heading: 'Über Kos',
    intro: [
      'Kos (türkisch İstanköy) liegt direkt gegenüber von Bodrum und ist eine der lebhaftesten Inseln des Dodekanes. Die Fähren legen im Hafen der Stadt an – Burg Neratzia, die antike Agora und die Gassen voller Cafés sind nur wenige Gehminuten entfernt.',
      'Kos ist reich an antikem Erbe: Spuren von Hippokrates, dem Vater der Medizin, finden sich vom Asklepieion bis zur Platane des Hippokrates im Stadtzentrum. Lange Sandstrände, Tavernen und ein lebhaftes Nachtleben runden das Bild ab.',
    ],
    mustSee: [
      { name: 'Asklepieion', photo: 'kos/asklepion', text: 'Ein antikes Heilzentrum, in Terrassen an einem Hang wenige Kilometer außerhalb der Stadt angelegt. Hippokrates soll hier gelernt haben; von den oberen Terrassen sieht man die türkische Küste.' },
      { name: 'Antike Agora', photo: 'kos/antik-agora', text: 'Mitten in der Stadt: Säulen und Tempelreste des antiken Markt- und Versammlungsplatzes.' },
      { name: 'Burg Neratzia (Johanniterburg)', photo: 'kos/neratzia-kalesi', text: 'Von den Rhodos-Rittern an der Hafeneinfahrt erbaut. Dieselben Ritter errichteten die Burg von Bodrum – die beiden Festungen blicken sich über das Meer an.' },
      { name: 'Platane des Hippokrates', text: 'Die riesige Platane, unter der Hippokrates gelehrt haben soll, direkt neben der Burg.' },
      { name: 'Zia', text: 'Bergdorf am Hang des Dikeos, bekannt für Tavernen und Sonnenuntergänge.' },
      { name: 'Kefalos & Insel Kastri', text: 'Im Südwesten: die Ruinen der Basilika Agios Stefanos und das kleine Inselchen mit Kapelle vor der Küste.' },
    ],
    beaches: [
      { name: 'Tigaki', text: 'Langer Sandstrand an der Nordküste, einer der beliebtesten der Insel.' },
      { name: 'Lambi', text: 'Einer der stadtnächsten Strände, zu Fuß oder per Rad erreichbar.' },
      { name: 'Agios Fokas', text: 'Rund 9 km von der Stadt, mit Sand- und Kiesabschnitten.' },
      { name: 'Mastichari', text: 'Bekannt für feinen Sand und Windsurfen.' },
    ],
    practical: [
      { title: 'Wie lange bleiben?', text: 'Für Badeurlaub reichen zwei Nächte und drei Tage; für die antiken Stätten sollten Sie 3–4 Tage einplanen.' },
      { title: 'Unterwegs auf der Insel', text: 'Busse fahren regelmäßig von der Stadt in die Dörfer; Taxis sowie Auto- und Rollervermietungen gibt es überall.' },
      { title: 'Kulinarisches', text: 'Meeresfrüchte, gefüllter Tintenfisch und die inseltypische süße Tomatenmarmelade sollte man probieren.' },
    ],
  },
  ru: {
    heading: 'Об острове Кос',
    intro: [
      'Кос (по-турецки Истанкёй) находится прямо напротив Бодрума и считается одним из самых оживлённых островов Додеканеса. Паромы прибывают в гавань в центре города: крепость Нерадзия, древняя агора и улочки с кафе — в нескольких минутах ходьбы.',
      'Кос славится античным наследием: следы Гиппократа, отца медицины, встречаются повсюду — от Асклепиона до платана Гиппократа в центре города. Длинные песчаные пляжи, таверны и активная ночная жизнь дополняют картину.',
    ],
    mustSee: [
      { name: 'Асклепион', photo: 'kos/asklepion', text: 'Античный лечебный центр, построенный террасами на холме в нескольких километрах от города. По преданию, здесь учился Гиппократ; с верхних террас видно турецкое побережье.' },
      { name: 'Древняя агора', photo: 'kos/antik-agora', text: 'В самом центре города — колонны и остатки храмов древнего рынка и места собраний.' },
      { name: 'Крепость Нерадзия (крепость рыцарей)', photo: 'kos/neratzia-kalesi', text: 'Построена родосскими рыцарями у входа в гавань. Те же рыцари возвели Бодрумскую крепость, поэтому две твердыни смотрят друг на друга через море.' },
      { name: 'Платан Гиппократа', text: 'Огромный платан, под которым, по преданию, учил Гиппократ, — прямо у крепости.' },
      { name: 'Зия', text: 'Горная деревня на склоне горы Дикеос, известная тавернами и видами на закат.' },
      { name: 'Кефалос и островок Кастри', text: 'На юго-западе: руины базилики Святого Стефана и крошечный островок с часовней напротив.' },
    ],
    beaches: [
      { name: 'Тигаки', text: 'Длинный песчаный пляж на северном побережье, один из самых любимых на острове.' },
      { name: 'Ламби', text: 'Один из ближайших к городу пляжей, можно дойти пешком или доехать на велосипеде.' },
      { name: 'Агиос-Фокас', text: 'Около 9 км от города, есть песчаные и галечные участки.' },
      { name: 'Мастихари', text: 'Известен мелким песком и виндсёрфингом.' },
    ],
    practical: [
      { title: 'Сколько дней нужно?', text: 'Для пляжного отдыха хватит двух ночей и трёх дней; на античные памятники заложите 3–4 дня.' },
      { title: 'Передвижение по острову', text: 'Из города в деревни регулярно ходят автобусы; такси и прокат машин и скутеров — повсюду.' },
      { title: 'Что попробовать', text: 'Морепродукты, фаршированные кальмары и местное сладкое варенье из помидоров.' },
    ],
  },
}

const GUIDES: Record<IslandKey, Localized<IslandGuideText>> = { sakiz: SAKIZ, midilli: MIDILLI, kos: KOS }

export function getIslandGuide(island: IslandKey, locale: SiteLocale): IslandGuideText {
  return GUIDES[island][locale] ?? GUIDES[island].tr
}
