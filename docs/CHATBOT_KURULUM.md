# Sohbet Asistanı (Claude API) — Kurulum

Sitenin sağ altında, WhatsApp butonunun hemen üstünde "Soru sor" butonu çıkar. Asistan turlar, fiyatlar, buluşma noktası, dahil olan hizmetler, yat kiralama ve rezervasyon süreci hakkındaki soruları yanıtlar; belirli bir gün sorulursa canlı müsaitliğe bakar. TR / EN / DE / RU (ve ziyaretçinin yazdığı diğer diller).

Anahtar girilene kadar buton görünmez; site normal çalışır.

## Nasıl çalışıyor?

| Parça | Dosya |
|---|---|
| Sohbet penceresi | `components/chat/ChatWidget.tsx` (mobilde tam ekran) |
| API | `app/api/chat/route.ts` — yanıt akışlı (yazılırken görünür) |
| Bilgi kaynağı | `lib/chatbot/knowledge.ts` — Sanity'deki turlar, yatlar, SSS, iletişim |
| Talimatlar | `lib/chatbot/prompt.ts` |
| Müsaitlik aracı | `lib/chatbot/availabilityTool.ts` — rezervasyon takvimiyle aynı hesap |

- **Bilgi kaynağı Sanity'den gelir.** Studio'da bir turu, fiyatı, SSS'yi değiştirdiğinizde asistan da güncellenir (Sanity webhook'u varsa hemen, yoksa en geç 10 dakikada). Ayrıca bir şey girmenize gerek yok.
- **Uydurmaz:** yalnızca bu bilgilerle yanıt verir; bilmediği bir şeyde WhatsApp'a yönlendirir.
- **Rezervasyon yapmaz, ödeme almaz;** tur sayfasına yönlendirir. Ziyaretçiden kişisel bilgi istemez.
- **Sohbetler sunucuda saklanmaz.** Yalnızca ziyaretçinin tarayıcı sekmesinde tutulur. Mesajlar yanıt üretmek için Anthropic'e (ABD) gönderilir — Gizlilik Politikası'na bunu eklemeniz önerilir (aşağıda).

## Belge yükleme (SSS, kurallar, ek bilgiler)

Turlar, yatlar ve SSS sayfası otomatik okunur. Bunların dışındaki bilgileri (iptal/iade kuralları, transfer, evcil hayvan, erişilebilirlik, kampanyalar…) **Studio → Sohbet Asistanı — bilgi belgeleri** bölümünden verin:

- **Bilgi belgeleri:** PDF, Word (.docx), .txt veya .md yükleyin, her birine başlık verin, **Yayınla**. "Asistan kullansın" kutusuyla belgeyi silmeden kapatabilirsiniz.
- **Ek bilgiler (metin):** Dosya yerine doğrudan yazmak da mümkün.
- Asistan belgeleri SSS ve kurallar için kullanır. Fiyat, saat ve kontenjanda tur bilgisi esastır; belge bunlarla çelişirse tur bilgisini söyler ve ekibe yönlendirir.
- **Okundu mu?** Admin paneli → **Sohbet Asistanı** sayfası her belgenin okunup okunmadığını ve okunan metnin başını gösterir. Değişiklik birkaç dakika içinde yansır (Sanity webhook'u varsa hemen).
- **Sınırlar:** Taranmış/fotoğraf PDF'lerdeki yazı okunamaz (durum sayfasında "Okunamadı" çıkar — metni Word'e yazıp yükleyin). Dosya başına 15 MB; belge başına ilk 120.000 karakter (~40 sayfa) kullanılır, fazlası durum sayfasında "kısaltıldı" diye görünür. Belgeler her mesajda modele gider: kısa tutmak hem cevap kalitesini hem maliyeti iyileştirir.
- Studio'yu `npm run studio` ile localde (localhost:3333) açıyorsanız bölüm sayfayı yenileyince görünür. *.sanity.studio adresinde yayınlanan bir Studio kullanıyorsanız önce `npx sanity login`, sonra `npx sanity deploy`.

## 1. API anahtarı

1. **console.anthropic.com** → hesap açın → **Billing** bölümünden ödeme yöntemi ekleyin.
2. **API Keys** → *Create Key* → anahtarı kopyalayın.
3. İsteğe bağlı ama önerilir: **Limits** bölümünden aylık harcama limiti koyun.

## 2. Vercel ortam değişkenleri

| Değişken | Değer |
|---|---|
| `ANTHROPIC_API_KEY` | Adım 1'deki anahtar (zorunlu) |
| `CHATBOT_MODEL` | İsteğe bağlı. Varsayılan `claude-haiku-5-5` (en ekonomik). Daha güçlü: `claude-sonnet-5-5`, `claude-opus-5-5` |
| `CHATBOT_EFFORT` | İsteğe bağlı. `low` (varsayılan, hızlı ve ekonomik), `medium`, `high` |
| `CHATBOT_DAILY_LIMIT` | İsteğe bağlı. Site geneli günlük mesaj tavanı, varsayılan `500` (aşağıda) |
| `CHATBOT_DISABLED` | `1` yaparsanız asistan kapanır (anahtar silinmeden) |

Değişkenlerden sonra yeniden deploy edin.

## Maliyet

- Her mesajda turların tüm bilgisi (~29 bin token) modele gider; maliyeti asıl belirleyen bu. Bilgi önbelleğe alınır ama önbellek 5 dakika sürer: sitede 5 dakika kimse yazmazsa sonraki ilk mesaj bilgiyi yeniden önbelleğe yazar.
- Ölçülen mesaj başı maliyet (2026-11-11, aynı sorularla):

| Model | Peş peşe mesaj | 5 dk boşluktan sonraki ilk mesaj | 1000 mesaj (kabaca) |
|---|---|---|---|
| **Claude Haiku 5.5** (varsayılan) | ~0,001 $ | ~0,004 $ | ~1–4 $ |
| Claude Sonnet 5.5 | ~0,01 $ | ~0,08 $ | ~10–80 $ |
| Claude Opus 5.5 | ~0,013 $ | ~0,15 $ | ~13–150 $ |

- Haiku'yla soru-cevap kalitesi testlerde Opus'a yakındı (fiyat, program, müsaitlik, İngilizce). Cevaplardan memnun kalmazsanız `CHATBOT_MODEL=claude-sonnet-5-5` yapın.
- Bilgi metni büyüdükçe (çok uzun belge yüklemek gibi) her mesajın maliyeti de artar; admin → Sohbet Asistanı sayfasında bilgi kaynağının token sayısı görünür.
- **Hazır soruların cevabı saklanır:** pencerede tıklanan "Hangi turlar var?", "Tur fiyatları ne kadar?", "Buluşma noktası nerede?" (4 dilde) sohbetin ilk mesajıysa cevap bir kez üretilir, sonraki tıklamalar modele gitmez (ücretsiz, anında). Studio'da içerik değişince ya da 6 saatte bir yenilenir. "Yarın yer var mı?" tarihe bağlı olduğu için her seferinde canlı sorulur.
- **Günlük tavan:** modele giden mesaj sayısı günde `CHATBOT_DAILY_LIMIT`'i (varsayılan 500) aşarsa asistan o gün ziyaretçileri WhatsApp'a yönlendirir — bot saldırısında fatura sürprizini önler. Bugünkü sayı admin → Sohbet Asistanı sayfasında. Upstash Redis tanımlıysa sayaç tüm sunucularda ortaktır; değilse her sunucu örneği kendi sayacını tutar (yaklaşık sınır).
- **Kesin üst sınır için** Anthropic Console → Limits bölümünden aylık harcama limiti koyun.
- Gerçek mesaj başı maliyeti görmek için Vercel loglarında `[chat] usage` satırlarına bakın (giriş, önbellekten okunan, çıkış token sayıları) ya da Anthropic Console → **Usage**.
- **Kötüye kullanım sınırı:** her ziyaretçi saatte en fazla 40 mesaj gönderebilir (`lib/rateLimit.ts` → `chat`). Upstash tanımlıysa tüm sunucularda ortak sayılır.
- Sohbetin yalnızca son 16 mesajı gönderilir; yanıt başına çıktı tavanı 6.000 token.

## Gizlilik Politikası notu

Sohbet mesajları yanıt üretmek için Anthropic PBC'ye (ABD) iletilir; site mesajları saklamaz. Bu yurt dışına veri aktarımını Gizlilik Politikası / KVKK aydınlatma metnine eklemeniz önerilir. Pencerede ziyaretçiye "kişisel bilgi paylaşmayın" uyarısı zaten var.

## Test

1. Anahtarı girip deploy edin; sağ altta "Soru sor" butonu çıkmalı.
2. "Hangi turlar var?", "Günbatımı turu ne kadar?", "Yarın için yer var mı?" deneyin.
3. Bir İngilizce soru sorun; İngilizce yanıt vermeli.
4. Bilmediği bir şey sorun (örn. "Teknede köpek kabul ediyor musunuz?"); bilgide yoksa WhatsApp'a yönlendirmeli.
