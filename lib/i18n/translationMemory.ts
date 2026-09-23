/**
 * Elle yazılmış Türkçe → Almanca / İngilizce çeviri sözlükleri ("translation memory").
 *
 * runtimeTranslate.ts içindeki translateText(), dış bir çeviri API'sine
 * (MyMemory/DeepL) gitmeden ÖNCE bu sözlüğü kontrol eder. Kaynak metin
 * (baştaki/sondaki boşluklar kırpılmış hâliyle) burada bulunursa, doğrudan
 * bu insan tarafından yazılmış çeviri kullanılır — hiçbir dış API çağrısı
 * yapılmaz. Böylece: (1) günlük kota/rate-limit sorunları bu içerikler için
 * hiç yaşanmaz, (2) çeviri kalitesi makine çevirisinden daha yüksek olur,
 * (3) sayfa yüklemesi bu alanlar için anında olur.
 *
 * Sözlükte olmayan bir metin gelirse translateText() olağan akışına devam
 * eder (DeepL varsa DeepL, yoksa MyMemory) — hiçbir şey bozulmaz.
 *
 * Anahtar: kaynak Türkçe metin (tam eşleşme, .trim() sonrası hâliyle).
 * Değer: elle yazılmış Almanca çeviri.
 *
 * Not: Poseidon, Çeşme, Hantal Turizm gibi özel isimler zaten
 * PROTECTED_TERMS ile korunuyor; burada sadece gerçek cümle/ifadeler yer
 * alır (özel isimlerin olduğu gibi kalması gereken durumlarda anahtar =
 * değer olarak eklenmiştir, böylece o metin için de API'ye hiç gidilmez).
 */
export const DE_TRANSLATION_MEMORY: Record<string, string> = {
  // ---- Ana sayfa: Hero ----
  'Çeşme Koylarını Poseidonla Keşfedin!': 'Entdecken Sie die Buchten von Çeşme mit Poseidon!',
  "Çeşme’nin En Çok Tercih Edilen Tekne Turu": 'Die meistgewählte Bootstour in Çeşme',
  'ONLİNE BİLET AL': 'ONLINE TICKET KAUFEN',
  'TURLARI İNCELE': 'TOUREN ANSEHEN',

  // ---- Ana sayfa: Özellik çubuğu (feature bar) ----
  'EN İYİ FİYAT GARANTİSİ': 'BESTPREISGARANTIE',
  'En iyi fiyatlarla rezervasyon yapın.': 'Buchen Sie zu den besten Preisen.',
  '5★ MİSAFİR MEMNUNİYETİ': '5★ GÄSTEZUFRIEDENHEIT',
  'Binlerce misafir yorumu ile kanıtlı kalite.': 'Bewährte Qualität mit Tausenden von Gästebewertungen.',
  "ÇEŞME’NİN EN YENİ TEKNESİ": 'DAS NEUESTE BOOT VON ÇEŞME',
  'Modern ve güvenli tekneyle yolculuk.': 'Reisen Sie mit einem modernen und sicheren Boot.',
  "1988'DEN BERİ DENEYİM": 'ERFAHRUNG SEIT 1988',
  'Yılların tecrübesiyle Çeşme koylarını en iyi bilen ekip.':
    'Das Team, das die Buchten von Çeşme dank jahrelanger Erfahrung am besten kennt.',

  // ---- Ana sayfa: Popüler turlar bölümü ----
  'EN POPÜLER TEKNE TURLARIMIZ': 'UNSERE BELIEBTESTEN BOOTSTOUREN',
  "ÇEŞME'DEN GÜNLÜK TURLAR": 'TÄGLICHE TOUREN AB ÇEŞME',

  // ---- Ana sayfa: Özel teknelerimiz (yat) bölümü ----
  'ÖZEL TEKNELERİMİZ': 'UNSERE PRIVATEN BOOTE',
  "Saatlik, günlük veya konaklamalı seçeneklerle 20'den fazla özel tekne seçeneği":
    'Über 20 private Bootsoptionen – stündlich, täglich oder mit Übernachtung',

  // ---- Ana sayfa: Koylar / rota bölümü ----
  "Çeşme'nin En Güzel Koyları": 'Die schönsten Buchten von Çeşme',
  "Poseidon ile denize açıldığınızda Çeşme’nin en güzel koylarını yakından görme fırsatı bulursunuz. Tur boyunca berraklığıyla ünlü Akvaryum Koyu ve doğal güzelliğiyle herkesin mutlaka görmesi gereken Eşek Adası gibi noktalarda yüzme molaları veriyoruz.":
    'Wenn Sie mit Poseidon in See stechen, haben Sie die Gelegenheit, die schönsten Buchten von Çeşme aus nächster Nähe zu erleben. Während der Tour legen wir Schwimmpausen an Orten wie der für ihr kristallklares Wasser bekannten Aquarium-Bucht und der Eselinsel ein, einem Naturwunder, das jeder gesehen haben sollte.',
  'Daha fazla koy gör': 'Mehr Buchten ansehen',
  'Mavi Koy': 'Blaue Bucht',
  'Eşek Adası': 'Eselinsel',
  'Mercan Adası': 'Koralleninsel',
  'Kış Limanı': 'Winterhafen',

  // ---- Ana sayfa: Hakkımızda teaser ----
  HAKKIMIZDA: 'ÜBER UNS',
  "1988 yılından bu yana Çeşme’de deniz turizmi alanında faaliyet gösteren Poseidon, yıllar içinde 7 farklı tekneyle misafirlerine hizmet vermiş köklü bir işletmedir.":
    'Poseidon ist seit 1988 im Seetourismus in Çeşme tätig und hat im Laufe der Jahre mit 7 verschiedenen Booten seine Gäste betreut – ein etabliertes, traditionsreiches Unternehmen.',
  "Denize olan tutkumuz ve 38 yıllık deneyimimizle, Çeşme’nin eşsiz koylarını keşfederken misafirlerimize unutulmaz bir tekne turu deneyimi sunmaya devam ediyoruz.":
    'Mit unserer Leidenschaft für das Meer und 38 Jahren Erfahrung bieten wir unseren Gästen weiterhin ein unvergessliches Bootstour-Erlebnis, während wir die einzigartigen Buchten von Çeşme erkunden.',
  TURLARIMIZ: 'UNSERE TOUREN',

  // ---- Ana sayfa: Blog bölümü ----
  'DENİZDEN GELEN HİKAYELER': 'GESCHICHTEN VOM MEER',
  'TÜM YAZILARI GÖR': 'ALLE BEITRÄGE ANSEHEN',

  // ---- Ana sayfa: Instagram bölümü ----
  'Bizi takip et': 'Folge uns',
  "Instagram’da bizimle denizde geçen anlara göz atın.": 'Wirf einen Blick auf unsere Momente auf See bei Instagram.',

  // ---- Ana sayfa: SEO ----
  'Çeşme Tekne Turu | Günlük Tur, Online Bilet - Rezervasyon':
    'Çeşme Bootstour | Tagestour, Online-Ticket – Buchung',
  "Çeşme tekne turu ile Eşek Adası ve Mavi Koy'u keşfedin. Yüzme molaları, turkuaz sular ve unutulmaz bir gün sizi bekliyor. Online biletinizi hemen alın!":
    'Entdecken Sie mit der Çeşme Bootstour die Eselinsel und die Blaue Bucht. Schwimmpausen, türkisfarbenes Wasser und ein unvergesslicher Tag erwarten Sie. Sichern Sie sich jetzt Ihr Online-Ticket!',

  // ---- Hakkımızda sayfası ----
  Hakkımızda: 'Über uns',
  'NASIL BAŞLADIK': 'WIE ALLES BEGANN',
  'GEÇMİŞTEN GÜNÜMÜZE TEKNELERİMİZ': 'UNSERE BOOTE VON FRÜHER BIS HEUTE',
  "Çeşme’de deniz turizmine başladığımız ilk günden bugüne, farklı teknelerle edindiğimiz deneyimi sürekli geliştirerek ilerledik.":
    'Seit dem ersten Tag, an dem wir mit dem Seetourismus in Çeşme begonnen haben, haben wir die mit verschiedenen Booten gesammelte Erfahrung stetig weiterentwickelt.',
  'Daha Fazla Oku': 'Mehr lesen',
  "Hakkımızda | Çeşme’nin En Çok Tercih Edilen Tekne Turu": 'Über uns | Die meistgewählte Bootstour in Çeşme',
  "Çeşme Poseidon ailesi olarak yıllardır misafirlerimizi Ege'nin en güzel koylarına götürüyoruz. Modern teknemiz, deneyimli ekibimiz ve unutulmaz turlarımızla tanışın.":
    'Als Familie Çeşme Poseidon bringen wir unsere Gäste seit Jahren zu den schönsten Buchten der Ägäis. Lernen Sie unser modernes Boot, unser erfahrenes Team und unsere unvergesslichen Touren kennen.',

  "1988'den bu yana Çeşme'de deniz turizmiyle iç içeyiz. Bu süreçte 7 farklı tekneyle binlerce misafirimizi Akvaryum Koyu, Eşek Adası ve bölgenin en güzel koylarıyla buluşturduk.":
    'Seit 1988 sind wir eng mit dem Seetourismus in Çeşme verbunden. In dieser Zeit haben wir mit 7 verschiedenen Booten Tausende von Gästen mit der Aquarium-Bucht, der Eselinsel und den schönsten Buchten der Region bekannt gemacht.',
  'Bugün filomuzun en yeni ve en konforlu teknesi Poseidon 2 ile yolumuza devam ediyoruz. Geniş güvertesi, modern yapısı ve tüm olanaklarıyla her detayı misafirlerimizin konforu için düşünülmüş bir tekne.':
    'Heute setzen wir unseren Weg mit Poseidon 2 fort, dem neuesten und komfortabelsten Boot unserer Flotte. Mit seinem geräumigen Deck, seiner modernen Struktur und all seinen Annehmlichkeiten wurde jedes Detail für den Komfort unserer Gäste durchdacht.',
  'Bizim için tekne turu sadece bir gezi değil. Misafirlerimizin kendini iyi hissettiği, huzurla geçirdiği bir gün. Bu yüzden her zaman dürüst ve dengeli bir hizmet anlayışıyla çalışıyor, kaliteden ödün vermeden erişilebilir fiyatlar sunmaya özen gösteriyoruz.':
    'Für uns ist eine Bootstour nicht nur ein Ausflug, sondern ein Tag, an dem sich unsere Gäste wohlfühlen und Ruhe finden. Deshalb arbeiten wir stets nach dem Grundsatz eines ehrlichen und ausgewogenen Service und achten darauf, erschwingliche Preise anzubieten, ohne dabei Abstriche bei der Qualität zu machen.',
  '2026 itibarıyla rezervasyon ve hizmet süreçlerimizi dijitale taşıdık. Artık online bilet alımından tura kadar her adım daha hızlı, daha şeffaf ve daha kolay.':
    'Seit 2026 haben wir unsere Reservierungs- und Serviceprozesse digitalisiert. Vom Online-Ticketkauf bis zur Tour selbst ist nun jeder Schritt schneller, transparenter und einfacher.',

  // ---- Hakkımızda: filo (tekne isimleri olduğu gibi kalır — özel isim) ----
  'NORTH STAR': 'NORTH STAR',
  'BLACK BEAUTY': 'BLACK BEAUTY',
  ANNA: 'ANNA',
  SINBAD: 'SINBAD',
  'POSEIDON 1': 'POSEIDON 1',
  'RUZGAR LAL': 'RUZGAR LAL',
  'POSEIDON 2': 'POSEIDON 2',

  "North Star, filomuzun ilk teknesi olarak deniz turizmine başladığımız noktayı temsil eder. 25 kişilik bu gulet daha butik ve samimi turlar düzenlediğimiz bu tekneyle, Çeşme’nin koylarında ilk misafirlerimizi ağırladık.":
    'North Star repräsentiert als erstes Boot unserer Flotte den Ausgangspunkt unseres Einstiegs in den Seetourismus. Mit dieser Gulet für 25 Personen, mit der wir exklusivere und persönlichere Touren veranstalteten, begrüßten wir unsere ersten Gäste in den Buchten von Çeşme.',
  "Filomuzun ilk teknelerinden biri olan Black Beauty ile Çeşme’de tekne turlarımıza başladık. O yıllarda misafirlerimizi Çeşme’nin berrak koylarıyla tanıştırırken denize olan tutkumuz da bu tekneyle büyüdü. Black Beauty, bizim için denizde başlayan uzun yolculuğun ilk adımlarından biridir.":
    'Mit Black Beauty, einem der ersten Boote unserer Flotte, begannen wir unsere Bootstouren in Çeşme. In jenen Jahren, als wir unsere Gäste mit den klaren Buchten von Çeşme bekannt machten, wuchs mit diesem Boot auch unsere Leidenschaft für das Meer. Black Beauty ist für uns einer der ersten Schritte unserer langen Reise auf See.',
  "Anna teknesiyle birlikte Çeşme’de düzenlediğimiz tekne turları daha fazla misafire ulaşmaya başladı. Bu dönemde farklı koyları keşfeden rotalar oluşturduk ve misafirlerimize daha keyifli bir deniz deneyimi sunmaya devam ettik.":
    'Mit dem Boot Anna erreichten unsere Bootstouren in Çeşme immer mehr Gäste. In dieser Zeit entwickelten wir Routen zur Erkundung verschiedener Buchten und boten unseren Gästen weiterhin ein noch angenehmeres Erlebnis auf See.',
  'Sinbad, filomuzun ilk teknelerinden biri olarak çift katlı ahşap yapısıyla hizmet verdi. Klasik tekne formu ve sıcak atmosferiyle misafirlerimize samimi bir deniz deneyimi sundu.':
    'Sinbad, eines der ersten Boote unserer Flotte, diente mit seiner zweistöckigen Holzstruktur. Mit seiner klassischen Bootsform und warmen Atmosphäre bot es unseren Gästen ein herzliches Erlebnis auf See.',
  "Poseidon 1, filomuzun ilk çelik gövdeli teknesi olarak önemli bir dönüm noktası oldu. 180 kişi kapasiteli bu tekneyle uzun yıllar Çeşme’de birçok tur gerçekleştirdik. Günümüzde ise Poseidon 1, Yunanistan’ın Skiathos şehrinde hizmet vermeye devam etmektedir.":
    'Poseidon 1 war als erstes Boot unserer Flotte mit Stahlrumpf ein wichtiger Meilenstein. Mit einer Kapazität von 180 Personen führten wir mit diesem Boot über viele Jahre zahlreiche Touren in Çeşme durch. Heute ist Poseidon 1 weiterhin in Skiathos, Griechenland, im Einsatz.',
  'Rüzgar Lal teknesiyle birlikte filomuz büyümeye devam etti. Bodrum yapımı olan bu tekne, 4 kamaralı yapısıyla özellikle charter turları için uygun bir deneyim sunuyordu.':
    'Mit dem Boot Rüzgar Lal wuchs unsere Flotte weiter. Dieses in Bodrum gebaute Boot bot mit seiner 4-Kabinen-Struktur ein besonders für Chartertouren geeignetes Erlebnis.',
  'Poseidon 2, filomuzun en yeni ve modern üyesi olarak hizmet vermektedir. 40 metre uzunluğundaki bu yeni nesil tekne, güçlü altyapıyla; 2 ana motor ve 3 jeneratör ile donatılmıştır.':
    'Poseidon 2 ist das neueste und modernste Mitglied unserer Flotte. Dieses 40 Meter lange Boot der neuen Generation verfügt über eine leistungsstarke Ausstattung mit 2 Hauptmotoren und 3 Generatoren.',

  // ---- Duyuru çubuğu (üst bar) ----
  'Eylül ayı sonuna kadar her gün turumuz var': 'Bis Ende September haben wir täglich Touren',

  // ---- Footer: iletişim kartı ----
  'Ekibimizle Konuşun': 'Sprechen Sie mit unserem Team',
  'Çalışma Saatleri': 'Öffnungszeiten',
  'Her Gün 08:00 - 23:00': 'Täglich 08:00 – 23:00 Uhr',
  'Tekne Adresi': 'Bootsadresse',

  // ---- Footer: keşfet / sosyal medya ----
  Keşfet: 'Entdecken',
  'Sosyal Medya': 'Soziale Medien',

  // ---- Footer: yasal / telif ----
  'cesmetekneturu.net, Poseidon Tur Teknesinin Resmi Bilet Satış Sitesidir':
    'cesmetekneturu.net ist die offizielle Ticketverkaufsseite des Poseidon Tour Boats',
  'Kayıtlı Seyahat Acentası: HANTAL Turizm: 18888': 'Eingetragenes Reisebüro: HANTAL Turizm: 18888',
  '©2026 Çeşme Poseidon | Tüm Hakları Saklıdır': '©2026 Çeşme Poseidon | Alle Rechte vorbehalten',
  '3D Güvenli Ödeme': '3D Sichere Zahlung',
  'Hantal Turizm - Belge No: 18888': 'Hantal Turizm – Lizenznr. 18888',

  // ---- Tur: Çeşme Adalar & Koylar Turu (cesme-tekne-turu) ----
  "Çeşme Adalar & Koylar Turu –  Öğle Yemeği Dahil": "Çeşme Inseln & Buchten Tour – Mittagessen inklusive",
  "Akvaryum Koyu, Eşek Adası ve Çeşme'nin en güzel koylarını keşfedin. 7 saatlik tam gün turda turkuaz sularda yüzme molaları, BBQ öğle yemeği ve seçtiğin konforla unutulmaz bir deniz günü seni bekliyor.": "Entdecken Sie die Aquarium-Bucht, die Eselinsel und die schönsten Buchten von Çeşme. Bei der 7-stündigen Ganztagestour erwarten Sie Schwimmpausen im türkisfarbenen Wasser, ein BBQ-Mittagessen und ein unvergesslicher Tag auf See mit dem Komfort Ihrer Wahl.",
  "Sabah 11:00'de Çeşme sahilden hareket ediyoruz. Güneş henüz tam tepede değil, deniz sakin, günün en iyi başlangıcı bu.": "Wir legen morgens um 11:00 Uhr vom Ufer von Çeşme ab. Die Sonne steht noch nicht ganz im Zenit, das Meer ist ruhig – der perfekte Start in den Tag.",
  "Akvaryum Koyu — 12:00": "Aquarium-Bucht — 12:00 Uhr",
  "İlk durağımız Çeşme'nin en berrak sularına ev sahipliği yapan Akvaryum Koyu. Adını boşuna almamış — suya girdiğinizde kendinizi dev bir akvaryumun içinde gibi hissediyorsunuz. Şnorkelling için ideal bir nokta; maske takın, yüzünüzü suya daldırın ve Ege'nin altını keşfedin. Güneşlenmek isteyenler için güvertede bol yer var.": "Unser erster Halt ist die Aquarium-Bucht, die für das klarste Wasser in Çeşme bekannt ist. Ihren Namen trägt sie nicht umsonst – sobald Sie ins Wasser gehen, fühlen Sie sich wie in einem riesigen Aquarium. Ein idealer Ort zum Schnorcheln: Maske aufsetzen, Gesicht ins Wasser tauchen und die Unterwasserwelt der Ägäis entdecken. Für alle, die lieber sonnenbaden möchten, gibt es reichlich Platz an Deck.",
  "Öğle yemeğini de burada, denizin ortasında yiyoruz. Mangalda tavuk veya balık, soslu makarna, taze Akdeniz salatası ve günün mezeleri... Her şey günlük hazırlanıyor.": "Auch das Mittagessen nehmen wir hier ein, mitten auf dem Meer. Gegrilltes Hähnchen oder Fisch, Pasta mit Soße, frischer mediterraner Salat und die Mezze des Tages … alles wird täglich frisch zubereitet.",
  "Eşek Adası — 13:15": "Eselinsel — 13:15 Uhr",
  "Yemeğin ardından rotamızı Eşek Adası'na çeviriyoruz. Burada sadece yüzmek zorunda değilsiniz — adanın kendisi de keşfedilmeyi bekliyor. Kararaya çıkın, patikayı takip edin, tepeden Ege'ye bakın. Kimsenin bilmediği köşeler, sessiz bir doğa yürüyüşü ve önünüzde uzanan mavi. Denizi tercih edenler için adanın plajından suya girme imkânı da var — kıyıdan yavaşça ilerleyin ya da doğrudan atlayın. 75 dakikanız var, nasıl kullandığınız tamamen size kalmış.": "Nach dem Essen nehmen wir Kurs auf die Eselinsel. Hier müssen Sie nicht nur schwimmen – die Insel selbst wartet darauf, entdeckt zu werden. Gehen Sie an Land, folgen Sie dem Pfad und blicken Sie vom Hügel auf die Ägäis. Verborgene Ecken, eine ruhige Wanderung und endloses Blau vor Ihnen. Wer lieber im Meer bleibt, kann auch vom Strand der Insel aus ins Wasser gehen – langsam vom Ufer aus oder direkt hineinspringen. Sie haben 75 Minuten Zeit, wie Sie diese nutzen, liegt ganz bei Ihnen.",
  "Mercan Adası — 14:45": "Koralleninsel — 14:45 Uhr",
  "Mercan Adası'nın adı tesadüf değil. Su altı mercan kayalıkları ve yosunlarla kaplı canlı bir ekosistem sizi karşılıyor. Maske takıp daldığınızda Ege'nin küçük ama görkemli dünyasını görüyorsunuz. Yüzme bilmeyenler için de endişelenmeye gerek yok: adanın mavi bayraklı tertemiz plajından rahatça denize girebilirsiniz. Kıyıda yürüyün, sığ suda oturun ya da güvertede güneşlenin.": "Der Name der Koralleninsel kommt nicht von ungefähr. Ein lebendiges Ökosystem aus Unterwasser-Korallenriffen und Algen erwartet Sie. Mit Maske und Schnorchel tauchen Sie in die kleine, aber beeindruckende Unterwasserwelt der Ägäis ein. Auch Nichtschwimmer müssen sich keine Sorgen machen: Vom blau geflaggten, makellosen Strand der Insel aus können Sie bequem ins Wasser gehen. Spazieren Sie am Ufer entlang, setzen Sie sich ins flache Wasser oder sonnen Sie sich an Deck.",
  "Son durak — Kış Limanı veya Mağaralar": "Letzter Halt — Winterhafen oder Höhlen",
  "Hava durumuna göre iki eşit güzel alternatiften birini seçiyoruz.": "Je nach Wetterlage wählen wir eine von zwei gleichermaßen schönen Alternativen.",
  "Kış Limanı, üç tarafı kara ile çevrili, rüzgarın ve dalgaların hiç ulaşamadığı bir sığınak. Kışın balıkçıların fırtınadan korunmak için tercih ettiği bu küçük cennet, yaz günlerinde tam anlamıyla sakin ve dingin bir son durak oluyor. Kasırga dahi çıksa suyu ayna gibi o sakinlikte bir yüzme molası bambaşka hissettiriyor.": "Der Winterhafen ist auf drei Seiten von Land umgeben – ein Zufluchtsort, den Wind und Wellen nie erreichen. Dieses kleine Paradies, das Fischer im Winter zum Schutz vor Stürmen aufsuchen, ist an Sommertagen ein wahrhaft ruhiger und friedlicher letzter Halt. Selbst wenn draußen ein Sturm tobt, ist das Wasser hier spiegelglatt – eine Schwimmpause in dieser Ruhe fühlt sich ganz anders an.",
  "Lodoslu havalarda ise rotamızı Mağaralar'a çeviriyoruz. Dalgalardan korunaklı, kayalık yapısıyla hem yüzmek hem de etrafı seyretmek için ayrı bir deneyim sunan alternatif bir nokta.": "Bei Südwind (Lodos) nehmen wir stattdessen Kurs auf die Höhlen. Geschützt vor Wellen, bietet dieser felsige Ort sowohl zum Schwimmen als auch zum Betrachten der Umgebung ein ganz eigenes Erlebnis.",
  "Dönüş — 17:15": "Rückfahrt — 17:15 Uhr",
  "Artık güneş alçalmaya başlıyor. Dönüş rotamız özellikle bu saate göre kurgulanmış, ufukta Sakız Adası'nın silueti beliriyor. Teknede içeceğinizi alın, güverteye yaslanın ve gün batımını izleyin. Çeşme limanına 18:00'de, güzel bir günün tam da doğru bitişiyle dönüyoruz.": "Die Sonne beginnt langsam zu sinken. Unsere Rückfahrt ist genau auf diese Stunde abgestimmt, am Horizont erscheint die Silhouette der Insel Chios. Holen Sie sich Ihr Getränk an Bord, lehnen Sie sich an Deck zurück und genießen Sie den Sonnenuntergang. Um 18:00 Uhr kehren wir in den Hafen von Çeşme zurück – der perfekte Abschluss eines wunderschönen Tages.",
  "Her gün": "Täglich",
  "7 saat": "7 Stunden",
  "Paylaşımlı Tur": "Gruppentour",
  "Türkçe, İngilizce": "Türkisch, Englisch",
  "Çeşme Sahil": "Çeşme Strand",
  "Öğle Yemeği Dahil": "Mittagessen inklusive",
  "Mangalda tavuk veya balık, makarna, taze salata ve günün mezeleri ile deniz ortasında sıcak servis.": "Warmes Essen mitten auf dem Meer: gegrilltes Hähnchen oder Fisch, Pasta, frischer Salat und die Mezze des Tages.",
  "Çeşme’nin En Yeni Teknesi": "Das neueste Boot von Çeşme",
  "Modern ve konforlu bir tekne turu deneyimi yaşayın.": "Erleben Sie eine moderne und komfortable Bootstour.",
  "Eco / Premium / First Class Alanlar": "Eco-, Premium- und First-Class-Bereiche",
  "Bütçene ve konfor tercihine göre seç, herkese uygun bir yer var.": "Wählen Sie nach Budget und Komfortwunsch – für jeden ist der passende Platz dabei.",
  "Yerel Kaptan Deneyimi": "Erfahrung mit lokalem Kapitän",
  "Çeşme’yi yıllardır bilen kaptan ile güvenli ve keyifli tur.": "Sichere und angenehme Tour mit einem Kapitän, der Çeşme seit Jahren kennt.",
  "Günbatımında Dönüş": "Rückkehr bei Sonnenuntergang",
  "Sakız Adası manzarasıyla eve dönersin, turun son hediyesi.": "Sie kehren mit Blick auf die Insel Chios zurück – das letzte Geschenk der Tour.",
  "Başlangıç Saati": "Startzeit",
  "Çeşme çıkışlı tam gün tekne turu": "Ganztägige Bootstour ab Çeşme",
  "Öğle Yemeği": "Mittagessen",
  "Tur boyunca yolcu sigortası": "Passagierversicherung während der Tour",
  "WI-FI": "WLAN",
  "Deneyimli kaptan ve güler yüzlü ekip": "Erfahrener Kapitän und freundliche Crew",
  "İçecekler ve atıştırmalıklar": "Getränke und Snacks",
  "Otel transfer hizmeti (Ekstra ücretle sağlanabilir)": "Hoteltransfer (gegen Aufpreis verfügbar)",
  "Kişisel harcamalar": "Persönliche Ausgaben",
  "Bu Turu Neden Seveceksiniz?": "Warum Sie diese Tour lieben werden",
  "1988 yılından beri Çeşme’de denizdeyim. Yıllar içinde pek çok misafirimizi Çeşme’nin en güzel koylarına götürdük ve denizi birlikte keşfettik. Bu turu planlarken amacımız sadece bir tekne gezisi yapmak değil, misafirlerimizin gün boyunca keyifli ve rahat bir zaman geçirmesini sağlamak.": "Seit 1988 bin ich in Çeşme auf See. Im Laufe der Jahre haben wir viele unserer Gäste zu den schönsten Buchten von Çeşme gebracht und das Meer gemeinsam entdeckt. Bei der Planung dieser Tour geht es uns nicht nur um eine Bootsfahrt, sondern darum, dass unsere Gäste den ganzen Tag über eine angenehme und entspannte Zeit verbringen.",
  "En Çok Tercih Edilen": "Am meisten gewählt",
  "Eco Class alanı teknemizin orta katında, gölgelikli bölümde yer alır.": "Der Eco-Class-Bereich befindet sich im schattigen Teil des mittleren Decks unseres Bootes.",
  "Tüm bölümde gölgelikler açılmaktadır": "Im gesamten Bereich können Sonnensegel geöffnet werden",
  "3-4 kişilik ve daha kalabalık gruplar için loca veya masa imkanı": "Loca oder Tisch für Gruppen ab 3–4 Personen",
  "1-2 kişilik misafirler için ise güneşlenme minderi imkanı bulunmaktadır.": "Für 1–2 Gäste steht eine Sonnenliege zur Verfügung.",
  "Yetişkin": "Erwachsener",
  "Çocuk": "Kind",
  "Bebek": "Baby",
  "En Popüler": "Am beliebtesten",
  "Premium Class – Teras Manzarası ve Şezlong Keyfi": "Premium Class – Terrassenblick und Liegestuhl-Komfort",
  "Kişiye özel şezlong imkanı": "Eigene Liege für jeden Gast",
  "Teknemizin en üst katında yer alır ve geniş teras manzarası sunar.": "Befindet sich im obersten Deck unseres Bootes mit weitem Terrassenblick.",
  "Daha sakin ve rahat bir tur deneyimi arayan misafirlerimizin tercihi": "Die Wahl unserer Gäste, die eine ruhigere und komfortablere Tour suchen",
  "En Özel Deneyim": "Das exklusivste Erlebnis",
  "Sadece 10 adet yataklı şezlong bulunan bu alanda daha sakin ve konforlu bir ortamda turunuzun keyfini": "In diesem Bereich mit nur 10 Liegen genießen Sie Ihre Tour in ruhigerer und komfortablerer Atmosphäre.",
  "Teknemizin en izole ve özel bölümünde yer alır": "Befindet sich im abgeschiedensten und exklusivsten Bereich unseres Bootes",
  "Çiftler tarafından en çok tercih edilen bölümdür": "Der bei Paaren beliebteste Bereich",
  "Bu alana yalnızca 16 yaş ve üzeri misafirler kabul edilmektedir": "Dieser Bereich ist nur für Gäste ab 16 Jahren zugänglich",
  "Otel Transferi": "Hoteltransfer",
  "Transferin yapılacağı otelin tam adını yazın.": "Geben Sie den vollständigen Namen des Hotels an, von dem der Transfer erfolgen soll.",
  "Otel adı": "Hotelname",
  "Örn. Boyalık Beach Hotel": "z. B. Boyalık Beach Hotel",
  "Otelden transfer": "Transfer vom Hotel",
  "Otelimden kalkış noktasına transfer istiyorum.": "Ich möchte einen Transfer von meinem Hotel zum Abfahrtsort.",
  "2 Kişilik Şarap & Meyve Keyfi": "Wein & Obst-Genuss für 2 Personen",
  "İyice soğutulmuş 70'lik yaz şarabı ve rengarenk mevsim meyvelerinden oluşan efsanevi meyve tabağımızla günün yorgunluğunu unutun.": "Vergessen Sie die Müdigkeit des Tages mit unserem gut gekühlten Sommerwein und unserer legendären, bunten Obstplatte aus saisonalen Früchten.",
  "Otelinizden kalkış noktasına transfer istiyorum.": "Ich möchte einen Transfer von meinem Hotel zum Abfahrtsort.",
  "24 saat öncesine kadar iptal": "Stornierung bis 24 Stunden vorher",
  "3D Secure Güvenli Ödeme": "3D Secure sichere Zahlung",
  "Sık tükeniyor!": "Oft schnell ausgebucht!",
  "Tura gelirken yanımıza ne almalıyız?": "Was sollten wir zur Tour mitbringen?",
  "Yanınızda mayo, havlu, güneş kremi, güneş gözlüğü ve şapka getirmenizi öneririz. Denize girmek isteyen misafirlerimiz için rahat bir plaj çantası da faydalı olabilir.": "Wir empfehlen Badebekleidung, ein Handtuch, Sonnencreme, eine Sonnenbrille und einen Hut. Für Gäste, die schwimmen möchten, kann außerdem eine praktische Strandtasche nützlich sein.",
  "Teknede yemek ve içecek var mı?": "Gibt es Essen und Getränke an Bord?",
  "Tur sırasında öğle yemeği teknede servis edilmektedir ve ücrete dahildir. Menüde tavuk veya balık, soslu makarna ve taze hazırlanmış Akdeniz salatası bulunmaktadır. İçecekler ise tekneden ekstra ücret ile temin edilebilir.": "Während der Tour wird ein Mittagessen an Bord serviert, das im Preis inbegriffen ist. Auf der Speisekarte stehen Hähnchen oder Fisch, Pasta mit Soße und frisch zubereiteter mediterraner Salat. Getränke können gegen Aufpreis an Bord erworben werden.",
  "Çeşme tekne turu kaç saat sürüyor?": "Wie lange dauert die Çeşme-Bootstour?",
  "Turumuz yaklaşık 7 saat sürmektedir. Sabah 11:00’de Çeşme limanından hareket ediyor ve akşam 18:00 civarında tekrar limana dönüyoruz.": "Unsere Tour dauert etwa 7 Stunden. Wir legen morgens um 11:00 Uhr vom Hafen von Çeşme ab und kehren gegen 18:00 Uhr wieder in den Hafen zurück.",
  "Yüzme bilmeyenler tura katılabilir mi?": "Können auch Nichtschwimmer an der Tour teilnehmen?",
  "Evet, yüzme bilmeyen misafirlerimiz de tura rahatlıkla katılabilir. Teknede yeterli sayıda can yeleği ve yüzme ekipmanları bulunmaktadır. Ayrıca yanaştığımız 2 koyda misafirlerimiz plajdan denize girebilmektedir. Yüzme molaları tamamen isteğe bağlıdır; dileyen misafirlerimiz denize girerken, isteyenler teknede kalıp manzaranın ve denizin keyfini çıkarabilir.": "Ja, auch Gäste, die nicht schwimmen können, können problemlos an der Tour teilnehmen. An Bord befinden sich ausreichend Rettungswesten und Schwimmausrüstung. Zudem können unsere Gäste an den 2 angefahrenen Buchten vom Strand aus ins Wasser gehen. Die Schwimmpausen sind völlig freiwillig – wer möchte, geht ins Wasser, andere können an Bord bleiben und die Aussicht sowie das Meer genießen.",
  "Teknede hangi olanaklar bulunuyor?": "Welche Annehmlichkeiten gibt es an Bord?",
  "Poseidon 2, Çeşme’nin en yeni ve modern teknesidir. Teknede tuvalet, soyunma kabini, tatlı su duşu ve geniş oturma alanları bulunmaktadır. Misafirlerimiz için ayrıca Eco, Premium ve First Class olmak üzere farklı oturma alanı seçenekleri sunulmakta, böylece herkes konforuna ve tercihine uygun bir deneyim yaşayabilmektedir": "Poseidon 2 ist das neueste und modernste Boot von Çeşme. An Bord gibt es eine Toilette, eine Umkleidekabine, eine Süßwasserdusche und großzügige Sitzbereiche. Für unsere Gäste stehen außerdem verschiedene Sitzbereichs-Optionen zur Verfügung – Eco, Premium und First Class –, sodass jeder ein Erlebnis passend zu seinem Komfort und seinen Vorlieben genießen kann.",
  "İptal politikası nedir?": "Wie lautet die Stornierungsrichtlinie?",
  "24 saat öncesine kadar yapılan iptallerde ücret iadesi sağlanabilir. Detaylı bilgi için rezervasyon sırasında bizimle iletişime geçebilirsiniz.": "Bei Stornierungen bis 24 Stunden vorher kann eine Rückerstattung erfolgen. Für Details können Sie uns bei der Reservierung gerne kontaktieren.",
  "Çocuklar için uygun mu?": "Ist die Tour für Kinder geeignet?",
  "Evet, tekne turumuz aileler ve çocuklar için oldukça uygundur. Teknede alt katta güneşten korunabileceğiniz kapalı bir oturma alanı bulunmaktadır. Ayrıca çocuklar için can yeleği ve kolluk gibi güvenlik ekipmanları mevcuttur. Teknenin korkulukları yüksek tasarlandığı için çocukların güvenliği açısından da rahat bir ortam sunar.": "Ja, unsere Bootstour eignet sich sehr gut für Familien und Kinder. Im unteren Deck des Bootes gibt es einen überdachten Sitzbereich, der Schutz vor der Sonne bietet. Außerdem sind Sicherheitsausrüstungen wie Rettungswesten und Schwimmflügel für Kinder vorhanden. Da das Boot über hohe Geländer verfügt, bietet es auch in puncto Sicherheit für Kinder eine angenehme Umgebung.",
  "Tekne çok sallanıyor mu?": "Schaukelt das Boot stark?",
  "Poseidon 2 geniş ve büyük yapısı sayesinde denizde oldukça dengeli bir seyir sunar. Bu nedenle normal teknelere göre çok daha az sallanır ve özellikle ilk kez tekne turuna katılan misafirler için daha konforlu bir deneyim sağlar.": "Dank seiner geräumigen und großen Bauweise bietet Poseidon 2 eine sehr stabile Fahrt auf See. Dadurch schaukelt es deutlich weniger als gewöhnliche Boote und sorgt besonders für Gäste, die zum ersten Mal an einer Bootstour teilnehmen, für ein komfortableres Erlebnis.",

  // ---- Tur detay: Nerede / harita bölümü ----
  'Nerede': 'WO',
  'Toplanma Noktası': 'Treffpunkt',
  "Google Maps'te Aç": 'In Google Maps öffnen',

  // ---- Yat kartları / diğer turlar (CMS'te manuel çevirisi olmayan alanlar) ----
  "Karaburun": "Karaburun",
  "Kaptanlı": "Mit Kapitän",
  "Ekonomik Seçim": "Günstige Wahl",
  "Günlük Kiralama": "Tagesmiete",
  "Ultra Lüks": "Ultra-Luxus",
  "Profesyonel kaptanlı özel mürettebat": "Professioneller Kapitän und eigene Crew",
  "Yakıt (günlük standart kullanım dahilinde)": "Treibstoff (im üblichen Tagesverbrauch enthalten)",
  "10 saat": "10 Stunden",
  "3 Saat": "3 Stunden",
  "İzmir'den Alım Noktaları": "Abholpunkte ab İzmir",
  "Türkçe, English": "Türkisch, Englisch",
  "İzmir Çıkışlı Tam Gün Çeşme Tekne Turu": "Ganztägige Çeşme-Bootstour ab İzmir",
  "İzmir'den çıkıp Çeşme'nin turkuaz koylarında tam gün geçirmek için tek yapmanız gereken belirlenen noktada bizi beklemek. Transfer, tekne, BBQ öğle yemeği ve 4 durak — her şey dahil.": "Von İzmir aus einen ganzen Tag in den türkisfarbenen Buchten von Çeşme verbringen – Sie müssen nur am vereinbarten Treffpunkt auf uns warten. Transfer, Boot, BBQ-Mittagessen und 4 Stopps – alles inklusive.",
  "Günbatımı Turu": "Sonnenuntergangstour",
  "Çeşme’de gün batımını denizin üzerinde karşılayın. 19:00–21:30 saatleri arasında gerçekleşen turda Akvaryum Koyu’nda yüzme molası verilir, hafif müzik eşliğinde keyifli bir atmosfer sunulur ve akşam yemeği dahildir.": "Erleben Sie den Sonnenuntergang über dem Meer in Çeşme. Die Tour findet zwischen 19:00 und 21:30 Uhr statt, mit einer Schwimmpause in der Aquarium-Bucht, einer angenehmen Atmosphäre mit leiser Musik, und einem inkludierten Abendessen.",
}

/**
 * İngilizce sözlük — çok daha kısa, çünkü CMS'te anasayfa ve hakkımızda
 * sayfaları için zaten editör tarafından girilmiş kapsamlı İngilizce
 * çeviriler var (pageTranslations.en / translations.en). Buradaki
 * girdiler SADECE o manuel çevirilerin kapsamadığı gerçek boşluklar için:
 * tur1'in bilet sınıfları/ekstraları, koy isimleri, "Nerede" bölümü
 * genel etiketleri, yat kartı rozetleri ve manuel çevirisi olmayan diğer
 * 2 tur (İzmir turu, Günbatımı turu).
 */
export const EN_TRANSLATION_MEMORY: Record<string, string> = {
  // ---- Tur: Çeşme Adalar & Koylar Turu — bilet sınıfları / ekstralar (CMS'te manuel İngilizce çevirisi yok) ----
  "En Çok Tercih Edilen": "Most Chosen",
  "Eco Class alanı teknemizin orta katında, gölgelikli bölümde yer alır.": "The Eco Class area is located on the middle deck of our boat, in the shaded section.",
  "Tüm bölümde gölgelikler açılmaktadır": "Sun shades can be opened throughout the section",
  "3-4 kişilik ve daha kalabalık gruplar için loca veya masa imkanı": "Loca or table option for groups of 3–4 or more",
  "1-2 kişilik misafirler için ise güneşlenme minderi imkanı bulunmaktadır.": "A sunbed option is available for guests of 1–2 people.",
  "Yetişkin": "Adult",
  "Çocuk": "Child",
  "Bebek": "Infant",
  "En Popüler": "Most Popular",
  "Premium Class – Teras Manzarası ve Şezlong Keyfi": "Premium Class – Terrace View and Sun Lounger Comfort",
  "Kişiye özel şezlong imkanı": "Private sun lounger for each guest",
  "Teknemizin en üst katında yer alır ve geniş teras manzarası sunar.": "Located on the top deck of our boat with a wide terrace view.",
  "Daha sakin ve rahat bir tur deneyimi arayan misafirlerimizin tercihi": "The choice of guests looking for a calmer and more comfortable tour experience",
  "En Özel Deneyim": "Most Exclusive Experience",
  "Sadece 10 adet yataklı şezlong bulunan bu alanda daha sakin ve konforlu bir ortamda turunuzun keyfini": "With only 10 sun loungers available, enjoy your tour in a calmer and more comfortable setting in this area.",
  "Teknemizin en izole ve özel bölümünde yer alır": "Located in the most secluded and exclusive section of our boat",
  "Çiftler tarafından en çok tercih edilen bölümdür": "The section most preferred by couples",
  "Bu alana yalnızca 16 yaş ve üzeri misafirler kabul edilmektedir": "This area only accepts guests aged 16 and over",
  "Otel Transferi": "Hotel Transfer",
  "Transferin yapılacağı otelin tam adını yazın.": "Please write the full name of the hotel for the transfer.",
  "Otel adı": "Hotel name",
  "Örn. Boyalık Beach Hotel": "e.g. Boyalik Beach Hotel",
  "Otelden transfer": "Transfer from hotel",
  "Otelimden kalkış noktasına transfer istiyorum.": "I would like a transfer from my hotel to the departure point.",
  "2 Kişilik Şarap & Meyve Keyfi": "Wine & Fruit Delight for 2",
  "İyice soğutulmuş 70'lik yaz şarabı ve rengarenk mevsim meyvelerinden oluşan efsanevi meyve tabağımızla günün yorgunluğunu unutun.": "Forget the tiredness of the day with our well-chilled summer wine and our legendary, colorful fruit platter made from seasonal fruits.",
  "Otelinizden kalkış noktasına transfer istiyorum.": "I would like a transfer from my hotel to the departure point.",

  // ---- Koylar / Nerede / yat kartları / diğer turlar (CMS'te manuel çevirisi olmayan alanlar) ----
  "Mavi Koy": "Blue Bay",
  "Eşek Adası": "Donkey Island",
  "Mercan Adası": "Coral Island",
  "Kış Limanı": "Winter Harbor",
  "Karaburun": "Karaburun",
  "Nerede": "Where",
  "Toplanma Noktası": "Meeting Point",
  "Google Maps'te Aç": "Open in Google Maps",
  "Öğle Yemeği Dahil": "Lunch Included",
  "Kaptanlı": "With Captain",
  "Ekonomik Seçim": "Economical Choice",
  "Günlük Kiralama": "Daily Rental",
  "Ultra Lüks": "Ultra Luxury",
  "Profesyonel kaptanlı özel mürettebat": "Professional captain and dedicated crew",
  "Yakıt (günlük standart kullanım dahilinde)": "Fuel (included for standard daily use)",
  "7 saat": "7 hours",
  "10 saat": "10 hours",
  "3 Saat": "3 Hours",
  "Çeşme Sahil": "Cesme Beach",
  "İzmir'den Alım Noktaları": "Pickup Points from Izmir",
  "Türkçe, English": "Turkish, English",
  "Her gün": "Everyday",
  "İzmir Çıkışlı Tam Gün Çeşme Tekne Turu": "Full-Day Cesme Boat Tour from Izmir",
  "İzmir'den çıkıp Çeşme'nin turkuaz koylarında tam gün geçirmek için tek yapmanız gereken belirlenen noktada bizi beklemek. Transfer, tekne, BBQ öğle yemeği ve 4 durak — her şey dahil.": "All you need to do to spend a full day in Cesme's turquoise bays departing from Izmir is wait for us at the designated point. Transfer, boat, BBQ lunch and 4 stops — everything is included.",
  "Günbatımı Turu": "Sunset Tour",
  "Çeşme’de gün batımını denizin üzerinde karşılayın. 19:00–21:30 saatleri arasında gerçekleşen turda Akvaryum Koyu’nda yüzme molası verilir, hafif müzik eşliğinde keyifli bir atmosfer sunulur ve akşam yemeği dahildir.": "Watch the sunset over the sea in Cesme. Held between 19:00–21:30, the tour includes a swim break at Aquarium Bay, a pleasant atmosphere with light music, and dinner is included.",
}
