# SEO kurulumu ve bakım

Sitenin teknik SEO'su kodda hazır. Bu belgede yalnızca **sizin yapmanız gereken** ayarlar ve
Sanity'de doldurulması gereken içerikler var.

## Kodda neler var (özet)

| Alan | Nerede |
| --- | --- |
| Her sayfaya özgün başlık + açıklama, 4 dilde | `generateMetadata` → `lib/seo/buildPageMetadata.ts` |
| Kısa başlıklara dil bazlı marka soneki ("İletişim \| Çeşme Tekne Turu") | `lib/seo/brand.ts` |
| hreflang (tr/en/de/ru + x-default) ve canonical | `lib/seo/alternateLanguages.ts` |
| Çevirisi olmayan yasal metinler → canonical Türkçe sayfa | `app/(site)/[locale]/yasal/[slug]/page.tsx` |
| Sitemap (hreflang + görsel bilgisiyle, her istekte Sanity'den) | `app/sitemap.ts` |
| robots.txt (yapay zekâ botları açık, özel sayfalar kapalı) | `app/robots.ts` |
| llms.txt (yapay zekâ asistanları için canlı site özeti) | `app/llms.txt/route.ts` |
| Markalı paylaşım görseli (og:image), görseli olmayan her sayfa için | `app/api/og/route.ts`, `lib/og/ogImage.tsx` |
| JSON-LD: TravelAgency, WebSite, Organization, Product, FAQPage, BreadcrumbList, ItemList, CollectionPage, AboutPage, ContactPage, Menu, BlogPosting, TouristAttraction | `lib/seo/*`, `components/seo/*` |
| Sanity değişince anında yenileme + IndexNow bildirimi | `app/api/revalidate/route.ts` |
| AVIF/WebP: `next/image` + Sanity `auto=format` | `next.config.ts`, sayfalardaki `urlFor(...).auto('format')` |

Yapılandırılmış veriyi kontrol etmek için: <https://search.google.com/test/rich-results> ve
<https://validator.schema.org>. Sitede ön izleme sayfası: `/seo/schema`.

## 1. Vercel ortam değişkenleri

Vercel → Project → Settings → Environment Variables (Production):

| Değişken | Değer |
| --- | --- |
| `SANITY_REVALIDATE_SECRET` | Kendi ürettiğiniz uzun rastgele metin (Sanity webhook'unda da aynısı) |
| `INDEXNOW_KEY` | 32 karakterlik harf/rakam anahtar (ör. `openssl rand -hex 16`) |

Kaydettikten sonra yeniden deploy edin. Kontrol: `https://cesmetekneturu.net/indexnow.txt`
anahtarı göstermeli.

## 2. Sanity webhook (içerik değişince site anında güncellenir)

sanity.io/manage → proje → **API** → **Webhooks** → **Create webhook**

- **URL:** `https://cesmetekneturu.net/api/revalidate`
- **Dataset:** `production`
- **Trigger on:** Create, Update, Delete
- **Filter:** boş bırakın
- **Projection:**
  ```
  {_type, "slug": slug.current, "en": translations.en.slug.current, "de": translations.de.slug.current, "ru": translations.ru.slug.current}
  ```
- **HTTP method:** POST
- **Secret:** `SANITY_REVALIDATE_SECRET` ile aynı değer
- **Drafts:** kapalı

Sanity'de bir turu yayımladıktan sonra webhook'un "Attempts" listesinde `200` görmelisiniz.

## 3. Arama motorları

1. **Google Search Console** (<https://search.google.com/search-console>): `cesmetekneturu.net`
   alan adı mülkünü ekleyin (DNS TXT doğrulaması). **Sitemaps** → `sitemap.xml` gönderin.
2. **Bing Webmaster Tools** (<https://www.bing.com/webmasters>): "Import from Google Search
   Console" ile tek tıkla ekleyin. Bing; ChatGPT Search ve Copilot yanıtlarının da kaynağıdır.
3. **Yandex Webmaster** (<https://webmaster.yandex.com>): Rusça ziyaretçiler için. Siteyi
   ekleyin, `sitemap.xml` gönderin.
4. **Google Business Profile**: adres ve telefonun sitedekiyle (footer, iletişim) birebir aynı
   olduğundan emin olun.

## 4. Sanity'de doldurulması gereken içerik

Kod, eksik çevirileri anlık makine çevirisiyle tamamlıyor ama elle girilmiş metin her zaman
daha iyi sıralanır.

- **Yasal sayfalar** (Gizlilik, Çerez, Mesafeli Satış, İptal/İade, Şartlar, Güvenlik): EN/DE
  çevirisi yok. Çeviri girilene kadar bu dillerdeki sürümler Türkçe sayfayı kanonik gösterir
  ve sitemap'te yer almaz.
- **Sık Sorulanlar sayfası — acil**: kapak açıklaması başka bir şablondan kalmış ve
  İngilizce: "…enjoy your **Athens Day Cruise** experience…". Atina'dan bahsediyor; Türkçe ve
  doğru metinle değiştirin. Sayfada şu an yalnızca 1 soru var; yardım merkezindeki
  sorulardan en önemlileri buraya da eklenebilir (FAQPage zengin sonucu bunlardan üretilir).
- **Koylar sayfası**: DE/RU başlık ve açıklama yok (şu an makine çevirisi).
- **İletişim sayfası**: SEO başlığı/açıklaması boşsa koddaki genel metin kullanılır.
- **Her tur, koy ve blog yazısı için**: `SEO → Meta açıklama` (140–160 karakter) ve görsellerde
  **Alt metin** (görselde ne olduğunu anlatan kısa cümle, ör. "Eşek Adası koyunda demirli
  Poseidon teknesi").

## 5. Makine çevirisi (önemli)

Çevirisi girilmemiş metinler anlık çevriliyor. `DEEPL_API_KEY` tanımlı değilse ücretsiz
MyMemory servisi kullanılıyor; onun günlük kotası dolunca EN/DE/RU sayfalar Türkçe metinle
(yani kopya içerikle) gösterilir. Vercel'de `DEEPL_API_KEY` tanımlı olduğundan emin olun
(DeepL API Free: ayda 500.000 karakter ücretsiz).

## 6. Ölçüm

- Search Console → **Sayfa deneyimi / Core Web Vitals** ve **Kapsam** raporları haftalık.
- Rich Results Test ile tur sayfası (Product + FAQ + Breadcrumb) ve ana sayfa (TravelAgency).
- Paylaşım önizlemesi: <https://www.opengraph.xyz> veya WhatsApp'ta link gönderip kontrol.
