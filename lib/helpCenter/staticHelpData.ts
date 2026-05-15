/**
 * Kaynak: docs/help-center-faq-icerik-tr.md
 * Yenilemek için: node scripts/generate-static-help-data.cjs
 */

export const STATIC_HELP_PAGE = {
  heroEyebrow: 'Yardım Merkezi',
  title: 'Poseidon Çeşme Tekne Turu — Sık Sorulan Sorular',
  shortDescription:
    'Online rezervasyon, tur programı, fiyatlar, iptal ve Çeşme’de buluşma hakkında sık sorulan soruların yanıtları. Güncel saat ve fiyat için tur sayfanızı ve biletinizi esas alın.',
  seoTitle: 'Çeşme Tekne Turu Yardım Merkezi | Poseidon',
  seoDescription:
    'Poseidon günlük tekne turu: rezervasyon, ödeme, iptal, rota ve pratik bilgiler. cesmetekneturu.net üzerinden online bilet ve destek.',
} as const

export type StaticHelpArticle = {
  slug: string
  title: string
  answer: string
}

export type StaticHelpCategory = {
  slug: string
  title: string
  shortDescription: string
  iconName: string
  order: number
  isFeatured: boolean
  articles: StaticHelpArticle[]
}

export const STATIC_HELP_CATEGORIES: StaticHelpCategory[] = [
  {
    slug: 'rezervasyon-bilet',
    title: "Rezervasyon ve Bilet Satın Alma",
    shortDescription: "Online bilet, ödeme yöntemleri, onay, grup ve rezervasyon yönetimi.",
    iconName: 'calendar',
    order: 10,
    isFeatured: true,
    articles: [
      { slug: 'online-rezervasyon-nasil-yapilir', title: "Online rezervasyon nasıl yapılır?", answer: "Çeşme tekne turu için online biletinizi cesmetekneturu.net üzerinden, ilgilendiğiniz turun sayfasından tarih ve kişi sayısını seçerek oluşturabilirsiniz. Ödeme adımında kart bilgilerinizi güvenli ödeme altyapısıyla tamamladığınızda rezervasyonunuz işleme alınır ve başarılı ödeme sonrası anında onay e-postası ile rezervasyon özetinizi alırsınız. Rezervasyonunuzu sonradan görüntülemek veya tarih değişikliği gibi işlemler için size iletilen rezervasyon yönetimi bağlantısını kullanabilirsiniz. Böylece Çeşme’de günlük tekne turu planınızı tek merkezden takip edersiniz. Sorun yaşarsanız WhatsApp veya iletişim kanallarımızdan uzman ekibe yazmanız yeterli." },
      { slug: 'hangi-odeme-yontemlerini-kabul-ediyorsunuz', title: "Hangi ödeme yöntemlerini kabul ediyorsunuz?", answer: "Poseidon’da günlük tekne turu rezervasyonlarında öncelikli olarak banka / kredi kartı ile güvenli online ödeme kullanılır; işlem, PCI uyumlu altyapı üzerinden şifrelenerek gerçekleştirilir. Nakit veya havale gibi yöntemler her zaman açık olmayabilir; güncel seçenekler ödeme ekranında net olarak listelenir. Ödemeniz onaylandığında dekont ve bilet bilgileriniz e-posta ile tarafınıza iletilir. Çeşme tekne turu planınızı riske atmadan tamamlamak için kartla ödeme en hızlı ve izlenebilir yöntemdir. Fatura veya kurumsal talepler için iletişimden yönlendirme alabilirsiniz." },
      { slug: 'rezervasyon-onayi-ne-kadar-surer', title: "Rezervasyon onayı ne kadar sürer?", answer: "Kart ile başarılı online ödeme tamamlandığında sistem rezervasyonunuzu anında onaylar; onay ve özet genellikle birkaç dakika içinde e-postanıza düşer. Nadiren banka veya ağ gecikmesi yaşanırsa e-postayı birkaç dakika sonra kontrol edin; gelmezse spam klasörüne bakın ve gerekirse iletişimden rezervasyon numaranızla yazın. Böylece Çeşme tekne turu biletiniz kesinleşir ve tur günü planını güvenle yapabilirsiniz. Planınızı netleştirmek için tur sayfasındaki süre ve buluşma bilgilerini mutlaka okuyun." },
      { slug: 'son-dakika-rezervasyon-yapabilir-miyim', title: "Son dakika rezervasyon yapabilir miyim?", answer: "Müsaitlik olduğu sürece aynı gün veya birkaç saat öncesine kadar online rezervasyon mümkün olabilir; kontenjan tur bazında anlık güncellenir. Doluluk arttıkça son kontenjanlar hızla dolabileceği için son dakika planınız varsa mümkün olan en erken saatte çeşme tekne turu sayfasından tarihi kilitlemenizi öneririz. Yoğun günlerde yer garantisi için erken online bilet almak en risksiz seçenektir. Müsaitlik görünmüyorsa alternatif tarih veya sınıf için sayfayı yenilemeyi veya ekibe yazmayı deneyin." },
      { slug: 'ayni-gun-rezervasyon-mumkun-mu', title: "Aynı gün rezervasyon mümkün mü?", answer: "Evet—takvimde boş yer gösterdiği sürece aynı gün için online bilet kesilebilir. Günlük tekne turu kontenjanı canlı olduğundan, sabah kararı veren misafirler de öğleden önce yer bulabildiği günler olur; garanti için erken rezervasyon şarttır. Tur saati ve buluşma noktası, seçtiğiniz turun sayfasında ve onay e-postasında yazar; geç kalmamak için rota planınızı buna göre yapın. Çeşme’de günübirlik tekne turu deneyimini son ana bırakmak istiyorsanız önce müsaitliği online kontrol edin." },
      { slug: 'grup-rezervasyonu-icin-indirim-var-mi', title: "Grup rezervasyonu için indirim var mı?", answer: "Grup ve özel organizasyon talepleri (doğum günü, kurumsal çıkarma, arkadaş grubu) yoğunluğa ve tarihe göre değerlendirilir; sabit bir “otomatik indirim yüzdesi” her zaman ilan edilmeyebilir. Kişi sayısı yüksek olduğunda veya özel rota ihtiyacında en doğru fiyat ve olanak için iletişim veya WhatsApp üzerinden tarih, kişi sayısı ve tur tercihinizi iletmeniz yeterli. Poseidon ekibi çeşme tekne turu planınızı netleştirip size şeffaf seçenek sunar. Online standart satış fiyatları ise tur sayfasında güncel olarak görünür." },
      { slug: 'rezervasyon-dekontu-alabilir-miyim', title: "Rezervasyon dekontu alabilir miyim?", answer: "Başarılı ödeme sonrası e-postanıza düşen onay ve özet, rezervasyonunuzun resmi kaydı olarak kullanılabilir; işlem ve tutar bilgileri bu iletide yer alır. Ek olarak rezervasyon yönetimi bağlantınızdan biletinizi ve detayları görüntüleyebilirsiniz. Kurumsal fatura veya ek evrak ihtiyacınız varsa iletişim kanallarından ünvan ve vergi bilgilerinizle talep iletebilirsiniz. Çeşme tekne turu biletinizi yanınızda dijital olarak taşımak çoğu durumda yeterlidir; kaptan ve iskele kontrollerinde net bilgi sunmanızı kolaylaştırır." },
      { slug: 'rezervasyonumu-nasil-degistirebilirim', title: "Rezervasyonumu nasıl değiştirebilirim?", answer: "Tarih veya kontenjan uygunluğu sağlandığı sürece rezervasyonunuzu rezervasyon yönetimi ekranı üzerinden (size iletilen bağlantı ile) güncellemeyi deneyebilirsiniz; sistem izin verdiği ölçüde değişiklik anında veya onay süreciyle kayda alınır. Yoğun dönemlerde istenen tarih dolu olabilir; bu durumda alternatif gün veya ekibimizden manuel destek alabilirsiniz. Çeşme tekne turu planınızı bozmadan ilerlemek için mümkün olan en erken saatte tarih revizyonu yapmanızı öneririz. Son günlere bırakılan değişikliklerde müsaitlik kısıtı yaşanabilir." },
    ],
  },
  {
    slug: 'tur-detaylari-program',
    title: "Tur Detayları ve Program",
    shortDescription: "Çeşme sahilden 11:00 çıkış; Akvaryum, Eşek ve Mercan durakları, öğle yemeği, son durakta Kış Limanı veya Mağaralar; günbatımında dönüş ~18:00. Wi‑Fi, yolcu sigortası, Eco / Premium / First Class alanları.",
    iconName: 'ship',
    order: 20,
    isFeatured: true,
    articles: [
      { slug: 'tur-kac-saat-suruyor', title: "Tur kaç saat sürüyor?", answer: "Çeşme çıkışlı tam gün programımızda tekneye Çeşme sahilden sabah 11:00 civarı çıkıyoruz; Çeşme limanına dönüş ise akşamüstü, örneğin 18:00 bandında tamamlanır — molalar, yüzme durakları ve öğle yemeğiyle birlikte yaklaşık yedi saatlik dolu bir gün. Güneş henüz tepede değilken deniz genelde sakindir; günün en iyi başlangıcı bu saatlerdir. Tur boyunca yolcu sigortası ve tekne üzerinde Wi‑Fi sunuyoruz; Eco, Premium ve First Class oturum alanları bütçe ve konfor tercihinize göre seçilebilir. Kesin süre ve saatler sezona göre ince ayarlanabilir; net bilgi her zaman seçtiğiniz tur sayfasında ve onaylı biletinizdedir." },
      { slug: 'tur-saat-kacta-basliyor-kacta-bitiyor', title: "Tur saat kaçta başlıyor, kaçta bitiyor?", answer: "Kalkış Çeşme sahilden sabah 11:00’dedir. Örnek bir günün akışı şöyledir: ilk durak Akvaryum Koyu yaklaşık 12:00, Eşek Adası yaklaşık 13:15, Mercan Adası yaklaşık 14:45; son durak sonrası dönüş rotası yaklaşık 17:15 civarında günbatımına uygun kurgulanır — ufukta Sakız Adası silueti belirirken güvertede içeceğinizi alıp günü tamamlayabilirsiniz. Çeşme limanına varış hedefi yaklaşık 18:00’dir. Saatler hava ve operasyonel gerekliliklere göre değişebilir; bağlayıcı saatler biletiniz ve tur sayfasındaki programa göredir. Geç kalmamak için buluşmadan en az 15 dakika önce hazır olun." },
      { slug: 'tekne-nereden-kalkiyor-adres-nedir', title: "Tekne nereden kalkıyor? Adres nedir?", answer: "Tam gün turumuzda Çeşme sahilden hareket ediyoruz. Tam buluşma noktası, iskele ve harita bağlantısı rezervasyon sonrası biletinizde ve bilgilendirme e-postanızda adım adım paylaşılır. Yanlış noktaya gitmemek için adresi tur gününden önce telefonunuza kaydedin. Çeşme’nin en yeni ve konforlu teknemizle çıktığımız bu programda yerel kaptan deneyimiyle güvenli ve keyifli bir rota sunulur." },
      { slug: 'hangi-koylara-adalara-gidiyoruz', title: "Hangi koylara/adalara gidiyoruz?", answer: "Tipik tam gün rotamız şöyle akar: İlk durak Akvaryum Koyu — Çeşme’nin en berrak sularından biri; adını boşuna almamış, şnorkelle Ege’nin altını keşfetmek için ideal. Öğle yemeğini denizin ortasında burada alıyoruz. Eşek Adası — yemek sonrası rotayı ada tarafına çeviriyoruz; yüzmek, karaya çıkıp patikayı takip etmek, tepeden Ege’ye bakmak veya plajdan denize girmek arasında yaklaşık 75 dakika kullanabilirsiniz. Mercan Adası — mercan kayalıkları ve yosunlarla canlı su altı dünyası; mavi bayraklı tertemiz plajından rahatça denize girilebilir. Son durak olarak hava durumuna göre Kış Limanı (üç tarafı kara ile çevrili, dalgalardan korunaklı sakin bir sığınak) veya Mağaralar (lodosta korunaklı kayalık yapı) alternatiflerinden biri seçilir. Güzergâh kaptan tarafından güvenlik ve şartlara göre güncellenebilir; kesin sıra tur sayfasında özetlenir." },
      { slug: 'yuzme-molasi-var-mi-kac-kez', title: "Yüzme molası var mı? Kaç kez?", answer: "Evet — program boyunca birden fazla yüzme ve keşif molası vardır. Akvaryum’da berrak suda şnorkel ve güneşlenme; Eşek Adası’nda ada keşfi veya plajdan giriş; Mercan’da su altı gözlemi veya sığ kıyı; son durakta Kış Limanı’nda ayna gibi sakin suda yüzme ya da Mağaralar’da kayalık ortamda deneyim. Yüzme bilmeyen misafirler için güverte, sığ kıyı ve kaptanın yönlendirmesiyle güvenli seçenekler mümkündür; her molada can yeleği ve güvenlik önceliklidir." },
      { slug: 'ogle-yemegi-dahil-mi', title: "Öğle yemeği dahil mi?", answer: "Tam gün öğle yemeği dahil paketimizde öğünü Akvaryum Koyu’nda, denizin ortasında alıyoruz: mangalda tavuk veya balık, soslu makarna ve taze Akdeniz salatası günlük hazırlanır, sıcak servis edilir. İçecekler ve ekstra kalemler paketinize göre tur sayfasında “dahil / hariç” olarak listelenir; özel diyet için tur öncesi yazmanızı öneririz." },
      { slug: 'i-cecek-dahil-mi-alkol-var-mi', title: "İçecek dahil mi? Alkol var mı?", answer: "İçecek politikası seçtiğiniz pakete ve tur sayfasındaki listeye göredir; tekne üzerinde Wi‑Fi sunulur. Alkol varsa yaş sınırı ve tekne güvenliği kuralları geçerlidir; aşırı tüketim sınırlandırılabilir. Günbatımına doğru dönüşte içeceğinizi alıp güverteye yaslanarak Sakız siluetiyle günü bitirmek turun son hediyesidir — güvenli ve keyifli kalın." },
      { slug: 'hava-kotu-olursa-tur-iptal-mi', title: "Hava kötü olursa tur iptal mi?", answer: "Deniz ve rüzgâr şartları güvenliği doğrudan etkiler; kaptan güvenli olmayan koşulda rotayı veya turu güncelleyebilir. Son durakta Kış Limanı ile Mağaralar arasında seçim yapılır: Kış Limanı sakin, korunaklı bir yüzme molası sunar; lodoslu havalarda rotamızı Mağaralar gibi dalgalardan daha korunaklı bir noktaya çevirmek mümkün olabilir. Zorunlu iptal veya iade süreçleri işletme politikası ve biletinize göre yürütülür; tur öncesi hava ve mesajlarınızı takip edin." },
      { slug: 'tek-basima-katilabilir-miyim', title: "Tek başıma katılabilir miyim?", answer: "Evet — müsaitlik olduğu sürece online bilet ile tek başınıza katılabilirsiniz. Grup ortamında rahat hissetmek için üst güverte ve serbest alanları kullanabilirsiniz; Eco, Premium ve First Class bölgelerinden size uygun olanı seçebilirsiniz. Çeşme tekne turu hem çiftler hem solo gezginler için uygundur; özel isteğinizi rezervasyon notuna düşebilirsiniz." },
    ],
  },
  {
    slug: 'fiyatlandirma',
    title: "Fiyatlandırma",
    shortDescription: "Premium şezlong: oturan herkes tam ücret. Bebek ve 6 yaş altı ücretsiz; 6–10 yaş yarım (Eco/Premium genel). Tur sayfası; Yat kiralama.",
    iconName: 'credit-card',
    order: 30,
    isFeatured: true,
    articles: [
      { slug: 'tur-fiyatina-neler-dahil', title: "Tur fiyatına neler dahil?", answer: "Tam liste ilgilendiğiniz turun sayfasında yazar: aşağı kaydırıp «Dahil olanlar» ve hemen yanında «Dahil olmayanlar» bloklarını okuyun; bu maddeler her tur için güncellenir (örneğin tam gün turda öğle yemeği, yolcu sigortası, Wi‑Fi, Eco / Premium / First alanları gibi kalemler tur metninde açıkça listelenir). Rezervasyon sihirbazında da ödeme öncesi aynı ayrımı kontrol edebilirsiniz. Özet: fiyat = tur sayfasındaki dahil listesi + seçtiğiniz bilet sınıfı; şüphede önce tur sayfasını esas alın." },
      { slug: 'cocuk-indirimi-var-mi-yas-siniri-nedir', title: "Çocuk indirimi var mı? Yaş sınırı nedir?", answer: "Poseidon günlük turlarımızda Eco ve Premium biletlerde yaş tarifemiz şöyledir: 6 yaşından küçük çocuklar ücretsiz, 6–10 yaş arası çocuklar yarım ücret (yetişkin biletinin yarısı). Bebekler ücretsizdir. Rezervasyonda doğum tarihlerini doğru seçin; tutar ekranda otomatik hesaplanır. Premium sınıfta güverte şezlongu kişi başına ücretlendirilir; şezlong kullanan herkes tam ücretlidir — yani şezlongda oturacak her misafir, yaş indirimi veya yarım ücret kuralından bağımsız olarak tam (yetişkin) bilet fiyatı üzerinden hesaplanır. Şezlong kullanmayan çocuk ve bebekler için ise yukarıdaki ücretsiz / yarım ücret yaş kuralları geçerlidir. First Class yalnızca yetişkin misafirler içindir; yukarıdaki yaş tarifesi Eco ve Premium için geçerlidir (şezlong kuralı yalnızca Premium içindir). Tur sayfası ve ödeme özetiyle tutarınızı mutlaka teyit edin." },
      { slug: 'bebekler-icin-fiyat-var-mi', title: "Bebekler için fiyat var mı?", answer: "Eco ve yaş tarifesi açısından bebekler ücretsiz sayılır; rezervasyonda bebek girildiğinde ilgili satır 0 TL olur. Premium sınıfta ise güverte şezlongu kişi başına ücretlendirildiği için şezlong kullanan herkes — bebek veya çocuk dahil — tam ücretlidir; yani şezlongda oturacak bebek için de tam bilet fiyatı uygulanır. 6 yaşından küçük ücretsiz ve 6–10 yaş yarım ücret kuralları şezlong kullanmayan misafirler için geçerlidir. First Class’ta bebek ve çocuk satışı yoktur. Güvenlik ve can yeleği için ekibin uyarılarına uyun." },
      { slug: 'ozel-vip-tekne-kiralama-fiyatlari', title: "Özel/VIP tekne kiralama fiyatları?", answer: "Özel tekne arıyorsanız doğrudan sitemizdeki Yat kiralama sayfasına gidin: burada özel teknelerimizin tamamı listelenir; her karttan tekneye tıklayıp kapasite, fiyat ve güverte fotoğrafları gibi tüm detayları tek tek inceleyebilir, uygun olanı seçerek müsaitlik / talep sürecini başlatabilirsiniz. Günlük grup turlarıyla karıştırmamak için menüden Yat kiralama’yı seçin veya doğrudan /yat-kiralama adresine gidin. Ek sorularınız için iletişim kanallarımızdan yazabilirsiniz." },
    ],
  },
  {
    slug: 'iptal-degisiklik',
    title: "İptal ve İade Politikası",
    shortDescription: "24 saat kuralı, kapora iadesi, tarih değişimi, işletme kaynaklı iptal ve mücbir sebepler. Son güncelleme: 19 Mart 2026.",
    iconName: 'umbrella',
    order: 40,
    isFeatured: false,
    articles: [
      { slug: 'rezervasyonumu-iptal-edebilir-miyim', title: "Rezervasyonumu iptal edebilir miyim?", answer: "Evet. İptal ve değişiklik işlemlerinizi, tarafınıza gönderilen e-postadaki «Rezervasyonu Yönet» butonu üzerinden kolayca yapabilirsiniz. İptal ve değişiklik koşulları: Tur tarihinden 24 saat öncesine kadar yapılan iptallerde, ödenen kaporanın tamamı iade edilir. Tur saatine 24 saatten az süre kala yapılan iptallerde iade yapılmaz. Bu kurallar Poseidon Gezi Teknesi iptal ve iade politikasıyla uyumludur; güncel metin 19 Mart 2026 tarihi itibarıyla geçerlidir." },
      { slug: 'i-ptal-halinde-para-iadem-ne-zaman-gelir', title: "İptal halinde para iadem ne zaman gelir?", answer: "Hak kazandığınız iade onaylandığında tutar önce ödeme kuruluşunuza bildirilir; kartınıza veya hesabınıza yansıma süresi bankanıza göre birkaç saat ile birkaç iş günü arasında değişebilir. Ekstrede satır bazen «iade» olarak görünür. Sorun yaşarsanız rezervasyon referansınızla turkeycesme@hotmail.com veya +90 533 417 36 56 üzerinden yazabilirsiniz." },
      { slug: 'tarihimi-degistirebilir-miyim', title: "Tarihimi değiştirebilir miyim?", answer: "Rezervasyon değişiklikleri (tarih değişimi) müsaitlik durumuna bağlıdır; uygunluğu «Rezervasyonu Yönet» üzerinden veya iletişim kanallarımızdan kontrol edebilirsiniz. Aynı sınıf için farklı günlerde oluşabilecek fiyat farkı müşteri tarafından karşılanır. Alternatif tarih bulunamazsa iptal koşulları (24 saat kuralı) geçerlidir." },
      { slug: 'hava-kotu-olursa-ne-olur', title: "Hava kötü olursa ne olur?", answer: "Tur bazen tarafımızdan iptal edilebilir; başlıca sebepler elverişsiz hava koşulları, personel hastalığı veya acil durumlar, operasyonel veya güvenlik gereklilikleri, yetersiz katılımcı sayısı ve mücbir sebepler (doğal afetler, siyasi gelişmeler vb.) olabilir. Bu gibi nadir durumlarda size en kısa sürede bilgi verilir ve şu seçeneklerden biri sunulur: alternatif bir tarihe rezervasyon veya tercihinize bağlı olarak tam ücret iadesi. Günlük tekne turunda güvenlik önceliklidir; mesajlarınızı ve iletişimimizi takip edin." },
      { slug: 'hastalandim-ne-yapmaliyim', title: "Hastalandım, ne yapmalıyım?", answer: "Katılamayacağınızı önceden biliyorsanız en kısa sürede e-postadaki «Rezervasyonu Yönet» üzerinden iptal veya tarih değişikliği deneyin; tur saatine kalan süreye göre 24 saat kuralı geçerlidir. Destek için turkeycesme@hotmail.com, telefon +90 533 417 36 56 veya adresimiz: 16 Eylül Mahallesi, 3053 Sokak, Hürriyet Caddesi, Çeşme / İzmir — Poseidon Gezi Teknesi. Rezervasyon numaranızı iletin." },
      { slug: 'gec-kalirsam-ne-olur', title: "Geç kalırsam ne olur?", answer: "Kalkış saatine uymak zorunludur; geç kalırsanız tekne ayrılmış olabilir ve bu durumda iade bekleyemezsiniz. Özellikle Çeşme’de iskele çevresinde park yeri bulmak zor olabiliyor; aracınızı bırakmak size zaman kazandırmayabilir, o yüzden kalkış saatinden en az yarım saat önce teknede olmanızı rica ediyoruz. Bir aksilik olursa tur günü +90 533 417 36 56 numarasından bize ulaşın." },
    ],
  },
  {
    slug: 'pratik-bilgiler',
    title: "Pratik Bilgiler ve Hazırlık",
    shortDescription: "Çeşme’nin en büyük teknesi: ferah güverte, gölgede veya güneşte oturma, sakin seyir. Çanta, kıyafet; deniz tutması için yanınızdayız.",
    iconName: 'life-buoy',
    order: 50,
    isFeatured: false,
    articles: [
      { slug: 'yanimda-ne-getirmeliyim', title: "Yanımda ne getirmeliyim?", answer: "Teknemiz Çeşme’deki en büyük tekne olduğu için güverte ferah; havlunuzu, mayo ve küçük çantanızı rahatça taşıyabilirsiniz. Yanınıza güneş kremi, şapka, havlu, mayo veya şort, deniz ayakkabısı, şarjlı telefon ve kimlik ile dijital biletinizi alın. Bir şişe su ve rüzgârda işinize yarayacak ince bir üst iyi fikir. Değerlileri suya düşmeyecek şekilde taşıyın; fazla eşya çekmeyin, gün boyu rahat edin." },
      { slug: 'ne-giymeliyim', title: "Ne giymeliyim?", answer: "Mayo veya çabuk kuruyan kıyafet, üzerine tişört, güneş gözlüğü yeterli. Kayalıkta kaydırmayan bir deniz ayakkabısı işinizi kolaylaştırır. Akşam üşümesine karşı ince bir şey alın; beyaz gömlek yerine lekeye dayanıklı renkler daha pratik. Güneş uzun süre üzerinde kalacağı için şık olmak zorunda değilsiniz — rahat olun, denize göre giyinin." },
      { slug: 'yuzme-bilmiyorum-katilabilir-miyim', title: "Yüzme bilmiyorum, katılabilir miyim?", answer: "Tabii. Yüzme molaları zorunlu değil; yüzme bilmiyorsanız can yeleğiyle sığda kalabilir, molayı tekneden izleyebilir veya güverteye uzanıp manzarayı sürebilirsiniz. Kaptanın uyarılarına kulak verin. Günün önemli kısmı yüzmek değil; su, gökyüzü ve keyif — kendinizi zorlamayın." },
      { slug: 'engelliler-icin-uygun-mu', title: "Engelliler için uygun mu?", answer: "Tekne ve iskele herkes için aynı kolaylıkta olmayabiliyor; tekerlekli sandalye veya merdiven çıkma gibi bir ihtiyacınız varsa tur öncesi bize yazın, ortamı birlikte netleştirelim. Yanıtımız bazen “bu tarihte daha uygun olur” şeklinde olabilir; dürüst konuşmak herkesin çıkarına." },
      { slug: 'evcil-hayvan-getirebilir-miyim', title: "Evcil hayvan getirebilir miyim?", answer: "Sigorta ve güverte güvenliği nedeniyle evcil hayvan genelde önceden konuşulmadan getirilemiyor. Küçük bir dostunuz varsa tarih ve turu yazarak sorun; uygunsa nasıl olacağını birlikte netleştiririz." },
      { slug: 'deniz-tutar-mi-ne-yapmaliyim', title: "Deniz tutar mı? Ne yapmalıyım?", answer: "Poseidon olarak Çeşme’de en büyük tekneyi kullanıyoruz; geniş güverte var, isterseniz güneşte, isterseniz gölgeli veya daha kapalı hissettiren alanda oturabilirsiniz — dar bir tekneye göre gün boyu çok daha rahat. Gövdesi geniş olduğu için dalgalı havada bile Çeşme’deki pek çok tekneye kıyasla sallanması en az olanlar arasında; yine de deniz her vücuda farklı gelir, ara sıra hafif bir his normal olabilir. Deniz tutması yaşayan misafirlerimize bulantı hapı veriyoruz — çekinmeden ekibe veya kaptana söylemeniz yeterli. Temiz hava, su içmek ve ufka bakmak da işe yarar; kendinizi iyi hissetmiyorsanız mutlaka haber verin." },
    ],
  },
  {
    slug: 'ulasim-lokasyon',
    title: "Ulaşım ve Lokasyon",
    shortDescription: "İzmir servis noktaları, otelden alma ek ücretli, park sıkıntısı; check-in için tekneye en az 30 dk önce.",
    iconName: 'map-pin',
    order: 60,
    isFeatured: false,
    articles: [
      { slug: 'cesmeye-nasil-gelirim', title: "Çeşme'ye nasıl gelirim?", answer: "İzmir’den özel araç veya otobüsle yaklaşık 45–90 dakika (trafiğe göre değişir) içinde Çeşme’ye ulaşabilirsiniz; yazın erken yola çıkmak işinizi kolaylaştırır. İzmir’den bizim servisimizle gelmek istiyorsanız bunun için ayrı bir tur paketimiz var: ayrıntılar ve güncel saatler İzmir çıkışlı tam gün Çeşme tekne turu sayfamızda yazar; rezervasyon adımlarında toplanma noktanızı seçebilirsiniz. Kendi aracınızla geliyorsanız biletinizdeki buluşma notu ve harita linki size yol gösterir. Check-in ve güverte hazırlığı için buluşma noktasında, tur çıkış saatinden en az 30 dakika önce olmanızı rica ediyoruz." },
      { slug: 'i-zmirden-transfer-var-mi', title: "İzmir'den transfer var mı?", answer: "Evet — İzmir çıkışlı tam gün Çeşme tekne turu satın aldığınızda, İzmir içindeki servis noktalarımızdan birinde sabah biniş yaparsınız; güncel liste, saatler ve ücret her zaman bu turun sayfasında ve rezervasyon ekranında yer alır (yardım metnindeki isimler güncellenmezse tur sayfası esas alınır). Örnek toplanma noktalarımız: Atatürk Anıtı (Karşıyaka) — Tuna Caddesi; Ege Üniversitesi Hastanesi Bornova Metro çıkışı — Kazımdirik Mah.; İstinye Park önü — Fahrettin Altay, Konak; Garanti BBVA Alsancak Liman Şubesi — Alsancak; Halkapınar Metro İstasyonu — Mersinli; Kamil Koç Ofisi Basmane — Basmane; Maviş Büfe Üçyol — Kılıç Reis Mah.; PTT Merkez Şubesi (Konak) Akdeniz — Akdeniz Cad.; Şirinyer İzban — Hürriyet Cad., Buca/Şirinyer; YKM İzmir (Konak) — Anafartalar Cad. Hangi gün hangi güzergâhın kullanıldığını tur sayfasından ve onay mesajınızdan teyit edin." },
      { slug: 'otoparkiniz-var-mi', title: "Otoparkınız var mı?", answer: "Tekneye ait özel bir otoparkımız yok. Çeşme iskele çevresinde park yeri bulmak çoğu zaman sıkıntıdır — özellikle yaz aylarında ücretli veya ücretsiz alanlar dolabilir, araç bırakmak ekstra zamanınızı alır; bu yüzden park için daha erken yola çıkın. Mümkünse toplu taşıma veya İzmir çıkışlı tur + servis noktası kombinasyonunu düşünün. Tekneye çıkış ve check-in için buluşma saatinden en az 30 dakika önce hazır olun; böylece hem park hem kontrol sürecine zaman ayırırsınız." },
      { slug: 'otelimden-alinma-var-mi', title: "Otelimden alınma var mı?", answer: "Çeşme’deki otellerden otel alımı / otelde bırakma teklif edilebilir; bu hizmet paket fiyatına dahil değildir, ekstra ücret karşılığındadır. Ücret, güzergâh ve müsaitliğe göre değişir — net rakam için tarih, otel adı, kişi sayısı ve tur seçiminizi WhatsApp veya telefon (+90 533 417 36 56) ile yazın; rezervasyon sırasında talebinizi not düşebilirsiniz." },
    ],
  },
]
